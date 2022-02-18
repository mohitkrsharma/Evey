import { Component, OnInit, ElementRef, ViewChild, TemplateRef } from '@angular/core';
// import { forEach } from '@angular/router/src/utils/collection';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ExportAsService } from 'ngx-export-as';
import * as _ from 'underscore';
import { Subscription } from 'rxjs/Rx';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ExcelService } from './../../../../shared/services/excel.service';
import { CommonService } from './../../../../shared/services/common.service';
import { insertRefFn } from './../../../../shared/store/shiftReport/action';
import { ApiService } from 'src/app/shared/services/api/api.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
interface shiftRepState { _shiftRep: object; }

@Component({
  selector: 'app-vitalsreport',
  templateUrl: './vitalsreport.component.html',
  styleUrls: ['./vitalsreport.component.scss']
})

export class VitalsReportComponent implements OnInit {
  careIdName: any;
  doc: any;
  timezone: any;
  utc_offset: any;
  private subscription: Subscription;
  constructor(
    private apiService: ApiService,
    public commonService: CommonService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private _shiftRep: Store<shiftRepState>,
    private exportAsService: ExportAsService,
    private router: Router,
    private excelService: ExcelService
  ) { }

  @ViewChild('vitalsReport', { static: false }) vitalsReport: TemplateRef<any>;
  @ViewChild('allSelected', { static: false }) private allSelected: MatOption;
  @ViewChild('selectedResident', { static: false }) private selectedResident: MatOption;
  @ViewChild('dateRangePicker', { static: false }) dateRangePicker;

  countReportvalue = [];
  boxResultvalue;
  vitalResults = {};
  selectShift;
  shiftNo;
  residentList;
  data;
  start_date;
  end_date;
  userName;
  resultcount;

  res_all;
  res_iso;
  res_po;

  isShow: boolean;
  topPosToStartShowing = 100;
  sTime;
  eTime;
  usrSearch = '';
  shiSearch = '';
  usSearch = '';
  rSearch = '';
  exportArr = [];
  allUserData: any;
  margins = {
    top: 100,
    bottom: 50,
    left: 25,
    right: 30,
    width: 550
  };
  sortedBy = {
    'Temperature': 0,
    'Blood Pressure': 1,
    'Pulse Automatic': 2,
    'Oxygen': 3,
    'Respirations': 4,
    'Blood Sugar': 5,
    'Height': 6,
    'Weight': 7,
    'Left': 8
  }
  requestedPerformer = []

  alwaysShowCalendars: boolean;
  vitalsReportForm: FormGroup;
  floorlist;
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
  houseReportForm: FormGroup;
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

  vitalreport: any = {
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
  isGroupByUsers: boolean = false;
  isGroupByResident: boolean = false;
  isListAll: boolean = false;
  vitalsReportData: any = [];
  @ViewChild('content', { static: true }) content: ElementRef;
  selected_start_date: any;
  selected_end_date: any;

  async ngOnInit() {

    let today = new Date();
    let lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const toMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: 'Done',
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    if (!this.commonService.checkAllPrivilege('Reports')) {
      this.router.navigate(['/']);
    }
    this.subscription = this.commonService.contentdata.subscribe((contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        // console.log('--facility timezone--',contentVal)
        this.timezone = contentVal.timezone
        this.utc_offset = contentVal.utc_offset
        console.log('---timezone---', this.timezone, this.utc_offset)
      }
    });
    this.load_careIdName();
    this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
    // console.log('this.datathis.data------>>>', this.data);
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.selected_start_date = this.start_date;
    this.selected_end_date = this.end_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.loadReport();
  }

  async loadReport() {
    this.commonService.setLoader(true);
    this.requestedPerformer = [];
    this.getCurrentView();
    console.log('Result',this.isGroupByResident, this.isGroupByUsers);
    if (this.isGroupByResident) {
      const action = { type: 'POST', target: 'reports/vital_report_grp_res' };
      const payload = this.data;
      const result = await this.apiService.apiFn(action, payload);
      console.log('Result',result);
      this.residentList = result['data']['reports'];
      this.isGroupByUsers = false;
      this.isListAll = false;
      this.residentList.forEach(e => {
        if (e._id && e._id.residentData && e._id.residentData._id[0]) {
          this.requestedPerformer.push(e._id.residentData._id[0])
        }
      })
      // if(this.residentList.length === 1){
      // 	this.expandPanel(this.residentList[0]._id.residentData._id[0]);
      // }
    } else if (this.isGroupByUsers) {
      const action = { type: 'POST', target: 'reports/vital_report' };
      const payload = this.data;
      const result = await this.apiService.apiFn(action, payload);
      console.log('Result',result);

      this.res_all = result['data']['c']['residents']
      this.res_iso = result['data']['c']['res_iso']
      this.res_po = result['data']['c']['res_p']
      // console.log('result----------------------------------------------', result);
      this.residentList = result['data']['reports'];
      console.log('Residents list',this.residentList);
      // this.resultcount = true;
      this.isGroupByResident = false;
      this.isListAll = false;
      this.residentList.forEach(e => {
        if (e._id && e._id.userData && e._id.userData._id) {
          this.requestedPerformer.push(e._id.userData._id)
        }
      })
      // if(this.residentList.length === 1){
      //   this.expandPanel(this.residentList[0]._id.userData._id);
      // }
    } else {
      this.resultcount = false;
      this.vitalsReportData = await this.getData('random');
      console.log('Vitals report',this.vitalsReportData);
      console.log('Vitals report length',this.vitalsReportData.length);
      if (this.vitalsReportData.length > 0) {
        console.log('in here Vitals report');
        this.resultcount = true;
        this.isGroupByResident = false;
        this.isGroupByUsers = false;
        this.isListAll = true;

        this.vitalsReportData.forEach(elem => {
          if (elem.trackcareList[0].user_id) {
            this.requestedPerformer.push(elem.trackcareList[0].user_id)
          }
        })
      } else {
        this.resultcount = false;
      }

    }

    if (this.shiftNo === 0) {
      this.selectShift = 'All Shifts';
    } else if (this.shiftNo === 1) {
      this.selectShift = '1st Shift (6:00am - 2:00pm)';
    } else if (this.shiftNo === 2) {
      this.selectShift = '2nd Shift (2:00pm - 10:00pm)';
    } else {
      this.selectShift = '3rd Shift (10:00pm - 6:00am)';
    }
    console.log(this.isListAll);
    if (!this.isListAll) {
      console.log(this.residentList);
      if (this.residentList && this.residentList.length > 0) {
        this.resultcount = true;
        console.log(this.isGroupByResident);
        if (this.isGroupByResident) {
          this.expandPanel(this.residentList[0]._id.residentData._id[0]);
        } else {
          this.expandPanel(this.residentList[0]._id.userData._id);
        }
      } else {
        this.resultcount = false;
      }
    }
    this.commonService.setLoader(false);
    // if (!this.isListAll) {
    //   if (this.residentList.length === 1) {
    //     if (this.isGroupByResident) {
    //       this.expandPanel(this.residentList[0]._id.residentData._id[0]);
    //     } else {
    //       this.expandPanel(this.residentList[0]._id.userData._id);
    //     }
    //   }
    // }
  }

