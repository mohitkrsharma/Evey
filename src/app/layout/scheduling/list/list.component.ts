import { async } from '@angular/core/testing';
import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TemplateRef, ViewChild } from '@angular/core';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { CommonService } from './../../../shared/services/common.service';
import { ApiService } from './../../../shared/services/api/api.service';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig, MatExpansionPanel, MatOption } from '@angular/material';
import {
  startOfMonth, startOfDay, startOfWeek, addWeeks, endOfDay, subDays, addDays, endOfMonth, endOfWeek, isSameDay,
  isSameMonth, addHours, addMinutes, addSeconds, format
} from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient , HttpHeaders} from '@angular/common/http';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  public formatString: string = 'HH:mm';
  userLocalTimeZone = moment.tz.guess()
  subscription: Subscription;
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
  organization; facility; events;
  userslist;
  minDate: Date;
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
  arrayNumber = Array(10).fill(10, 0, 10).map((x, i) => i + 1);
  showFilter: boolean = false;
  @ViewChild('confirmDialog', {static: true}) confirmDialog: TemplateRef<any>;
  @ViewChild('unassignDialog', {static: true}) unassignDialog: TemplateRef<any>;
  @ViewChild('deleteDialog', {static: true}) deleteDialog: TemplateRef<any>;
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
  constructor(
    private _activeRoute: ActivatedRoute,
    private _router: Router,
    private _apiService: ApiService,
    private _dialog: MatDialog,
    public _commonService: CommonService,
    private _toastr: ToastrService,
    private _socketService: SocketService,
    private fb: FormBuilder,
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
              
              // Make socket connection and listner
              this.roomName = this.facility + '-SCH';


                    this.socketSubscription.add(this._socketService.connectFn(this.roomName).subscribe(async (_result: any) => {
                      console.log("result after socket connection >>>>>",_result)
                    }));
                    this.socketSubscription.add(this._socketService.listenRoomFn().subscribe(async (_response: any) => {
                      if(_response.eventType === "affected_schedule_occurance") 
                      if (_response) await this.getAllEvents();
                    }));
              // End of make socket connection and listner
      
              await this.getAllresidents();
              await this.getAllusers();
              await this.getShift();
              // await this.fetchEvents();
              await this.getAllEvents()
            }
          });
        } else {
          this._router.navigate(['/scheduling']);
        }
      } else {
        this._router.navigate(['/scheduling']);
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

    this.scheduleReportForm = this.fb.group({
      resident: [''],
      resSearch: [''],
      shift: [''],
      shiftSearch: ['']
    });
  }

  ngOnDestroy() {
    localStorage.removeItem('assigned_to');
    this.socketSubscription.unsubscribe();
    this._socketService.disConnectFn(this.roomName).subscribe(async (_result: any) => {
      console.log("result after socket disconnection >>>>>",_result)
    })
  }

  convertNext30MinuteInterval(timeSelected) {
    const remainder = (moment().tz(this.timezone).minute() % 30) - 30; //add time zone-----
    const dateTime = moment(timeSelected).tz(this.timezone).add(-remainder, "minutes").toDate(); // add time zone-----
    return dateTime;
  }


  async getShift() {
    let shiftList = this._commonService.shiftTime()
    this.shiftArr = [{ no: 4, name: 'All Shift' }, ...shiftList];
    console.log("Shift data ===>>>> ",this.shiftArr)
    /*  let shiftList = []
      const action  = {
        type   : "GET",
        target : "shift/",
      };
      let obj = {
        "organization" : this.organization,
        "facility"     : this.facility
      }
      const payload = obj;
      let result    = await this._apiService.apiFn(action, payload);
      
      if(result['status']){
        let data = result['data']
        shiftList.push({
          
            no        : 0,
            name      : 'All Shift',
            startTime :'',
            endTime   :''
          
        })
        data.forEach( e => {
          shiftList.push(
            {
              no        : e._id,
              name      : `${e.shift_name} (${e.start_time} - ${e.end_time})`,
              startTime : e.start_time,
              endTime   : e.end_time
            }
          )
        })
        this.shiftArr = shiftList
      }*/
  }

  async changeShift(shift) {
    // this._commonService.setLoader(true);
    this.currentShift =  shift.no 
    //this.shiftStartTime = new Date(new Date().toISOString().slice(0,10) + " " + shift.startTime);

    // let newDate1 = moment();
    // let newDate2 = moment();
    // switch (shift.no) {
    //   case 1:
    //     newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    //     newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    //     break;
    //   case 2:
    //     newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    //     newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    //     break
    //   case 3:
    //     newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    //     newDate2.add(1, 'days').set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    //     break
    //   case 0:
    //     newDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    //     newDate2.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    //     break
    //   default:
    //     break;
    // }
    // if (shift.no > 0) {
    //   this.shiftStartTime = newDate1.toDate();
    //   this.shiftEndTime = moment(newDate2.toDate()).add({ second: -1 })["_d"];
    // }
    // else {
    //   this.shiftStartTime = '';
    //   this.shiftEndTime = '';
    // }
    // this.shiftStartTime = this.getDateFromTimezone(newDate1.toDate())
    // this.shiftEndTime = this.getDateFromTimezone(newDate2.toDate())
    // console.log(newDate1,newDate2,this.shiftStartTime,this.shiftEndTime)
    // return
    // this.shiftStartTime = moment(shift.startTime, "HH:mm").toDate();
    // this.shiftEndTime   = moment(shift.endTime, "HH:mm").toDate();

    // await this.fetchEvents();
    this.getScheduleData(this.scheduleReport, this.scheduleReportForm.valid)
  }

  async resetFilter() {
    this._commonService.setLoader(true);

    this.resident = [];
    this.shiftStartTime = '';
    this.shiftEndTime = '';
    this.shift = '';
    this.scheduleReportForm.controls.resident
      .patchValue([...this.residentslist.map(item => item.value), 0]);
    await this.getAllEvents();
  }

  async residentFilter(resident, filter) {
    this._commonService.setLoader(true);
    this.resident = resident;
    // console.log('this.resident---->', this.resident);
    await this.getAllEvents();
  }

  // new resident search code
  selectAllresidents() {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.scheduleReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.value), 0]);
      for (let i = 0; i < this.scheduleReport.resident.length; i++) {
        if (this.scheduleReport.resident[i] === 0) {
          this.scheduleReport.resident.splice(i, 1);
        }
      }
    } else {
      this.scheduleReportForm.controls.resident.patchValue([]);
    }
  }

  selectResident(all) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
    if (this.scheduleReportForm.controls.resident.value.length == this.residentslist.length) {
      this.selectedResident.select();
    }
    for (let i = 0; i < this.scheduleReport.resident.length; i++) {
      if (this.scheduleReport.resident[i] === 0) {
        this.scheduleReport.resident.splice(i, 1);
      }
    }
  }

  async getScheduleData(scheduleReport, status) {
    this._commonService.setLoader(true);
    // console.log('form status--->', status);
    // console.log('scheduleReport--->', this.scheduleReport.resident);
    await this.getAllEvents();
  }

  async getAllresidents() {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': [this.organization],
      'facility': [this.facility]
    };
    const result = await this._apiService.apiFn(action, payload);
    if (result['success'] && result['data']) {
      this.residentslist = [];
      await result['data'].map((obj, index) => {
        if (obj.room) {
          const robj = {};
          robj['name'] = obj['last_name'] + ', ' + (obj['first_name']) + '. ' + ((obj['room']) ? obj['room']['room'] : '');
          robj['value'] = obj._id;
          this.residentslist.push(robj);

        }
      });

      this.residentslist.sort(function (a, b) {
        const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
        if (nameA < nameB) { return -1; }
        if (nameA > nameB) { return 1; }
        return 0; // default return value (no sorting)
      });

      this.scheduleReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.value), 0]);
    }
  }

  setStep(index: number,assignedTo) {
    localStorage.setItem('assigned_to', JSON.stringify(assignedTo));
    this.step = index;
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
    // const startDate = moment(event.value).startOf('day').valueOf();
    // this._router.navigate(['/scheduling/day_list', startDate]);
    const startDate = moment(event.value).startOf('day').toDate();
    this.dateChange(startDate);
  }

  shiftFilterCare(scheduleCares) {
    var currentDate = moment(moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss")).set({ second: 0, millisecond: 0 });
    let currentTime = moment(moment().tz(this.timezone).format("YYYY-MM-DDTHH:mm:ss")).set({ second: 0, millisecond: 0 });
    let startDayCurrentDate = startOfDay(moment(currentTime).valueOf()).valueOf();
    if (startDayCurrentDate === this.scheduleDate) {
      const startH = moment(scheduleCares.start_time).format('HH');
      const startM = moment(scheduleCares.start_time).format('mm');
      const startDateMissed: any = moment(new Date());
      startDateMissed.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
      let endTimeDataMissed = moment.unix(startDateMissed / 1000).add(scheduleCares.duration, 'second').toDate();
      if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
        if (((moment(this.shiftStartTime).unix() <= moment(startDateMissed).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDateMissed).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeDataMissed).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeDataMissed).unix())) {
          return true;
        }
        if (moment(this.shiftStartTime).unix() > moment(this.shiftEndTime).unix()) {
          if ((moment(this.shiftStartTime).unix() <= moment(startDateMissed).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeDataMissed).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDateMissed).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeDataMissed).unix())) {
            return true;
          }
        }
      } else if (moment(currentDate).unix() >= moment(endTimeDataMissed).unix()) {
        return true;
      }
    }
  }

  getUserLocalTimeFromUtc(date) {
    return moment(moment.tz(date, this.timezone)).tz(this.userLocalTimeZone, true).valueOf()
  }

  getScheduleEndTime(start_time, duration) {
    // const startH = moment.tz(start_time,this.timezone).format('HH');
    // const startM = moment.tz(start_time,this.timezone).format('mm');
    // const startDate:any = moment.tz(this.timezone);
    // console.log('------------------------converting time------------',startH,startM)
    // // startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
    //   // return moment.tz(startDate)
    // // return moment.unix(startDate/1000).add(duration, 'second').tz(this.timezone).format();
    // const endDateUnix = moment.unix(start_time/1000).add(duration, 'second')
    // return moment.tz(endDateUnix,this.timezone).format('LLLL')

    const startH = moment.unix(start_time / 1000).tz(this.timezone).format("HH");
    const startM = moment.unix(start_time / 1000).tz(this.timezone).format("mm");
    const startDate: any = moment(this.getCurrentDateFromTimezone());
    startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

    return moment.unix(startDate / 1000).add(duration, 'second').toDate();
  }

  async getAllEvents() {
    this.events = [];
    const startDate = this.scheduleDate; //moment(this.scheduleDate).tz(this.timezone, true).startOf('day').valueOf();
    // const startDate = moment().utc().valueOf();
    const endDate = moment(this.scheduleDate).endOf('day').valueOf();

    const currentTime2 = this.getCurrentDateFromTimezone()
    // const startDayCurrentDate2 = startOfDay(moment(currentTime2).tz(this.timezone,true).valueOf()).valueOf();
    const startDayCurrentDate2 = moment(currentTime2).startOf('day').valueOf();
    // console.log('----dates-----',startDate,startDayCurrentDate2)
    let isToday;
    if (moment(startDate).utc().valueOf() == startDayCurrentDate2) isToday = true;
    for (let i = 0; i < this.scheduleReport.resident.length; i++) {
      if (this.scheduleReport.resident[i] === 0) {
        this.scheduleReport.resident.splice(i, 1);
      }
    }
    let payload;
    //  const start = moment(this.scheduleDate).format("DD/MM/YYYY");
    //  const today = moment(new Date()).format("DD/MM/YYYY")
    //  console.log("scheduleDate>>>>>>>>>>>>",moment(this.scheduleDate).format("DD/MM/YYYY"),today)
    //  const dateTosend = moment(this.scheduleDate).valueOf();
    //  console.log("date to send >>>>>",dateTosend)
    //  if(moment(start).isSame(today)){
    //   payload = {
    //     // date: startDate,
    //     org_id: this.organization,
    //     fac_id: this.facility,
    //     shift:this.currentShift,
    //     residentArray: this.scheduleReport.resident,
    //     };
    //  } else {
      let residentSend = this.scheduleReport.resident;
      if (this.scheduleReportForm.controls.resident.value.length == this.residentslist.length) {
        residentSend = [];
      }
      payload = {
        // date: startDate,
        org_id: this.organization,
        fac_id: this.facility,
        shift:this.currentShift,
        date: moment(this.dateToSend).format("MM/DD/YYYY"),
        residentArray: residentSend,
        };
    //  }
    console.log('getAllEvents payload---->', payload);
    // const action;
    await this._apiService.apiFn({ type: 'GET', target: 'schedule/getScheduleByDate' }, payload)
    .then((result: any) => {
      console.log('result::::::::::::::::::::', result)
      // this.missedCareData = result.missed;
      if(result.status) {
         this.missedCareData =  result.data.missed;
         this.unassignedData =  result.data.unAssigned;
         this.assignedData =  result.data.assigned;
         this.assignedDataTotalSchedule = 0;
          this.assignedData.map(item => {
            this.assignedDataTotalSchedule += item.scheduleCares ? item.scheduleCares.length: 0;
          })
         this._commonService.setLoader(false);

      }

      this.assignedData.sort((a , b) => a._id.performer.localeCompare(b._id.performer));
      if(this.assignedData && this.assignedData.length && this.assignedData.length > 0) {
      let assigned_to = JSON.parse(localStorage.getItem('assigned_to'));
        this.assignedData.filter((item)=> {
          if(assigned_to && item._id.assigned_to === assigned_to) {
            item._id['open'] = true;
          } else {
            console.log(item)
            item._id['open'] = false;
          }
          item.scheduleCares.filter((data)=> {
            const value = moment.unix(data.start_time/1000);
            let h = moment(value).tz(this.timezone).format("HH");
            let m = moment(value).tz(this.timezone).format("mm");
            data['sortValue'] = Number(h) * 60 + Number(m);
          })
          item.scheduleCares.sort((a , b) => a.sortValue - b.sortValue);
        })
      }
      this.assignedDataTemp = JSON.parse(JSON.stringify(this.assignedData));
      this.unassignedData.filter((item)=> {
        const value = moment.unix(item.start_time/1000);
          let h = moment(value).tz(this.timezone).format("HH");
          let m = moment(value).tz(this.timezone).format("mm");
          item['sortValue'] = Number(h) * 60 + Number(m);
      })
      this.unassignedData.sort((a , b) => a.sortValue - b.sortValue);
      this.unassignedDataTemp = JSON.parse(JSON.stringify(this.unassignedData));
      console.log("uunassignedDataTemp",this.unassignedDataTemp)
      this.missedCareData.filter((item)=> {
        const value = moment.unix(item.start_time/1000);
          let h = moment(value).tz(this.timezone).format("HH");
          let m = moment(value).tz(this.timezone).format("mm");
          item['sortValue'] = Number(h) * 60 + Number(m);
      })
      this.missedCareData.sort((a , b) => a.sortValue - b.sortValue);
      console.log("assigned care data ===?>>> ",this.assignedData)
      console.log("missed care data ===?>>> ",this.missedCareData)
      console.log("missed care data ===?>>> ",this.unassignedData)
      // 
    })
    .catch((error) =>{
      this._commonService.setLoader(false);
      this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')
    });
  }

  // async fetchEvents() {
  //   this.events = [];
  //   const startDate = this.scheduleDate; //moment(this.scheduleDate).tz(this.timezone, true).startOf('day').valueOf();
  //   // const startDate = moment().utc().valueOf();
  //   const endDate = moment(this.scheduleDate).endOf('day').valueOf();

  //   const currentTime2 = this.getCurrentDateFromTimezone()
  //   // const startDayCurrentDate2 = startOfDay(moment(currentTime2).tz(this.timezone,true).valueOf()).valueOf();
  //   const startDayCurrentDate2 = moment(currentTime2).startOf('day').valueOf();
  //   // console.log('----dates-----',startDate,startDayCurrentDate2)
  //   let isToday;
  //   if (moment(startDate).utc().valueOf() == startDayCurrentDate2) isToday = true;

  //   const payload = {
  //     start_time: startDate,
  //     end_time: endDate,
  //     org_id: this.organization,
  //     fac_id: this.facility,
  //     // resident   : '',
  //     residentArray: this.scheduleReport.resident,
  //     isToday: isToday,
  //   };
  //   console.log('fetchEvents payload---->', payload);
  //   // const action;
  //   await this._apiService.apiFn({ type: 'GET', target: 'schedule/get_daylist' }, payload)
  //     .then((result: any) => {
  //       console.log('result::::::::::::::::::::', result)
  //       if (result['status'] && result['data']) {
  //         //result['data']['assigned'] = {};
  //         //result['data']['assigned'] = result['data']['assignedNew'][0];
  //         this.unassignedData = [];
  //         this.assignedData = [];
  //         this.missedCareData = [];
  //         this.missedCareDataId = [];
  //         const scheduleAssigned = [];

  //         if (result['data']['assignedDated']) {
  //           result['data']['assignedDated'].map((assigndata) => {
  //             if (result['data']['assigned'] && result['data']['assigned'].length) {
  //               const assignedFound = result['data']['assigned'].filter(el => el._id.assigned_to === assigndata._id.assigned_to);
  //               if (assignedFound.length === 0) result['data']['assigned'] = [...result['data']['assigned'], ...assigndata];
  //             }

  //             assigndata.scheduleCares.map((eventSchedules) => {
  //               if (eventSchedules.assigned_to != null) {
  //                 scheduleAssigned.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //               }

  //             });
  //           });
  //         }

  //         if (result['data']['unassigned'] && result['data']['unassigned'].length) {
  //           result['data']['unassigned'].map((eventSchedules) => {
  //             let pay2 = JSON.parse(JSON.stringify(payload))
  //             let sched2 = JSON.parse(JSON.stringify(eventSchedules))

  //             // pay2.start_time = this.getUserLocalTimeFromUtc(pay2.start_time)
  //             // pay2.end_time = this.getUserLocalTimeFromUtc(pay2.end_time)

  //             // sched2.start_date = this.getUserLocalTimeFromUtc(sched2.start_date)
  //             // sched2.start_time = this.getUserLocalTimeFromUtc(sched2.start_time)
  //             // if (sched2.end_date) sched2.end_date = this.getUserLocalTimeFromUtc(sched2.end_date);

  //             if (this.checkEventSched(pay2, sched2)) {
  //               if (scheduleAssigned.length && scheduleAssigned.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1) {
  //                 let endTimeData = this.getScheduleEndTime(eventSchedules.start_time, eventSchedules.duration)
  //                 if (isToday == true) {
  //                   let currentWith30minExtra = moment(endTimeData).add({ minute: 30 })["_d"];
  //                   console.log(currentWith30minExtra);
  //                   if (moment(currentTime2).valueOf() > moment(endTimeData).valueOf()) {

  //                     console.log("+30", moment(currentWith30minExtra).valueOf())
  //                     console.log("endTimeData", moment(endTimeData).valueOf())
  //                     if (moment(currentTime2).valueOf() > moment(currentWith30minExtra).valueOf()) {
  //                       if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                         this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                         this.missedCareData.push(eventSchedules);
  //                       }
  //                     }
  //                     else {
  //                       this.unassignedData.push(eventSchedules);
  //                     }
  //                   }
  //                   // else if (eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)) {
  //                   //   this.missedCareDataId.push(eventSchedules.schedule_id);
  //                   //   this.missedCareData.push(eventSchedules);
  //                   // } else if (!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id)) {
  //                   //   this.missedCareDataId.push(eventSchedules._id);
  //                   //   this.missedCareData.push(eventSchedules);
  //                   // }
  //                   else {
  //                     this.unassignedData.push(eventSchedules);
  //                   }
  //                 } else {
  //                   this.unassignedData.push(eventSchedules);
  //                 }

  //               } else {
  //                 let endTimeData = this.getScheduleEndTime(eventSchedules.start_time, eventSchedules.duration)
  //                 if (isToday == true) {
  //                   let currentWith30minExtra = moment(endTimeData).add({ minute: 30 })["_d"];
  //                   console.log(currentWith30minExtra);
  //                   if (moment(currentTime2).valueOf() > moment(endTimeData).valueOf()) {

  //                     console.log("+30", moment(currentWith30minExtra).valueOf())
  //                     console.log("endTimeData", moment(endTimeData).valueOf())
  //                     if (moment(currentTime2).valueOf() > moment(currentWith30minExtra).valueOf()) {
  //                       if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                         this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                         this.missedCareData.push(eventSchedules);
  //                       }
  //                     }
  //                     else {
  //                       this.unassignedData.push(eventSchedules);
  //                     }
  //                   }
  //                   // else if (eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)) {
  //                   //   this.missedCareDataId.push(eventSchedules.schedule_id);
  //                   //   this.missedCareData.push(eventSchedules);
  //                   // } else if (!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id)) {
  //                   //   this.missedCareDataId.push(eventSchedules._id);
  //                   //   this.missedCareData.push(eventSchedules);
  //                   // }
  //                   else {
  //                     this.unassignedData.push(eventSchedules);
  //                   }
  //                 } else {
  //                   this.unassignedData.push(eventSchedules);
  //                 }
  //                 //this.unassignedData.push(eventSchedules);                
  //               }
  //             }
  //             else {
  //               if (this.checkEventSchedMissedCare(payload, eventSchedules) && this.shiftFilterCare(eventSchedules)) {
  //                 if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                   this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                   this.missedCareData.push(eventSchedules);
  //                 }
  //               }
  //             }
  //           });
  //         }

  //         if (result['data']['assigned'] && result['data']['assigned'].length) {

  //           result['data']['assigned'].map((assignedata) => {
  //             if (assignedata.scheduleCares && assignedata.scheduleCares.length) {
  //               const scheduleCare = [];
  //               assignedata.scheduleCares.map((eventSchedules) => {

  //                 let pay2 = JSON.parse(JSON.stringify(payload))
  //                 let sched2 = JSON.parse(JSON.stringify(eventSchedules))

  //                 // pay2.start_time = this.getUserLocalTimeFromUtc(pay2.start_time)
  //                 // pay2.end_time = this.getUserLocalTimeFromUtc(pay2.end_time)

  //                 // sched2.start_date = this.getUserLocalTimeFromUtc(sched2.start_date)
  //                 // sched2.start_time = this.getUserLocalTimeFromUtc(sched2.start_time)

  //                 // if (sched2.end_date) sched2.end_date = this.getUserLocalTimeFromUtc(sched2.end_date);

  //                 if (this.checkEventSched(pay2, sched2)) {
  //                   if (scheduleAssigned.length && scheduleAssigned.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1) {
  //                   } else {
  //                     let endTimeData = this.getScheduleEndTime(eventSchedules.start_time, eventSchedules.duration)
  //                     if (isToday == true) {
  //                       let currentWith30minExtra = moment(endTimeData).add({ minute: 30 })["_d"];
  //                       if (moment(currentTime2).valueOf() > moment(endTimeData).valueOf()) {
  //                         if (moment(currentTime2).valueOf() > moment(currentWith30minExtra).valueOf()) {
  //                           if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                             this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                             this.missedCareData.push(eventSchedules);
  //                           }
  //                         }
  //                         else {
  //                           // scheduleCare.push(eventSchedules);
  //                           this.unassignedData.push(eventSchedules);
  //                         }
  //                       }
  //                       else {
  //                         scheduleCare.push(eventSchedules);
  //                       }
  //                       // else if (eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)) {
  //                       //   this.missedCareDataId.push(eventSchedules.schedule_id);
  //                       //   this.missedCareData.push(eventSchedules);
  //                       // } else if (!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id)) {
  //                       //   this.missedCareDataId.push(eventSchedules._id);
  //                       //   this.missedCareData.push(eventSchedules);
  //                       // }
  //                     } else {
  //                       scheduleCare.push(eventSchedules);
  //                     }
  //                     //scheduleCare.push(eventSchedules);                    
  //                   }
  //                 }
  //                 // else{
  //                 //   eventSchedules.careLevalData = eventSchedules.resident.care_level;
  //                 //    if(this.checkEventSchedMissedCare( payload, eventSchedules) && this.shiftFilterCare(eventSchedules)){
  //                 //         if(eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)){
  //                 //           this.missedCareDataId.push(eventSchedules.schedule_id);
  //                 //           this.missedCareData.push(eventSchedules);                                             
  //                 //         }
  //                 //         else if(!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id) ){
  //                 //           this.missedCareDataId.push(eventSchedules._id);
  //                 //           this.missedCareData.push(eventSchedules);                                             
  //                 //         }
  //                 //     }
  //                 // }
  //               });
  //               assignedata.scheduleCares = {};
  //               if (scheduleCare.length) assignedata.scheduleCares = scheduleCare;
  //               return assignedata;
  //             } else {
  //               return assignedata;
  //             }
  //           });

  //           result['data']['assigned'].map((assigndata) => {
  //             if (result['data']['assignedDated'] && result['data']['assignedDated'].length) {
  //               const assignedDated = result['data']['assignedDated'].filter(el => el._id.assigned_to === assigndata._id.assigned_to);
  //               if (assignedDated.length) { }
  //             } else {
  //               return assigndata;
  //             }
  //           });

  //           result['data']['assigned'].map((assigndata) => {
  //             let scheduleCare = [];
  //             if (result['data']['assignedDated'] && result['data']['assignedDated'].length) {
  //               const assignedDated = result['data']['assignedDated'].filter(function (el) {
  //                 return el._id.assigned_to === assigndata._id.assigned_to;
  //               });
  //               if (assignedDated.length) {
  //                 //scheduleCare = assignedDated[0].scheduleCares;
  //                 if (assignedDated[0].scheduleCares && assignedDated[0].scheduleCares.length) {
  //                   assignedDated[0].scheduleCares.map((eventSchedules) => {

  //                     let pay2 = JSON.parse(JSON.stringify(payload))
  //                     let sched2 = JSON.parse(JSON.stringify(eventSchedules))

  //                     // pay2.start_time = this.getUserLocalTimeFromUtc(pay2.start_time)
  //                     // pay2.end_time = this.getUserLocalTimeFromUtc(pay2.end_time)

  //                     // sched2.start_date = this.getUserLocalTimeFromUtc(sched2.start_date)
  //                     // sched2.start_time = this.getUserLocalTimeFromUtc(sched2.start_time)
  //                     // if (sched2.end_date) {
  //                     //   sched2.end_date = this.getUserLocalTimeFromUtc(sched2.end_date)
  //                     // }

  //                     if (this.checkEventSched(pay2, sched2)) {
  //                       let endTimeData = this.getScheduleEndTime(eventSchedules.start_time, eventSchedules.duration)
  //                       if (isToday == true) {
  //                         let currentWith30minExtra = moment(endTimeData).add({ minute: 30 })["_d"];
  //                         console.log(currentWith30minExtra)
  //                         if (moment(currentTime2).valueOf() > moment(endTimeData).valueOf()) {
  //                           if (moment(currentTime2).valueOf() > moment(currentWith30minExtra).valueOf()) {
  //                             if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                               this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                               this.missedCareData.push(eventSchedules);
  //                             }
  //                           }
  //                           else {
  //                             scheduleCare.push(eventSchedules);
  //                           }
  //                         } else {
  //                           // if (eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)) {
  //                           //   this.missedCareDataId.push(eventSchedules.schedule_id);
  //                           //   this.missedCareData.push(eventSchedules);
  //                           // }
  //                           // else if (!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id)) {
  //                           //   this.missedCareDataId.push(eventSchedules._id);
  //                           //   this.missedCareData.push(eventSchedules);
  //                           // }
  //                           scheduleCare.push(eventSchedules);
  //                         }
  //                       } else {
  //                         scheduleCare.push(eventSchedules);
  //                       }

  //                     }
  //                   });
  //                 }
  //               }
  //             }
  //             if (assigndata.scheduleCares && assigndata.scheduleCares.length) {
  //               assigndata.scheduleCares.map((eventSchedules) => {

  //                 let pay2 = JSON.parse(JSON.stringify(payload))
  //                 let sched2 = JSON.parse(JSON.stringify(eventSchedules))

  //                 // pay2.start_time = this.getUserLocalTimeFromUtc(pay2.start_time)
  //                 // pay2.end_time = this.getUserLocalTimeFromUtc(pay2.end_time)

  //                 // sched2.start_date = this.getUserLocalTimeFromUtc(sched2.start_date)
  //                 // sched2.start_time = this.getUserLocalTimeFromUtc(sched2.start_time)
  //                 // if (sched2.end_date) {
  //                 //   sched2.end_date = this.getUserLocalTimeFromUtc(sched2.end_date)
  //                 // }

  //                 if (this.checkEventSched(pay2, sched2)) {
  //                   let endTimeData = this.getScheduleEndTime(eventSchedules.start_time, eventSchedules.duration)
  //                   if (isToday == true) {
  //                     let currentWith30minExtra = moment(endTimeData).add({ minute: 30 })["_d"];
  //                     console.log(currentWith30minExtra)
  //                     if (moment(currentTime2).valueOf() > moment(endTimeData).valueOf()) {
  //                       if (moment(currentTime2).valueOf() > moment(currentWith30minExtra).valueOf()) {
  //                         if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                           this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                           this.missedCareData.push(eventSchedules);
  //                         }
  //                       }
  //                       else {
  //                         scheduleCare.push(eventSchedules);
  //                       }

  //                     } else {
  //                       // if (eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)) {
  //                       //   this.missedCareDataId.push(eventSchedules.schedule_id);
  //                       //   this.missedCareData.push(eventSchedules);
  //                       // }
  //                       // else if (!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id)) {
  //                       //   this.missedCareDataId.push(eventSchedules._id);
  //                       //   this.missedCareData.push(eventSchedules);
  //                       // }
  //                       scheduleCare.push(eventSchedules);
  //                     }
  //                   } else {
  //                     scheduleCare.push(eventSchedules);
  //                   }
  //                   //scheduleCare.push(eventSchedules);                    
  //                 }
  //                 // else{
  //                 //   if(this.checkEventSchedMissedCare( payload, eventSchedules) && this.shiftFilterCare(eventSchedules) ){
  //                 //     if(eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules.schedule_id)){
  //                 //       this.missedCareDataId.push(eventSchedules.schedule_id);
  //                 //       this.missedCareData.push(eventSchedules);                                             
  //                 //     }
  //                 //     else if(!eventSchedules.schedule_id && !this.missedCareDataId.includes(eventSchedules._id) ){
  //                 //       this.missedCareDataId.push(eventSchedules._id);
  //                 //       this.missedCareData.push(eventSchedules);                                             
  //                 //     }
  //                 //   }
  //                 // }
  //               });
  //               if (scheduleCare.length) {
  //                 scheduleCare = this.getUnique(scheduleCare, '_id');
  //                 let timeZone = this.timezone;
  //                 // Sort every assigned care list for performer
  //                 scheduleCare.sort(function (a, b) {

  //                   let startDateA = moment(moment().tz(timeZone).format("YYYY-MM-DDTHH:mm:ss"));
  //                   let startDateB = moment(moment().tz(timeZone).format("YYYY-MM-DDTHH:mm:ss"));

  //                   a.start_time = Number(a.start_time);
  //                   b.start_time = Number(b.start_time);

  //                   startDateA.set({ hour: parseInt(moment(a.start_time).format('HH')), minute: parseInt(moment(a.start_time).format('mm')), second: 0, millisecond: 0 });
  //                   startDateB.set({ hour: parseInt(moment(b.start_time).format('HH')), minute: parseInt(moment(b.start_time).format('mm')), second: 0, millisecond: 0 });
  //                   const startdateAA = startDateA.utc().valueOf();
  //                   const startdateBB = startDateB.utc().valueOf();

  //                   return startdateAA - startdateBB;
  //                 });

  //                 assigndata.scheduleCares = scheduleCare;
  //                 this.assignedData.push(assigndata);
  //               }
  //             }
  //           });
  //         } else {
  //           if (result['data']['assignedDated'] && result['data']['assignedDated'].length) {

  //             result['data']['assignedDated'].map((assignedDatedData) => {
  //               let scheduleCare = [];
  //               if (assignedDatedData.scheduleCares && assignedDatedData.scheduleCares.length) {
  //                 assignedDatedData.scheduleCares.map((eventSchedules) => {

  //                   let pay2 = JSON.parse(JSON.stringify(payload))
  //                   let sched2 = JSON.parse(JSON.stringify(eventSchedules))


  //                   if (this.checkEventSched(pay2, sched2)) {
  //                     let endTimeData = this.getScheduleEndTime(eventSchedules.start_time, eventSchedules.duration)
  //                     if (isToday == true) {
  //                       let currentWith30minExtra = moment(endTimeData).add({ minute: 30 })["_d"];
  //                       console.log(currentWith30minExtra)
  //                       if (moment(currentTime2).valueOf() > moment(endTimeData).valueOf()) {
  //                         if (moment(currentTime2).valueOf() > moment(currentWith30minExtra).valueOf()) {

  //                           if (!(this.missedCareDataId.indexOf(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id) > -1)) {
  //                             this.missedCareDataId.push(eventSchedules.schedule_id ? eventSchedules.schedule_id : eventSchedules._id);
  //                             this.missedCareData.push(eventSchedules);
  //                           }
  //                         }
  //                         else {
  //                           scheduleCare.push(eventSchedules);
  //                         }

  //                       } else {

  //                         scheduleCare.push(eventSchedules);
  //                       }
  //                     } else {
  //                       scheduleCare.push(eventSchedules);
  //                     }

  //                   }

  //                 });
  //               }
  //               if (scheduleCare.length) {
  //                 scheduleCare = this.getUnique(scheduleCare, '_id');
  //                 // Sort every assigned care list for performer
  //                 let timezone = this.timezone;
  //                 scheduleCare.sort(function (a, b) {

  //                   let startDateA = moment(moment().tz(timezone).format("YYYY-MM-DDTHH:mm:ss"));
  //                   let startDateB = moment(moment().tz(timezone).format("YYYY-MM-DDTHH:mm:ss"));

  //                   a.start_time = Number(a.start_time);
  //                   b.start_time = Number(b.start_time);

  //                   startDateA.set({ hour: parseInt(moment(a.start_time).format('HH')), minute: parseInt(moment(a.start_time).format('mm')), second: 0, millisecond: 0 });
  //                   startDateB.set({ hour: parseInt(moment(b.start_time).format('HH')), minute: parseInt(moment(b.start_time).format('mm')), second: 0, millisecond: 0 });
  //                   const startdateAA = startDateA.utc().valueOf();
  //                   const startdateBB = startDateB.utc().valueOf();

  //                   return startdateAA - startdateBB;
  //                 });

  //                 assignedDatedData.scheduleCares = scheduleCare;
  //                 this.assignedData.push(assignedDatedData);
  //               }
  //             });


  //             // this.assignedData = result['data']['assignedDated'];
  //           }
  //         }

  //         // Sort Unassign data from Start time wise
  //         if (this.unassignedData && this.unassignedData.length) {
  //           let timezone = this.timezone;
  //           this.unassignedData.sort(function (a, b) {

  //             let startDateA = moment(moment().tz(timezone).format("YYYY-MM-DDTHH:mm:ss"));
  //             let startDateB = moment(moment().tz(timezone).format("YYYY-MM-DDTHH:mm:ss"));

  //             a.start_time = Number(a.start_time);
  //             b.start_time = Number(b.start_time);

  //             startDateA.set({ hour: parseInt(moment(a.start_time).format('HH')), minute: parseInt(moment(a.start_time).format('mm')), second: 0, millisecond: 0 });
  //             startDateB.set({ hour: parseInt(moment(b.start_time).format('HH')), minute: parseInt(moment(b.start_time).format('mm')), second: 0, millisecond: 0 });
  //             const startdateAA = startDateA.utc().valueOf();
  //             const startdateBB = startDateB.utc().valueOf();

  //             return startdateAA - startdateBB;
  //           });
  //         }

  //         if (this.missedCareData && this.missedCareData.length) {
  //           let timezone = this.timezone;
  //           this.missedCareData.sort(function (a, b) {

  //             let startDateA = moment(moment().tz(timezone).format("YYYY-MM-DDTHH:mm:ss"));
  //             let startDateB = moment(moment().tz(timezone).format("YYYY-MM-DDTHH:mm:ss"));

  //             a.start_time = Number(a.start_time);
  //             b.start_time = Number(b.start_time);

  //             startDateA.set({ hour: parseInt(moment(a.start_time).format('HH')), minute: parseInt(moment(a.start_time).format('mm')), second: 0, millisecond: 0 });
  //             startDateB.set({ hour: parseInt(moment(b.start_time).format('HH')), minute: parseInt(moment(b.start_time).format('mm')), second: 0, millisecond: 0 });
  //             const startdateAA = startDateA.utc().valueOf();
  //             const startdateBB = startDateB.utc().valueOf();

  //             return startdateAA - startdateBB;
  //           });

  //           this.missedCareData = this.missedCareData.filter(x => x.new_schedule_id == null);
  //           // this.unassignedData.forEach(x => {
  //           //   let _id = x.schedule_id ? x.schedule_id : x._id;
  //           //   if (_id ) {
  //           //     let index = this.missedCareData.findIndex(f => { return f.new_schedule_id == _id });
  //           //     if (index > -1) {
  //           //       this.missedCareData.splice(index,1);
  //           //     }
  //           //   }
  //           // });
  //         }

  //         /* End Sorting code */
  //         for (let index = 0; index < this.assignedData.length; index++) {
  //           this.panelOpenState[index] = 'hideClass';
  //         }
  //       }

  //     })
  //     .catch((error) => this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.'));

  //   // only for testing
  //   const actionP1 = { type: 'GET', target: 'schedule/list' };
  //   const payloadP1 = {
  //     org_id: this.organization,
  //     fac_id: this.facility,
  //     assigned_to: "603cab946144e95a1727c37d"
  //   };

  //   // const payloadp2 = { "fac_id" : "5ddd42ab8681543dd8c0c0db",
  //   //  "assigned_to" : "603cab946144e95a1727c37d", 
  //   //  "end_time" : 1621016999000,
  //   //   "start_time" : 1620930600000, 
  //   //   "org_id" : "5a859f300b48ce45436f3948"}

  //   const resultP1 = await this._apiService.apiFn(actionP1, payloadP1);
  //   console.log('resultP1:::::::::::::::', resultP1)
  //   // this.missedCareData = this.missedCareData.map(e=>{
  //   //   if(this.check30minutesPassForMissedSchedule(e)){
  //   //     e.always=true
  //   //   }else{
  //   //     e.always=false
  //   //   }
  //   //   return e
  //   // })

  //   this._commonService.setLoader(false);
  // }

  getUnique(arr, comp) {

    // store the comparison  values in array
    const unique = arr.map(e => e[comp])
      .map((e, i, final) => final.indexOf(e) === i && i)
      .filter(e => arr[e]).map(e => arr[e]);

    return unique;
  }
  async reScheduleMissedCare(scheduleId) {
    this._commonService.setLoader(true);
    await this._apiService.apiFn(
      { type: 'POST', target: 'schedule/get_schedule_by_id' },
      { schedule_id: scheduleId }
    )
      .then((result: any) => {
        if (result['status'] && result['data']) {
          let scheduleCareReschedule = result['data'];
          console.log('scheduleCareReschedule---->', scheduleCareReschedule);
          scheduleCareReschedule.start_time = Number(scheduleCareReschedule.start_time);
          // moment(scheduleCareReschedule.start_date).local().valueOf();
          const startLocalTime = this.getDateFromTimezone(scheduleCareReschedule.start_date).getTime();
          // moment(scheduleCareReschedule.start_time).local().valueOf();
          const startTimeEdit = this.getDateFromTimezone(scheduleCareReschedule.start_time).getTime();
          this.reSchedule = scheduleCareReschedule;
          this.reSchedule.careName = scheduleCareReschedule.care_id.name;
          // tslint:disable-next-line:max-line-length
          this.reSchedule.residentName = scheduleCareReschedule.resident_id.first_name + ', ' + scheduleCareReschedule.resident_id.last_name;
          this.repeatOptions.filter((item)=> {
            if(item.key === scheduleCareReschedule.repeat) {
              this.reSchedule.frequency = item.value
            }
          });
          this.reSchedule.startDate = /*this.getDateFromTimezone(scheduleCareReschedule.start_date)*/new Date(startLocalTime);
          // this.minDateEnd              = scheduleCareReschedule.startDate;
          this.scheduleDateEnd = new Date();
          if (this.reSchedule.startDate < this.scheduleDateEnd) {
            this.reSchedule.startDate = this.scheduleDateEnd;
          }
          this.reSchedule.startTime = moment.unix(startTimeEdit / 1000).tz(this.userLocalTimeZone).format();

          const currentDate = moment().tz(this.userLocalTimeZone).format("LLLL");

          const startTimeToday = this.convertNext30MinuteInterval(currentDate);
          const endTimeToday = moment(startTimeToday).add(30, "minutes").toDate();
          this.minDateValue = moment(startTimeToday).tz(this.userLocalTimeZone).format();;
          if (this.reSchedule.startTime < this.minDateValue) {
            this.reSchedule.startTime = this.minDateValue;
          } else {
            this.reSchedule.startTime = moment.unix(startTimeEdit / 1000).tz(this.userLocalTimeZone).format();
          }
          // tslint:disable-next-line:max-line-length
          this.reSchedule.endTime = moment(this.reSchedule.startTime).add(15, 'minutes').tz(this.userLocalTimeZone).format();
          this.reSchedule.repeat_tenure = null;
          // this.reSchedule.repeat = 'never';
          this.reSchedule.repeat_on = null;
          this.reSchedule.repeat_option = null;
          this.reSchedule.repeat_checkoption = 'never';
          const dialogConfig = new MatDialogConfig();
          dialogConfig.maxWidth = '800px';
          dialogConfig.minWidth = '500px';
          // dialogConfig.disableClose = true;
          this.dialogRefs = this._dialog.open(this.reScheduleCareDialog, dialogConfig);
        }
      })
      .catch(err => this._toastr.error(err.message ? err.message : 'Some error occured please try again.'));
    this._commonService.setLoader(false);
  }

  async saveReScheduleDialog() {
    // return
    this._commonService.setLoader(true);
    /* Validation Starts */
    if (this.reSchedule.startTime == null || this.reSchedule.endTime == null) {
      this._commonService.setLoader(false);
      this._toastr.error('Start time or end time cannot be blank.');
      return;
    }

    if (moment(this.reSchedule.startTime).unix() >= moment(this.reSchedule.endTime).unix()) {
      this._commonService.setLoader(false);
      this._toastr.error('End time cannot be less than or equals to start time.');
      return;
    }

    const isPastTime = this.isPastTime(this.reSchedule.startTime, this.reSchedule.startDate)
    if (isPastTime == true) {
      this._commonService.setLoader(false);
      this._toastr.error('You cannot select past time.');
      return;
    }

    var currentDate = moment(this.getCurrentDateFromTimezone()).tz(this.userLocalTimeZone, true);
    currentDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    var startTimeCompare = moment(this.reSchedule.startDate).toDate();
    if (currentDate.toDate() > startTimeCompare) {
      this._commonService.setLoader(false);
      this._toastr.error('You can not select past date.');
      return;
    }
    /* Validation End */
    const startDateNew = moment(this.reSchedule.startDate);
    startDateNew.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const startDate = startDateNew.valueOf();

    const endDate = moment(startDateNew).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).valueOf();
    // enddate = moment(item.startDate).add(1, 'day').valueOf();
    // const payload = {
    //   resident   : this.reSchedule.resident_id._id,
    //   care       : this.reSchedule.care_id._id,
    //   start_date : startDate,
    //   end_date   : endDate,
    //   org_id     : this.organization,
    //   fac_id     : this.facility,
    // };
    // const action = {
    //   type   : 'GET',
    //   target : 'schedule/get_res_cares'
    // };
    // const result = await this._apiService.apiFn(action, payload);
    // let resultData = result['data'].assigned;
    // if(resultData.length){

    // }else{
    const startH = moment(this.reSchedule.startTime).format('HH');
    const startM = moment(this.reSchedule.startTime).format('mm');
    const startDateSave = moment(this.reSchedule.startDate);
    startDateSave.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

    const startdateTime = Number(startDateSave.utc().valueOf());
    const timediff = (moment(this.reSchedule.endTime).valueOf() - moment(this.reSchedule.startTime).valueOf()) / 1000;
    const careData = [];
    const scheduleData = {
      schedule_id: this.reSchedule._id,
      org_id: this.organization,
      fac_id: this.facility,
      resident_id: this.reSchedule.resident_id._id,
      resident_note: this.reSchedule.resident_note ? this.reSchedule.resident_note : '',
      care_id: this.reSchedule.care_id._id,
      care_note: this.reSchedule.care_note ? this.reSchedule.care_note : '',
      assigned_to: null,
      start_date: moment(startDate).tz(this.timezone, true).valueOf(),
      start_time: moment(startdateTime).tz(this.timezone, true).valueOf(),
      end_date: endDate ? moment(endDate).tz(this.timezone, true).valueOf() : endDate,

      repeat: this.reSchedule.repeat,
      repeat_checkoption: this.reSchedule.repeat_checkoption,
      duration: timediff
    };
    careData.push(scheduleData);
    // console.log('careData--->', careData);
    await this._apiService.apiFn({ type: 'POST', target: 'schedule/add' }, careData)
      .then((result1: any) => {
        if (result1['status']) {
          this._toastr.success('Care re-schedule successfully!');
          this.getAllEvents();
        } else {
          this._commonService.setLoader(false);
          this._toastr.error('Unable to re-schedule care. Please check again!');
        }
      })
      .catch(err => this._toastr.error('Unable to re-schedule care. Please check again!'));
    // }
    this.dialogRefs.close();
  }
  checkEventSchedMissedCare(payload, data) {
    const startTime = payload.start_time;
    const endTime = payload.end_time;
    const startEvnt = startOfDay(data.start_date).valueOf();
    const hourEvnt = parseInt(moment(data.start_date).format('HH'));
    const minuteEvnt = parseInt(moment(data.start_date).format('mm'));
    const endEvnt = addSeconds(addMinutes(addHours(startEvnt, hourEvnt), minuteEvnt), data.duration).valueOf();

    switch (data.repeat) {
      case 'never':
        if (startEvnt === startTime && (!data.end_date || (data.end_date && endEvnt < endTime))) {
          return true;
        }
        break;
      case 'every_week':
        if (startEvnt <= startTime && (!data.end_date || (data.end_date && data.end_date > startTime))) {
          const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
          const eventInWeek = moment(startEvnt).week();
          const dateInWeek = moment(startTime).week();
          if (((dateInWeek - eventInWeek) % data.repeat_tenure) === 0 && data.repeat_on[weekDay]) {
            return true;
          }
        }
        break;
      case 'every_month':
        const eventInMonth = moment(startEvnt).month();
        const dateInMonth = moment(startTime).month();
        if (((dateInMonth - eventInMonth) % data.repeat_tenure) === 0 && startEvnt < payload.end_time &&
          (!endEvnt || (endEvnt && endEvnt < payload.end_time))) {
          let taskNDate = moment().valueOf();
          switch (data.repeat_option) {
            case 'on_day':
              const eventDay = moment(startEvnt).format('D');
              const eventMonth = moment(startTime).format('M');
              const eventYear = moment(startTime).format('YYYY');
              taskNDate = moment(eventMonth + '-' + eventDay + '-' + eventYear, 'MM-DD-YYYY').valueOf();
              break;
            case 'on_week_number':
              const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const weekNNo = Math.ceil(moment(startEvnt).date() / 7);
              taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
              break;
            case 'on_last_week':
              const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
              const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
              taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
              break;
          }
          if (taskNDate && taskNDate >= startTime && taskNDate < endTime &&
            (!data.end_date || (data.end_date && data.end_date > startTime))) {
            return true;
          }
        }
        break;
      case 'every_year':
        const eventEMonth = moment(startEvnt).format('M');
        const eventYMonth = moment(startTime).format('M');
        if (eventYMonth === eventEMonth) {
          const eventYDay = moment(startEvnt).format('D');
          const eventYYear = moment(startTime).format('Y');
          let taskNDate = moment().valueOf();
          switch (data.repeat_option) {
            case 'on_day':
              const dateSet = { 'year': parseInt(eventYYear), 'month': parseInt(eventYMonth) - 1, 'date': parseInt(eventYDay) };
              taskNDate = moment().set(dateSet).startOf('day').valueOf();
              break;
            case 'on_week_number':
              const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const weekNNo = Math.ceil(moment(startEvnt).date() / 7);
              taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
              break;
            case 'on_last_week':
              const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
              const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
              taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
              break;
          }
          if (!endEvnt || (endEvnt && payload.end_time >= taskNDate && payload.start_time <= taskNDate)) {
            return true;
          }
        }
        break;
      case 'custom_weekly':
        if (startEvnt <= startTime && (!data.end_date || (data.end_date && data.end_date > startTime))) {
          const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
          const eventInWeek = moment(startEvnt).week();
          const dateInWeek = moment(startTime).week();
          if (((dateInWeek - eventInWeek) % data.repeat_tenure) === 0 && data.repeat_on[weekDay]) {
            return true;
          }
        }
        break;
      case 'custom_monthly':
        const customEventInMonth = moment(startEvnt).month();
        const customDateInMonth = data.month_date;
        if (((customDateInMonth - customEventInMonth) % data.repeat_tenure) === 0 && startEvnt < payload.end_time &&
          (!endEvnt || (endEvnt && endEvnt < payload.end_time))) {
          let taskNDate = moment().valueOf();
          switch (data.repeat_option) {
            case 'on_day':
              const eventDay = data.month_date;
              const eventMonth = moment(startTime).format('M');
              const eventYear = moment(startTime).format('YYYY');
              taskNDate = moment(eventMonth + '-' + eventDay + '-' + eventYear, 'MM-DD-YYYY').valueOf();
              break;
          }
          if (taskNDate && taskNDate >= startTime && taskNDate < endTime &&
            (!data.end_date || (data.end_date && data.end_date > startTime))) {
            return true;
          }
        }
        break;
      case 'custom_yearly':
        const customEventEMonth = data.month_date;
        const customEventYMonth = moment(startTime).format('M');
        const eventYYear = moment(startTime).format('Y');
        const yearNow = new Date().getFullYear();
        if (yearNow == (parseInt(eventYYear) + (data.repeat_tenure - 1))) {
          if (customEventYMonth == customEventEMonth) {
            const eventYDay = moment(startEvnt).format('D');
            let taskNDate = moment().valueOf();
            let taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
            let weekNDay = Object.keys(data.repeat_on)[0];
            let weekNNo = 1;
            switch (data.repeat_option) {
              case 'on_day':
                weekNNo = 1;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_second_day':
                weekNNo = 2;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_third_day':
                weekNNo = 3;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_forth_day':
                weekNNo = 4;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_fifth_day':
                weekNNo = 5;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_last_week':
                const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
                const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
                const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
                taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
                break;
            }
            if (!endEvnt || (endEvnt && payload.end_time >= taskNDate && payload.start_time <= taskNDate)) {
              return true;
            }
          }
        }
        break;
      case 'every_day':
      default:
        if (startEvnt <= startTime && (!data.end_date || (data.end_date && data.end_date > startTime))) {
          return true;
        }
        break;
    }
    return false;
  }
  checkEventSched(payload, data) {
    //   payload.start_time =moment(payload.start_time).tz(this.userLocalTimeZone,true).valueOf()
    //   payload.end_time = moment(payload.end_time).tz(this.userLocalTimeZone,true).valueOf()
    //   data.start_date = moment(data.start_date).tz(this.userLocalTimeZone,true).valueOf()
    //  if(data.end_date){
    //   data.end_date = moment(data.end_date).tz(this.userLocalTimeZone,true).valueOf()
    //  }

    const startTime = payload.start_time;
    const endTime = payload.end_time;

    const startEvnt = startOfDay(data.start_date).valueOf();
    const hourEvnt = parseInt(moment(data.start_date).format('HH'));
    const minuteEvnt = parseInt(moment(data.start_date).format('mm'));
    const endEvnt = addSeconds(addMinutes(addHours(startEvnt, hourEvnt), minuteEvnt), data.duration).valueOf();

    let currentTime = this.getCurrentDateFromTimezone();
    // const startTime = payload.start_time;
    // const endTime   = payload.end_time;

    // const startEvnt  =  moment.tz(data.start_date,this.timezone).startOf('day').valueOf();
    // const hourEvnt   = parseInt( moment.tz(data.start_date,this.timezone).format('HH') );
    // const minuteEvnt = parseInt( moment.tz(data.start_date,this.timezone).format('mm') );
    // const endEvnt    = moment.tz(startEvnt,this.timezone).add(hourEvnt,'hours').add(minuteEvnt,'minutes').add(data.duration,'seconds').valueOf();

    // let currentTime = moment.tz(this.timezone)

    const startH = moment(data.start_time).tz(this.timezone).format('HH');
    const startM = moment(data.start_time).tz(this.timezone).format('mm');
    const startDate: any = moment(this.getCurrentDateFromTimezone());


    startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 })["_d"];

    let endTimeData = moment.unix(startDate / 1000).add(data.duration, 'second').toDate();
    if (data.end_date == null) {
      data.end_date = moment(moment().tz(this.timezone).endOf("day").format("YYYY-MM-DDTHH:mm:ss"))["_d"]
    }
    let startDayEndDate = startOfDay(data.end_date).valueOf();
    let startDayCurrentDate = startOfDay(moment(currentTime).valueOf()).valueOf();
    if (payload.start_time == startDayCurrentDate && data.isPerformed == true) return false;
    switch (data.repeat) {
      case 'never':
        if (startEvnt === startTime && (!data.end_date || (data.end_date && endEvnt < endTime))) {
          if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
            if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) &&
              (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) ||
              ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) {
              return true;
            }
            if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
              if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
            }
          } else {
            return true;
          }
        }
        break;
      case 'every_week':
        if (startEvnt <= startTime && (!data.end_date || (data.end_date && data.end_date > startTime))) {
          const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
          const eventInWeek = moment(startEvnt).week();
          const dateInWeek = moment(startTime).week();
          if (((dateInWeek - eventInWeek) % data.repeat_tenure) === 0 && data.repeat_on[weekDay]) {
            /* Start: Check Past Schedule Time */
            if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
              if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
              if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
                if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
              }
            } else {
              return true;
            }
            /* End: Check Past Schedule Time */
          }
        }
        break;
      case 'every_month':
        const eventInMonth = moment(startEvnt).month();
        const dateInMonth = moment(startTime).month();
        if (((dateInMonth - eventInMonth) % data.repeat_tenure) === 0 && startEvnt < payload.end_time &&
          (!endEvnt || (endEvnt && endEvnt < payload.end_time))) {
          let taskNDate = moment().valueOf();
          switch (data.repeat_option) {
            case 'on_day':
              const eventDay = moment(startEvnt).format('D');
              const eventMonth = moment(startTime).format('M');
              const eventYear = moment(startTime).format('YYYY');
              taskNDate = moment(eventMonth + '-' + eventDay + '-' + eventYear, 'MM-DD-YYYY').valueOf();
              break;
            case 'on_week_number':
              const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const weekNNo = Math.ceil(moment(startEvnt).date() / 7);
              taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
              break;
            case 'on_last_week':
              const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
              const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
              taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
              break;
          }
          if (taskNDate && taskNDate >= startTime && taskNDate < endTime &&
            (!data.end_date || (data.end_date && data.end_date > startTime))) {

            /* Start: Check Past Schedule Time */
            if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
              if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) {
                return true;
              }
              if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
                if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) {
                  return true;
                }
              }
            } else {
              return true;
            }
            /* End: Check Past Schedule Time */
          }
        }
        break;
      case 'every_year':
        const eventEMonth = moment(startEvnt).format('M');
        const eventYMonth = moment(startTime).format('M');
        if (eventYMonth === eventEMonth) {
          const eventYDay = moment(startEvnt).format('D');
          const eventYYear = moment(startTime).format('Y');
          let taskNDate = moment().valueOf();
          switch (data.repeat_option) {
            case 'on_day':
              const dateSet = { 'year': parseInt(eventYYear), 'month': parseInt(eventYMonth) - 1, 'date': parseInt(eventYDay) };
              taskNDate = moment().set(dateSet).startOf('day').valueOf();
              break;
            case 'on_week_number':
              const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const weekNNo = Math.ceil(moment(startEvnt).date() / 7);
              taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
              break;
            case 'on_last_week':
              const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
              const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
              const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
              taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
              break;
          }
          if (!endEvnt || (endEvnt && payload.end_time >= taskNDate && payload.start_time <= taskNDate)) {
            /* Start: Check Past Schedule Time */
            if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
              if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
              if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
                if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
              }
            } else {
              return true;
            }
            /* End: Check Past Schedule Time */
          }
        }
        break;
      case 'custom_weekly':
        if (startEvnt <= startTime && (!data.end_date || (data.end_date && data.end_date > startTime))) {
          const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
          const eventInWeek = moment(startEvnt).week();
          const dateInWeek = moment(startTime).week();
          if (((dateInWeek - eventInWeek) % data.repeat_tenure) === 0 && data.repeat_on[weekDay]) {
            /* Start: Check Past Schedule Time */
            if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
              if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
              if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
                if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
              }
            } else {
              return true;
            }
            /* End: Check Past Schedule Time */
          }
        }
        break;
      case 'custom_monthly':
        const customEventInMonth = moment(startEvnt).month();
        const customDateInMonth = data.month_date;
        if (((customDateInMonth - customEventInMonth) % data.repeat_tenure) === 0 && startEvnt < payload.end_time && (!endEvnt || (endEvnt && endEvnt < payload.end_time))) {
          let taskNDate = moment().valueOf();
          switch (data.repeat_option) {
            case 'on_day':
              const eventDay = data.month_date;
              const eventMonth = moment(startTime).format('M');
              const eventYear = moment(startTime).format('YYYY');
              taskNDate = moment(eventMonth + '-' + eventDay + '-' + eventYear, 'MM-DD-YYYY').valueOf();
              break;
          }
          if (taskNDate && taskNDate >= startTime && taskNDate < endTime &&
            (!data.end_date || (data.end_date && data.end_date > startTime))) {
            return true;
          }
        }
        break;
      case 'custom_yearly':
        const customEventEMonth = data.month_date;
        const customEventYMonth = moment(startTime).format('M');
        const eventYYear = moment(startTime).format('Y');
        const yearNow = new Date().getFullYear();
        if (yearNow == (parseInt(eventYYear) + (data.repeat_tenure - 1))) {
          if (customEventYMonth == customEventEMonth) {
            const eventYDay = moment(startEvnt).format('D');
            let taskNDate = moment().valueOf();
            let taskEndDate = addSeconds(taskNDate, data.duration).valueOf();
            let weekNDay = Object.keys(data.repeat_on)[0];
            let weekNNo = 1;
            switch (data.repeat_option) {
              case 'on_day':
                weekNNo = 1;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_second_day':
                weekNNo = 2;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_third_day':
                weekNNo = 3;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_forth_day':
                weekNNo = 4;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_fifth_day':
                weekNNo = 5;
                taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay, weekNNo);
                break;
              case 'on_last_week':
                const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
                const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
                const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
                taskNDate = this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
                break;
            }
            if (!endEvnt || (endEvnt && payload.end_time >= taskNDate && payload.start_time <= taskNDate)) {
              /* Start: Check Past Schedule Time */
              if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
                if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
                if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
                  if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) return true;
                }
              } else {
                return true;
              }
              /* End: Check Past Schedule Time */
            }
          }
        }
        break;
      case 'every_day':
      default:

        if (startEvnt <= startTime && (!data.end_date || (data.end_date && data.end_date > startTime))) {
          //if( startTime === startDayEndDate || startTime === startDayCurrentDate ){
          if (this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != '') {
            if (((moment(this.shiftStartTime).unix() <= moment(startDate).unix()) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix())) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) {
              return true;
            }
            if (moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix()) {
              if ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix()) || (moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix())) {
                return true;
              }
            }
          } else {
            return true;
          }
        }

        break;
    }
    return false;
  }
  // checkEventSched(payload, data) {

  //   const startTime = payload.start_time;
  //   const endTime   = payload.end_time;

  //   const startEvnt  = startOfDay(data.start_date).valueOf();
  //   const hourEvnt   = parseInt( moment(data.start_date).format('HH') );
  //   const minuteEvnt = parseInt( moment(data.start_date).format('mm') );
  //   const endEvnt    = addSeconds( addMinutes( addHours(startEvnt, hourEvnt), minuteEvnt), data.duration).valueOf();

  //   let currentTime = new Date()

  //   const startH = moment(data.start_time).format('HH');
  //   const startM = moment(data.start_time).format('mm');
  //   const startDate:any = moment(new Date());
  //   startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

  //   let endTimeData  = moment.unix(startDate/1000).add(data.duration, 'second').toDate();

  //   let startDayEndDate     = startOfDay(data.end_date).valueOf();
  //   let startDayCurrentDate = startOfDay(moment(currentTime).valueOf()).valueOf();
  //   if(  payload.start_time == startDayCurrentDate ){
  //     if(data.isPerformed && data.isPerformed == true){
  //       return false;
  //     }
  //   }  
  //   switch (data.repeat) {
  //     case 'never':       
  //       if (startEvnt === startTime && (!data.end_date || (data.end_date && endEvnt < endTime)) ) {
  //         if(this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != ''){
  //           if( ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() ) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix() ) ) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix()) ){
  //             return true;
  //           }
  //            if(moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix() ){
  //             if( ( moment(this.shiftStartTime).unix() <= moment(startDate).unix()  || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) || ( moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix() ) ){
  //               return true;
  //             }
  //           }
  //         }else{
  //           return true;
  //         }          
  //       }
  //       break;
  //     case 'every_week':
  //       if (startEvnt <= startTime && (!data.end_date ||  (data.end_date && data.end_date > startTime))) {
  //         const weekDay = moment(startTime).format('dddd').toLocaleLowerCase();
  //         const eventInWeek = moment(startEvnt).week();
  //         const dateInWeek = moment(startTime).week();
  //         if ( (( dateInWeek - eventInWeek) % data.repeat_tenure ) === 0 && data.repeat_on[weekDay] ) {
  //             /* Start: Check Past Schedule Time */
  //          if(this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != ''){
  //             if( ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() ) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix() ) ) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix()) ){
  //               return true;
  //             }
  //             if(moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix() ){
  //               if( ( moment(this.shiftStartTime).unix() <= moment(startDate).unix()  || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) || ( moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix() ) ){
  //                 return true;
  //               }
  //             }
  //           }else{
  //             return true;
  //           }
  //             /* End: Check Past Schedule Time */            
  //         }
  //       }
  //       break;
  //     case 'every_month':
  //       const eventInMonth = moment(startEvnt).month();
  //       const dateInMonth = moment(startTime).month();
  //       if ( (( dateInMonth - eventInMonth) % data.repeat_tenure ) === 0 && startEvnt < payload.end_time &&
  //           ( !endEvnt || (endEvnt && endEvnt < payload.end_time)) ) {
  //         let taskNDate =  moment().valueOf();
  //         switch (data.repeat_option) {
  //           case 'on_day':
  //             const eventDay = moment(startEvnt).format('D');
  //             const eventMonth = moment(startTime).format('M');
  //             const eventYear = moment(startTime).format('YYYY');
  //             taskNDate = moment( eventMonth + '-' + eventDay + '-' + eventYear , 'MM-DD-YYYY').valueOf();
  //             break;
  //           case 'on_week_number':
  //             const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //             const weekNNo = Math.ceil(moment(startEvnt).date() / 7 );
  //             taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay , weekNNo);
  //             break;
  //           case 'on_last_week':
  //             const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //             const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
  //             const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
  //             taskNDate =  this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
  //             break;
  //         }
  //         if (taskNDate && taskNDate >= startTime && taskNDate < endTime &&
  //            (!data.end_date ||  (data.end_date && data.end_date > startTime))) {

  //           /* Start: Check Past Schedule Time */
  //         if(this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != ''){
  //           if( ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() ) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix() ) ) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix()) ){
  //             return true;
  //           }
  //            if(moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix() ){
  //             if( ( moment(this.shiftStartTime).unix() <= moment(startDate).unix()  || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) || ( moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix() ) ){
  //               return true;
  //             }
  //           }
  //         }else{
  //           return true;
  //         }
  //             /* End: Check Past Schedule Time */  
  //         }
  //       }
  //       break;
  //     case 'every_year':
  //       const eventEMonth = moment(startEvnt).format('M');
  //       const eventYMonth = moment(startTime).format('M');
  //       if ( eventYMonth === eventEMonth ) {
  //         const eventYDay = moment(startEvnt).format('D');
  //         const eventYYear = moment(startTime).format('Y');
  //         let taskNDate =  moment().valueOf();
  //         switch (data.repeat_option) {
  //           case 'on_day':
  //             const dateSet = {'year': parseInt(eventYYear), 'month': parseInt(eventYMonth) - 1 , 'date': parseInt(eventYDay) };
  //             taskNDate = moment().set( dateSet ).startOf('day').valueOf();
  //             break;
  //           case 'on_week_number':
  //             const weekNDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //             const weekNNo = Math.ceil(moment(startEvnt).date() / 7 );
  //             taskNDate = this.onSpecificweekOFMonthly(startTime, weekNDay , weekNNo);
  //             break;
  //           case 'on_last_week':
  //             const weekWDay = moment(startEvnt).format('dddd').toLocaleLowerCase();
  //             const lastDayMonth = moment(startTime).endOf('month').startOf('day').valueOf();
  //             const startWeeklastMonth = moment(startTime).endOf('month').startOf('day').subtract(6, 'day').valueOf();
  //             taskNDate =  this.getLastOFMonthly(startWeeklastMonth, lastDayMonth, weekWDay);
  //             break;
  //         }
  //         if ( !endEvnt || (endEvnt && payload.end_time >= taskNDate && payload.start_time <= taskNDate)) {
  //           /* Start: Check Past Schedule Time */
  //           if(this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != ''){
  //             if( ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() ) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix() ) ) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix()) ){
  //               return true;
  //             }
  //              if(moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix() ){
  //               if( ( moment(this.shiftStartTime).unix() <= moment(startDate).unix()  || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) || ( moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix() ) ){
  //                 return true;
  //               }
  //             }
  //           }else{
  //             return true;
  //           }
  //             /* End: Check Past Schedule Time */ 
  //         }
  //       }
  //       break;
  //     case 'every_day':
  //     default:

  //       if (startEvnt <= startTime && (!data.end_date ||  (data.end_date && data.end_date > startTime)) ) {

  //         //if( startTime === startDayEndDate || startTime === startDayCurrentDate ){
  //           if(this.shiftStartTime && this.shiftStartTime != '' && this.shiftEndTime != ''){

  //               if( ((moment(this.shiftStartTime).unix() <= moment(startDate).unix() ) && (moment(this.shiftEndTime).unix() >= moment(startDate).unix() ) ) || ((moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) && moment(this.shiftEndTime).unix() >= moment(endTimeData).unix()) ){
  //                 return true;
  //               }
  //                if(moment(this.shiftStartTime).unix() >= moment(this.shiftEndTime).unix() ){
  //                 if( ( moment(this.shiftStartTime).unix() <= moment(startDate).unix()  || moment(this.shiftStartTime).unix() <= moment(endTimeData).unix() ) || ( moment(this.shiftEndTime).unix() >= moment(startDate).unix() || moment(this.shiftEndTime).unix() >= moment(endTimeData).unix() ) ){
  //                   return true;
  //                 }
  //               }
  //             }else{
  //               return true;
  //             }
  //       }

  //       break;
  //   }
  //   return false;
  // }

  getMonthlyWeekday(n, d: string, m: string, y: number) {
    let targetDay, curDay = 0, i = 1, seekDay;
    if (d === 'Sunday') { seekDay = 0; }
    if (d === 'monday') { seekDay = 1; }
    if (d === 'Tuesday') { seekDay = 2; }
    if (d === 'Wednesday') { seekDay = 3; }
    if (d === 'Thursday') { seekDay = 4; }
    if (d === 'Friday') { seekDay = 5; }
    if (d === 'Saturday') { seekDay = 6; }
    while (curDay < n && i < 31) {
      targetDay = new Date(i++ + ' ' + m + ' ' + y);
      if (targetDay.getDay() === seekDay) curDay++;
    }
    if (curDay === n) {
      targetDay = targetDay.getDate();
      return targetDay;
    } else {
      return false;
    }
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
      .catch((error) => this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.'));
  }

  drop(event: CdkDragDrop<string[]>) {
    console.log("data after drop the list >>>>",event)
    if ((event.previousContainer.id === 'unassignedSection' && event.container.id.includes('assignToSection'))) {
      console.log("called>>>>>>>")
      const dialogConfig = new MatDialogConfig();
      dialogConfig.maxWidth = '450px';
      dialogConfig.panelClass = 'unassin_modal';
      // dialogConfig.disableClose = true;
      this.dialogRefs = this._dialog.open(this.confirmDialog, dialogConfig);
      this.transferCare = event.item.data;
      this.assignedTo = this.assignedCare.user_id;
    }
    if ((event.previousContainer.id === 'ruleSection' && event.container.id.includes('performer-')) ||
      (event.previousContainer.id.includes('rule-') && event.container.id.includes('performer-')) ||
      (event.previousContainer.id === 'unassignedSection' && event.container.id.includes('performer-'))
    ) {
      console.log("called>>>>>>>1")
      this.unassignedData.filter((item,index) => {
        if(item._id === event.item.data.care._id) {
          this.unassignedData.splice(index,1);
        }
      })
      this.unassignedData.filter((item)=> {
        const value = moment.unix(item.start_time/1000);
          let h = moment(value).tz(this.timezone).format("HH");
          let m = moment(value).tz(this.timezone).format("mm");
          item['sortValue'] = Number(h) * 60 + Number(m);
      })
      this.unassignedData.sort((a , b) => a.sortValue - b.sortValue);
        this.assignedData.filter((item,index)=> {
          if(event.container.id.includes(item._id.assigned_to)) {
            item.scheduleCares.unshift(event.item.data.care)
          }
        })
        this.assignedData.filter((item)=> {
          item.scheduleCares.filter((data)=> {
            const value = moment.unix(data.start_time/1000);
            let h = moment(value).tz(this.timezone).format("HH");
            let m = moment(value).tz(this.timezone).format("mm");
            data['sortValue'] = Number(h) * 60 + Number(m);
          })
          item.scheduleCares.sort((a , b) => a.sortValue - b.sortValue);
        })
        console.log('this.assignedData>>>>',this.assignedData)
        if(event.item.data.care.repeat === 'never') {
          this.transferCare = event.item.data;
          this.assignedTo = event.container.id.split('-').pop();
          this.thisCare();
        } else {
          const dialogConfig = new MatDialogConfig();
          dialogConfig.width = '450px';
          dialogConfig.height = '300px';
          dialogConfig.panelClass = 'unassin_modal_reschedule';
          // dialogConfig.disableClose = true;
          this.dialogRefs = this._dialog.open(this.confirmDialog, dialogConfig);
          this.transferCare = event.item.data;
          this.assignedTo = event.container.id.split('-').pop();
        }
    }

    if ((event.container.id === 'unassignedSection' && event.previousContainer.id.includes('performer-')) ||
      (event.previousContainer.id === 'ruleSection' && event.previousContainer.id.includes('performer-')) ||
      (event.previousContainer.id.includes('rule-') && event.previousContainer.id.includes('performer-'))) {
      // Open for only assign dated cares
      if (event.item.data.care.schedule_id && event.item.data.care.schedule_id !== '') {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = '450px';
        dialogConfig.panelClass = 'DeleteAlert';
        // dialogConfig.disableClose = true;
        // this.unassignedDataTemp = this.unassignedData;
        // console.log('this.unassignedDataTemp>>>>>>',this.unassignedDataTemp)
        // this.unassignedData.filter((item,index) => {
        //   if(item === event.item.data.care) {
        //     this.unassignedData.splice(index,0)
        //   }
        // })
        this.unassignedData.unshift(event.item.data.care);
        this.unassignedData.filter((item)=> {
          const value = moment.unix(item.start_time/1000);
            let h = moment(value).tz(this.timezone).format("HH");
            let m = moment(value).tz(this.timezone).format("mm");
            item['sortValue'] = Number(h) * 60 + Number(m);
        })
        this.unassignedData.sort((a , b) => a.sortValue - b.sortValue);
        
        this.assignedData.filter((item,index)=> {
          
          item.scheduleCares.filter((data,dataIndex)=> {
            if(data._id == event.item.data.care._id) {
              console.log(data._id)
              item.scheduleCares.splice(dataIndex, 1)
            }
          })
        })
        this.assignedData.filter((item)=> {
          item.scheduleCares.filter((data)=> {
            const value = moment.unix(data.start_time/1000);
            let h = moment(value).tz(this.timezone).format("HH");
            let m = moment(value).tz(this.timezone).format("mm");
            data['sortValue'] = Number(h) * 60 + Number(m);
          })
          item.scheduleCares.sort((a , b) => a.sortValue - b.sortValue);
        })
        console.log('this.assignedData>>>>',this.assignedData)
        // this.unassignedData.join()
        // this.unassignedData.push(event.item.data.care);
        this.dialogRefs = this._dialog.open(this.unassignDialog, dialogConfig);
        this.transferCare = event.item.data;
      } else {
        // if (event.item.data.care.schedule_id) {
        //   this.assignedFromTo = event.item.data.care._id;
        // }
        console.log("called>>>>>>>3")
        this.assignedTo = 'unassignedSection';
        this.transferCare = event.item.data;
        const dialogConfig = new MatDialogConfig();
        dialogConfig.width = '450px';
        dialogConfig.height = '300px';
        dialogConfig.panelClass = 'unassin_modal';
        // dialogConfig.disableClose = true;
        this.dialogRefs = this._dialog.open(this.confirmDialog, dialogConfig);
      }
    }

    if ((event.previousContainer.id === 'unassignedSection' && event.container.id === 'assignToSection') ||
      (event.previousContainer.id === 'ruleSection' && event.container.id === 'assignToSection') ||
      (event.previousContainer.id.includes('rule-') && event.container.id === 'assignToSection')) {
      console.log("called>>>>>>>3")

      if (event.item.data.care) {
        this.assignedCare.scheduleCares = [...this.assignedCare.scheduleCares, ...event.item.data.care];
        this.assignedCare.scheduleCareIDs.push(event.item.data.care._id);
      }
      if (event.item.data.rule) {
        this.assignedCare.scheduleCares = [...this.assignedCare.scheduleCares, ...event.item.data.rule.scheduleCares];
        event.item.data.rule.scheduleCares.map(item => this.assignedCare.scheduleCareIDs.push(item._id));
      }
      const thisObj = this;
      if (this.rulesData.length) {
        this.rulesData.map(el => {
          el.scheduleCares = el.scheduleCares.filter(elInner => {
            if (thisObj.assignedCare.scheduleCareIDs.indexOf(elInner._id) > -1) { elInner.rule_id = el._id; }
            return thisObj.assignedCare.scheduleCareIDs.indexOf(elInner._id) === -1;
          });
          return el;
        });
      }
      if (this.unassignedData.length) {
        this.unassignedData = this.unassignedData.filter(el => thisObj.assignedCare.scheduleCareIDs.indexOf(el._id) === -1);
      }
    }

    if ((event.container.id === 'unassignedSection' && event.previousContainer.id === 'assignToSection')) {
      console.log("called>>>>>>>4")

      if (event.item.data.care.rule_id) {
        this.rulesData.map(el => {
          if (el._id === event.item.data.care.rule_id) { el.scheduleCares.push(event.item.data.care) }
          return el;
        });
      } else {
        this.unassignedData.push(event.item.data.care);
      }
      this.assignedCare.scheduleCares = this.assignedCare.scheduleCares.filter(assignSched => assignSched._id !== event.item.data.care._id);
      // tslint:disable-next-line:max-line-length
      this.assignedCare.scheduleCareIDs = this.assignedCare.scheduleCareIDs.filter(assignSchedId => assignSchedId !== event.item.data.care._id);
      this.scheduleForOccurance = this.scheduleForOccurance.filter(assignSchedId => assignSchedId !== event.item.data.care._id);
      this.scheduleForSeries = this.scheduleForSeries.filter(assignSchedId => assignSchedId !== event.item.data.care._id);
    }

    if ((event.previousContainer.id.includes('performer-') && event.container.id.includes('performer-'))) {
      // If Drop in same Performer then abort event
      // tslint:disable-next-line:triple-equals
      console.log("called>>>>>>>5")
      if (event.item.data.care.assigned_to == event.container.id.split('-').pop()) { return; }

      if (event.item.data.care.schedule_id) {
        this.assignedFromTo = event.item.data.care._id;
      }

      this.assignedData.filter((item,index)=> {
        if(event.container.id.includes(item._id.assigned_to)) {
          console.log("calledd ?>>>>>>into splice")
          item.scheduleCares.unshift(event.item.data.care)
        }
      })
      this.assignedData.filter((item)=> {
        item.scheduleCares.filter((data)=> {
          const value = moment.unix(data.start_time/1000);
          let h = moment(value).tz(this.timezone).format("HH");
          let m = moment(value).tz(this.timezone).format("mm");
          data['sortValue'] = Number(h) * 60 + Number(m);
        })
        item.scheduleCares.sort((a , b) => a.sortValue - b.sortValue);
      })
      this.assignedData.filter((item,index)=> {
        if(event.previousContainer.id.includes(item._id.assigned_to)) {
          item.scheduleCares.filter((data,dataIndex)=> {
            if(data._id == event.item.data.care._id) {
              console.log(data._id)
              item.scheduleCares.splice(dataIndex, 1)
            }
          })
        }
      })
      this.assignedTo = event.container.id.split('-').pop();
      this.assignedFrom = event.previousContainer.id.split('-').pop();
      this.transferCare = event.item.data;
      if(event.item.data.care.repeat === 'never') {
        this.thisCare();
      } else {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = '450px';
        dialogConfig.panelClass = 'unassin_modal';
        // dialogConfig.disableClose = true;
        this.dialogRefs = this._dialog.open(this.confirmDialog, dialogConfig);
      }
    }
  }

  onNoClick(): void {
    this.dialogRefs.close(['result']['status'] = false);
    this.deleteCare = null;
    this.deleteCareType = null;
    this.editCareType = null;
    this.assignedFromTo = null;
    this.assignedTo = null;
    if (this.transferCare) {
      let lastAssignedCare = this.transferCare.care;
      let trasferCareIdIndex = this.assignedCare.scheduleCareIDs.indexOf(this.transferCare.care._id);
      if (trasferCareIdIndex > -1) {
        this.assignedCare.scheduleCareIDs.splice(trasferCareIdIndex, 1)
      }
      let trasferCareIndex = this.assignedCare.scheduleCares.indexOf(this.transferCare.care);
      if (trasferCareIndex > -1) {
        this.assignedCare.scheduleCares.splice(trasferCareIndex, 1)

      }
      this.unassignedData.push(lastAssignedCare);
    }
    console.log('this.unassignedDataTemp>>>>>>',this.unassignedDataTemp)
    if(this.unassignedDataTemp.length>0) {
      let temp = JSON.parse(JSON.stringify(this.unassignedDataTemp))
      this.unassignedData = [];
      this.unassignedData = temp;
      let temp1 = JSON.parse(JSON.stringify(this.assignedDataTemp))
      this.assignedData = [];
      this.assignedData = temp1;
      console.log('this.unassignedDataTemp>>>>>>',this.assignedData)
    }
  }

  async unassignCares() {
    let scheduleIds = null;
    let scheduleAssign = null;
    if (this.transferCare && this.transferCare.care && this.transferCare.care.schedule_id) {
      scheduleIds = this.transferCare.care.schedule_id;
      scheduleAssign = this.transferCare.care._id;
    } else if (this.transferCare && this.transferCare.care) {
      scheduleIds = this.transferCare.care._id;
    }
    const dateSend = moment(this.scheduleDate).tz(this.timezone, true).valueOf()
    if (scheduleIds.length) {
      this._commonService.setLoader(true);
      const payload = {
        fac_id: this.facility,
        schedule_id: [scheduleIds],
        assigned_to: null, // this.transferCare.care.assigned_to,
        assigned_from: this.transferCare.care.assigned_to,
        dated: moment(dateSend).format("MM/DD/YYYY"),
        unassign_one_day: true,
      };
      this.transferCare = null;
      const action = {
        type: 'POST',
        // target: 'schedule/unassign_schedule'
        target: 'schedule/schedule_assignment'
      };
      const result = await this._apiService.apiFn(action, payload);
      this._commonService.setLoader(false);
      if (result['status']) {
        // this.getAllEvents();
      } else {
        this._toastr.error(result['message']);
      }

    }
    this.dialogRefs.close();
  }

  async postCare() {

  }



  async thisCare() {
    this._commonService.setLoader(true);
    let scheduleIds = [];
    if (this.transferCare && this.transferCare.rule && this.transferCare.rule.scheduleCares) {
      this.transferCare.rule.scheduleCares.map(itm => scheduleIds.push(itm._id));
    }
    if (this.transferCare && this.transferCare.care) {
      if (this.transferCare.care.schedule_id) {
        scheduleIds = [this.transferCare.care.schedule_id];
        this.scheduleForOccurance.push(this.transferCare.care.schedule_id);
      } else {
        scheduleIds = [this.transferCare.care._id];
        this.scheduleForOccurance.push(this.transferCare.care._id);
      }
    }
    this.transferCare = null;
    // if(!this.assignedTo){
    //   this._toastr.error("Select performer first.");
    //   this._commonService.setLoader(false);
    //   return;
    // }    

    if (scheduleIds.length) {

      // if (this.assignedTo !== "unassignedSection") {
      //   delete payload.unassign_one_day;
      // }
      // else if (this.assignedTo === "unassignedSection") {
      if (this.assignedTo === "unassignedSection") {
        const dateSend = moment(this.scheduleDate).tz(this.timezone, true).valueOf()
        this._commonService.setLoader(true);
        const payload = {
          fac_id: this.facility,
          schedule_id: scheduleIds,
          assigned_to: this.assignedTo,
          assigned_from: this.assignedFrom,
          dated: moment(dateSend).format("MM/DD/YYYY"),
        };
        delete payload.assigned_to;
         console.log("Scheduling ====>>>> ",payload)

        const action = {
          type: 'POST',
          target: 'schedule/schedule_assignment'
        };
        const result = await this._apiService.apiFn(action, payload);
        if (result['status']) {
           console.log("response result ===>>>>  ",result);
          this.assignedTo = null;
          this.assignedFromTo = null;
          this._toastr.success(result['message']);
          this.cancelCares();
          // this.getAllEvents();
          this._commonService.setLoader(false);
        } else {
          console.log("error =====>>> ",result)
          this._toastr.error(result['message']);
          this._commonService.setLoader(false);
        }
      }
      else if (this.assignedTo != null && this.assignedTo != "") {
        //direct update on direct assign

        if (scheduleIds && scheduleIds.length > 0) {
          const dateSend =  moment(this.scheduleDate).tz(this.timezone, true).valueOf()
          const payload = {
            fac_id: this.facility,
            schedule_id: scheduleIds,
            assigned_to: this.assignedTo,
            dated: moment(dateSend).format("MM/DD/YYYY"),
            unassign_one_day: true
          };
          if (this.assignedTo !== "unassignedSection") {
            delete payload.unassign_one_day;
          } else if (this.assignedTo === "unassignedSection") {
            delete payload.assigned_to;
          }
          localStorage.setItem('assigned_to', JSON.stringify(this.assignedTo));
           console.log("Payload Assign  ====>>> ",payload)
          const action = {
            type: 'POST',
            target: 'schedule/schedule_assignment'
          };
          this._apiService.apiFn(action, payload).then(res => {
             console.log("Response  ===>>> before response ===>>> ",res)
            if (res['status']) {
              console.log("response ===>>> ",res)
             this.assignedTo = null;
             this.assignedFromTo = null;
             let occuranceIndex = this.scheduleForOccurance.findIndex(x => x == scheduleIds[0]);
             this.scheduleForOccurance.splice(occuranceIndex, 1);
             this._toastr.success(res['message']);
             this.cancelCares();
            //  this.getAllEvents();
            this._commonService.setLoader(false);
            } 
          }).catch((error) => {
            console.log("Error ===>>> ",error)
            this._commonService.setLoader(false);
          })
          
        }
      }
      // }
      this.dialogRefs.close();
    }
  }
  // async thisCare() {
  //   let scheduleIds = [];
  //   if (this.transferCare && this.transferCare.rule && this.transferCare.rule.scheduleCares) {
  //     this.transferCare.rule.scheduleCares.map(itm => scheduleIds.push(itm._id));
  //   }
  //   if (this.transferCare && this.transferCare.care) {
  //     if (this.transferCare.care.schedule_id) {
  //       scheduleIds = [this.transferCare.care.schedule_id];
  //       this.scheduleForOccurance.push(this.transferCare.care.schedule_id);
  //     } else {
  //       scheduleIds = [this.transferCare.care._id];
  //       this.scheduleForOccurance.push(this.transferCare.care._id);
  //     }
  //   }
  //   this.transferCare = null;
  //   // if(!this.assignedTo){
  //   //   this._toastr.error("Select performer first.");
  //   //   this._commonService.setLoader(false);
  //   //   return;
  //   // }    

  //   if (scheduleIds.length) {

  //     // if (this.assignedTo !== "unassignedSection") {
  //     //   delete payload.unassign_one_day;
  //     // }
  //     // else if (this.assignedTo === "unassignedSection") {
  //     if (this.assignedTo === "unassignedSection") {
  //       this._commonService.setLoader(true);
  //       const payload = {
  //         org_id: this.organization,
  //         fac_id: this.facility,
  //         schedule_id: scheduleIds,
  //         assigned_to: this.assignedTo,
  //         assigned_from: this.assignedFrom,
  //         assign:true,
  //         isSeriesAssign:false,
  //         unassign:false,
  //         isSeriesUnassign:false,
  //         dated: moment(this.scheduleDate).tz(this.timezone, true).valueOf(),
  //         unassign_one_day: true
  //       };
  //       delete payload.assigned_to;
  //        console.log("Scheduling ====>>>> ",payload)

  //       const action = {
  //         type: 'POST',
  //         target: 'schedule/schedule_assignment'
  //       };
  //       const result = await this._apiService.apiFn(action, payload);
  //       if (result['status']) {
  //         this.assignedTo = null;
  //         this.assignedFromTo = null;
  //         this._toastr.success(result['message']);
  //         this.cancelCares();
  //         this.getAllEvents();

  //       } else {
  //         this._toastr.error(result['message']);
  //         this._commonService.setLoader(false);
  //       }
  //     }
  //     else if (this.assignedTo != null && this.assignedTo != "") {
  //       //direct update on direct assign

  //       if (scheduleIds && scheduleIds.length > 0) {
  //         const payload = {
  //           org_id: this.organization,
  //           fac_id: this.facility,
  //           schedule_id: scheduleIds,
  //           assigned_to: this.assignedTo,
  //           assigned_from: null,

  //           on_date: moment(this.scheduleDate).tz(this.timezone, true).valueOf(),
  //           unassign_one_day: true
  //         };
  //         if (this.assignedTo !== "unassignedSection") {
  //           delete payload.unassign_one_day;
  //         } else if (this.assignedTo === "unassignedSection") {
  //           delete payload.assigned_to;
  //         }

  //         const action = {
  //           type: 'POST',
  //           target: 'schedule/update_assignment'
  //         };
  //         const result = await this._apiService.apiFn(action, payload);
  //         if (result['status']) {
  //           this.assignedTo = null;
  //           this.assignedFromTo = null;
  //           let occuranceIndex = this.scheduleForOccurance.findIndex(x => x == scheduleIds[0]);
  //           this.scheduleForOccurance.splice(occuranceIndex, 1);
  //           this._toastr.success(result['message']);
  //           this.cancelCares();
  //           this.fetchEvents();

  //         } else {
  //           this._toastr.error(result['message']);
  //           this._commonService.setLoader(false);
  //         }
  //       }
  //     }
  //     // }
  //     this.dialogRefs.close();
  //   }
  // }

  async allCares() {
    // if(!this.assignedTo){
    //   this._toastr.error("Select performer first.");
    //   return;
    // }
    this._commonService.setLoader(true);
    let scheduleIds = [];
    let scheduleId = this.transferCare.care._id;
    if (this.transferCare && this.transferCare.rule && this.transferCare.rule.scheduleCares) {
      this.transferCare.rule.scheduleCares.map(itm => scheduleIds.push(itm._id));
    }
    if (this.transferCare && this.transferCare.care) {
      if (this.transferCare.care.schedule_id) {
        scheduleIds = [this.transferCare.care.schedule_id];
        this.scheduleForSeries.push(this.transferCare.care.schedule_id)
      } else {
        scheduleIds = [this.transferCare.care._id];
        this.scheduleForSeries.push(this.transferCare.care._id);

      }
    }
    this.transferCare = null;

    // if ( scheduleIds.length  ) {
    //   this._commonService.setLoader(true);
    if (this.assignedTo === "unassignedSection") {
      await this._apiService.apiFn(
        { type: 'POST', target: 'schedule/schedule_assignment' },
        {
          //org_id: this.organization,
          //fac_id: this.facility,
          schedule_id: scheduleId,
        }
      )
        .then((result: any) => {
          if (result['status']) {
            this.assignedTo = null;
            this.assignedFromTo = null;
            scheduleId = null;
            this._toastr.success(result['message']);
            // this.getAllEvents();
          } else {
            this._toastr.error(result['message']);
            this._commonService.setLoader(false);
          }
        })
        .catch((error) => this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.'));
    }
    else if (this.assignedTo != null && this.assignedTo != "") {
      //direct update on direct assign

      if (scheduleIds && scheduleIds.length > 0) {
        const dateSend =  moment(this.scheduleDate).tz(this.timezone, true).valueOf();
        let payout =   {
          fac_id: this.facility,
          schedule_id: scheduleIds,
          assigned_to: this.assignedTo,
          isSeriesAssign:true,
          dated: moment(dateSend).format("MM/DD/YYYY"),
        }
        localStorage.setItem('assigned_to', JSON.stringify(this.assignedTo));
        console.log("payload schedule>>>>>",payout)
        await this._apiService.apiFn(
          { type: 'POST', target: 'schedule/schedule_assignment' },
          payout
        )
          .then((result: any) => {
            if (result['status']) {
              if (!(scheduleIds.length > 0)) {


                this.assignedCare = {
                  user_id: null,
                  scheduleCareIDs: [],
                  scheduleCares: []
                };
                // this.assigne = false;
                this._toastr.success(result['message']);
                // this.getAllEvents();
              }
              let seriesIndex = this.scheduleForSeries.findIndex(x => x == scheduleIds[0]);
              this.scheduleForSeries.splice(seriesIndex, 1);

            } else {
              this._toastr.error(result['message']);
              this._commonService.setLoader(false);
            }
          })
          .catch((error => this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')));

      }
      this._commonService.setLoader(false);
    }
    //else{
    //     await this._apiService.apiFn(
    //       { type: 'POST', target: 'schedule/update_assignment' }, 
    //       {
    //         org_id: this.organization,
    //         fac_id: this.facility,
    //         schedule_id: scheduleIds,
    //         assigned_to: this.assignedTo,
    //         //assigned_from_to: this.assignedFromTo
    //       }
    //     )
    //     .then(async (result: any) => {
    //       if(result['status']) {
    //         if(this.assignedFromTo && this.assignedFromTo != null){
    //           await this._apiService.apiFn(
    //             { type: 'POST',  target: 'schedule/unassign_schedule' }, 
    //             { schedule_id: scheduleId, assigned_id: this.assignedFromTo }
    //           );              
    //         }
    //         this.assignedTo = null;
    //         this.assignedFromTo = null;
    //         this.cancelCares();
    //         this._toastr.success(result['message']);
    //         this.fetchEvents();
    //       } else {
    //         this._toastr.error(result['message']);
    //         this._commonService.setLoader(false);
    //       }  
    //     })
    //     .catch((error) => this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.'));
    //   }
    // }
    this.dialogRefs.close();
  }

  async cancelCares() {
    const scheduleCares = this.assignedCare.scheduleCares;
    this.assignedCare = {
      user_id: null,
      scheduleCareIDs: [],
      scheduleCares: []
    };
    this.scheduleForSeries = [];
    this.scheduleForOccurance = [];
    scheduleCares.map(el => {
      if (el.rule_id) {
        this.rulesData.map(elInner => {
          if (elInner._id === el.rule_id) elInner.scheduleCares.push(el);
          return el;
        });
      } else {
        this.unassignedData.push(el);
      }
    });
    // this.assigne = false;
  }

  async assignCares() {
    if (!this.assignedCare.scheduleCareIDs.length) {
      this._toastr.error("Drag and drop schedule for assign.");
      return;
    }
    if (!this.assignedCare.user_id) {
      this._toastr.error("Select performer for care.");
      return;
    }
    if (this.assignedCare.scheduleCareIDs.length && this.assignedCare.user_id) {
      this._commonService.setLoader(true);
      // assign for searies
      // check for  searies and occurance schduled ids 
      let sereiesSchduleIds = [];
      let occuranceSchduleIds = [];
      this.assignedCare.scheduleCareIDs.forEach(x => {
        if (this.scheduleForSeries.indexOf(x) > -1) {
          sereiesSchduleIds.push(x);
        }
        else if (this.scheduleForOccurance.indexOf(x) > -1) {
          occuranceSchduleIds.push(x);
        }
      });

      if (sereiesSchduleIds.length > 0) {
        const dateSend = moment(this.scheduleDate).tz(this.timezone, true).valueOf();
        let payout  =  {
          fac_id: this.facility,
          schedule_id: sereiesSchduleIds,
          assigned_to: this.assignedCare.user_id,
          assigned_from: this.assignedCare.user_id,
          dated: moment(dateSend).format("MM/DD/YYYY"),
        };
         console.log("payload on click done ====>>>> ",payout)
        await this._apiService.apiFn(
          { type: 'POST', target: 'schedule/schedule_assignment' },
          payout
        )
          .then((result: any) => {
             console.log("Result ===>>> ",result);
            if (result['status']) {
              if (!(occuranceSchduleIds.length > 0)) {


                this.assignedCare = {
                  user_id: null,
                  scheduleCareIDs: [],
                  scheduleCares: []
                };
                // this.assigne = false;
                this._toastr.success(result['message']);
                // this.getAllEvents();
              }
              this._commonService.setLoader(false);
            } else {
              // this.assigne = false;
              this._toastr.error(result['message']);
              this._commonService.setLoader(false);
            }
          })
          .catch((error => {
            console.log("Error ===>>> ",error)
            this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')
            }
            ));

      }


      if (occuranceSchduleIds.length > 0) {
        const dateSend = moment(this.scheduleDate).tz(this.timezone, true).valueOf()
        const payload = {
          org_id: this.organization,
          fac_id: this.facility,
          schedule_id: occuranceSchduleIds,
          assigned_to: this.assignedCare.user_id,
          assigned_from: this.assignedCare.user_id,

          dated: moment(dateSend).format("MM/DD/YYYY"),
          unassign_one_day: true
        };
        if (this.assignedTo !== "unassignedSection") {
          delete payload.unassign_one_day;
        } else if (this.assignedTo === "unassignedSection") {
          delete payload.assigned_to;
        }
        console.log("payload schedule_assignment >>>>", payload);
        const action = {
          type: 'POST',
          target: 'schedule/schedule_assignment'
        };
        const result = await this._apiService.apiFn(action, payload);
        if (result['status']) {
          this.assignedTo = null;
          this.assignedFromTo = null;
          this._toastr.success(result['message']);
          this.cancelCares();
          // this.getAllEvents();
        } else {
          this._toastr.error(result['message']);
          this._commonService.setLoader(false);
        }
      }


    }
  }

  weekDayText(e) {
    const checkData = [];
    for (const [key, value] of Object.entries(this.editSchedule.repeat_on)) {
      if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
    }
    return (checkData).toString().replace(/,/g, ', ');
  }

  async editCares(scheduleId, assignItem?, isDated?) {
    this._commonService.setLoader(true);
    if (isDated && isDated !== undefined) {
      this.editCareType = isDated;
    }
    this.assignedCare.user_id = null;
    if (assignItem) {
      this.assignedCare.user_id = assignItem._id.assigned_to;
    }
    await this._apiService.apiFn(
      { type: 'POST', target: 'schedule/get_schedule_by_id' },
      { schedule_id: scheduleId }
    )
      .then((result: any) => {
        if (result['status'] && result['data']) {
          let scheduleCareEdit = result['data'];
          scheduleCareEdit.start_time = Number(scheduleCareEdit.start_time);
          const startLocalTime = this.getDateFromTimezone(scheduleCareEdit.start_date).getTime()//moment(scheduleCareEdit.start_date).local().valueOf();
          const startTimeEdit = this.getDateFromTimezone(scheduleCareEdit.start_time).getTime() //moment(scheduleCareEdit.start_time).local().valueOf();
          this.editSchedule = result['data'];
          this.editSchedule.startDate = new Date(startLocalTime);
          this.minDateEnd = this.editSchedule.startDate;

          // this.editSchedule.endDate = scheduleCareEdit.end_date ?  new Date(moment(scheduleCareEdit.end_date).local().valueOf() ) : '';  
          this.editSchedule.endDate = scheduleCareEdit.end_date ? this.getDateFromTimezone(scheduleCareEdit.end_date) : "";

          //this.editSchedule.startTime = new Date( startTimeEdit );
          //this.editSchedule.endTime = new Date( moment(startTimeEdit).add(scheduleCareEdit.duration, 'seconds').local().valueOf() );      
          this.editSchedule.startTime = moment.unix(startTimeEdit / 1000).tz(this.userLocalTimeZone).format();
          this.editSchedule.endTime = moment.unix(startTimeEdit / 1000).add(scheduleCareEdit.duration, 'second').tz(this.userLocalTimeZone).format();

          this.showCustom = (this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'custom'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_day'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_week'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_month'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_year') ? true : false;

          if (this.editSchedule.repeat === 'custom_weekly') {
            this.arrayNumber = Array(32).fill(32, 0, 32).map((x, i) => i + 1);
          }
          //this.showCustom =true;
          const dialogConfig = new MatDialogConfig();
          dialogConfig.maxWidth = '800px';
          dialogConfig.minWidth = '500px';
          dialogConfig.panelClass = 'modal_care_custom';
          //dialogConfig.disableClose = true;
          this.dialogRefs = this._dialog.open(this.repeatDialog, dialogConfig);
        }
      })
      .catch((error) => 
      {
        this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.');
        this.dialogRefs.close();
      });
    this._commonService.setLoader(false);
  }

  async editCareAssignee(scheduleCare, assignItem) {
    await this._apiService.apiFn(
      { type: 'POST', target: 'schedule/get_schedule_by_id' },
      { schedule_id: scheduleCare._id }
    )
      .then((result: any) => {
        if (result['status'] && result['data']) {
          let scheduleCareEdit = result['data'];
          scheduleCareEdit.start_time = Number(scheduleCareEdit.start_time);
          const startLocalTime = moment(scheduleCareEdit.start_date).local().valueOf();
          const startTimeEdit = moment(scheduleCareEdit.start_time).local().valueOf();
          this.editSchedule = result['data'];
          this.editSchedule.startDate = new Date(startLocalTime);
          this.minDateEnd = this.editSchedule.startDate;
          this.editSchedule.endDate = scheduleCareEdit.end_date ? new Date(moment(scheduleCareEdit.end_date).local().valueOf()) : '';

          this.editSchedule.startTime = new Date(startTimeEdit);
          this.editSchedule.endTime = new Date(moment(startTimeEdit).add(scheduleCareEdit.duration, 'seconds').local().valueOf());

          this.showCustom = (this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'custom'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_day'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_week'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_month'
            || this.editSchedule.repeat_checkoption && this.editSchedule.repeat_checkoption === 'every_year') ? true : false;
          //this.showCustom =true;
          this.scheduleCares = scheduleCare;
          this.assignedCare.user_id = assignItem._id.assigned_to;
          const dialogConfig = new MatDialogConfig();
          dialogConfig.maxWidth = '800px';
          dialogConfig.minWidth = '500px';
          //dialogConfig.disableClose = true;
          //this.dialogRefs = this._dialog.open(this.repeatDialogEditAssignee, dialogConfig);    
        }
      })
      .catch((error) => this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.'));
    this._commonService.setLoader(false);
  }

  closeRepeatDialog(): void {
    this.assignedCare.user_id = null;
    this.dialogRefs.close();
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

  async deletePopCare() {
    this._commonService.setLoader(true);
    await this._apiService.apiFn(
      { type: 'DELETE', target: 'schedule/delete_schedule' },
      { schedule_id: this.deleteCare, schedule_type: this.deleteCareType }
    )
      .then((result: any) => {
        if (result['status']) {
          this.assignedCare = {
            user_id: null,
            scheduleCareIDs: [],
            scheduleCares: []
          };
          // this.assigne = false;
          this._toastr.success(result['message']);
          this.getAllEvents();
        } else {
          this._toastr.error(result['message']);
          this._commonService.setLoader(false);
        }
      })
      .catch((error: any) => {
        this._toastr.error(error['message'] ? error['message'] : 'Some error occuerd.');
        this._commonService.setLoader(false);
      });
    this.dialogRefs.close();
  }

  startDateChangeEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.editSchedule.startDate = event.value;
    this.minDateEnd = event.value;
    let dateToday = moment().toDate()
    let timeToday = moment().tz(this.userLocalTimeZone).format("LLLL")
    if (this.reSchedule.startDate > dateToday) {
      this.minDateValue = moment().startOf('day').format()
    }
    else {
      const startTimeToday = this.convertNext30MinuteInterval(timeToday)
      this.minDateValue = moment(startTimeToday).tz(this.timezone).format();;
    }
  }


  scheduleTime(schedule) {
    const start = moment.unix(schedule.start_time/1000);
    const end = moment.unix(schedule.start_time/1000).add(schedule.duration, 'second');
    // return moment.unix(schedule.start_time/1000).format("HH:mm") + ' - ' + moment.unix(schedule.start_time/1000).add(schedule.duration, 'second').format('HH:mm');
    return moment(start).tz(this.timezone).format("HH:mm") + ' - ' + moment(end).tz(this.timezone).format('HH:mm');
  }

  repeatPopChanged(ad) {
    if (this.editSchedule.repeat === 'every_day' || this.editSchedule.repeat === 'every_week' || this.editSchedule.repeat === 'every_month' || this.editSchedule.repeat === 'every_year' || this.editSchedule.repeat === 'custom_weekly') {
      this.editSchedule.repeat_on = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      };
      if (this.editSchedule.repeat === 'custom_weekly') {
        this.arrayNumber = Array(32).fill(32, 0, 32).map((x, i) => i + 1);
      }
    }
    if (this.editSchedule.repeat == 'every_month') {
      this.editSchedule.repeat_option = 'on_day';
      this.editSchedule.repeat_checkoption = 'every_month';
    }
    if (this.editSchedule.repeat == 'every_year') {
      this.editSchedule.repeat_option = 'on_day';
      this.editSchedule.repeat_checkoption = 'every_year';
    }
    if (this.editSchedule.repeat != 'never') {
      this.editSchedule.repeat_tenure = 1
    }
    if (this.editSchedule.repeat === 'custom_yearly') {
      this.editSchedule.month_date = this.editSchedule.month_date ? this.editSchedule.month_date : 1;
    }
  }

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

  updateCareTimeChanged(event, eventFor) {
    console.log('updateCareTimeChanged event---->', event.value);
    // const secondD = this.editSchedule['duration'];
    // const timeendDisp = moment( this.editSchedule.startTime ).add( (secondD) ? secondD : 30, 'seconds').toDate();
    // const timeendDisp = moment(event.value).add(15, 'minutes').toDate();
    // this.editSchedule.endTime =  timeendDisp;
    if (eventFor == 'editSchedule') {
      this.editSchedule.startTime = moment.unix(event.value / 1000).tz(this.userLocalTimeZone).format();
      this.editSchedule.endTime = moment(this.editSchedule.startTime).add(15, 'minutes').tz(this.userLocalTimeZone).format();
    }
    else {
      this.reSchedule.startTime = moment.unix(event.value / 1000).tz(this.userLocalTimeZone).format();
      this.reSchedule.endTime = moment(this.reSchedule.startTime).add(15, 'minutes').tz(this.userLocalTimeZone).format();
    }
    // this.updateCareTimeChanged2(event)
  }

  updateCareTimeChanged2(event, eventFor) {
    console.log('updateCareTimeChanged2 event---->', event);
    // const secondD = this.editSchedule['duration'];
    // const timeendDisp = moment( this.editSchedule.startTime ).add( (secondD) ? secondD : 30, 'seconds').toDate();
    // const timeendDisp = moment(event.value).add(15, 'minutes').toDate();
    // this.editSchedule.endTime =  timeendDisp;
  }

  async saveRepeatDialog() {

    this._commonService.setLoader(true);
    // return
    // check end time validation
    let nullUserId = null;
    if (this.editSchedule.startTime == null || this.editSchedule.endTime == null) {
      this._commonService.setLoader(false);
      this._toastr.error('Start time or end time cannot be blank.');
      return;
    }

    if (moment(this.editSchedule.startTime).unix() >= moment(this.editSchedule.endTime).unix()) {
      this._commonService.setLoader(false);
      this._toastr.error('Start time cannot be less than or equals to end time.');
      return;
    }

    if (this.editSchedule.endDate) {
      if (moment(this.editSchedule.startDate).unix() > moment(this.editSchedule.endDate).unix()) {
        this._commonService.setLoader(false);
        this._toastr.error('Start date cannot be greater than end date.');
        return;
      }
    }
    if (this.assignedCare.user_id) {
      this._commonService.setLoader(true);
      const payload = {
        org_id: this.organization,
        fac_id: this.facility,
        schedule_id: [this.editSchedule._id],
        assigned_to: this.assignedCare.user_id,
        on_date: null,
      };
      if (this.editCareType && this.editCareType !== null) {
        payload.on_date = this.editCareType;
      } else {
        delete payload.on_date;
      }

      await this._apiService.apiFn({ type: 'POST', target: 'schedule/update_assignment' }, payload)
        .then((result: any) => {
          if (result['status']) {
            nullUserId = true;
          } else {
            this._toastr.error(result['message']);
            this._commonService.setLoader(false);
            return;
          }
        })
        .catch((error: any) => {
          this._toastr.error(error['message']);
          this._commonService.setLoader(false);
          return;
        });
    }

    /* Validate start time & End time  */
    const startH = moment(this.editSchedule.startTime).format('HH');
    const startM = moment(this.editSchedule.startTime).format('mm');
    const startDate = moment(this.editSchedule.startDate);
    startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

    const startDateNew = moment(this.editSchedule.startDate);
    startDateNew.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

    const startdate = Number(startDate.utc().valueOf());
    const startdateNew = startDateNew.utc().valueOf();

    let enddate = null;
    if (this.editSchedule.endDate) {
      const endDate = moment(this.editSchedule.endDate);
      endDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      enddate = endDate.utc().valueOf();
    }

    let repeatChkOption = this.editSchedule.repeat;
    if (this.editSchedule.repeat === 'never') {
      enddate = moment(startDateNew).add(1, 'day').valueOf();
    } else {
      const item = this.editSchedule;
      if (item.repeat_tenure !== 1 || item.repeat_option !== 'on_day' ||
        // tslint:disable-next-line: max-line-length
        (!item.repeat_on.monday || !item.repeat_on.tuesday || !item.repeat_on.wednesday || !item.repeat_on.thursday || !item.repeat_on.friday || !item.repeat_on.saturday || !item.repeat_on.sunday)) {
        repeatChkOption = 'custom';
      }
    }
    // Validation : If select every_week Or every_day then must select one day from list
    if (this.editSchedule.repeat === 'every_week' || this.editSchedule.repeat === 'every_day') {
      const item2 = this.editSchedule;
      if (!item2.repeat_on.monday && !item2.repeat_on.tuesday && !item2.repeat_on.wednesday && !item2.repeat_on.thursday && !item2.repeat_on.friday && !item2.repeat_on.saturday && !item2.repeat_on.sunday) {
        this._toastr.error('Select at least one day from the week.');
        return;
      }
    }
    const timediff = (moment(this.editSchedule.endTime).valueOf() - moment(this.editSchedule.startTime).valueOf()) / 1000;
    const startDate2 = moment(this.scheduleDate).startOf('day').valueOf();
    const endDate2 = moment(this.scheduleDate).endOf('day').valueOf();

    const start_time2 = moment(startDate2).utc().valueOf()
    const end_time2 = moment(endDate2).utc().valueOf()

    const scheduleCare = {
      _id: this.editSchedule._id,
      // care_id: "5aab9996f780e02215f3b660"
      // care_note: this.editSchedule.care_note,
      // assigned_to: null,
      repeat: this.editSchedule.repeat,
      repeat_on: this.editSchedule.repeat_on,
      repeat_tenure: this.editSchedule.repeat_tenure,
      month_date: this.editSchedule.month_date,
      start_date: moment(startdateNew).tz(this.timezone, true).valueOf(),
      start_time: moment(this.editSchedule.startTime).tz(this.timezone, true).valueOf(),
      end_date: enddate ? moment(enddate).tz(this.timezone, true).valueOf() : enddate,
      repeat_option: this.editSchedule.repeat_option,
      repeat_checkoption: repeatChkOption,
      duration: timediff,
      start_time2: moment(startdateNew).tz(this.timezone, true).valueOf(),
      end_time2: moment(enddate).tz(this.timezone, true).valueOf(),
    };
    // return
    // if (!this.showCustom) {
    //   scheduleCare.repeat_tenure = 1;
    //   scheduleCare.repeat_on = {
    //     monday : true,
    //     tuesday : true,
    //     wednesday : true,
    //     thursday : true,
    //     friday : true,
    //     saturday : true,
    //     sunday : true
    //   };
    //   scheduleCare.repeat_option = 'on_day';
    //   scheduleCare.repeat_checkoption = 'on_day';
    // }
    await this._apiService.apiFn({ type: 'POST', target: 'schedule/update_schedule' }, scheduleCare)
      .then((result: any) => {
        if (result['status']) {
          if (nullUserId == true) this.assignedCare.user_id = null;
          this.getAllEvents();
        } else {
          this._toastr.error(result['message']);
          this._commonService.setLoader(false);
        }
      })
      .catch((error: any) => {
        this._toastr.error(error['message']);
        this._commonService.setLoader(false);
      });
    this.dialogRefs.close();
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

  getSchedulePerformingTimeString(schedule) {
    let repeat = schedule.repeat
    let finalString = '';
    if (repeat == 'custom_monthly') {
      if (!schedule.month_date) return;
      finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'month' : 'months'} on the ${schedule.month_date}${this.dateFormat2(schedule.month_date)}.`
      return finalString;
    } else if (repeat == 'custom_yearly') {
      if (!schedule.month_date || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) return;
      let repeat = this.customRepeat.filter(e => e.value == schedule.repeat_option);
      let month = this.monthNameList.filter(e => e.value == schedule.month_date);
      let day = this.customWeekDayList.filter(e => e.value == schedule.repeat_on.value);

      if (schedule.repeat_on) {
        day.push({
          'name': Object.keys(schedule.repeat_on)[0],
          'value': Object.keys(schedule.repeat_on)[0],
          'isCheckd': true
        })
      }
      finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'year' : 'years'} in the month of ${month[0].key} on the ${repeat[0].key} of ${day[0].name ? day[0].name : day[1].name}`;
      return finalString;
    }
  }

  yearlyWeeklyChange(editSchedule, event) {
    this.customWeekDay = event.value;
    delete editSchedule['repeat_on'];
    editSchedule['repeat_on'] = {};
    editSchedule['repeat_on'][event.value.name] = true;
    this.getSchedulePerformingTimeString(editSchedule);
  }

  mouseEnterHandler(event: MouseEvent, chapterExpansionPanel: MatExpansionPanel) {
    if (event.buttons && !chapterExpansionPanel.expanded) chapterExpansionPanel.open();
  }

  mouseLeaveHandler(event: MouseEvent, chapterExpansionPanel: MatExpansionPanel) {
    // if (event.buttons && chapterExpansionPanel.expanded) chapterExpansionPanel.close();
    let assigned_to = JSON.parse(localStorage.getItem('assigned_to'));
    this.assignedData.filter((item)=> {
      if(assigned_to && item._id.assigned_to === assigned_to) {
        item._id['open'] = true;
      } else {
        item._id['open'] = false;
      }
    })
  }

  selectAssigned(event) {
    this.assignedCare.user_id = event.value;
    this.userslist.filter(item=> {
      if(item.key === event.value) {
       const foundUser  =  this.assignedData.find(assign => assign._id.assigned_to === event.value);
        if(!foundUser) {
          const id = {
            assigned_to: item.key,
            performer: item.value
          }
         const data = {
            scheduleCares : [],
            _id: id
          }
          this.assignedData.push(data);
          // this.assigne = false;
        }
      }
    })
    // this.assigne = false;
    setTimeout(() => {
      this.asignUserSelected = "";
    }, 100);
  }

  setDateTime(data) {
    const end = moment.unix(data.start_time/1000).add(data.duration, 'second');
    return moment(data.start_date).tz(this.timezone).format("MM/DD/YYYY") + ' , ' + moment(data.start_time).tz(this.timezone).format('HH:mm') + ' - '  + moment(end).tz(this.timezone).format('HH:mm');
  }

  async unassignedAllCares() {
    let performer = this.performerDelete;
    if(performer.scheduleCares && performer.scheduleCares.length>0) {
      let allCares = [];
      performer.scheduleCares.filter(item => {
        allCares.push(item.schedule_id)
      })

      const dateSend = moment(this.scheduleDate).tz(this.timezone, true).valueOf()
      if (allCares.length) {
        this._commonService.setLoader(true);
        const payload = {
          fac_id: this.facility,
          schedule_id: allCares,
          assigned_to: null, // this.transferCare.care.assigned_to,
          assigned_from: performer._id.assigned_to,
          dated: moment(dateSend).format("MM/DD/YYYY"),
          unassign_one_day: true,
        };
        this.transferCare = null;
        const action = {
          type: 'POST',
          target: 'schedule/schedule_assignment'
        };
        const result = await this._apiService.apiFn(action, payload);
        if (result['status']) {
        } else {
          this._toastr.error(result['message']);
          this._commonService.setLoader(false);
        }
  
      }
    }
    this.dialogRefs.close();
  }

  moveToSchedCare() {
    this._router.navigate(['/scheduling/create']);
  }

  filter() {
    this.showFilter = true;
  }

  moveToCalendar() {
    this._router.navigate(['/scheduling']);
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

  changeResident(value) {
    this.getScheduleData(this.scheduleReport, this.scheduleReportForm.valid)
  }

  gotoPreviousDate() {
    var new_date = moment(this.scheduleDate).tz(this.timezone).add(-1, "day").toDate();
    this.dateChange(new_date);
  }

  gotoNextDate() {
    var new_date = moment(this.scheduleDate).tz(this.timezone).add(1, "day").toDate();
    console.log('new_date', new_date,typeof this.scheduleDate, this.timezone )
    this.dateChange(new_date);
  }

  goToToday() {
    this.calendarDate = this.minDate;
    this.dateChange(this.calendarDate) 
  }

  dateChange(value) {
    this._commonService.setLoader(true)
    const startDate = moment(value).startOf('day').valueOf();
    this.scheduleDate = startDate;
    this.dateToSend = this.scheduleDate;
    this.getAllEvents();
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

  checkScroll(id) {
   let val = document.getElementById(id).scrollWidth;
   let val1 = document.getElementById(id).clientWidth;
   let val2 = document.getElementById(id).scrollHeight;
   let val3 = document.getElementById(id).clientHeight;
   if(val > val1 || val2 > val3) {
     return true;
   } else {
     return false;
   }
  }

  checkScrollMissed(id) {
   let val = document.getElementById(id).scrollWidth;
   let val1 = document.getElementById(id).clientWidth;
   let val2 = document.getElementById(id).scrollHeight;
   let val3 = document.getElementById(id).clientHeight;
   if(val > val1 || val2 > val3) {
     return true;
   } else {
     return false;
   }
  }
}
