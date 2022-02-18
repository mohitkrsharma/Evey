import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  HostListener,
  TemplateRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
} from '@angular/material/dialog';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as _ from 'underscore';
import * as xlsx from 'xlsx';
import * as asyncfunc from 'async';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Rx';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from 'src/app/shared/services/api/api.service';
import { ExcelService } from './../../../../shared/services/excel.service';
import { CommonService } from './../../../../shared/services/common.service';
import { insertRefFn } from './../../../../shared/store/shiftReport/action';

interface shiftRepState {
  _shiftRep: object;
}

@Component({
  selector: 'app-roomcleanreport',
  templateUrl: './roomcleanreport.component.html',
  styleUrls: ['./roomcleanreport.component.scss'],
})
export class RoomCleanReportComponent implements OnInit {
  careIdName: any;
  doc: any;

  timezone: any;
  utc_offset: any;
  private subscription: Subscription;
  expandPanelContent: any;
  tableData: any[] = [];
  finalTableData: any[] = [];
  userWiseRoomClean: any[] = [];
  constructor(
    private router: Router,
    private apiService: ApiService,
    private fb: FormBuilder,
    private excelService: ExcelService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private _shiftRep: Store<shiftRepState>,
    private exportAsService: ExportAsService,
    public commonService: CommonService
  ) {}

  @ViewChild('houseReport', { static: true }) houseReport: TemplateRef<any>;
  @ViewChild('allSelected', { static: true }) private allSelected: MatOption;
  @ViewChild('selectedResident', { static: true })
  private selectedResident: MatOption;
  @ViewChild('dateRangePicker', { static: true }) dateRangePicker;

  countReportvalue;
  boxResultvalue;
  userResults = {};
  selectShift;
  shiftNo;
  residentList;
  data;
  start_date;
  end_date;
  userName;
  resultcount;
  isShow: boolean;
  topPosToStartShowing = 100;
  sTime;
  eTime;
  exportArr = [];
  usrSearch = '';
  shiSearch = '';
  usSearch = '';
  rSearch = '';
  allUserData: any;
  margins = {
    top: 100,
    bottom: 50,
    left: 25,
    right: 30,
    width: 550,
  };

