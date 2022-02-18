import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ApiService } from './../shared/services/api/api.service';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from './../shared/services/socket/socket.service';
import { Aes256Service } from './../shared/services/aes-256/aes-256.service';
import { Chart } from 'chart.js';
import $ from 'jquery';
import { MatTableDataSource } from '@angular/material';
import { ConnectionService } from 'ng-connection-service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

export interface PeriodicElement {
  resident: string;
  room: number;
}

@Component({
  selector: 'app-statusdashboard',
  templateUrl: './statusdashboard.component.html',
  styleUrls: ['./statusdashboard.component.scss'],
})
export class StatusdashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  displayedColumns: string[] = ['resident', 'room'];
  displayedColumnsIsolation: string[] = [
    'resident',
    'isolation_end_date',
    'room',
  ];
  hashCode: any;
  linkData: any;
  level_one: any;
  level_two: any;
  level_three: any;
  safety_supervision: any;
  supervision: any;
  vacation: any;
  hospitalized: any;
  skilled_nursing: any;
  hospice: any;
  outoffac: any;
  outofroom: any;
  totalResident: any;
  extendoutoffac: any;
  infac: any;
  ready;
  not_ready;
  doughnutChart: any;
  doughnutChart2: any;
  count;
  // Doughnut
  _date: any;
  _time: any;
  rooms: any;
  not_ready_rooms: any;
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

  Color = [
    {
      backgroundColor: ['#28A5DE', '#1975B8'],
    },
  ];
  Color2 = [
    {
      backgroundColor: ['#28A5DE', '#1975B8'],
    },
  ];
  facility;
  announcements;
  newdata = false;
  isolated_residents: any = [];

  dataSource: MatTableDataSource<Element>;
  exceptionalRiskShow = false;
  exceptional_risk: any = [];
  dataSource1: MatTableDataSource<Element>;
  testing_status_list: any = [];
  dataSource2: MatTableDataSource<Element>;
  IsolatedResi: any;

  dialogRefs = null;
  isConnected = true;
  status = 'ONLINE';
  @ViewChild('connectionModal', { static: true })
  connectionModal: TemplateRef<any>;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private aes256Service: Aes256Service,
    private connectionService: ConnectionService,
    public dialog: MatDialog
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

  ngOnInit() {
    let hashcode: any;
    this.hashCode = hashcode = this.route.params['_value']['id'];

    if (!this.hashCode) {
      this.router.navigate(['/']);
    }
    // hashCode = atob(hashCode);
    this.linkData = this.aes256Service.decFnWithsalt(hashcode);

    if (!this.linkData.organization) {
      this.router.navigate(['/']);
    }

    // joins rooms
    this.joinRoomFn('RESI', false);
    this.joinRoomFn('MASTER', false);
    this.joinRoomFn('ANNOUNCE', false);

    this.getFacility();
    this.getAnnouncements();
    this.getLevelList();
    this.getStatusList();
    this.getHospiceList();
    this.getOutoffacList();
    this.getOutoffacRoom();
    this.getTotalResident();
    this.getcensusdata();
    this.getopenroomsdata();
    this.getIsolatedResiList();
    this.getExceptionalRisk();
    this.getTestingStatusList();

    setInterval(async () => {
      this.getDateTime();
    }, 1000);
    this.socketService.connectedEvent('statusdash', { platform: 'web' });
    // Delete resident start
    this.socketService.deleteResidentFn().subscribe((_response) => {
      if (_response) {
        this.getLevelList();
        this.getStatusList();
        this.getHospiceList();
        this.getOutoffacList();
        this.getOutoffacRoom();
        this.getcensusdata();
        this.getTotalResident();
        this.getopenroomsdata();
      }
    });
    // Delete resident end
    this.socketService.addResidentFn().subscribe((_response) => {
      this.newdata = true;
      if (_response) {
        this.getLevelList();
        this.getStatusList();
        this.getHospiceList();
        this.getOutoffacList();
        this.getOutoffacRoom();
        this.getcensusdata();
        this.getTotalResident();
      }
    });

    this.socketService.updateResidentFn().subscribe((_response) => {
      this.newdata = true;
      if (_response) {
        console.log(_response);
        this.getLevelList();
        this.getStatusList();
        this.getHospiceList();
        this.getOutoffacList();
        this.getOutoffacRoom();
        this.getcensusdata();
        this.getTotalResident();
      }
    });

    this.socketService.onResidentOutRoomFn().subscribe((_response) => {
      if (_response) {
        console.log(_response);
        this.getOutoffacRoom();
      }
    });
    this.socketService.updateZoneFn().subscribe((_response) => {
      if (_response) {
        this.getopenroomsdata();
        this.getLevelList();
        this.getStatusList();
        this.getHospiceList();
        this.getOutoffacList();
        this.getOutoffacRoom();
        this.getcensusdata();
      }
    });

    this.socketService
      .onResidentIsIsolationFn()
      .subscribe(async (_response: any) => {
        if (_response) {
          const index = _response.facility.findIndex(
            (item) => item.fac === this.linkData.facility
          );
          console.log('isolation index>>', index);
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
                this.isolated_residents[index1]['isolation_start_date'] =
                  StartTime;
              }, 0);

              // this.checkIsolationWithexceptionalRisk();
              this.createTable('dataSource', this.isolated_residents);
            } else {
              // tslint:disable-next-line: max-line-length
              this.isolated_residents.push({
                _id: _response._ids[0],
                first_name: _response.first_name,
                last_name: _response.last_name,
                isolation_end_date: _response.end_time_isolation,
                isolation_start_date: _response.start_time_isolation,
                room: _response.room,
                isolation_days: _response.custom_days,
              });
              // this.checkIsolationWithexceptionalRisk();
              this.createTable('dataSource', this.isolated_residents);
            }
          }
        }
      });

    this.socketService
      .onResidentStopIsolationFn()
      .subscribe(async (_response: any) => {
        if (_response) {
          const index = this.isolated_residents.findIndex(
            (item) => _response.resident_id == item._id
          );
          console.log('stop index>>', index);
          if (index > -1) {
            this.isolated_residents.splice(index, 1);
            this.createTable('dataSource', this.isolated_residents);
          }
        }
      });

    this.socketService
      .onResidentTestingStatusFn()
      .subscribe(async (_response: any) => {
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
            // console.log('index 1>>',index1);
            if (index1 > -1) {
              if (_response.testing_status != '') {
                this.testing_status_list[index1]['testing_status'] =
                  _response.testing_status;
                this.createTable('dataSource2', this.testing_status_list);
              } else {
                this.testing_status_list.splice(index1, 1);
                this.createTable('dataSource2', this.testing_status_list);
              }
            } else {
              if (_response.testing_status != '') {
                this.testing_status_list.push({
                  _id: _response._id,
                  first_name: _response.first_name,
                  last_name: _response.last_name,
                  testing_status: _response.testing_status,
                });
                this.createTable('dataSource2', this.testing_status_list);
              }
            }
          }
        }
      });
  }

  sendMail() {
    const payload = {
      facilityId: this.linkData.facility,
      organizationId: this.linkData.organization,
      userId: this.linkData.userId,
      dashboard: 'Facility Status Dashboard',
    };
    this.socketService.onDashboardDown(payload).subscribe();
  }

  scrollerFunc(classTable) {
    const that = this;
    const scroller = function (obj) {
      // console.log(obj);
      if (obj) {
        const scCnt = $(obj).scrollTop() + 2;
        $(obj).animate({ scrollTop: scCnt }, 100, function () {});
        if ( $(obj)[0] &&  $(obj)[0].scrollHeight &&
          $(obj).scrollTop() + Math.ceil($(obj).innerHeight()) >=
          $(obj)[0].scrollHeight
        ) {
          $(obj).animate({ scrollTop: 0 }, 800, function () {});
        }
        setTimeout(function () {
          scroller(obj);
        }, 1000);
      }
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
    this.scrollerFunc('table-level-outfac');
    this.scrollerFunc('table-level-one');
    this.scrollerFunc('table-level-two');
    this.scrollerFunc('table-level-three');
    this.scrollerFunc('announcement-scroll');
    this.scrollerFunc('table-level-vacation');
    this.scrollerFunc('table-level-skilled_nursing');
    this.scrollerFunc('table-level-hospitalized');
    this.scrollerFunc('table-level-hospice');
    this.scrollerFunc('table-level-isolation');
    this.scrollerFunc('rmno.data-rooms');
    this.scrollerFunc('table-exceptional-risk');
    this.scrollerFunc('table-level-testing');
    this.scrollerFunc('table-safety_supervision');
    this.scrollerFunc('table-supervision');
    this.scrollerFunc('table-level-outroom');
  }

  // Keep me Signed in
  public doUnload(): void {
    this.doBeforeUnload();
  }

  // Keep me Signed in
  public doBeforeUnload(): void {
    // Clear localStorage
    this.socketService.connectedEvent('disconnectstatusdash', {
      platform: 'web',
    });
  }

  async getDateTime() {
    this._date = moment().tz(this.linkData.utc_time).format('MMMM Do YYYY');
    this._time = moment().tz(this.linkData.utc_time).format('HH:mm');
  }

  async getFacility() {
    // const id = this.aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
    const action = { type: 'POST', target: 'facility/getfac' };
    const payload = { facilityId: this.linkData.facility };
    const result = await this.apiService.apiFn(action, payload);

    // console.log('fac data>>',result['data'])
    this.facility = result['data']['fac_name'];
  }

  async getLevelList() {
    this.level_one = [];
    this.level_two = [];
    this.level_three = [];
    this.safety_supervision = [];
    this.supervision = [];
    const action = {
      type: 'GET',
      target: 'residents/residents_level',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    result['data'].map((item) => {
      if (item && item.level === 'Level 1') {
        this.level_one = item.data;
      }
      if (item && item.level === 'Level 2') {
        this.level_two = item.data;
      }
      if (item && item.level === 'Level 3') {
        this.level_three = item.data;
      }
      if (item && item.level === 'Safety and Supervision (24 hours)') {
        this.safety_supervision = item.data;
      }
      if (item && item.level === 'Supervision (during waking hours)') {
        this.supervision = item.data;
      }
    });

    console.log(result['data']);

    // this.scrollerFunc();
    $(document).find('.table-level-one').scrollTop(0);
    $(document).find('.table-level-two').scrollTop(0);
    $(document).find('.table-level-three').scrollTop(0);
    $(document).find('.table-safety_supervision').scrollTop(0);
    $(document).find('.table-supervision').scrollTop(0);
  }

  async getStatusList() {
    this.vacation = [];
    this.hospitalized = [];
    this.skilled_nursing = [];
    const action = {
      type: 'GET',
      target: 'residents/residents_status',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    console.log(result);
    result['data'].map((item) => {
      console.log(item)
      if (item && item._id === 'Vacation') {
        this.vacation = item.data;
      }
      if (item && item._id === 'Hospitalized') {
        this.hospitalized = item.data;
      }
      if (item && item._id === 'Skilled Nursing') {
        this.skilled_nursing = item.data;
        console.log(this.skilled_nursing);
      }
    });
    $(document).find('.table-level-vacation').scrollTop(0);
    $(document).find('.table-level-skilled_nursing').scrollTop(0);
    $(document).find('.table-level-hospitalized').scrollTop(0);
  }

  async getHospiceList() {
    const action = {
      type: 'GET',
      target: 'residents/list_hospice',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.hospice = result['data'];

    $(document).find('.table-level-hospice').scrollTop(0);
  }

  async getOutoffacList() {
    const action = {
      type: 'GET',
      target: 'residents/list_outoffac',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.outoffac = result['data'];
    // this.scrollerFunc();
    $(document).find('.table-level-outfac').scrollTop(0);
  }

  async getOutoffacRoom() {
    const action = {
      type: 'GET',
      target: 'residents/list_out_room',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.outofroom = result['data'];
    console.log(this.outofroom);
    // this.scrollerFunc();
    $(document).find('.table-level-outroom').scrollTop(0);
  }

  async getTotalResident() {
    const action = {
      type: 'GET',
      target: 'reports/total_resident',
    };
    const payload = {
      fac_id: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.totalResident = result['data'];
    console.log(this.totalResident);
  }

  async getcensusdata() {
    const action = {
      type: 'GET',
      target: 'residents/census_graph',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.extendoutoffac = result['data']['outoffac'];
    this.infac = result['data']['infac'];
    if (this.doughnutChart == undefined) {
      this.doughnutChart = new Chart('doughnutChart', {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: [this.infac, this.extendoutoffac],
              backgroundColor: ['#1975B8', '#85CFEB'],
            },
          ],
        },
        options: this.chartOptions,
      });
    } else {
      this.doughnutChart.data = {
        datasets: [
          {
            data: [this.infac, this.extendoutoffac],
            backgroundColor: ['#1975B8', '#85CFEB'],
          },
        ],
      };
    }
  }

  async getopenroomsdata() {
    const action = {
      type: 'GET',
      target: 'zones/open_rooms_graph',
    };
    const payload = {
      facility: this.linkData.facility,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.rooms = result['data']['ready']
      .map((itm) => itm.room)
      .toString()
      .replace(/,/g, ', ');
    this.not_ready_rooms = result['data']['not_ready']
      .map((itm) => itm.room)
      .toString()
      .replace(/,/g, ', ');
    $(document).find('.rmno.data-rooms').scrollTop(0);

    this.ready = result['data']['ready'].length;
    this.not_ready = result['data']['not_ready'].length;
    this.doughnutChart2 = new Chart('doughnutChart2', {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [this.ready, this.not_ready - this.ready],
            // backgroundColor: [  '#1975B8', '#85CFEB'  ]
            backgroundColor: ['#3BB54A', '#1975B8'],
          },
        ],
      },
      options: this.chartOptions,
    });
  }

  async getAnnouncements() {
    const action = { type: 'GET', target: 'announcement/get' };
    const payload = {
      fac_id: this.linkData.facility,
      org_id: this.linkData.organization,
    };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data'] && result['data'].length) {
      this.announcements = result['data'];
    } else {
      this.announcements = [];
    }
    $(document).find('.announcement-scroll').scrollTop(0);
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
    // console.log('>>>>',this.isolated_residents)
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
    const result = await this.apiService.apiFn(action, payload);
    this.exceptional_risk = result['data'];
    this.createTable('dataSource1', this.exceptional_risk);
    $(document).find('.table-exceptional_risk').scrollTop(0);

    // if(fromSocket){
    //  // this.checkIsolationWithexceptionalRisk();
    // }
  }
  // checkIsolationWithexceptionalRisk(){
  //   setTimeout(()=>{
  //     this.exceptional_risk.forEach((element,i) => {
  //       const inx=this.isolated_residents.findIndex(ele=>ele._id==element._id);
  //       if(inx>-1){
  //         this.exceptional_risk[i]['visible']=false;
  //       }else{
  //         this.exceptional_risk[i]['visible']=true;
  //       }

  //     });
  //     this.createTable('dataSource1',this.exceptional_risk);
  //   },200)
  // }

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

    // console.log(this.isolated_residents[inx]);
    // return (inx>-1)?this.isolated_residents[inx]:false;
  }
  // Covid19 Posivie check
  checkPositive(residentId) {
    const inx = this.testing_status_list.findIndex(
      (ele) => ele._id == residentId
    );
    return inx > -1 ? this.testing_status_list[inx] : false;
  }

  // Covid19 Posivie check
  //   timerCompleted(event){
  //   //console.log('timer end ',event)

  //     const index = this.isolated_residents.findIndex(item => item._id === event.endTimer);
  //     if (index > -1) {
  //      this.isolated_residents.splice(index,1)
  //      this.createTable('dataSource',this.level_two);

  //     }

  // }

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

  async joinRoomFn(room, isLeaveRoom = false) {
    let roomName = `${this.linkData.facility}-${room}`;
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
    // leaves room
    this.joinRoomFn('MASTER', true);
    this.joinRoomFn('RESI', true);
    this.joinRoomFn('ANNOUNCE', true);
  }
}