  async getData(paramId) {
    this.commonService.setLoader(true);

    const action = { type: 'POST', target: 'reports/vital_report_users' };
    const payload = this.data;
    console.log('Payload',payload);
    if (this.isGroupByResident) {
      payload.isGroupByResident = this.isGroupByResident;
      payload.resident_Id = paramId;
    } else if (this.isGroupByUsers) {
      payload.isGroupByUser = this.isGroupByUsers;
      payload.user_id = paramId;
    } else if (this.isListAll) {
      payload.isListAll = this.isListAll;
    }
    //payload.user_id = userID;
    const result = await this.apiService.apiFn(action, payload);
    console.log('result----result-----result-----result', result['data']);


    if (result['data']['reports'] && result['status']) {

      result['data']['reports'].map(e => {
        e.trackcareList.map(item => {
          if (item.careData.name == 'ACCU Check') {
            item.careData.name = 'Blood Sugar'
            return item
          }
        })
      })

      result['data']['reports'].forEach(e => {
        e.trackcareList = e.trackcareList.sort((a, b) => this.sortedBy[a.careData.name] - this.sortedBy[b.careData.name])
      })

      this.vitalResults[paramId] = result['data']['reports'];
      this.commonService.setLoader(false);
      return this.vitalResults[paramId];
    }
    this.commonService.setLoader(false);
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
      { presetLabel: 'Today', range: { fromDate: today, toDate: today } },
      { presetLabel: 'Yesterday', range: { fromDate: yesterday, toDate: today } },
      { presetLabel: 'Last 7 Days', range: { fromDate: minus7, toDate: today } },
      { presetLabel: 'Last 30 Days', range: { fromDate: minus30, toDate: today } },
      { presetLabel: 'This Month', range: { fromDate: monthFirstDate, toDate: monthEndDate } },
      { presetLabel: 'Last Month', range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
      { presetLabel: 'Custom Range', range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
    ]
  }

  async load_careIdName() {
    const action = {
      type: 'GET', target: 'cares/careIdName'
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.careIdName = result['data'];
  }

  trackcareDetail(_arr) {
    return _arr = _arr.filter((_item) => {
      // tslint:disable-next-line: forin
      for (const property in _item) {
        return _item[property] = _item[property].filter(__item => {
          // tslint:disable-next-line: forin
          for (const property in __item) {
            return (__item[property] !== 'Performed') ? true : false;
          }
        });
      }
    });
  }

  timeConvert(num) {
    const hours = (num / 60);
    const rhours = Math.floor(hours);
    const minutes = (hours - rhours) * 60;
    const rminutes = Math.round(minutes);
    return rhours + ' hrs ' + rminutes + ' min';
  }

  async expandPanel(userID) {
    // event.stopPropagation();
    if (!this.vitalResults.hasOwnProperty(userID)) {
      await this.getData(userID);
    }
    console.log('vitalReport ---');
    console.log(this.vitalResults[userID]);
    console.log('vitalReport ---');
  }

  caredate(trackcares) {
    if (trackcares && trackcares.length) {
      let lowDate = trackcares[0].ts_total_time.start_time;
      let highDate = trackcares[0].ts_total_time.end_time;
      trackcares.map(function (item) {
        if (lowDate > item.ts_total_time.start_time) {
          lowDate = item.ts_total_time.start_time;
        }
        if (highDate < item.ts_total_time.end_time) {
          highDate = item.ts_total_time.end_time;
        }
      });
      // return moment(lowDate).format('MMMM Do YYYY, hh:mm A') + ' - ' +  moment(highDate).format('hh:mm A');
      let utcDate = moment.utc(lowDate);
      let tzdate = utcDate.clone().tz(this.timezone);

      let utcEndDate = moment.utc(highDate);
      let tzEndDate = utcEndDate.clone().tz(this.timezone);
      if (tzdate && tzEndDate) {
        return tzdate.format('MMMM Do YYYY, hh:mm A') + ' - ' + tzEndDate.format('hh:mm A');
      } else {
        return '-';
      }
    } else {
      return '-';
    }

  }

  dob_date(dob) {
    if (dob) {
      return moment(dob).format('MMMM DD, YYYY');
    } else {
      return '-';
    }
  }

  cal_age(dob) {
    if (dob) {
      // tslint:disable-next-line: radix
      return parseInt(moment().format('YYYY')) - parseInt(moment(dob).format('YYYY'));
    } else {
      return '-';
    }
  }

  care_outcome(data) {

    let careUnit = '';

    if (data.careData && data.careData.name) {
      if (data.careData.name == 'Blood Pressure') {
        careUnit = 'mm Hg';
      } else if (data.careData.name == 'Oxygen') {
        careUnit = 'mm Hg';
      } else if (data.careData.name == 'Pulse') {
        careUnit = 'bpm';
      } else if (data.careData.name == 'Respirations') {
        careUnit = 'bpm';
      } else if (data.careData.name == 'Weight') {
        careUnit = 'lbs';
      } else if (data.careData.name == 'Height') {
        careUnit = 'ft';
      } else if (data.careData.name == 'Blood Sugar') {
        // data.careData.name='Blood Sugar'
        careUnit = 'mg/dL';
      } else if (data.careData.name == 'Temperature') {
        // data.careData.name='Blood Sugar'
        careUnit = '°F';
      }
    }

    if (data.outcome === 'Performed') {
      if (data.careData.type === 'height') {
        return this.commonService.toFeet(data.track_details.first_input) + ' ' + ((data.careData.unit) ? data.careData.unit : '');
      } else {
        // tslint:disable-next-line: max-line-length
        if (data.track_details) {
          return (
            (data.track_details.first_input ? data.track_details.first_input : ' ') +
            (data.track_details.second_input ? '/' + data.track_details.second_input : '') +
            ' ' +
            careUnit
          );
        }
      }
    } else if (data.outcome === 'Discard') {
      return '-';
    } else {
      return data.outcome;
    }
  }

  care_note(data) {
    // console.log('datadatadatadatadata-------------', data);
    if (data.prev_trackcare_id) {
      const prevTrackcare = data.prev_trackcare;
      const trackVal = prevTrackcare.track_details;
      const oldtrackVal = data.track_details;
      const prevCareDate = moment.tz(prevTrackcare.ts_total_time.start_time, this.timezone).format('MMMM Do YYYY, hh:mm A');
      // const careUnit = ((data.careData.unit) ? data.careData.unit : '');
      let careUnit = '';
      if (data.careData) {
        if (data.careData.name == 'Blood Pressure') {
          careUnit = 'mm Hg';
        } else if (data.careData.name == 'Oxygen') {
          careUnit = 'mm Hg';
        } else if (data.careData.name == 'Pulse Automatic') {
          careUnit = 'bpm';
        } else if (data.careData.name == 'Respirations') {
          careUnit = 'bpm';
        } else if (data.careData.name == 'Weight') {
          careUnit = 'lbs';
        } else if (data.careData.name == 'Height') {
          careUnit = 'ft';
        } else if (data.careData.name == 'Blood Sugar') {
          careUnit = 'ft';
        }
      }
      // console.log('trackValtrackValtrackVal', trackVal);
      if (data.outcome === 'Performed') {
        if (trackVal) {
          if (trackVal.second_input) {
            // tslint:disable-next-line: max-line-length
            return trackVal.first_input + '/' + trackVal.second_input + ' ' + careUnit + ' last measurement on ' + prevCareDate;
          } else {
            if (trackVal.first_input === oldtrackVal.first_input) {
              return 'No change since last measurement on ' + prevCareDate;
            } else {
              if (trackVal.first_input && trackVal.first_input !== '') {
                const calVal = oldtrackVal.first_input - trackVal.first_input;
                // console.log(data)
                if (data.careData.type === 'height') {
                  // tslint:disable-next-line: max-line-length
                  return ((calVal > 0) ? '+' : '') + this.commonService.toFeet(calVal) + ' ' + careUnit + ' since last measurement on ' + prevCareDate;
                } else {
                  return ((calVal > 0) ? '+' : '') + calVal.toFixed(2) + ' ' + careUnit + ' since last measurement on ' + prevCareDate;
                }
              } else {
                return '';
              }
            }
          }
        }
        // } else if (data.outcome === 'Discard') {
        //   return trackVal.first_input + ' ' + careUnit + 'last measurement on ' + prevCareDate;
      } else {
        if (trackVal.first_input && trackVal.first_input !== '') {
          if (data.careData.type === 'height') {
            return this.commonService.toFeet(trackVal.first_input) + ' ' + careUnit + ' since last measurement on ' + prevCareDate;
          } else {
            return trackVal.first_input + ' ' + careUnit + ' last measurement on ' + prevCareDate;
          }
        } else {
          return '';
        }
      }
    } else {
      return '';
    }
  }

  care_additional_notes(data) {
    if (data.trackcareList) {
      const notes = [];
      data.trackcareList.map((item) => {
        if (item.notes && item.notes !== '') {
          notes.push(item.notes);
        }
      });
      if (notes.length) {
        return notes.toString();
      }
    }
    return false;
  }

  runNewReport() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.vitalsReport, dialogConfig);

    this.vitalsReportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      isresident: false,
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    this.vitalreport.isachive = true;
    this.vitalreport.isresident = true;

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.vitalreport.organization = contentVal.org;
        this.vitalreport.facility = contentVal.fac;

        const action = {
          type: 'GET',
          target: 'users/get_users_org_fac'
        };
        const payload = {
          organization: [this.vitalreport.organization],
          facility: [this.vitalreport.facility],
          is_resArchive: true,
          isAchive_data: true
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
        this.vitalsReportForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);

        this.getAllresidents('vital');
        this.commonService.setLoader(false);
      }
    });
  }

  async downloadAll() {

    console.log('----download all report----')

    let startDate = this.getDateFromTimezone(this.start_date);
    let endDate = this.getDateFromTimezone(this.end_date);
    console.log('---date----', startDate, endDate)
    // let vitalReport:any = await this.prepareForExportAll(startDate, endDate);
    // let vitalReport: any = await this.prepareForExportAll_new(startDate, endDate);
    if (this.resultcount) {
      await this.prepareForExportAllList(startDate, endDate);
    }


  }

  async prepareForExportAllList(startDate, endDate) {
    let fontfamily = 'helvetica'
    let fontsize = 10;
    let x = 19.05;
    let y = 19.05;
    this.doc = undefined;
    this.doc = new jsPDF('p', 'mm', 'letter');
    this.doc.setFont(fontfamily, 'normal');
    this.doc.setFontSize(16).setFont(fontfamily, 'bold');
    this.doc.text('Vital Report', x, y)
    this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 12;
    this.doc.text(`Created by ${this.userName}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 6;
    this.doc.text(`${moment(startDate).format('L')} - ${moment(endDate).format('L')}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 6;
    this.doc.text(`${this.selectShift}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
    if (this.resultcount && this.isListAll) {
      let TotoalPageCount = 1;
      for (var al = 0; al < this.vitalsReportData.length; al++) {
        var listdata = this.vitalsReportData[al];
        let last_name = listdata.trackcareList[0].residentData[0].last_name
        last_name = (last_name.length > 1) ? last_name[0].toUpperCase() + last_name.substr(1).toLowerCase() : last_name.toUpperCase();
        if (al != 0) {
          y = y + 3;
        }
        let first_name = listdata.trackcareList[0].residentData[0].first_name;
        first_name = (first_name.length > 1) ? first_name[0].toUpperCase() + first_name.substr(1).toLowerCase() : first_name.toUpperCase();
        let fullname = last_name + ', ' + first_name;
        let care_time = this.caredate(listdata.trackcareList);

        y = y + 8;
        this.doc.setFontSize(fontsize).setFont(fontfamily, 'bold')
        this.doc.text(fullname, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        y = y + 5;
        this.doc.text(care_time, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal')
        y = y + 8;
        let unittext = 'Unit';
        this.doc.text(unittext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        let unitvalue = (listdata.trackcareList[0].roomData.room ? listdata.trackcareList[0].roomData.room : '--') + ' ';
        this.doc.text(unitvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
        y = y + 5;
        let dobtext = 'Date of Birth (DOB)';
        this.doc.text(dobtext, x, y);
        let dobvalue = (this.dob_date(listdata.trackcareList[0].residentData[0].dob) ? this.dob_date(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
        this.doc.text(dobvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
        y = y + 5;
        let agetext = 'Age';
        this.doc.text(agetext, x, y);
        let agevalue = (this.cal_age(listdata.trackcareList[0].residentData[0].dob) ? this.cal_age(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
        this.doc.text(agevalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
        y = y + 5;
        let Currentstatustext = 'Current Status';
        this.doc.text(Currentstatustext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        let Currentstatusvalue = (listdata.trackcareList[0].residentData[0].resident_status ? listdata.trackcareList[0].residentData[0].resident_status : '--')
        this.doc.text(Currentstatusvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        y = y + 5;
        let careleveltext = 'Care Level';
        this.doc.text(careleveltext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        this.doc.text((listdata.trackcareList[0].level ? listdata.trackcareList[0].level : '--'), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        y = y + 5;
        let PerformerofVitalstext = 'Performer of Vitals';
        this.doc.text(PerformerofVitalstext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        this.doc.text((listdata.trackcareList[0].userData.last_name + ',' + listdata.trackcareList[0].userData.first_name), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        y = y + 5;
        let vitaldata = [];
        let columns = ['Vital', 'Outcome', 'Notes']
        for (var tcl = 0; tcl < listdata.trackcareList.length; tcl++) {
          let tclitemdata = listdata.trackcareList[tcl];
          let Vitalvalue = tclitemdata.careData.name;
          let Outcomevalue = this.care_outcome(tclitemdata);
          let Notesvalue = this.care_note(tclitemdata);
          vitaldata.push([Vitalvalue, Outcomevalue, Notesvalue]);
        }
        await this.doc.autoTable(columns, (vitaldata), {
          startY: y,
          margin: {
            top: 15,
            bottom: 15,
            left: 19.5,
            right: 19.5
          },
          styles: {
            overflow: 'linebreak',
            
            lineWidth: 0.1,
          
            valign: 'middle',
            lineColor: 211,
            font: fontfamily,
            fontSize: fontsize,
            fontStyle: 'normal'
          },
          theme: 'plain',
          columnStyles: {
            'Notes': {
              cellWidth: 120
            }
          },
          didDrawPage: (row, data) => {
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
       
        let finalY = this.doc.lastAutoTable.finalY;
        if (finalY != 0) {
          y = parseInt(finalY);
         
        }
        if (y <= 80) {
          this.doc.setTextColor('#1164A0');
          this.doc.setFontSize(8);
          this.doc.setFont(fontfamily, 'normal');
          this.doc.text('Reported by Evey®', x, 275.3, null, null, 'left')
          this.doc.setFontSize(8).setFont(fontfamily, 'normal');;
          this.doc.text('CONFIDENTIAL', 196.95, 275.3, null, null, 'right');
          this.doc.setTextColor('black');
          this.doc.setFontSize(fontsize);
          this.doc.setFont(fontfamily, 'normal');
        }
        else if (y <= 200 && TotoalPageCount == 1) {
          this.doc.setTextColor('#1164A0');
          this.doc.setFontSize(8);
          this.doc.setFont(fontfamily, 'normal');
          this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
          this.doc.setFontSize(8).setFont(fontfamily, 'normal');
          this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
          this.doc.setTextColor('black');
          this.doc.setFontSize(fontsize);
          this.doc.setFont(fontfamily, 'normal');
        }
        else if (y >= 200) {
          let recordcount = (this.vitalsReportData.length - 1) - al;
          if (recordcount > 0) {
            this.doc.addPage();
            y = 19.5; 
            x = 19.5;
            TotoalPageCount++;
            this.doc.setTextColor('#1164A0');
            this.doc.setFontSize(8);
            this.doc.setFont(fontfamily, 'normal');
            this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left')
            this.doc.setFontSize(8).setFont(fontfamily, 'normal');;
            this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
            this.doc.setTextColor('black');
            this.doc.setFontSize(fontsize);
            this.doc.setFont(fontfamily, 'normal');
          }
        }
      }
    }
    else if (this.resultcount && this.isGroupByResident) {
      let TotoalPageCount = 1;
      for (var r = 0; r < this.residentList.length; r++) {
        let residentItemdata = this.residentList[r];
        var itemdata = this.vitalResults[residentItemdata._id.residentData._id[0]];
        for (var vi = 0; vi < itemdata.length; vi++) {
          var listdata = itemdata[vi];
          let last_name = listdata.trackcareList[0].residentData[0].last_name
          if (vi != 0) {
            y = y + 3;
          }
          last_name = (last_name.length > 1) ? last_name[0].toUpperCase() + last_name.substr(1).toLowerCase() : last_name.toUpperCase();
          let first_name = listdata.trackcareList[0].residentData[0].first_name;
          first_name = (first_name.length > 1) ? first_name[0].toUpperCase() + first_name.substr(1).toLowerCase() : first_name.toUpperCase();
          let fullname = last_name + ', ' + first_name;
          let care_time = this.caredate(listdata.trackcareList);

          y = y + 8;
          this.doc.setFontSize(fontsize).setFont(fontfamily, 'bold')
          this.doc.text(fullname, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          this.doc.text(care_time, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal')
          y = y + 8;
          let unittext = 'Unit';
          this.doc.text(unittext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          let unitvalue = (listdata.trackcareList[0].roomData.room ? listdata.trackcareList[0].roomData.room : '--');
          this.doc.text(unitvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
          y = y + 5;
          let dobtext = 'Date of Birth (DOB)';
          this.doc.text(dobtext, x, y);
          let dobvalue = (this.dob_date(listdata.trackcareList[0].residentData[0].dob) ? this.dob_date(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
          this.doc.text(dobvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
          y = y + 5;
          let agetext = 'Age';
          this.doc.text(agetext, x, y);
          let agevalue = (this.cal_age(listdata.trackcareList[0].residentData[0].dob) ? this.cal_age(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
          this.doc.text(agevalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
          y = y + 5;
          let Currentstatustext = 'Current Status';
          this.doc.text(Currentstatustext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          let Currentstatusvalue = (listdata.trackcareList[0].residentData[0].resident_status ? listdata.trackcareList[0].residentData[0].resident_status : '--')
          this.doc.text(Currentstatusvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let careleveltext = 'Care Level';
          this.doc.text(careleveltext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          this.doc.text((listdata.trackcareList[0].level ? listdata.trackcareList[0].level : '--'), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let PerformerofVitalstext = 'Performer of Vitals';
          this.doc.text(PerformerofVitalstext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          this.doc.text((listdata.trackcareList[0].userData.last_name + ',' + listdata.trackcareList[0].userData.first_name), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let vitaldata = [];
          let columns = ['Vital', 'Outcome', 'Notes']
          for (var tcl = 0; tcl < listdata.trackcareList.length; tcl++) {
            let tclitemdata = listdata.trackcareList[tcl];
            let Vitalvalue = tclitemdata.careData.name;
            let Outcomevalue = this.care_outcome(tclitemdata);
            let Notesvalue = this.care_note(tclitemdata);
            vitaldata.push([Vitalvalue, Outcomevalue, Notesvalue]);
          }

          //let pageHeight = this.doc.internal.pageSize.height;

          // Before adding new content
          //y = 500 // Height position of new content

          //let finalY = this.doc.autoTableEndPosY();
          await this.doc.autoTable(columns, (vitaldata), {
            headStyles: {
              // fillColor: 212,
              // textColor: 20,
              // halign: 'center',
              fontStyle: 'normal'
            },
            // addPageContent: () => {
            //   // this.pageContent(false)
            // },
            //startY: (this.doc.autoTableEndPosY() == 0 ? y : (this.doc.autoTableEndPosY() + y)),
            startY: y,
            //     pageBreak: 'auto',
            margin: {
              top: 15,
              bottom: 15,
              left: 19.5,
              right: 19.5
            },
            styles: {
              overflow: 'linebreak',
              // lineColor: [221, 221, 221],
              lineWidth: 0.1,
              // halign: 'center',
              valign: 'middle',
              lineColor: 211,
              font: fontfamily,
              fontSize: fontsize,
              fontStyle: 'normal'
            },
            theme: 'plain',
            columnStyles: {
              'Notes': {
                cellWidth: 120
              }
            },
            didDrawPage: (row, data) => {
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
          //let finalY = this.doc.autoTableEndPosY();
          let finalY = this.doc.lastAutoTable.finalY;
          if (finalY != 0) {
            y = parseInt(finalY);
            // if (y >= 100) {
            //   y = parseInt(finalY)
            // }
          }
          if (y <= 80) {
            this.doc.setTextColor('#1164A0');
            this.doc.setFontSize(8);
            this.doc.setFont(fontfamily, 'normal');
            this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
            this.doc.setFontSize(8).setFont(fontfamily, 'normal');
            this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
            this.doc.setTextColor('black');
            this.doc.setFontSize(fontsize);
            this.doc.setFont(fontfamily, 'normal');
          }
          else if (y <= 200 && TotoalPageCount == 1) {
            this.doc.setTextColor('#1164A0');
            this.doc.setFontSize(8);
            this.doc.setFont(fontfamily, 'normal');
            this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
            this.doc.setFontSize(8).setFont(fontfamily, 'normal');
            this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
            this.doc.setTextColor('black');
            this.doc.setFontSize(fontsize);
            this.doc.setFont(fontfamily, 'normal');
          }
          else if (y >= 200) {
            let recordcount = (itemdata.length - 1) - vi;
            if (recordcount > 0) {
              this.doc.addPage();
              y = 19.5 // Restart height position
              x = 19.5;
              TotoalPageCount++;
              this.doc.setTextColor('#1164A0');
              this.doc.setFontSize(8);
              this.doc.setFont(fontfamily, 'normal');
              this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
              this.doc.setFontSize(8).setFont(fontfamily, 'normal');;
              this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
              this.doc.setTextColor('black');
              this.doc.setFontSize(fontsize);
              this.doc.setFont(fontfamily, 'normal');
            }
          }
        }
      }
    }
    else if (this.resultcount && this.isGroupByUsers) {
      let TotoalPageCount = 1;
      for (var u = 0; u < this.residentList.length; u++) {
        let residentbyuserItemdata = this.residentList[u];
        let userID = residentbyuserItemdata._id.userData._id;
        var itemdatabyuser = this.vitalResults[residentbyuserItemdata._id.userData._id];
        if (!this.vitalResults.hasOwnProperty(userID) && !itemdatabyuser) {
          var udata = await this.getData(userID);
        }
        itemdatabyuser = this.vitalResults[residentbyuserItemdata._id.userData._id];
        let empname_lastname = residentbyuserItemdata._id.userData.last_name;
        empname_lastname = (empname_lastname.length > 1) ? empname_lastname[0].toUpperCase() + empname_lastname.substr(1).toLowerCase() : empname_lastname.toUpperCase();
        let empname_Firstname = residentbyuserItemdata._id.userData.first_name;
        empname_Firstname = (empname_Firstname.length > 1) ? empname_Firstname[0].toUpperCase() + empname_Firstname.substr(1).toLowerCase() : empname_Firstname.toUpperCase();
        y = y + 8;
        let fullUsername = empname_lastname + ', ' + empname_Firstname;
        this.doc.setFontSize(fontsize).setFont(fontfamily, 'bold')
        this.doc.text(fullUsername, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
        for (var vi = 0; vi < itemdatabyuser.length; vi++) {
          var listdata = itemdatabyuser[vi];
          let last_name = listdata.trackcareList[0].residentData[0].last_name
          if (vi != 0) {
            y = y + 3;
          }
          last_name = (last_name.length > 1) ? last_name[0].toUpperCase() + last_name.substr(1).toLowerCase() : last_name.toUpperCase();
          let first_name = listdata.trackcareList[0].residentData[0].first_name;
          first_name = (first_name.length > 1) ? first_name[0].toUpperCase() + first_name.substr(1).toLowerCase() : first_name.toUpperCase();
          let fullname = last_name + ', ' + first_name;
          let care_time = this.caredate(listdata.trackcareList);

          y = y + 8;
          this.doc.setFontSize(fontsize).setFont(fontfamily, 'bold')
          this.doc.text(fullname, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          this.doc.text(care_time, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal')
          y = y + 8;
          let unittext = 'Unit';
          this.doc.text(unittext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          let unitvalue = (listdata.trackcareList[0].roomData.room ? listdata.trackcareList[0].roomData.room : '--') + ' ';
          this.doc.text(unitvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let dobtext = 'Date of Birth (DOB)';
          this.doc.text(dobtext, x, y);
          let dobvalue = (this.dob_date(listdata.trackcareList[0].residentData[0].dob) ? this.dob_date(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
          this.doc.text(dobvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let agetext = 'Age';
          this.doc.text(agetext, x, y);
          let agevalue = (this.cal_age(listdata.trackcareList[0].residentData[0].dob) ? this.cal_age(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
          this.doc.text(agevalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let Currentstatustext = 'Current Status';
          this.doc.text(Currentstatustext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          let Currentstatusvalue = (listdata.trackcareList[0].residentData[0].resident_status ? listdata.trackcareList[0].residentData[0].resident_status : '--')
          this.doc.text(Currentstatusvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let careleveltext = 'Care Level';
          this.doc.text(careleveltext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          this.doc.text((listdata.trackcareList[0].level ? listdata.trackcareList[0].level : '--'), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let PerformerofVitalstext = 'Performer of Vitals';
          this.doc.text(PerformerofVitalstext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          this.doc.text((listdata.trackcareList[0].userData.last_name + ',' + listdata.trackcareList[0].userData.first_name), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
          y = y + 5;
          let vitaldata = [];
          let columns = ['Vital', 'Outcome', 'Notes']
          for (var tcl = 0; tcl < listdata.trackcareList.length; tcl++) {
            let tclitemdata = listdata.trackcareList[tcl];
            let Vitalvalue = tclitemdata.careData.name;
            let Outcomevalue = this.care_outcome(tclitemdata);
            let Notesvalue = this.care_note(tclitemdata);
            vitaldata.push([Vitalvalue, Outcomevalue, Notesvalue]);
          }

          //let pageHeight = this.doc.internal.pageSize.height;

          // Before adding new content
          //y = 500 // Height position of new content          
          //let finalY = this.doc.autoTableEndPosY();
          await this.doc.autoTable(columns, (vitaldata), {
            headStyles: {
              // fillColor: 212,
              // textColor: 20,
              // halign: 'center',
              fontStyle: 'normal'
            },
            // addPageContent: () => {
            //   // this.pageContent(false)
            // },
            //startY: (this.doc.autoTableEndPosY() == 0 ? y : (this.doc.autoTableEndPosY() + y)),
            startY: y,
            //     pageBreak: 'auto',
            margin: {
              top: 15,
              bottom: 15,
              left: 19.5,
              right: 19.5
            },
            styles: {
              overflow: 'linebreak',
              // lineColor: [221, 221, 221],
              lineWidth: 0.1,
              // halign: 'center',
              valign: 'middle',
              lineColor: 211,
              font: fontfamily,
              fontSize: fontsize,
              fontStyle: 'normal'
            },
            theme: 'plain',
            columnStyles: {
              'Notes': {
                cellWidth: 120
              }
            },
            didDrawPage: (row, data) => {
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
          //let finalY = this.doc.autoTableEndPosY();
          let finalY = this.doc.lastAutoTable.finalY;
          if (finalY != 0) {
            y = parseInt(finalY);
            // if (y >= 100) {
            //   y = parseInt(finalY)
            // }
          }
          if (y <= 80) {
            this.doc.setTextColor('#1164A0');
            this.doc.setFontSize(8);
            this.doc.setFont(fontfamily, 'normal');
            this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
            this.doc.setFontSize(8).setFont(fontfamily, 'normal');;
            this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
            this.doc.setTextColor('black');
            this.doc.setFontSize(fontsize);
            this.doc.setFont(fontfamily, 'normal');
          }
          else if (y <= 180 && TotoalPageCount == 1) {
            this.doc.setTextColor('#1164A0');
            this.doc.setFontSize(8);
            this.doc.setFont(fontfamily, 'normal');
            this.doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
            this.doc.setFontSize(8).setFont(fontfamily, 'normal');
            this.doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
            this.doc.setTextColor('black');
            this.doc.setFontSize(fontsize);
            this.doc.setFont(fontfamily, 'normal');
          }
          else if (y >= 180) {
            let recordcount = (itemdatabyuser.length - 1) - vi;
            if (recordcount > 0) {
              this.doc.addPage();
              y = 19.5 // Restart height position
              x = 19.5;
              TotoalPageCount++;
              this.doc.setTextColor('#1164A0');
              this.doc.setFontSize(8);
              this.doc.setFont(fontfamily, 'normal');
              this.doc.text('Reported by Evey®', x, 275.3, null, null, 'left')
              this.doc.setFontSize(8).setFont(fontfamily, 'normal');
              this.doc.text('CONFIDENTIAL', 196.95, 275.3, null, null, 'right');
              this.doc.setTextColor('black');
              this.doc.setFontSize(fontsize);
              this.doc.setFont(fontfamily, 'normal');
            }
          }
        }
      }
    }

    this.doc.save('Vital report');
    this.commonService.setLoader(false);
  }
  async prepareForExportAll_new(startDate, endDate) {

    let vitalReport = [];
    this.doc = undefined;
    this.doc = new jsPDF();
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    this.doc.text('Vital Report', 20, 30).setFontSize(15).setFont('helvetica', 'bold');
    this.doc.text(`Created by ${this.userName}`, 20, 34);
    this.doc.text(`${moment(startDate).format('L')} ${moment(endDate).format('L')}`, 20, 38);
    this.doc.text(`${this.selectShift}`, 20, 42);

    // for (var rp = 0; rp < this.requestedPerformer.length; rp++) {
    //   var itemdata = await this.getData(this.requestedPerformer[rp]);
    //   let startDate = this.getDateFromTimezone(this.start_date);
    //   let endDate = this.getDateFromTimezone(this.end_date);
    //   let newArr = []
    //   itemdata.forEach(e=>{
    //     newArr.push(this.commonExcelFunction(e,startDate,endDate))
    //   })
    // }
    let newPromiseArray = this.requestedPerformer.map(e => {
      return this.getData(e)
    })
    let finalShiftArr = []
    await Promise.all(newPromiseArray).then(async r => {

      let newArr = []
      let startDate = this.getDateFromTimezone(this.start_date);
      let endDate = this.getDateFromTimezone(this.end_date);
      r.forEach(e => {
        newArr.push(this.commonExcelFunction(e, startDate, endDate))
      })
      // await Promise.all(newArr).then(r=>{
      //   r.forEach(ele=>{
      //     ele.forEach(e=>{
      //       let f = Object.values(e);
      //       if(f[0] || f[1] || f[2]) {
      //         let  data = {
      //           'name': f[0],
      //           'outcome': f[1],
      //           'note': f[2]
      //         }
      //         vitalReport.push(data)
      //       }
      //     })
      //   })
      // })
    })

    await this.doc.autoTable(this.columnNames_1, (vitalReport), {
      headerStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal'
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
        valign: 'middle'
      },
      theme: 'plain',
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
    this.doc.save('Virus check report');
    this.commonService.setLoader(false);
  }
  async prepareForExportAll(startDate, endDate) {
    console.log('---preparing for export---')

    let vitalReport = [];
    this.doc = undefined;
    this.doc = new jsPDF();


    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.userName}`, 20, 30);
    this.doc.text(`${moment(startDate).format('L')}-${moment(endDate).format('L')}`, 20, 34);
    this.doc.text(`${this.selectShift}`, 20, 38);

    let newPromiseArray = this.requestedPerformer.map(e => {
      return this.getData(e);
    })
    // console.log('---new function call----',newPromiseArray)
    let finalShiftArr = []
    await Promise.all(newPromiseArray).then(async r => {

      let newArr = []
      let startDate = this.getDateFromTimezone(this.start_date);
      let endDate = this.getDateFromTimezone(this.end_date);
      r.forEach(e => {
        newArr.push(this.commonExcelFunction(e, startDate, endDate))
      })
      await Promise.all(newArr).then(r => {

        r.forEach(ele => {
          ele.forEach(e => {
            let f = Object.values(e);
            if (f[0] || f[1] || f[2]) {
              let data = {
                'name': f[0],
                'outcome': f[1],
                'note': f[2]
              }
              vitalReport.push(data)
            }
          })
        })
      })
    })

    await this.doc.autoTable(this.columnNames_1, (vitalReport), {
      headerStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal'
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
        valign: 'middle'
      },
      theme: 'plain',
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

    this.doc.save('Vital report');
    this.commonService.setLoader(false);

  }

  async commonExcelFunction(userId, startDate, endDate) {

    var arr = [];
    let virusReport = [];
    arr = userId
    let blackSpace = {
      'Vital Report': '',
      '': '',
      ' ': '',
      '  ': '',
      '   ': '',
      '    ': '',
      '     ': '',
      '      ': '',
    }
    let table1 = {
      'Vital Report': 'Performer',
      '': '',
      ' ': '',
      '  ': '',
      '   ': '',
      '    ': '',
      '     ': '',
      '      ': ''
    }
    virusReport.push(table1);

    if (arr.length) {
      if (arr[0].trackcareList.length) {
        let f_name = arr[0].trackcareList[0].userData.first_name
        let l_name = arr[0].trackcareList[0].userData.last_name
        let performerName = {
          'Vital Report': l_name + ', ' + f_name,
          '': '',
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': ''
        }
        virusReport.push(performerName);
      }
    }

    virusReport.push(blackSpace);

    if (arr.length) {

      let uu = arr

      uu.forEach(i => {
        let resident_fname = i.trackcareList[0].residentData[0].first_name ? i.trackcareList[0].residentData[0].first_name : ''
        let resident_lname = i.trackcareList[0].residentData[0].last_name ? i.trackcareList[0].residentData[0].last_name : ''
        let name = resident_lname + ', ' + resident_fname

        let nameofuser = {
          'Vital Report': name,
          '': '',
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }

        virusReport.push(nameofuser);

        let care_time = this.caredate(i.trackcareList)

        let carePerformTime = {
          'Vital Report': care_time,
          '': '',
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(carePerformTime);
        virusReport.push(blackSpace);

        let unit_row = {
          'Vital Report': 'Unit',
          '': i.trackcareList[0].roomData.room,
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(unit_row);

        let DOB_row = {
          'Vital Report': 'Date of Birth (DOB) :',
          '': this.dob_date(i.trackcareList[0].residentData[0].dob),
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(DOB_row);

        let age_row = {
          'Vital Report': 'Age :',
          '': this.cal_age(i.trackcareList[0].residentData[0].dob),
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(age_row);

        let status_row = {
          'Vital Report': 'Current Status :',
          '': i.trackcareList[0].residentData[0].resident_status,
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(status_row);

        let care_l_row = {
          'Vital Report': 'Care Level :',
          '': i.trackcareList[0].level,
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(care_l_row);

        let performer_row = {
          'Vital Report': 'Performer of Vital :',
          '': i.trackcareList[0].userData.last_name + ', ' + i.trackcareList[0].userData.first_name,
          ' ': '',
          '  ': '',
          '   ': '',
          '    ': '',
          '     ': '',
          '      ': '',
        }
        virusReport.push(performer_row);
        virusReport.push(blackSpace);

        //   i.userInfo,length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions

        // if(i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions){
        // let question_row = {
        // 	'Vital Report': 'Screening Questions',
        // 	'': '',
        // 	' ': '',
        // 	'  ': '',
        // 	'   ': '',
        // 	'    ': '',
        // 	'     ': '',
        // 	'      ': '',
        //   }
        //   virusReport.push(question_row);
        // }
        // virusReport.push(blackSpace);

        // if(i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions){
        // let qq = i.userInfo[0].track_details.questions

        // qq.forEach(e=>{
        //   let q_row = {
        // 	  'Vital Report': e.question,
        // 	  '': e.answer,
        // 	  ' ': '',
        // 	  '  ': '',
        // 	  '   ': '',
        // 	  '    ': '',
        // 	  '     ': '',
        // 	  '      ': '',
        // 	}
        // 	virusReport.push(q_row);
        // })
        // }

        // virusReport.push(blackSpace);

        // if(i.userInfo.length && i.userInfo[0].symtomsData.length){
        // let sym_row = {
        // 	'Vital Report': 'Symptoms',
        // 	'': '',
        // 	' ': '',
        // 	'  ': '',
        // 	'   ': '',
        // 	'    ': '',
        // 	'     ': '',
        // 	'      ': '',
        //   }
        //   virusReport.push(sym_row);
        //   let ss=i.userInfo[0].symtomsData

        //   ss.forEach(s=>{
        // 	let symname_row = {
        // 		'Vital Report': s.name,
        // 		'': '',
        // 		' ': '',
        // 		'  ': '',
        // 		'   ': '',
        // 		'    ': '',
        // 		'     ': '',
        // 		'      ': '',
        // 	  }
        // 	  virusReport.push(symname_row);
        //   })


        // }
        // virusReport.push(blackSpace);

        i.trackcareList.forEach(r => {
          let rr_row = {
            'Vital Report': r.careData.name,
            '': this.care_outcome(r),
            ' ': this.care_note(r),
            '  ': '',
            '   ': '',
            '    ': '',
            '     ': '',
            '      ': '',
          }

          virusReport.push(rr_row);
        })
        virusReport.push(blackSpace);

        if (this.care_additional_notes(i)) {
          let no_row = {
            'Vital Report': 'Additional Notes',
            '': '',
            ' ': '',
            '  ': '',
            '   ': '',
            '    ': '',
            '     ': '',
            '      ': '',
          }

          virusReport.push(no_row);

          let ee_row = {
            'Vital Report': this.care_additional_notes(i),
            '': '',
            ' ': '',
            '  ': '',
            '   ': '',
            '    ': '',
            '     ': '',
            '      ': '',
          }

          virusReport.push(ee_row);
        }
        virusReport.push(blackSpace);
        virusReport.push(blackSpace);


      })

    }
    return virusReport;
  }
  columnNames_1 = [
    {
      id: 'name',
      value: '',
      title: '',
      name: '',
      dataKey: 'name'
    },
    {
      id: 'outcome',
      value: '',
      title: '',
      name: '',
      dataKey: 'outcome'
    },
    {
      id: 'note',
      value: '',
      title: '',
      name: '',
      dataKey: 'note'
    },
  ];
  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString('en-US', { timeZone: this.timezone })
    return new Date(newDate);
  }

  async getAllresidents(reportType) {

    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    if (reportType === 'vital') {
      this.residentOrg = this.vitalreport.organization;
      this.residentFac = this.vitalreport.facility;
    }

    const payload = {
      'organization': [this.residentOrg],
      'facility': [this.residentFac],
      'is_resArchive': true,
      'isAchive_data':true
    };
    this.allresident = false;
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
    if (reportType === 'vital') {
      this.vitalsReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
    }
  }

  selectAllresidents(CheckRep) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      if (CheckRep === 'vital') {
        this.vitalsReportForm.controls.resident
          .patchValue([...this.residentslist.map(item => item.key), 0]);
        for (let i = 0; i < this.vitalreport.resident.length; i++) {
          if (this.vitalreport.resident[i] === 0) {
            this.vitalreport.resident.splice(i, 1);
          }
        }
      }
    } else {
      if (CheckRep === 'vital') {
        this.vitalsReportForm.controls.resident.patchValue([]);
      }
    }
  }

  selectResident(all, id, residentCheck) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
    if (residentCheck === 'vital') {
      if (this.vitalsReportForm.controls.resident.value.length === this.residentslist.length) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.vitalreport.resident.length; i++) {
        if (this.vitalreport.resident[i] === 0) {
          this.vitalreport.resident.splice(i, 1);
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
    // console.log('range in local timezone', this.start_date, this.end_date)
    // console.log('range in facility timezone', moment(moment(this.start_date)).tz(this.timezone, true).valueOf(), moment(moment(this.end_date)).tz(this.timezone, true).valueOf())

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
      this.vitalreport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.vitalreport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.vitalreport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.vitalreport.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
    console.log('------shift changing time hours------', this.sTime, this.eTime)
  }

  async isArchiveData(event, checkType) {
    console.log(checkType, event);
    if (checkType === 'vital') {
      this.vitalreport.user = '';
      this.reportOrg = this.vitalreport.organization;
      this.reportFac = this.vitalreport.facility;
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
    if (checkType === 'vital') {
      this.vitalsReportForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
      // for (let i = 0; i < this.vitalreport.user.length; i++) {
      //   if (this.vitalreport.user[i] === 0) {
      //     this.vitalreport.user.splice(i, 1);
      //   }
      // }
    }
    this.commonService.setLoader(false);
  }

  //Check Archive resident
  async isArchiveResi(event, checkResi) {
    if (checkResi === 'vital') {
      this.vitalreport.resident = '';
      this.reportOrg = this.vitalreport.organization;
      this.reportFac = this.vitalreport.facility;
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
    if (checkResi === 'vital') {
      this.vitalsReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    }
  }

  selectAll(checkTypeData) {
    if (this.allSelected.selected) {
      if (checkTypeData === 'vital_all') {
        this.vitalsReportForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
        for (var i = 0; i < this.vitalreport.user.length; i++) {
          if (this.vitalreport.user[i] === 0) {
            this.vitalreport.user.splice(i, 1);
          }
        }
      }

    } else {
      if (checkTypeData === 'vital_all') {
        this.vitalsReportForm.controls.user.patchValue([]);
      }
    }
  }

  selectUser(all, id, checkUser) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (checkUser === 'vital') {
      if (this.vitalsReportForm.controls.user.value.length == this.userlist.length)
        this.allSelected.select();

      for (var i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    }

  }

  async vitalsReportSubmit(report, isValid) {
    if (isValid) {
      this.isGroupByUsers = false;
      this.isGroupByResident = false;
      this.resultcount = false;
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
      this.selected_end_date = this.end_date;
      this.selected_start_date = this.start_date;
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
        facId: this.vitalreport.facility,
        orgId: this.vitalreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone
      };
      console.log('---vitals report payload-----', payload)
      // return
      let rList = this.residentslist.length;
      let uList = this.userlist.length;
      let virusReportUserResdLength = { 'userLength': uList, 'residentLength': rList };
      sessionStorage.setItem('virusReportUserResdLength', JSON.stringify(virusReportUserResdLength));
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      //this.router.navigate(['/reports/vitalsreport']);
      this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      this.end_date = this.data.end_date;
      this.start_date = this.data.start_date;
      this.userName = this.data.userName;
      this.shiftNo = this.data.shift;
      this.loadReport();
    } else {
      return;
    }
  }

  cancelVital() {
    this.vitalreport.isachive = false;
    this.vitalreport.isresident = false;
    this.dialogRefs.close();
  }

  getCurrentView() {
    let orignlLength = JSON.parse(sessionStorage.getItem('virusReportUserResdLength'));
    let selectedUserLength = this.data.userId.length;
    let selectedResidentLength = this.data.residentId.length;
    let totalUserInFac = orignlLength.userLength;
    let totalResInFac = orignlLength.residentLength + 1;
    console.log(selectedUserLength,selectedResidentLength, totalUserInFac, totalResInFac );
    if (selectedUserLength == totalUserInFac && selectedResidentLength == totalResInFac) {
      this.isListAll = true;
      this.isGroupByUsers = false;
      this.isGroupByResident = false;
    } else if (selectedUserLength < totalUserInFac && selectedResidentLength == totalResInFac) {
      this.isGroupByUsers = true;
      this.isGroupByResident = false;
      this.isListAll = false;
    } else if (selectedUserLength == totalUserInFac && selectedResidentLength < totalResInFac) {
      this.isGroupByResident = true;
      this.isGroupByUsers = false;
      this.isListAll = false;
    } else if (selectedUserLength < totalUserInFac && selectedResidentLength < totalResInFac) {
      this.isGroupByResident = true;
      this.isGroupByUsers = false;
      this.isListAll = false;
    }
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
