import {AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ApiService} from './../shared/services/api/api.service';
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import {SocketService} from './../shared/services/socket/socket.service';
import {Aes256Service} from './../shared/services/aes-256/aes-256.service';
import $ from 'jquery';
import {MatTableDataSource} from '@angular/material';
import {Subscription} from 'rxjs';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConnectionService} from 'ng-connection-service';

@Component({
  selector: 'app-alertdashboard',
  templateUrl: './alertdashboard.component.html',
  styleUrls: ['./alertdashboard.component.scss'],
})
export class AlertdashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['resident', 'room'];
  displayedColumnsIsolation: string[] = ['resident', 'room'];
  displayedColumnsFall: string[] = ['resident', 'room', 'care', 'performer'];
  hashCode: any;
  linkData: any;
  _date: any;
  _time: any;
  facility: any;
  newdata = false;
  isolated_residents: any = [];
  getFallData: any;
  getNotifyData: any;
  dataSource: MatTableDataSource<Element>;
  exceptionalRiskShow = false;
  exceptional_risk: any = [];
  exceptional_count;
  dataSource1: MatTableDataSource<Element>;
  testing_status_list: any = [];
  dataSource2: MatTableDataSource<Element>;
  dataSource3: MatTableDataSource<Element>;
  dataSource4: MatTableDataSource<Element>;
  IsolatedResi: any;
  announce: any;
  totalPostive: any;
  private announcementSubscribe: Subscription;

  dialogRefs = null;
  isConnected = true;
  status = 'ONLINE';
  @ViewChild('connectionModal', {static: true}) connectionModal: TemplateRef<any>;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private aes256Service: Aes256Service,
    private connectionService: ConnectionService,
    public dialog: MatDialog,
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

  async ngOnInit() {
    let hashcode: any;
    this.hashCode = hashcode = this.route.params['_value']['id'];
    // hashCode = atob(hashCode);
    this.linkData = this.aes256Service.decFnWithsalt(hashcode);

    await this.joinRoomFn('CARE', false);
    await this.joinRoomFn('ANNOUNCE', false);
    await this.joinRoomFn('RESI', false);
    await this.joinRoomFn('TRACK', false);

    if (!this.hashCode) {
      this.router.navigate(['/']);
    }

    if (!this.linkData.organization) {
      this.router.navigate(['/']);
    }
    this.getFacility();
    this.getIsolatedResiList();
    this.getExceptionalRisk();
    this.getTestingStatusList();
    this.getcareByFallList();
    this.getcareByNotifyList();
    this.getAnnouncementFn();
    this.getTotalPostive();
    setInterval(async () => {
      this.getDateTime();
    }, 1000);
    this.socketService.connectedEvent('alertdash', { platform: 'web' });
    // Socket Realtime Data Changes Started
    // Delete resident start
    this.socketService.deleteResidentFn().subscribe((_response) => {
      // console.log('Delete Resident',_response);
      if (_response) {
        this.getIsolatedResiList();
        this.getExceptionalRisk(true);
        this.getTestingStatusList();
        this.getcareByFallList();
        this.getcareByNotifyList();
        this.getTotalPostive();
      }
    });
    // Delete resident end

    this.socketService.addResidentFn().subscribe((_response) => {
      // console.log('Add resident',_response);
      this.newdata = true;
      if (_response) {
        this.getExceptionalRisk(true);
        this.getTotalPostive();
      }
    });

    this.socketService.updateResidentFn().subscribe((_response) => {
      // console.log('Update resident',_response);
      this.newdata = true;
      if (_response) {
        this.getExceptionalRisk(true);
        this.getTotalPostive();
        this.getIsolatedResiList();
        this.getTestingStatusList();
      }
    });

    this.socketService
      .onResidentIsIsolationFn()
      .subscribe(async (_response: any) => {
        // console.log('onResidentIsIsolationFn',_response);
        if (_response) {
          const index = _response.facility.findIndex(
            (item) => item.fac === this.linkData.facility
          );
          // console.log('isolation index>>',index)
          if (index > -1) {
            const index1 = this.isolated_residents.findIndex(
              (item) => _response._ids.indexOf(item._id) > -1
            );
            if (index1 > -1) {
              const EndTime = _response.end_time_isolation;
              const StartTime = _response.start_time_isolation;
              this.isolated_residents[index1]['isolation_end_date'] = '';
              this.isolated_residents[index1]['isolation_start_date'] = '';
              this.isolated_residents[index1]['room'] = _response.room;
              this.isolated_residents[index1]['isolation_days'] =
                _response.custom_days;
              setTimeout(() => {
                this.isolated_residents[index1]['isolation_end_date'] = EndTime;
                this.isolated_residents[index1][
                  'isolation_start_date'
                ] = StartTime;
              }, 0);
              this.getExceptionalRisk(true);
              // this.checkIsolationWithexceptionalRisk();
              // console.log('isolated_residents',this.isolated_residents);
              this.createTable('dataSource', this.isolated_residents);
            } else {
              // tslint:disable-next-line: max-line-length
              if (_response.room !== null) {
                this.isolated_residents.push({
                  _id: _response._ids[0],
                  first_name: _response.first_name,
                  last_name: _response.last_name,
                  isolation_end_date: _response.end_time_isolation,
                  isolation_start_date: _response.start_time_isolation,
                  room: _response.room,
                  isolation_days: _response.custom_days,
                });
              }
              // this.checkIsolationWithexceptionalRisk();
              this.getExceptionalRisk(true);
              // console.log('isolated_residents',this.isolated_residents);
              this.createTable('dataSource', this.isolated_residents);
            }
          }
        }
      });

    this.socketService
      .onResidentStopIsolationFn()
      .subscribe(async (_response: any) => {
        // console.log('onResidentStopIsolationFn',_response);
        if (_response) {
          const index = this.isolated_residents.findIndex(
            (item) => _response.resident_id == item._id
          );
          // console.log('stop index>>',index)
          if (index > -1) {
            this.isolated_residents.splice(index, 1);
            // console.log('isolated_residents',this.isolated_residents);
            this.createTable('dataSource', this.isolated_residents);
          }
        }
      });

    this.socketService
      .onResidentTestingStatusFn()
      .subscribe(async (_response: any) => {
        // console.log('onResidentTestingStatusFn', _response);
        if (_response) {
          // console.log('socket testing data',_response)

          const index = _response.facility.findIndex(
            (item) => item.fac === this.linkData.facility
          );
          // console.log('index>>',index)
          if (index > -1) {
            const index1 = this.testing_status_list.findIndex(
              (item) => _response._id == item._id
            );
            if (index1 > -1) {
              if (_response.testing_status != '' && _response.testing_status != 'None') {
                this.testing_status_list[index1]['testing_status'] =
                  _response.testing_status;
                this.createTable('dataSource2', this.testing_status_list);
              } else if (_response.testing_status == 'None') {
                this.testing_status_list.splice(index1, 1);
                this.createTable('dataSource2', this.testing_status_list);
              } else {
                this.testing_status_list.splice(index1, 1);
                this.createTable('dataSource2', this.testing_status_list);
              }
            } else {
              if (_response.testing_status != '') {
                if (_response.room != null || _response.room != '') {
                  this.testing_status_list.push({
                    _id: _response._id,
                    first_name: _response.first_name,
                    last_name: _response.last_name,
                    testing_status: _response.testing_status,
                    room: _response.room,
                  });
                } else {
                  this.testing_status_list.push({
                    _id: _response._id,
                    first_name: _response.first_name,
                    last_name: _response.last_name,
                    testing_status: _response.testing_status,
                  });
                }
                this.createTable('dataSource2', this.testing_status_list);
              }
            }
            // console.log('testing_status_list',this.testing_status_list);
          }
        }
        this.getTotalPostive();
        this.getExceptionalRisk(true);
      });

    this.socketService.onTrackCareUpdateFn().subscribe((_response) => {
      if (_response) {
        this.getcareByFallList();
        this.getcareByNotifyList();
        this.getTotalPostive();
        this.getExceptionalRisk(true);
      }
    });

    this.socketService.updateZoneFn().subscribe((_response) => {
      if (_response) {
        this.getcareByFallList();
        this.getcareByNotifyList();
        this.getTotalPostive();
        this.getExceptionalRisk(true);
      }
    });

    this.socketService.getAnnouncementFn().subscribe(async (res: any) => {
      if (res) {
        this.getAnnouncementFn();
      }
    });

    // Socket Realtime Data Changes Ended
  }

  sendMail() {
    const payload = {
      facilityId: this.linkData.facility,
      organizationId: this.linkData.organization,
      userId: this.linkData.userId,
      dashboard: 'Alert and Announcement Dashboard'
    };
    this.socketService.onDashboardDown(payload).subscribe();
  }

  scrollerFunc(classTable) {
    const that = this;
    const scroller = function (obj) {
      const scCnt = $(obj).scrollTop() + 2;
      $(obj).animate({ scrollTop: scCnt }, 100, function () {});
      if (
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
      if (classTable === 'rmno.data-rooms') {
        const scrollHeight = $(document)
          .find('.' + classTable)
          .find('.scroller span')
          .height();
        scroller($(document).find('.' + classTable));
      } else if (classTable === 'announcement-scroll') {
        const scrollHeight = $(document)
          .find('.' + classTable)
          .find('.scroller mat-card')
          .height();
        scroller($(document).find('.' + classTable));
      } else {
        const scrollHeight = $(document)
          .find('.' + classTable)
          .find('.scroller tbody')
          .height();
        scroller($(document).find('.' + classTable));
      }
    }, 1000);
  }

  ngAfterViewInit() {
    this.scrollerFunc('table-level-isolation');
    this.scrollerFunc('table-exceptional-risk');
    this.scrollerFunc('table-level-testing');
    this.scrollerFunc('table-level-fall');
    this.scrollerFunc('table-level-notify');
  }

  // Keep me Signed in
  public doUnload(): void {
    this.doBeforeUnload();
  }

  // Keep me Signed in
  public doBeforeUnload(): void {
    // Clear localStorage
    this.socketService.connectedEvent('disconnectalertdash', {
      platform: 'web',
    });
  }

  async getDateTime() {
    this._date = moment().tz(this.linkData.utc_time).format('MMMM Do YYYY');
    this._time = moment().tz(this.linkData.utc_time).format('HH:mm');
  }

  async getFacility() {
    //const id = this.aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
    const action = { type: 'POST', target: 'facility/getfac' };
    const payload = { facilityId: this.linkData.facility };
    const result = await this.apiService.apiFn(action, payload);

    // //console.log('fac data>>',result['data'])
    this.facility = result['data']['fac_name'];
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
    //console.log('>>>>',this.isolated_residents)
    // this.checkIsolationWithexceptionalRisk();
    this.createTable('dataSource', this.isolated_residents);
    $(document).find('.table-level-isolation').scrollTop(0);
  }

  async getExceptionalRisk(fromSocket = false) {
    this.exceptionalRiskShow = false;
    const action = {
      type: 'GET',
      target: 'residents/exceptional_risk',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    let result = await this.apiService.apiFn(action, payload);
    result['data'] = result['data'].filter(ele => {
      return ele.disease_id.length > 0;
    });
    this.exceptional_risk = result['data'];
    this.exceptional_count = result['data'].length;
    // console.log('exceptional_risk', this.exceptional_risk)
    this.createTable('dataSource1', this.exceptional_risk);
    $(document).find('.table-exceptional_risk').scrollTop(0);
  }
  timerCompleted(event) {
    // //console.log('timer end ',event)
    const index = this.isolated_residents.findIndex(
      (item) => item._id === event.endTimer
    );
    // //console.log('index',index)
    if (index > -1) {
      this.isolated_residents.splice(index, 1);
      this.createTable('dataSource', this.isolated_residents);
    }
  }

  async getTestingStatusList() {
    this.exceptionalRiskShow = false;
    const action = {
      type: 'GET',
      target: 'residents/testing_status_list',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.testing_status_list = result['data'];
    this.createTable('dataSource2', this.testing_status_list);
    $(document).find('.table-level-testing').scrollTop(0);
  }

  async getcareByFallList() {
    const action = {
      type: 'POST',
      target: 'reports/total_fall_live_count_report',
    };
    const payload = {
      facId: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.getFallData = [];
    this.getFallData = result['data'];
    this.createTable('dataSource3', this.getFallData);
    //console.log(this.getFallData);
    // this.scrollerFunc();
    $(document).find('.table-level-fall').scrollTop(0);
  }

  async getcareByNotifyList() {
    const action = {
      type: 'POST',
      target: 'reports/total_notify_care_report',
    };
    const payload = {
      facId: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.getNotifyData = result['data'];
    //console.log(this.getNotifyData);
    this.createTable('dataSource4', this.getNotifyData);
    // this.scrollerFunc();
    $(document).find('.table-level-notify').scrollTop(0);
  }

  async getAnnouncementFn() {
    const action = {
      type: 'GET',
      target: 'announcement/get',
    };
    const payload = {
      fac_id: this.linkData.facility,
      org_id: this.linkData.organization,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.announce = result['data'];
    //console.log(this.announce);
  }

  async getTotalPostive() {
    const action = {
      type: 'POST',
      target: 'residents/res_status',
    };
    const payload = {
      facId: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.totalPostive = result['data'];
    //console.log(this.totalPostive);
  }

  createTable(source, arr) {
    const tableArr: Element[] = arr;
    if (this[source] == undefined) {
      this[source] = new MatTableDataSource(tableArr);
    } else {
      this[source].data = tableArr;
    }
    // this.dataSource.sort = this.sort;
  }
  checkIsolation(residentId) {
    const inx = this.isolated_residents.findIndex(
      (ele) => ele._id == residentId
    );

    return inx > -1 ? this.isolated_residents[inx] : false;
  }
  exceptionalRiskCount(highRiskList) {
    if (highRiskList.length > 0) {
      let num = 0;
      highRiskList.forEach((element) => {
        const inx = this.isolated_residents.findIndex(
          (ele) => ele._id == element._id
        );
        if (inx == -1) {
          num++;
        }
      });
      return num > 0 ? num : '';
    } else {
      return '0';
    }
  }

  ngOnDestroy() {
    // leave room
    this.joinRoomFn('CARE', true);
    this.joinRoomFn('ANNOUNCE', true);
    this.joinRoomFn('RESI', true);
    this.joinRoomFn('TRACK', true);
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
}
