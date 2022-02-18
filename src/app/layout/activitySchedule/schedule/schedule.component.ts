import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from './../../../shared/services/common.service';
import { ApiService } from './../../../shared/services/api/api.service';
import {
  CalendarDayViewBeforeRenderEvent,
  CalendarEvent,
  CalendarMonthViewBeforeRenderEvent,
  CalendarWeekViewBeforeRenderEvent,
  CalendarView
} from 'angular-calendar';
import { Subject, Subscription } from 'rxjs';
import { colors } from '../calendar-utils/colors';
import * as moment from 'moment';
import { ViewPeriod } from 'calendar-utils';
import {
  startOfMonth,
  startOfDay,
  startOfWeek,
  endOfDay,
  addDays,
  endOfMonth,
  endOfWeek,
  addHours,
  addMinutes,
  addSeconds,
  addWeeks,
  format
} from 'date-fns';
import { SocketService } from 'src/app/shared/services/socket/socket.service';
import { ToastrService } from 'ngx-toastr';

interface Care {
  id: string;
  title: string;
  release_date: string;
  color: string;
  actions: any;
}

@Component({
  selector: 'app-list',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})

export class ScheduleComponent implements OnInit {
  timezone: any
  utc_offset: any
  userLocalTimeZone = moment.tz.guess()
  CalendarView = CalendarView;
  view = CalendarView.Month;
  showCreateList = true;
  viewPeriod: ViewPeriod;
  refresh: Subject<any> = new Subject();
  calendarEvents = [];
  externalEvents = [];
  viewDate = moment().toDate();
  organization; facility;
  subscription: Subscription;
  events: CalendarEvent[] = [];
  assignedDated = [];
  socketSubscription: Subscription = new Subscription();
  roomName: string = '';
  constructor(
    private _router: Router,
    public _commonService: CommonService,
    private _apiService: ApiService,
    private _socketService: SocketService,
    private _toastr: ToastrService,
  ) {

  }

