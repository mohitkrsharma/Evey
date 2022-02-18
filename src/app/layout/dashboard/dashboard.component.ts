import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { MatTooltip, PageEvent } from '@angular/material';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ApiService } from './../../shared/services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from './../../shared/services/common.service';
import * as moment from 'moment-timezone';
import { SocketService } from './../../shared/services/socket/socket.service';
import { PlatformLocation } from '@angular/common';
import { Aes256Service } from './../../shared/services/aes-256/aes-256.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ChartType, MultiDataSet, Label, ChartOptions } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { ResidentDialogComponent } from 'src/app/shared/modals/resident-dialog/resident-dialog.component';

export interface UserData {
  id: string;
  name: string;
  progress: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent implements OnInit, OnDestroy {

  public doughnutChartLabels: Label[] = ['Active', 'Battery below 30%', 'Battery below 10%'];
  public doughnutChartData: MultiDataSet = [[60, 30, 10]];
  public doughnutChartType: ChartType = 'doughnut';

  pageEvent: PageEvent;
  timezone; utc_offset;
  showLink = false;
  showstatusLink = false;
  showalertLink = false;
  showactivityLink = false;
  organiz = [];
  fac = [];
  missedCareData = [];
  performanceButtonText = "Copy to Clipboard"
  statusButtonText = "Copy to Clipboard"
  alertButtonText = "Copy to Clipboard"
  linkForm: any = {
    organization: '',
    facility: '',
    userId: '',
    utc_time: ''
  };
  statusForm: any = {
    organization: '',
    facility: '',
    userId: '',
  };
  alertForm: any = {
    organization: '',
    facility: '',
    userId: ''
  };
  activityForm: any = {
    organization: '',
    facility: '',
    userId: ''
  };
  link; statuslink; alertlink; activitylink;
  flag = true;
  annouce_id: string;
  status = false;
  live = false;
  alert = false;
  dialogRefs = null;
  utc_timezone = '';
  userData
  ord
  @ViewChild('callRepeatDialog', {static: true}) callRepeatDialog: TemplateRef<any>;
  @ViewChild('confirmHide', {static: true}) confirmHide: TemplateRef<any>;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('tooltipPerformance', {static: true}) tooltipPerformance: MatTooltip;

  columnNames = [
    { id: 'resident_name', value: 'Resident' },
    { id: 'room', value: 'Rm' },
    { id: 'care', value: 'Care' },
    { id: 'user', value: 'Started By' },
    { id: 'pause_time', value: 'Pause Time' }
  ];

  dataSource;
  openCareCount = 0;
  public show = false;
  public buttonName: any = 'Show';
  displayedColumns = [];
  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 7,
    previousPageIndex: 0
  };

  hide = false;

  announce;
  livedashboard;
  facility;
  orginization;
  public links = false;
  public statuslinks = false;
  public alertlinks = false;
  public activitylinks = false;


  private subscription: Subscription = new Subscription();
  private subscription1: Subscription = new Subscription();
  private subscription2: Subscription = new Subscription();
  private subscription3: Subscription = new Subscription();
  private subscription4: Subscription = new Subscription();
  private subscription5: Subscription = new Subscription();
  private orderSubscription: Subscription = new Subscription();
  private residentSubscription: Subscription = new Subscription();
  private careSubscription: Subscription = new Subscription();
  private subscriptiondata: Subscription = new Subscription();
  private announcementSubscribe: Subscription = new Subscription();
  socketSubscription: Subscription = new Subscription();
  isolated_residents: any = [];
  dashCardData: any;
  ordersCountData: any;
  liveDashConnected = 0;
  statusDashConnected = 0;
  alertDashConnected = 0;
  orgSearch = '';
  searchCtrl = '';
  roomName: string = '';
  // temp variables
  tempPerformanceButtonText = 'Copy to Clipboard';
  public templinks = false;
  @ViewChild('tooltipTempPerformance', {static: false}) tooltipTempPerformance: MatTooltip;
  @ViewChild('tooltipStatus', {static: false}) tooltipStatus: MatTooltip;
  @ViewChild('tooltipAlert', {static: false}) tooltipAlert: MatTooltip;
  templink;
  public isLiveDashEnable: boolean = false;

