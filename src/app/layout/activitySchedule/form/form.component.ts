import { Component, OnInit, TemplateRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from './../../../shared/services/common.service';
import { ApiService } from './../../../shared/services/api/api.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig, MatOption,MatCheckboxModule } from '@angular/material';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
// import { RepeatCareComponent } from '../repeat-Activity-dialog/repeat-Activity.component';
import {
  startOfMonth, startOfDay, startOfWeek, addWeeks, endOfDay, subDays, addDays, endOfMonth, endOfWeek, isSameDay,
  isSameMonth, addHours, addMinutes, addSeconds, format
} from 'date-fns';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { element } from 'protractor';
import { Item } from 'angular2-multiselect-dropdown';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { AddLocationComponent } from 'src/app/shared/modals/add-location/add-location.component';
// moment.tz.setDefault('America/Chicago')
/* Create Interface for Sub cares data */
interface ParentCare {
  value: string;
  viewValue: string;
  subCare: boolean;
}

interface ParentCareGroup {
  disabled?: boolean;
  name: string;
  subCares: ParentCare[];
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [
    // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
    // `MatMomentDateModule` in your applications root module. We provide it at the component level
    // here, due to limitations of our example generation script.
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ],
})
export class FormComponent implements OnInit {
  public formatString: string = 'HH:mm';
  userLocalTimeZone = moment.tz.guess()
  parentCareGroupGroups: ParentCareGroup[] = [];
  addPopupStartMin;
  careStartDate: Date;
  minDate: Date = new Date();
  minDateEnd: Date;
  subscription: Subscription;
  organization; facility;
  timezone;
  locationSearch = '';
  shift;
  shiftSelected = [];
  SelectedShift;
  saveSelectedShift :boolean;
  shiftno = [];
  shiftStartTime;
  shiftEndTime
  utc_offset;
  timeOption;
  residentslist; carelistData; carelist; userslist;
  showerror = true;
  firstEdit = true;
  firstEditOption = false;
  showAddedcares = false;
  seconddisable = true;
  secondEdit = false;
  secondEditOption = false;
  step1= true;
  step2= false;
  step3= false;
  step4= false;
  step5 = false;
  location: any = {
    name : '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip:'',
    country:'',
    onGround: false
  }
  thirdEdit = false;
  thirddisable = true;
  forthdisable = true;
  fifthdisable= true;
  afterpreview = false;
  afterpreview2 = false;
  thirdEditOption = false;
  step = 0;
  isDisabledCare = true;
  isDisabledDuration = true;
  isDisabledBuilding =true;
  isDisabledScheduleTime=true;
  dialogRefs = null;
  panelOpenState;
  description;
  timeData: {
    start_date: '',
    end_date:''
  }
  openTimePopup : boolean = false;
  scheduleDuration: any = [{
    startDate: new Date(),
    endDate: null,
  }];
  newCreatedEvent ={
    org_id: "",
    fac_id: "",
    month_date:"",
    start_date:  new Date(),
    start_time: null,
    time: [],
    end_time:null,
    location:"",
    location_room: "",
    end_date: null,
    onGround:false,
    repeat: "never",
    repeat_checkoption: "never",
    repeat_on: 
     { monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true },
    repeat_tenure: 1,
    repeat_option: "on_day",
    duration: 1800,
    category: "",
    title: "",
    description: "",
    address: 
     { name: "",
      line1: "",
      city: "",
      state: "",
      zip: "",
      phone: null },
    building: [] }

  event = {
    category: "",
    title:"",
    description:""
  }
categoryList = [
  {
    name: "Game",
    value: "game"
  },
  {
    name: "Music",
    value: "music"
  }
]
  @ViewChild('callRepeatDialog', {static: true}) callRepeatDialog: TemplateRef<any>;
  @ViewChild('repeatChangeDialog', {static: true}) repeatChangeDialog: TemplateRef<any>;
  @ViewChild('customweekly', {static: true}) customweekly: TemplateRef<any>;
  @ViewChild('custommonthly', {static: true}) custommonthly: TemplateRef<any>;
  @ViewChild('customyearly', {static: true}) customyearly: TemplateRef<any>;
  @ViewChild('addModal', {static: true}) addModal: TemplateRef<any>;


  // scheduleDuration = {
  //   startDate: new Date(),
  //   endDate: null,
  // };

  scheduleRepeat: any = {
    index: null,
    startDate: null,
    // startDate : new Date(),
    endDate: new Date(),
    repeat_tenure: 1,
    repeat: 'every_day',
    repeat_old: null,
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
    repeat_checkoption: 'on_day'
  };
  resSearch = '';
  shiftSearch = '';
  timesearch = '';
  carSearch = '';
  perSearch = '';
  rSearch = '';
  weekSearch = '';
  monthSearch = '';
  yearSearch = '';
  monthNameSearch = '';
  daySearch = ''
  nSearch = '';
  customrepeatSearch = '';
  activeClassIndex = null;
  shiftArr;

  weekDayList = [
    { value: 'Sun', isCheckd: true }, { value: 'Mon', isCheckd: true }, { value: 'Tues', isCheckd: true }, { value: 'Wed', isCheckd: true },
    { value: 'Thurs', isCheckd: true }, { value: 'Fri', isCheckd: true }, { value: 'Sat', isCheckd: true },
  ];

