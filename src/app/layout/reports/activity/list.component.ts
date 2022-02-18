import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  OnDestroy,
} from '@angular/core';
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatPaginator,
} from '@angular/material';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Rx';
// import { NgxDrpOptions, PresetItem, Range } from 'ngx-mat-daterange-picker';
import * as async from 'async';
import { ApiService } from '../../../shared/services/api/api.service';
import { ExcelService } from '../../../shared/services/excel.service';
import { CommonService } from '../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy {
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
  loadervalue = 0;
  loaderbuffer = 2;
  displayedColumns = [];
  exportContentVal = [];
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  sortActive = 'name';
  hasNextPage = false;
  sortDirection: 'asc' | 'desc' | '';
  maxD = moment();
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'user',
      value: 'User',
      sort: false,
    },
    {
      id: 'activity_name',
      value: 'Activity',
      sort: false,
    },
    {
      id: 'activity_from',
      value: 'Platform',
      sort: false,
    },
    {
      id: 'date',
      value: 'Date',
      sort: true,
    },
  ];

  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
  };

  data = [
    {
      value: 'iOS',
      label: 'Mobile',
    },
    {
      value: 'ipad',
      label: 'iPad',
    },
    {
      value: 'Web',
      label: 'Web',
    },
  ];
  count;
  public show = false;
  userslist;
  start_date =
    moment()
      .subtract(10, 'years')
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .unix() * 1000;
  end_date =
    moment()
      .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
      .unix() * 1000;
  timezone: any;
  utc_offset: any;
  private subscription: Subscription;
  isLoading: boolean;
  isClicked: boolean;
  totalCount: any;
  facility;
  exportCount: any;
  plaSearch = '';
  usSearch = '';
  isShowLoginOnly = false;
  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public common: CommonService
  ) {}

  selected;
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
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  @ViewChild('dateRangePicker', { static: true }) dateRangePicker;

  @HostListener('window:scroll')
  checkScroll() {
    // window의 scroll top
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
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  ngOnInit() {
    // if(!this.common.checkPrivilegeModule('activity_report')){
    //   this.router.navigate(['/']);
    // }
    this.subscription = this.common.contentdata.subscribe((contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        // console.log('--facility timezone--',contentVal)
        this.facility = contentVal.fac;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;
        // console.log('---timezone---', this.timezone, this.utc_offset);
        // this.getServerData(this.pagiPayload);
      }
    });
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
    sessionStorage.removeItem('pageListing');
    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.getServerData(this.pagiPayload);
    this.getAllusers();
  }

  updateRange(range: Range) {
    // const today_st = moment();
    // const today_ed = moment();
    // const today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    // const today_end = today_ed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    // if (range['startDate'] && range['startDate']['_d']) {
    //   range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    //   this.start_date = range['startDate']['_d'].getTime();
    // }
    // if (range['endDate'] && range['endDate']['_d']) {
    //   range['endDate'] = range['endDate'].set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    //   this.end_date = range['endDate']['_d'].getTime();
    // }

    const today_st = moment();
    const today_ed = moment();
    const today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const today_end = today_ed.set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
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
      // This condition for new Date Picker
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
        minute: 59,
        second: 59,
        millisecond: 999,
      });
      this.end_date = range['endDate']['_d'].getTime();
    } else if (range.toDate) {
      range['toDate'] = moment(range['toDate'])
        .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
        .toDate();
      this.end_date = range.toDate.getTime();
    } else {
      // console.log('---d not exist  endate')
      this.end_date = today_end['_d'].getTime();
    }
    // console.log('range in local timezone', this.start_date, this.end_date);
    // console.log(
    //   'range in facility timezone',
    //   moment(moment(this.start_date)).tz(this.timezone, true).valueOf(),
    //   moment(moment(this.end_date)).tz(this.timezone, true).valueOf()
    // );
  }

  async getAllusers() {
    const output = [];
    const action = {
      type: 'GET',
      target: 'users/getUsers',
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.userslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['label'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['value'] = obj._id;
      return robj;
    });
    this.userslist.sort(function (a, b) {
      const nameA = a.label.toUpperCase(),
        nameB = b.label.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  }

  async toggle() {
    this.show = !this.show;
    this.isClicked = false;
  }

  changePlatform(platform) {
    this.pagiPayload = {
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
    };
    this.platform = platform;
    this.pagiPayload['activity_from'] = this.platform;
    this.pagiPayload['user_id'] = this.user;
    this.pagiPayload['dates'] = {
      sDate: this.start_date ? this.start_date : null,
      eDate: this.end_date ? this.end_date : null,
    };
  }

  changeUser(user) {
    this.pagiPayload = {
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
    };
    this.user = user;
    this.pagiPayload['activity_from'] = this.platform;
    this.pagiPayload['user_id'] = this.user;
    this.pagiPayload['dates'] = {
      sDate: this.start_date ? this.start_date : null,
      eDate: this.end_date ? this.end_date : null,
    };
  }

  onSubmit() {
    this.pagiPayload = {
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
    };

    if (this.platform) {
      this.pagiPayload['activity_from'] = this.platform;
    }
    if (this.user) {
      this.pagiPayload['user_id'] = this.user;
    }

    this.pagiPayload['dates'] = {
      sDate: this.start_date ? this.start_date : null,
      eDate: this.end_date ? this.end_date : null,
    };
    this.pagiPayload['showLoginOnly'] = this.isShowLoginOnly;
    // console.log('activity payload', this.pagiPayload);
    this.getServerData(this.pagiPayload);
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    const arrLen = arr.length;
    if (arrLen < this.pagiPayload.pageSize) {
      const startIndex = this.pagiPayload.pageIndex * this.pagiPayload.pageSize;
      const endIndex = startIndex + arrLen;
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = startIndex + 1 + ' - ' + endIndex;
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    } else {
      const tempRange = this.paginator._intl.getRangeLabel(
        this.pagiPayload.pageIndex,
        this.pagiPayload.pageSize,
        arr.length
      );
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = tempRange.substring(0, tempRange.indexOf('o'));
      // setTimeout(() => {
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
      //      }, 1000);
    }
  }

  addForm() {
    // Custom-code!
    this.router.navigate(['/org/form']);
  }

  viewOrganization(id) {
    this.router.navigate(['/org/view', this._aes256Service.encFnWithsalt(id)]);
  }

  editOrganization(id) {
    this.router.navigate(['/org/form', this._aes256Service.encFnWithsalt(id)]);
  }

  async exportActivity() {
    this.common.setLoader(true);
    const that = this;
    await that.exportContentData();
    const resultAll = that.exportContentVal;
    if (resultAll.length) {
      that.loadervalue = 0;
      that.loaderbuffer = 2;
      that.loaderexport = false;
      const activity = await this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(activity, 'Activity_Report');
    }
    this.common.setLoader(false);
  }

  async exportContentData() {
    return new Promise(async (resolve) => {
      this.loaderexport = true;
      let decExist = 0;
      const limit = 500;
      const trackcount = this.exportCount;
      const no = trackcount <= limit ? 1 : trackcount / limit;
      if (trackcount % limit !== 0 && trackcount > limit) {
        decExist = 1;
      }
      let arrlen;
      if (decExist === 1) {
        arrlen =
          trackcount.length <= limit
            ? [1]
            : Array.from({ length: no + 1 }, (v, k) => k);
      } else if (trackcount) {
        arrlen =
          trackcount.length <= limit
            ? [1]
            : Array.from({ length: no }, (v, k) => k);
      }

      const that = this;

      const asyncTasks = [];
      const doneTasks = [];
      let resultAll = [];
      // if(arrlen){
      //   arrlen.forEach(function (commitUrl, index, urls) {
      asyncTasks.push(async function (callback) {
        const action = {
          type: 'GET',
          target: 'activity',
        };
        const payload = {
          length: 0,
          previousPageIndex: 0,
          activity_from: that.platform,
          user_id: that.user,
          dates: {
            sDate: that.start_date
              ? that.start_date
              : moment()
                  .subtract(6, 'days')
                  .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                  .toDate()
                  .getTime(),
            eDate: that.end_date
              ? that.end_date
              : moment()
                  .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
                  .toDate()
                  .getTime(),
          },
        };

        const result = await that.apiService.apiFn(action, payload);
        // console.log('Result', result);
        if (result['data'] && result['data']['_activity'].length) {
          const data = result['data']['_activity'];
          // console.log('Activity', data);
          // doneTasks[index] = data;
        }
        const totalItem = arrlen.length;
        that.loadervalue = (doneTasks.length / totalItem) * 100;
        that.loaderbuffer = that.loadervalue + 2;

        callback(null, 'resp');
      });
      //   });
      // }
      // else {
      //   this.toastr.error('Failed to get total count');
      // }

      async.parallel(asyncTasks, function (results) {
        doneTasks.forEach(function (data, index, urls) {
          resultAll = [...resultAll, ...data];
        });
        that.exportContentVal = resultAll;
        resolve(that.exportContentVal);
      });
    });
  }

  // async exportContentData() {
  //   return new Promise(async (resolve) => {
  //     if (this.exportContentVal.length) {
  //       resolve(this.exportContentVal);
  //     } else {
  //       this.loaderexport = true;
  //       const action = {
  //         type: 'GET',
  //         target: 'activity'
  //       };
  //       const payload = {
  //         length: 0,
  //         previousPageIndex: 0,
  //         activity_from: this.platform,
  //         user_id: this.user,
  //         dates: {
  //           sDate: this.start_date ? this.start_date : moment().subtract(6,'days')
  //                                      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate().getTime(),
  //           eDate: this.end_date ? this.end_date : moment().
  //                                         set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toDate().getTime()
  //        }
  //       }
  //       const result =  await this.apiService.apiFn(action, payload);
  //       console.log('Result', result);

  //       let decExist = 0;
  //       const limit = 2500;
  //       const medTrackcount = result['data'];

  //       const no = medTrackcount <= limit ? 1 : medTrackcount / limit;
  //       if (medTrackcount % limit !== 0 && medTrackcount > limit) {
  //         decExist = 1;
  //       }
  //       let arrlen;
  //       if (decExist === 1) {
  //         arrlen =
  //         medTrackcount.length <= limit ? [1] : Array.from({ length: no + 1 }, (v, k) => k);
  //       } else {
  //         arrlen = medTrackcount.length <= limit ? [1] : Array.from({ length: no }, (v, k) => k);
  //       }

  //       console.log('arrlen---->', medTrackcount, arrlen);
  //       const that = this;

  //       let resultAll = [];
  //       async.eachOfSeries(arrlen, async function (item, index, callback) {
  //           const action = { type: 'POST', target: 'reports/view_med_reports' };
  //           const payload = {
  //             medReportData: that.queryData,
  //             pagination: { pageIndex: item, pageSize: limit },
  //           };
  //           const result = await that._apiService.apiFn(action, payload);
  //           if (result['data'] && result['data']['resp'].length) {
  //             const data = result['data']['resp'];
  //             resultAll = [...resultAll, ...data];
  //           }
  //           const totalItem = arrlen.length;
  //           that.loadervalue = (item / totalItem) * 100;
  //           that.loaderbuffer = that.loadervalue + 2;

  //           callback(null, result);
  //         },
  //         async function (result) {
  //           that.exportContentVal = resultAll;
  //           resolve(that.exportContentVal);
  //         }
  //       );
  //     }
  //   });
  // }

  // Export PDF
  async onExportAsPDF() {
    this.loaderexport = true;
    const header = ['User', 'Activity', 'Platform', 'Date'];
    const dataArr = [];
    await this.exportContentData();
    const resultAll = this.exportContentVal;
    resultAll.forEach((item) => {
      dataArr.push([
        item.user_id
          ? item.user_id.first_name + ' ' + item.user_id.last_name
          : '--',
        item.activity_name,
        item.activity_from,
        item.date,
      ]);
    });
    const fontfamily = 'helvetica';
    const fontsize = 10;
    const x = 19.05;
    let y = 19.05;
    const doc = new jsPDF('l', '', '');
    doc.setFont(fontfamily, 'normal');
    doc.setFontSize(16).setFont(fontfamily, 'bold');
    doc.text('Activity Report', x, y);
    doc.setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 3;
    const data = dataArr;
    doc.setFontSize(12).setFont(fontfamily, 'bold');
    await doc.autoTable({
      startY: y + 6,
      margin: { left: 19.05, right: 19.05 },
      head: [header],
      body: data,
      theme: 'plain',
      styles: {
        overflow: 'linebreak',
        lineWidth: 0.1,
        valign: 'middle',
        lineColor: 211,
      },

      horizontalPageBreak: true,
      didDrawPage: function () {
        doc.setTextColor('#1164A0');
        doc.setFontSize(8);
        doc.setFont(fontfamily, 'normal');
        doc.text('Reported by Evey®', x, 273.3, null, null, 'left');
        doc.setFontSize(8).setFont(fontfamily, 'normal');
        doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, 'right');
        doc.setTextColor('black');
        doc.setFontSize(fontsize);
        doc.setFont(fontfamily, 'normal');
      },
    });
    y = doc.lastAutoTable.finalY + 10;
    this.loaderexport = false;
    doc.save('Activity Reports');
  }

  prepareUsersForCSV() {
    const activity = [];
    const exportdata = this.exportContentVal;
    exportdata.forEach((item) => {
      activity.push({
        'Activity Name': item.activity_name,
        'Activity From': item.activity_from,
        Date: this.convertDateToFacilityTimeZone(item.date), // moment(item.date).format('MMMM Do YYYY, HH:mm'),
        User: item.user_id
          ? item.user_id.first_name + ' ' + item.user_id.last_name
          : '--',
      });
    });
    return activity;
  }

  public async getActivityFunction() {
    this.common.setLoader(true);
    const action = {
      type: 'GET',
      target: 'activity',
    };
    this.pagiPayload['facility'] = this.facility;
    const payload = this.pagiPayload;
    // console.log(action, payload);
    let result = await this.apiService.apiFn(action, payload);
    // console.log('Result', result);
    this.hasNextPage = result['data']['_hasNextPage'];
    this.count = result['data']['_count'];
    result = result['data']['_activity'].map((item) => {
      return {
        ...item,
        activity_name: item.activity_name,
        activity_from: item.activity_from,
        date: moment(item.date).format('MMMM Do YYYY, HH:mm'), // moment(item.date).format('MMMM Do YYYY, HH:mm'),
        user: item.user_id
          ? item.user_id.last_name + ', ' + item.user_id.first_name
          : '--',
      };
    });
    // console.log('result---->', result);
    this.createTable(result);
    this.common.setLoader(false);
  }
  convertDateToFacilityTimeZone(start) {
    const utcDate = moment.utc(start);
    const tzdate = utcDate.clone().tz(this.timezone);

    return tzdate.format('MMMM Do YYYY, HH:mm');
  }
  // sort data
  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this.common.setLoader(true);
    this.pagiPayload['sort'] = sort;
    this.getActivityFunction();
  }

  public async getServerData(event?: PageEvent) {
    // console.log('Calling');
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.getActivityFunction();
    this.get_total_activity_count_for_export();
  }

  resetFilter() {
    this.show = false;
    this.platform = '';
    this.user = '';
    this.isShowLoginOnly = false;
    delete this.pagiPayload['activity_from'];
    delete this.pagiPayload['user_id'];
    delete this.pagiPayload['dates'];
    delete this.pagiPayload['showLoginOnly'];
    this.start_date =
      moment()
        .subtract(10, 'years')
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .unix() * 1000;
    this.end_date =
      moment()
        .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
        .unix() * 1000;
    this.selected = null;
    this.getServerData(this.pagiPayload);
  }

  checkAllwoNum(key) {
    const result = this.common.allwoNum(key);
    return result;
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

  async ngAfterViewChecked() {
    this.hasNextPage == true
      ? document
          .getElementsByClassName('mat-paginator-navigation-next')[0]
          .removeAttribute('disabled')
      : document
          .getElementsByClassName('mat-paginator-navigation-next')[0]
          .setAttribute('disabled', 'true');
  }

  async get_total_activity_count() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'activity/count' };
    this.pagiPayload['facility'] = this.facility;
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    // console.log('count result', result);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
    }
  }

  async get_total_activity_count_for_export() {
    const action = { type: 'GET', target: 'activity/count' };
    this.pagiPayload['facility'] = this.facility;
    let dates = {
      sDate: this.start_date
        ? this.start_date
        : moment()
            .subtract(6, 'days')
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toDate()
            .getTime(),
      eDate: this.end_date
        ? this.end_date
        : moment()
            .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
            .toDate()
            .getTime(),
    };
    this.pagiPayload['dates'] = dates;
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    // console.log('count result', result);
    this.exportCount = result['data']['_count'];
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
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

export interface CalendarOverlayConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  shouldCloseOnBackdropClick?: boolean;
}

export interface Range {
  fromDate: Date;
  toDate: Date;
}

export interface PresetItem {
  presetLabel: string;
  range: Range;
}
