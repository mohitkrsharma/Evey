import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { SocketService } from './../shared/services/socket/socket.service';
import { ApiService } from './../shared/services/api/api.service';
import { CommonService } from './../shared/services/common.service';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, ChartType } from 'chart.js';
import * as _ from 'underscore';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
// import { forEach } from '@angular/router/src/utils/collection';
import { Aes256Service } from './../shared/services/aes-256/aes-256.service';
import { ConnectionService } from 'ng-connection-service';
import $ from 'jquery';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-temp-livedashboard',
  templateUrl: './temp-livedashboard.component.html',
  styleUrls: ['./temp-livedashboard.component.scss'],
})
export class TempLivedashboardComponent implements OnInit, AfterViewInit, OnDestroy {
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
  _openCaresCount = 0;
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
  currentShiftTime;

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
  @ViewChild('connectionModal', { static: true })
  connectionModal: TemplateRef<any>;
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
    this.connectionService.monitor().subscribe((isConnected) => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.status = 'ONLINE';
        this.dialogRefs.close();
      } else {
        this.sendMail();
        this.status = 'OFFLINE';
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = '1000px';
        dialogConfig.disableClose = true;
        dialogConfig.closeOnNavigation = true;
        // this.dialogRefs = this.dialog.open(this.connectionModal, dialogConfig);
      }
    });
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
  socketSubscription: Subscription = new Subscription();

  missedCheckInData = {
    organization: '',
    facility: '',
    date: new Date(),
    shift: '',
  };
  newDate1 = moment();
  newDate2 = moment();
  shiftData;
  shiftTimeValue;

  async ngOnInit() {
    let hashcode: any;
    this.hashCode = hashcode = this.route.params['_value']['id'];
    if (!this.hashCode) {
      this.router.navigate(['/']);
    } else {
    }
    this.linkData = this.aes256Service.decFnWithsalt(hashcode);
    console.log('this.linkData---------->', this.linkData);
    if (!this.linkData.organization) {
      this.router.navigate(['/']);
    } else {
    }
    if (!this.linkData.utc_time) {
      this.router.navigate(['/']);
    } else {
    }

    const hashData = this.aes256Service.decFnWithsalt(this.hashCode);
    const shiftTimeValue = moment().tz(this.linkData.utc_time).format('HH');
    this.shiftTimeValue = shiftTimeValue;
    // join room
    await this.joinRoomFn('PDASH', false);
    // required to get test status
    this.getDateTime();
    await this.getIsolatedResiList();
    await this.getTestingStatusList();
    await this.getFacility();
    await this.getShiftChartData();
    await this.getMissedCares();
    await this.getPerformanceDataFn();
    this.socketSubscription.add(
      this.socketService.listenRoomFn().subscribe(async (_response: any) => {
        if (_response.eventType === 'last_24hours_missedcare') {
          if (_response) {
            await this.getMissedCares();
          }
        }
      })
    );

    const dateUTC = moment().tz(this.linkData.utc_time);
    const hours = dateUTC.hour();
    const min = dateUTC.minute();
    this.shift = await this.commonService.get_rotation(this.linkData.utc_time);
    const that = this;

    interval(5000)
      .pipe()
      .subscribe(async () => {
        that.getDataFunction();
        const dateValue = moment().tz(this.linkData.utc_time);
        const hour: any = Number(dateValue.format('HH'));
        const minute: any = Number(dateValue.format('mm'));
        const refresh = sessionStorage.getItem('pagerefresh');
        if ((hour % 2) != 0 && minute == 45 && refresh == '0') {
          await this.getShiftChartData();
          sessionStorage.setItem('pagerefresh', '1');
        } else {
          sessionStorage.setItem('pagerefresh', '0');
        }
      });

    this.socketService
      .updatePerformanceDashboardFn()
      .subscribe(async (_response: any) => {
        if (_response) {
          await this.getPerformanceDataFn();
          await this.getIsolatedResiList();
          await this.getTestingStatusList();
          await this.getFacility();
        }
      });

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

    interval(180000)
      .pipe()
      .subscribe(async () => {
        await this.getShiftChartData();
      });
  }

  async getShiftChartData() {
    const dateUTC = moment().tz(this.linkData.utc_time);
    const hours: any = dateUTC.format('HH:mm');

    let realtimeSlot: any = {};
    const newHours: any = moment(hours, 'HH:mm').format('HH');
    const date1 = moment().tz(this.linkData.utc_time);

    if (newHours % 2 === 0) {
      realtimeSlot = {
        s: date1
          .set({
            hour: parseInt(newHours) - 1,
            minute: 45,
            second: 0,
            millisecond: 0,
          })
          .format('HH:mm'),
        e: date1
          .set({
            hour: parseInt(newHours) + 1,
            minute: 45,
            second: 0,
            millisecond: 0,
          })
          .format('HH:mm'),
      };
    } else {
      const newmin: any = moment(hours, 'HH:mm').format('mm');
      if (parseInt(newmin) < 45) {
        realtimeSlot = {
          s: date1
            .set({
              hour: parseInt(newHours) - 2,
              minute: 45,
              second: 0,
              millisecond: 0,
            })
            .format('HH:mm'),
          e: date1
            .set({
              hour: parseInt(newHours),
              minute: 45,
              second: 0,
              millisecond: 0,
            })
            .format('HH:mm'),
        };
      } else {
        realtimeSlot = {
          s: date1
            .set({ hour: newHours, minute: 45, second: 0, millisecond: 0 })
            .format('HH:mm'),
          e: date1
            .set({
              hour: parseInt(newHours) + 2,
              minute: 45,
              second: 0,
              millisecond: 0,
            })
            .format('HH:mm'),
        };
      }
    }

    this.currentShiftTime = moment(realtimeSlot.s, 'HH:mm')
      .add(15, 'minutes')
      .format('HH:mm');
    this.previousShiftTime = moment(realtimeSlot.s, 'HH:mm')
      .subtract(2, 'hours')
      .add(15, 'minutes')
      .format('HH:mm');
    this.secondLastShiftTime = moment(realtimeSlot.s, 'HH:mm')
      .subtract(4, 'hours')
      .add(15, 'minutes')
      .format('HH:mm');
    this.thirdLastShiftTime = moment(realtimeSlot.s, 'HH:mm')
      .subtract(6, 'hours')
      .add(15, 'minutes')
      .format('HH:mm');
    const shiftTimeValue = moment(this.currentShiftTime, 'HH').format('HH');
    this.shiftTimeValue = shiftTimeValue;
    // console.log('getShiftChartData shiftTimeValue---->', shiftTimeValue);
    this.changeShift(this.shiftTimeValue);
  }

  async changeShift(shiftTimeValue) {
    let hours;
    this.newDate1 = moment(this.missedCheckInData.date);
    hours = Array.from({ length: 4 }, (v, k) => k);

    // extra day condition
    const dateUTC = moment().tz(this.linkData.utc_time);
    const currentHour: any = dateUTC.format('HH');
    if (shiftTimeValue >= 0 && shiftTimeValue < 2) {
      if (currentHour >= 0 && currentHour < 2) {
        this.newDate1 = moment().subtract(1, 'day');
        this.newDate1.set({ hour: 17, minute: 45, second: 0, millisecond: 0 });
        this.newDate2 = moment(this.newDate1).add(8, 'hours');
      } else {
        this.newDate1 = moment().set({ hour: 17, minute: 45, second: 0, millisecond: 0 });
        this.newDate2 = moment(this.newDate1).add(8, 'hours');
      }
    } else if (shiftTimeValue >= 2 && shiftTimeValue < 4) {
      this.newDate1 = moment().subtract(1, 'day');
      this.newDate1.set({ hour: 19, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 4 && shiftTimeValue < 6) {
      this.newDate1 = moment().subtract(1, 'day');
      this.newDate1.set({ hour: 21, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 6 && shiftTimeValue < 8) {
      this.newDate1 = moment().subtract(1, 'day');
      this.newDate1.set({ hour: 23, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 8 && shiftTimeValue < 10) {
      this.newDate1.set({ hour: 1, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 10 && shiftTimeValue < 12) {
      this.newDate1.set({ hour: 3, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 12 && shiftTimeValue < 14) {
      this.newDate1.set({ hour: 5, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 14 && shiftTimeValue < 16) {
      this.newDate1.set({ hour: 7, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 16 && shiftTimeValue < 18) {
      this.newDate1.set({ hour: 9, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 18 && shiftTimeValue < 20) {
      this.newDate1.set({ hour: 11, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 20 && shiftTimeValue < 22) {
      this.newDate1.set({ hour: 13, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftTimeValue >= 22) {
      this.newDate1.set({ hour: 15, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    }
    let sTime = this.newDate1;
    let eTime = this.newDate2;
    this.shiftData = hours.reduce((obj, item) => {
      eTime = moment(sTime).add(60, 'minutes');
      const timeEnd = moment(eTime).add(60, 'minutes');
      obj.push({
        sr: item,
        sTime: sTime['_d'].getTime(),
        midTime: eTime['_d'].getTime(),
        eTime: timeEnd['_d'].getTime(),
      });
      sTime = moment(sTime).add(2, 'hours');
      return obj;
    }, []);
    const shiftData = await this.getTimeSlotArray();
    // console.log("shiftData--->", shiftData);
    await this.getDonutChartData(shiftData);
  }

  async getTimeSlotArray() {
    this.shiftData = this.shiftData.map((e) => {
      return {
        sr: e.sr,
        sTime: this.convertEqTz(e.sTime),
        midTime: this.convertEqTz(e.midTime),
        eTime: this.convertEqTz(e.eTime),
      };
    });

    let schartDate, echartDate;
    if (this.shiftData) {
      const n = this.shiftData.length;
      schartDate = this.shiftData[0].sTime;
      echartDate = this.shiftData[n - 1].eTime;
    }
    return this.shiftData;
  }

  async getDonutChartData(shiftData) {
    const action = {
      type: 'POST_DASHBOARD',
      target: 'dashboard/chartsData',
    };
    const payload = {
      fac_id: this.linkData.facility,
      timeZone: this.linkData.utc_time,
      shiftData: shiftData,
      emitValue: false,
    };
    console.log("Payload",payload);

    const result = await this.apiService.apiFn(action, payload);
  }

  convertEqTz(s) {
    return moment(s).tz(this.linkData.utc_time, true).valueOf();
  }

  sendMail() {
    const payload = {
      facilityId: this.linkData.facility,
      organizationId: this.linkData.organization,
      userId: this.linkData.userId,
      dashboard: 'Performance Dashboard',
    };
    this.socketService.onDashboardDown(payload).subscribe();
  }

  async getChartData(shiftValue) {
    // tslint:disable-next-line:max-line-length
    const totalCount =
      this.dashboardData && this.dashboardData.residentOutArrData
        ? this.dashboardData.residentOutArrData.length
        : 0;
    const outstandData =
      this.dashboardData && this.dashboardData.residentOutArrData
        ? this.dashboardData.residentOutArrData
        : [];
    let checkInCount = 0;
    if (outstandData && outstandData.length) {
      const checkInData = await this.dashboardData.residentOutArrData.filter(
        (item) => {
          return item[shiftValue] === true;
          // return item[shiftValue] !== null;
        }
      );
      checkInCount = checkInData.length;
    }

    return [totalCount, checkInCount];
  }

  async getBelowLevelChartData(key, shiftValue) {
    // tslint:disable-next-line:max-line-length
    const totalCount =
      this.dashboardData && this.dashboardData[key]
        ? this.dashboardData[key].length
        : 0;
    const outstandData =
      this.dashboardData && this.dashboardData[key]
        ? this.dashboardData[key]
        : [];
    let checkInCount = 0;
    if (outstandData && outstandData.length) {
      const checkInData = await this.dashboardData[key].filter((item) => {
        return item[shiftValue] === true;
      });
      checkInCount = checkInData.length;
    }

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
    // this.scrollerFunc('table-opcare');
    this.scrollerFunc('table-open-care');
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
    const hashData = this.aes256Service.decFnWithsalt(this.hashCode);
    // console.log(hashData);
    this.socketService.connectedEvent('disconnectlivedash', {
      platform: 'web',
      hashCodeData: hashData,
    });
  }

  scrollerFunc(classTable) {
    const that = this;
    const scroller = function (obj) {
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
    // console.log('result data------>', result['data']);
    this.dashboardData = result['data'][0];

    // console.log(
    //   'get_performance_dashboard------->',
    //   JSON.stringify(this.dashboardData)
    // );
    if (result['status']) {
      await this.dashboardDataBind();
    }
  }

  async dashboardDataBind() {
    this._openCares = [];
    this.missedCareData = [];
    this._performersData = [];
    this._levelCares = [];

    // console.log('data bind-------->', this.dashboardData);
    if (this.dashboardData && this.dashboardData.totalReport) {
      this._performedCareCount =
        this.dashboardData.totalReport.totalCarePerformed;
      this._performedCareTotalTime = this.dashboardData.totalReport.timeOnCare;
      this._unassignedCareTotalTime =
        this.dashboardData.totalReport.timeUnassigned;
      this._totalCareTime =
        this.dashboardData.totalReport.timeOnCare +
        this.dashboardData.totalReport.timeUnassigned;
    }

    // open cares list binding
    this._openCares =
      this.dashboardData && this.dashboardData.openCareData
        ? this.dashboardData.openCareData
        : [];
    // console.log('this._openCares-->', JSON.stringify(this._openCares));
    let _openCares = [];
    if (this._openCares && this._openCares.length) {
      _openCares = this._openCares.filter((item) => {
        return item.care !== 'Enter' && item.care !== 'Exit';
      });
    }

    // console.log('_openCares-->', JSON.stringify(_openCares));
    this.createOngoingCareTable(_openCares);
    $(document).find('.table-open-care').scrollTop(0);

    // missed cares list binding
    this.missedCareData =
      this.dashboardData && this.dashboardData.missedCareData
        ? this.dashboardData.missedCareData
        : [];
    this.createTable1('missedCareSource', this.missedCareData);
    $(document).find('.table-miscare-data').scrollTop(0);
    if (this.missedCareData && this.missedCareData.length) {
      this._missedCareCount = this.missedCareData.length;
    }

    // performed data list binding
    this._performersData =
      this.dashboardData && this.dashboardData.performedUserData
        ? this.dashboardData.performedUserData
        : [];
    this.createTable1('performersDataSource', this._performersData);
    $(document).find('.table-performer').scrollTop(0);

    // level cares list binding
    this._levelCares =
      this.dashboardData && this.dashboardData.outstandingResidentData
        ? this.dashboardData.outstandingResidentData
        : [];
    // this._levelCares = this._levelCares.filter((item) => {
    //   return item.currentShiftCheckIn !== true;
    //   // return item.currentShiftCheckIn !== true;
    // });
    this.createTable1('outStandingDataSource', this._levelCares);
    $(document).find('.table-mis-checkin').scrollTop(0);

    if (this._levelCares && this._levelCares.length) {
      this.missedCheckInCount = this._levelCares.length;
    } else {
      this.missedCheckInCount = 0;
    }

    // level 1 current shift chart data binding
    [this.currentShiftTotalCount, this.currentShiftCheckinCount] =
      await this.getChartData('currentShiftCheckIn');
    // this.currentShiftTime =
    //   this.dashboardData && this.dashboardData.shiftChartTimeSlots
    //     ? this.dashboardData.shiftChartTimeSlots.currentShiftTime
    //     : '-';
    const mainData = [
      this.currentShiftTotalCount - this.currentShiftCheckinCount,
      this.currentShiftCheckinCount,
    ];
    this.generateChartFunction(this.dataMain, mainData, 'doughnutChart1');

    // level 1 previous shift chart data binding
    // tslint:disable-next-line:max-line-length
    this.previousShiftCheckinCount =
      this.dashboardData && this.dashboardData.shiftCheckInData
        ? this.dashboardData.shiftCheckInData.previousShiftData.checkInCount
        : '-';
    // tslint:disable-next-line:max-line-length
    this.previousShiftTotalCount =
      this.dashboardData && this.dashboardData.shiftCheckInData
        ? this.dashboardData.shiftCheckInData.previousShiftData.totalCount
        : '-';
    // [
    //   this.previousShiftTotalCount,
    //   this.previousShiftCheckinCount,
    // ] = await this.getChartData('previousShiftCheckIn');
    // tslint:disable-next-line:max-line-length
    // this.previousShiftTime =
    //   this.dashboardData && this.dashboardData.shiftChartTimeSlots
    //     ? this.dashboardData.shiftChartTimeSlots.previousShiftTime
    //     : '-';
    const dataChart2 = [
      this.previousShiftTotalCount - this.previousShiftCheckinCount,
      this.previousShiftCheckinCount,
    ];
    this.generateChartFunction(this.data1, dataChart2, 'doughnutChart2');

    // level 1 second last shift chart data binding
    // tslint:disable-next-line:max-line-length
    this.secondLastShiftCheckinCount =
      this.dashboardData && this.dashboardData.shiftCheckInData
        ? this.dashboardData.shiftCheckInData.secondLastShiftData.checkInCount
        : '-';
    // tslint:disable-next-line:max-line-length
    this.secondLastShiftTotalCount =
      this.dashboardData && this.dashboardData.shiftCheckInData
        ? this.dashboardData.shiftCheckInData.secondLastShiftData.totalCount
        : '-';
    // [
    //   this.secondLastShiftTotalCount,
    //   this.secondLastShiftCheckinCount,
    // ] = await this.getChartData('secondLastShiftCheckIn');
    // this.secondLastShiftTime =
    //   this.dashboardData && this.dashboardData.shiftChartTimeSlots
    //     ? this.dashboardData.shiftChartTimeSlots.secondLastShiftTime
    //     : '-';
    const dataChart3 = [
      this.secondLastShiftTotalCount - this.secondLastShiftCheckinCount,
      this.secondLastShiftCheckinCount,
    ];
    this.generateChartFunction(this.data2, dataChart3, 'doughnutChart3');

    // level 1 third last shift chart data binding
    // tslint:disable-next-line:max-line-length
    this.thirdLastShiftCheckinCount =
      this.dashboardData && this.dashboardData.shiftCheckInData
        ? this.dashboardData.shiftCheckInData.lastShiftData.checkInCount
        : '-';
    // tslint:disable-next-line:max-line-length
    this.thirdLastShiftTotalCount =
      this.dashboardData && this.dashboardData.shiftCheckInData
        ? this.dashboardData.shiftCheckInData.lastShiftData.totalCount
        : '-';
    // [
    //   this.thirdLastShiftTotalCount,
    //   this.thirdLastShiftCheckinCount,
    // ] = await this.getChartData('thirdLastShiftCheckIn');
    // this.thirdLastShiftTime =
    //   this.dashboardData && this.dashboardData.shiftChartTimeSlots
    //     ? this.dashboardData.shiftChartTimeSlots.thirdLastShiftTime
    //     : '-';
    const dataChart4 = [
      this.thirdLastShiftTotalCount - this.thirdLastShiftCheckinCount,
      this.thirdLastShiftCheckinCount,
    ];
    this.generateChartFunction(this.data3, dataChart4, 'doughnutChart4');

    // level 2 chart data binding
    // this.levelTwoTotalCount = this.dashboardData && this.dashboardData.level2ChartData.count ?
    // this.dashboardData.level2ChartData.count : 0;
    // check in count variable : totalcount
    // this.levelTwoCheckinCount = this.dashboardData && this.dashboardData.level2ChartData ?
    // this.dashboardData.level2ChartData.totalcount : 0;
    [this.levelTwoTotalCount, this.levelTwoCheckinCount] =
      await this.getBelowLevelChartData(
        'levelTwoResidentArrData',
        'levelTwoShiftCheckIn'
      );

    const dataChart5 = [
      this.levelTwoTotalCount - this.levelTwoCheckinCount,
      this.levelTwoCheckinCount,
    ];
    this.generateChartFunction(this.data4, dataChart5, 'doughnutChart5');

    // level 3 chart data binding
    // this.levelThreeTotalCount =
    //   this.dashboardData && this.dashboardData.level3ChartData
    //     ? this.dashboardData.level3ChartData.count
    //     : 0;
    // this.levelThreeCheckinCount =
    //   this.dashboardData && this.dashboardData.level3ChartData
    //     ? this.dashboardData.level3ChartData.totalcount
    //     : 0;
    [this.levelThreeTotalCount, this.levelThreeCheckinCount] =
      await this.getBelowLevelChartData(
        'levelThreeResidentArrData',
        'levelThreeShiftCheckIn'
      );
    const dataChart6 = [
      this.levelThreeTotalCount - this.levelThreeCheckinCount,
      this.levelThreeCheckinCount,
    ];
    this.generateChartFunction(this.data5, dataChart6, 'doughnutChart6');

    // supervision chart data binding
    // this.supervisionTotalCount =
    //   this.dashboardData && this.dashboardData.supervisionChartData
    //     ? this.dashboardData.supervisionChartData.count
    //     : 0;
    // this.supervisionCheckinCount =
    //   this.dashboardData && this.dashboardData.supervisionChartData
    //     ? this.dashboardData.supervisionChartData.totalcount
    //     : 0;
    [this.supervisionTotalCount, this.supervisionCheckinCount] =
      await this.getBelowLevelChartData(
        'supervisionResidentArrData',
        'supervisionShiftCheckIn'
      );
    const dataChart7 = [
      this.supervisionTotalCount - this.supervisionCheckinCount,
      this.supervisionCheckinCount,
    ];
    this.generateChartFunction(this.data6, dataChart7, 'doughnutChart7');
  }

  async getDataFunction() {
    this.shift = await this.commonService.get_rotation(this.linkData.utc_time);
    this.getOngoingShiftDetailsFn();
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
    const shiftNew = await this.commonService.get_rotation(
      this.linkData.utc_time
    );
    this._rotation = shiftNew;
  }

  formattedTimeOld(ms) {
    const { hours, minutes } =
      this.commonService.formatTimeFromMilisecondsper(ms);
    // if (seconds > 10) {
    //   minutes = minutes + 1;
    // }
    // console.log('minutes--->', minutes);
    // console.log('hours--->', hours);
    return { hours, minutes };
  }

  formattedTime(ms) {
    let { seconds, minutes, hours } =
      this.commonService.formatTimeFromMiliseconds(ms);
    if (seconds > 10) {
      minutes = minutes + 1;
    }
    // console.log('minutes--->', minutes);
    // console.log('hours--->', hours);
    return { seconds, minutes, hours };
  }

  performerTIme(ms) {
    const formattedTIme = this.commonService.createTime(ms);
    return formattedTIme ? formattedTIme : '0 min';
  }

  formattedCareTIme(value) {
    return this.commonService.convertTimeToTimezone(
      value,
      this.linkData.utc_time
    );
    // return formattedTIme ? formattedTIme : '0 min';
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
    this.openCareData = new MatTableDataSource();
    const tableArr: Element[] = arr;
    this.openCareData = new MatTableDataSource(tableArr);
    this._openCaresCount = arr && arr.length ? arr.length : 0;
    // $(document).find('.table-opcare').scrollTop(0);
    // $(document).find('.table-open-care').scrollTop(0);
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

  async joinRoomFn(room, isLeaveRoom = false) {
    let roomName = `${this.linkData.facility}-${room}`;
    console.log('roomName---->', roomName);
    if (isLeaveRoom) {
      this.socketService.disConnectFn(roomName).subscribe((res) => {
        if (res) {
          console.log('leaves room');
        }
      });
    } else {
      this.socketService.connectFn(roomName).subscribe((res) => {
        if (res) {
          console.log('joined room');
        }
      });
    }
  }

  ngOnDestroy() {
    // leave room
    this.joinRoomFn('PDASH', true);
  }

  async getMissedCares() {
    const action = {
      type: 'POST_DASHBOARD',
      target: 'dashboard/dashboardMissedCare',
    };
    const payload = {
      fac_id: this.linkData.facility,
      org_id: this.linkData.organization,
    };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data'] && result['data'].length) {
      this._missedCareCount = result['data'].length;
    }
    // this.missedCareData.filter((item) => {
    //   const value = moment.unix(item.start_time / 1000);
    //   let h = moment(value).tz(this.linkData.utc_time).format('HH');
    //   let m = moment(value).tz(this.linkData.utc_time).format('mm');
    //   item['sortValue'] = Number(h) * 60 + Number(m);
    // })
  }
}