  alwaysShowCalendars: boolean;
  floorlist;
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
  facility: any = '';
  organization: any = '';
  //House Keeping
  roomcleanreport: any = {
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
  async ngOnInit() {
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
          this.facility = contentVal.fac;
          this.organization = contentVal.org;
          console.log('---timezone---', this.timezone, this.utc_offset);
        }
      }
    );
    this.load_careIdName();
    this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.loadReport();
  }

  async loadReport() {
    this.commonService.setLoader(true);
    const action = { type: 'POST', target: 'reports/roomCleanReport' };
    const payload = this.data;

    const result = await this.apiService.apiFn(action, payload);
    this.residentList = result['data']['reports']['reportValue'];
    console.log('this.residentList ===>>', this.residentList);
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
    if (this.residentList && this.residentList.length > 0) {
      this.resultcount = true;
    } else {
      this.resultcount = false;
    }
    this.commonService.setLoader(false);
  }

  async setupPresets() {
    let backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    };

    let startOfMonth = (month, year) => {
      return new Date(year, month, 1);
    };

    let endOfMonth = (month, year) => {
      return new Date(year, month + 1, 0);
    };

    let today = new Date();
    let yesterday = backDate(1);
    let minus7 = backDate(7);
    let minus30 = backDate(30);
    let monthFirstDate = startOfMonth(today.getMonth(), today.getFullYear());
    let monthEndDate = endOfMonth(today.getMonth(), today.getFullYear());
    let lastMonthFirstDate = startOfMonth(
      today.getMonth() - 1,
      today.getFullYear()
    );
    let LastMonthEndDate = endOfMonth(
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
    const ind = this.countReportvalue.findIndex(
      (item) => item.userData._id == userID
    );
    if (ind > -1) {
      this.userResults[userID] = this.countReportvalue[ind].records;
      this.commonService.setLoader(false);
      return this.userResults[userID];
    }
  }

  async load_careIdName() {
    const action = {
      type: 'GET',
      target: 'cares/careIdName',
    };
    const payload = {};
    let result = await this.apiService.apiFn(action, payload);
    this.careIdName = result['data'];
  }

  trackcareDetail(_arr) {
    _arr = _arr.filter((_item) => {
      for (const property in _item) {
        if (
          _item[property] &&
          _item[property].length > 0 &&
          Array.isArray(_item[property])
        ) {
          return (_item[property] = _item[property].filter((__item) => {
            for (const property in __item) {
              if (__item[property] != 'Performed') {
                return true;
              } else {
                return true;
              }
              // return (__item[property] != 'Performed') ? true : false;
            }
          }));
        }
      }
    });
    return _arr;
  }

  timeConvert(num) {
    let hours = num / 60;
    let rhours = Math.floor(hours);
    let minutes = (hours - rhours) * 60;
    let rminutes = Math.round(minutes);
    return rhours + ' hrs ' + rminutes + ' min';
  }

  formatDate(time, onlyTime = false) {
    if (time) {
      const secondTime = moment(time).format('ss');
      const secondPTime = parseInt(secondTime);
      if (onlyTime == false) {
        if (secondPTime < 30) {
          return moment(time).format('MMMM Do YYYY, hh:mm A');
        } else {
          return moment(time).add(1, 'minutes').format('MMMM Do YYYY, hh:mm A');
        }
      } else {
        if (secondPTime < 30) {
          return moment(time).format('hh:mm A');
        } else {
          return moment(time).add(1, 'minutes').format('hh:mm A');
        }
      }
    } else {
      return '';
    }
  }

  formatDate1(time) {
    if (time) {
      return moment(time).format('MMMM Do YYYY');
    } else {
      return '';
    }
  }

  roomCleanDate(item) {
    if (item && item.startTime && item.endTime) {
      let utcDate = moment.utc(item.startTime);
      let tzdate = utcDate.clone().tz(this.timezone);

      let utcEndDate = moment.utc(item.endTime);
      let tzEndDate = utcEndDate.clone().tz(this.timezone);

      return (
        tzdate.format('MMMM Do YYYY, hh:mm A') +
        ' - ' +
        tzEndDate.format('hh:mm A')
      );

      // return moment(item.startTime).format('MMMM Do YYYY, hh:mm A z') + ' - ' +  moment(item.endTime).format('hh:mm A z');
    } else {
      return '-';
    }
  }

  async expandPanel(userID) {
    event.stopPropagation();
    if (!this.userResults.hasOwnProperty(userID)) {
      await this.getData(userID);
    }
  }

  async getPrint() {
    let rentalPage = 0;

    this.doc = undefined;
    this.doc = new jsPDF('p', 'pt', 'letter');

    const _self = this;

    const pageHeight = 30; //(_self.doc.internal.pageSize.height / 2.4) + 135;
    _self.doc.setFontType('bold');
    _self.doc.setFontSize(16);
    _self.doc.text(`Unit Clean Report`, 30, pageHeight);

    _self.doc.setFontType('normal');
    _self.doc.setFontSize(11);
    _self.doc.text(
      `Report Generated by ${this.userName},  Western Home, Standard Center`,
      30,
      pageHeight + 15
    );
    _self.doc.text(`Shift :${this.selectShift}`, 30, pageHeight + 30);
    _self.doc.text(
      `${this.formatDate1(this.start_date)} - ${this.formatDate1(
        this.end_date
      )}`,
      30,
      pageHeight + 45
    );

    _self.doc.rect(50, pageHeight + 60, 140, 75);
    _self.doc.text(
      `${this.boxResultvalue.totalCarePerformed}`,
      100,
      pageHeight + 90
    );
    _self.doc.text(`Rooms Cleans Performed`, 60, pageHeight + 110);
    _self.doc.rect(240, pageHeight + 60, 140, 75);
    _self.doc.text(
      `${this.boxResultvalue.totalCareRefused}`,
      290,
      pageHeight + 90
    );
    _self.doc.text(`Refused Cleaning`, 250, pageHeight + 110);
    _self.doc.rect(430, pageHeight + 60, 140, 75);
    _self.doc.text(
      `${
        this.boxResultvalue.totalTime > 60
          ? this.timeConvert(this.boxResultvalue.totalTime)
          : this.boxResultvalue.totalTime + 'min'
      }`,
      440,
      pageHeight + 90
    );
    _self.doc.text(`Total Time`, 440, pageHeight + 110);

    setTimeout(() => {
      this.doc.autoPrint();
      window.open(this.doc.output('bloburl'), '_blank');
    }, 1000);
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
    let count;
    doc.printHeaders = false;
    doc.printingHeaderRow = false;
    doc.tableHeaderRow = [[]];
  }

  footer(doc, pageNumber, totalPages) {
    const str = 'Page ' + pageNumber + ' of ' + totalPages;
    doc.text(str, this.margins.left, doc.internal.pageSize.height - 20);
  }

  downloadAll() {
    let startDate = this.getDateFromTimezone(this.start_date);
    let endDate = this.getDateFromTimezone(this.end_date);
    let thisObj = this;

    asyncfunc.eachOfSeries(
      this.countReportvalue,
      function (item, i, callback) {
        if (thisObj.userResults.hasOwnProperty(item.userData._id)) {
          callback(null, true);
        } else {
          thisObj.getData(item.userData._id).then((res) => {
            callback(null, true);
          });
        }
      },
      function (err, result) {
        if (err) {
        } else {
          let shiftReport = thisObj.prepareForExportAll(startDate, endDate);
        }
      }
    );
  }

  columnNames = [
    {
      id: 'Performer',
      value: 'Performer',
      title: 'Performer',
      name: 'Performer',
      dataKey: 'Performer',
    },
    {
      id: 'Total_Cares_Performed',
      value: 'Total Cares Performed',
      title: 'Total Cares Performed',
      name: 'Total Cares Performed',
      dataKey: 'Total_Cares_Performed',
    },
    {
      id: 'Total_Cares_Refused',
      value: 'Total Cares Refused',
      title: 'Total Cares Refused',
      name: 'Total Cares Refused',
      dataKey: 'Total_Cares_Refused',
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
      id: 'Rooms_Cleans_Performed',
      value: 'Rooms Cleans Performed',
      title: 'Rooms Cleans Performed',
      name: 'Rooms Cleans Performed',
      dataKey: 'Rooms_Cleans_Performed',
    },
    {
      id: 'Refused_Cleaning',
      value: 'Refused Cleaning',
      title: 'Refused Cleaning',
      name: 'Refused Cleaning',
      dataKey: 'Refused_Cleaning',
    },
    {
      id: 'Total_Time',
      value: 'Total Time',
      title: 'Total Time',
      name: 'Total Time',
      dataKey: 'Total_Time',
    },
  ];
  columnNames_2 = [
    {
      id: 'Rooms_Cleans_Performed',
      value: 'Rooms Cleans Performed',
      title: 'Rooms Cleans Performed',
      name: 'Rooms Cleans Performed',
      dataKey: 'Rooms_Cleans_Performed',
    },
    {
      id: 'Refused_Cleaning',
      value: 'Refused Cleaning',
      title: 'Refused Cleaning',
      name: 'Refused Cleaning',
      dataKey: 'Refused_Cleaning',
    },
    {
      id: 'Total_Time',
      value: 'Total Time',
      title: 'Total Time',
      name: 'Total Time',
      dataKey: 'Total_Time',
    },
  ];
  async prepareForExportAll(startDate, endDate) {
    var arr = [];
    let shiftreport = [];

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

    let table1Val = {
      Rooms_Cleans_Performed: this.boxResultvalue.totalCarePerformed,
      Refused_Cleaning: this.boxResultvalue.totalCareRefused,
      Total_Time:
        this.boxResultvalue.totalTime > 60
          ? this.timeConvert(this.boxResultvalue.totalTime)
          : this.boxResultvalue.totalTime + 'min',
    };

    await this.doc.autoTable(this.columnNames_1, [table1Val], {
      headerStyles: {
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
          columnWidth: 120,
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

    let userCountData = this.countReportvalue;
    userCountData.forEach((item) => {
      let table1Data = {
        Performer: item.userData.last_name + ', ' + item.userData.first_name,
        Total_Cares_Performed: item.total_performed,
        Total_Cares_Refused: item.total_refused,
        Total_Time:
          item.total_min > 60
            ? this.timeConvert(item.total_min)
            : item.total_min + 'min',
      };
      shiftreport.push(table1Data);
    });

    let uu = this.countReportvalue;
    uu.forEach((i) => {
      let nameofuser = {
        Performer: 'Performer:',
        Total_Cares_Performed:
          i.userData.last_name + ', ' + i.userData.first_name,
        Total_Cares_Refused: '',
        Total_Time: '',
      };
      shiftreport.push(nameofuser);

      this.userResults[i.userData._id].forEach((item) => {
        let _dateTime = {
          Performer: `${this.roomCleanDate(item)}`,
          Total_Cares_Performed: '',
          Total_Cares_Refused: '',
          Total_Time: '',
        };
        let residentName = {
          Performer: 'Resident',
          Total_Cares_Performed: `${item.residentData.last_name}, ${item.residentData.first_name} `,
          Total_Cares_Refused: '',
          Total_Time: '',
        };

        // let _residentDeatil = {
        //   'Room Clean Report': `${item.residentData.last_name}, ${item.residentData.first_name} `
        // };

        let roomName = {
          Performer: 'Room',
          Total_Cares_Performed: `${item.roomData.room} `,
          Total_Cares_Refused: '',
          Total_Time: '',
        };

        // let _room = {
        //   'Room Clean Report': `${item.roomData.room} `
        // };

        let statusName = {
          Performer: 'status',
          Total_Cares_Performed: `${item.resident_status}`,
          Total_Cares_Refused: '',
          Total_Time: '',
        };

        // let _status = {
        //   'Room Clean Report': `${item.resident_status}`
        // };

        let totalTime = {
          Performer: 'Total Time',
          Total_Cares_Performed: `${item.totalMin}min`,
          Total_Cares_Refused: '',
          Total_Time: '',
        };

        // let _totalTime = {
        //   'Room Clean Report': `${item.totalMin}min`
        // };

        shiftreport.push(
          _dateTime,
          residentName,
          roomName,
          statusName,
          totalTime
        );

        let userCareheading = {
          Performer: 'Care',
          Total_Cares_Performed: 'Outcome',
          Total_Cares_Refused: 'Notes',
          Total_Time: '',
        };
        shiftreport.push(userCareheading);

        item.items.forEach((obj) => {
          shiftreport.push({
            Performer:
              obj.careData.type == 'room_cleaning' ? obj.careData.name : '',
            Total_Cares_Performed: obj.care_value,
            Total_Cares_Refused: obj.care_notes,
            Total_Time: '',
          });
          if (
            obj.careData.type == 'room_cleaning' &&
            obj.track_details &&
            obj.care_value != 'Refused' &&
            obj.track_details.arr_room_clean
          ) {
            let _arr = this.trackcareDetail(obj.track_details.arr_room_clean);
            _arr.forEach((itm) => {
              for (const property in itm) {
                if (itm[property].length > 0) {
                  let _care = this.careIdName[property];

                  itm[property].forEach((val) => {
                    for (const property1 in val) {
                      let _subCare = {
                        Performer: `${_care}--${this.careIdName[property1]}--${val[property1]}`,
                        Total_Cares_Performed: '',
                        Total_Cares_Refused: '',
                        Total_Time: '',
                      };
                      shiftreport.push(_subCare);
                    }
                  });
                }
              }
            });
          }
        });
      });
    });

    await this.doc.autoTable(this.columnNames, shiftreport, {
      headerStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal',
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      // startY: 42,
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
          columnWidth: 120,
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
    this.doc.save('Unit Clean Report');
    this.commonService.setLoader(false);
  }

  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString('en-US', {
      timeZone: this.timezone,
    });
    return new Date(newDate);
  }

  openHouseKeeping() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.houseReport, dialogConfig);

    this.houseReportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      isresident: false,
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shift' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.roomcleanreport.organization = contentVal.org;
          this.roomcleanreport.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.roomcleanreport.organization],
            facility: [this.roomcleanreport.facility],
          };

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
            if (nameA > nameB) {
              return 1;
            }
            return 0; // default return value (no sorting)
          });
          this.houseReportForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          for (let i = 0; i < this.roomcleanreport.user.length; i++) {
            if (this.roomcleanreport.user[i] === 0) {
              this.roomcleanreport.user.splice(i, 1);
            }
          }

          this.getAllresidents('house');
          this.commonService.setLoader(false);
        }
      }
    );
  }
  async getAllresidents(reportType) {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org',
    };
    if (reportType === 'house') {
      this.residentOrg = this.roomcleanreport.organization;
      this.residentFac = this.roomcleanreport.facility;
    }
    const payload = {
      organization: [this.residentOrg],
      facility: [this.residentFac],
    };

    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      // tslint:disable-next-line: max-line-length
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${
        obj['room'] && obj['room']['room'] ? obj['room']['room'] : ''
      }`;

      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    if (reportType === 'house') {
      this.houseReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    }
  }

  //Submit House Keeping
  async HouseReportSubmit(report, isValid) {
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

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

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
        facId: this.roomcleanreport.facility,
        orgId: this.roomcleanreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      this.end_date = this.data.end_date;
      this.start_date = this.data.start_date;
      this.userName = this.data.userName;
      this.shiftNo = this.data.shift;
      this.loadReport();
      //this.router.navigate(['/reports/roomcleanreport']);
    } else {
      return;
    }
  }

  //Check Archive resident
  async isArchiveResi(event, checkResi) {
    if (checkResi === 'house') {
      this.roomcleanreport.resident = '';
      this.reportOrg = this.roomcleanreport.organization;
      this.reportFac = this.roomcleanreport.facility;
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
      target: 'residents/get_res_org',
    };
    const payload = {
      organization: [this.reportOrg],
      facility: [this.reportFac],
      is_resArchive: this.isresident_status,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${
        obj['room'] && obj['room']['room'] ? obj['room']['room'] : ''
      }`;
      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });

    if (checkResi === 'house') {
      this.houseReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.roomcleanreport.user.length; i++) {
        if (this.roomcleanreport.user[i] === 0) {
          this.roomcleanreport.user.splice(i, 1);
        }
      }
    }
  }

  /**
   * @author Keyur Patel
   * @param archivetoggle
   */
  async isArchiveData(event, checkType) {
    console.log(checkType, event);
    if (checkType === 'house') {
      this.roomcleanreport.user = '';
      this.reportOrg = this.roomcleanreport.organization;
      this.reportFac = this.roomcleanreport.facility;
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

    if (checkType === 'house') {
      this.houseReportForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
      for (let i = 0; i < this.roomcleanreport.user.length; i++) {
        if (this.roomcleanreport.user[i] === 0) {
          this.roomcleanreport.user.splice(i, 1);
        }
      }
    }
    this.commonService.setLoader(false);
  }

  selectAll(checkTypeData) {
    if (this.allSelected.selected) {
      if (checkTypeData === 'house_all') {
        this.houseReportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.roomcleanreport.user.length; i++) {
          if (this.roomcleanreport.user[i] === 0) {
            this.roomcleanreport.user.splice(i, 1);
          }
        }
      }
    } else {
      if (checkTypeData === 'house_all') {
        this.houseReportForm.controls.user.patchValue([]);
      }
    }
  }

  selectUser(all, id, checkUser) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (checkUser === 'house') {
      if (
        this.houseReportForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.roomcleanreport.user.length; i++) {
        if (this.roomcleanreport.user[i] === 0) {
          this.roomcleanreport.user.splice(i, 1);
        }
      }
    }
  }

  changeShiftForVitals(shiftNo) {
    let zone = this.timezone;

    this.newDate1 = moment.tz(zone);
    this.newDate2 = moment.tz(zone);

    // this.newDate1 = moment();
    // this.newDate2 = moment();

    if (shiftNo === 0) {
      this.roomcleanreport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.roomcleanreport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.roomcleanreport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.roomcleanreport.shiftType = '3rd Shift (10:00pm - 6:00am)';
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

  selectAllresidents(CheckRep) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      if (CheckRep === 'house') {
        this.houseReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.roomcleanreport.resident.length; i++) {
          if (this.roomcleanreport.resident[i] === 0) {
            this.roomcleanreport.resident.splice(i, 1);
          }
        }
      }
    } else {
      if (CheckRep === 'house') {
        this.houseReportForm.controls.resident.patchValue([]);
      }
    }
  }

  selectResident(all, id, residentCheck) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
    if (residentCheck === 'house') {
      if (
        this.houseReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.roomcleanreport.resident.length; i++) {
        if (this.roomcleanreport.resident[i] === 0) {
          this.roomcleanreport.resident.splice(i, 1);
        }
      }
    }
  }

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
    console.log('range in local timezone', this.start_date, this.end_date);
    console.log(
      'range in facility timezone',
      moment(moment(this.start_date)).tz(this.timezone, true).valueOf(),
      moment(moment(this.end_date)).tz(this.timezone, true).valueOf()
    );
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  cancel() {
    this.roomcleanreport.isachive = false;
    this.roomcleanreport.isresident = false;
    this.dialogRefs.close();
  }

  async onExportReport(){
    this.commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'reports/get_org_fac_name'
    };
    const payload = {
      orgId: this.organization,
      facId: this.facility
    }
    const result = await this.apiService.apiFn(action, payload);
    let orgName, facname;
    if(result){
      orgName = result['data']['org'];
      facname = result['data']['fac'];
    }
    let doc = new jsPDF('p','mm','letter');
    doc.setFont("helvetica","bold");
    doc.setFontSize(16);
    doc.text('Unit Clean Report',19.05,19.05);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report Generated by ${this.userName}, ${orgName}, ${facname}`,19.05,24);
    doc.text(`${moment().tz(this.timezone, true).format('MMMM D, YYYY')}`,19.05, 28);

    doc.rect(19.05, 34, 50, 20);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(`${this.boxResultvalue.totalCarePerformed}`,21,44);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text('Unit Cleans Performed', 21, 50);

    doc.rect(79.05, 34, 50, 20);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(`${this.boxResultvalue.totalCareRefused}`, 80, 44);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text('Refused Cleaning', 80, 50);

    doc.rect(139.05, 34, 55, 20);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold")
    let ttlTime = this.boxResultvalue.totalTime > 60 ? this.timeConvert(this.boxResultvalue.totalTime) : this.boxResultvalue.totalTime + ' min';
    doc.text(`${ttlTime}`, 140, 44);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text('Total Time', 140, 50);
    let y = 70;
    let arr = this.residentList[0];

    for(let i=0; i < this.residentList.length; i++){
      let el = this.residentList[i];
      let performer = `${el.userData.last_name}, ${el.userData.first_name}`;
      doc.setFontSize(12);
      if(y >= 260){
        doc.addPage();
        y = 20;
      }
      doc.text(`Performer: ${performer}`, 19.05, y);
      y += 10;

      for(let j=0; j < el.records.length; j++){
        let childEl = el.records[j];
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Resident: ${childEl.updatedResidentData.last_name}, ${childEl.updatedResidentData.first_name}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Unit: ${childEl.roomData.room}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Status: ${childEl.resident_status}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Total Time: ${childEl.totalMin}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`${ moment(childEl.startTime).tz(this.timezone, true).format('MMMM D, YYYY HH:mm')} - ${moment(childEl.endTime).tz(this.timezone, true).format('HH:mm')}`, 19.05, y);
        y = y + 8;
        let newArr = [];
        let rowArr = [];
        let tableData = [];
        let careNote = childEl.items[0].care_notes;
        childEl.items.forEach((item, index) => {
          let carenm = item.careData.name;
          tableData.push([carenm === 'Room Cleaning' ? 'Unit Cleaning' : carenm, "", ""]);
          item.track_details.arr_room_clean.forEach(care => {
            if(typeof(care) === 'object'){
              Object.keys(care).forEach(keyy => {
                tableData.push([this.careIdName[keyy], "", ""]);
                care[keyy].forEach(subkey => {
                  Object.keys(subkey).forEach(key2 => {
                    tableData.push([this.careIdName[key2], subkey[key2], ""]);
                  })
                });
              })
            }
          });
          if(index === tableData.length - 1){
            tableData[index][1] = item.care_value;
            tableData[index][2] = item.care_notes;
          }
        });
        rowArr = tableData;
        if(rowArr.length > 1){
          rowArr[Math.round(rowArr.length / 2)][2] = careNote ? careNote : '';
        } else {
          rowArr[0][2] = careNote ? careNote : '';
        }
        
        await doc.autoTable({
          horizontalPageBreak: true,
          headStyles: {
            fontStyle: 'bold',
          },
          startY: y,
          margin: {
            left: 19.5,
            right: 19.5,
            top: 15,
            bottom: 15,
          },
          styles: {
            overflow: 'linebreak',
            lineWidth: 0.1,
            valign: 'middle',
            lineColor: 211
          },
          theme: 'plain',
          head: [['Care', 'Outcome', 'Notes']],
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 25, fontStyle: 'bold'},
            2: { cellWidth: 80 },
          },
          body: rowArr,
          willDrawCell: function(data){
            if(data.row.section === 'body' && data.column.index === 0){
              if(data.row.cells[1].raw == ''){
                doc.setFont('helvetica', 'bold');
              }
            }
          },
          didDrawPage: function () {
            doc.setTextColor('#1164A0');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Reported by Evey®', 19.05, 273.3, null, null, "left")
            doc.setFontSize(8).setFont('helvetica', 'normal');;
            doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, "right");
            doc.setTextColor('black');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
          }
        });

        y = doc.lastAutoTable.finalY + 10;
      }
    }

    this.commonService.setLoader(false);
    

    doc.save('room-clean-pdf');
  }

  newExpandPanel(userId){
    let newArr = [];
    let temp = this.residentList.filter(el => el.userData._id === userId);
    this.expandPanelContent = temp[0];
    // console.log('this.expandPanelContent', this.expandPanelContent);
    this.expandPanelContent.records.forEach(el => {
      this.tableData = [];
      el.items.forEach((item, index) => {
        let carenm = item.careData.name;
        this.tableData.push({firstCol: carenm === 'Room Cleaning' ? 'Unit Cleaning' : carenm, secondCol: "", thirdCol: ""});
        // this.tableData.push({firstCol: item.careData.name, secondCol: "", thirdCol: ""});
        item.track_details.arr_room_clean.forEach(care => {
          if(typeof(care) === 'object'){
            Object.keys(care).forEach(keyy => {
              this.tableData.push({firstCol: this.careIdName[keyy], secondCol: "", thirdCol: ""});
              care[keyy].forEach(subkey => {
                Object.keys(subkey).forEach(key2 => {
                  this.tableData.push({firstCol: this.careIdName[key2], secondCol: subkey[key2], thirdCol: ""});
                })
              });
            })
          }
        });
        if(index === this.tableData.length - 1){
          this.tableData[index]['secondCol'] = item.care_value;
          this.tableData[index]['thirdCol'] = item.care_notes;
        }
      });
      newArr.push({tabledata: this.tableData});
    })
    this.finalTableData = newArr;
    this.userWiseRoomClean[userId] = {"expandPanelContent": this.expandPanelContent, "tableData":this.finalTableData };
    console.log('userWiseRoomClean =====>>', this.userWiseRoomClean);
    // console.log(this.finalTableData);
  }

  formattedTime(ms) {
    ms = ms * 60000;
    let {
      seconds,
      minutes,
      hours,
    } = this.commonService.formatTimeFromMiliseconds(ms);
    if (seconds > 10) {
      minutes = minutes + 1;
    }
    return { seconds, minutes, hours };
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