  async ngOnInit() {
    if (!this._commonService.checkAllPrivilege('Scheduling')) this._router.navigate(['/']);
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        console.log(contentVal)
        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;
console.log(this.userLocalTimeZone)
        this.viewDate = this.viewDate = moment(moment.tz(this.timezone)).tz(this.userLocalTimeZone, true).toDate();
        // var d = new Date(this.viewDate);
        // this.viewDate =  new Date(d.toLocaleString('en-US', { timeZone: this.timezone }));
        console.log("view date>>>>>>>",this.viewDate);
        // await this.fetchEvents();
        
        // Make socket connection and listner
        // this._socketService.connectFn(`${this.facility}-ASCH`).subscribe(res => {
        //   if (res) {
        //     console.log(res);
        //   }
        // })
        // this.socketSubscription.add(this._socketService.listenRoomFn().subscribe(async (_response: any) => {
        //   console.log('data after socket call in dashboard', _response);
        //   if (_response.eventType === 'activity_schedule') {
        //     if (_response) {
        //       console.log(_response);
        //       //  await this.getMissedCares();
        //        }
        //   }
        // }));
        this.roomName = this.facility + '-ASCH';

               this.socketSubscription.add(this._socketService.connectFn(this.roomName).subscribe(async (_result: any) => {
                console.log("result after socket connection >>>>>",_result)
              }));
              this.socketSubscription.add(this._socketService.listenRoomFn().subscribe(async (_response: any) => {
                console.log("socket", _response)
                if(_response.eventType === "activity_schedule") 
                if (_response) {
                  await this.fetchEventsNewApis();
                  // await this.updateNewActivities(_response.data);
                }
              }));
      // End of make socket connection and listner

        await this.fetchEventsNewApis();
      }
      // this._commonService.setLoader(false);
    });
  }

  ngOnDestroy() {
    this.socketSubscription.unsubscribe();
    this._socketService.disConnectFn(this.roomName).subscribe(async (_result: any) => {
      console.log("result after socket disconnection >>>>>",_result)
    })
  }
  
  updateNewActivities(updatedEvents){
    // console.log(updatedEvents)
    const timeZone = this.timezone;

    updatedEvents.map(event => {
      const hourEvnt = parseInt(moment(event.start).tz(timeZone).format('HH'));
      const minuteEvnt = parseInt(moment(event.start).tz(timeZone).format('mm'));
  const evnt = {
    'start': addMinutes(addHours(startOfDay(event.start), hourEvnt), minuteEvnt),
    'end': addMinutes(addHours(startOfDay(event.start), hourEvnt), minuteEvnt),
    'title': event.title,
    'color': colors.red,
    'draggable': true,
    'id': event._id
  };
  this.events.push(evnt);
  this.refresh.next()
  // console.log(this.events)
      // const objIndex = this.events.findIndex((obj => obj.id == event._id));
      // console.log(objIndex);
    })
  }
  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString("en-US", { timeZone: this.timezone });
    if (this.timezone) {
      newDate = moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss");
    }
    return moment(newDate)["_d"];
  }
  /** For set Saturday date color in grey */
  beforeMonthViewRender(renderEvent: CalendarMonthViewBeforeRenderEvent): void {
    renderEvent.body.forEach((day) => {
      if (day.date.getDay() == 6) day.cssClass = 'cal-saturday';
    });
  }


 async fetchEventsNewApis() {
  this.events = [];
  const getStart: any = { month: startOfMonth, week: startOfWeek, day: startOfDay }[this.view];
  const getEnd: any = { month: endOfMonth, week: endOfWeek, day: endOfDay }[this.view];
  const startDate = getStart(this.viewDate);
  const endDate = getEnd(this.viewDate);
  console.log('start_date>>>>>', startDate,"endDate>>>>", endDate)
  const payload = {
    fac_id: this.facility,
    start_date:`${moment(startDate).tz(this.timezone, true).valueOf()}`,
    end_date: `${moment(endDate).tz(this.timezone, true).valueOf()}`,
    // org_id: this.organization,
  };
    console.log("Fetching Payload ===>>> ",payload)
    this._commonService.setLoader(true);
    await this._apiService.apiFn({ type: 'GET', target: 'activitySchedule/calender' }, payload)
      .then(async (result: any) => {
        if (result.status) {
          this.events = [];
           console.log("response data ===>>> ",JSON.stringify(result))
           await this.setUpdateEventsIntoCalender(payload, result['data'])
          // this.assignedDated = result['data']['assignedDated'];
          // await this.checkEventFu(payload, result['data']['allSchedules']);
        }
      })
      .catch((error) => {
        if(error) {
          this._commonService.setLoader(false);
        }
       });
  }


  async setUpdateEventsIntoCalender(payload, activityList) {
    this._commonService.setLoader(true);
    activityList.map((data) => {
      console.log(data)
      const startH = moment(data.date).format('HH');
      const startM = moment(data.date).format('mm');
      const startDate: any = moment();
      startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
      // this.addEventFu(startTime, data, isRuleCare, listType);
      let startTime = data.date;
      this.updateEvents(startTime,data)
    })
  }

  updateEvents(startTime, data) {
    console.log(data)
    this._commonService.setLoader(true);
  const timeZone = this.timezone;
  data.data.map((eventData) => {
    const hourEvnt = parseInt(moment(data.date).tz(timeZone).format('HH'));
        const minuteEvnt = parseInt(moment(data.date).tz(timeZone).format('mm'));
    const evnt = {
      'start': addMinutes(addHours(startOfDay(data.date), hourEvnt), minuteEvnt),
      'end': addMinutes(addHours(startOfDay(data.date), hourEvnt), minuteEvnt),
      'title': eventData.title,
      'color': colors.red,
      'draggable': true,
      'id': eventData._id
    };
    console.log(evnt)
    if (startTime == moment().startOf('day').valueOf()) {
      this.events.push(evnt);
    } else { this.events.push(evnt); }
    this.refresh.next()
  });

      this._commonService.setLoader(false);
      console.log(this.events);
      
  }


  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    const startEvnt = startOfDay(date).valueOf();
    const startToday = startOfDay(this.getCurrentDateFromTimezone()).valueOf();
    if (startToday <= startEvnt) this._router.navigate(['/activity-scheduling/day_list', startEvnt]);
  }

  updateCalendarEvents(viewRender:
    | CalendarMonthViewBeforeRenderEvent
    | CalendarWeekViewBeforeRenderEvent
    | CalendarDayViewBeforeRenderEvent
  ): void {
    this.viewPeriod = viewRender.period;
    this.calendarEvents = [];
    this.events = [];
    // this.fetchEvents();
    this.fetchEventsNewApis();
  }

  // getAssignedCount(events) {
  //   let count = 0;
  //   let isDuplicateSchedule = [];
  //   events.map((data) => {
  //     if (!isDuplicateSchedule.includes(data.title)) {
  //       // if ( (data.meta.assigned_to !== null && data.isRuleCare === "dated" ) || (data.meta.assigned_to !== null && data.isRuleCare !== "datedUnassigned") || data.isRuleCare == 'datedAssigned') {

  //       //     if(data.startTime === moment().startOf('day').valueOf() ){
  //       //       if(moment(data.currentDate).unix() <= moment(data.endTimeDataMissed).unix() ){        
  //       //         count++;
  //       //       }
  //       //     }else{
  //       //       count++;
  //       //     }            

  //       //   //count++;
  //       //   isDuplicateSchedule.push(data.title);
  //       // }    
  //       if ((data.meta.assigned_to != null && data.isRuleCare != "datedUnassigned") || (data.meta.assigned_to == null && data.isRuleCare == "datedAssigned")) {
  //         if (data.isMissedCare != true) count++;
  //       }
  //     }
  //   });
  //   return count;
  // }

  getActivityCount(events) {
    let count = 0;
    events.map((data) =>  count++ );
    return count;
  }

  // getUnAssignedCount(events) {
  //   let count = 0;
  //   events.map((data) => {
  //     if ((data.meta.assigned_to == null && data.isRuleCare != "datedAssigned") || (data.meta.assigned_to != null && data.isRuleCare == "datedUnassigned")) {
  //       if (data.isMissedCare != true) count++;
  //     }
  //   });
  //   return count;
  // }

  getScheduleEventCountData(events,currentDate) {
    console.log(JSON.stringify(events));
    console.log(currentDate)
     let foundData = events.find( item => moment(item.start).format("DD/MM/YYYY") == moment(currentDate).format("DD/MM/YYYY"))
     console.log(foundData)
     if(foundData) {
       return foundData.title
        // if(type === 'missed') {
        //   return foundData.countMissed;
        // } else if(type === 'assign') {
        //   return foundData.countAssign;
        // } else {
        //   return foundData.countUnassign;
        // }
     }
  }

}
