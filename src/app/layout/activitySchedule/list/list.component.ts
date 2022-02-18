import { async } from '@angular/core/testing';
import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TemplateRef, ViewChild } from '@angular/core';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { CommonService } from './../../../shared/services/common.service';
import { ApiService } from './../../../shared/services/api/api.service';
import { Subject, Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import {
  CalendarDayViewBeforeRenderEvent,
  CalendarMonthViewBeforeRenderEvent,
  CalendarWeekViewBeforeRenderEvent,
  CalendarView,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarEvent
} from 'angular-calendar';
import { MatDialog, MatDialogConfig, MatExpansionPanel, MatOption } from '@angular/material';
import {
  startOfMonth, startOfDay, startOfWeek, addWeeks, endOfDay, subDays, addDays, endOfMonth, endOfWeek, isSameDay,
  isSameMonth, addHours, addMinutes, addSeconds, format
} from 'date-fns';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient , HttpHeaders} from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
const colors: any = {
  default:{
    primary:'#E0EEC4',
    secondary:'#E0EEC4'
  },
  selected: {
    primary: '#ADD264',
    secondary: '#ADD264'
  }
};
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  public formatString: string = 'HH:mm';
  userLocalTimeZone = moment.tz.guess()
  subscription: Subscription;
  CalendarView = CalendarView;
  view = CalendarView.Day;
  viewDate = moment().toDate();
  modalData: {
    action: string;
    event: CalendarEvent;
  };
  assignedFrom;
  residentslist;
  resident;
  shift;
  shiftStartTime;
  shiftEndTime;
  shiftArr;
  scheduleDate = null;
  assigne = true;
  dateToSend;
  organization; facility;
  userslist;
  editDeleteType;
  actions= [
    {
      label:  `<mat-icon>edit</mat-icon>`,
      a11yLabel: 'Edit',
      onClick: ({ event }: { event}): void => {
        this.handleEvent('Edited', event);
      }
    },
    {
      label: `<mat-icon>delete</mat-icon>`,
      a11yLabel: 'Delete',
      onClick: ({ event }: { event }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];
  refresh: Subject<any> = new Subject();
  addPopupStartMin;
  events = [];

  minDate: Date = new Date();
  minDateEnd: Date;
  scheduleDateEnd: Date;
  minDateValue: any;
  step = 0;
  rulesData = [];
  unassignedData = [];
  unassignedDataTemp = [];
  assignedDataTemp = [];
  missedCareData = [];
  missedCareDataId = [];
  assignedData = [];
  dialogRefs = null;
  transferCare = null;
  assignedTo = null;
  assignedFromTo = null;
  deleteCare = null;
  deleteCareType = null;
  editCareType = null;
  scheduleForOccurance = [];
  scheduleForSeries = [];
  calendarDate;
  scheduleCares: any = {
    schedule_id: null
  };

  editSchedule = {
    _id: null,
    startDate: new Date(),
    endDate: null,
    startTime: null,
    endTime: null,
    repeat_tenure: 1,
    repeat: 'every_day',
    repeat_on: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    repeat_option: 'on_day',
    repeat_checkoption: 'on_day',
    month_date: null
  };

  reSchedule: any = {
    startDate: this.getCurrentDateFromTimezone(),
    endDate: null,
    startTime: null,
    endTime: null,
    repeat_tenure: null,
    repeat: 'never',
    repeat_on: null,
    repeat_option: null,
    repeat_checkoption: 'never',
    careName: '',
    residentName: '',
    frequency: '',
  };

  panelOpenState = {};
  repeatOptions: any = [
    { key: 'never', value: 'Never' },
    { key: 'every_day', value: 'Every Day' },
    { key: 'every_week', value: 'Every Week' },
    { key: 'every_month', value: 'Every Month' },
    { key: 'every_year', value: 'Every Year' },
    { key: 'custom_weekly', value: 'Custom Weekly' },
    { key: 'custom_monthly', value: 'Custom Monthly' },
    { key: 'custom_yearly', value: 'Custom Yearly' }
  ];

  showCustom = false;
  assignedCare = {
    user_id: null,
    scheduleCareIDs: [],
    scheduleCares: []
  };
  timezone; utc_offset;
  editingEvent;
  arrayNumber = Array(10).fill(10, 0, 10).map((x, i) => i + 1);
  showFilter: boolean = false;
  @ViewChild('confirmDialog', {static: true}) confirmDialog: TemplateRef<any>;
  @ViewChild('unassignDialog', {static: true}) unassignDialog: TemplateRef<any>;
  @ViewChild('deleteDialog', {static: true}) deleteDialog: TemplateRef<any>;
  @ViewChild('editDialog', {static: true}) editDialog: TemplateRef<any>;
  @ViewChild('deletePerformerDialog', {static: true}) deletePerformerDialog: TemplateRef<any>;
  @ViewChild('repeatDialog', {static: true}) repeatDialog: TemplateRef<any>;
  @ViewChild('reScheduleCareDialog', {static: true}) reScheduleCareDialog: TemplateRef<any>;
  performerDelete;
  scheduleReportForm: FormGroup;
  scheduleReport: any = {
    resident: [],
  };
  allresident = false;
  residentArray = [];
  @ViewChild('selectedResident', {static: true}) private selectedResident: MatOption;
  assignedDataTotalSchedule:number = 0;
  currentShift:number = 0;
  asignUserSelected:any;
  socketSubscription: Subscription = new Subscription();
  roomName: string = '';
  isEdit: boolean = false;
  selectedEvent: any;
  onGround : boolean = false;
  categoriesList: any;
  locationListOnGround: any;
  locationList: any;
  editableEvent: any;
  activeClassIndex = null;
  locationSearch = '';
  constructor(
    private _activeRoute: ActivatedRoute,
    private _router: Router,
    private _apiService: ApiService,
    private _dialog: MatDialog,
    public _commonService: CommonService,
    private _toastr: ToastrService,
    private _socketService: SocketService,
    private fb: FormBuilder,
    public _aes256Service: Aes256Service,
    private httpClient:HttpClient
  ) {
    this.minDate = new Date();
    this.minDateEnd = this.minDate;
    this.scheduleDateEnd = this.minDate;
    this.minDateValue = moment().tz(this.userLocalTimeZone).format();
  }
  asSearch = '';
  rSearch = '';
  nSearch = '';
  resSearch = '';
  shiftSearch = '';
  monthSearch = '';
  daySearch = '';
  monthNameSearch = '';
  yearSearch = '';
  customrepeatSearch = '';
  weekSearch = '';
  customWeekDay = { value: 'Sun', isCheckd: true, name: 'sunday' };

  customWeekDayList = [
    { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
  ];

  monthList = [{ key: 'Month', value: 1 }, { key: '2 Months', value: 2 }, { key: '3 Months', value: 3 }, { key: '4 Months', value: 4 }, { key: '5 Months', value: 5 }, { key: '6 Months', value: 6 }, { key: '7 Months', value: 7 }, { key: '8 Months', value: 8 }, { key: '9 Months', value: 9 }, { key: '10 Months', value: 10 }, { key: '11 Months', value: 11 }, { key: '12 Months', value: 12 }];

  yearList = [{ key: 'Year', value: 1 }, { key: '2 Years', value: 2 }, { key: '3 Years', value: 3 }, { key: '4 Years', value: 4 }, { key: '5 Years', value: 5 }, { key: '6 Years', value: 6 }, { key: '7 Years', value: 7 }, { key: '8 Years', value: 8 }, { key: '9 Years', value: 9 }, { key: '10 Years', value: 10 }];

  monthNameList = [{ key: 'January', value: 1 }, { key: 'February', value: 2 }, { key: 'March', value: 3 }, { key: 'April', value: 4 }, { key: 'May', value: 5 }, { key: 'June', value: 6 }, { key: 'July', value: 7 }, { key: 'August', value: 8 }, { key: 'September', value: 9 }, { key: 'October', value: 10 }, { key: 'November', value: 11 }, { key: 'December', value: 12 }];

  customRepeat = [{ key: 'First', value: 'on_day' }, { key: 'Second', value: 'on_second_day' }, { key: 'Third', value: 'on_third_day' }, { key: 'Forth', value: 'on_forth_day' }, { key: 'Fifth', value: 'on_fifth_day' }, { key: 'Last', value: 'on_last_day' }];

  monthDayList = Array.from({ length: 31 }, (_, i) => i + 1).map(e => ({ name: `${e}${this.dateFormat2(e)}`, value: e }));

  dateFormat2(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  async ngOnInit() {
    this._commonService.setLoader(true);
    this._activeRoute.params.subscribe(async routeParams => {
     this._commonService.setLoader(true);
      if (routeParams['timestamp']) {
        this.scheduleDate = routeParams['timestamp'];
        if ((this.scheduleDate.match(/^\d{13}$/) || this.scheduleDate.match(/^\d{14}$/)) &&
          moment(this.scheduleDate, 'x', true).isValid()) {
          this.scheduleDate = parseInt(routeParams['timestamp']);
          this.dateToSend =  this.scheduleDate;
          this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
            if (contentVal.org && contentVal.fac) {
              this.organization = contentVal.org;
              this.facility = contentVal.fac;
              this.timezone = contentVal.timezone;
              this.utc_offset = contentVal.utc_offset;
              this.minDate = this.getCurrentDateFromTimezone();
              this.minDateEnd = this.minDate;
              this.scheduleDateEnd = this.minDate;
              // this.viewDate = this.viewDate = moment(moment.tz(this.timezone)).tz(this.userLocalTimeZone, true).toDate();
              // var d = new Date(this.viewDate);
              // this.viewDate =  new Date(d.toLocaleString('en-US', { timeZone: this.timezone }));
              // console.log("view date>>>>>>>",this.viewDate, this.minDate, this.minDateEnd, this.scheduleDateEnd);
              // await this.fetchEvents();
              await this.getAllLocation(this.onGround);
              await this.getAllEvents();
              await this.getAllLocation(true);
              // Make socket connection and listner
              this.roomName = this.facility + '-ASCH';

              this.socketSubscription.add(this._socketService.connectFn(this.roomName).subscribe(async (_result: any) => {
               console.log("result after socket connection >>>>>",_result)
             }));
             this.socketSubscription.add(this._socketService.listenRoomFn().subscribe(async (_response: any) => {
              //  console.log("socket", _response)
               if(_response.eventType === "activity_schedule") 
               if (_response) {
                 // await this.fetchEventsNewApis();
                 await this.updateNewActivities(_response.data);
               }
             }));
              // End of make socket connection and listner
      
              // await this.getAllresidents();
              // await this.getAllusers();
              // await this.getShift();
              // await this.fetchEvents();
              // await this.getAllEvents()
            }
          });
        } else {
          this._router.navigate(['/activity-scheduling']);
        }
      } else {
        this._router.navigate(['/activity-scheduling']);
      }

    });

    // this._socketService.onScheduleUpdateFn().subscribe(async _response => {
    //   console.log("called out socket")
    //   if (_response) await this.getAllEvents();
    // });
    // this._socketService.onScheduleUpdateFn().subscribe(async _response => {
    //   if (_response) await this.getAllEvents();
    // });

    this._socketService.onTrackCareUpdateFn().subscribe(async _response => {
      if (_response) await this.getAllEvents();
    });
    this.getCategory();

    // this.scheduleReportForm = this.fb.group({
    //   resident: [''],
    //   resSearch: [''],
    //   shift: [''],
    //   shiftSearch: ['']
    // });
    // console.log(this.events)
    // this._commonService.setLoader(false);

  }

  ngOnDestroy() {
    localStorage.removeItem('assigned_to');
    this.socketSubscription.unsubscribe();
    this._socketService.disConnectFn(this.roomName).subscribe(async (_result: any) => {
      console.log("result after socket disconnection >>>>>",_result)
    })
  }

  updateNewActivities(updatedEvents){
    // console.log(updatedEvents)
    const timeZone = this.timezone;

  const newEventsUpdate = updatedEvents.map(function(el) {
      var o = Object.assign({}, el);
      const hourEvnt = parseInt(moment(el.start).tz(timeZone).format('HH'));
      const minuteEvnt = parseInt(moment(el.start).tz(timeZone).format('mm'));
      const hourEndEvnt = parseInt(moment(el.end).tz(timeZone).format('HH'));
      const minuteEndEvnt = parseInt(moment(el.end).tz(timeZone).format('mm'));
      o.color= colors.default;
      o.start = new Date(addMinutes(addHours(startOfDay(el.start), hourEvnt), minuteEvnt));
      o.end = new Date(addMinutes(addHours(startOfDay(el.end), hourEndEvnt), minuteEndEvnt));
      o.start_time = moment(el.start).tz(timeZone).format("HH:mm");
      o.end_time = moment(el.end_time).tz(timeZone).format("HH:mm");
      return o 
    })
 
    newEventsUpdate.map(event => {
      const objIndex = this.events.findIndex((obj => obj.activity_schedule_id == event.activity_schedule_id));
      // console.log(objIndex);
      
      if(objIndex == -1){
      this.events.push(event);
      }else{
        this.events[objIndex] = event;
      }
      const removeindex  = this.events.findIndex(item => item.is_deleted == true)
      // console.log(removeindex);
      if(removeindex != -1){
      this.events.splice(removeindex, 1);

      }
    this.refresh.next();

    })
    this.refresh.next();

    // console.log(newEventsUpdate)

    // console.log(this.events)
  }


  async getCategory(){
    const action = { type: 'GET', target: `activitySchedule/category` };
    const payload = ""
    const result = await this._apiService.apiFn(action, payload);
    console.log(result)
    this.categoriesList = result['data'];
  }
  //Cslender event code

  // eventTimesChanged({
  //   event,
  //   newStart,
  //   newEnd,
  // }): void {
  //   this.events = this.events.map((iEvent) => {
  //     if (iEvent === event) {
  //       return {
  //         ...event,
  //         start: newStart,
  //         end: newEnd,
  //       };
  //     }
  //     return iEvent;
  //   });
  //   this.handleEvent('Dropped or resized', event);
  // }

  handleEvent(action: string, event): void {
    console.log("handleEvent =====",event, action)
    this.isEdit= false;
    this.events.map(item=>{
      
      if(event._id == item._id){
        item.color = colors.selected;
      item.draggable = true;

        item.resizable = {
          beforeStart: true, // this allows you to configure the sides the event is resizable from
          afterEnd: true,
        };
      }else{
        item.color = colors.default
        item.draggable = false;

        item.resizable = {
          beforeStart: false, // this allows you to configure the sides the event is resizable from
          afterEnd: false,
        };
      }
    })
    if(action == 'Clicked'){
      console.log("Event on clicked -----", event);
      this.selectedEvent = event;
    }
    if(action == "Dropped or resized"){
      console.log(event);
      this.handleEvent('Clicked',event);
    }


    // this.modalData = { event, action };
    // this.modal.open(this.modalContent, { size: 'lg' });
  }

  showDeleteDialog(){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = "450px"
    dialogConfig.panelClass = "DeleteAlert";
    this.editDeleteType = ''
    //dialogConfig.disableClose = true;
    this.dialogRefs = this._dialog.open(this.deleteDialog, dialogConfig);
  }

  showEditDialog(){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = "450px"
    dialogConfig.panelClass = "DeleteAlert";
    this.editDeleteType = ''
    this.editingEvent = JSON.parse(JSON.stringify(this.selectedEvent))
    //dialogConfig.disableClose = true;
    this.dialogRefs = this._dialog.open(this.editDialog, dialogConfig);
    this.setTimeForm();
  }

  setTimeForm() {
    const timestartDisp = moment({ hour: 0 }).toDate(); // moment({ hour: 9 });
    const currentDate = moment(new Date()).startOf('minute').tz(this.timezone).format("LLLL");
    let selectedStartDate = new Date(this.selectedEvent.start_date);
    selectedStartDate.setHours(0, 0, 0, 0);
    let todayDate = this.getCurrentDateFromTimezone();
    todayDate.setHours(0, 0, 0, 0);
    if (selectedStartDate.getTime() === todayDate.getTime()) {
      const startTimeToday = this.convertNext30MinuteInterval(currentDate);
      const endTimeToday = moment(startTimeToday).add(30, "minutes").toDate();
      this.addPopupStartMin = startTimeToday;
    } else {
      this.addPopupStartMin = timestartDisp;
    } 
  }

  changeOnGround(onGround, event){
    console.log(event.checked);
    console.log(event)
    if(event.checked){
      this.getAllLocation(event.checked)
    }
  }

  async getAllLocation(onGround){
    console.log(onGround)
    const action = { type: 'POST', target: `location/get` };
    const payload= {
      fac_id: this.facility,
      onGround: onGround,
      pageIndex: 10,
      pageSize: 0,
      search: "",
      sort: {active: "name", direction: "asc"}
    }
    console.log(payload)
    if(!this.locationListOnGround || !this.locationList){
      const result = await this._apiService.apiFn(action, payload);
      // console.log(JSON.stringify(result))
      if(onGround){
        this.locationListOnGround =  result['data']._locations;
      }else{
      this.locationList = result['data']._locations;
  
      }
    }
   
  }

  onNoClick(){
    this.dialogRefs.close(['result']['status'] = false);
    this.editDeleteType = ''
  }

  async deleteEvent(eventToDelete: CalendarEvent, isOccurrence) {
    console.log(eventToDelete)
    this.dialogRefs.close(['result']['status'] = false);
    const payload = {
      id: eventToDelete['_id'],
      fac_id: eventToDelete['fac_id'],
      activity_date: this.scheduleDate,
      isOccurrence : isOccurrence
    }
    console.log(payload)
    await this._apiService.apiFn(
      { type: 'POST', target: `activitySchedule/delete` }, payload
    ).then((result: any) => {
      console.log(result)
        // this.assigne = false;
        this._toastr.success(result['message']);
        // this.getAllEvents();
    this.events = this.events.filter((event) => event !== eventToDelete);
    this.selectedEvent = null;
    })
    .catch((error: any) => {
      this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.');
      this._commonService.setLoader(false);
    });
  }

  convertNext30MinuteInterval(timeSelected) {
    const remainder = (moment().tz(this.timezone).minute() % 30) - 30; //add time zone-----
    const dateTime = moment(timeSelected).tz(this.timezone).add(-remainder, "minutes").toDate(); // add time zone-----
    return dateTime;
  }



  isPastTime(startTime, startDate) {
    // Check past time validation
    var currentDate = this.getCurrentDateFromTimezone()
    var startTimeCompare = startTime;

    const startH = moment(startTime).format('HH');
    const startM = moment(startTime).format('mm');
    startTimeCompare = moment(startDate);
    startTimeCompare.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

    if (currentDate.getTime() > startTimeCompare) return true;
  }

  dateChangeEvent(event: MatDatepickerInputEvent<Date>) {
    this._commonService.setLoader(true);
    this.selectedEvent = null;
    // const startDate = moment(event.value).startOf('day').valueOf();
    // this._router.navigate(['/scheduling/day_list', startDate]);
    const startDate = moment(event.value).startOf('day').toDate();
    this.dateChange(startDate);
  }

  // shiftFilterCare(scheduleCares) {
  //   var currentDate = moment(moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss")).set({ second: 0, millisecond: 0 });
  //   let currentTime = moment(moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss")).set({ second: 0, millisecond: 0 });
  //   let startDayCurrentDate = startOfDay(moment(currentTime).valueOf()).valueOf();
  //   if (startDayCurrentDate === this.scheduleDate) {
  //     const startH = moment(scheduleCares.start_time).format('HH');
  //     const startM = moment(scheduleCares.start_time).format('mm');
  //     const startDateMissed: any = moment(new Date());
  //     startDateMissed.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
  //     let endTimeDataMissed = moment.unix(startDateMissed / 1000).add(scheduleCares.duration, 'second').toDate();
  //     if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
  //       if (((moment(this.shiftStartTime).unix() <= moment(startDateMissed).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDateMissed).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeDataMissed).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeDataMissed).unix())) {
  //         return true;
  //       }
  //       if (moment(this.shiftStartTime).unix() > moment(this.shiftEndTime).unix()) {
  //         if ((moment(this.shiftStartTime).unix() <= moment(startDateMissed).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeDataMissed).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDateMissed).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeDataMissed).unix())) {
  //           return true;
  //         }
  //       }
  //     } else if (moment(currentDate).unix() >= moment(endTimeDataMissed).unix()) {
  //       return true;
  //     }
  //   }
  // }

  getUserLocalTimeFromUtc(date) {
    return moment(moment.tz(date, this.timezone)).tz(this.userLocalTimeZone, true).valueOf()
  }

  getScheduleEndTime(start_time, duration) {


    const startH = moment.unix(start_time / 1000).tz(this.timezone).format("HH");
    const startM = moment.unix(start_time / 1000).tz(this.timezone).format("mm");
    const startDate: any = moment(this.getCurrentDateFromTimezone());
    startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

    return moment.unix(startDate / 1000).add(duration, 'second').toDate();
  }

  editEvent(){
    this._commonService.setLoader(true);
    this.dialogRefs.close(['result']['status'] = false);
    this.getEventById(this.selectedEvent._id)
  }

  editFutureEvent(event){
    console.log(event)
    this.dialogRefs.close(['result']['status'] = false);
    const id = event['activity_schedule_id']
    sessionStorage.setItem('scheduleDate', this.scheduleDate);
    this._router.navigate(['/activity-scheduling/edit', this._aes256Service.encFnWithsalt(id)], {state : {date: this.scheduleDate}});
  }
  async getEventById(id) {
    // this.events = [];
    const startDate = this.scheduleDate; //moment(this.scheduleDate).tz(this.timezone, true).startOf('day').valueOf();
    const payload={
      id: id
    };
    console.log(payload)
    await this._apiService.apiFn({ type: 'GET', target: `activitySchedule/get/${id}`}, payload)
    .then((result: any) => {
      // console.log('result::::::::::::::::::::', JSON.stringify(result))
      if(result.data.length){
        this.editableEvent = result.data[0];

      }
      console.log("Editable event---->",result);
      this._commonService.setLoader(false);

    })
    .catch((error) =>{
      this._commonService.setLoader(false);
      this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')
    });
    this.isEdit = true;

  }
  activeToggler(selectedIndex,event) {
    event.stopPropagation();
    this.activeClassIndex = (this.activeClassIndex == selectedIndex) ? null : selectedIndex;
    console.log(this.activeClassIndex)
  }
  async getAllEvents() {
    this._commonService.setLoader(true);
    this.events = [];
    const startDate = this.scheduleDate
    const payload={
      "fac_id" : `${this.facility}`,
      "date": `${startDate}`
    };
    console.log(payload)
    await this._apiService.apiFn({ type: 'GET', target: `activitySchedule/get`}, payload)
    .then((result: any) => {
      // console.log('result::::::::::::::::::::', JSON.stringify(result))
      this.events = result['data'];
      const timeZone = this.timezone;
      this.events = result['data'].map(function(el) {
        console.log("Start & endtime----", el.start, el.end_time, el.end);
        var o = Object.assign({}, el);
        const hourEvnt = parseInt(moment(el.start).tz(timeZone).format('HH'));
        const minuteEvnt = parseInt(moment(el.start).tz(timeZone).format('mm'));
        const hourEndEvnt = parseInt(moment(el.end_time).tz(timeZone).format('HH'));
        const minuteEndEvnt = parseInt(moment(el.end_time).tz(timeZone).format('mm'));
        o.color= colors.default;
        o.start = new Date(addMinutes(addHours(startOfDay(el.start), hourEvnt), minuteEvnt));
        o.end = new Date(addMinutes(addHours(startOfDay(el.end_time), hourEndEvnt), minuteEndEvnt));
        o.start_time = moment(el.start).tz(timeZone).format("HH:mm");
        o.end_time = el.end_time ? moment(el.end_time).tz(timeZone).format("HH:mm") : null;
        return o 
      })
      console.log(this.events)
      if(this.events.length){
      this.selectedEvent = this.events[0];
      console.log("Selected Event------", this.selectedEvent);
      this.handleEvent("Intial Selection" , this.events[0]);
      this._commonService.setLoader(false);
      }
    this._commonService.setLoader(false);

    })
    .catch((error) =>{
      this._commonService.setLoader(false);
      this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')
    });
    this.viewDate = new Date(startDate);
    

    console.log(this.events)

  }

  tConvert(time){
   // Check correct time format and split into components
   time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
    if (time.length > 1) 
    {
      time = time.slice (1);
      time[5] = +time[0] < 12 ? 'AM' : 'PM';
      time[0] = +time[0] % 12 || 12;
    }
    return time.join (''); // return adjusted time
  }

  eventTimesChanged(event){
    console.log('eventTimesChanged==========================>', event)
    this.selectedEvent.start_time = moment(event.newStart).tz(this.userLocalTimeZone, true).format("HH:mm");
    this.selectedEvent.end_time = moment(event.newEnd).tz(this.userLocalTimeZone, true).format("HH:mm");
    console.log(this.selectedEvent)
    this.onSubmitEvent(true);
    const objIndex = this.events.findIndex((obj => obj._id == event.event._id));
    console.log(this.events);

    this.events[objIndex].start = event.newStart;
    this.events[objIndex].end = event.newEnd;
    this.refresh.next();
  }


  onSpecificweekOFMonthly(startTime, weekWDay, weekNNo) {
    const startmonth = startOfMonth(startTime).valueOf();
    const endTime = addWeeks(startmonth, (weekNNo)).valueOf();
    startTime = moment(endTime).subtract(7, 'day').valueOf();
    while (startTime < endTime) {
      const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
      if (weekDay === weekWDay) return startTime;
      startTime = addDays(startTime, 1).valueOf();
    }
  }

  getLastOFMonthly(startTime, endTime, weekWDay) {
    while (startTime <= endTime) {
      const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
      if (weekDay === weekWDay) return startTime;
      startTime = addDays(startTime, 1).valueOf();
    }
  }

  totalTaskCount() {
    const count = this.unassignedData.length + this.missedCareData.length + this.performersCount();
    return count;
  }

  performersCount() {
    let count = 0;
    this.assignedData.map(function (assignItem) {
      if (assignItem.scheduleCares && assignItem.scheduleCares.length) {
        if (assignItem._id.assigned_to != null) count = count + assignItem.scheduleCares.length;
      }
    });
    return count;
  }

  async getAllusers() {
    await this._apiService.apiFn(
      { type: 'GET', target: 'users/get_users_org_fac' },
      { 'organization': [this.organization], 'facility': [this.facility] }
    )
      .then(async (result: any) => {
        if (result['success']) {
          this.userslist = await result['data'].map(obj => {
            return {
              'value': obj['last_name'] + ', ' + obj['first_name'],
              'key': obj._id
            }
          });
          this.userslist.sort(function (a, b) {
            const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0; // default return value (no sorting)
          });
        }
      })
      .catch((error) => { 
        this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')
      });
  }

  onSubmitEvent(eventDragged?){
    // console.log("form", this.eventForm);

    console.log(typeof this.selectedEvent.start_time);
    console.log(typeof this.selectedEvent.end_time);
    if (this.selectedEvent.title == '' ) {
      this._toastr.error(`Title can't be empty `);
      return;
    }
    if (!this.selectedEvent.description) {
      this._toastr.error(`Description can't be empty `);
      return;
    }
    if (!this.selectedEvent.location) {
      this._toastr.error(`Location can't be empty `);
      return;
    }
  if (this.selectedEvent.start_time == null || this.selectedEvent.end_time == null) {
    this._toastr.error('Start time or end time cannot be blank.');
    this._commonService.setLoader(false);
    return;
  }
  if (this.selectedEvent.start_time == 'Invalid date' || this.selectedEvent.end_time == 'Invalid date') {
    this._toastr.error('Start time or end time cannot be blank.');
    this._commonService.setLoader(false);
    return;
  }
  if (moment.tz(this.selectedEvent.start_time, this.timezone).unix() >= moment.tz(this.selectedEvent.end_time, this.timezone).unix()) {
    this._toastr.error('End time cannot be less than or equals to start time.');
    this._commonService.setLoader(false);
    return;
  }
    if(!eventDragged){
      const objIndex = this.events.findIndex((obj => obj._id == this.selectedEvent._id));
      this.events[objIndex]= this.selectedEvent;
      this.editingEvent = this.selectedEvent

      if(typeof (this.selectedEvent.start_time) === 'object'){
        console.log("inside start")
        var startDatetime = new Date(this.selectedEvent.start.getFullYear(), this.selectedEvent.start.getMonth(), this.selectedEvent.start.getDate(), 
        this.selectedEvent.start_time.getHours(), this.selectedEvent.start_time.getMinutes(), this.selectedEvent.start_time.getSeconds());
        this.events[objIndex].start =startDatetime;
        this.refresh.next();
       this.selectedEvent.start_time = moment(this.selectedEvent.start_time).tz(this.userLocalTimeZone, true).format("HH:mm");


      }
      if(typeof (this.selectedEvent.end_time) === 'object'){
        console.log("inside end")

        var endDatetime = this.selectedEvent.end ? new Date(this.selectedEvent.end.getFullYear(), this.selectedEvent.end.getMonth(), this.selectedEvent.end.getDate(), 
        this.selectedEvent.end.getHours(), this.selectedEvent.end.getMinutes(), this.selectedEvent.end.getSeconds()) :  this.selectedEvent.end ;
        console.log(this.events);
        this.events[objIndex].end = endDatetime;
        this.refresh.next();
        this.selectedEvent.end_time = moment(this.selectedEvent.end_time).tz(this.userLocalTimeZone, true).format("HH:mm");
      }   
    }
    console.log("this.selectedEvent.end_time",this.selectedEvent.end_time);

    this.selectedEvent.end_time = this.selectedEvent.end_time
    this.selectedEvent.time = {start : this.selectedEvent.start_time, end : this.selectedEvent.end_time };
    console.log(this.selectedEvent)
    this._commonService.setLoader(true);
    const action = { type: 'POST', target: 'activitySchedule/update' };
      const payload = {
        _id: this.selectedEvent._id,
        // org_id: this.organization,
          fac_id: this.facility,
          start: moment(this.selectedEvent.start).tz(this.timezone, true).valueOf(),
          end: this.selectedEvent.end ? moment(this.selectedEvent.end).tz(this.timezone, true).valueOf() : moment(this.selectedEvent.start).tz(this.timezone, true).valueOf(),
          repeat:  this.selectedEvent.repeat,
          repeat_checkoption: this.selectedEvent.repeat_checkoption,
          repeat_on: this.selectedEvent.repeat_on,
          repeat_tenure: this.selectedEvent.repeat_tenure,
          repeat_option: this.selectedEvent.repeat_option,
          // duration: timediff,
          category: this.selectedEvent.category_id,
          title: this.selectedEvent.title, 
          description: this.selectedEvent.description,
          time : this.selectedEvent.time,
          location: this.selectedEvent.location._id,
          location_room: this.selectedEvent.location_room,
          building: this.selectedEvent.building ,
          month_date:  null,
          activity_date: this.scheduleDate,
          isOccurrence : true
      }
      console.log(payload)
      if(!eventDragged) {
        const objIndex = this.events.findIndex((obj => obj._id == this.selectedEvent._id));
        if(!this.selectedEvent.location.onGround) {
          let index = this.locationList.findIndex(i => i._id == payload.location);
          this.selectedEvent.location = this.locationList[index]
        } else {
          let index = this.locationListOnGround.findIndex(i => i._id == payload.location);
          this.selectedEvent.location = this.locationListOnGround[index]
        }
        this.events[objIndex]= this.selectedEvent;
      }

      
    this.updateEvent(action, payload)
  }

  async updateEvent(action, payload) {
    await this._apiService.apiFn(action, payload)
      .then((result: any) => {
    this.isEdit = false

        console.log(result)
        this._commonService.setLoader(false);
        this._toastr.success(result.message);
        this.handleEvent('', this.selectedEvent)
        
      });
      this._commonService.setLoader(false);

  }

  weekDayText(e) {
    const checkData = [];
    for (const [key, value] of Object.entries(this.editSchedule.repeat_on)) {
      if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
    }
    return (checkData).toString().replace(/,/g, ', ');
  }


  closeRepeatDialog(): void {
    this.assignedCare.user_id = null;
    this.dialogRefs.close();
  }

  cancel() {
    this.isEdit = false;
    const objIndex = this.events.findIndex((obj => obj._id == this.selectedEvent._id));
    console.log('=============>', this.editingEvent ,this.events[objIndex], this.selectedEvent)
    this.selectedEvent = this.editingEvent;
    this.events[objIndex] = this.editingEvent;
  }

  async deleteCares(scheduleD) {

    /*let demo1 = scheduleD._id
    let demo2 = 1600885800000
 
    const payload = { type: "pass", schedule_id : demo1, dated: demo2  };
    const action = {
      type: 'POST',
      target: 'schedule/state'
    };
    const result = await this._apiService.apiFn(action, payload);
 
    console.log("   = delete dated ===", result);//return;*/
    this.deleteCare = scheduleD.schedule_id;
    this.deleteCareType = 'scheduled';
    if (scheduleD.schedule_id) {
      this.deleteCareType = 'assignDate';
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = "450px"
    dialogConfig.panelClass = "DeleteAlert"
    //dialogConfig.disableClose = true;
    this.dialogRefs = this._dialog.open(this.deleteDialog, dialogConfig);
  }



  // scheduleTime(schedule) {
  //   const start = moment.unix(schedule.start_time/1000);
  //   const end = moment.unix(schedule.start_time/1000).add(schedule.duration, 'second');
  //   // return moment.unix(schedule.start_time/1000).format("HH:mm") + ' - ' + moment.unix(schedule.start_time/1000).add(schedule.duration, 'second').format('HH:mm');
  //   return moment(start).tz(this.timezone).format("HH:mm") + ' - ' + moment(end).tz(this.timezone).format('HH:mm');
  // }

  // repeatPopChanged(ad) {
  //   if (this.editSchedule.repeat === 'every_day' || this.editSchedule.repeat === 'every_week' || this.editSchedule.repeat === 'every_month' || this.editSchedule.repeat === 'every_year' || this.editSchedule.repeat === 'custom_weekly') {
  //     this.editSchedule.repeat_on = {
  //       monday: true,
  //       tuesday: true,
  //       wednesday: true,
  //       thursday: true,
  //       friday: true,
  //       saturday: true,
  //       sunday: true
  //     };
  //     if (this.editSchedule.repeat === 'custom_weekly') {
  //       this.arrayNumber = Array(32).fill(32, 0, 32).map((x, i) => i + 1);
  //     }
  //   }
  //   if (this.editSchedule.repeat == 'every_month') {
  //     this.editSchedule.repeat_option = 'on_day';
  //     this.editSchedule.repeat_checkoption = 'every_month';
  //   }
  //   if (this.editSchedule.repeat == 'every_year') {
  //     this.editSchedule.repeat_option = 'on_day';
  //     this.editSchedule.repeat_checkoption = 'every_year';
  //   }
  //   if (this.editSchedule.repeat != 'never') {
  //     this.editSchedule.repeat_tenure = 1
  //   }
  //   if (this.editSchedule.repeat === 'custom_yearly') {
  //     this.editSchedule.month_date = this.editSchedule.month_date ? this.editSchedule.month_date : 1;
  //   }
  // }

  weekDayChanged(e) {
    let checkData = true;
    for (const [key, value] of Object.entries(this.editSchedule.repeat_on)) {
      if (!value) {
        checkData = false;
        break;
      }
    }
    if (!checkData) {
      if (this.editSchedule && this.editSchedule.repeat != 'custom_weekly') this.editSchedule.repeat = 'every_week';
    } else {
      this.editSchedule.repeat = 'every_day';
    }
  }

  radioRepeatChange(event): void {
    this.editSchedule.repeat_option = event.value;
  }
  updateLocationTimeChanged(timeData, event) {
    let timeendDisp;
    if(parseInt(moment(event.value).tz(this.userLocalTimeZone).format('HH')) == 23) {
      let minute = 59 - parseInt(moment(event.value).tz(this.userLocalTimeZone).format('mm'))
      console.log('minuteminute', minute)
      timeendDisp = new Date(moment(event.value).add(minute, 'minutes').tz(this.userLocalTimeZone).format("YYYY-MM-DDTHH:mm"));
    } else {
      timeendDisp = new Date(moment(event.value).add(60, 'minutes').tz(this.userLocalTimeZone).format("YYYY-MM-DDTHH:mm"));
    }
    timeData.end_time = timeendDisp;
    timeData.start_time = event.value;
    this.selectedEvent.end_time = timeendDisp;
  }

  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString("en-US", { timeZone: this.timezone });
    if (this.timezone) {
      newDate = moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss");
    }
    return moment(newDate)["_d"];
  }
  getDateFromTimezone(date) {

    let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
    if (this.timezone) {
      newDate = moment(date).tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss");
    }
    return moment(newDate)["_d"];
  }
  check30minutesPassForMissedSchedule(schedule) {
    const endtime = moment.unix(schedule.start_time / 1000).add(schedule.duration, 'second').tz(this.timezone);

    const currentMinute = moment.tz(this.timezone)
    const duration = moment.duration(currentMinute.diff(endtime))

    const mins = duration.asMinutes()
    if (mins > 30) {
      return true
    } else {
      return false
    }

  }







  setDateTime(data) {
    const end = moment.unix(data.start_time/1000).add(data.duration, 'second');
    return moment(data.start_date).tz(this.timezone).format("MM/DD/YYYY") + ' , ' + moment(data.start_time).tz(this.timezone).format('HH:mm') + ' - '  + moment(end).tz(this.timezone).format('HH:mm');
  }




  filter() {
    this.showFilter = true;
  }

  moveToAddNew(){
    console.log("Add new clicked")
    this._router.navigate(['/activity-scheduling/create']);
  }
  moveToCalendar() {
    this._router.navigate(['/activity-scheduling']);
  }

  async deleteAllCares(event,performer) {
    event.stopPropagation();
    if(performer.scheduleCares && performer.scheduleCares.length>0) {
      this.performerDelete = performer;
      const dialogConfig = new MatDialogConfig();
      dialogConfig.maxWidth = "450px"
      dialogConfig.panelClass = "DeleteAlert"
      this.dialogRefs = this._dialog.open(this.deletePerformerDialog, dialogConfig);
    } else {
      this.assignedData.filter((item,i) => {
        if(item._id.assigned_to === performer._id.assigned_to) {
          this.assignedData.splice(i,1);
        }
      })
    }
  }
  closeDialog() {
    this.dialogRefs.close();
  }

  // changeResident(value) {
  //   this.getScheduleData(this.scheduleReport, this.scheduleReportForm.valid)
  // }

  gotoPreviousDate() {
    this._commonService.setLoader(true);
    this.selectedEvent = null;
    var new_date = moment(this.scheduleDate).tz(this.timezone).add(-1, "day").toDate();
    this.dateChange(new_date);
    this._commonService.setLoader(false);
    
  }

  gotoNextDate() {
    this._commonService.setLoader(true);
    this.selectedEvent = null;
    var new_date = moment(this.scheduleDate).tz(this.timezone).add(1, "day").toDate();
    console.log('new_date', new_date,typeof this.scheduleDate, this.timezone )
    this.dateChange(new_date);
    this._commonService.setLoader(false);

  }

  goToToday() {
    this._commonService.setLoader(true);
    this.selectedEvent = null;
    this.calendarDate = this.minDate;
    this.dateChange(this.calendarDate) 
    this._commonService.setLoader(false);

  }

  async dateChange(value) {
    // this._commonService.setLoader(true)
    const startDate = moment(value).startOf('day').valueOf();
    this.scheduleDate = startDate;
    this.dateToSend = this.scheduleDate;
    await this.getAllEvents();
    this.refresh.next();

    // this._router.navigate(['/scheduling/day_list', startDate]);
  }

  checkPrevious(scheduleDate,minDate) {
    const min_Date = moment(minDate).startOf('day').valueOf();
    if(scheduleDate === min_Date) {
      return true;
    } else {
      return false
    }
    return false;
  }

  editDeleteActivity(type) {
    this.editDeleteType = type
  }

  editDeleteSelected(type) {
    if(type == 'edit') {
      if(this.editDeleteType == 'single') {
        this.editEvent()
      } else {
        this.editFutureEvent(this.selectedEvent)
      }
    } else {
      if(this.editDeleteType == 'single') {
        this.deleteEvent(this.selectedEvent, true)
      } else {
        this.deleteEvent(this.selectedEvent, false)
      }
    }
  }
}
