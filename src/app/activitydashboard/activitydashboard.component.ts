import {AfterViewInit, Component, Pipe, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ApiService} from '../shared/services/api/api.service';
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import {SocketService} from '../shared/services/socket/socket.service';
import {Aes256Service} from '../shared/services/aes-256/aes-256.service';
import $ from 'jquery';
import {MatTableDataSource} from '@angular/material';
import {Subscription} from 'rxjs';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConnectionService} from 'ng-connection-service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-activitydashboard',
  templateUrl: './activitydashboard.component.html',
  styleUrls: ['./activitydashboard.component.scss'],
})
export class ActivitydashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['resident', 'room'];
  displayedColumnsIsolation: string[] = ['resident', 'room'];
  displayedColumnsFall: string[] = ['resident', 'room', 'care', 'performer'];
  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
  logo: any;
  weekActivities = [];
  upcomingActivity: any;
  description;
  upcomingActivityDate;
  upcomingActivitylocation: any;
  activityPersons;
  residentsBirthday = [];
  currentWeatherConditions;
  socketSubscription: Subscription = new Subscription();
  announcements: any;
  roomName;
  weatherIconData = [
    {
      name: "Sunny",
      icon: 'assets/images/weather/Sunny.png'
    },
    {
      name: "Mostly Sunny",
      icon: 'assets/images/weather/Mostly Sunny.png'
    },
    {
      name: "Partly Sunny",
      icon: 'assets/images/weather/Partly Sunny.png'
    },
    {
      name: "Intermittent Clouds",
      icon: 'assets/images/weather/Intermittent Clouds.png'
    },
    {
      name:  "Hazy Sunshine",
      icon: 'assets/images/weather/Hazy Sunshine.png'
    },
    {
      name: "Mostly Cloudy",
      icon: 'assets/images/weather/Mostly Cloudy.png'
    },
    {
      name: "Cloudy",
      icon: 'assets/images/weather/Cloudy.png'
    },
    {
      name: "Dreary (Overcast)",
      icon: 'assets/images/weather/Dreary (Overcast).png'
    },
    {
      name: "Fog",
      icon: 'assets/images/weather/Fog.png'
    },
    {
      name: "Showers",
      icon: 'assets/images/weather/Showers.png'
    },
    {
      name: "Mostly Cloudy w/ Showers",
      icon: 'assets/images/weather/Mostly Cloudy w_Showers.png'
    },
    {
      name: "Partly Sunny w/ Showers",
      icon: 'assets/images/weather/Partly Sunny w_Showers.png'
    },
    {
      name: "T-Storms",
      icon: 'assets/images/weather/T-Storms.png'
    },
    {
      name:  "Mostly Cloudy w/ T-Storms",
      icon: 'assets/images/weather/Mostly Cloudy w_T-Storms.png'
    },
    {
      name: "Partly Sunny w/ T-Storms",
      icon: 'assets/images/weather/Partly Sunny w_T-Storms.png'
    },
    {
      name: "Rain",
      icon: 'assets/images/weather/Rain.png'
    },
    {
      name: "Flurries",
      icon: 'assets/images/weather/Flurries.png'
    },
    {
      name: "Mostly Cloudy w/ Flurries",
      icon: 'assets/images/weather/Mostly Cloudy w_Flurries.png'
    },
    {
      name: "Partly Sunny w/ Flurries",
      icon: 'assets/images/weather/Partly Sunny w_Flurries.png'
    },
    {
      name: "Snow",
      icon: 'assets/images/weather/Snow.png'
    },
    {
      name: "Mostly Cloudy w/ Snow",
      icon: 'assets/images/weather/Mostly Cloudy w_Snow.png'
    },
    {
      name: "Ice",
      icon: 'assets/images/weather/Ice.png'
    },
    {
      name: "Sleet",
      icon: 'assets/images/weather/Sleet.png'
    },
    {
      name: "Freezing Rain",
      icon: 'assets/images/weather/Freezing Rain.png'
    },
    {
      name: "Rain and Snow",
      icon: 'assets/images/weather/Rain and Snow.png'
    },
    {
      name: "Hot",
      icon: 'assets/images/weather/Hot.png'
    },
    {
      name: "Cold",
      icon: 'assets/images/weather/Cold.png'
    },
    {
      name: "Windy",
      icon: 'assets/images/weather/Windy.png'
    },
    {
      name: "Clear",
      icon: 'assets/images/weather/Clear.png'
    },
    {
      name: "Mostly Clear",
      icon: 'assets/images/weather/Mostly Clear.png'
    },
    {
      name: "Partly Cloudy",
      icon: 'assets/images/weather/Partly Cloudy.png'
    },
    {
      name: "Hazy Moonlight",
      icon: 'assets/images/weather/Hazy Moonlight.png'
    },
    {
      name: "Partly Cloudy w/ Showers",
      icon: 'assets/images/weather/Partly Cloudy w_Showers.png'
    },
    {
      name: "Partly Cloudy w/ T-Storms",
      icon: 'assets/images/weather/Partly Cloudy w_T-Storms.png'
    }
  ];
  @ViewChild('connectionModal', {static: true}) connectionModal: TemplateRef<any>;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private aes256Service: Aes256Service,
    private connectionService: ConnectionService,
    public dialog: MatDialog,
    private sanitizer : DomSanitizer
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

    if (!this.hashCode) {
      this.router.navigate(['/']);
    }

    if (!this.linkData.organization || !this.linkData.facility) {
      this.router.navigate(['/']);
    }
    
    await this.getActivityDashboardData();
    
    setInterval(async () => {
      this.getDateTime();
    }, 1000);
    this.socketService.connectedEvent('activitydash', { platform: 'web' });
    // Socket Realtime Data Changes Started
    
    this.roomName = this.linkData.facility + '-ASCH';

    this.socketSubscription.add(this.socketService.connectFn(this.roomName).subscribe(async (_result: any) => {
      console.log("result after socket connection >>>>>",_result)
    }));
    this.socketSubscription.add(this.socketService.listenRoomFn().subscribe(async (_response: any) => {
      console.log("socket", _response)
      if(_response.eventType === "activity_schedule") 
      if (_response) {
        await this.getActivityDashboardData();
      }
    }));

    // Socket Realtime Data Changes Ended
  }

  sendMail() {
    const payload = {
      facilityId: this.linkData.facility,
      organizationId: this.linkData.organization,
      userId: this.linkData.userId,
      dashboard: 'Activity Dashboard'
    };
    this.socketService.onDashboardDown(payload).subscribe();
  }

  formatPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    }
    return null
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
    // this.scrollerFunc('table-level-isolation');
    // this.scrollerFunc('table-exceptional-risk');
    // this.scrollerFunc('table-level-testing');
    // this.scrollerFunc('table-level-fall');
    // this.scrollerFunc('table-level-notify');
  }

  // Keep me Signed in
  public doUnload(): void {
    this.doBeforeUnload();
  }

  // Keep me Signed in
  public doBeforeUnload(): void {
    // Clear localStorage
    this.socketService.connectedEvent('disconnectactivitydash', {
      platform: 'web',
    });
  }

  getDateTime() {
    // this._date = moment().tz(this.linkData.utc_time).format('MMMM Do');
    // this._time = moment().tz(this.linkData.utc_time).format('hh:mm A');
  }

  parseViaDOM(str) {
    var el = document.createElement('div');
    el.innerHTML = str;
    return el.textContent;
  }


  async getActivityDashboardData() {
    const action = { type: 'POST', target: 'activitySchedule/activity_dashboard' };
    const payload = { fac_id: this.linkData.facility, org_id: this.linkData.organization };
    console.log("Action & Payload", action, payload);
    await this.apiService.apiFn(action, payload).then((res: any) => {
      if(res.data){
        console.log("Activity Dashboard Data", res);
        if(res.data.facility.org_logo && res.data.facility.org_logo.location){
          this.toDataURL(res.data.facility.org_logo.location, function(dataUrl) {
            document.getElementById("ItemPreview").setAttribute( 'src', dataUrl );
          });
        }
        this.logo = (res.data.facility && res.data.facility.org_logo) ? res.data.facility.org_logo.location : null
        this._date = moment().tz(res.data.facility.facility_timezone).format('MMMM Do');
        this._time = moment().tz(res.data.facility.facility_timezone).format('hh:mm A');
        this.upcomingActivity = res.data.next_activity ? res.data.next_activity : null;
        this.description = res.data.next_activity ? this.parseViaDOM(res.data.next_activity.description) : null;
        //this.upcomingActivityDate = res.data.next_activity ? ( res.data.next_activity.activity_date ? this.toFindDay(res.data.next_activity.activity_date) : null + " " + " " + moment(res.data.next_activity.start).format("hh:mm A") + ' - ' + moment(res.data.next_activity.end).format("hh:mm A")) : '';
        this.upcomingActivityDate = (res.data.next_activity && res.data.next_activity.activity_date) ? ( this.toFindDay(res.data.next_activity.activity_date) + " " + " " + moment(res.data.next_activity.start).format("hh:mm A") + ' - ' + moment(res.data.next_activity.end).format("hh:mm A")) : '';
        this.upcomingActivitylocation = { 
          name: res.data.next_activity ? res.data.next_activity.location.name : null,
          line1: res.data.next_activity ? res.data.next_activity.location.line1 : null,
          line2: res.data.next_activity ? res.data.next_activity.location.line2 : null,
          city:  res.data.next_activity ? res.data.next_activity.location.city : null,
          state: res.data.next_activity ? res.data.next_activity.location.state : null,
          country: res.data.next_activity ? res.data.next_activity.location.country : null,
          zip: res.data.next_activity ? res.data.next_activity.location.zip : null
        }
        this.facility = res.data.facility.facility_name;
        this.activityPersons = res.data.activity_coordinator;
        this.announcements = res.data.announcement;
        if(this.announcements){
          this.announcements.forEach(a => {
            a.message = this.parseViaDOM(a.message);
          });
        }
        if(res.data.weather || Object(res.data.weather).keys.length ){
          this.currentWeatherConditions = { 
            temperature: res.data.weather.temperature ? res.data.weather.temperature : null,
            fac_id: res.data.weather.fac_id ? res.data.weather.fac_id : null,
            temperatureUnit: res.data.weather.temperatureUnit ? res.data.weather.temperatureUnit : null,
            icon: res.data.weather.icon ? res.data.weather.icon : null
          }
          if(this.currentWeatherConditions.icon){
            const _foundMatchedIcon = this.weatherIconData.find(i => i.name.toLowerCase() === this.currentWeatherConditions.icon.toLowerCase());
            if(_foundMatchedIcon){
              this.toDataURL(_foundMatchedIcon.icon, function(dataUrl) {
                document.getElementById("weatherIcon").setAttribute( 'src', dataUrl );
              });
            }
          }
        }
        
        this.residentsBirthday = res.data.resident_birthday ? res.data.resident_birthday : null;
        if(res.data.week_Activity){
          console.log(res.data.week_Activity)
          res.data.week_Activity.forEach((act, index) => {
            if(index === 1){
              act.date = this.days[moment(act.date).day()];
            }
            else {
              act.date = this.toFindDay(act.date);
            }
            
            if(act.data){
              act.data.forEach(a => {
                a.start = moment(a.start).format('hh:mm A');
                a.end =  moment(new Date(a.end_time)).format('hh:mm A');
              });
            }
          });
        }
        this.weekActivities = res.data.week_Activity ? res.data.week_Activity : null;
        //this.weekActivities = null;
      }
    })
    .catch(err => console.log("ERRRRRR",err))
  }

  toDataURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var reader = new FileReader();
      reader.onloadend = function() {
        callback(reader.result);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  toFindDay(date){
    var day = moment(date).day();
            if(day=== 0){
              date = "Sunday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            else if(day=== 1){
              date = "Monday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            else if(day=== 2){
              date = "Tuesday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            else if(day=== 3){
              date = "Wednesday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            else if(day=== 4){
              date = "Thursday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            else if(day=== 5){
              date = "Friday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            else if(day=== 6){
              date = "Saturday" + ',' + ' ' + moment(date).format('MMMM Do');
            }
            return date
  }

  convertDateFormat(date){
            var day = moment().tz(date).day();
            if(day=== 0){
              date = "Sunday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            else if(day=== 1){
              date = "Monday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            else if(day=== 2){
              date = "Tuesday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            else if(day=== 3){
              date = "Wednesday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            else if(day=== 4){
              date = "Thursday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            else if(day=== 5){
              date = "Friday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            else if(day=== 6){
              date = "Saturday" + ',' + ' ' + moment().tz(date).format('MMMM Do');
            }
            return date
  }

  capitalizeFirst(string){
    string = string.charAt(0).toUpperCase() + string.slice(1)
    return string
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
