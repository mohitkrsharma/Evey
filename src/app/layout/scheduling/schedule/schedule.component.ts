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
import { Subscription } from 'rxjs';
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
        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;

        this.viewDate = this.viewDate = moment(moment.tz(this.timezone)).tz(this.userLocalTimeZone, true).toDate();
        // var d = new Date(this.viewDate);
        // this.viewDate =  new Date(d.toLocaleString('en-US', { timeZone: this.timezone }));
        // console.log("view date>>>>>>>",this.viewDate);
        // await this.fetchEvents();
        
        // Make socket connection and listner
        this.roomName = this.facility + '-SCH';
        // const socketFacility = localStorage.getItem('socketFacility');
               this.socketSubscription.add(this._socketService.connectFn(this.roomName).subscribe(async (_result: any) => {
                console.log("result after socket connection >>>>>",_result)
              }));
              this.socketSubscription.add(this._socketService.listenRoomFn().subscribe(async (_response: any) => {
                // console.log(_response)
                if(_response.eventType === "affected_schedule_occurance") 
                if (_response) await this.fetchEventsNewApis();
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

  // getMonthlyWeekday(n, d: string, m: string, y: number) {
  //   let targetDay, curDay = 0, i = 1, seekDay;
  //   if (d === 'Sunday') { seekDay = 0; }
  //   if (d === 'monday') { seekDay = 1; }
  //   if (d === 'Tuesday') { seekDay = 2; }
  //   if (d === 'Wednesday') { seekDay = 3; }
  //   if (d === 'Thursday') { seekDay = 4; }
  //   if (d === 'Friday') { seekDay = 5; }
  //   if (d === 'Saturday') { seekDay = 6; }
  //   while (curDay < n && i < 31) {
  //     targetDay = new Date(i++ + ' ' + m + ' ' + y);
  //     if (targetDay.getDay() === seekDay) { curDay++; }
  //   }
  //   if (curDay === n) {
  //     targetDay = targetDay.getDate();
  //     return targetDay;
  //   } else {
  //     return false;
  //   }
  // }

  // getLastOFMonthly(startTime, endTime, weekWDay) {
  //   while (startTime <= endTime) {
  //     const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
  //     if (weekDay === weekWDay) return startTime;
  //     startTime = addDays(startTime, 1).valueOf();
  //   }
  // }

  // onSpecificweekOFMonthly(startTime, weekWDay, weekNNo) {
  //   const endTime = addWeeks(startTime, (weekNNo)).valueOf();
  //   startTime = moment(endTime).subtract(7, 'day').valueOf();
  //   while (startTime < endTime) {
  //     const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
  //     if (weekDay === weekWDay) return startTime;
  //     startTime = addDays(startTime, 1).valueOf();
  //   }
  // }

 async fetchEventsNewApis() {
  this.events = [];
  const getStart: any = { month: startOfMonth, week: startOfWeek, day: startOfDay }[this.view];
  const getEnd: any = { month: endOfMonth, week: endOfWeek, day: endOfDay }[this.view];
  const startDate = getStart(this.viewDate);
  const endDate = getEnd(this.viewDate);
  console.log('start_date>>>>>', startDate,"endDate>>>>", endDate)
  const payload = {
    start_date: moment(startDate).format("MM/DD/YYYY"),
    end_date: moment(endDate).format("MM/DD/YYYY"),
    org_id: this.organization,
    fac_id: this.facility
  };
    console.log("Fetching Payload ===>>> ",payload)
    this._commonService.setLoader(true);
    await this._apiService.apiFn({ type: 'GET', target: 'schedule/getScheduleCountForCalanderView' }, payload)
      .then(async (result: any) => {
        if (result.status) {
          this.events = [];
           console.log("response data ===>>> ",result)
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


  async setUpdateEventsIntoCalender(payload, careList) {
    this._commonService.setLoader(true);
    console.log(careList)
    careList.map((data) => {
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
    // console.log(data.date)
    this._commonService.setLoader(true);
  const hourEvnt = parseInt(moment(data.date).tz(this.timezone).format('HH'));
  const minuteEvnt = parseInt(moment(data.date).tz(this.timezone).format('mm'));
      const evnt = {
        'start': addMinutes(addHours(startOfDay(data.date), hourEvnt), minuteEvnt),
        'end': addMinutes(addHours(startOfDay(data.date), hourEvnt), minuteEvnt),
        'title': '',
        'color': colors.red,
        'draggable': true,
        'countAssign': data.assigned,
        'countUnassign': data.unAssigned,
        'countMissed': data.missed
      };
      if (startTime == moment().startOf('day').valueOf()) {
        this.events.push(evnt);
      } else { this.events.push(evnt); }
      // console.log(this.events)
      this._commonService.setLoader(false);
  }

  // async fetchEvents() {
  //   this.events = [];
  //   const getStart: any = { month: startOfMonth, week: startOfWeek, day: startOfDay }[this.view];
  //   const getEnd: any = { month: endOfMonth, week: endOfWeek, day: endOfDay }[this.view];
  //   const startDate = getStart(this.viewDate);
  //   const endDate = getEnd(this.viewDate);
  //   const payload = {
  //     start_time: moment(startDate).valueOf(),
  //     end_time: moment(endDate).valueOf(),
  //     org_id: this.organization,
  //     fac_id: this.facility
  //   };
  //   await this._apiService.apiFn({ type: 'GET', target: 'schedule/get' }, payload)
  //     .then(async (result: any) => {
  //       if (result.status) {
  //         this.events = [];
  //         this.assignedDated = result['data']['assignedDated'];
  //         await this.checkEventFu(payload, result['data']['allSchedules']);
  //         //await this.checkEventFu(payload ,  result['data']['unassigned'],'newDemo' );
  //         // if(result['data']['rules'].length){
  //         //     await this.checkEventFu(payload ,  result['data']['rules'], true);        
  //         // }
  //         // if(result['data']['assignedDated'].length){
  //         //   await this.checkEventFu(payload ,  result['data']['assignedDated'], "dated");
  //         // }
  //       }
  //     })
  //     .catch((error) => { });
  // }

  // async checkEventFu(payload, careList, isRuleCare?, listType?) {
  //   if (!isRuleCare) { let isRuleCare = null; }
  //   let startTime = payload.start_time;

  //   careList.map((data) => {
  //     const startH = moment(data.start_time).format('HH');
  //     const startM = moment(data.start_time).format('mm');
  //     const startDate: any = moment();
  //     startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

  //     startTime = payload.start_time;
  //     const startEvnt = startOfDay(data.start_date).valueOf();
  //     let endEvnt = null;
  //     if (data.end_date) endEvnt = endOfDay(data.end_date).valueOf();
  //     let checkEnd = true;
  //     /* IF dated schedule */
  //     // if(isRuleCare === "dated"){
  //     //   startTime       = payload.start_time;
  //     //   const startEvnt = data.dated;
  //     //   let endEvnt     = endOfDay(data.dated).valueOf();        
  //     //   let checkEnd    = true;

  //     //   checkEnd = true;
  //     //   while (startTime < endEvnt) {
  //     //     if (data.dated && endEvnt < startTime) {
  //     //       checkEnd = false;
  //     //     }
  //     //     if (startEvnt <= startTime && checkEnd) {
  //     //       this.addEventFu(startTime, data,"dated");
  //     //     }
  //     //     startTime = addDays(startTime, 1).valueOf();
  //     //   }
  //     // }

  //     switch (data.repeat) {
  //       case 'never':
  //         const hourEvnt = parseInt(moment(data.start_date).format('HH'));
  //         const minuteEvnt = parseInt(moment(data.start_date).format('mm'));
  //         endEvnt = addSeconds(addMinutes(addHours(startOfDay(data.start_date), hourEvnt), minuteEvnt), data.duration);
  //         checkEnd = true;
  //         while (startTime < payload.end_time && checkEnd) {
  //           const endTime = addDays(startTime, 1).valueOf();
  //           if (startEvnt >= startTime && (endEvnt && endEvnt <= endTime)) {
  //             this.addEventFu(startTime, data, isRuleCare, listType);
  //             checkEnd = false;
  //           }
  //           startTime = addDays(startTime, 1).valueOf();
  //         }
  //         break;
  //       case 'every_week':
  //         checkEnd = true;
  //         while (startTime < payload.end_time) {
  //           if (data.end_date && endEvnt < startTime) checkEnd = false;
  //           if (startEvnt <= startTime && checkEnd) {
  //             const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
  //             const eventInWeek = moment(startEvnt).week();
  //             const dateInWeek = moment(startTime).week();
  //             if (((dateInWeek - eventInWeek) % data.repeat_tenure) === 0 && data.repeat_on[weekDay]) {
  //               this.addEventFu(startTime, data, isRuleCare, listType);
  //             }
  //           }
  //           startTime = addDays(startTime, 1).valueOf();
  //         }
  //         break;
  //       case 'every_month':
  //         const eventInMonth = moment(startEvnt).month();
  //         const dateInMonth = moment(startTime).month();
  //         checkEnd = true;
  //         if (((dateInMonth - eventInMonth) % data.repeat_tenure) === 0 && startEvnt < payload.end_time) {
  //           let taskNDate = moment().valueOf();
  //           let taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //           switch (data.repeat_option) {
  //             case 'on_day':
  //               const eventDay = moment(startEvnt).format('D');
  //               const eventMonth = moment(startTime).format('M');
  //               const eventYear = moment(startTime).format('YYYY');
  //               taskNDate = moment(eventMonth + '-' + eventDay + '-' + eventYear, 'MM-DD-YYYY').valueOf();
  //               // taskEndDate = addSeconds( taskNDate, data.duration).valueOf();
  //               break;
  //             case 'on_week_number':
  //               const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //               const weekNNo = Math.ceil(moment(startEvnt).date() / 7);
  //               taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //               // taskEndDate = addSeconds( taskNDate, data.duration).valueOf();
  //               break;
  //             case 'on_last_week':
  //               const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //               const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
  //               const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
  //               taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
  //               break;
  //           }
  //           taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //           if (!endEvnt || (endEvnt && endEvnt >= taskNDate && endEvnt >= taskEndDate)) {
  //             this.addEventFu(taskNDate, data, isRuleCare, listType);
  //           }
  //         }
  //         break;
  //       case 'every_year':
  //         const eventEMonth = moment(startEvnt).format('M');
  //         const eventYMonth = moment(startTime).format('M');
  //         if (eventYMonth === eventEMonth) {
  //           const eventYDay = moment(startEvnt).format('D');
  //           const eventYYear = moment(startTime).format('Y');
  //           let taskNDate = moment().valueOf();
  //           let taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //           switch (data.repeat_option) {
  //             case 'on_day':
  //               const dateSet = { 'year': parseInt(eventYYear), 'month': parseInt(eventYMonth) - 1, 'date': parseInt(eventYDay) };
  //               taskNDate = moment().set(dateSet).startOf('day').valueOf();
  //               break;
  //             case 'on_week_number':
  //               const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //               const weekNNo = Math.ceil(moment(startEvnt).date() / 7);
  //               taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //               break;
  //             case 'on_last_week':
  //               const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //               const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
  //               const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
  //               taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
  //               break;
  //           }
  //           taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //           if (!endEvnt || (endEvnt && endEvnt >= taskNDate)) {
  //             this.addEventFu(taskNDate, data, isRuleCare, listType);
  //           }
  //         }
  //         break;
  //       case 'custom_weekly':
  //         checkEnd = true;
  //         while (startTime < payload.end_time) {
  //           if (data.end_date && endEvnt < startTime) checkEnd = false;
  //           if (startEvnt <= startTime && checkEnd) {
  //             const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
  //             const eventInWeek = moment(startEvnt).week();
  //             const dateInWeek = moment(startTime).week();
  //             if (((dateInWeek - eventInWeek) % data.repeat_tenure) === 0 && data.repeat_on[weekDay]) this.addEventFu(startTime, data, isRuleCare, listType);
  //           }
  //           startTime = addDays(startTime, 1).valueOf();
  //         }
  //         break;
  //       case 'custom_monthly':
  //         const custom_eventInMonth = moment(startEvnt).month();
  //         const custom_dateInMonth = moment(startTime).month();
  //         checkEnd = true;
  //         if (((custom_dateInMonth - custom_eventInMonth) % data.repeat_tenure) === 0 && startEvnt < payload.end_time) {
  //           let taskNDate = moment().valueOf();
  //           let taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //           switch (data.repeat_option) {
  //             case 'on_day':
  //               const eventDay = data.month_date;
  //               const eventMonth = moment(startTime).format('M');
  //               const eventYear = moment(startTime).format('YYYY');
  //               taskNDate = moment(eventMonth + '-' + eventDay + '-' + eventYear, 'MM-DD-YYYY').valueOf();
  //               break;
  //           }
  //           taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //           if (!endEvnt || (endEvnt && endEvnt >= taskNDate && endEvnt >= taskEndDate)) {
  //             this.addEventFu(taskNDate, data, isRuleCare, listType);
  //           }
  //         }
  //         break;
  //       case 'custom_yearly':
  //         const customEventEMonth = data.month_date;
  //         const customEventYMonth = moment(startTime).format('M');
  //         const eventYYear = moment(startTime).format('Y');
  //         const yearNow = new Date().getFullYear();
  //         if (yearNow == (parseInt(eventYYear) + (data.repeat_tenure - 1))) {
  //           if (customEventYMonth == customEventEMonth) {
  //             const eventYDay = moment(startEvnt).format('D');
  //             let taskNDate = moment().valueOf();
  //             let taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //             let weekNDay = Object.keys(data.repeat_on)[0];
  //             let weekNNo = 1;
  //             switch (data.repeat_option) {
  //               case 'on_day':
  //                 weekNNo = 1;
  //                 taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //                 break;
  //               case 'on_second_day':
  //                 weekNNo = 2;
  //                 taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //                 break;
  //               case 'on_third_day':
  //                 weekNNo = 3;
  //                 taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //                 break;
  //               case 'on_forth_day':
  //                 weekNNo = 4;
  //                 taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //                 break;
  //               case 'on_fifth_day':
  //                 weekNNo = 5;
  //                 taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
  //                 break;
  //               case 'on_last_week':
  //                 const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //                 const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
  //                 const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
  //                 taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
  //                 break;
  //             }
  //             taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
  //             if (!endEvnt || (endEvnt && endEvnt >= taskNDate)) {
  //               this.addEventFu(taskNDate, data, isRuleCare, listType);
  //             }
  //           }
  //         }
  //         break;
  //       case 'every_day':
  //       default:
  //         checkEnd = true;
  //         while (startTime < payload.end_time) {
  //           if (data.end_date && endEvnt < startTime) checkEnd = false;
  //           if (startEvnt <= startTime && checkEnd) this.addEventFu(startTime, data, isRuleCare, listType);
  //           startTime = addDays(startTime, 1).valueOf();
  //         }
  //         break;
  //     }
  //   });
  // }

  // addEventFu(startTime, data, isRuleCare, listType?) {
  //   const hourEvnt = parseInt(moment(data.start_date).tz(this.timezone).format('HH'));
  //   const minuteEvnt = parseInt(moment(data.start_date).tz(this.timezone).format('mm'));
  //   // const startTm = moment(data.start_date).startOf('day').valueOf();

  //   // const eventAssDated = this.assignedDated.filter(function (entry) {
  //   //   return startTm === entry.start_date && data._id === entry.schedule_id;
  //   // });

  //   let assignDatedCare;
  //   // this.assignedDated.map((data2) => {
  //   //   if (data2.schedule_id == data._id && startTime == moment(data2.dated).startOf('day').valueOf()) {
  //   //     if (data2.assigned_to === null) {
  //   //       assignDatedCare = "datedUnassigned";
  //   //     } else {
  //   //       assignDatedCare = "datedAssigned";
  //   //     }
  //   //   }
  //   // })

  //   let datedSchedule = this.assignedDated.filter((x) => {
  //     return x.schedule_id == data._id;
  //   });
  //   if (datedSchedule.length > 0) {
  //     console.log("datedSchedule.length", datedSchedule.length)
  //     if (datedSchedule[0].assigned_to === null) {
  //       assignDatedCare = "datedUnassigned";
  //     } else {
  //       assignDatedCare = "datedAssigned";
  //     }
  //     let isMissedCare;
  //     const startH = moment(data.start_time).tz(this.timezone).format('HH');
  //     const startM = moment(data.start_time).tz(this.timezone).format('mm');
  //     const startDateMissed: any = moment(moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss"));
  //     startDateMissed.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 })["_d"];
  //     let endTimeDataMissed = moment(startDateMissed).add(data.duration, 'second')["_d"];
  //     endTimeDataMissed = moment(endTimeDataMissed).add({ minute: 30 })["_d"];
  //     var currentDate = moment(moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss")).set({ second: 0, millisecond: 0 });

  //     if (startTime === moment().startOf('day').valueOf()) {
  //       if (moment(currentDate).unix() >= moment(endTimeDataMissed).unix()) {
  //         isMissedCare = true;
  //       }
  //     }
  //     if (data.zone && data.zone.deleted != true && data.resident.deleted != true) {
  //       const evnt = {
  //         'start': addMinutes(addHours(startOfDay(startTime), hourEvnt), minuteEvnt),
  //         'end': addSeconds(addMinutes(addHours(startOfDay(startTime), hourEvnt), minuteEvnt), data.duration),
  //         'title': data.schedule_id ? data.schedule_id : data._id,
  //         'color': colors.red,
  //         'draggable': true,
  //         'meta': { assigned_to: data.assigned_to },
  //         'isRuleCare': assignDatedCare,
  //         'isMissedCare': isMissedCare
  //       };
  //       if (startTime == moment().startOf('day').valueOf()) {
  //         if (data.isPerformed != true) this.events.push(evnt);
  //       } else { this.events.push(evnt); }
  //     }
  //   }
  // }

  // handleEvent(action: string, event: CalendarEvent): void {
  //   // this.modalData = { event, action };
  //   // this.modal.open(this.modalContent, { size: 'lg' });
  // }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    const startEvnt = startOfDay(date).valueOf();
    const startToday = startOfDay(this.getCurrentDateFromTimezone()).valueOf();
    if (startToday <= startEvnt) this._router.navigate(['/scheduling/day_list', startEvnt]);
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

  // getUnAssignedRuleCount(events) {
  //   let count = 0;
  //   events.map((data) => data.isMissedCare ? count++ : 0);
  //   return count;
  // }

  // getUnAssignedCount(events) {
  //   let count = 0;
  //   events.map((data) => {
  //     if ((data.meta.assigned_to == null && data.isRuleCare != "datedAssigned") || (data.meta.assigned_to != null && data.isRuleCare == "datedUnassigned")) {
  //       if (data.isMissedCare != true) count++;
  //     }
  //   });
  //   return count;
  // }

  getScheduleEventCountData(events,currentDate,type) {
     let foundData = events.find( item => moment(item.start).format("DD/MM/YYYY") == moment(currentDate).format("DD/MM/YYYY"))
     if(foundData) {
        if(type === 'missed') {
          return foundData.countMissed;
        } else if(type === 'assign') {
          return foundData.countAssign;
        } else {
          return foundData.countUnassign;
        }
     }
  }

}