  customWeekDayList = [
    { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
  ];


  weekList: any = [
    { key: 'Week', value: 1 }, { key: '2 Weeks', value: 2 }, { key: '3 Weeks', value: 3 }, { key: '4 Weeks', value: 4 }, { key: '5 Weeks', value: 5 }, { key: '6 Weeks', value: 6 }, { key: '7 Weeks', value: 7 },
    { key: '8 Weeks', value: 8 }, { key: '9 Weeks', value: 9 }, { key: '10 Weeks', value: 10 }, { key: '11 Weeks', value: 11 }, { key: '12 Weeks', value: 12 }, { key: '13 Weeks', value: 13 }, { key: '14 Weeks', value: 14 }, { key: '15 Weeks', value: 15 }, { key: '16 Weeks', value: 16 }, { key: '17 Weeks', value: 17 }, { key: '18 Weeks', value: 18 }, { key: '19 Weeks', value: 19 }, { key: '20 Weeks', value: 20 }, { key: '21 Weeks', value: 21 }, { key: '22 Weeks', value: 22 }, { key: '23 Weeks', value: 23 }, { key: '24 Weeks', value: 24 }, { key: '25 Weeks', value: 25 }, { key: '26 Weeks', value: 26 }, { key: '27 Weeks', value: 27 }, { key: '28 Weeks', value: 28 }, { key: '29 Weeks', value: 29 }, { key: '30 Weeks', value: 30 }, { key: '31 Weeks', value: 31 }, { key: '32 Weeks', value: 32 }
  ]
  monthList = [{ key: 'Month', value: 1 }, { key: '2 Months', value: 2 }, { key: '3 Months', value: 3 }, { key: '4 Months', value: 4 }, { key: '5 Months', value: 5 }, { key: '6 Months', value: 6 }, { key: '7 Months', value: 7 }, { key: '8 Months', value: 8 }, { key: '9 Months', value: 9 }, { key: '10 Months', value: 10 }, { key: '11 Months', value: 11 }, { key: '12 Months', value: 12 }];

  yearList = [{ key: 'Year', value: 1 }, { key: '2 Years', value: 2 }, { key: '3 Years', value: 3 }, { key: '4 Years', value: 4 }, { key: '5 Years', value: 5 }, { key: '6 Years', value: 6 }, { key: '7 Years', value: 7 }, { key: '8 Years', value: 8 }, { key: '9 Years', value: 9 }, { key: '10 Years', value: 10 }];

  monthNameList = [{ key: 'January', value: 1 }, { key: 'February', value: 2 }, { key: 'March', value: 3 }, { key: 'April', value: 4 }, { key: 'May', value: 5 }, { key: 'June', value: 6 }, { key: 'July', value: 7 }, { key: 'August', value: 8 }, { key: 'September', value: 9 }, { key: 'October', value: 10 }, { key: 'November', value: 11 }, { key: 'December', value: 12 }];

  customRepeat = [{ key: 'First', value: 'on_day' }, { key: 'Second', value: 'on_second_day' }, { key: 'Third', value: 'on_third_day' }, { key: 'Forth', value: 'on_forth_day' }, { key: 'Fifth', value: 'on_fifth_day' }, { key: 'Last', value: 'on_last_day' }];

  monthDayList = Array.from({ length: 31 }, (_, i) => i + 1).map(e => ({ name: `${e}${this.dateFormat2(e)}`, value: e }));

  @ViewChild('selectedShift', {static: true}) private selectedShift: MatOption
  @ViewChild('openPreview', {static: true}) openPreview: TemplateRef<any>;
  repeatOptions: any = [
    { key: 'never', value: 'Never Repeat' },
    { key: 'every_day', value: 'Daily' },
    { key: 'every_week', value: 'Weekly' },
    { key: 'every_month', value: 'Monthly' },
    { key: 'every_year', value: 'Annually' },
    // { key: 'custom', value : 'Custom'},
    { key: 'custom_weekly', value: 'Custom Weekly' },
    { key: 'custom_monthly', value: 'Custom Monthly' },
    { key: 'custom_yearly', value: 'Custom Yearly' }
  ];
  locationList: any;
  categoriesList: any;
  categoryName: any;
  buildingList: any;
  selectedCareTime: any;
  locationListOnGround: any;
  previewLocation: any;
  showSkip: boolean = true;
  encActivityId: any;
  decActivityId: any;
  minEndDate: any = new Date();
  editForm: boolean = false;scheduleDate: any;
  timeEdited: boolean = false;
;


  constructor(
    private _formBuilder: FormBuilder,
    private _commonService: CommonService,
    private _router: Router,
    private apiService: ApiService,
    public route: ActivatedRoute,
    public _aes256Service: Aes256Service,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    //this.minDate       = Date;
    //this.minDateEnd    =  Date;
    //this.careStartDate =  Date;
  }



  setStep(index: number) {
    this.step = index;
    if(this.step == 4) this.setTimeForm();
  }
  setStep2(index: number) {
    // this.step2 = index;
  }

  ngOnInit() {

    let shiftList = this._commonService.shiftTime()
    this.shiftArr = [...shiftList]

    if (!this._commonService.checkPrivilegeModule('scheduling', 'add')) {
      this._router.navigate(['/']);
    }
    this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
      // console.log("content data >>>>>",contentVal)
      this._commonService.setLoader(true);
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;//moment.tz(this.timezone).format()


        this._commonService.setLoader(false);
    this.getAllLocation(this.newCreatedEvent.onGround);
    if (this.route.params['_value']['id']) {
      console.log(window.history.state)
      if(sessionStorage.getItem("scheduleDate")){
        this.scheduleDate = sessionStorage.getItem('scheduleDate');
      }else{
        this.scheduleDate = window.history.state.date;
        sessionStorage.setItem('scheduleDate', this.scheduleDate);
      }
      this.editForm = true;
      this.decActivityId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);

      // console.log(this.decActivityId)
      this.getEventById(this.decActivityId);
    this.getBuildings();


    }

      }
    });
    this.getCategory();

    // this.schedularFormGroup = this._formBuilder.group({
    //   residentList: this._formBuilder.array([])
    // });

  }

  setTimeForm() {
    const timestartDisp = moment({ hour: 0 }).toDate(); // moment({ hour: 9 });
    const currentDate = moment(new Date()).startOf('minute').tz(this.timezone).format("LLLL");
    let selectedStartDate = new Date(this.newCreatedEvent.start_date);
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

  cancelSchedule(){
    if(this.editForm){
      // console.log(this.scheduleDate)
      this._router.navigate(['/activity-scheduling/day_list', this.scheduleDate])
    }
  }

  async getEventById(id) {
    const payload={
      id: id
    };
    // console.log(payload)
    await this.apiService.apiFn({ type: 'GET', target: `activitySchedule/get/${id}`}, payload)
    .then((result: any) => {
      console.log('result::::::::::::::::::::', JSON.stringify(result))
      this._commonService.setLoader(false);
      const timeZone = this.timezone;
      if(result['data'].length){
      var eventData = result['data'][0];

      const hourEvnt = parseInt(moment(eventData.start).tz(timeZone).format('HH'));
        const minuteEvnt = parseInt(moment(eventData.start).tz(timeZone).format('mm'));
        const hourEndEvnt = parseInt(moment(eventData.end).tz(timeZone).format('HH'));
        const minuteEndEvnt = parseInt(moment(eventData.end).tz(timeZone).format('mm'));
        this.newCreatedEvent = eventData;
        this.newCreatedEvent.category = eventData.category_id;
        this.newCreatedEvent.onGround = eventData.location.onGround;
        this.newCreatedEvent.location = eventData.location._id;
        this.newCreatedEvent.start_date = new Date(addMinutes(addHours(startOfDay(eventData.start), hourEvnt), minuteEvnt));
        this.newCreatedEvent.end_date = new Date(addMinutes(addHours(startOfDay(eventData.end), hourEndEvnt), minuteEndEvnt));
        this.newCreatedEvent.start_time =  moment(eventData.start).tz(timeZone).format("HH:mm");
        this.newCreatedEvent.end_time =  moment(eventData.end_time).tz(timeZone).format("HH:mm");
        this.newCreatedEvent.time =  [];
        // this.newCreatedEvent.time = [{ start : moment(eventData.start).tz(timeZone).format("HH:mm") , end : moment(eventData.end).tz(timeZone).format("HH:mm")}] ;
      }
      this.isDisabledCare = false;
      this.isDisabledDuration = false;
      this.isDisabledScheduleTime = false;
      this.isDisabledBuilding = false;
      this.minEndDate = new Date();
    this.fifthdisable = false;


    })
    .catch((error) =>{
      this._commonService.setLoader(false);
      this.toastr.error(error['message'] ? error['message'] : 'Some error occuerd.')
    });
    // console.log(this.scheduleDate)
  }
  async getCategory(){
    const action = { type: 'GET', target: `activitySchedule/category` };
    const payload = ""
    const result = await this.apiService.apiFn(action, payload);
    // console.log(result)
    this.categoriesList = result['data'];
  }

  async getAllLocation(onGround){
    // console.log(onGround)
    const action = { type: 'POST', target: `location/get` };
    const payload= {
      fac_id: this.facility,
      onGround: onGround,
      pageIndex: 10,
      pageSize: 0,
      search: "",
      sort: {active: "name", direction: "asc"}
    }
    // console.log(payload)
    if(!this.locationListOnGround || !this.locationList){
      const result = await this.apiService.apiFn(action, payload);
      // console.log(JSON.stringify(result))
      if(onGround){
        this.locationListOnGround = result['data']._locations;
        console.log("Location list on ground----->",this.locationListOnGround);
      }else{
        this.locationList = result['data']._locations;
      }
      console.log("Location list----->",this.locationList);
    }
   
  }
  async onSubmit(location) {
    this._commonService.setLoader(true);
    let vaild = location.form.status;
    if (location.name) {
      location.name = location.name.trim();
    }
    if (location.name === '') {
      vaild = 'INVALID';
    }
    // // console.log('vaild---->', vaild);
    // // console.log('cares.form.value---->', cares.form.value);
    if (vaild === 'VALID') {

      const action = { type: 'POST', target: 'location/add' };
      
      // console.log('---location---', this.location);
      let payload = this.location;
      payload.fac_id = this.facility;
      // console.log(payload)

      const result = await this.apiService.apiFn(action, payload);
      // console.log(result)
      this.locationList = null;
      this.locationListOnGround = null;
      this.location= {
        name : '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip:'',
        country:'',
        onGround: false
      };
      this.getAllLocation(this.newCreatedEvent.onGround)
      if (result['status'] && result['data']) {
        // console.log(result)
        this._commonService.setLoader(false);
        this.toastr.success(result['message']);
      } else {
        this._commonService.setLoader(false);
        this.toastr.success(result['message']);
      }
      // this._commonService.setLoader(false);
      // this.toastr.show('Care added successfully')
    } else {
      this._commonService.setLoader(false);
      this.toastr.error('Please enter Location details');
    }
    this.dialogRefs.close();

  }
  activeToggler(selectedIndex,event) {
    event.stopPropagation();
    this.activeClassIndex = (this.activeClassIndex == selectedIndex) ? null : selectedIndex;
    // console.log(this.activeClassIndex)
  }

  cancelForm(){
  this.dialogRefs.close();

  }


  addCategory(){
    // // console.log(event)
    const objIndex = this.categoriesList.findIndex((obj => obj._id == this.newCreatedEvent.category));
     this.categoryName = this.categoriesList[objIndex].name;
     // console.log(this.categoryName)
    this.secondEdit = true;
    this.seconddisable = false;
    // this.setStep(1);
    this.step2 = true;
    this.isDisabledCare = false;
    this.firstEditOption = false;
  }

  async getBuildings(){
    await this.apiService.apiFn(
      { type: 'GET', target: 'facility/faclist' },
      { 'org_id': this.organization }
    )
      .then((result: any) => {
        this.buildingList = result.data;
        if (this.buildingList && this.buildingList.length == 1) {
          this.buildingList.facility = this.buildingList[0]._id;
          // this.changeFac(this.resident.facility, true);
        }
      });
  }

  setDescription(){
    this.thirddisable = false;
    // this.setStep(2);
    this.step3 = true;
    this.isDisabledDuration = false;
    this.firstEditOption = false;


  }

  setLocation(event){
    const objIndex = this.locationList.findIndex((obj => obj._id == this.newCreatedEvent.location));
    if(objIndex >= 0){
      this.previewLocation = this.locationList[objIndex];
    }
    // console.log(this.previewLocation)
    // this.locationList.map(data =>{
    //   if(data.subLocations.length > 0){
    //     const objIndexSubLocation = data.subLocations.findIndex((obj => obj._id == this.newCreatedEvent.location));
    //     if(objIndexSubLocation >= 0){
    //     this.previewLocation = data.subLocations[objIndexSubLocation];
    //     }
    //   }
    // })
    
   
    this.forthdisable = false;
    // this.setStep(3);
    this.step4 = true;
    this.thirddisable = false
    this.isDisabledBuilding = false;
    this.firstEditOption = false;
    this.getBuildings();
  }
  setBuilding(event){
    this.showSkip = false;
    this.fifthdisable = false;
    // this.setStep(4);
    this.step5= true
    this.isDisabledScheduleTime = false;
    this.firstEditOption = false;
  }

    //New Activity Changes Start
    async openPreviewDialog() {
      // await this.getAllcaresData();
      // // console.log('ddddddddddddd');
      this.dialogRefs = this.dialog.open(this.openPreview, {
        width: '400px',
        // disableClose: true
        //panelClass:'contactpopup',
      });
    }

    closePreviewDialog(): void {
      this.dialogRefs.close();
    }

    onSubmitEvent(){

    }

    startDateChangeEvent(type: string, event: any) {
      // console.log(event.value)
      // this.newCreatedEvent.end_date = event.value;
      this.minEndDate = event.value;
     
  
      if (this.scheduleRepeat.startDate) this.scheduleRepeat.startDate = event.value;
      if(this.newCreatedEvent.repeat === "every_week") {
        this.repeatChanged();
      }
      this.setTimeForm()
    }

    repeatChanged() {
      this.newCreatedEvent.repeat_checkoption = this.newCreatedEvent.repeat;
      this.minDate = new Date();
      if (this.newCreatedEvent.repeat === 'custom'
        || this.newCreatedEvent.repeat === 'never'
        || this.newCreatedEvent.repeat === 'every_day'
        || this.newCreatedEvent.repeat === 'every_week'
        || this.newCreatedEvent.repeat === 'every_month'
        || this.newCreatedEvent.repeat === 'every_year') {
        if (this.newCreatedEvent.repeat === 'custom') {
        } else {
          this.newCreatedEvent.repeat = this.newCreatedEvent.repeat;
        }

        const dialogConfig = new MatDialogConfig();
        dialogConfig.width = '610px';
        dialogConfig.maxHeight = '350px';
        dialogConfig.panelClass = 'monthlyDialog';
        dialogConfig
        this.dialogRefs = this.dialog.open(this.repeatChangeDialog, dialogConfig);
  
        const newCreatedEvent = JSON.parse(JSON.stringify(this.newCreatedEvent));
        this.scheduleRepeat.repeat = newCreatedEvent.repeat;
        this.scheduleRepeat.startDate = this.newCreatedEvent.start_date;
        this.scheduleRepeat.endDate = this.newCreatedEvent.end_date;
        const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
        this.scheduleRepeat.repeat_tenure = newCreatedEvent.repeat_tenure ? newCreatedEvent.repeat_tenure : 1;
        if (this.newCreatedEvent.repeat === 'every_day') {
          this.scheduleRepeat.repeat_on = repeatDays;
        } else {
          this.scheduleRepeat.repeat_on = newCreatedEvent.repeat_on ? newCreatedEvent.repeat_on : repeatDays;
        }
        this.scheduleRepeat.repeat_option = newCreatedEvent.repeat_option ? newCreatedEvent.repeat_option : 'on_day';
      } else if (this.newCreatedEvent.repeat === 'custom_weekly') {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.width = '605px';
        dialogConfig.height = '340px';
        dialogConfig.panelClass = 'monthlyDialog';
        //dialogConfig.disableClose = true;
        this.dialogRefs = this.dialog.open(this.customweekly, dialogConfig);
  
        const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
        const newCreatedEvent = JSON.parse(JSON.stringify(this.newCreatedEvent))
  
        this.scheduleRepeat.repeat = newCreatedEvent.repeat;
        this.scheduleRepeat.startDate = this.newCreatedEvent.start_date;
        this.scheduleRepeat.endDate = this.newCreatedEvent.end_date;
        this.scheduleRepeat.repeat_on = newCreatedEvent.repeat_on ? newCreatedEvent.repeat_on : repeatDays;
        this.scheduleRepeat.repeat_option = 'on_day';
  
      } else if (this.newCreatedEvent.repeat === 'custom_monthly') {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.height = '280px';
        dialogConfig.width = '610px';
        dialogConfig.panelClass = 'monthlyDialog';
        this.dialogRefs = this.dialog.open(this.custommonthly, dialogConfig);
  
        const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
        const newCreatedEvent = JSON.parse(JSON.stringify(this.newCreatedEvent))
  
        this.scheduleRepeat.repeat = newCreatedEvent.repeat;
        this.scheduleRepeat.startDate = this.newCreatedEvent.start_date;
        this.scheduleRepeat.endDate = this.newCreatedEvent.end_date;
  
        this.newCreatedEvent['month_date'] = '';
      } else if (this.newCreatedEvent.repeat === 'custom_yearly') {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.height = '280px';
        dialogConfig.width = '620px';
        dialogConfig.panelClass = 'monthlyDialog';
        //dialogConfig.disableClose = true;
        this.dialogRefs = this.dialog.open(this.customyearly, dialogConfig);
  
        const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
        const newCreatedEvent = this.newCreatedEvent;
        this.scheduleRepeat.repeat = newCreatedEvent.repeat;
        this.scheduleRepeat.startDate = this.newCreatedEvent.start_date;
        this.scheduleRepeat.endDate = this.newCreatedEvent.end_date;
        this.newCreatedEvent['month_date'] = '';
        this.scheduleRepeat.repeat_option = '';
        this.scheduleRepeat.repeat_on = '';
      } else {
        this.newCreatedEvent.start_date = this.newCreatedEvent.start_date;//this.scheduleRepeat.startDate;
        this.newCreatedEvent.end_date = this.newCreatedEvent.end_date;//this.scheduleRepeat.endDate;
        this.newCreatedEvent.repeat_tenure = 1;
        this.newCreatedEvent.repeat = this.newCreatedEvent.repeat;
        // tslint:disable-next-line: max-line-length
        this.newCreatedEvent.repeat_on = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
        this.newCreatedEvent.repeat_option = 'on_day';
      }
  
      this.scheduleDuration.startDate = this.scheduleRepeat.startDate;
      const End = this.scheduleDuration.endDate;
      if (End != null) {
        const checkSDate = moment(this.scheduleDuration.startDate).format('YYYY-MM-DD');
        const checkEDate = moment(End).format('YYYY-MM-DD');
        if (checkSDate > checkEDate) this.scheduleDuration.endDate = '';
      }
      this.newCreatedEvent.start_date = this.scheduleRepeat.startDate;
      this.newCreatedEvent.end_date = this.scheduleRepeat.endDate;
      this.newCreatedEvent.repeat_tenure = this.scheduleRepeat.repeat_tenure;
      this.newCreatedEvent.repeat = this.scheduleRepeat.repeat;
      // this.newCreatedEvent.repeat_old = this.scheduleRepeat.repeat;
      this.newCreatedEvent.repeat_on = this.scheduleRepeat.repeat_on;
      this.newCreatedEvent.repeat_option = this.scheduleRepeat.repeat_option;
  
      /* Set Repeat for Every Week */
      if (this.newCreatedEvent.repeat === 'every_week') {
        let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        let d = new Date(this.newCreatedEvent.start_date);
        let dayName = days[d.getDay()];
        var key = dayName;
        var obj = { monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false };
        obj[key] = true;
        this.newCreatedEvent.repeat_on = obj;
      }
  
      /*  If any data change after click Preview button then revert it to Preview button */
      // if(this.afterpreview2 == true){
      //   this.afterpreview2 = false;
      //   this.thirdEdit     = true;
      // }
    }


  radioRepeatChange(event): void {
    // console.log(event)
    this.scheduleRepeat.repeat_option = event.value;
    this.newCreatedEvent.repeat_option = event.value;
  }

  dayNamesShort(date) {
    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    var d = new Date(date);
    return days[d.getDay()];
  }

    getRepeatValue(repeat_val) {
      if (repeat_val !== null) {
        const repeatVal = this.repeatOptions.filter(entry => entry.key === repeat_val)[0];
        return repeatVal.value;
      } else {
        return false;
      }
    }

    weekDayTextInForm(data) {
      const checkData = [];
      for (const [key, value] of Object.entries(data)) {
        if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
      }
      let str = (checkData).toString();
      if (checkData.length > 1) {
        str = str.replace(checkData[checkData.length - 2] + ',', checkData[checkData.length - 2] + ' and ');
      }
      return str.replace(/,/g, ', ');
    }


    getSchedulePerformingTimeString(schedule) {
      let scheduleRepeatTenure = schedule.repeat_tenure;
      let repeat = schedule.repeat
  
      if (repeat == 'custom_weekly') {
        let repeatDay = Object.entries(schedule.repeat_on).filter((e, i) => e).filter(e => e[1]).map(e => e[0])
        if(repeatDay && repeatDay.length) {
          let capitalRepeatDay = [];
          repeatDay.filter(item => {
            item = item.charAt(0).toUpperCase() + item.slice(1);
            capitalRepeatDay.push(item)
          })
          repeatDay = [];
          repeatDay = capitalRepeatDay;
        }
        let finalString = repeatDay && repeatDay.length ? `Activity will occur every ${scheduleRepeatTenure} ${scheduleRepeatTenure == 1 ? 'week' : 'weeks'} ${repeatDay.length > 0 ? 'on' : ''}
        ${repeatDay.length > 1 ? repeatDay.slice(0, repeatDay.length - 1).toString().replace(/,/g, ', ') : repeatDay.slice(0, repeatDay.length).toString()} ${repeatDay.length > 1 ? ' and ' : ''} ${repeatDay.length > 1 ? repeatDay[repeatDay.length - 1].charAt(0).toUpperCase() + repeatDay[repeatDay.length - 1].slice(1) : ''}.`: '';
        return finalString
      } else if (repeat == 'custom_monthly') {
        if (schedule.month_date == '') return;
        let finalString = `Activity will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'month' : 'months'} on the ${schedule.month_date}${this.dateFormat2(schedule.month_date)}.`
        return finalString;
      } else if (repeat == 'custom_yearly') {
        if (schedule.month_date == '' || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) return;
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
        let finalString = `Activity will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'year' : 'years'} in the month of ${month[0].key} on the ${repeat[0].key} of ${day[0].name ? day[0].name.charAt(0).toUpperCase() + day[0].name.slice(1) : day[1].name.charAt(0).toUpperCase() + day[0].name.slice(1)}`
        return finalString;
      }
    }


  dateFormat2(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  onSaveAddTime(timeData) {

    // console.log(timeData)
        if (timeData.start_time == null || timeData.end_time == null) {
          this.toastr.error('Start time or end time cannot be blank.');
          return;
        }
        if (timeData.start_time == 'Invalid date' || timeData.end_time == 'Invalid date') {
          this.toastr.error('Start time or end time cannot be blank.');
          return;
        }
        if (moment.tz(timeData.start_time, this.timezone).unix() >= moment.tz(timeData.end_time, this.timezone).unix()) {
          this.toastr.error('End time cannot be less than or equals to start time.');
          return;
        }
        // // console.log('------saveing time-----',timeData.start_time,moment(timeData.start_time).tz(this.timezone,true).format(),this.newCreatedEvent.start_date)
        const isPastTime = this.isPastTime(timeData.start_time, this.newCreatedEvent.start_date)
        if (isPastTime == true) {
          this.toastr.error('You cannot select past time.');
          return;
          // this.newCreatedEvent['minDate'] = moment(this.newCreatedEvent['minDate']).add(1, 'd').toDate();
          // this.newCreatedEvent['start_date'] = moment(this.newCreatedEvent['start_date']).add(1, 'd').toDate();
        }
        // check end time validation


        let startdateformat: any = moment(timeData.start_time, "ddd DD-MMM-YYYY, HH:mm");
        let enddateformat: any = moment(timeData.end_time, "ddd DD-MMM-YYYY, HH:mm");
        let checkFormTime = false;

        console.log("Time Event",this.newCreatedEvent.time, startdateformat);

        if (startdateformat.isValid()) {
          startdateformat = moment(timeData.start_time, "ddd DD-MMM-YYYY, HH:mm").format("HH:mm");
          for (let i = 0; i < this.newCreatedEvent.time.length; i++) {
            let iDate = timeData.start_time;
            if (moment(this.newCreatedEvent.time[i].end).date() > moment(this.newCreatedEvent.time[i].start).date()) {
              if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.newCreatedEvent.time[i].end))) checkFormTime = true;
            } else if (moment(iDate).isBetween(this.newCreatedEvent.time[i].start, this.newCreatedEvent.time[i].end, null, "()")) {
              checkFormTime = true;
            }
            else if (moment(this.newCreatedEvent.time[i].start).date() == moment(this.newCreatedEvent.time[i].start).date()) {
              if (this.compareDate(moment(iDate)) == this.compareDate(moment(this.newCreatedEvent.time[i].start))) checkFormTime = true;
            }
          }
        } else {
          startdateformat = timeData.start_time;
          for (let i = 0; i < this.newCreatedEvent.time.length; i++) {
            let iDate = moment.tz(timeData.start_time, "HH:mm", this.timezone).format();
            if (moment.tz(this.newCreatedEvent.time[i].end, this.timezone).date() > moment.tz(this.newCreatedEvent.time[i].start, this.timezone).date()) {
              if (this.compareDate(moment.tz(iDate, this.timezone)) < this.compareDate(moment.tz(this.newCreatedEvent.time[i].end, this.timezone))) {
                checkFormTime = true;
              }
            } else if (moment.tz(iDate, this.timezone).isBetween(this.newCreatedEvent.time[i].start, this.newCreatedEvent.time[i].end, null, "()")) {
              checkFormTime = true;
            }
          }
        }
        if (enddateformat.isValid()) {
          enddateformat = moment(timeData.end_time, "ddd DD-MMM-YYYY, HH:mm").format("HH:mm");
          for (let i = 0; i < this.newCreatedEvent.time.length; i++) {
            let iDate = timeData.end_time;
            if (moment(this.newCreatedEvent.time[i].end).date() > moment(this.newCreatedEvent.time[i].start).date()) {
              if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.newCreatedEvent.time[i].end))) checkFormTime = true;
            } else if (moment(iDate).isBetween(this.newCreatedEvent.time[i].start, this.newCreatedEvent.time[i].end, null, "()")) {
              checkFormTime = true;
            }
          }
        } else {
          enddateformat = timeData.end_time;
          for (let i = 0; i < this.newCreatedEvent.time.length; i++) {
            let iDate = moment(timeData.end_time, "HH:mm").toDate();
            if (moment(this.newCreatedEvent.time[i].end).date() > moment(this.newCreatedEvent.time[i].start).date()) {
              if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.newCreatedEvent.time[i].end))) checkFormTime = true;
            } else if (moment(iDate).isBetween(this.newCreatedEvent.time[i].start, this.newCreatedEvent.time[i].end, null, "()")) {
              checkFormTime = true;
            }
          }
        }
        if (checkFormTime == true) {
          this.toastr.error("This time already exist.");
          this._commonService.setLoader(false);
          return;
        }
        timeData.start_time = moment(timeData.start_time).tz(this.userLocalTimeZone, true).format("HH:mm");
        timeData.end_time = moment(timeData.end_time).tz(this.userLocalTimeZone, true).format("HH:mm");
        // console.log(this.newCreatedEvent)

        this.newCreatedEvent.time.push({start : timeData.start_time, end : timeData.end_time});
        this.newCreatedEvent.start_time = null;
        this.newCreatedEvent.end_time = null;
        // console.log(this.newCreatedEvent)
          const timestartDisp = moment({ hour: 0 }).toDate(); // moment({ hour: 9 });
          const timeendDisp = moment({ hour: 0 }).add(30, 'minutes').toDate();

          const currentDate = moment(new Date()).startOf('minute').tz(this.timezone).format("LLLL");

          let selectedStartDate = new Date(this.newCreatedEvent.start_date);
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

  compareDate(m) {
    return m.minutes() + m.hours() * 60;
  }

  onRemoveTime( i) {
    this.newCreatedEvent.time.splice(i, 1);
  }
  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }
  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }
  
  convertNext30MinuteInterval(timeSelected) {
    const remainder = (moment().tz(this.timezone).minute() % 30) - 30; //add time zone-----
    const dateTime = moment(timeSelected).tz(this.timezone).add(-remainder, "minutes").toDate(); // add time zone-----
    return dateTime;
  }
  
  isPastTime(startTime, startDate) {
    // Check past time validation
    // console.log("startTime>>>>>>",startTime,"startDate",startDate)
    var currentDate = this.getCurrentDateFromTimezone();
    var startTimeCompare = startTime;

    const startH = moment(startTime).format('HH');
    const startM = moment(startTime).format('mm');
    startTimeCompare = moment(startDate);
    startTimeCompare.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
// console.log("moment.tz(startTime, this.timezone).unix() >= moment.tz(currentDate, this.timezone).unix()>>",moment.tz(startTime, this.timezone).unix(),"sdsadgasgdaghsvgh",moment.tz(currentDate, this.timezone).unix())
    if (currentDate.getTime() > startTimeCompare && moment.tz(startTime, this.timezone).unix() <= moment.tz(currentDate, this.timezone).unix()) return true;
    // // Check past time validation
    // var currentDate        =moment.tz(this.timezone);
    // var startTimeCompare   = startTime; 

    // const startH = moment.tz(startTime,this.timezone).format('HH');
    // const startM = moment.tz(startTime,this.timezone).format('mm');
    // startTimeCompare = moment.tz(startDate,this.timezone);
    // startTimeCompare.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });

    // if (currentDate.valueOf() > startTimeCompare) {
    //     return true;
    // }
  }
  checkWeekNumbers(data) {
    let yearNow = parseInt(moment().format("YYYY"));
    let firstOfMonth = new Date(yearNow, data - 1, 1);
    let lastOfMonth = new Date(yearNow, data, 0);
    let used = firstOfMonth.getDay() + lastOfMonth.getDate();
    let weekNum = Math.ceil(used / 7) - 1;
    if (weekNum < 5) {
      this.customRepeat.splice(4, 1);
    } else {
      if (this.customRepeat[4].value != 'fifth_day') this.customRepeat.splice(4, 0, { key: 'Fifth', value: 'fifth_day' });
    }
  }

  saveRepeatDialog(schedule = null): void {
    // console.log(schedule)
    if (schedule != null) {
      if (schedule.repeat == 'custom_weekly') {
        if (Object.values(schedule.repeat_on).filter(e => e).length == 0) {
          this.toastr.error('Please select day of week')
        } else {
          schedule.repeat_option = 'on_day';
          this.dialogRefs.close();
        }
      } else if (schedule.repeat == 'custom_monthly') {
        if (schedule.month_date == '') {
          this.toastr.error('Please select month day')
        } else {
          let date = new Date();
          let todayDate = date.getDate();
          date.setDate(schedule.month_date);
          if (todayDate > date.getDate()) {
            date.setMonth(date.getMonth() + 1);
          }
          // schedule.start_date = date.getTime();
          // console.log(schedule.start_date)
          schedule.repeat_option = 'on_day';
          // schedule.repeat_tenure -= 1;
          this.dialogRefs.close();
        }
      } else if (schedule.repeat == "custom_yearly") {
        if (schedule.month_date == '' || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) {
          this.toastr.error('Please fill all details.')
        } else {
          schedule.repeat_on[schedule.repeat_on.name] = true;
          delete schedule.repeat_on.value;
          delete schedule.repeat_on.name;
          delete schedule.repeat_on.isCheckd;
          this.dialogRefs.close();
          this.customWeekDayList = [
            { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
          ];
        }
      }
      // }
    } else {
      this.dialogRefs.close();
    }


    // this.newCreatedEvent[this.scheduleRepeat.index].repeat = this.newCreatedEvent[this.scheduleRepeat.index].repeat_old;
    // this.newCreatedEvent[this.scheduleRepeat.index].repeat = null;
    // this.scheduleRepeat = {
    //   index: this.scheduleRepeat.index,
    //   startDate: this.scheduleDuration.startDate,
    //   endDate: this.scheduleDuration.endDate,
    //   repeat_tenure: 1,
    //   repeat: 'every_day',
    //   repeat_old: null,
    //   repeat_on: {
    //     monday : true,
    //     tuesday : true,
    //     wednesday : true,
    //     thursday : true,
    //     friday : true,
    //     saturday : true,
    //     sunday : true
    //   },
    //   repeat_option: 'on_day',
    //   repeat_checkoption: 'on_day'
    // };
    // this.scheduleDuration.startDate=this.scheduleRepeat.startDate;
    // const End=this.scheduleDuration.endDate;
    // if(End != null)
    // {
    //   const checkSDate=moment(this.scheduleDuration.startDate).format('YYYY-MM-DD');
    //   const checkEDate=moment(End).format('YYYY-MM-DD');
    //   if(checkSDate >checkEDate)
    //   {
    //     this.scheduleDuration.endDate= '';
    //   }
    // }
    // this.newCreatedEvent[this.scheduleRepeat.index].startDate = this.scheduleRepeat.startDate;
    // this.newCreatedEvent[this.scheduleRepeat.index].endDate = this.scheduleRepeat.endDate;
    // this.newCreatedEvent[this.scheduleRepeat.index].repeat_tenure = this.scheduleRepeat.repeat_tenure;
    // this.newCreatedEvent[this.scheduleRepeat.index].repeat = this.scheduleRepeat.repeat;
    // this.newCreatedEvent[this.scheduleRepeat.index].repeat_old = this.scheduleRepeat.repeat;
    // this.newCreatedEvent[this.scheduleRepeat.index].repeat_on = this.scheduleRepeat.repeat_on;
    // this.newCreatedEvent[this.scheduleRepeat.index].repeat_option = this.scheduleRepeat.repeat_option;
  }

  closeRepeatDialog(): void {
    this.dialogRefs.close();

    // this.newCreatedEvent[this.scheduleRepeat.index].repeat = this.new[this.scheduleRepeat.index].repeat_old;
    this.newCreatedEvent.repeat = null;
    this.scheduleRepeat = {
      index: this.scheduleRepeat.index,
      startDate: this.scheduleDuration.startDate,
      endDate: this.scheduleDuration.endDate,
      repeat_tenure: 1,
      repeat: 'every_day',
      repeat_old: null,
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
      repeat_checkoption: 'on_day'
    };
  }

  weekDayChanged(e) {

    /* let schedule = this.newCreatedEvent[this.scheduleRepeat.index]
 
     let scheduleRepeatTenure =  schedule.repeat_tenure;
 
     let repeatDay = Object.entries(schedule.repeat_on).filter((e,i)=>e).filter(e=>e[1]).map(e=>e[0])
     
     let finalString = `Activity will occure every ${scheduleRepeatTenure} ${scheduleRepeatTenure==1?'week':'weeks'} ${repeatDay.length>0?'on':''} 
     ${repeatDay.length>1?repeatDay.slice(0,repeatDay.length-1).toString():repeatDay.slice(0,repeatDay.length).toString()} ${repeatDay.length>1?'and':''} ${repeatDay.length>1?repeatDay[repeatDay.length-1]:''}`
 
     this.careString = finalString*/


    let checkData = true;
    for (const [key, value] of Object.entries(this.scheduleRepeat.repeat_on)) {
      if (!value) {
        checkData = false;
        break;
      }
    }
    if (!checkData) {
      this.scheduleRepeat.repeat = 'every_week';
    } else {
      this.scheduleRepeat.repeat = 'every_day';
    }
  }

  valuechange(event){
  if(this.newCreatedEvent.title && this.newCreatedEvent.description){
    this.setDescription();
  }
}
  updateLocationTimeChanged(timeData, event) {
    // console.log(timeData)
    let timeendDisp;
    this.timeEdited = true;
    // const timeendDisp = moment(event.value).add(15, 'minutes').toDate();
    // this.editSchedule.endTime = moment(this.editSchedule.startTime).add(15, 'minutes').tz(this.userLocalTimeZone).format();
    // console.log("event>>>>",event.value)
    if(moment(event.value).tz(this.userLocalTimeZone).format("HH:mm") == moment().set({hour: 23, minute:45}).format("HH:mm")) {
      timeendDisp = moment(event.value).add(59, 'minutes').tz(this.userLocalTimeZone).format("YYYY-MM-DDTHH:mm");
    } else {
      timeendDisp = moment(event.value).add(60, 'minutes').tz(this.userLocalTimeZone).format("YYYY-MM-DDTHH:mm");
    }
    //const timeendDisp = moment( timeData.start_time ).add((careVal.max) ? careVal.max : 30, 'minutes').toDate();
    timeData.end_time = timeendDisp;
    timeData.start_time = event.value;
    // if(typeof (this.timeData.start_time) === 'object'){
    //   // console.log("inside start")
    //   var startDatetime = new Date(this.timeData.start.getFullYear(), this.timeData.start.getMonth(), this.timeData.start.getDate(), 
    //   this.timeData.start_time.getHours(), this.timeData.start_time.getMinutes(), this.timeData.start_time.getSeconds());
    //  this.newCreatedEvent.start_time = moment(this.newCreatedEvent.start_time).tz(this.userLocalTimeZone, true).format("HH:mm");


    // }
    // if(typeof (this.newCreatedEvent.end_time) === 'object'){
    //   // console.log("inside end")

    //   var endDatetime = new Date(this.newCreatedEvent.end.getFullYear(), this.newCreatedEvent.end.getMonth(), this.newCreatedEvent.end.getDate(), 
    //   this.newCreatedEvent.end_time.getHours(), this.newCreatedEvent.end_time.getMinutes(), this.newCreatedEvent.end_time.getSeconds());
    //   // console.log(this.events);
    //   this.events[objIndex].end = endDatetime;
    //   this.refresh.next();
    //  this.newCreatedEvent.end_time = moment(this.newCreatedEvent.end_time).tz(this.userLocalTimeZone, true).format("HH:mm");


    // } 
  }

  async addLocationPopup() {
   
    // this.faclist  = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    // dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    dialogConfig.panelClass = 'carepopup';
    this.dialogRefs = this.dialog.open(AddLocationComponent, dialogConfig);
    this.dialogRefs.afterClosed().subscribe((result:any) => {
      if(result){
        this.getAllLocation(this.newCreatedEvent.onGround);
      }
    });
    // this.router.navigate(['/announcement/form']);
  }

  async done() {
    /* Start Validations */
    let checkForm = 'VALID';
    const currentDate = new Date();
    // console.log(this.newCreatedEvent)


    /* End Validations */
    let repeatValidation;
    const activityData = [];
        if (this.newCreatedEvent.repeat == null) repeatValidation = true;

         
          const timediff = (moment(this.newCreatedEvent.end_time).valueOf() - moment(this.newCreatedEvent.start_time).valueOf()) / 1000;
          const startH = moment(this.newCreatedEvent.start_time).format('HH');
          const startM = moment(this.newCreatedEvent.start_time).format('mm');
          const startDayH = "00";
          const startDayM = "00";
          const startDayDate = moment(moment(this.newCreatedEvent.start_date).startOf("day"));//moment.tz(item.startDate,this.timezone);
          const endDayDate = this.newCreatedEvent.end_date ? moment(moment(this.newCreatedEvent.end_date).startOf("day")) : null;//moment.tz(item.startDate,this.timezone);

          // tslint:disable-next-line: radix
          // startDayDate.set({ hour: parseInt(startDayH), minute: parseInt(startDayM), second: 0, millisecond: 0 });
          // const startDaydate = startDayDate.utc().valueOf();
          const startDate = moment(moment(this.newCreatedEvent.start_date).startOf("day"));

          // tslint:disable-next-line: radix
          startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
          const startdate = startDate.valueOf();

          let enddate = null;
          if (this.newCreatedEvent.end_time) {
            // this.scheduleDuration['ts_endDate'] = this.newCreatedEvent.end_date.tz(this.timezone, true).utc().valueOf();
            const endDate = this.newCreatedEvent.end_date ? moment(this.newCreatedEvent.end_date) : null;
            if(endDate){
              endDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
            }
            // const endDate = item.endDate.tz(this.timezone,true);
            // endDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
            enddate = endDate//endDate.utc().valueOf();
          }
          let repeatChkOption = this.newCreatedEvent.repeat;
          if(this.newCreatedEvent.repeat === "custom_monthly" || this.newCreatedEvent.repeat === 'never' || (this.newCreatedEvent.repeat == "every_month" && this.newCreatedEvent.repeat_option === "on_day") || (this.newCreatedEvent.repeat == "every_year" && this.newCreatedEvent.repeat_option === "on_day") ) {
            this.newCreatedEvent.repeat_on = {
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false
            };
          }
          if (this.newCreatedEvent.repeat === 'never') {
            enddate = moment(moment(this.newCreatedEvent.start_date).endOf("day")).valueOf();
            // enddate = moment(moment(item.s| titlecasetartDate).endOf("day")).valueOf();
          } else {
            if (this.newCreatedEvent.repeat_tenure !== 1 || this.newCreatedEvent.repeat_option !== 'on_day' ||
              // tslint:disable-next-line: max-line-length
              (!this.newCreatedEvent.repeat_on.monday || !this.newCreatedEvent.repeat_on.tuesday || !this.newCreatedEvent.repeat_on.wednesday || !this.newCreatedEvent.repeat_on.thursday || !this.newCreatedEvent.repeat_on.friday || !this.newCreatedEvent.repeat_on.saturday || !this.newCreatedEvent.repeat_on.sunday)) {
              repeatChkOption = 'custom';
            }
          }
          if(this.newCreatedEvent.repeat == "every_month" && (this.newCreatedEvent.repeat_option == "on_week_number" || this.newCreatedEvent.repeat_option === "on_last_week")) {
            let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            let d = new Date(this.newCreatedEvent.start_date);
            let dayName = days[d.getDay()];
            var key = dayName;
            var obj = {
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false
            };
            obj[key] = true;
            this.newCreatedEvent.repeat_on = obj;
          }
          if(this.newCreatedEvent.repeat == "every_day") {
            this.newCreatedEvent.repeat_on = {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: true,
              sunday: true
            }
          }
          // // console.log('---end date after------',enddate,enddate.format('LLLL z'),enddate.valueOf())
          if (enddate && (moment(startdate).tz(this.timezone, true).valueOf() > moment(enddate).tz(this.timezone, true).valueOf())) {
            this.toastr.error('End date should be greater than start date.');
            return;
          }
          if (this.newCreatedEvent.title == '' ) {
            this.toastr.error(`Title can't be empty `);
            return;
          }
          if (!this.newCreatedEvent.description) {
            this.toastr.error(`Description can't be empty `);
            return;
          }
          if (!this.newCreatedEvent.location) {
            this.toastr.error(`Location can't be empty `);
            return;
          }

          if (!this.newCreatedEvent.building.length) {
            this.toastr.error(`Building can't be empty `);
            return;
          }
          

        //     // get shiftnumber
        // let start_time = moment(startDayDate).tz(this.timezone, true).valueOf();
        // let findShift =  this.shiftno.filter(x=>{ return x.start_time ==moment(startdate).tz(this.timezone, true).valueOf() && x.end_time == moment(startdate).tz(this.timezone, true).valueOf() + timediff })
        // findShift[0].shiftNumber
        if (this.newCreatedEvent.start_time == null || this.newCreatedEvent.end_time == null) {
          this.toastr.error('Start time or end time cannot be blank.');
          this._commonService.setLoader(false);
          return;
        }
        if (this.newCreatedEvent.start_time == 'Invalid date' || this.newCreatedEvent.end_time == 'Invalid date') {
          this.toastr.error('Start time or end time cannot be blank.');
          this._commonService.setLoader(false);
          return;
        }
        if (moment.tz(this.newCreatedEvent.start_time, this.timezone).unix() >= moment.tz(this.newCreatedEvent.end_time, this.timezone).unix()) {
          this.toastr.error('End time cannot be less than or equals to start time.');
          this._commonService.setLoader(false);
          return;
        }
        // // console.log('------saveing time-----',timeData.start_time,moment(timeData.start_time).tz(this.timezone,true).format(),this.newCreatedEvent.start_date)
        const isPastTime = this.isPastTime(this.newCreatedEvent.start_time, this.newCreatedEvent.start_date)
        if(!this.editForm){
          if (isPastTime == true) {
            this.toastr.error('You cannot select past time.');
            this._commonService.setLoader(false);
            return;
            // this.newCreatedEvent['minDate'] = moment(this.newCreatedEvent['minDate']).add(1, 'd').toDate();
            // this.newCreatedEvent['start_date'] = moment(this.newCreatedEvent['start_date']).add(1, 'd').toDate();
          }
        }

        console.log("Time",this.newCreatedEvent.time);
        
        if(!this.newCreatedEvent.time.length){
          if(this.timeEdited){
            this.newCreatedEvent.start_time = moment(this.newCreatedEvent.start_time).tz(this.userLocalTimeZone, true).format("HH:mm");
          this.newCreatedEvent.end_time = moment(this.newCreatedEvent.end_time).tz(this.userLocalTimeZone, true).format("HH:mm");
          }
          if(typeof (this.newCreatedEvent.end_time) === 'object'){
            this.newCreatedEvent.end_time = moment(this.newCreatedEvent.end_time).tz(this.userLocalTimeZone, true).format("HH:mm");
            
          }
          
        this.newCreatedEvent.time.push({start : this.newCreatedEvent.start_time, end : this.newCreatedEvent.end_time});
        }

        if(this.newCreatedEvent.time.length){
          let start_time = moment(this.newCreatedEvent.start_time).tz(this.userLocalTimeZone, true).format("HH:mm");
          let end_time = moment(this.newCreatedEvent.end_time).tz(this.userLocalTimeZone, true).format("HH:mm");
          console.log("Start End", start_time, end_time);
          const _foundTimeIndex = this.newCreatedEvent.time.findIndex(t => t.start.toString() == start_time.toString());
          console.log("_foundTimeIndex", _foundTimeIndex);
          if(_foundTimeIndex === -1 && start_time !== 'Invalid date' && end_time !== 'Invalid date'){
            this.newCreatedEvent.time.push({ start: start_time, end: end_time});
          }
        }
        console.log("Activity",this.newCreatedEvent);

        const activity = { 
          org_id: this.organization,
          fac_id: this.facility,
          start: moment(startDayDate).tz(this.timezone, true).valueOf(),
          end: endDayDate ? moment(endDayDate).tz(this.timezone, true).valueOf() : null,
          repeat:  this.newCreatedEvent.repeat,
          repeat_checkoption: repeatChkOption,
          repeat_on: this.newCreatedEvent.repeat_on,
          repeat_tenure: this.newCreatedEvent.repeat_tenure,
          repeat_option: this.newCreatedEvent.repeat_option,
          // duration: timediff,
          category: this.newCreatedEvent.category,
          title: this.newCreatedEvent.title, 
          description: this.newCreatedEvent.description,
          time : this.newCreatedEvent.time,
          location: this.newCreatedEvent.location,
          location_room: this.newCreatedEvent.location_room,
          building: this.newCreatedEvent.building,
          month_date: this.newCreatedEvent.month_date ? this.newCreatedEvent.month_date : null,
        }

        // console.log(activity)
        activityData.push(activity);

    if (repeatValidation == true) {
      this._commonService.setLoader(false);
      this.toastr.error('Select repeat.');
      return;
    }
    this._commonService.setLoader(true);
    if(!this.editForm){
      console.log("Activity Data",activityData);
      await this.apiService.apiFn({ type: 'POST', target: 'activitySchedule/add' }, activityData)
      .then((result: any) => {
        // console.log(result);
        if (result['status']) {
          this.toastr.success('Activity added successfully!');
          this._router.navigate(['/activity-scheduling']);
        } else {
          this._commonService.setLoader(false);
          this.toastr.error('Unable to save Activity. Please check again!');
        }
      })
      .catch((error) =>{
        this._commonService.setLoader(false);
        this.toastr.error('Unable to save Activity. Please check again!');
      } )
    }else{
      const payload = {
        _id: this.newCreatedEvent['_id'],
        // org_id: this.organization,
          fac_id: this.facility,
          start: moment(startDayDate).tz(this.timezone, true).valueOf(),
          end: endDayDate ? moment(endDayDate).tz(this.timezone, true).valueOf() : null,
          repeat:  this.newCreatedEvent.repeat,
          repeat_checkoption: this.newCreatedEvent.repeat_checkoption,
          repeat_on: this.newCreatedEvent.repeat_on,
          repeat_tenure: this.newCreatedEvent.repeat_tenure,
          repeat_option: this.newCreatedEvent.repeat_option,
          title: this.newCreatedEvent.title, 
          description: this.newCreatedEvent.description,
          time : this.newCreatedEvent.time,
          category: this.newCreatedEvent.category,
          location: this.newCreatedEvent.location,
          building: this.newCreatedEvent.building ,
          month_date:  null,
      }
      payload['_id'] = this.newCreatedEvent['_id'];
      payload['time'] = payload['time'][0];
      payload['isOccurrence'] = false;
      payload['activity_date'] = +(this.scheduleDate);
      console.log("payload------", payload);
      await this.apiService.apiFn({ type: 'POST', target: 'activitySchedule/update' }, payload)
      .then((result: any) => {
        // console.log(result);
        if (result['status']) {
          this.toastr.success('Activity updated successfully!');
          sessionStorage.removeItem('scheduleDate')
          this._router.navigate(['/activity-scheduling/day_list', this.scheduleDate])
        } else {
          this._commonService.setLoader(false);
          this.toastr.error('Unable to edit Activity. Please try again!');
        }
      })
      .catch((error) =>{
        this._commonService.setLoader(false);
        this.toastr.error('Unable to edit Activity. Please try again!');
      } )
    }
  
  }

  selectedRoom(location, room){
    console.log("Location & Room ----", location, room);
    this.newCreatedEvent.location = location._id;
    this.newCreatedEvent.location_room = room;
  }

  changeOnGround(onGround, event){

      this.getAllLocation(onGround)
  }


}
