
/**
 * @author [Umang Kothari.]
 * @create date 2020-12-17 16:51:34
 * @modify date 2020-12-17 16:51:34
 * @desc [Refused Care Report]
 */

//Libs import
import { Component, OnInit, ViewChild, TemplateRef, ElementRef } from '@angular/core';
// import { forEach } from '@angular/router/src/utils/collection';
import { MatTableDataSource, MatSort, PageEvent } from '@angular/material';
import { Router } from "@angular/router";
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { Store } from "@ngrx/store";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ExportAsService } from 'ngx-export-as';
import * as _ from "underscore";
import * as moment from "moment-timezone";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from "rxjs/Rx";

//Services
import { ApiService } from "src/app/shared/services/api/api.service";
import { CommonService } from "src/app/shared/services/common.service";
import { ExcelService } from "src/app/shared/services/excel.service";
import { insertRefFn } from './../../../../shared/store/shiftReport/action';

import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

// import * as moment from 'moment';

interface shiftRepState { _shiftRep: object; }

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  public btnAction: Function;
  exportdata;
  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  platform;
  user;
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  loaderexport = false;
  loadervalue = 0; loaderbuffer = 2;
  displayedColumns = [];
  exportContentVal = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  maxD = moment();
  doc: any

  columnNames = [
    {
      id: 'resident_name',
      value: 'Resident Name',
      sort: true
    },
    {
      id: 'care',
      value: 'Care',
      sort: true
    },
    {
      id: 'user',
      value: 'Performer',
      sort: true
    },
    {
      id: 'date',
      value: 'Date',
      sort: true
    }];

  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0
  };

  private subscription: Subscription;
  timezone: any;
  utc_offset: any;
  data: any;
  shiftNo: Number;
  selectShift: String;
  resultCount: Number;
  fallResult: Object = {};
  userName: String;
  start_date: number;
  end_date: number;
  residentList: any;
  resultcount: Boolean;
  refusedData: any

  constructor(
    private apiService: ApiService,
    public commonService: CommonService,
    private router: Router,
    private excelService: ExcelService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private _shiftRep: Store<shiftRepState>
  ) { }

  @ViewChild('refusedcare', {static: true}) refusedcare: TemplateRef<any>;
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  @ViewChild('selectedResident', {static: true}) private selectedResident: MatOption;
  @ViewChild('dateRangePicker', {static: true}) dateRangePicker;

  alwaysShowCalendars: boolean;
  refusedCareForm: FormGroup;
  floorlist;
  sTime;
  eTime;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
  range: Range = { fromDate: new Date(), toDate: new Date() };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  dialogRefs;
  shiftArr;
  userlist: any;
  residentslist = [];
  residentOrg;
  residentFac;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
  newDate1 = moment();
  newDate2 = moment();
  reportOrg;
  reportFac;
  isresident_status;
  isachive_status;
  allresident;
  usrSearch = '';
  shiSearch = '';
  usSearch = '';
  rSearch = '';

  refusedcareData: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };

  ngOnInit() {

    let today = new Date();
    let lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    var fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    var fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    var toMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: "Done",
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    this.subscription = this.commonService.contentdata.subscribe(
      (contentVal: any) => {
        console.log(contentVal);
        if (contentVal.org && contentVal.fac) {
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
        }
      });

    this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.getServerData(this.pagiPayload);

  }

  async loadReport() {
    this.commonService.setLoader(true);

    const action = { type: "POST", target: "reports/refusedCare" };
    const payload = this.data;

    let result = await this.apiService.apiFn(action, payload);
    this.residentList = result["data"]["reports"];
    if (this.shiftNo === 0) {
      this.selectShift = "All Shifts";
    } else if (this.shiftNo === 1) {
      this.selectShift = "1st Shift (6:00am - 2:00pm)";
    } else if (this.shiftNo === 2) {
      this.selectShift = "2nd Shift (2:00pm - 10:00pm)";
    } else {
      this.selectShift = "3rd Shift (10:00pm - 6:00am)";
    }
    if (this.residentList && this.residentList.length > 0) {
      this.resultcount = true;
    } else {
      this.resultcount = false;
    }
    result = result['data']['reports'].map(item => {
      return {
        ...item,
        resident_name: item._id.residentData.last_name + ", " + item._id.residentData.first_name,
        care: item._id.careData.name,
        user: item._id.userData.last_name + ", " + item._id.userData.first_name,
        date: this.convertDateToFacilityTimeZone(item._id.ts_date_created),//moment(item.date).format('MMMM Do YYYY, HH:mm'),
        //activity_from: item.activity_from,
        //user: item.user_id ? item.user_id.last_name + ', ' + item.user_id.first_name : '--'
      };
    });
    this.refusedData = result
    this.createTable(result);
    this.commonService.setLoader(false);
  }

  public async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    //this.getActivityFunction();
    this.loadReport();
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    console.log(tableArr);
    this.dataSource = new MatTableDataSource(tableArr);
  }

  convertDateToFacilityTimeZone(start) {
    let utcDate = moment.utc(start)
    let tzdate = utcDate.clone().tz(this.timezone)
    return tzdate.format('MMMM Do YYYY, HH:mm A')
  }

  async downloadAll() {
    let startDate = this.getDateFromTimezone(this.start_date);
    let endDate = this.getDateFromTimezone(this.end_date);
    let RefusedCareReport: any = await this.prepareForExportAll(startDate, endDate);
  }

  columnNames_1 = [
    {
      id: 'Resident_Name',
      value: 'Resident Name',
      title: 'Resident Name',
      name: 'Resident Name',
      dataKey: 'Resident_Name'
    },
    {
      id: 'Care',
      value: 'Care',
      title: 'Care',
      name: 'Care',
      dataKey: 'Care'
    },
    {
      id: 'Performer',
      value: 'Performer',
      title: 'Performer',
      name: 'Performer',
      dataKey: 'Performer'
    },
    {
      id: 'Date',
      value: 'Date',
      title: 'Date',
      name: 'Date',
      dataKey: 'Date'
    },
  ];
  async prepareForExportAll(startDate, endDate) {

    let refusedReport = [];

    this.doc = undefined;
    this.doc = new jsPDF('p','mm','letter');
    this.doc.setFont("helvetica","bold");
    this.doc.setFontSize(16);
    this.doc.text('Refused Care Report',19.05,19.05);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.userName}`, 20, 30);
    this.doc.text(`${moment(startDate).format('L')}-${moment(endDate).format('L')}`, 20, 34);
    this.doc.text(`${this.selectShift}`, 20, 38);



    if (this.refusedData) {
      this.refusedData.forEach(e => {
        let dataRow = {
          "Resident_Name": e.resident_name,
          "Care": e.care,
          "Performer": e.user,
          "Date": e.date,
        }
        refusedReport.push(dataRow)
      })
    }

    await this.doc.autoTable(this.columnNames_1, (refusedReport), {
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20
      },
      styles: {
        overflow: 'linebreak',
        lineWidth: 0.5,
        valign: 'middle'
      },
      theme: "plain",
      columnStyles: {
        'Notes': {
          columnWidth: 120
        }
      },
      drawRow: (row, data) => {
        if (row.index === 0 && row.raw == 'No visits tracked') {
          this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
          this.doc.autoTableText(row.raw, data.settings.margin.left + data.table.width / 2, row.y + row.height / 2, {
            halign: 'center',
            valign: 'middle'
          });
          return false;
        }
      }
    });

    this.doc.save('Refused Care Report');
    this.commonService.setLoader(false);

  }

  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }

  openrefusedcare() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.refusedcare, dialogConfig);

    this.refusedCareForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.refusedcareData.organization = contentVal.org;
        this.refusedcareData.facility = contentVal.fac;

        const action = {
          type: 'GET',
          target: 'users/get_users_org_fac'
        };
        const payload = {
          organization: [this.refusedcareData.organization],
          facility: [this.refusedcareData.facility]
        };

        const result = await this.apiService.apiFn(action, payload);
        this.userlist = await result['data'].map(function (obj) {
          const robj = {};
          robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
          robj['_id'] = obj._id;
          return robj;
        });

        this.userlist.sort(function (a, b) {
          const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
          if (nameA < nameB) { // sort string ascending
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0; // default return value (no sorting)
        });
        this.refusedCareForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
        for (let i = 0; i < this.refusedcareData.user.length; i++) {
          if (this.refusedcareData.user[i] === 0) {
            this.refusedcareData.user.splice(i, 1);
          }
        }

        this.getAllresidents('refused');
        this.commonService.setLoader(false);
      }
    });
  }

  async getAllresidents(reportType) {

    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    if (reportType === 'refused') {
      this.residentOrg = this.refusedcareData.organization;
      this.residentFac = this.refusedcareData.facility;
    }

    const payload = {
      'organization': [this.residentOrg],
      'facility': [this.residentFac]
    };

    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      // tslint:disable-next-line: max-line-length
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${(obj['room'] && obj['room']['room']) ? obj['room']['room'] : ''}`

      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    if (reportType === 'refused') {
      this.refusedCareForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
    }
  }

  selectAllresidents(CheckRep) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      if (CheckRep === 'refused') {
        this.refusedCareForm.controls.resident
          .patchValue([...this.residentslist.map(item => item.key), 0]);
        for (let i = 0; i < this.refusedcareData.resident.length; i++) {
          if (this.refusedcareData.resident[i] === 0) {
            this.refusedcareData.resident.splice(i, 1);
          }
        }
      }
    } else {
      if (CheckRep === 'refused') {
        this.refusedCareForm.controls.resident.patchValue([]);
      }
    }
  }

  selectResident(all, id, residentCheck) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
    if (residentCheck === 'refused') {
      if (this.refusedCareForm.controls.resident.value.length === this.residentslist.length) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.refusedcareData.resident.length; i++) {
        if (this.refusedcareData.resident[i] === 0) {
          this.refusedcareData.resident.splice(i, 1);
        }
      }
    }

  }

  updateRange(range: Range) {
    var today_st = moment();
    var today_ed = moment();
    var today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    var today_end = today_ed.set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
    if (range['startDate'] && range['startDate']['_d']) {
      // console.log('---d exist  startdate')
      range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      this.start_date = range['startDate']['_d'].getTime();
    } else if (range.fromDate) {
      //This condition for new Date Picker
      range['fromDate'] = moment(range['fromDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.start_date = (range.fromDate).getTime();
    } else {
      //  console.log('---d not exist  startdate')
      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      // console.log('---d exist  endate')
      range['endDate'] = range['endDate'].set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
      this.end_date = range['endDate']['_d'].getTime();
    } else if (range.toDate) {
      range['toDate'] = moment(range['toDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.end_date = (range.toDate).getTime()
    } else {
      // console.log('---d not exist  endate')
      this.end_date = today_end['_d'].getTime();
    }
    console.log('range in local timezone', this.start_date, this.end_date)
    //console.log('range in facility timezone', moment(moment(this.start_date)).tz(this.timezone, true).valueOf(), moment(moment(this.end_date)).tz(this.timezone, true).valueOf())

  }

  async setupPresets() {

    let backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    }

    let startOfMonth = (month, year) => {
      return new Date(year, month, 1);
    }

    let endOfMonth = (month, year) => {
      return new Date(year, month + 1, 0);
    }

    let today = new Date();
    let yesterday = backDate(1);
    let minus7 = backDate(7)
    let minus30 = backDate(30);
    let monthFirstDate = startOfMonth(today.getMonth(), today.getFullYear());
    let monthEndDate = endOfMonth(today.getMonth(), today.getFullYear());
    let lastMonthFirstDate = startOfMonth(today.getMonth() - 1, today.getFullYear());
    let LastMonthEndDate = endOfMonth(today.getMonth() - 1, today.getFullYear());

    this.presets = [
      { presetLabel: "Today", range: { fromDate: today, toDate: today } },
      { presetLabel: "Yesterday", range: { fromDate: yesterday, toDate: today } },
      { presetLabel: "Last 7 Days", range: { fromDate: minus7, toDate: today } },
      { presetLabel: "Last 30 Days", range: { fromDate: minus30, toDate: today } },
      { presetLabel: "This Month", range: { fromDate: monthFirstDate, toDate: monthEndDate } },
      { presetLabel: "Last Month", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
      { presetLabel: "Custom Range", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
    ]
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  changeShiftForVitals(shiftNo) {
    let zone = this.timezone

    this.newDate1 = moment.tz(zone);
    this.newDate2 = moment.tz(zone)

    // this.newDate1 = moment();
    // this.newDate2 = moment();

    if (shiftNo === 0) {
      this.refusedcareData.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.refusedcareData.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.refusedcareData.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.refusedcareData.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
    console.log('------shift changing time hours------', this.sTime, this.eTime)
  }

  async isArchiveData(event, checkType) {
    console.log(checkType, event);
    if (checkType === 'refused') {
      this.refusedcareData.user = '';
      this.reportOrg = this.refusedcareData.organization;
      this.reportFac = this.refusedcareData.facility;
    }

    this.commonService.setLoader(true);
    if (event === true) {
      this.isachive_status = true;
    } else {
      this.isachive_status = false;
    }
    this.userlist = '';
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac'
    }
    const payload = {
      organization: [this.reportOrg],
      facility: [this.reportFac],
      isAchive_data: this.isachive_status
    };

    var result = await this.apiService.apiFn(action, payload);
    console.log(result);
    this.userlist = null;
    this.userlist = await result['data'].map(function (obj) {
      var robj = {};
      robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['_id'] = obj._id;
      return robj;
    })
    this.userlist.sort(function (a, b) {
      var nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) //sort string ascending
        return -1
      if (nameA > nameB)
        return 1
      return 0 //default return value (no sorting)
    })
    if (checkType === 'refused') {
      this.refusedCareForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
      for (let i = 0; i < this.refusedcareData.user.length; i++) {
        if (this.refusedcareData.user[i] === 0) {
          this.refusedcareData.user.splice(i, 1);
        }
      }
    }
    this.commonService.setLoader(false);
  }

  //Check Archive resident
  async isArchiveResi(event, checkResi) {
    if (checkResi === 'refused') {
      this.refusedcareData.resident = '';
      this.reportOrg = this.refusedcareData.organization;
      this.reportFac = this.refusedcareData.facility;
    }

    this.commonService.setLoader(true);
    if (event === true) {
      this.isresident_status = true;
    } else {
      this.isresident_status = false;
    }
    this.residentslist = [];
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': [this.reportOrg],
      'facility': [this.reportFac],
      is_resArchive: this.isresident_status
    };
    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${(obj['room'] && obj['room']['room']) ? obj['room']['room'] : ''}`
      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    if (checkResi === 'refused') {
      this.refusedCareForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.refusedcareData.user.length; i++) {
        if (this.refusedcareData.user[i] === 0) {
          this.refusedcareData.user.splice(i, 1);
        }
      }
    }
  }

  selectAll(checkTypeData) {
    if (this.allSelected.selected) {
      if (checkTypeData === 'refused_all') {
        this.refusedCareForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
        for (var i = 0; i < this.refusedcareData.user.length; i++) {
          if (this.refusedcareData.user[i] === 0) {
            this.refusedcareData.user.splice(i, 1);
          }
        }
      }

    } else {
      if (checkTypeData === 'refused_all') {
        this.refusedCareForm.controls.user.patchValue([]);
      }
    }
  }

  selectUser(all, id, checkUser) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (checkUser === 'refused') {
      if (this.refusedCareForm.controls.user.value.length == this.userlist.length)
        this.allSelected.select();

      for (var i = 0; i < this.refusedcareData.user.length; i++) {
        if (this.refusedcareData.user[i] === 0) {
          this.refusedcareData.user.splice(i, 1);
        }
      }
    }

  }

  async refusedCareSubmit(report, isValid) {

    if (isValid) {
      const s = moment(this.start_date);
      let e;
      if (report.shift === 3) {
        e = moment(this.end_date).add(1, 'day');
      } else {
        e = moment(this.end_date);
      }
      s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      this.start_date = s['_d'].getTime();
      this.end_date = e['_d'].getTime();
      let ss, ee;

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date)).tz(this.timezone, true).valueOf();
      this.end_date = moment(moment(this.end_date)).tz(this.timezone, true).valueOf();

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        'shift': report.shift,
        'start_date': this.start_date,
        'end_date': this.end_date,
        'userId': report.user,
        'residentId': report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.refusedcareData.facility,
        orgId: this.refusedcareData.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone
      };

      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      //this.router.navigate(['/reports/refusedcare']);
      this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));
      this.displayedColumns = this.displayedColumns.concat(['checkbox']);
      this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
      this.end_date = this.data.end_date;
      this.start_date = this.data.start_date;
      this.userName = this.data.userName;
      this.shiftNo = this.data.shift;
      this.getServerData(this.pagiPayload);
    } else {
      return;
    }
  }

  cancelRefused() {
    this.refusedcareData.isachive = false;
    this.refusedcareData.isresident = false;
    this.dialogRefs.close();
  }
}

export interface PresetItem {
  presetLabel: string;
  range: Range;
}

export interface Range {
  fromDate: Date;
  toDate: Date;
}

export interface CalendarOverlayConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  shouldCloseOnBackdropClick?: boolean;
}

export interface NgxDrpOptions {
  presets: Array<PresetItem>;
  format: string;
  range: Range;
  excludeWeekends?: boolean;
  locale?: string;
  fromMinMax?: Range;
  toMinMax?: Range;
  applyLabel?: string;
  cancelLabel?: string;
  animation?: boolean;
  calendarOverlayConfig?: CalendarOverlayConfig;
  placeholder?: string;
  startDatePrefix?: string;
  endDatePrefix?: string;
}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}