import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ViewEncapsulation,
  ChangeDetectorRef,
  TemplateRef,
} from '@angular/core';
import { SocketService } from './../shared/services/socket/socket.service';
import { ApiService } from './../shared/services/api/api.service';
import { CommonService } from './../shared/services/common.service';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { ChartType } from 'chart.js';
import * as _ from 'underscore';
import { Chart } from 'chart.js';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
// import { forEach } from '@angular/router/src/utils/collection';
import { Aes256Service } from './../shared/services/aes-256/aes-256.service';
import { ConnectionService } from 'ng-connection-service';
import $ from 'jquery';

import * as jsonData from './dashboardmodal/performanceData.json';

@Component({
  selector: 'app-livedashboard',
  templateUrl: './livedashboard.component.html',
  styleUrls: ['./livedashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LivedashboardComponent implements OnInit, AfterViewInit {
  displayedColumnsIsolation: string[] = [
    'resident',
    'isolation_end_date',
    'room',
  ];
  hashCode: any;
  linkData: any;
  shift: any = {
    rotation: 0,
    sTime: 0,
    eTime: 0,
    sTimeUTC: 0,
    eTimeUTC: 0,
    sMinute: 0,
    eMinute: 0,
    start_date: 0,
    end_date: 0,
    prevShiftStart: 0,
  };
  _date: any;
  _time: any;

  _facilityName = '';
  _levelCares: any = [];
  _prevlevelCares: Number = 0;
  _openCares: any;
  _openCaresCount: any;
  afterConstructor = false;
  openCareData: any;
  outStandingDataSource = new MatTableDataSource();
  missedCheckInCount: Number = 0;
  userdata2: any;
  missed: any;
  CareData;
  chartLabel;
  careGraphData: any;
  finalCareDataArr = [];
  colorArray = ['#32a53e', 'rgba(40, 165, 222)'];
  LineChart = null;
  displayedColumnsNew: string[] = ['resident', 'room', 'care', 'pausedtime'];
  displayedPerformersColumns: string[] = [
    'performer',
    'cares',
    'time_on_care',
    'unassigned',
  ];
  displayedLoginColumns: string[] = ['user_name'];

  _loggedInUserData: any = [];
  shiftType;
  shiftsTimeUTC;
  toDay_Date;
  _alertCares: any;
  alertDataSource: any;
  alert: any;
  _fallsCares: any;
  fallsDataSource: any;
  fallsUserdata: any;

  timeSolt = [];
  currenttimeSolt = [];
  QtimeSolt = [];

  doughnutChart1;
  currentShiftTotalCount = 0;
  currentShiftCheckinCount = 0;
  currentShitTime;

  shiftsTimeUTC2;
  doughnutChart2;
  previousShiftTotalCount: number = 0;
  previousShiftCheckinCount = 0;
  previousShiftTime;

  shiftsTimeUTC3;
  doughnutChart3;
  secondLastShiftTotalCount = 0;
  secondLastShiftCheckinCount = 0;
  secondLastShiftTime;

  shiftsTimeUTC4;
  doughnutChart4;
  thirdLastShiftTotalCount = 0;
  thirdLastShiftCheckinCount = 0;
  thirdLastShiftTime;

  shiftsTimeUTC5;
  doughnutChart5;
  levelTwoTotalCount = 0;
  levelTwoCheckinCount = 0;
  levelTwoTimeValue;

  doughnutChart6;
  levelThreeTotalCount = 0;
  levelThreeCheckinCount = 0;
  levelThreeTimeValue;

  doughnutChart7;
  supervisionTotalCount = 0;
  supervisionCheckinCount = 0;
  supervisionTimeValue;

  ctx: any;

  // Doughnut
  chartOptions = {
    maintainAspectRatio: false,
    cutoutPercentage: 75,
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
    tooltips: { enabled: false },
  };

  dialogRefs = null;

  displayedColumnsMissed = ['resident', 'room_num', 'is_out_of_fac'];

  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartType2: ChartType = 'doughnut';
  public doughnutChartType3: ChartType = 'doughnut';
  public doughnutChartType4: ChartType = 'doughnut';
  public doughnutChartType5: ChartType = 'doughnut';

  displayedColumnsFalls: string[] = ['resident', 'time'];
  displayedColumnsCareAlert: string[] = ['room_num', 'reporter', 'time'];
  Falls = [
    { id: 'resident', value: 'Resident' },
    { id: 'time', value: 'Time' },
  ];

  dataMain;
  data1;
  data2;
  data3;
  data4;
  data5;
  data6;
  isolated_residents: any = [];
  dataSourceIsolation: MatTableDataSource<Element>;
  testing_status_list: any = [];
  status = 'ONLINE';
  isConnected = true;
  @ViewChild('connectionModal', {static: true}) connectionModal: TemplateRef<any>;
  constructor(
    private apiService: ApiService,
    private aes256Service: Aes256Service,
    private socketService: SocketService,
    private commonService: CommonService,
    private router: Router,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private connectionService: ConnectionService
  ) {
    // this.connectionService.monitor().subscribe(isConnected => {
    //   this.isConnected = isConnected;
    //   if (this.isConnected) {
    //     this.status = 'ONLINE';
    //     this.dialogRefs.close();
    //   } else {
    //     this.status = 'OFFLINE';
    //     const dialogConfig = new MatDialogConfig();
    //     dialogConfig.maxWidth = '1000px';
    //     dialogConfig.disableClose = true;
    //     dialogConfig.closeOnNavigation = true;
    //     this.dialogRefs = this.dialog.open(this.connectionModal, dialogConfig);
    //   }
    // });
  }

  message: any;
  _performedCareCount = 0;
  _performedCareTotalTime = 0;
  _unassignedCount = 0;
  _unassignedCareTotalTime = 0;
  _totalCareTime = 0;
  _totalFalls = [];
  _rotation: Object = {
    endTime: Number,
    rotation: Number,
    startTime: Number,
  };

  _performersData = [];
  missedCareDataId = [];
  unassignedData = [];
  missedCareData = [];
  missedCareSource = new MatTableDataSource();
  loginDataSource = new MatTableDataSource();
  performersDataSource = new MatTableDataSource();
  _missedCareCount = 0;
  missedColumnsNew = ['resident', 'time'];
  dashboardData: any;

  async ngOnInit() {
    let hashcode: any;
    // console.log('status-->', this.status);
    // console.log('isConnected---->', this.isConnected);
    this.hashCode = hashcode = this.route.params['_value']['id'];
    if (!this.hashCode) {
      // console.log('hashcode blank--->', this.hashCode);
      this.router.navigate(['/']);
    } else {
      // console.log('hashcode--->', this.hashCode);
    }
    // hashCode = atob(hashCode);
    this.linkData = this.aes256Service.decFnWithsalt(hashcode);
    if (!this.linkData.organization) {
      // console.log('organization blank--->', this.linkData.organization);
      this.router.navigate(['/']);
    } else {
      // console.log('organization blank--->', this.linkData.organization);
    }
    if (!this.linkData.utc_time) {
      // console.log('utc blank--->', this.linkData.utc_time);
      this.router.navigate(['/']);
    } else {
      // console.log('utc blank--->', this.linkData.utc_time);
    }
    // required to get test status
    this.getIsolatedResiList();
    this.getTestingStatusList();
    this.getFacility();
    await this.getPerformanceDataFn();

    const dateUTC = moment().tz(this.linkData.utc_time);
    const hours = dateUTC.hour();
    const min = dateUTC.minute();
    this.shift = await this.commonService.get_rotation(this.linkData.utc_time);
    const that = this;
    that.getDataFunction();

    // this.setDeceleratingTimeout(function () {
    //   that.getDataFunction();
    //   that.getLoggedInUser();
    //   setInterval(async () => {
    //     that.getDataFunction();
    //     that.getLoggedInUser();
    //     that.setDeceleratingTimeout(function () {
    //       that.getDataFunction();
    //       that.getLoggedInUser();
    //     }, 10000, 1);
    //   }, (15 * 60000));
    // }, ((15 - (min % 15)) * 60000), 1);

    setInterval(async () => {
      that.getDateTime();
    }, 5000);

    setInterval(async () => {
      let dateUTC = moment().tz(this.linkData.utc_time);
      const hour: any = dateUTC.format('HH');
      const minute: any = dateUTC.format('mm');
      const refresh = sessionStorage.getItem('pagerefresh');
      if (hour == 2 && minute == 0 && refresh == '0') {
        window.location.reload();
        sessionStorage.setItem('pagerefresh', '1');
      } else {
        sessionStorage.setItem('pagerefresh', '0');
      }
    }, 5000);

    setInterval(async () => {
      let dateUTC = moment().tz(this.linkData.utc_time);
      const hours: any = dateUTC.format('HH');
      if (hours == 2) {
        window.location.reload();
      }
    }, 5000);

    this.socketService.updatePerformanceDashboardFn().subscribe(async _response => {
      if (_response) {
        console.log('_response------>', _response);
        that.getDataFunction();
        this.getIsolatedResiList();
        this.getTestingStatusList();
        this.getFacility();
        await this.getPerformanceDataFn();
      }
    });

    let hashdata = this.aes256Service.decFnWithsalt(this.hashCode);
    // console.log('hashdata----->', hashdata);

    $(window).resize(function () {
      // tslint:disable-next-line:max-line-length
      $('.content-wrapper').css(
        'height',
        $(window).height() -
          $('.main-header').outerHeight(true) -
          $('.report-detail').outerHeight(true) -
          15
      );
    });
    // Slot Based Graph Data Update Start
    const hours1 = dateUTC.hour();
    let getHours = moment().format('h');

    const hourCheck = Array.from({ length: 24 }, (v, k) => k);
    const resTime = hourCheck.reduce((obj, item) => {
      if (item % 2 === 0) {
        obj.push({ s: item, e: item + 2 });
      }
      return obj;
    }, []);
    let realtimeSlot1;
    if (hours1 % 2 === 1) {
      realtimeSlot1 = await _.filter(resTime, (num) => {
        if (num.s === hours1 - 1) {
          return num;
        }
      });
    } else {
      realtimeSlot1 = await _.filter(resTime, (num) => {
        if (num.s === hours1) {
          return num;
        }
      });
    }
    let slotCheck;
    slotCheck = realtimeSlot1[0].s - 1 > 0 ? `${realtimeSlot1[0].s}` : 12;
    if (slotCheck > 12) {
      slotCheck = slotCheck - 12;
    }
    slotCheck = slotCheck;
    setInterval(() => {
      if (slotCheck === getHours) {
        this.getDataFunction;
      }
    }, 1000);
  }

  async getChartData(shiftValue) {
    const totalCount = this.dashboardData.outstandingResidentData.length;
    const checkInData = await this.dashboardData.outstandingResidentData.filter((item) => {
      return item[shiftValue] == true;
    });
    const checkInCount = checkInData.length;

    return [totalCount, checkInCount];
  }


  generateChartFunction(oldData, newData, chartName) {
    if (!_.isEqual(oldData, newData)) {
      this[oldData] = newData;
      this[chartName] = new Chart(chartName, {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: newData,
              backgroundColor: ['#ef4036', '#98C73E'],
            },
          ],
        },
        options: this.chartOptions,
      });
    }
  }

  ngAfterViewInit() {
    this.scrollerFunc('table-performer'); // worked
    this.scrollerFunc('table-mis-checkin'); // worked
    this.scrollerFunc('table-care-notifications'); // worked
    this.scrollerFunc('table-loggedIn'); // worked
    this.scrollerFunc('table-falls'); // worked
    this.scrollerFunc('table-opcare');
    this.scrollerFunc('table-miscare-data');
    // tslint:disable-next-line:max-line-length
    $('.content-wrapper').css(
      'height',
      $(window).height() -
        $('.main-header').outerHeight(true) -
        $('.report-detail').outerHeight(true) -
        15
    );
    this.cdr.detectChanges();
  }

  // Keep me Signed in
  public doUnload(): void {
    this.doBeforeUnload();
  }

  // Keep me Signed in
  public doBeforeUnload(): void {
    // Clear localStorage
    let hashdata = this.aes256Service.decFnWithsalt(this.hashCode);
    // console.log(hashdata);
    // this.socketService.connectedEvent('disconnectlivedash', { platform: 'web',hashCodeData:hashdata });
  }

  scrollerFunc(classTable) {
    const that = this;
    const scroller = function (obj) {
      // console.log('ooooooooo',obj)
      const scCnt = $(obj).scrollTop() + 2;
      $(obj).animate({ scrollTop: scCnt }, 100, function () {});
      if (
        $(obj)[0] &&
        $(obj).scrollTop() + Math.ceil($(obj).innerHeight()) >=
          $(obj)[0].scrollHeight
      ) {
        $(obj).animate({ scrollTop: 0 }, 800, function () {});
      }
      setTimeout(function () {
        scroller(obj);
      }, 1000);
    };
    setTimeout(function () {
      const scrollHeight = $(document)
        .find('.' + classTable)
        .find('.scroller tbody')
        .height();
      scroller($(document).find('.' + classTable));
    }, 1000);
  }

  async getFacility() {
    const id = this.linkData['facility'];
    const action = { type: 'POST_DASHBOARD', target: 'facility/getfac' };
    const payload = { facilityId: this.linkData.facility };
    const result = await this.apiService.apiFn(action, payload);
    if (!result['status']) {
      // console.log('Faciltiy Status blank---->', result['status']);
      this.router.navigate(['/']);
    } else {
      // console.log('Faciltiy Status--->', result['status']);
    }
    this._facilityName = result['data']['fac_name'];
    const commonSerData = {
      org: this.linkData.organization,
      fac: this.linkData.facility,
    };
    const facilityData = {};
    facilityData['utc_offset'] = result['data']['utc_offset'];
    facilityData['timezone'] = result['data']['timezone'];

    // set globally org and fac data
    this.commonService.setOrgFac(commonSerData, [], facilityData);
  }

  async getPerformanceDataFn() {
    const action = {
      type: 'POST_DASHBOARD',
      target: 'dashboard/get_performance_dashboard',
    };
    const payload = { fac_id: this.linkData.facility };
    const result = await this.apiService.apiFn(action, payload);
    console.log('result data------>', result['data']);
    this.dashboardData = result['data'][0];
    // console.log('get_performance_dashboard------->', result['data']);
    if (!result['status']) {
      // console.log('Faciltiy Status blank---->', result['status']);
      // this.router.navigate(['/']);
    } else {
      this._performedCareCount = this.dashboardData.totalReport.totalCarePerformed;
      this._performedCareTotalTime = this.dashboardData.totalReport.timeOnCare;
      this._unassignedCareTotalTime =
      this.dashboardData.totalReport.timeUnassigned;
      this._totalCareTime = this.dashboardData.totalReport.totalTime;

      // open cares list binding
      this._openCares = this.dashboardData.openCareData;
      this.createOngoingCareTable(this._openCares);

      // missed cares list binding
      this.missedCareData = this.dashboardData.missedCareData;
      this.createTable1('missedCareSource', this.missedCareData);
      $(document).find('.table-miscare-data').scrollTop(0);
      this._missedCareCount = this.missedCareData.length;

      // performed data list binding
      this._performersData = this.dashboardData.performedUserData;
      this.createTable1('performersDataSource', this._performersData);
      $(document).find('.table-performer').scrollTop(0);

      // level cares list binding
      this._levelCares = this.dashboardData.outstandingResidentData;
      this._levelCares = this._levelCares.filter((item) => {
        return item.currentShiftCheckIn !== true;
      });
      this.createTable1('outStandingDataSource', this._levelCares);
      $(document).find('.table-mis-checkin').scrollTop(0);
      this.missedCheckInCount = this._levelCares.length;

      // level 1 current shift chart data binding
      [
        this.currentShiftTotalCount,
        this.currentShiftCheckinCount,
      ] = await this.getChartData('currentShiftCheckIn');
      // console.log('this.currentShiftTotalCount--->', this.currentShiftTotalCount);
      // console.log('this.currentShiftCheckinCount--->', this.currentShiftCheckinCount);
      this.currentShitTime =
      this.dashboardData && this.dashboardData.shiftChartTimeSlots
          ? this.dashboardData.shiftChartTimeSlots.currentShiftTime
          : '-';
      const mainData = [
        this.currentShiftTotalCount - this.currentShiftCheckinCount,
        this.currentShiftCheckinCount,
      ];
      this.generateChartFunction(this.dataMain, mainData, 'doughnutChart1');

      // level 1 previous shift chart data binding
      [
        this.previousShiftTotalCount,
        this.previousShiftCheckinCount,
      ] = await this.getChartData('previousShiftCheckIn');
      // tslint:disable-next-line:max-line-length
      this.previousShiftTime =
      this.dashboardData && this.dashboardData.shiftChartTimeSlots
          ? this.dashboardData.shiftChartTimeSlots.previousShiftTime
          : '-';
      const dataChart2 = [
        this.previousShiftTotalCount - this.previousShiftCheckinCount,
        this.previousShiftCheckinCount,
      ];
      this.generateChartFunction(this.data1, dataChart2, 'doughnutChart2');

      // level 1 second last shift chart data binding
      [
        this.secondLastShiftTotalCount,
        this.secondLastShiftCheckinCount,
      ] = await this.getChartData('secondLastShiftCheckIn');
      // tslint:disable-next-line:max-line-length
      this.secondLastShiftTime =
      this.dashboardData && this.dashboardData.shiftChartTimeSlots
          ? this.dashboardData.shiftChartTimeSlots.secondLastShiftTime
          : '-';
      const dataChart3 = [
        this.secondLastShiftTotalCount - this.secondLastShiftCheckinCount,
        this.secondLastShiftCheckinCount,
      ];
      this.generateChartFunction(this.data2, dataChart3, 'doughnutChart3');

      // level 1 third last shift chart data binding
      [
        this.thirdLastShiftTotalCount,
        this.thirdLastShiftCheckinCount,
      ] = await this.getChartData('thirdLastShiftCheckIn');
      // tslint:disable-next-line:max-line-length
      this.thirdLastShiftTime =
      this.dashboardData && this.dashboardData.shiftChartTimeSlots
          ? this.dashboardData.shiftChartTimeSlots.thirdLastShiftTime
          : '-';
      const dataChart4 = [
        this.thirdLastShiftTotalCount - this.thirdLastShiftCheckinCount,
        this.thirdLastShiftCheckinCount,
      ];
      this.generateChartFunction(this.data3, dataChart4, 'doughnutChart4');

      // level 2 chart data binding
      this.levelTwoTotalCount = this.dashboardData.level2ChartData.count;
      // tslint:disable-next-line:max-line-length
      this.levelTwoCheckinCount =
      this.dashboardData && this.dashboardData.level2ChartData
          ? this.dashboardData.level2ChartData.totalcount
          : 0;
      this.levelTwoTimeValue =
      this.dashboardData && this.dashboardData.level2ChartData
          ? this.dashboardData.level2ChartData.hour
          : '-';
      const dataChart5 = [
        this.levelTwoTotalCount - this.levelTwoCheckinCount,
        this.levelTwoCheckinCount,
      ];
      this.generateChartFunction(this.data4, dataChart5, 'doughnutChart5');

      // level 3 chart data binding
      this.levelThreeTotalCount = this.dashboardData.level3ChartData.count;
      // tslint:disable-next-line:max-line-length
      this.levelThreeCheckinCount =
      this.dashboardData && this.dashboardData.level3ChartData
          ? this.dashboardData.level3ChartData.totalcount
          : 0;
      this.levelThreeTimeValue =
        result['data'] && this.dashboardData.level3ChartData
          ? this.dashboardData.level3ChartData.hour
          : '-';
      const dataChart6 = [
        this.levelThreeTotalCount - this.levelThreeCheckinCount,
        this.levelThreeCheckinCount,
      ];
      this.generateChartFunction(this.data5, dataChart6, 'doughnutChart6');

      // supervision chart data binding
      this.supervisionTotalCount = this.dashboardData.supervisionChartData.count;
      // tslint:disable-next-line:max-line-length
      this.supervisionCheckinCount =
      this.dashboardData && this.dashboardData.supervisionChartData
          ? this.dashboardData.supervisionChartData.totalcount
          : 0;
      // tslint:disable-next-line:max-line-length
      this.supervisionTimeValue =
      this.dashboardData && this.dashboardData.supervisionChartData
          ? this.dashboardData.supervisionChartData.hour
          : '-';
      const dataChart7 = [
        this.supervisionTotalCount - this.supervisionCheckinCount,
        this.supervisionCheckinCount,
      ];
    }
  }

  async getDataFunction() {
    this.shift = await this.commonService.get_rotation(this.linkData.utc_time);
    this.updateTimeframeLD();
  }

  async updateTimeframeLD() {
    const payload = {
      hashCode: this.hashCode,
    };
    const action = {
      type: 'POST_DASHBOARD',
      target: 'users/update_livedb_time',
    };
    const result = await this.apiService.apiFn(action, payload);
  }

  setDeceleratingTimeout(callback, factor, times) {
    const internalCallback = (function (tick, counter) {
      return function () {
        if (--tick >= 0) {
          window.setTimeout(internalCallback, ++counter * factor);
          callback();
        }
      };
    })(times, 0);

    window.setTimeout(internalCallback, factor);
  }

  getOngoingShiftDetailsFn() {
    this.getDateTime();
    this.getOngoingShift();
  }

  // async getDateTime() {
  getDateTime() {
    this._date = moment().tz(this.linkData.utc_time).format('HH:mm');
    this._time = moment().tz(this.linkData.utc_time).format('MMMM Do YYYY');
  }

  async getOngoingShift() {
    const shiftnew = await this.commonService.get_rotation(
      this.linkData.utc_time
    );
    this._rotation = shiftnew;
  }

  formattedTime(ms) {
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

  performerTIme(ms) {
    const formattedTIme = this.commonService.createTime(ms);
    return formattedTIme ? formattedTIme : '0 min';
  }

  async openCareLeft() {
    const action = {
      type: 'POST_DASHBOARD',
      target: 'reports/prev_open_care_report',
    };
    const payload = this.shift;
    payload.fac_id = this.linkData.facility;
    const result = await this.apiService.apiFn(action, payload);
    if (result['data'] && result['status']) {
      this._prevlevelCares = result['data'];
    }
  }

  removeunderscore(val) {
    return val.replace(/ /g, '_');
  }

  createOngoingCareTable(arr) {
    const tableArr: Element[] = arr;
    if (tableArr) {
      this.openCareData = new MatTableDataSource(tableArr);
      this._openCaresCount = this.openCareData.filteredData.length;
    }
    this.afterConstructor = true;
    $(document).find('.table-opcare').scrollTop(0);
  }

  async getIsolatedResiList() {
    const action = {
      type: 'GET',
      target: 'residents/isolated_list',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.isolated_residents = result['data'];
    this.createTable1('dataSourceIsolation', this.isolated_residents);
  }

  async getTestingStatusList() {
    const action = {
      type: 'GET',
      target: 'residents/testing_status_list',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.testing_status_list = result['data'];
  }

  createTable1(source, arr) {
    const tableArr: Element[] = arr;
    if (this[source] == undefined) {
      this[source] = new MatTableDataSource(tableArr);
    } else {
      this[source].data = tableArr;
    }
  }

  checkIsolation(residentId) {
    const inx = this.isolated_residents.findIndex(
      (ele) => ele._id == residentId
    );
    const inxPos = this.testing_status_list.filter((x) => x._id == residentId);
    const found = inxPos.some((item) => item.testing_status === 'Positive');
    if (inx > -1) {
      if (found) {
        return false;
      } else {
        return this.isolated_residents[inx];
      }
    } else {
      return false;
    }
  }

  checkPositive(residentId) {
    const inx = this.testing_status_list.findIndex(
      (ele) => ele._id == residentId
    );
    return inx > -1 ? this.testing_status_list[inx] : false;
  }

  scheduleTime(schedule) {
    const endCareTime = moment
      .unix(schedule.start_time / 1000)
      .add(schedule.duration, 'second')
      .valueOf();
    const endTime = moment(endCareTime).format('DD MMM YYYY hh:mm a');
    const curTime = moment(new Date()).format('DD MMM YYYY hh:mm a');
    const diff: any = moment.duration(moment(curTime).diff(moment(endTime)));
    const days: any = parseInt(diff.asDays());
    const careHours: any = parseInt(diff.asHours());
    const careTime = careHours - days * 24;
    const minutes = parseInt(diff.asMinutes());
    const totalDiff = minutes - (days * 24 * 60 + careTime * 60);
    return careTime + 'hr' + ' ' + totalDiff + 'min';
    this.cdr.detectChanges();
  }
}
