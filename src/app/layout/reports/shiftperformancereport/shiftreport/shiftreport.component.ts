import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  HostListener,
  TemplateRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { Router } from '@angular/router';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as _ from 'underscore';
import * as xlsx from 'xlsx';
import * as asyncfunc from 'async';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Rx';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
} from '@angular/material/dialog';

import { ApiService } from './../../../../shared/services/api/api.service';
import { CommonService } from './../../../../shared/services/common.service';
import { insertRefFn } from './../../../../shared/store/shiftReport/action';
import { ExcelService } from './../../../../shared/services/excel.service';

interface shiftRepState {
  _shiftRep: object;
}

@Component({
  selector: 'app-shiftreport',
  templateUrl: './shiftreport.component.html',
  styleUrls: ['./shiftreport.component.scss'],
})
export class ShiftreportComponent implements OnInit {
  timezone: any;
  shiftArr;
  utc_offset: any;
  userlist;
  floorlist;
  private subscription: Subscription;
  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private excelService: ExcelService,
    private _shiftRep: Store<shiftRepState>,
    private toastr: ToastrService,
    private exportAsService: ExportAsService,
    public commonService: CommonService,
    public dialog: MatDialog,
    private router: Router
  ) { }

  @ViewChild('shiftPerformance', { static: true })
  shiftPerformance: TemplateRef<any>;
  @ViewChild('allSelected', { static: true }) private allSelected: MatOption;
  @ViewChild('selectedResident', { static: true })
  private selectedResident: MatOption;
  @ViewChild('dateRangePicker', { static: true }) dateRangePicker;
  public doc: any;
  alwaysShowCalendars: boolean;
  ranges: any = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [
      moment().subtract(1, 'month').startOf('month'),
      moment().subtract(1, 'month').endOf('month'),
    ],
  };
  range: Range = { fromDate: new Date(), toDate: new Date() };

  countReportvalue;
  boxResultvalue;
  userResults = {};
  selectShift;
  shiftNo;
  shiftId;
  shiftName;
  residentList;
  data;
  start_date;
  end_date;
  userName;
  dialogRefs;
  ShiftreportForm: FormGroup;
  usrSearch = '';
  shiSearch = '';
  resultcount;
  isShow: boolean;
  topPosToStartShowing = 100;
  sTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
  shiftData;
  newDate1 = moment();
  newDate2 = moment();
  eTime;
  isachive_status;
  isresident_status;
  allresident = false;
  reportOrg;
  reportFac;
  residentOrg;
  residentFac;
  exportArr = [];
  allUserData: any;
  margins = {
    top: 100,
    bottom: 50,
    left: 25,
    right: 30,
    width: 550,
  };
  shiftperformancereport: any = {
    organization: '',
    facility: '',
    shift: '',
    shiftType: '',
    user: '',
    isachive: false,
  };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  columnNames = [
    {
      id: 'Employee',
      value: 'Employee',
      title: 'Employee',
      name: 'Employee',
      dataKey: 'Employee',
    },
    {
      id: 'Total_Cares_Performed',
      value: 'Total Cares Performed',
      title: 'Total Cares Performed',
      name: 'Total Cares Performed',
      dataKey: 'Total_Cares_Performed',
    },
    {
      id: 'Time_on_Care',
      value: 'Time on Care',
      title: 'Time on Care',
      name: 'Time on Care',
      dataKey: 'Time_on_Care',
    },
    {
      id: 'Time_Unassigned',
      value: 'Time Unassigned',
      title: 'Time Unassigned',
      name: 'Time Unassigned',
      dataKey: 'Time_Unassigned',
    },
    {
      id: 'Total_Time',
      value: 'Total Time',
      title: 'Total Time',
      name: 'Total Time',
      dataKey: 'Total_Time',
    },
  ];

  columnNames_1 = [
    {
      id: 'Resident',
      value: 'Resident',
      title: 'Resident',
      name: 'Resident',
      dataKey: 'Resident',
    },
    {
      id: 'Level',
      value: 'Level',
      title: 'Level',
      name: 'Level',
      dataKey: 'Level',
    },
    {
      id: 'Room',
      value: 'Room',
      title: 'Room',
      name: 'Room',
      dataKey: 'Room',
    },
    {
      id: 'Care',
      value: 'Care',
      title: 'Care',
      name: 'Care',
      dataKey: 'Care',
    },
    {
      id: 'Outcome',
      value: 'Outcome',
      title: 'Outcome',
      name: 'Outcome',
      dataKey: 'Outcome',
    },
    {
      id: 'Total_Minutes',
      value: 'Total Minutes',
      title: 'Total Minutes',
      name: 'Total Minutes',
      dataKey: 'Total_Minutes',
    },
    {
      id: 'Performed_Date',
      value: 'Performed Date',
      title: 'Performed Date',
      name: 'Performed Date',
      dataKey: 'Performed_Date',
    },
    {
      id: 'Note',
      value: 'Note',
      title: 'Note',
      name: 'Note',
      dataKey: 'Note',
    },
  ];

  @ViewChild('content', { static: true }) content: ElementRef;
  @HostListener('window:scroll')
  checkScroll() {
    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop
    // returns the same result in all the cases. window.pageYOffset is not supported below IE 9.
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  // TODO: Cross browsing
  gotoTop() {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }
  ngOnInit() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
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

    this.subscription = this.commonService.contentdata.subscribe(
      (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          // console.log('--facility timezone--',contentVal)
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
          console.log('---timezone---', this.timezone, this.utc_offset);
        }
      }
    );
    this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
    console.log(this.data);
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.shiftId = this.data.shift.no;
    this.shiftName = this.data.shift.name;
    this.loadReport();
  }

  async loadReport() {
    // console.log('---in load report--------')
    this.commonService.setLoader(true);
    const action = { type: 'POST', target: 'reports/shift_count_new' };
    const payload = this.data;
    const result = await this.apiService.apiFn(action, payload);
    this.residentList = result['data']['reports']['reportValue'];
    this.countReportvalue = result['data']['reports']['reportValue'];
    this.boxResultvalue = result['data']['reports']['totalReport'];
    if (this.shiftNo === 0) {
      this.selectShift = 'All Shifts';
    } else if (this.shiftNo === 1) {
      this.selectShift = '1st Shift (6:00am - 2:00pm)';
    } else if (this.shiftNo === 2) {
      this.selectShift = '2nd Shift (2:00pm - 10:00pm)';
    } else {
      this.selectShift = '3rd Shift (10:00pm - 6:00am)';
    }
    // if (this.shiftNo === 1) {
    //   this.selectShift = '1st Shift (6:00am - 2:00pm)';
    // } else if (this.shiftNo === 2) {
    //   this.selectShift = '2nd Shift (2:00pm - 10:00pm)';
    // } else {
    //   this.selectShift = '3rd Shift (10:00pm - 6:00am)';
    // }
    // this.selectShift=this.shiftName
    if (this.residentList && this.residentList.length > 0) {
      this.resultcount = true;
    } else {
      this.resultcount = false;
    }
    this.commonService.setLoader(false);
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  async setupPresets() {
    const backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    };

    const startOfMonth = (month, year) => {
      return new Date(year, month, 1);
    };

    const endOfMonth = (month, year) => {
      return new Date(year, month + 1, 0);
    };

    const today = new Date();
    const yesterday = backDate(1);
    const minus7 = backDate(7);
    const minus30 = backDate(30);
    const monthFirstDate = startOfMonth(today.getMonth(), today.getFullYear());
    const monthEndDate = endOfMonth(today.getMonth(), today.getFullYear());
    const lastMonthFirstDate = startOfMonth(
      today.getMonth() - 1,
      today.getFullYear()
    );
    const LastMonthEndDate = endOfMonth(
      today.getMonth() - 1,
      today.getFullYear()
    );

    this.presets = [
      { presetLabel: 'Today', range: { fromDate: today, toDate: today } },
      {
        presetLabel: 'Yesterday',
        range: { fromDate: yesterday, toDate: today },
      },
      {
        presetLabel: 'Last 7 Days',
        range: { fromDate: minus7, toDate: today },
      },
      {
        presetLabel: 'Last 30 Days',
        range: { fromDate: minus30, toDate: today },
      },
      {
        presetLabel: 'This Month',
        range: { fromDate: monthFirstDate, toDate: monthEndDate },
      },
      {
        presetLabel: 'Last Month',
        range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate },
      },
      {
        presetLabel: 'Custom Range',
        range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate },
      },
    ];
  }

  async getData(userID) {
    console.log('---in get data--------');
    this.commonService.setLoader(true);
    const action = { type: 'POST', target: 'reports/shift_report_new' };
    const payload = this.data;

    payload.user_id = userID;
    const result = await this.apiService.apiFn(action, payload);
    const finaldata = result['data']['_report'];

    const action1 = { type: 'POST', target: 'reports/shiftLgonNLogout' };
    payload.user_id = userID;
    const result1 = await this.apiService.apiFn(action1, payload);
    if (
      result1['data']['careTypeData'] &&
      result1['data']['careTypeData'].length > 0
    ) {
      const newArray = await result1['data']['careTypeData'].reduce(
        (obj, item) => {
          let o = {
            residentList: [
              {
                CtotalMinutes: 0,
                Notes: '',
                care: '',
                level: '',
                outcome: item.activity_name, // === 'iOS: Logout Successful'?'Logout':'Login',
                performedDate: item.date,
                residentName: '',
                room: '',
                roomDate: '',
                roomId: '',
                totalMinutes: 0,
              },
            ],
            total: 'total',
          };
          obj.push(o);
          return obj;
        },
        []
      );

      if (newArray && newArray.length > 0) {
        this.userResults[userID] = [...finaldata, ...newArray];
        this.userResults[userID] = _.sortBy(
          this.userResults[userID],
          function (o) {
            return -o.residentList[0].performedDate;
          }
        );
      }
    } else {
      this.userResults[userID] = finaldata;
    }
    console.log('this.userResults[userID]---->', this.userResults[userID]);
    this.commonService.setLoader(false);
    return this.userResults[userID];
  }

  async expandPanel(userID) {
    event.stopPropagation();
    if (!this.userResults.hasOwnProperty(userID)) {
      await this.getData(userID);
    }
  }

  formatDate(time) {
    if (time) {
      const secondTime = moment(time).format('ss');
      const secondPTime = parseInt(secondTime);
      if (secondPTime < 30) {
        const utcDate = moment.utc(time);
        const tzdate = utcDate.clone().tz(this.timezone);

        return tzdate.format('MMMM Do YYYY, hh:mm A');
      } else {
        const utcDate = moment.utc(time);
        const tzdate = utcDate.clone().tz(this.timezone);

        return tzdate.add(1, 'minutes').format('MMMM Do YYYY, hh:mm A');
      }
    } else {
      return '';
    }
  }

  formattedTime(ms: any) {
    const formattedTime = this.commonService.createTime(+ms);
    if (formattedTime)
      return formattedTime;
    else
    return 0;
  }

  headerFooterFormatting(doc, totalPages) {
    for (let i = totalPages; i >= 1; i--) {
      doc.setPage(i);
      // header
      this.header(doc);

      this.footer(doc, i, totalPages);
      doc.page++;
    }
  }

  header(doc) {
    doc.printHeaders = false;
    doc.printingHeaderRow = false;
    doc.tableHeaderRow = [[]];
    // if (base64Img) {
    //   doc.addImage(base64Img, 'JPEG', this.margins.left, 10, 40, 40);
    // }

    // doc.text('Report Header Template', this.margins.left + 50, 40);
  }
  footer(doc, pageNumber, totalPages) {
    const str = 'Page ' + pageNumber + ' of ' + totalPages;

    // doc.setFontSize(10);
    doc.text(str, this.margins.left, doc.internal.pageSize.height - 20);
  }

  async download(userId) {
    const startDate = this.getDateFromTimezone(this.start_date);
    const endDate = this.getDateFromTimezone(this.end_date);
    const shiftReport = await this.prepareForExportPDF(
      userId,
      startDate,
      endDate
    );
  }

  async prepareForExportPDF(userId, startDate, endDate) {
    let arr = [];
    const shiftreport = [];
    if (this.userResults.hasOwnProperty(userId)) {
      arr = this.userResults[userId];
    } else {
      await this.getData(userId);
      arr = this.userResults[userId];
    }

    this.doc = undefined;
    this.doc = new jsPDF();

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.userName}`, 20, 30);
    this.doc.text(
      `${moment(startDate).format('L')}-${moment(endDate).format('L')}`,
      20,
      34
    );
    this.doc.text(`${this.selectShift}`, 20, 38);

    const userCountData = this.countReportvalue.reduce((obj, item) => {
      if (item.userData.userId == userId) {
        obj = item;
      }
      return obj;
    }, {});
    const table1Data = {
      Employee:
        userCountData.userData.last_name +
        ', ' +
        userCountData.userData.first_name,
      Total_Cares_Performed: userCountData.report.totalCare,
      Time_on_Care: this.formattedTime(userCountData.report.totalCareTime),
      Time_Unassigned: this.formattedTime(
        userCountData.report.totalUnassignedTime
      ),
      Total_Time: this.formattedTime(userCountData.report.totalTime),
    };

    await this.doc.autoTable(this.columnNames, [table1Data], {
      headStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal',
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20,
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
        valign: 'middle',
      },
      theme: 'plain',
      columnStyles: {
        Notes: {
          cellWidth: 120,
        },
      },
      drawRow: (row, data) => {
        if (row.index === 0 && row.raw == 'No visits tracked') {
          this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
          this.doc.autoTableText(
            row.raw,
            data.settings.margin.left + data.table.width / 2,
            row.y + row.height / 2,
            {
              halign: 'center',
              valign: 'middle',
            }
          );
          return false;
        }
      },
    });

    arr.forEach((item) => {
      item.residentList.forEach((obj) => {
        shiftreport.push({
          Resident: obj.residentName,
          Level: obj.level,
          Room: obj.room,
          Care: obj.care,
          Outcome: obj.outcome,
          Total_Minutes: this.formattedTime(obj.totalMinutes),
          Performed_Date: obj.performedDate
            ? this.formatDate(obj.performedDate)
            : '--', // new Date(obj.performedDate),
          Note: obj.Notes,
        });
      });
      shiftreport.push({
        Resident: 'Total',
        Level: null,
        Room: null,
        Care: null,
        Outcome: null,
        Total_Minutes:
          item.total == 'total' ? ' ' : this.formattedTime(item.total),
        Performed_Date: null,
        Note: null,
      });
    });

    await this.doc.autoTable(this.columnNames_1, shiftreport, {
      headStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal',
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      startY: 60,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20,
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
        valign: 'middle',
      },
      theme: 'plain',
      columnStyles: {
        Notes: {
          cellWidth: 120,
        },
      },
      // drawRow: (row, data) => {
      //   if (row.index === 0 && row.raw == 'No visits tracked') {
      //     this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
      //     this.doc.autoTableText(row.raw, data.settings.margin.left + data.table.width / 2, row.y + row.height / 2, {
      //       halign: 'center',
      //       valign: 'middle'
      //     });
      //     return false;
      //   }
      // }
    });

    this.doc.save('Shift performance report');
    this.commonService.setLoader(false);
  }

  downloadAll() {
    const startDate = this.getDateFromTimezone(this.start_date);
    const endDate = this.getDateFromTimezone(this.end_date);
    const thisObj = this;

    asyncfunc.eachOfSeries(
      this.countReportvalue,
      function (item, i, callback) {
        if (thisObj.userResults.hasOwnProperty(item.userData.userId)) {
          callback(null, true);
        } else {
          thisObj.getData(item.userData.userId).then((res) => {
            callback(null, true);
          });
        }
      },
      function (err, result) {
        if (err) {
        } else {
          let shiftReport = thisObj.prepareForExportAllPDF(startDate, endDate);
        }
      }
    );
  }

  async prepareForExportAllPDF(startDate, endDate) {
    const shiftreport = [];

    this.doc = undefined;
    this.doc = new jsPDF();

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.userName}`, 20, 30);
    this.doc.text(
      `${moment(startDate).format('L')}-${moment(endDate).format('L')}`,
      20,
      34
    );
    this.doc.text(`${this.selectShift}`, 20, 38);

    const totalReport = [];
    const userCountData = this.countReportvalue;
    userCountData.forEach((item) => {
      const table1Data = {
        Employee: item.userData.last_name + ', ' + item.userData.first_name,
        Total_Cares_Performed: item.report.totalCare,
        Time_on_Care: this.formattedTime(item.report.totalCareTime),
        Time_Unassigned: this.formattedTime(item.report.totalUnassignedTime),
        Total_Time: this.formattedTime(
          item.report.totalCareTime + item.report.totalUnassignedTime
        ),
      };
      totalReport.push(table1Data);
    });

    await this.doc.autoTable(this.columnNames, totalReport, {
      headStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal',
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20,
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
        valign: 'middle',
      },
      theme: 'plain',
      columnStyles: {
        Notes: {
          cellWidth: 120,
        },
      },
      drawRow: (row, data) => {
        if (row.index === 0 && row.raw == 'No visits tracked') {
          this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
          this.doc.autoTableText(
            row.raw,
            data.settings.margin.left + data.table.width / 2,
            row.y + row.height / 2,
            {
              halign: 'center',
              valign: 'middle',
            }
          );
          return false;
        }
      },
    });

    let uu = this.countReportvalue;
    uu.forEach((i) => {
      let nameofuser = {
        Resident: i.userData.last_name + ', ' + i.userData.first_name,
        Level: '',
        Room: '',
        Care: '',
        Outcome: '',
        Total_Minutes: '',
        Performed_Date: '',
        Note: '',
      };
      shiftreport.push(nameofuser);

      this.userResults[i.userData.userId].forEach((item) => {
        item.residentList.forEach((obj) => {
          shiftreport.push({
            Resident: obj.residentName,
            Level: obj.level,
            Room: obj.room,
            Care: obj.care,
            Outcome: obj.outcome,
            Total_Minutes: this.formattedTime(obj.totalMinutes),
            Performed_Date: obj.performedDate
              ? this.formatDate(obj.performedDate)
              : '--', // new Date(obj.performedDate),
            // '     ': obj.performedDate ? moment(obj.performedDate).format('MMMM Do YYYY, HH:mm') : '--',//new Date(obj.performedDate),
            Note: obj.Notes,
          });
        });
        shiftreport.push({
          Resident: 'Total',
          Level: null,
          Room: null,
          Care: null,
          Outcome: null,
          Total_Minutes:
            item.total == 'total' ? ' ' : this.formattedTime(item.total),
          Performed_Date: null,
          Note: null,
        });
      });
    });

    await this.doc.autoTable(this.columnNames_1, shiftreport, {
      headStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal',
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      // startY: 60,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20,
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
        valign: 'middle',
      },
      theme: 'plain',
      columnStyles: {
        Notes: {
          cellWidth: 120,
        },
      },
      // drawRow: (row, data) => {
      //   if (row.index === 0 && row.raw == 'No visits tracked') {
      //     this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
      //     this.doc.autoTableText(row.raw, data.settings.margin.left + data.table.width / 2, row.y + row.height / 2, {
      //       halign: 'center',
      //       valign: 'middle'
      //     });
      //     return false;
      //   }
      // }
    });

    this.doc.save('Shift performance report');
    this.commonService.setLoader(false);
  }

  getDateFromTimezone(date) {
    const newDate = new Date(date).toLocaleString('en-US', {
      timeZone: this.timezone,
    });
    return new Date(newDate);
  }

  /* Shift Performance Start */
  /**
   * @author Umang Kothari
   * @datetime 13 oct 2020
   * @description This function is created to open shift performance report value.
   */
  openShiftPerformance() {
    // Pop Up Open
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.shiftPerformance, dialogConfig);

    // Load Mulit Value for Popup
    this.ShiftreportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      isachive: false,
      usrSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.shiftperformancereport.user = '';
          this.userlist = null;
          this.shiftperformancereport.organization = contentVal.org;
          this.shiftperformancereport.facility = contentVal.fac;
          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.shiftperformancereport.organization],
            facility: [this.shiftperformancereport.facility],
          };
          // var result = await this.apiService.apiFn(action, payload);
          // result = result['data'];
          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });
          this.userlist.sort(function (a, b) {
            const nameA = a.value.toUpperCase(),
              nameB = b.value.toUpperCase();
            if (nameA < nameB) {
              // sort string ascending
              return -1;
            }
            if (nameA > nameB) { return 1; }
            return 0; // default return value (no sorting)
          });
          this.ShiftreportForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          for (let i = 0; i < this.shiftperformancereport.user.length; i++) {
            if (this.shiftperformancereport.user[i] === 0) {
              this.shiftperformancereport.user.splice(i, 1);
            }
          }
          // this.getShift()
          this.commonService.setLoader(false);
        }
      }
    );
    this.subscription = this.commonService.floorcontentdata.subscribe(
      async (data: any) => {
        if (data) {
          this.floorlist = data;
        }
      }
    );
  }

  /**
   * @author Umang Kothari
   * @param range
   */
  updateRange(range: Range) {
    var today_st = moment();
    var today_ed = moment();
    var today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    var today_end = today_ed.set({
      hour: 23,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    if (range['startDate'] && range['startDate']['_d']) {
      // console.log('---d exist  startdate')
      range['startDate'] = range['startDate'].set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      this.start_date = range['startDate']['_d'].getTime();
    } else if (range.fromDate) {
      //This condition for new Date Picker
      range['fromDate'] = moment(range['fromDate'])
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .toDate();
      this.start_date = range.fromDate.getTime();
    } else {
      //  console.log('---d not exist  startdate')
      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      // console.log('---d exist  endate')
      range['endDate'] = range['endDate'].set({
        hour: 23,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      this.end_date = range['endDate']['_d'].getTime();
    } else if (range.toDate) {
      range['toDate'] = moment(range['toDate'])
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .toDate();
      this.end_date = range.toDate.getTime();
    } else {
      // console.log('---d not exist  endate')
      this.end_date = today_end['_d'].getTime();
    }
    /*     console.log('range in local timezone', this.start_date, this.end_date)
    console.log('range in facility timezone', moment(moment(this.start_date)).tz(this.timezone, true).valueOf(), moment(moment(this.end_date)).tz(this.timezone, true).valueOf()) */
  }

  cancelShift() {
    this.shiftperformancereport.isachive = false;
    this.dialogRefs.close();
  }

  async isArchiveData(event, checkType) {
    console.log(checkType, event);
    if (checkType === 'shift') {
      this.shiftperformancereport.user = '';
      this.reportOrg = this.shiftperformancereport.organization;
      this.reportFac = this.shiftperformancereport.facility;
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
      target: 'users/get_users_org_fac',
    };
    const payload = {
      organization: [this.reportOrg],
      facility: [this.reportFac],
      isAchive_data: this.isachive_status,
    };

    var result = await this.apiService.apiFn(action, payload);
    console.log(result);
    this.userlist = null;
    this.userlist = await result['data'].map(function (obj) {
      var robj = {};
      robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['_id'] = obj._id;
      return robj;
    });
    this.userlist.sort(function (a, b) {
      var nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB)
        //sort string ascending
        return -1;
      if (nameA > nameB) return 1;
      return 0; //default return value (no sorting)
    });

    this.commonService.setLoader(false);
  }

  selectAll(checkTypeData) {
    if (this.allSelected.selected) {
      if (checkTypeData === 'shift_all') {
        this.ShiftreportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.shiftperformancereport.user.length; i++) {
          if (this.shiftperformancereport.user[i] === 0) {
            this.shiftperformancereport.user.splice(i, 1);
          }
        }
      }
    } else {
      if (checkTypeData === 'shift_all') {
        this.ShiftreportForm.controls.user.patchValue([]);
      }
    }
  }

  selectUser(all, id, checkUser) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (checkUser === 'shift') {
      if (
        this.ShiftreportForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.shiftperformancereport.user.length; i++) {
        if (this.shiftperformancereport.user[i] === 0) {
          this.shiftperformancereport.user.splice(i, 1);
        }
      }
    }
  }

  changeShiftPer(shiftNo) {
    this.shiftData = shiftNo;
    shiftNo = this.shiftData.no;
    // console.log('---shift id-----',shiftNo)
    // return;
    this.newDate1 = moment();
    this.newDate2 = moment();
    if (shiftNo == 1) {
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo == 2) {
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo == 3) {
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
  }

  changeShiftForVitals(shiftNo) {
    let zone = this.timezone;

    this.newDate1 = moment.tz(zone);
    this.newDate2 = moment.tz(zone);

    // this.newDate1 = moment();
    // this.newDate2 = moment();

    if (shiftNo === 0) {
      this.shiftperformancereport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.shiftperformancereport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.shiftperformancereport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.shiftperformancereport.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
    console.log(
      '------shift changing time hours------',
      this.sTime,
      this.eTime
    );
  }

  /**
   * @author Umang Kothari
   * @description Run Shift performance Report
   * @param report
   * @param isValid
   */
  async shiftPerformanceSubmit(report, isValid) {
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

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // ee = moment(moment(this.end_date)).tz(this.timezone,true);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.shiftperformancereport.facility,
        orgId: this.shiftperformancereport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };
      console.log('--cirus report payload-----', payload);
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      this.end_date = this.data.end_date;
      this.start_date = this.data.start_date;
      this.userName = this.data.userName;
      this.shiftNo = this.data.shift;
      this.loadReport();
      // this.commonService.setLoader(true);
      // let shift_name = ''

      // if (report.shift.name === 'shift 1 (06:00 AM - 02:00 PM)') {
      //   shift_name = '1st Shift (6:00am - 2:00pm)';
      // } else if (report.shift.name === 'shift 2 (02:00 PM - 10:00 PM)') {
      //   shift_name = '2nd Shift (2:00pm - 10:00pm)';
      // } else {
      //   shift_name = '3rd Shift (10:00pm - 6:00am)';
      // }
      // const s = moment(this.start_date);
      // let e;
      // if (report.shift.no === 3) {
      //   e = moment(this.end_date).add(1, 'day');
      // } else {
      //   e = moment(this.end_date);
      // }
      // s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      // e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      // // const s = moment(this.start_date);
      // // let e= moment(this.end_date);
      // this.start_date = s['_d'].getTime();
      // this.end_date = e['_d'].getTime();
      // let ss, ee;

      // ss = moment(moment(this.start_date)).tz(this.timezone, true);
      // ee = moment(moment(this.end_date)).tz(this.timezone, true);

      // this.start_date = moment(moment(this.start_date)).tz(this.timezone, true).valueOf();
      // this.end_date = moment(moment(this.end_date)).tz(this.timezone, true).valueOf();

      // this.sTimeUTC = ss.utc().hours();
      // this.eTimeUTC = ee.utc().hours();
      // this.sMinute = ss.utc().minutes();
      // this.eMinute = ee.utc().minutes();

      // const payload = {
      //   'shift': report.shift,
      //   shiftData: this.shiftData,
      //   'start_date': this.start_date,
      //   'end_date': this.end_date,
      //   'userId': report.user,
      //   sTimeUTC: this.sTimeUTC,
      //   eTimeUTC: this.eTimeUTC,
      //   facId: this.shiftperformancereport.facility,
      //   sMinute: this.sMinute,
      //   eMinute: this.sMinute
      // };
      // console.log('-----data-------', payload)
      // // return
      // this._shiftRep.dispatch(insertRefFn(payload));
      // this.dialogRefs.close();
      // this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      // this.end_date = this.data.end_date;
      // this.start_date = this.data.start_date;
      // this.userName = this.data.userName;
      // this.shiftNo = this.data.shift;
      // this.shiftId=this.data.shift.no
      // this.shiftName=this.data.shift.name
      // this.commonService.setLoader(false);
      // this.loadReport();
      // //this.router.getCurrentNavigation();
    } else {
      return;
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
