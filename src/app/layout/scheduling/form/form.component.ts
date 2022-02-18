import { Component, OnInit, TemplateRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from './../../../shared/services/common.service';
import { ApiService } from './../../../shared/services/api/api.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig, MatOption,MatCheckboxModule, MatDialogState } from '@angular/material';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
// import { RepeatCareComponent } from '../repeat-care-dialog/repeat-care.component';
import {
  startOfMonth, startOfDay, startOfWeek, addWeeks, endOfDay, subDays, addDays, endOfMonth, endOfWeek, isSameDay,
  isSameMonth, addHours, addMinutes, addSeconds, format
} from 'date-fns';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { element } from 'protractor';
import { Item } from 'angular2-multiselect-dropdown';
import { RepeatDialogComponent } from 'src/app/shared/modals/repeatdialog/repeat-dialog.component';
import { CustomWeeklyComponent } from 'src/app/shared/modals/customweekly/customweekly.component';
import { CustomMonthlyComponent } from 'src/app/shared/modals/custommonthly/custommonthly.component';
import { CustomYearlyComponent } from 'src/app/shared/modals/customyearly/customyearly.component';
import * as medpass from './../../../shared/medpass/medpass.json';
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
  // directives: [RepeatCareComponent],
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
  minDate: Date;
  minDateEnd: Date;
  subscription: Subscription;
  organization; facility;
  duplicateCare: boolean = false;
  _duplicateCares: any[] = [];
  _copyDuplicateCare: any[] = [];
  duplicateCancel: boolean;
  timezone;
  shift;
  medpass;
  shiftSelected = [];
  medPassSelected = [];
  SelectedShift;
  SelectedMedPass;
  saveSelectedShift :boolean;
  saveSelectedMedpass :boolean;
  shiftno = [];
  shiftStartTime;
  shiftEndTime
  medPassno = [];
  medPassStartTime;
  medPassEndTime;
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
  thirdEdit = false;
  thirddisable = true;
  afterpreview = false;
  afterpreview2 = false;
  thirdEditOption = false;
  step = 0;
  step2 = 0;
  isDisabledCare = true;
  isDisabledDuration = true;
  dialogRefs = null;
  panelOpenState;
  allNewCareData: any[] = [];
  @ViewChild('callRepeatDialog', {static: true}) callRepeatDialog: TemplateRef<any>;
  @ViewChild('repeatChangeDialog', {static: true}) repeatChangeDialog: TemplateRef<any>;
  @ViewChild('customweekly', {static: true}) customweekly: TemplateRef<any>;
  @ViewChild('custommonthly', {static: true}) custommonthly: TemplateRef<any>;
  @ViewChild('customyearly', {static: true}) customyearly: TemplateRef<any>;
  @ViewChild('duplicateCareDialog', {static: true}) duplicateCareDialog: TemplateRef<any>;

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

  addTimeOptions: any = [
    { key: 'time', value: 'Time' },
    { key: 'shift', value: 'Shift' },
    { key: 'medpass', value: 'MedPass'}
  ];

  weekList: any = [
    { key: 'Week', value: 1 }, { key: '2 Weeks', value: 2 }, { key: '3 Weeks', value: 3 }, { key: '4 Weeks', value: 4 }, { key: '5 Weeks', value: 5 }, { key: '6 Weeks', value: 6 }, { key: '7 Weeks', value: 7 },
    { key: '8 Weeks', value: 8 }, { key: '9 Weeks', value: 9 }, { key: '10 Weeks', value: 10 }, { key: '11 Weeks', value: 11 }, { key: '12 Weeks', value: 12 }, { key: '13 Weeks', value: 13 }, { key: '14 Weeks', value: 14 }, { key: '15 Weeks', value: 15 }, { key: '16 Weeks', value: 16 }, { key: '17 Weeks', value: 17 }, { key: '18 Weeks', value: 18 }, { key: '19 Weeks', value: 19 }, { key: '20 Weeks', value: 20 }, { key: '21 Weeks', value: 21 }, { key: '22 Weeks', value: 22 }, { key: '23 Weeks', value: 23 }, { key: '24 Weeks', value: 24 }, { key: '25 Weeks', value: 25 }, { key: '26 Weeks', value: 26 }, { key: '27 Weeks', value: 27 }, { key: '28 Weeks', value: 28 }, { key: '29 Weeks', value: 29 }, { key: '30 Weeks', value: 30 }, { key: '31 Weeks', value: 31 }, { key: '32 Weeks', value: 32 }
  ]

  selectedResidentList = [];
  selectedResident: any = {
    resident_id: '',
    note: ''
  };

  selectedCareList = [];
  selectedCareTime = [];
  careType: '';
  selectedCare: any = {
    care_id: '',
    note: '',
    user_id: '',
    subCare: false,
  };
  timeArray = [];
  schedularFormGroup: FormGroup;
  scheduleDuration: any = [{
    startDate: new Date(),
    endDate: null,
  }];
  // scheduleDuration = {
  //   startDate: new Date(),
  //   endDate: null,
  // };

  scheduleRepeat: any = {
    index: null,
    startDate: null,
    // startDate : new Date(),
    endDate: null,
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
  medPassSearch = '';
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
  activeClassIndex = "";
  shiftArr;
  medPassArr;
  // noPast = false;

  weekDayList = [
    { value: 'Sun', isCheckd: true }, { value: 'Mon', isCheckd: true }, { value: 'Tues', isCheckd: true }, { value: 'Wed', isCheckd: true },
    { value: 'Thurs', isCheckd: true }, { value: 'Fri', isCheckd: true }, { value: 'Sat', isCheckd: true },
  ];

  customWeekDayList = [
    { value: 'Sun', isCheckd: true, name: 'sunday' }, { value: 'Mon', isCheckd: true, name: 'monday' }, { value: 'Tues', isCheckd: true, name: 'tuesday' }, { value: 'Wed', isCheckd: true, name: 'wednesday' }, { value: 'Thurs', isCheckd: true, name: 'thursday' }, { value: 'Fri', isCheckd: true, name: 'friday' }, { value: 'Sat', isCheckd: true, name: 'saturday' },
  ];

  monthList = [{ key: 'Month', value: 1 }, { key: '2 Months', value: 2 }, { key: '3 Months', value: 3 }, { key: '4 Months', value: 4 }, { key: '5 Months', value: 5 }, { key: '6 Months', value: 6 }, { key: '7 Months', value: 7 }, { key: '8 Months', value: 8 }, { key: '9 Months', value: 9 }, { key: '10 Months', value: 10 }, { key: '11 Months', value: 11 }, { key: '12 Months', value: 12 }];

  yearList = [{ key: 'Year', value: 1 }, { key: '2 Years', value: 2 }, { key: '3 Years', value: 3 }, { key: '4 Years', value: 4 }, { key: '5 Years', value: 5 }, { key: '6 Years', value: 6 }, { key: '7 Years', value: 7 }, { key: '8 Years', value: 8 }, { key: '9 Years', value: 9 }, { key: '10 Years', value: 10 }];

  monthNameList = [{ key: 'January', value: 1 }, { key: 'February', value: 2 }, { key: 'March', value: 3 }, { key: 'April', value: 4 }, { key: 'May', value: 5 }, { key: 'June', value: 6 }, { key: 'July', value: 7 }, { key: 'August', value: 8 }, { key: 'September', value: 9 }, { key: 'October', value: 10 }, { key: 'November', value: 11 }, { key: 'December', value: 12 }];

  customRepeat = [{ key: 'First', value: 'on_day' }, { key: 'Second', value: 'on_second_day' }, { key: 'Third', value: 'on_third_day' }, { key: 'Forth', value: 'on_forth_day' }, { key: 'Fifth', value: 'on_fifth_day' }, { key: 'Last', value: 'on_last_day' }];

  monthDayList = Array.from({ length: 31 }, (_, i) => i + 1).map(e => ({ name: `${e}${this.dateFormat2(e)}`, value: e }));

  careString = ''
  @ViewChild('selectedShift', {static: true}) private selectedShift: MatOption
  @ViewChild('selectedMedPass', {static: true}) private selectedMedPass: MatOption
  constructor(
    private _formBuilder: FormBuilder,
    private _commonService: CommonService,
    private _router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {
    //this.minDate       = Date;
    //this.minDateEnd    =  Date;
    //this.careStartDate =  Date;
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
  dayNamesShort(date) {
    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    var d = new Date(date);
    return days[d.getDay()];
  }

  onChange(event) {
  }
  /* Toggle for manage Parent cares open/close  */
  activeToggler(selectedIndex,event) {
    event.stopPropagation();
    this.activeClassIndex = (this.activeClassIndex == selectedIndex) ? null : selectedIndex;
  }

  arrayNumber(n: number): number[] {
    const arrayD = Array(n).fill(n, 0, n).map((x, i) => i + 1);
    return arrayD;
  }
  compareDate(m) {
    return m.minutes() + m.hours() * 60;
  }

  setStep(index: number) {
    this.step = index;
  }
  setStep2(index: number) {
    this.step2 = index;
  }

  ngOnInit() {

    let shiftList = this._commonService.shiftTime();
    this.shiftArr = [...shiftList];
    const med: any = (JSON.stringify(medpass));
    this.medPassArr = JSON.parse(med).default;

    if (!this._commonService.checkPrivilegeModule('scheduling', 'add')) {
      this._router.navigate(['/']);
    }
    this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
      console.log("content data >>>>>",contentVal)
      this._commonService.setLoader(true);
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;
        this.scheduleRepeat.startDate = this.getCurrentDateFromTimezone()//moment.tz(this.timezone).format()
        this.getAllresidents();
        this.getAllusers();
        this.getAllcares();

        this._commonService.setLoader(false);
      }
    });

    this.schedularFormGroup = this._formBuilder.group({
      residentList: this._formBuilder.array([])
    });

  }

  selectAllShift() {

    if (this.selectedShift.selected) {
      this.shift.forEach(element => {
        element.select();
      })
    }
  }

  selectAllMedpass() {

    if (this.selectedMedPass.selected) {
      this.medpass.forEach(element => {
        element.select();
      })
    }
  }

  async changeMedpass(medpass, ci, i) {
    console.log("Medpass",medpass, ci, i);
    let newDate1 = moment();
    let newDate2 = moment();
    if (medpass.name == '') {
      newDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    }
    if (medpass.name == 'Early AM') {
      newDate1.set({ hour: 4, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      console.log("Date 1, Date 2",newDate1, newDate2);
    }
    if (medpass.name == 'AM') {
      newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    }
    if (medpass.name == 'Noon') {
      newDate1.add().set({ hour: 11, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    }
    if (medpass.name == 'Evening') {
      newDate1.set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });
    }
    if (medpass.name == 'Bedtime') {
      newDate1.set({ hour: 20, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    }
    let sIndex = this.medPassSelected.findIndex(x => { if(x.medPassNumber == medpass.name){return true}});
    console.log("S index",sIndex);
    if (sIndex > -1) {
      this.medPassSelected.splice(sIndex, 1);
    }else{
      this.medPassSelected.push({
        medPassNumber: medpass.name,
        startTime: moment(newDate1).tz(this.userLocalTimeZone, true).format(),
        endTime: moment(newDate2).tz(this.userLocalTimeZone, true).format()
      });
      console.log("Medpass Selected",this.medPassSelected);
    }
    // }
  }

  async changeShift(shift, ci, i) {
  
    let newDate1 = moment();
    let newDate2 = moment();
    if (shift.no == 0) {
      newDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    }
    if (shift.no == 1) {
      newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      console.log("Date 1, Date 2",newDate1, newDate2);
    }
    if (shift.no == 2) {
      newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    }
    if (shift.no == 3) {
      newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      newDate2.add(1, 'days').set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    let sIndex = this.shiftSelected.findIndex(x => { if(x.shiftNumber == shift.no){return true}});
    console.log("S index",sIndex);
    if (sIndex > -1) {
      this.shiftSelected.splice(sIndex, 1);
    }else{
      this.shiftSelected.push({
        shiftNumber: shift.no,
        startTime: moment(newDate1).tz(this.userLocalTimeZone, true).format(),
        endTime: moment(newDate2).tz(this.userLocalTimeZone, true).format()
      })
    }
    // }
  }

  startDateChangeEvent(type: string, event: any, ci) {
    // console.log('-----in event----------------',event.value,ci,this.selectedCareList)
    console.log('this.selectedCareList[ci]>>>>',this.selectedCareList[ci],"event.value>>>",event.value)
    if (this.selectedCareList[ci]) {
      this.selectedCareList[ci].startDate = event.value;
      this.selectedCareList[ci].minDateEnd = event.value;
    }

    if (this.scheduleRepeat.startDate) this.scheduleRepeat.startDate = event.value;
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
    if(this.selectedCareList[ci].repeat === "every_week") {
      this.repeatChanged(ci);
    }
  }

  endDateChangeEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    this.scheduleRepeat.endDate = event.value;
  }

  async getAllresidents() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'residents/get_res_org' },
      { 'organization': [this.organization], 'facility': [this.facility],
      //  'filter': 'by_schedule_care' 
      }
    )
      .then(async (result: any) => {
        if (result['success'] && result['data']) {
          this.residentslist = [];
          await result['data'].map((obj, index) => {
            if (obj.room) {
              this.residentslist.push({
                'name': obj['last_name'] + ', ' + (obj['first_name'])/*.substr(0, 1)*/,
                'unit': (obj['room']) ? obj['room']['room'] : '',
                'value': obj._id,
                'notes': obj.notes,
                'care_level': (obj.care_level && obj.care_level.name) ? obj.care_level.name : '-'
              });
            }
          });

          this.residentslist.sort(function (a, b) {
            const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0; // default return value (no sorting)
          });
        }
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
  }

  async getAllusers() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'users/get_users_org_fac' },
      { 'organization': [this.organization], 'facility': [this.facility] }
    )
      .then(async (result: any) => {
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
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
  }

  async getAllcares() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'cares/getCares' },
      { 'type_not_in': ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'], "isSchedule": true,'organization': this.organization,'facility' : this.facility }
    )
      .then((result: any) => {
        this.carelistData = result['data'];
        this.carelist = this.carelistData;
        console.log("this.carelist after response>>>>>>>",this.carelist)
        this.carelist.filter(obj=> {
          obj['key'] = obj._id ? obj._id : "";
          obj['value'] = obj.name ? obj.name : "";
          obj['subCares'] = obj.subCares ? obj.subCares : [],
          obj['image'] =(obj.image && obj.image.location) ? obj.image.location : "";
          if(obj.subCares && obj.subCares.length) {
            obj.subCares.filter(data=> {
              data['key'] = data._id;
              data['value'] = data.name ? data.name : "";
              data['subCare'] = true;
              data['parentCareId']= obj._id ? obj._id : "";
              data['image'] = (data.image && data.image.location) ? data.image.location : "";
            })
          }
        })
        /* Start Manage Sub cares */
        // let parentCares = [];
        // let childCares = [];
        // let mainCareArray = [];
        // let assignedFound = [];
        // let medDetails = this.carelistData.find(el => el.name == 'Medication');
        // let skipedSubCare = this.carelistData.map(el => {
        //   if (el.name == 'Virus Check' || el.name == 'Room Cleaning') return el._id;
        // });
        // skipedSubCare = skipedSubCare.filter(el => el != undefined);
        // parentCares = this.carelistData.filter(obj => (obj.parentCareId == null || obj.parentCareId == medDetails._id) && obj.name != 'Medication' && obj.name != 'Vitals');
        // childCares = this.carelistData.filter(obj => obj.parentCareId !== null && !skipedSubCare.includes(obj.parentCareId));
        // let subCareList = [];
        // let subCare: any;
        // mainCareArray = parentCares.map((obj) => {
        //   const robj: any = {
        //     'key': obj._id ? obj._id : "",
        //     'value': obj.name ? obj.name : "",
        //     'subCares': [],
        //     'image': (obj.image && obj.image.location) ? obj.image.location : "",
        //   };
        //   if (childCares && childCares.length) {
        //     assignedFound = childCares.filter((el) => el.parentCareId === obj._id);
        //     mainCareArray = assignedFound.map((obj2) => {
        //       if (obj2.name != 'Comments') {
        //         subCare = {
        //           'key': obj2._id ? obj2._id : "",
        //           'value': obj2.name ? obj2.name : "",
        //           'subCare': true,
        //           'parentCareId': obj._id ? obj._id : "",
        //           'image': (obj2.image && obj2.image.location) ? obj2.image.location : "",
        //         }
        //         subCareList.push(subCare);
        //         subCare = {};
        //       }
        //     })
        //   }
        //   robj['subCares'] = subCareList;
        //   subCareList = [];
        //   return robj;
        // });
        // this.parentCareGroupGroups = mainCareArray
        // this.carelist = mainCareArray
        this.carelist.filter(item=> {
          if(item.subCares && item.subCares.length > 0) {
            item['hasSubCares'] = true;
          } else {
            item['hasSubCares'] = false;
          }
        })
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
    /* End Manage Sub cares */
  }

  goSchedular() {
    this._router.navigate(['/scheduling']);
  }

  goForward(type) {
    if (type === 'cancel') {
      this.firstEditOption = true;
      this.secondEdit = false;
      this.seconddisable = true;
      this.showAddedcares = false;
      this.thirdEdit = false;
      this.thirddisable = true;
      this.selectedCareList = [];
      this.selectedResidentList = [];
      this.setStep(0);
      this.setStep2(0);
      this.isDisabledDuration = true;
      this.isDisabledCare = true;
      this.getAllresidents();
      this.getAllusers();
      this.getAllcares();
    }

    if (type === 'resident') {
      this.firstEdit = true;
      this.firstEditOption = this.secondEdit = false;
      this.thirdEdit = false;
    }

    if (type === 'care' && this.selectedResidentList.length) {
      this.firstEditOption = this.secondEdit = true;
      this.firstEdit = this.seconddisable = false;
      this.showAddedcares = false;
      this.thirdEdit = false;
    }

    if (type === 'duration' && this.selectedCareList.length) {
      this.selectedCareList.map((item, i) => {
        if (!this.selectedCareList[i].time) {
          this.selectedCareList[i].time = [];
        }
        if (!this.selectedCareList[i].repeat) {
          this.selectedCareList[i].repeat = '';
        }
        if (!this.selectedCareList[i].startDate) {
          this.selectedCareList[i].startDate = new Date;
        }
        if (!this.selectedCareList[i].minDate) {
          this.selectedCareList[i].minDate = new Date;
        }
        if (!this.selectedCareList[i].minDateEnd) {
          this.selectedCareList[i].minDateEnd = new Date;
        }

      });
      this.secondEditOption = true;
      this.afterpreview = false;
      this.secondEdit = false;
      this.showAddedcares = true;
      this.thirddisable = false;
      this.thirdEdit = true;

      this.afterpreview2 = true;
    }

    if (type === 'done') {
      let checkForm = 'VALID';
      const currentDate = new Date();

      this.selectedCareList.map((item, i) => {
        if (item.repeat === '') {
          checkForm = 'REPEAT';
          return checkForm;
        }
        if (item.time.length) {
          item.time.map((time: any) => {
            if (time.startTime === '' || time.endTime === '') {
              checkForm = 'SETIME';
              return checkForm;
            }
            if (moment(time.startTime).unix() >= moment(time.endTime).unix()) {
              checkForm = 'SEGTIMEPAST';
              return checkForm;
            }
            if (item.endDate) {
              if (startOfDay(item.startDate).valueOf() > startOfDay(item.endDate).valueOf()) {
                checkForm = 'SEGDATE';
                return checkForm;
              }
            }
            // check past time validation            
            const isPastTime = this.isPastTime(time.endTime, item.startDate)
            if (isPastTime == true) {
              checkForm = 'PASTTIME';
              return checkForm;
            }
          });
        } else {
          checkForm = 'NOTIME';
        }
        // Set minimum date for display in preview
        if (i == 0) {
          this.careStartDate = item.startDate;
        } else {
          if (moment(this.careStartDate).isAfter(item.startDate, 'day')) {
            this.careStartDate = item.startDate
          }
        }
      });
      if (checkForm === 'VALID') {
        this.afterpreview = false;
        this.afterpreview2 = true;
        this.thirdEdit = false;
      } else {
        if (checkForm === 'SEGTIME') {
          this.toastr.error('Please select start time and end time.');
        } else if (checkForm === 'NOTIME') {
          this.toastr.error('Please select time for care.');
        } else if (checkForm === 'PASTTIME') {
          this.toastr.error('You cannot select past time.');
        } else if (checkForm === 'SEGDATE') {
          this.toastr.error('Start date cannot be greater than end date.');
        } else if (checkForm === 'SEGTIMEPAST') {
          this.toastr.error('End time cannot be less than or equals to start time.');
        } else {
          this.toastr.error('Please fill all fields');
        }
      }
    }

  }

  async deleteAssignedResident(residentID) {
    console.log('selectedResident.resident_id>>>>>',this.selectedResident);
    this.selectedResident.resident_id = undefined;
    for (let i = 0; i < this.selectedResidentList.length; i++) {
      if (this.selectedResidentList[i].resident.value === residentID) {
        this.residentslist.push(this.selectedResidentList[i].resident);
        this.selectedResidentList.splice(i, 1);
      }
    }
    /*  If no resident left then close second option */
    if (!this.selectedResidentList.length) {
      this.firstEditOption = true;
      this.secondEdit = false;
      this.seconddisable = true;
      this.showAddedcares = false;
      this.thirdEdit = false;
      this.afterpreview2 = false;
      this.thirddisable = true;
      this.getAllresidents();
      this.selectedResidentList = [];
      this.selectedCareList = [];
      this.setStep(0);
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
    this.toastr.success('Resident removed successfully');
  }

  async editAssignedResident(residentID) {
    for (let i = 0; i < this.selectedResidentList.length; i++) {
      if (this.selectedResidentList[i].resident.value === residentID) {
        this.residentslist.push(this.selectedResidentList[i].resident);
        this.selectedResident = {
          resident_id: this.selectedResidentList[i].resident.value,
          note: this.selectedResidentList[i].note
        };
        this.selectedResidentList.splice(i, 1);
      }
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
  }

  async addResidentSelect(selectedResident) {
    if (selectedResident.resident_id) {
      this.showerror = false;
      this.selectedResident = { resident_id: '', note: '' };
      for (let i = 0; i < this.residentslist.length; i++) {
        if (this.residentslist[i].value === selectedResident.resident_id) {
          this.selectedResidentList.push({
            resident: this.residentslist[i],
            note: this.residentslist[i].notes,
            care_level: this.residentslist[i].care_level
          });
          this.residentslist.splice(i, 1);
        }
      }
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('Resident added successfully');
        //this.goForward('care')
        /*  If any data change after click Preview button then revert it to Preview button */
        // if(this.afterpreview2 == true){
        //   this.afterpreview2 = false;
        //   this.thirdEdit     = true;
        // }
      }
      if (this.selectedResidentList.length && this.selectedResidentList.length > 0) {
        this.secondEdit = true;
        this.seconddisable = false;
        this.setStep(1);
        this.isDisabledCare = false;
        this.firstEditOption = false;
        //this.showAddedcares = false;
        //this.thirdEdit = false;
      }
    } else {
      this.showerror = true;
      this.toastr.error('Please select resident.');
      return;
    }
  }

  async assignResident(selectedResident) {
    if (selectedResident.resident_id) {
      this.showerror = false;
      this.selectedResident = { resident_id: '', note: '' };
      for (let i = 0; i < this.residentslist.length; i++) {
        if (this.residentslist[i].value === selectedResident.resident_id) {
          this.selectedResidentList.push({
            resident: this.residentslist[i],
            note: this.residentslist[i].notes
          });
          this.residentslist.splice(i, 1);
        }
      }
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('Resident added successfully');
        //this.goForward('care')
        /*  If any data change after click Preview button then revert it to Preview button */
        // if(this.afterpreview2 == true){
        //   this.afterpreview2 = false;
        //   this.thirdEdit     = true;
        // }
        if (this.selectedResidentList.length && this.selectedResidentList.length > 0) {
          this.secondEdit = true;
          this.seconddisable = false;
          this.setStep(1);
          this.isDisabledCare = false;
          this.firstEditOption = false;
          //this.showAddedcares = false;
          //this.thirdEdit = false;
        }
      }
    } else {
      this.showerror = true;
      this.toastr.error('Please select resident.');
      return;
    }
  }

  async deleteAssignedCare(careID) {
    for (let i = 0; i < this.selectedCareList.length; i++) {
      if (this.selectedCareList[i].care.key === careID && !this.selectedCareList[i].care.parentCareId) {
        this.carelist.push(this.selectedCareList[i].care);
        this.selectedCareList.splice(i, 1);
        break;
      } else if (this.selectedCareList[i].care.key === careID && this.selectedCareList[i].care.subCare === true) {
        for (let j = 0; j < this.carelist.length; j++) {
          if (this.carelist[j].key === this.selectedCareList[i].care.parentCareId) {
            this.carelist[j].subCares.push(this.selectedCareList[i].care);
            this.selectedCareList.splice(i, 1);
            break;
          }
        }
      }

    }
    if (!this.selectedCareList.length) {
      this.thirddisable = true;
      this.thirdEdit = false;
      this.afterpreview2 = false;
      this.setStep2(1);
      this.getAllcares();
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
    this.toastr.success('Care removed successfully');
  }

  async editAssignedCare(careID) {
    for (let i = 0; i < this.selectedCareList.length; i++) {
      if (this.selectedCareList[i].care.key === careID && !this.selectedCareList[i].care.parentCareId) {
        this.carelist.push(this.selectedCareList[i].care);
        this.selectedCare = {
          care_id: this.selectedCareList[i].care.key,
          note: this.selectedCareList[i].note,
          user_id: this.selectedCareList[i].user_id,
          timePopup: false
        };
        this.selectedCareList.splice(i, 1);
        break;
      } else if (this.selectedCareList[i].care.key === careID && this.selectedCareList[i].care.subCare === true) {
        for (let j = 0; j < this.carelist.length; j++) {
          if (this.carelist[j].key === this.selectedCareList[i].care.parentCareId) {
            this.carelist[j].subCares.push(this.selectedCareList[i].care);
            this.selectedCare = {
              care_id: this.selectedCareList[i].care.key,
              note: this.selectedCareList[i].note,
              user_id: this.selectedCareList[i].user_id,
              timePopup: false
            };
            this.selectedCareList.splice(i, 1);
            break;
          }
        }
      }
    }

    // for (let i = 0; i < this.selectedCareList.length; i++) {
    //   if (this.selectedCareList[i].care.key === careID ) {
    //     this.carelist.push(this.selectedCareList[i].care);
    //     this.selectedCare = {
    //       care_id: this.selectedCareList[i].care.key,
    //       note: this.selectedCareList[i].note,
    //       user_id: this.selectedCareList[i].user_id,
    //       timePopup: false
    //     };
    //     this.selectedCareList.splice(i, 1);
    //   }
    // }
    /* Disable Duration of care section if no Care left */
    if (!this.selectedCareList.length) {
      this.thirddisable = true;
      this.thirdEdit = false;
      this.setStep2(1);
      this.getAllcares();
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
    this.toastr.success('Care removed successfully');
  }

  async assignCareSelect(selectedCare) {
    if (selectedCare.care_id) {
      this.showerror = false;
      this.selectedCare = {
        care_id: '',
        note: '',
        user_id: '',
        image: ''
      };
      for (let i = 0; i < this.carelist.length; i++) {
        if (this.carelist[i].key === selectedCare.care_id) {
          this.selectedCareList.push({
            care: this.carelist[i],
            note: selectedCare.note,
            user_id: selectedCare.user_id,
            repeat: 'every_day',
            repeat_old: 'every_day',
            timePopup: false,
            startDate: this.scheduleRepeat.startDate,//moment(this.scheduleRepeat.startDate).tz(this.userLocalTimeZone,true),
            repeat_tenure: this.scheduleRepeat.repeat_tenure,
            repeat_on: this.scheduleRepeat.repeat_on,
            repeat_option: this.scheduleRepeat.repeat_option,
          });
          this.carelist.splice(i, 1);
        } else if (this.carelist[i].subCares && this.carelist[i].subCares.length) {
          for (let j = 0; j < this.carelist[i].subCares.length; j++) {
            if (this.carelist[i].subCares[j].key === selectedCare.care_id) {
              this.selectedCareList.push({
                care: this.carelist[i].subCares[j],
                note: selectedCare.note,
                user_id: selectedCare.user_id,
                repeat: 'every_day',
                repeat_old: 'every_day',
                timePopup: false,
                startDate: this.scheduleRepeat.startDate,//moment(this.scheduleRepeat.startDate).tz(this.userLocalTimeZone,true),
                repeat_tenure: this.scheduleRepeat.repeat_tenure,
                repeat_on: this.scheduleRepeat.repeat_on,
                repeat_option: this.scheduleRepeat.repeat_option,
              });
              this.carelist[i].subCares.splice(j, 1);
              break;
            }
          }
        }
      }
      if (this.toastr.currentlyActive === 0) this.toastr.success('Care added successfully');

      /* If one care is added then open duration section */
      if ((this.carelist.length || this.selectedCareList.length) && this.selectedResidentList.length) {
        this.selectedCareList.map((item, i) => {
          if (!this.selectedCareList[i].time) {
            this.selectedCareList[i].time = [];
          }
          if (!this.selectedCareList[i].repeat) {
            this.selectedCareList[i].repeat = '';
          }
          if (!this.selectedCareList[i].startDate) {
            this.selectedCareList[i].startDate = this.getCurrentDateFromTimezone()//moment(moment.tz(this.timezone).format()).tz(this.userLocalTimeZone,true);
          }
          if (!this.selectedCareList[i].minDate) {
            this.selectedCareList[i].minDate = this.getCurrentDateFromTimezone()//moment(moment.tz(this.timezone).format()).tz(this.userLocalTimeZone,true);
          }
          if (!this.selectedCareList[i].minDateEnd) {
            this.selectedCareList[i].minDateEnd = this.getCurrentDateFromTimezone()//moment(moment.tz(this.timezone).format()).tz(this.userLocalTimeZone,true);
          }
        });
        this.afterpreview = false;
        this.showAddedcares = true;
        this.thirddisable = false;
        this.thirdEdit = true;
        this.firstEditOption = false;
        this.secondEdit = true;
        this.seconddisable = false;
        this.showAddedcares = true;
        this.thirdEdit = true;
        // Open next section
        this.setStep2(2);
        this.isDisabledDuration = false;
        this.afterpreview2 = true;
      }
    } else {
      this.showerror = true;
      this.toastr.error('Please select care.');
      return;
      // if (this.toastr.currentlyActive === 0)
      //   this.toastr.error("Please select care")
    }
  }
  async assignCare(selectedCare) {
    if (selectedCare.care_id) {
      this.showerror = false;
      this.selectedCare = {
        care_id: '',
        note: '',
        user_id: '',
        image: ''
      };
      for (let i = 0; i < this.carelist.length; i++) {
        if (this.carelist[i].key === selectedCare.care_id) {
          this.selectedCareList.push({
            care: this.carelist[i],
            note: selectedCare.note,
            user_id: selectedCare.user_id,
            repeat: 'never',
            repeat_old: 'never',
            timePopup: false
          });
          this.carelist.splice(i, 1);
        } else if (this.carelist[i].subCares.length) {
          for (let j = 0; j < this.carelist[i].subCares.length; j++) {
            if (this.carelist[i].subCares[j].key === selectedCare.care_id) {
              this.selectedCareList.push({
                care: this.carelist[i].subCares[j],
                note: selectedCare.note,
                user_id: selectedCare.user_id,
                repeat: 'never',
                repeat_old: 'never',
                timePopup: false
              });
              this.carelist[i].subCares.splice(j, 1);
              break;
            }
          }
        }
      }
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('Care added successfully');
        /* If one care is added then open duration section */
        if (this.carelist.length && this.selectedResidentList.length) {
          this.selectedCareList.map((item, i) => {
            if (!this.selectedCareList[i].time) {
              this.selectedCareList[i].time = [];
            }
            if (!this.selectedCareList[i].repeat) {
              this.selectedCareList[i].repeat = '';
            }
            if (!this.selectedCareList[i].startDate) {
              this.selectedCareList[i].startDate = new Date;
            }
            if (!this.selectedCareList[i].minDate) {
              this.selectedCareList[i].minDate = new Date;
            }
            if (!this.selectedCareList[i].minDateEnd) {
              this.selectedCareList[i].minDateEnd = new Date;
            }

          });
          this.afterpreview = false;
          this.showAddedcares = true;
          this.thirddisable = false;
          this.thirdEdit = true;
          this.firstEditOption = false;
          this.secondEdit = true;
          this.seconddisable = false;
          this.showAddedcares = true;
          this.thirdEdit = true;
          // Open next section
          this.setStep2(2);
          this.isDisabledDuration = false;
          this.afterpreview2 = true;
        }
      }
    } else {
      this.showerror = true;
      this.toastr.error('Please select care.');
      return;
      // if (this.toastr.currentlyActive === 0)
      //   this.toastr.error("Please select care")
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
  }

  formatDateInDisplay(date) {
    if (date) return moment(date).tz(this.userLocalTimeZone, true).format('HH:mm')
    return null;
  }
  convertDateInLocal(date) {
    if (date) return moment(date).tz(this.userLocalTimeZone, true).format();
    return null
  }

  convertNext30MinuteInterval(timeSelected) {
    const remainder = (moment().tz(this.timezone).minute() % 30) - 30; //add time zone-----
    const dateTime = moment(timeSelected).tz(this.timezone).add(-remainder, "minutes").toDate(); // add time zone-----
    return dateTime;
  }

  onAddTimePopup(care_key, ci) {
    this.shift = '';
    this.medpass = '';
    const that = this;
    this.selectedCareList.map(function (value, i) {
      if (ci === i) {
        const careVal = that.carelistData.filter(entry => entry._id === care_key)[0];
        const timestartDisp = moment().tz(that.timezone).toDate(); // moment({ hour: 9 }); //add time zone
        const timeendDisp = moment().tz(that.timezone).add(30, 'minutes').toDate();// add time zone
        that.selectedCareTime[ci] = that.selectedCareList[ci].time;

        // const currentDate = moment().tz(that.timezone).startOf('day').startOf('minute').format("LLLL"); // old
        const currentDate = moment().tz(that.timezone).format("LLLL");

        let selectedStartDate = new Date(that.selectedCareList[ci].startDate);
        selectedStartDate.setHours(0, 0, 0, 0);

        let todayDate = that.getCurrentDateFromTimezone();
        todayDate.setHours(0, 0, 0, 0);
        if (selectedStartDate.getTime() === todayDate.getTime()) {
          const startTimeToday = that.convertNext30MinuteInterval(currentDate);
          const endTimeToday = moment(startTimeToday).add(30, "minutes").toDate();
          that.addPopupStartMin = startTimeToday;
          that.selectedCareTime[ci] = [{ startTime: startTimeToday, endTime: endTimeToday }];
        } else {
          that.addPopupStartMin = moment().startOf('day').format();
          that.selectedCareTime[ci] = [{ startTime: timestartDisp, endTime: timeendDisp }];
        }

        that.selectedCareList[ci]['timePopup'] = !that.selectedCareList[ci]['timePopup'];

      } else {
        that.selectedCareList[i]['timePopup'] = false;
      }
    });
    console.log("selected careList:::::::::::::::::::", this.selectedCareList)
  }
  //   onAddTimePopup(care_key, ci) {
  //     console.log('----------------popup data----', this.selectedCareTime, this.selectedCareList)
  //     const that = this;
  //     this.selectedCareList.map(function(value, i) {
  //         if (ci === i) {
  //             const careVal = that.carelistData.filter(function(entry) {
  //                 return entry._id === care_key;
  //             })[0];
  //             // const timestartDisp = moment({ hour: 0 }).toDate(); // moment({ hour: 9 });olddt
  //             const timestartDisp = moment.tz({
  //                 hour: 0
  //             }, that.timezone)

  //             // const timeendDisp = moment({ hour: 0 }).add( 30, 'minutes').toDate();olddt
  //             const timeendDisp = moment.tz({
  //                 hour: 0
  //             }, that.timezone).add(30, 'minutes')
  //             that.selectedCareTime[ci] = that.selectedCareList[ci].time;

  //             // const currentDate = moment(new Date()).startOf('minute');olddt
  //             const currentDate = moment.tz(that.timezone).startOf('minute')

  //             // let selectedStartDate = new Date(that.selectedCareList[ci].startDate); olddt
  //             // selectedStartDate.setHours(0, 0, 0, 0);olddt

  //             let selectedStartDate = moment.tz(that.selectedCareList[ci].startDate, that.timezone).set({
  //                 hour: 0,
  //                 minute: 0,
  //                 second: 0,
  //                 millisecond: 0
  //             })

  //             // let todayDate = new Date(); olddt
  //             // todayDate.setHours(0, 0, 0, 0); olddt
  //             let todayDate = moment.tz(that.timezone).set({
  //                 hour: 0,
  //                 minute: 0,
  //                 second: 0,
  //                 millisecond: 0
  //             })

  //             if (selectedStartDate.valueOf() === todayDate.valueOf()) {

  //                 const startTimeToday = that.convertNext30MinuteInterval(currentDate);
  //                 const endTimeToday = moment.tz(startTimeToday, that.timezone).add(30, "minutes")
  //                 that.addPopupStartMin = startTimeToday;

  //                 console.log('------in here--------',startTimeToday.format(),endTimeToday.format(),
  //                 startTimeToday.valueOf(),endTimeToday.valueOf(),
  //                 moment(startTimeToday).tz(that.userLocalTimeZone,true).format('LLLL z'),moment(endTimeToday).tz(that.userLocalTimeZone,true).format('LLLL z'))

  //                 that.selectedCareTime[ci] = [{
  //                     startTime:/*startTimeToday.format(),*/  moment(startTimeToday).tz(that.userLocalTimeZone,true).format(),
  //                     endTime: /*endTimeToday.format()*/moment(endTimeToday).tz(that.userLocalTimeZone,true).format()
  //                 }];
  //             } else {
  //                 console.log('-----in else -----------compare',timestartDisp.format(),timeendDisp.format())
  //                 that.addPopupStartMin = timestartDisp;
  //                 that.selectedCareTime[ci] = [{
  //                     startTime:moment(timestartDisp).tz(that.userLocalTimeZone,true).format(), //timestartDisp,
  //                     endTime:moment(timeendDisp).tz(that.userLocalTimeZone,true).format() //timeendDisp
  //                 }];
  //             }

  //             that.selectedCareList[ci]['timePopup'] = !that.selectedCareList[ci]['timePopup'];
  //             console.log('------------------after edit data---------------', that.selectedCareTime[ci], that.selectedCareList[ci])
  //         } else {
  //             that.selectedCareList[i]['timePopup'] = false;
  //         }
  //     });
  // }

  closeTimePopUp(ci) {
    if(this.selectedCareList && this.selectedCareList.length && this.selectedCareList.length>0) {
      this.selectedCareList.filter((item,i)=>{
        this.selectedCareList[i]['timePopup'] = false;
      })
    }
  }
  onTimeOptionchanged(ci){
    console.log("type",ci);
    this.careType = ci;
    // if(this.selectedCareList[ci].time != []){
    //   this.selectedCareList[ci].time = [];
    // }
  }

  onAddTime(care_key, ci) {
    let checkForm = "VALID";
    this.selectedCareTime[ci].map((time: any) => {
      if (moment(time.startTime).unix() > moment(time.endTime).unix()) {
        checkForm = 'SEGTIME';
        return checkForm;
      }
    });
    if (checkForm === 'SEGTIME') {
      this.toastr.error('Start time cannot be less than end time.');
      return false;
    }

    const careVal = this.carelistData.filter(function (entry) { return entry._id === care_key; })[0];
    const timestartDisp = moment({ hour: 9 }).toDate(); // moment({ hour: 9 });
    const timeendDisp = moment({ hour: 9 }).add((careVal.max) ? careVal.max : 30, 'minutes').toDate();
    this.selectedCareTime[ci].push({ startTime: timestartDisp, endTime: timeendDisp });
  }

  updateCareTimeChanged(care_key, ci, timeData, event) {
    const careVal = this.carelistData.filter(entry => entry._id === care_key)[0];
    let timeendDisp;
    // const timeendDisp = moment(event.value).add(15, 'minutes').toDate();
    // this.editSchedule.endTime = moment(this.editSchedule.startTime).add(15, 'minutes').tz(this.userLocalTimeZone).format();
    console.log("event>>>>",event.value)
    if(moment(event.value).tz(this.userLocalTimeZone).format("HH:mm") == moment().set({hour: 23, minute:45}).format("HH:mm")) {
      timeendDisp = moment(event.value).add(14, 'minutes').tz(this.userLocalTimeZone).format("YYYY-MM-DDTHH:mm");
    } else {
      timeendDisp = moment(event.value).add(15, 'minutes').tz(this.userLocalTimeZone).format("YYYY-MM-DDTHH:mm");
    }
    //const timeendDisp = moment( timeData.startTime ).add((careVal.max) ? careVal.max : 30, 'minutes').toDate();
    timeData.endTime = timeendDisp;
    timeData.startTime = event.value;
  }

  onRemoveTime(care_key, i, ci) {
    this.selectedCareList[ci].time.splice(i, 1);
    //this.selectedCareTime[ci].splice(i, 1);
  }

  onRemoveListTime(ci, i,timeData) {
    this.selectedCareList[ci].time.splice(i, 1);
    this.shiftSelected = this.selectedCareList[ci].time;
    this.medPassSelected = this.selectedCareList[ci].time;
    
     let sIndex = this.shift.findIndex(x => { if(x.no == timeData.shiftNumber){return true}});
    if (sIndex > -1) {
      this.shift.splice(sIndex, 1);
    }

    let mIndex = this.medpass.findIndex(x => { if(x.no == timeData.medPassNumber){return true}});
    if (mIndex > -1) {
      this.medpass.splice(sIndex, 1);
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
  }

  isPastTime(startTime, startDate) {
    // Check past time validation
    console.log("startTime>>>>>>",startTime,"startDate",startDate)
    var currentDate = this.getCurrentDateFromTimezone();
    var startTimeCompare = startTime;

    const startH = moment(startTime).format('HH');
    const startM = moment(startTime).format('mm');
    startTimeCompare = moment(startDate);
    startTimeCompare.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
console.log("moment.tz(startTime, this.timezone).unix() >= moment.tz(currentDate, this.timezone).unix()>>",moment.tz(startTime, this.timezone).unix(),"sdsadgasgdaghsvgh",moment.tz(currentDate, this.timezone).unix())
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

  onSaveAddTime(care_key, ci, timeData, shift?, timeOptions?, timeDoneBtn?) {
    console.log(timeData)
    // this.noPast = false; 
    if (timeOptions != null) {
      // if(shift != undefined){
      //   this.selected_shift.forEach(element => {
      //       timeData.startTime = element.startTime._d;
      //       timeData.endTime = element.endTime._d;
      //   });  
      // } 

      // console.log('---star time before---',timeData.startTime)
      // timeData.startTime = moment(timeData.startTime).tz(this.timezone,true).format()
      // timeData.startTime = moment(timeData.startTime).tz(this.timezone,true).format()
      // timeData.endTime =moment(timeData.endTime).tz(this.timezone,true).format()
      // Check past time validation    
      // console.log('---star time after---',timeData.startTime,timeData.endTime)
      if (timeOptions == 'shift') {
        if (this.shift == [] || this.shift == undefined || this.shift.length == 0) {
          this.toastr.error ('Please select shift')
        }
        else {

          if (timeDoneBtn == true) {
            
            this.selectedCareList[ci].time = []
            this.shiftSelected.map(selectedItem=>{
              let item = JSON.stringify(selectedItem);

              this.selectedCareList[ci].time.push(JSON.parse(item));
            })
            
            let curTime = moment().tz(this.userLocalTimeZone, true).format()
            let startdateformat = moment(this.selectedCareList[ci].startDate, "ddd DD-MMM-YYYY, HH:mm").format("DD-MMM-YYYY");
            let Today = moment().tz(this.userLocalTimeZone, true).toDate()
            let todaydateformat = moment(new Date()).tz(this.timezone).format("DD-MMM-YYYY")
            // moment(Today, "ddd DD-MMM-YYYY, HH:mm").format("DD-MMM-YYYY")
            console.log("this.selectedCareList",this.selectedCareList,"curTime>>>>",curTime)
            console.log("startdateformat",startdateformat,"todaydateformat>>>>",todaydateformat,)
            // if (startdateformat == todaydateformat) {
            //   this.selectedCareList.map(item => {
            //     item.time.filter(time => {
            //       // console.log("this.selectedCareList",moment(time.endTime).format('HH:mm'),"curTime>>>>",moment(curTime).format('HH:mm'))
            //       // if (moment.tz(time.endTime, this.timezone).unix() <= moment.tz(curTime, this.timezone).unix()) {
            //       if (moment(time.endTime).format('HH:mm') <= moment(curTime).tz(this.timezone).format('HH:mm')) {
            //       console.log("this.selectedCareList",moment(time.endTime).format('HH:mm'),"curTime>>>>",moment(curTime).tz(this.timezone).format('HH:mm'))
            //         item.startDate = moment(item.startDate).add(1, 'days');
            //         this.toastr.warning('your selected shift includes the past time, so this care will scheduled for tomorrow.', '', { timeOut: 6000 })
            //       }
            //     })
            //   })
            // } 
            // else if(startdateformat < todaydateformat) {
            //   const date1:any = new Date(startdateformat);
            //   const date2:any = new Date(todaydateformat);
            //   const diffTime = Math.abs(date2 - date1);
            //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            //   this.noPast = false; 
            //   if(diffDays == 1) {
            //     this.selectedCareList.map(item => {
            //       item.time.filter(time => {
            //         if (moment(time.endTime).format('HH:mm') == '06:00' && moment(time.endTime).format('HH:mm') > moment(curTime).format('HH:mm')) {
            //           this.noPast = true;
            //         }
            //       })
            //     })
            //   }
            // }
            this.selectedCareList[ci]['timePopup'] = false;
          }
        }
        // this.selected_shift.map(item =>{
        //   item.startTime = moment(item.startTime).tz(this.userLocalTimeZone, true).format();
        // item.endTime = moment(item.endTime).tz(this.userLocalTimeZone, true).format();
        // // this.selectedCareList[ci].time.push(item);

        // })
        // this.dialogRefs.close();
      }
      else if (timeOptions == 'medpass') {
        if (this.medpass == [] || this.medpass == undefined || this.medpass.length == 0) {
          this.toastr.error ('Please select medpass')
        }
        else {

          if (timeDoneBtn == true) {
            
            this.selectedCareList[ci].time = []
            this.medPassSelected.map(selectedItem=>{
              let item = JSON.stringify(selectedItem);

              this.selectedCareList[ci].time.push(JSON.parse(item));
            })
            
            let curTime = moment().tz(this.userLocalTimeZone, true).format()
            let startdateformat = moment(this.selectedCareList[ci].startDate, "ddd DD-MMM-YYYY, HH:mm").format("DD-MMM-YYYY");
            let Today = moment().tz(this.userLocalTimeZone, true).toDate()
            let todaydateformat = moment(new Date()).tz(this.timezone).format("DD-MMM-YYYY")
            // moment(Today, "ddd DD-MMM-YYYY, HH:mm").format("DD-MMM-YYYY")
            console.log("this.selectedCareList",this.selectedCareList,"curTime>>>>",curTime)
            console.log("startdateformat",startdateformat,"todaydateformat>>>>",todaydateformat,)
            // if (startdateformat == todaydateformat) {
            //   this.selectedCareList.map(item => {
            //     item.time.filter(time => {
            //       // console.log("this.selectedCareList",moment(time.endTime).format('HH:mm'),"curTime>>>>",moment(curTime).format('HH:mm'))
            //       // if (moment.tz(time.endTime, this.timezone).unix() <= moment.tz(curTime, this.timezone).unix()) {
            //       if (moment(time.endTime).format('HH:mm') <= moment(curTime).tz(this.timezone).format('HH:mm')) {
            //       console.log("this.selectedCareList",moment(time.endTime).format('HH:mm'),"curTime>>>>",moment(curTime).tz(this.timezone).format('HH:mm'))
            //         item.startDate = moment(item.startDate).add(1, 'days');
            //         this.toastr.warning('your selected shift includes the past time, so this care will scheduled for tomorrow.', '', { timeOut: 6000 })
            //       }
            //     })
            //   })
            // } 
            // else if(startdateformat < todaydateformat) {
            //   const date1:any = new Date(startdateformat);
            //   const date2:any = new Date(todaydateformat);
            //   const diffTime = Math.abs(date2 - date1);
            //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            //   this.noPast = false; 
            //   if(diffDays == 1) {
            //     this.selectedCareList.map(item => {
            //       item.time.filter(time => {
            //         if (moment(time.endTime).format('HH:mm') == '06:00' && moment(time.endTime).format('HH:mm') > moment(curTime).format('HH:mm')) {
            //           this.noPast = true;
            //         }
            //       })
            //     })
            //   }
            // }
            this.selectedCareList[ci]['timePopup'] = false;
          }
        }
        // this.selected_shift.map(item =>{
        //   item.startTime = moment(item.startTime).tz(this.userLocalTimeZone, true).format();
        // item.endTime = moment(item.endTime).tz(this.userLocalTimeZone, true).format();
        // // this.selectedCareList[ci].time.push(item);

        // })
        // this.dialogRefs.close();
      }
      else {

        if (timeData.startTime == null || timeData.endTime == null) {
          this.toastr.error('Start time or end time cannot be blank.');
          return;
        }
        if (moment.tz(timeData.startTime, this.timezone).unix() >= moment.tz(timeData.endTime, this.timezone).unix()) {
          this.toastr.error('End time cannot be less than or equals to start time.');
          return;
        }
        // console.log('------saveing time-----',timeData.startTime,moment(timeData.startTime).tz(this.timezone,true).format(),this.selectedCareList[ci].startDate)
        const isPastTime = this.isPastTime(timeData.startTime, this.selectedCareList[ci].startDate)
        if (isPastTime == true) {
          this.toastr.error('You cannot select past time.');
          // return;
          this.selectedCareList[ci]['minDate'] = moment(this.selectedCareList[ci]['minDate']).add(1, 'd').toDate();
          this.selectedCareList[ci]['startDate'] = moment(this.selectedCareList[ci]['startDate']).add(1, 'd').toDate();
        }
        // check end time validation


        let startdateformat: any = moment(timeData.startTime, "ddd DD-MMM-YYYY, HH:mm");
        let enddateformat: any = moment(timeData.endTime, "ddd DD-MMM-YYYY, HH:mm");
        let checkFormTime = false;

        if (startdateformat.isValid()) {
          startdateformat = moment(timeData.startTime, "ddd DD-MMM-YYYY, HH:mm").format("HH:mm");
          for (let i = 0; i < this.selectedCareList[ci].time.length; i++) {
            let iDate = timeData.startTime;
            if (moment(this.selectedCareList[ci].time[i].endTime).date() > moment(this.selectedCareList[ci].time[i].startTime).date()) {
              if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.selectedCareList[ci].time[i].endTime))) checkFormTime = true;
            } else if (moment(iDate).isBetween(this.selectedCareList[ci].time[i].startTime, this.selectedCareList[ci].time[i].endTime, null, "()")) {
              checkFormTime = true;
            }
            else if (moment(this.selectedCareList[ci].time[i].startTime).date() == moment(this.selectedCareList[ci].time[i].startTime).date()) {
              if (this.compareDate(moment(iDate)) == this.compareDate(moment(this.selectedCareList[ci].time[i].startTime))) checkFormTime = true;
            }
          }
        } else {
          startdateformat = timeData.startTime;
          for (let i = 0; i < this.selectedCareList[ci].time.length; i++) {
            let iDate = moment.tz(timeData.startTime, "HH:mm", this.timezone).format();
            if (moment.tz(this.selectedCareList[ci].time[i].endTime, this.timezone).date() > moment.tz(this.selectedCareList[ci].time[i].startTime, this.timezone).date()) {
              if (this.compareDate(moment.tz(iDate, this.timezone)) < this.compareDate(moment.tz(this.selectedCareList[ci].time[i].endTime, this.timezone))) {
                checkFormTime = true;
              }
            } else if (moment.tz(iDate, this.timezone).isBetween(this.selectedCareList[ci].time[i].startTime, this.selectedCareList[ci].time[i].endTime, null, "()")) {
              checkFormTime = true;
            }
          }
        }
        if (enddateformat.isValid()) {
          enddateformat = moment(timeData.endTime, "ddd DD-MMM-YYYY, HH:mm").format("HH:mm");
          for (let i = 0; i < this.selectedCareList[ci].time.length; i++) {
            let iDate = timeData.endTime;
            if (moment(this.selectedCareList[ci].time[i].endTime).date() > moment(this.selectedCareList[ci].time[i].startTime).date()) {
              if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.selectedCareList[ci].time[i].endTime))) checkFormTime = true;
            } else if (moment(iDate).isBetween(this.selectedCareList[ci].time[i].startTime, this.selectedCareList[ci].time[i].endTime, null, "()")) {
              checkFormTime = true;
            }
          }
        } else {
          enddateformat = timeData.endTime;
          for (let i = 0; i < this.selectedCareList[ci].time.length; i++) {
            let iDate = moment(timeData.endTime, "HH:mm").toDate();
            if (moment(this.selectedCareList[ci].time[i].endTime).date() > moment(this.selectedCareList[ci].time[i].startTime).date()) {
              if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.selectedCareList[ci].time[i].endTime))) checkFormTime = true;
            } else if (moment(iDate).isBetween(this.selectedCareList[ci].time[i].startTime, this.selectedCareList[ci].time[i].endTime, null, "()")) {
              checkFormTime = true;
            }
          }
        }
        if (checkFormTime == true) {
          this.toastr.error("This time already exist.");
          this._commonService.setLoader(false);
          return;
        }
        timeData.startTime = moment(timeData.startTime).tz(this.userLocalTimeZone, true).format();
        timeData.endTime = moment(timeData.endTime).tz(this.userLocalTimeZone, true).format();
        this.selectedCareList[ci].time.push(timeData);
        if (timeDoneBtn == true) {
          this.selectedCareList[ci]['timePopup'] = false;
        } else {
          const timestartDisp = moment({ hour: 0 }).toDate(); // moment({ hour: 9 });
          const timeendDisp = moment({ hour: 0 }).add(30, 'minutes').toDate();
          this.selectedCareTime[ci] = this.selectedCareList[ci].time;

          const currentDate = moment(new Date()).startOf('minute').tz(this.timezone).format("LLLL");

          let selectedStartDate = new Date(this.selectedCareList[ci].startDate);
          selectedStartDate.setHours(0, 0, 0, 0);

          let todayDate = this.getCurrentDateFromTimezone();
          todayDate.setHours(0, 0, 0, 0);
          if (selectedStartDate.getTime() === todayDate.getTime()) {
            const startTimeToday = this.convertNext30MinuteInterval(currentDate);
            const endTimeToday = moment(startTimeToday).add(30, "minutes").toDate();
            this.addPopupStartMin = startTimeToday;
            this.selectedCareTime[ci] = [{ startTime: startTimeToday, endTime: endTimeToday }];
          } else {
            this.addPopupStartMin = timestartDisp;
            this.selectedCareTime[ci] = [{ startTime: timestartDisp, endTime: timeendDisp }];
          }
          /*console.log('-----------------in else block')
          const timestartDisp =  moment.tz({
            hour: 0
        }, this.timezone); // moment({ hour: 9 });
    
          const timeendDisp =  moment.tz({
            hour: 0
        }, this.timezone).add(30, 'minutes')
        this.selectedCareTime[ci] = this.selectedCareList[ci].time;;
    
          // this.selectedCareTime[ci] = this.selectedCareList[ci].time;
          
          const currentDate =  moment.tz(this.timezone).startOf('minute')
          
          let selectedStartDate = moment.tz(this.selectedCareList[ci].startDate, this.timezone).set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        })
    
        // let todayDate = new Date(); olddt
        // todayDate.setHours(0, 0, 0, 0); olddt
        let todayDate = moment.tz(this.timezone).set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        })
    
    
          if(selectedStartDate.valueOf() === todayDate.valueOf()){ 
            const startTimeToday = this.convertNext30MinuteInterval(currentDate);
            const endTimeToday   =  moment.tz(startTimeToday, this.timezone).add(30, "minutes")
            this.addPopupStartMin = startTimeToday;
            this.selectedCareTime[ci] = 
            [{ startTime: moment(startTimeToday).tz(this.userLocalTimeZone,true).format(),//startTimeToday, 
              endTime: moment(endTimeToday).tz(this.userLocalTimeZone,true).format()//endTimeToday 
            }];
          }else{
            this.addPopupStartMin = timestartDisp;
            this.selectedCareTime[ci] = [{
               startTime:moment(timestartDisp).tz(this.userLocalTimeZone,true).format(), //timestartDisp,
                endTime:moment(timeendDisp).tz(this.userLocalTimeZone,true).format() //timeendDisp 
              }];
          } */
        }
      }
    } else {
      this.toastr.error('Please select time option')
    }
    //this.selectedCareList[ci]['timePopup'] = false;
  }

  repeatChanged(ci) {
    console.log(ci)
    this.selectedCareList[ci].repeat_checkoption = this.selectedCareList[ci].repeat;
    this.scheduleRepeat.index = ci;
    this.minDate = new Date();
    if (this.selectedCareList[ci].repeat === 'custom'
      || this.selectedCareList[ci].repeat === 'never'
      || this.selectedCareList[ci].repeat === 'every_day'
      || this.selectedCareList[ci].repeat === 'every_week'
      || this.selectedCareList[ci].repeat === 'every_month'
      || this.selectedCareList[ci].repeat === 'every_year') {
      if (this.selectedCareList[ci].repeat === 'custom') {
        // this.selectedCareList[ci].repeat = 'every_day';
      } else {
        this.selectedCareList[ci].repeat = this.selectedCareList[ci].repeat;
      }


      // const dialogConfig = new MatDialogConfig();
      // dialogConfig.maxWidth = '500px';
      // dialogConfig.panelClass = 'repeatDialog';
      // //dialogConfig.disableClose = true;
      // this.dialogRefs = this.dialog.open(this.callRepeatDialog, dialogConfig);
      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '610px';
      dialogConfig.maxHeight = '350px';
      dialogConfig.panelClass = 'monthlyDialog';
      dialogConfig.data = { selectedCareList: this.selectedCareList, scheduleRepeat: this.scheduleRepeat, customWeekDayList: this.customWeekDayList };
      this.dialogRefs = this.dialog.open(RepeatDialogComponent, dialogConfig);
      this.dialogRefs.afterClosed().subscribe(result => {
        console.log('Dialog result:', result);
        if(result && result.selectedCareList){
          this.selectedCareList = result.selectedCareList;
        }
        if(result && result.customWeekDayList){
          this.customWeekDayList = result.customWeekDayList;
        }
        if(result && result.scheduleRepeat){
          this.scheduleRepeat = this.customWeekDayList;
        }
      });
      //dialogConfig.disableClose = true;
      //this.dialogRefs = this.dialog.open(this.repeatChangeDialog, dialogConfig);

      const selectedCareList = JSON.parse(JSON.stringify(this.selectedCareList[ci]));
      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;
      // if (this.scheduleRepeat.repeat_old == null) {
      // }
      // repeat_old
      // this.scheduleRepeat.repeat_old = ci;
      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      this.scheduleRepeat.repeat_tenure = selectedCareList.repeat_tenure ? selectedCareList.repeat_tenure : 1;
      if (this.selectedCareList[ci].repeat === 'every_day') {
        this.scheduleRepeat.repeat_on = repeatDays;
      } else {
        this.scheduleRepeat.repeat_on = selectedCareList.repeat_on ? selectedCareList.repeat_on : repeatDays;
      }
      this.scheduleRepeat.repeat_option = selectedCareList.repeat_option ? selectedCareList.repeat_option : 'on_day';
    } else if (this.selectedCareList[ci].repeat === 'custom_weekly') {
      // this.selectedCareList[ci].
      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '605px';
      dialogConfig.height = '340px';
      dialogConfig.panelClass = 'monthlyDialog';
      //dialogConfig.disableClose = true;
      //this.dialogRefs = this.dialog.open(this.customweekly, dialogConfig);
      dialogConfig.data = { selectedCareList: this.selectedCareList, scheduleRepeat: this.scheduleRepeat, customWeekDayList: this.customWeekDayList };
      this.dialogRefs = this.dialog.open(CustomWeeklyComponent, dialogConfig);
      this.dialogRefs.afterClosed().subscribe(result => {
        console.log('Dialog result:', result);
        if(result && result.selectedCareList){
          this.selectedCareList = result.selectedCareList;
        }
        if(result && result.customWeekDayList){
          this.customWeekDayList = result.customWeekDayList;
        }
        if(result && result.scheduleRepeat){
          this.scheduleRepeat = this.customWeekDayList;
        }
      });

      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      const selectedCareList = JSON.parse(JSON.stringify(this.selectedCareList[ci]))

      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;
      this.scheduleRepeat.repeat_on = selectedCareList.repeat_on ? selectedCareList.repeat_on : repeatDays;
      this.scheduleRepeat.repeat_option = 'on_day';

    } else if (this.selectedCareList[ci].repeat === 'custom_monthly') {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.height = '280px';
      dialogConfig.width = '610px';
      dialogConfig.panelClass = 'monthlyDialog';
      //dialogConfig.disableClose = true;
      //this.dialogRefs = this.dialog.open(this.custommonthly, dialogConfig);
      dialogConfig.data = { selectedCareList: this.selectedCareList, scheduleRepeat: this.scheduleRepeat, customWeekDayList: this.customWeekDayList };
      this.dialogRefs = this.dialog.open(CustomMonthlyComponent, dialogConfig);
      this.dialogRefs.afterClosed().subscribe(result => {
        console.log('Dialog result:', result);
        if(result && result.selectedCareList){
          this.selectedCareList = result.selectedCareList;
        }
        if(result && result.customWeekDayList){
          this.customWeekDayList = result.customWeekDayList;
        }
        if(result && result.scheduleRepeat){
          this.scheduleRepeat = result.scheduleRepeat;
        }
      });

      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      const selectedCareList = JSON.parse(JSON.stringify(this.selectedCareList[ci]))

      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;

      this.selectedCareList[this.scheduleRepeat.index]['month_date'] = '';
    } else if (this.selectedCareList[ci].repeat === 'custom_yearly') {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.height = '280px';
      dialogConfig.width = '620px';
      dialogConfig.panelClass = 'monthlyDialog';
      //dialogConfig.disableClose = true;
      //this.dialogRefs = this.dialog.open(this.customyearly, dialogConfig);
      dialogConfig.data = { selectedCareList: this.selectedCareList, scheduleRepeat: this.scheduleRepeat, customWeekDayList: this.customWeekDayList };
      this.dialogRefs = this.dialog.open(CustomYearlyComponent, dialogConfig);
      this.dialogRefs.afterClosed().subscribe(result => {
        console.log('Dialog result:', result);
        if(result && result.selectedCareList){
          this.selectedCareList = result.selectedCareList;
        }
        if(result && result.customWeekDayList){
          this.customWeekDayList = result.customWeekDayList;
        }
        if(result && result.scheduleRepeat){
          this.scheduleRepeat = result.scheduleRepeat;
        }
      });

      const repeatDays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      const selectedCareList = this.selectedCareList[ci];
      this.scheduleRepeat.repeat = selectedCareList.repeat;
      this.scheduleRepeat.index = ci;
      this.scheduleRepeat.startDate = this.selectedCareList[ci].startDate;
      this.scheduleRepeat.endDate = this.selectedCareList[ci].endDate;
      this.selectedCareList[this.scheduleRepeat.index]['month_date'] = '';
      this.scheduleRepeat.repeat_option = '';
      this.scheduleRepeat.repeat_on = '';
    } else {
      this.selectedCareList[ci].startDate = this.selectedCareList[ci].startDate;//this.scheduleRepeat.startDate;
      this.selectedCareList[ci].endDate = this.selectedCareList[ci].endDate;//this.scheduleRepeat.endDate;
      this.selectedCareList[ci].repeat_tenure = 1;
      this.selectedCareList[ci].repeat = this.selectedCareList[ci].repeat;
      // tslint:disable-next-line: max-line-length
      this.selectedCareList[ci].repeat_on = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true };
      this.selectedCareList[ci].repeat_option = 'on_day';
    }

    this.scheduleDuration.startDate = this.scheduleRepeat.startDate;
    const End = this.scheduleDuration.endDate;
    if (End != null) {
      const checkSDate = moment(this.scheduleDuration.startDate).format('YYYY-MM-DD');
      const checkEDate = moment(End).format('YYYY-MM-DD');
      if (checkSDate > checkEDate) this.scheduleDuration.endDate = '';
    }
    this.selectedCareList[this.scheduleRepeat.index].startDate = this.scheduleRepeat.startDate;
    this.selectedCareList[this.scheduleRepeat.index].endDate = this.scheduleRepeat.endDate;
    this.selectedCareList[this.scheduleRepeat.index].repeat_tenure = this.scheduleRepeat.repeat_tenure;
    this.selectedCareList[this.scheduleRepeat.index].repeat = this.scheduleRepeat.repeat;
    this.selectedCareList[this.scheduleRepeat.index].repeat_old = this.scheduleRepeat.repeat;
    this.selectedCareList[this.scheduleRepeat.index].repeat_on = this.scheduleRepeat.repeat_on;
    this.selectedCareList[this.scheduleRepeat.index].repeat_option = this.scheduleRepeat.repeat_option;

    /* Set Repeat for Every Week */
    if (this.selectedCareList[ci].repeat === 'every_week') {
      let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      let d = new Date(this.selectedCareList[this.scheduleRepeat.index].startDate);
      let dayName = days[d.getDay()];
      var key = dayName;
      var obj = {};
      obj[key] = true;
      this.selectedCareList[this.scheduleRepeat.index].repeat_on = obj;
    }

    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
  }

  closeDuplicateDialog(status) {
    this.duplicateCancel = status;
    this.dialogRefs.close();
  }

  closeRepeatDialog(): void {
    this.dialogRefs.close();

    this.selectedCareList[this.scheduleRepeat.index].repeat = this.selectedCareList[this.scheduleRepeat.index].repeat_old;
    this.selectedCareList[this.scheduleRepeat.index].repeat = null;
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

  saveRepeatDialog(schedule = null): void {
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
          schedule.start_date = date.getTime();
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


    // this.selectedCareList[this.scheduleRepeat.index].repeat = this.selectedCareList[this.scheduleRepeat.index].repeat_old;
    // this.selectedCareList[this.scheduleRepeat.index].repeat = null;
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
    // this.selectedCareList[this.scheduleRepeat.index].startDate = this.scheduleRepeat.startDate;
    // this.selectedCareList[this.scheduleRepeat.index].endDate = this.scheduleRepeat.endDate;
    // this.selectedCareList[this.scheduleRepeat.index].repeat_tenure = this.scheduleRepeat.repeat_tenure;
    // this.selectedCareList[this.scheduleRepeat.index].repeat = this.scheduleRepeat.repeat;
    // this.selectedCareList[this.scheduleRepeat.index].repeat_old = this.scheduleRepeat.repeat;
    // this.selectedCareList[this.scheduleRepeat.index].repeat_on = this.scheduleRepeat.repeat_on;
    // this.selectedCareList[this.scheduleRepeat.index].repeat_option = this.scheduleRepeat.repeat_option;
  }

  radioRepeatChange(event): void {
    this.scheduleRepeat.repeat_option = event.value;
    this.selectedCareList[this.scheduleRepeat.index].repeat_option = event.value;
  }

  getRepeatValue(repeat_val) {
    if (repeat_val !== null) {
      const repeatVal = this.repeatOptions.filter(entry => entry.key === repeat_val)[0];
      return repeatVal.value;
    } else {
      return false;
    }
  }

  weekDayChanged(e) {

    /* let schedule = this.selectedCareList[this.scheduleRepeat.index]
 
     let scheduleRepeatTenure =  schedule.repeat_tenure;
 
     let repeatDay = Object.entries(schedule.repeat_on).filter((e,i)=>e).filter(e=>e[1]).map(e=>e[0])
     
     let finalString = `Care will occure every ${scheduleRepeatTenure} ${scheduleRepeatTenure==1?'week':'weeks'} ${repeatDay.length>0?'on':''} 
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

  weekDayText(e) {
    const checkData = [];
    for (const [key, value] of Object.entries(this.scheduleRepeat.repeat_on)) {
      if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
    }
    return (checkData).toString().replace(/,/g, ', ');
  }

  repeatPopChanged(ad) {
    if (this.scheduleRepeat.repeat === 'every_day') {
      this.scheduleRepeat.repeat_on = {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true
      };
    }
  }
  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }
  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }

  async done() {
    /* Start Validations */
    this._duplicateCares  = [];
    this.allNewCareData = [];

    let checkForm = 'VALID';
    const currentDate = new Date();

    this.selectedCareList.map((item, i) => {
      if (item.repeat === '') {
        checkForm = 'REPEAT';
        return checkForm;
      }
      if (item.time.length) {
        item.time.map((time: any) => {
          if (time.startTime === '' || time.endTime === '') {
            checkForm = 'SETIME';
            return checkForm;
          }
          if (moment(time.startTime).unix() >= moment(time.endTime).unix()) {
            checkForm = 'SEGTIMEPAST';
            return checkForm;
          }
          if (item.endDate) {
            if (startOfDay(item.startDate).valueOf() > startOfDay(item.endDate).valueOf()) {
              checkForm = 'SEGDATE';
              return checkForm;
            }
          }
          // check past time validation            
          const isPastTime = this.isPastTime(time.endTime, item.startDate)
          if (isPastTime == true) {
            checkForm = 'PASTTIME';
            return checkForm;
          }
        });
      } else {
        checkForm = 'NOTIME';
      }
      // Set minimum date for display in preview
      if (i == 0) {
        this.careStartDate = item.startDate;
      } else {
        if (moment(this.careStartDate).isAfter(item.startDate, 'day')) this.careStartDate = item.startDate;
      }
    });
    if (checkForm === 'SEGTIME') {
      this.toastr.error('Please select start time and end time.'); return;
    } else if (checkForm === 'NOTIME') {
      this.toastr.error('Please select time for care.'); return;
    } else if (checkForm === 'PASTTIME') {
      this.toastr.error('You cannot select past time.'); return;
    } else if (checkForm === 'SEGDATE') {
      this.toastr.error('Start date cannot be greater than end date.'); return;
    } else if (checkForm === 'SEGTIMEPAST') {
      this.toastr.error('End time cannot be less than or equals to start time.'); return;
    }
    /* End Validations */
    let repeatValidation;
    this._commonService.setLoader(true);
    const careData = [];
    this.selectedResidentList.map(resident => {
      this.selectedCareList.map(item => {
        if (item.repeat == null) repeatValidation = true;
        item.time.map(async timedata => {
         
          const timediff = (moment(timedata.endTime).valueOf() - moment(timedata.startTime).valueOf()) / 1000;
          const startH = moment(timedata.startTime).format('HH');
          const startM = moment(timedata.startTime).format('mm');
          const startDayH = "00";
          const startDayM = "00";
          const startDayDate = moment(moment(item.startDate).startOf("day"));//moment.tz(item.startDate,this.timezone);

          // tslint:disable-next-line: radix
          // startDayDate.set({ hour: parseInt(startDayH), minute: parseInt(startDayM), second: 0, millisecond: 0 });
          // const startDaydate = startDayDate.utc().valueOf();
          const startDate = moment(moment(item.startDate).startOf("day"));

          // tslint:disable-next-line: radix
          startDate.set({ hour: parseInt(startH), minute: parseInt(startM), second: 0, millisecond: 0 });
          const startdate = startDate.valueOf();

          let enddate = null;
          if (item.endDate) {
            this.scheduleDuration['ts_endDate'] = item.endDate.tz(this.timezone, true).utc().valueOf();
            const endDate = moment(item.endDate);
            endDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
            // const endDate = item.endDate.tz(this.timezone,true);
            // endDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
            enddate = endDate//endDate.utc().valueOf();
          }
          let repeatChkOption = item.repeat;
          if(item.repeat === "custom_monthly" || item.repeat === 'never' || (item.repeat == "every_month" && item.repeat_option === "on_day") || (item.repeat == "every_year" && item.repeat_option === "on_day") ) {
            item.repeat_on = {
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false
            };
          }
          if (item.repeat === 'never') {
            enddate = moment(moment(item.startDate).endOf("day")).valueOf();
            // enddate = moment(moment(item.startDate).endOf("day")).valueOf();
          } else {
            if (item.repeat_tenure !== 1 || item.repeat_option !== 'on_day' ||
              // tslint:disable-next-line: max-line-length
              (!item.repeat_on.monday || !item.repeat_on.tuesday || !item.repeat_on.wednesday || !item.repeat_on.thursday || !item.repeat_on.friday || !item.repeat_on.saturday || !item.repeat_on.sunday)) {
              repeatChkOption = 'custom';
            }
          }
          if(item.repeat == "every_month" && (item.repeat_option == "on_week_number" || item.repeat_option === "on_last_week")) {
            let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            let d = new Date(this.selectedCareList[this.scheduleRepeat.index].startDate);
            let dayName = days[d.getDay()];
            var key = dayName;
            var obj = {};
            obj[key] = true;
            this.selectedCareList[this.scheduleRepeat.index].repeat_on = obj;
          }
          if(item.repeat == "every_day") {
            item.repeat_on = {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: true,
              sunday: true
            }
          }
          // console.log('---end date after------',enddate,enddate.format('LLLL z'),enddate.valueOf())
          if (enddate && (moment(startdate).tz(this.timezone, true).valueOf() > moment(enddate).tz(this.timezone, true).valueOf())) {
            this.toastr.error('End date should be greater than start date.');
            return;
          }

        //     // get shiftnumber
        // let start_time = moment(startDayDate).tz(this.timezone, true).valueOf();
        // let findShift =  this.shiftno.filter(x=>{ return x.start_time ==moment(startdate).tz(this.timezone, true).valueOf() && x.end_time == moment(startdate).tz(this.timezone, true).valueOf() + timediff })
        // findShift[0].shiftNumber
          const carepart = {
            org_id: this.organization,
            fac_id: this.facility,
            resident_id: resident.resident.value,
            resident_note: resident.note || '',
            care_id: item.care.key,
            care_note: item.note,
            assigned_to: (item.user_id) ? item.user_id.key : null,
            start_date: moment(startDayDate).tz(this.timezone, true).valueOf(),
            start_time: moment(startdate).tz(this.timezone, true).valueOf(),
            end_date: enddate ? moment(enddate).tz(this.timezone, true).valueOf() : enddate,
            repeat: item.repeat,
            month_date: item.month_date ? item.month_date : undefined,
            repeat_checkoption: repeatChkOption,
            repeat_on: item.repeat_on,
            repeat_tenure: item.repeat_tenure,
            repeat_option: item.repeat_option,
            duration: timediff,
            shiftNumber: (timedata.shiftNumber) ?  timedata.shiftNumber : null,
            care_type: this.careType 
          };
          this.allNewCareData.push(carepart);
          careData.push(carepart);
        });
      });
    });
    if (repeatValidation == true) {
      this._commonService.setLoader(false);
      this.toastr.error('Select repeat.');
      return;
    }
    if(this.allNewCareData){
      this.allNewCareData.forEach(async care => {
        const carepayload = {
          org_id: this.organization,
          fac_id: this.facility,
          shift: 0,
          date: moment(care.start_date).format("MM/DD/YYYY"),
          residentArray: []
        };
        console.log('getAllEvents payload---->', carepayload);
        let AllCareData: any[] = [];
        await this.apiService.apiFn({ type: 'GET', target: 'schedule/getScheduleByDate' }, carepayload)
        .then((res:any) => {
          //console.log("All cares",res);
          const _allCares = res;
          if(_allCares.data){
            if(_allCares.data.assigned){
              _allCares.data.assigned.forEach(a => {
                AllCareData.push(a);
              });
            }
            if(_allCares.data.missed){
              _allCares.data.missed.forEach(a => {
                AllCareData.push(a);
              });
            }
            if(_allCares.data.unAssigned){
              _allCares.data.unAssigned.forEach(a => {
                AllCareData.push(a);
              });
            }
          }
          console.log("All Care Data", AllCareData);
          let _foundDuplicate;
          if(AllCareData){
            _foundDuplicate = AllCareData.find(c => c.care_id === care.care_id && moment(c.start_date).format("MM/DD/YYYY") === moment(care.start_date).format("MM/DD/YYYY") &&  c.start_time == care.start_time);
              if(_foundDuplicate){
                  console.log("Care id",_foundDuplicate);
                  console.log("Duplicate Care Found");
                  _foundDuplicate.start_time = moment(_foundDuplicate.start_time).tz(this.timezone, true).format('HH:mm');
                  //_foundDuplicate.end_time = moment(_foundDuplicate.start_time).format('HH:mm');
                  const _foundInDupCareIndex = this._duplicateCares.findIndex(c => c.care_id == _foundDuplicate.care_id);
                  if(_foundInDupCareIndex > -1){
                    this._duplicateCares = this._duplicateCares;
                  }
                  else {
                    this._duplicateCares.push(_foundDuplicate);
                  }
              }
              // else if(care.scheduleCares){
              //   care.scheduleCares.forEach(s => {
              //     if(s.careData){
  
              //     }
              //   })
              // }
          }
          
        });
        if(this._duplicateCares && this._duplicateCares.length){
          for(let i=0; i< this._duplicateCares.length; i++){
            if(i === this._duplicateCares.length - 1){
              const dialogConfig = new MatDialogConfig();
              dialogConfig.width = '610px';
              dialogConfig.maxHeight = '350px';
              dialogConfig.panelClass = 'monthlyDialog';
              if(this.dialogRefs && this.dialogRefs.getState() === MatDialogState.OPEN) {
                // The dialog is opened.
              }
              else {
                this.dialogRefs = this.dialog.open(this.duplicateCareDialog, dialogConfig);
                this._commonService.setLoader(false);
              }
              
            }
          }
        }
        else {
          this._commonService.setLoader(false);
          console.log("Care Data",careData);
            this.apiService.apiFn({ type: 'POST', target: 'schedule/add' }, careData)
            .then((result: any) => {
              console.log("After create",result);
              if (result['status']) {
                this.toastr.success('Schedule care added successfully!');
                this._router.navigate(['/scheduling']);
              } else {
                this._commonService.setLoader(false);
                this.toastr.error('Unable to save Schedule care. Please check again!');
              }
            })
            .catch((error) => this.toastr.error('Unable to save Schedule care. Please check again!'));
        }
      });
      
    }
   
  }

  async confirmDuplicateDialog(){
    this.dialogRefs.close();
    await this.apiService.apiFn({ type: 'POST', target: 'schedule/add' }, this.allNewCareData)
      .then((result: any) => {
        console.log("After create",result);
        if (result['status']) {
          this.toastr.success('Schedule care added successfully!');
          this._router.navigate(['/scheduling']);
        } else {
          this._commonService.setLoader(false);
          this.toastr.error('Unable to save Schedule care. Please check again!');
        }
      })
      .catch((error) => this.toastr.error('Unable to save Schedule care. Please check again!'));
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
      let finalString = repeatDay && repeatDay.length ? `Care will occur every ${scheduleRepeatTenure} ${scheduleRepeatTenure == 1 ? 'week' : 'weeks'} ${repeatDay.length > 0 ? 'on' : ''}
      ${repeatDay.length > 1 ? repeatDay.slice(0, repeatDay.length - 1).toString().replace(/,/g, ', ') : repeatDay.slice(0, repeatDay.length).toString()} ${repeatDay.length > 1 ? ' and ' : ''} ${repeatDay.length > 1 ? repeatDay[repeatDay.length - 1].charAt(0).toUpperCase() + repeatDay[repeatDay.length - 1].slice(1) : ''}.`: '';
      return finalString
    } else if (repeat == 'custom_monthly') {
      if (schedule.month_date == '') return;
      let finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'month' : 'months'} on the ${schedule.month_date}${this.dateFormat2(schedule.month_date)}.`
      return finalString;
    } else if (repeat == 'custom_yearly') {
      if (schedule.month_date == '' || !schedule.repeat_option || !schedule.repeat_tenure || !schedule.repeat_on) return;
      let repeat = this.customRepeat.filter(e => e.value == schedule.repeat_option);
      let month = this.monthNameList.filter(e => e.value == schedule.month_date);
      let day = this.customWeekDayList.filter(e => e.value == schedule.repeat_on.value);
      if (schedule.repeat_on) {
        console.log(schedule.repeat_on, Object.keys(schedule.repeat_on)[0])
        day.push({
          'name': Object.keys(schedule.repeat_on)[0],
          'value': Object.keys(schedule.repeat_on)[0],
          'isCheckd': true
        });
      }
      console.log("",this.selectedCareList);
      let finalString = `Care will occur every ${schedule.repeat_tenure > 1 ? schedule.repeat_tenure : ''} ${schedule.repeat_tenure == 1 ? 'year' : 'years'} in the month of ${month[0].key} on the ${repeat[0].key} of ${day[0].name ? day[0].name.charAt(0).toUpperCase() + day[0].name.slice(1) : day[1].name.charAt(0).toUpperCase() + day[1].name.slice(1)}`
      return finalString;
    }
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
}