  constructor(
    private _apiService: ApiService,
    private _router: Router,
    private _socketService: SocketService,
    private _dialog: MatDialog,
    public _platformLocation: PlatformLocation,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    private _toastr: ToastrService,
    private route: ActivatedRoute
  ) {
  }

  dashBoardLink() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    this.dialogRefs = this._dialog.open(this.callRepeatDialog, dialogConfig);
  }

  closeDialog(): void {
    this.dialogRefs.close();
  }

  async hideAnnouncemnt(index) {    
    this.annouce_id = this.announce[index]._id;
    if (this.announce[index].message.includes("changed from")) {
      const action = { type: 'POST', target: 'announcement/hide' };
      const payload = { annouce_id: this.annouce_id };
      const result = await this._apiService.apiFn(action, payload);
      if (result['status']) {
        this.announce = this.announce.filter(el => el._id !== this.annouce_id) || [];
        this._toastr.success('Annoucement hidden');
      } else {
        this._toastr.error('error in hide annoucement');
      }
    } else {
      this.announce.splice(index, 1);
    }
  }

  /* Copy to clipboard */
  copyInputMessage(inputElement, type) {

    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
    // this.tooltip.show()
    if (type == 'performance') {
      this.performanceButtonText = 'Copied'
      this.tooltipPerformance.show()
    } else if (type == 'status') {
      this.statusButtonText = 'Copied'
      this.tooltipStatus.show()
    } else if (type == 'alert') {
      this.alertButtonText = 'Copied'
      this.tooltipAlert.show()
    } else if (type == 'temp') {
      this.tempPerformanceButtonText = 'Copied';
      this.tooltipTempPerformance.show();
    }
  }
  leftPerformanceButton(type) {
    setTimeout(() => {
      // this.tooltip.hide()
      if (type == 'performance') {
        this.tooltipPerformance.hide()
        this.performanceButtonText = 'Copy to Clipboard';
      } else if (type == 'status') {
        this.tooltipStatus.hide()
        this.statusButtonText = 'Copy to Clipboard';
      } else if (type == 'alert') {
        this.tooltipAlert.hide()
        this.alertButtonText = 'Copy to Clipboard';
      } else if (type == 'temp') {
        // console.log(this.tooltipTempPerformance)
        this.tooltipTempPerformance.hide();
        this.tempPerformanceButtonText = 'Copy to Clipboard';
      }

    }, 100);
  }
  async ngOnInit() {
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.timezone = contentVal.timezone;
        console.log(this.facility);
      }
    })
    const socketFacility = JSON.parse(localStorage.getItem('socketFacility'));
    if (!socketFacility) {
      //this.getSocketRooms();
    }
    this._commonService.setLoader(true);
    sessionStorage.removeItem('pageListing');
    this.livedashboard = sessionStorage.getItem('enable_livedashboard');
    this.livedashboard == 'true' ? this.isLiveDashEnable = true : this.isLiveDashEnable = false;
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this._commonService.setLoader(true);
        const payload = {};
        payload['organization'] = this.orginization = this.pagiPayload['organization'] = contentVal.org;
        payload['facility'] = this.facility = this.pagiPayload['facility'] = contentVal.fac;
        // this.roomName = this.facility + '-SCH';
        // const socketFacility = localStorage.getItem('socketFacility');
        // if(socketFacility) {
        //   JSON.parse(socketFacility).filter(item=> {
        //     if(item === this.roomName) {
        //       this.socketSubscription.add(this._socketService.connectFn(this.roomName).subscribe(async (_result: any) => {
        //         console.log("result after socket connection on dashboard >>>>>",_result)
        //       }));
        //     }
        //   })
        // } else {
        //   this._toastr.error('Not able to get socket room.')
        // }

        this._socketService.connectFn(`${this.facility}-PDASH`).subscribe(res => {
          if (res) {
            // console.log(res);
          }
        })
        this.socketSubscription.add(this._socketService.listenRoomFn().subscribe(async (_response: any) => {
          // console.log('data after socket call in dashboard', _response);
          if (_response.eventType === 'last_24hours_missedcare') {
            if (_response) { await this.getMissedCares(); }
          }
        }));
        this.getMissedCares();
        this.utc_timezone = contentVal.timezone;
        payload['isNotVisible'] = true;
        const action = { type: 'POST', target: 'announcement/get' };
        const result = await this._apiService.apiFn(action, payload);
        this.announce = result['data'];
        console.log("Announce",this.announce);
        await this.openVisits(this.pagiPayload);
        //this.getIsolatedResiList();
        await this.getDashCardsCountFn();
        await this.getDashOrdersCountFn();
        await this.previousShiftData();
        await this.joinRoomFn('ANNOUNCE', false);
        await this.joinRoomFn('EMAR', false);
        await this.joinRoomFn('CARE', false);
        await this.joinRoomFn('USER', false);
        await this.getAnnouncementFn();

        this._commonService.setLoader(false);
      }
      await this.perfomanceLink();
      await this.statusLink();
      await this.alertLink();
      // temp dahboard link generation
      await this.tempPerfomanceLink();
      
    });

    await this.getOrganization();
    await this.activityLink();

    this.subscriptiondata = this._socketService.onTrackCareUpdateFn().subscribe(async (_response) => {
      if (_response) {
        await this.openVisits(this.pagiPayload);
      }
    });

    // demo test socket event
    this.subscriptiondata = this._socketService.demoDashboardFn().subscribe(async (_response) => {
      // console.log('demoDashboardFn _response------>', _response);
      if (_response) {
      }
    });

    /*this.subscription1 =  this._socketService.onResidentIsIsolationFn().subscribe(async (_response: any ) => {
      if (_response) {
        const index = _response.facility.findIndex(item =>  item.fac === this.facility);
       // console.log("index>>",index)
        if (index > -1) {
          const index1 = this.isolated_residents.findIndex(item =>  _response._ids.indexOf(item._id) > -1);
          if (index1 > -1) {
            const EndTime = _response.end_time_isolation;
            const StartTime = _response.start_time_isolation;
            this.isolated_residents[index1]['isolation_end_date'] = '';
            this.isolated_residents[index1]['isolation_start_date'] = '';
            this.isolated_residents[index1]['room'] =_response.room;
           setTimeout(() => {
            this.isolated_residents[index1]['isolation_end_date'] = EndTime;
            this.isolated_residents[index1]['isolation_start_date'] = StartTime;
           }, 0);
          } else {
            // tslint:disable-next-line: max-line-length
            this.isolated_residents.push({_id:_response._ids[0],first_name:_response.first_name,last_name:_response.last_name,isolation_end_date:_response.end_time_isolation,room:_response.room})
          }
        }
      }
    });*/

    /*this.subscription2 =   this._socketService.onResidentStopIsolationFn().subscribe(async (_response: any) => {
      if (_response) {
        const index = this.isolated_residents.findIndex(item =>  _response.resident_id === item._id);
          if (index > -1) {
            this.isolated_residents.splice(index, 1);
          }

      }
    });*/

    this.subscription3 = this._socketService.onLiveDashConnectedFn().subscribe(async (_response: any) => {
      if (_response) {
        // console.log(">>>>",_response)
        this.liveDashConnected = _response.length;
      }
    });

    this.subscription4 = this._socketService.onStatusDashConnectedFn().subscribe(async (_response: any) => {
      if (_response) {
        // console.log(">>>>",_response)
        this.statusDashConnected = _response.length;
      }
    });
    this.subscription5 = this._socketService.onAlertDashConnectedFn().subscribe(async (_response: any) => {
      if (_response) {
        // console.log(">>>>",_response)
        this.alertDashConnected = _response.length;
      }
    });

    this.orderSubscription = this._socketService.dashboardOrderCountFn().subscribe(async (_response: any) => {
      // console.log('dashboardOrderCountFn _response---->', _response);
      if (_response) {
        await this.getDashCardsCountFn();
        await this.getDashOrdersCountFn();
        // this.dashCardData.unlinkOrderCount = _response.unlinkOrderCount;
      }
    });

    this.orderSubscription = this._socketService.updateOrderFn().subscribe(async (_response: any) => {
      // console.log('dashboardOrderCountFn _response---->', _response);
      if (_response) {
        await this.getDashCardsCountFn();
        await this.getDashOrdersCountFn();
        // this.dashCardData.unlinkOrderCount = _response.unlinkOrderCount;
      }
    });

    this.residentSubscription = this._socketService.dashboardResidentCountFn().subscribe(async (_response: any) => {
      // console.log('dashboardResidentCountFn _response---->', _response);
      if (_response) {
        await this.getDashCardsCountFn();
        await this.getDashOrdersCountFn();
        // this.dashCardData.residentsDataCount = _response.activeResidentsData;
        // this.dashCardData.residentsShortTermDataCount = _response.shortTermResidentData;
        // this.dashCardData.residentsPendingDataCount = _response.pendingResidentData;
      }
    });

    this.careSubscription = this._socketService.dashboardCareCountFn().subscribe(async (_response: any) => {
      // console.log('dashboardFallCareCountFn _response---->', _response);
      if (_response) {
        await this.getDashCardsCountFn();
        await this.getDashOrdersCountFn();
        // this.dashCardData.fallCareCountDataCount = _response.fallCareCount;
        // this.dashCardData.openCareDataDataCount = _response.openCareData;
      }
    });

    this._socketService.connectedEvent('getDashConnectedUser', { platform: 'web' });
  }

  async getSocketRooms() {
    const action = { type: 'GET', target: '/get_rooms_ids' };
    const payload = {};
    const result: any = await this._apiService.apiFn(action, payload, true);
    let data: any = []
    data = result.data.roomsIdArr;
    localStorage.setItem('socketFacility', JSON.stringify(data));
  }

  async getOrganization() {
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this._apiService.apiFn(action, payload);
    console.log(result);
    this.organiz = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['label'] = obj._id.org.org_name;
      rObj['value'] = obj._id.org._id;
      return rObj;
    });
  }

  async selectFacility(fac, type) {
    // console.log(type);
    if (type === 'live') {
      this.linkForm.facility = fac;
    } else if (type === 'status') {
      this.statusForm.facility = fac;
    }
    else {
      this.alertForm.facility = fac;
      this.activityForm.facility = fac;
    }
    this.showLink = false;
    this.showstatusLink = false;
    this.showalertLink = false;
  }

  async selectOrganization(org, type) {
    if (type === 'live') {
      this.linkForm.organization = org;
      this.activityForm.organization = org;
    } else if (type === 'status') {
      this.statusForm.organization = org;
    }
    else {
      this.alertForm.organization = org;
      this.activityForm.organization = org;
    }
    const payload = { org: org };
    const action1 = { type: 'GET', target: 'users/get_user_fac' };
    const result1 = await this._apiService.apiFn(action1, payload);
    this.fac = await result1['data'].map(function (obj) {
      const fObj = {};
      fObj['label'] = obj._id.fac.fac_name;
      fObj['value'] = obj._id.fac._id;
      return fObj;
    });
    this.showLink = false;
    this.showstatusLink = false;
    this.showalertLink = false;
  }

  ordersToEnter(){
    this._commonService.setLoader(true);
    this._router.navigate(['/orders-to-enter']);
  }

  getAnnouncementFn() {
    this.announcementSubscribe = this._socketService.getAnnouncementFn().subscribe(async (res: any) => {
      if (res.length > 1) {
        const payload = {};
        payload['organization'] = this.orginization;
        payload['facility'] = this.facility;
        const action = { type: 'POST', target: 'announcement/get' };
        const result = await this._apiService.apiFn(action, payload);
        this.announce = result['data'];
      } else {
        const index = res[0].facility.findIndex(item => item.fac === this.facility && item.org === this.orginization);
        if (index > -1) {
          const _ind = this.announce.findIndex(item => item._id === res[0]._id);
          if (_ind > -1) {
            this.announce.splice(_ind, 1, res[0]);
            this.announce = this.announce.filter(_item => _item.deleted === false && _item.isactive === true);
          } else {
            this.announce.unshift(res[0]);
          }
        }
      }
    });
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    this.dataSource.sort = this.sort;
  }

  async openVisits(event?: PageEvent) {
    const action = { type: 'GET', target: 'dashboard/openvisits' };
    const payload = {
      flag: 'dash',
      startDate: moment().valueOf(),
      endDate: moment().subtract(24, 'hours').valueOf()
    };
    let result = await this._apiService.apiFn(action, payload);
    if (result['status']) {
      this.openCareCount = result['data']['_count'];
      //console.log(">>>",result['data']['_openvisits'])
      result = result['data']['_openvisits'].map(item => {
        return {
          ...item,
          resident_name: item.resident_name ? item.resident_name : '--',
          resident_id: item.resident_id,
          care: item.care ? item.care.name : '--',
          careImage: item.care && item.care.image ? item.care.image : null,
          start_time: item.ts_total_time ? moment(item.ts_total_time.start_time).format('MMMM Do YYYY, HH:mm') : '--',
          pause_time: item.ts_total_time ? moment(item.ts_total_time.end_time).format('MMMM Do YYYY, HH:mm') : '--',
          user: item.user_name
        };
      });
      this.createTable(result);
    }
  }

  viewOpenvisits() {
    this._commonService.setLoader(true);
    this._router.navigate(['/open-visits']);
  }

  orderReceived(){
    this._router.navigate(['/ordersToFile']);
  }

  openResidentModal(orderType){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'repeatDialog';
    dialogConfig.data = { orderType: orderType, residentId: null };
    this.dialogRefs = this._dialog.open(ResidentDialogComponent, dialogConfig);
    this.dialogRefs.afterClosed().subscribe((result:any) => {
      console.log("Result of Modal -------->",result);
      if(result && result.orderType && result.residentId){
        this.route.params['_value'] = { id: result.residentId };
        this.route.params['_value'] = this._aes256Service.encFnWithsalt(this.route.params['_value']['id']);
        console.log("Params",this._aes256Service.encFnWithsalt(this.route.params['_value']));
        const navigateLink = '/residents/form/' + result.residentId + '/add_order';
        this._router.navigate([navigateLink], {
          queryParams: {
            orderId: this._aes256Service.encFnWithsalt(null),
            residentId: this._aes256Service.encFnWithsalt(result.residentId),
            orderType: orderType
          },
        });
      }
    })
  }

  async onSubmit(f) {
    const valid = f.form.status;
    if (valid === 'VALID' && this.showLink === false) {
      this.showLink = true;
      this.linkForm.userId = sessionStorage.getItem('user_Id');
      const hashingPayload = (this._aes256Service.encFnWithsalt(this.linkForm));
      this.link = (this._platformLocation as any).location.origin + '/livedashboard/' + hashingPayload;
      this.links = true;
    }
  }

  async perfomanceLink() {
    this.showLink = true;
    this.linkForm.userId = sessionStorage.getItem('user_Id');
    this.linkForm.organization = this.orginization;
    this.linkForm.facility = this.facility;
    this.linkForm.utc_time = this.utc_timezone;
    // console.log(this.linkForm);
    const hashingPayload = (this._aes256Service.encFnWithsalt(this.linkForm));
    this.link = (this._platformLocation as any).location.origin + '/livedashboard/' + hashingPayload;
    this.links = true;
  }

  async statusLink() {
    /* const valid = f.form.status;
    console.log(this.statusForm);
    if (valid === 'VALID' && this.showstatusLink === false) { */
    this.showstatusLink = true;
    this.statusForm.userId = sessionStorage.getItem('user_Id');
    this.statusForm.organization = this.orginization;
    this.statusForm.facility = this.facility;
    this.statusForm.utc_time = this.utc_timezone
    const hashingPayload = (this._aes256Service.encFnWithsalt(this.statusForm));
    // console.log(hashingPayload);
    this.statuslink = (this._platformLocation as any).location.origin + '/statusdashboard/' + hashingPayload;
    this.statuslinks = true;
    //}
  }

  async alertLink() {
    /*  const valid = f.form.status;
        if (valid === 'VALID' && this.showalertLink === false) { */
    this.showalertLink = true;
    this.alertForm.userId = sessionStorage.getItem('user_Id');
    this.alertForm.organization = this.orginization;
    this.alertForm.facility = this.facility;
    this.alertForm.utc_time = this.utc_timezone
    const hashingPayload = (this._aes256Service.encFnWithsalt(this.alertForm));
    this.alertlink = (this._platformLocation as any).location.origin + '/alertdashboard/' + hashingPayload;
    this.alertlinks = true;
    //}
  }

  async activityLink() {
    var _foundFacility = JSON.parse(sessionStorage.getItem('authReducer'));
    /*  const valid = f.form.status;
        if (valid === 'VALID' && this.showalertLink === false) { */
    this.showactivityLink = true;
    this.activityForm.userId = sessionStorage.getItem('user_Id');
    this.activityForm.organization = this.orginization;
    console.log("Facility",_foundFacility.fac_id);
    this.activityForm.facility = this.facility ? this.facility : _foundFacility.fac_id;
    console.log(this.activityForm.facility)
    this.activityForm.utc_time = this.utc_timezone;
    const hashingPayload = (this._aes256Service.encFnWithsalt(this.activityForm));
    this.activitylink = (this._platformLocation as any).location.origin + '/activitydashboard/' + hashingPayload;
    this.activitylinks = true;
    //}
  }

  async tempPerfomanceLink() {
    this.showLink = true;
    this.linkForm.userId = sessionStorage.getItem('user_Id');
    this.linkForm.organization = this.orginization;
    this.linkForm.facility = this.facility;
    this.linkForm.utc_time = this.utc_timezone;
    // console.log('tempPerfomanceLink----->', this.linkForm);
    const hashingPayload = (this._aes256Service.encFnWithsalt(this.linkForm));
    this.templink = (this._platformLocation as any).location.origin + '/livedashboard/' + hashingPayload;
    this.templinks = true;
  }


  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goShiftReport(): void {
    this._commonService.setLoader(true);
    this._router.navigate(['/reports/shiftcereport']);
  }

  goMissedChkInReport(): void {
    this._commonService.setLoader(true);
    this._router.navigate(['/reports/missedlevel1checkin']);
  }

  goCustomReport(): void {
    this._commonService.setLoader(true);
    this._router.navigate(['/reports/report']);
  }

  goSchedule(): void {
    this._commonService.setLoader(true);
    this._router.navigate(['/scheduling']);
  }

  ngOnDestroy(): void {
    if (this.subscriptiondata) {
      this.subscriptiondata.unsubscribe();
      this.announcementSubscribe.unsubscribe();
      this.subscription.unsubscribe();
      //this.subscription1.unsubscribe();
      //this.subscription2.unsubscribe();
      this.subscription3.unsubscribe();
      this.subscription4.unsubscribe();
      this.subscription5.unsubscribe();
      this.orderSubscription.unsubscribe();
      this.residentSubscription.unsubscribe();
      this.careSubscription.unsubscribe();
    }
    this.socketSubscription.unsubscribe();
    this._socketService.disConnectFn(this.roomName).subscribe(async (_result: any) => {
      // console.log("result after socket disconnection >>>>>", _result)
    });
    this.joinRoomFn('ANNOUNCE', true);
    this.joinRoomFn('EMAR', true);
    this.joinRoomFn('CARE', true);
  }


  async getIsolatedResiList() {
    const action = {
      type: 'GET',
      target: 'residents/isolated_list'
    };
    const payload = {
      'facility': this.facility
    };
    const result = await this._apiService.apiFn(action, payload);
    this.isolated_residents = result['data'];

  }

  async getDashCardsCountFn() {
    const action = {
      type: 'POST',
      target: 'dashboard/get_dashboard_card_count'
    };
    const payload = {
      'facId': this.facility,
      'timeZone': this.utc_timezone,
    };
    const result = await this._apiService.apiFn(action, payload);
    this.dashCardData = result['data'];
    // console.log('this.dashCardData---->', this.dashCardData);
  }

  async getDashOrdersCountFn() {
    const action = {
      type: 'GET',
      target: 'servicePlan/orders_count'
    };
    const payload = {
      fac_id: this.facility
    };
    const result = await this._apiService.apiFn(action, payload);
    console.log("Orders Count data----", result);

    this.ordersCountData = result['data'];
    // console.log('this.dashCardData---->', this.dashCardData);
  }

  checkIsolation(residentId) {
    const inx = this.isolated_residents.findIndex(ele => ele._id == residentId);

    return (inx > -1) ? this.isolated_residents[inx] : false;
  }

  async previousShiftData() {

    let timezone = this.utc_timezone

    let currentTime = moment.tz(timezone).format('LLLL');
    let hr = moment.tz(timezone).hour();
    let shift;
    let range: any = {
      start_time: '',
      end_time: ''
    }

    if (hr > 0 && hr <= 6) {
      shift = 0
      this.ord = '2nd'
    } else if (hr > 6 && hr <= 14) {
      shift = 1
      this.ord = '3rd'
    } else if (hr > 14 && hr <= 22) {
      shift = 2
      this.ord = '1st'
    } else if (hr > 22 || hr == 0) {
      shift = 3
      this.ord = '2nd'
    }

    if (shift == 0) {
      range.start_time = moment.tz(timezone).subtract(1, 'day').set({ hour: 14, minute: 0, second: 0, milliseconds: 0 })
      range.end_time = moment.tz(timezone).subtract(1, 'day').set({ hour: 22, minute: 0, second: 0, milliseconds: 0 })
    } else if (shift == 1) {
      range.start_time = moment.tz(timezone).subtract(1, 'day').set({ hour: 22, minute: 0, second: 0, milliseconds: 0 })
      range.end_time = moment.tz(timezone).set({ hour: 6, minute: 0, second: 0, milliseconds: 0 })
    } else if (shift == 2) {
      range.start_time = moment.tz(timezone).set({ hour: 6, minute: 0, second: 0, milliseconds: 0 })
      range.end_time = moment.tz(timezone).set({ hour: 14, minute: 0, second: 0, milliseconds: 0 })
    } else if (shift == 3) {
      range.start_time = moment.tz(timezone).set({ hour: 14, minute: 0, second: 0, milliseconds: 0 })
      range.end_time = moment.tz(timezone).set({ hour: 22, minute: 0, second: 0, milliseconds: 0 })
    }

    let sTimeUTC = range.start_time.utc().hours();
    let eTimeUTC = range.end_time.utc().hours();
    let sMinute = range.start_time.utc().minutes();
    let eMinute = range.end_time.utc().minutes();

    const payload = {
      'shift': 1,
      'start_date': range.start_time.valueOf(),
      'end_date': range.end_time.valueOf(),
      sTimeUTC: sTimeUTC,
      eTimeUTC: eTimeUTC,
      facId: this.facility,
      orgId: this.orginization,
      sMinute: sMinute,
      eMinute: eMinute,
      timezone: timezone
    };


    // console.log('currenttime', currentTime, shift, range, payload)

    const action = { type: 'POST', target: 'reports/shift_count_new' };
    const result = await this._apiService.apiFn(action, payload);

    this.userData = result['data']['reports']['reportValue'];

    this.userData = this.userData.map(e => ({
      user: `${e.userData.last_name}, ${e.userData.first_name}`,
      time: this.formattedTime(e.report.totalCareTime),
      is_success: moment(e.report.totalCareTime).hour() < 0 ? false : true
    }))
  }
  formattedTime(ms: any) {
    const formattedTime = this._commonService.createTime(+ms)
    return formattedTime
  }

  async joinRoomFn(roomName, isLeaveRoom = false) {
    let room = `${this.facility}-${roomName}`;

    //leave room
    if (isLeaveRoom) {
      this._socketService.leaveRoomFn(room).subscribe((res: any) => {
        if (res.connected) {
          // console.log('exit')
        }
      })
    } else {
      this._socketService.connectFn(room).subscribe((res: any) => {
        if (res.connected) {
          // console.log('entry');
        }
      });

    }


  }

  scheduleTime(schedule) {
    const start = moment.unix(schedule.start_time / 1000);
    const end = moment.unix(schedule.start_time / 1000).add(schedule.duration, 'second');
    return moment(start).tz(this.timezone).format("HH:mm") + ' - ' + moment(end).tz(this.timezone).format('HH:mm');
  }

  async getMissedCares() {
    let payload;
    payload = {
      org_id: this.orginization,
      fac_id: this.facility,
    };
    await this._apiService.apiFn({ type: 'GET', target: 'schedule/dashboardMissedCare' }, payload)
      .then((result: any) => {
        this.missedCareData = result.data;
        this.missedCareData.filter((item) => {
          const value = moment.unix(item.start_time / 1000);
          let h = moment(value).tz(this.timezone).format("HH");
          let m = moment(value).tz(this.timezone).format("mm");
          item['sortValue'] = Number(h) * 60 + Number(m);
        })
        this.missedCareData.sort((a, b) => a.sortValue - b.sortValue);
      })
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
