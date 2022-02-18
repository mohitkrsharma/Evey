import { Component, OnInit, ViewChild, } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { NgxDrpOptions, PresetItem, Range } from 'ngx-mat-daterange-picker';
import { MatOption } from '@angular/material';
import * as moment from 'moment';
import { AmazingTimePickerService } from 'amazing-time-picker';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { SavereportComponent } from '../../../shared/modals/savereport/savereport.component';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SearchFilterBYPipe } from '../../../shared/services/search-filter-by.pipe';

@Component({
  selector: 'app-getreport',
  templateUrl: './getreport.component.html',
  styleUrls: ['./getreport.component.scss']
})
export class GetreportComponent implements OnInit {
  timezone; utc_offset;
  private subscription: Subscription;
  allorg = false;
  shiftType: string;
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialog: MatDialog,
    private router: Router,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public commonService: CommonService,
    private searchPipe: SearchFilterBYPipe
  ) {
  }
  datevalidation = false;
  start; end; CheckIn = false;
  endtimevalidation = false;
  nullStartDateValidation = false;
  nullEndDateValidation = false;
  endvalidationqual = false;
  equalvalidation = false;
  minutevalid = false;
  alloutcome = false;
  allinclude = false;
  allresident = false;
  alllevel = false;
  allstatus = false;
  alluser = false;
  allsector = false;
  allfloor = false;
  allfac = false;
  selected = [moment().utc(), moment().utc()];
  alwaysShowCalendars: boolean;
  shiftArr: any[] = [];
  startTime = moment();
  endTime = moment();
  startHour: any;
  endHour: any;
  startMinute: any;
  endMinute: any;

  /* ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }; */
  singlefac = false;
  checked;
  reportForm: FormGroup;
  organiz; faclist; floorlist; seclist; zonelist;
  facilityDropdown;
  report: any = {
    organization: '',
    facility: '',
    floor: '',
    sector: '',
    user: '',
    resident: '',
    outcome: '',
    care: '',
    startTime: '',
    endTime: '',
    shift: ''
  };
  shiSearch = '';
  dropdownList = [];
  selectedItems = [];
  dropdownSettings = {};
  pokemonGroups = [];
  itemList = [];
  checkall = false;
  settings = {};
  floorArr = []; sectorArr = []; userArr = []; residentArr = []; careArr = []; zoneArr = []; outcomeArr = [];
  facilityData;
  floorDropdown; floorData; sectorDropdown; zoneDropdown;
  userslist; residentslist; carelist = [];
  reportData;
  allCares = true;
  allResidents = false;
  allStaff = false;
  allcare = false;
  start_date; end_date;
  searchCtrl = '';
  facSearch = '';
  floSearch = '';
  secSearch = '';
  usrSearch = '';
  resSearch = '';
  carSearch = '';
  rSearch = '';
  cSearch = '';
  inSearch = '';
  oSearch = '';

  public includes: any[] = [
    { key: 'isCallLight', value: 'Call Light' },
    { key: 'isFind', value: 'Find' },
    { key: 'isNotify', value: 'Notify Care Team' },
    { key: 'is_out_of_fac', value: 'Out Of Facility' },
    { key: 'isNFC', value: 'NFC' }
  ];


  public statusData = [
    { label: 'Active', value: 'Active', checked: true },
    { label: 'Deceased', value: 'Deceased' },
    { label: 'Moved', value: 'Moved' },
    { label: 'Transferred', value: 'Transferred' },
    { label: 'Hospitalized', value: 'Hospitalized' },
    { label: 'Temp Hospitalization', value: 'Temp Hospitalization' },
    { label: 'Vacation', value: 'Vacation' },
    { label: 'Skilled Nursing', value: 'Skilled Nursing' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Other', value: 'Other' }];


  public carelevelData: any;
  orgfac: any;
  range: Range = { fromDate: new Date(), toDate: new Date() };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  organization; facility;

  @ViewChild('allSelected', {static: false}) private allSelected: MatOption;
  @ViewChild('selectedUser', {static: false}) private selectedUser: MatOption;
  @ViewChild('selectedResident', {static: false}) private selectedResident: MatOption;
  @ViewChild('selectedCare', {static: false}) private selectedCare: MatOption;
  @ViewChild('selectedOutcome', {static: false}) private selectedOutcome: MatOption;
  @ViewChild('selectedFacility', {static: false}) private selectedFacility: MatOption;
  @ViewChild('selectedFloor', {static: false}) private selectedFloor: MatOption;
  @ViewChild('selectedSector', {static: false}) private selectedSector: MatOption;
  @ViewChild('selectedZone', {static: false}) private selectedZone: MatOption;
  @ViewChild('dateRangePicker', {static: false}) dateRangePicker;
  @ViewChild('selectedStatus', {static: false}) private selectedStatus: MatOption;
  @ViewChild('selectedLevel', {static: false}) private selectedLevel: MatOption;
  @ViewChild('selectedInclude', {static: false}) private selectedInclude: MatOption;
  outcomes;
  active: boolean = true;
  isShowSuspended: boolean = false;
  async ngOnInit() {
    this.reportForm = this.fb.group({ // Login form
      shift: ['', [Validators.required]],
      organization: ['', [Validators.required]],
      facility: ['', [Validators.required]],
      floor: ['', [Validators.required]],
      sector: ['', [Validators.required]],
      // room: ['', [Validators.required]],
      user: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      care: ['', [Validators.required]],
      outcome: [''],
      // startTime: ['00:00'],
      // endTime: ['23:59'],
      residentStatus: ['', [Validators.required]],
      residentLevel: ['', [Validators.required]],
      // include: ['', [Validators.required]],
      //searchCtrl: new FormControl()
      searchCtrl: '',
      facSearch: '',
      floSearch: '',
      secSearch: '',
      usrSearch: '',
      resSearch: '',
      carSearch: '',
      rSearch: '',
      cSearch: '',
      // inSearch: '',
      oSearch: '',
      shiSearch: ''
      //showSuspended : [true]
    });
    let today = new Date();
    let lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    var fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    var fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    var toMax = new Date();


    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: "Done",
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    if (!this.commonService.checkAllPrivilege('Reports')) {
      this.router.navigate(['/']);
    }
    const shiftAr = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shift' }], ...shiftAr];
    this.report.shift = this.shiftArr[0].no;
    this.changeShift(0);
    this.loadCarelevel();
    this.commonService.setLoader(true);



    const startDateData = moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const endDateData = moment().set({ hour: 23, minute: 59, second: 0, millisecond: 0 });
    this.start_date = startDateData['_d'].getTime();
    this.end_date = endDateData['_d'].getTime();


    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset
        this.options.toMinMax.toDate = this.getCurrentDateFromTimezone()
        await this.getorg();
        await this.getAllcares();
      }
    });
    this.subscription = this.commonService.floorcontentdata.subscribe(async (data: any) => {
      if (data) {
        this.floorlist = data;
      }
    });
    const action = { type: 'GET', target: 'cares/getcareoutcome' };
    const payload = { 'flag': 'report' };
    const result = await this.apiService.apiFn(action, payload);
    this.outcomes = result['data'].map(function (obj) {
      const rObj = {};
      rObj['value'] = obj.name;
      rObj['key'] = obj.name;
      return rObj;
    });

  }

  async getorg() {
    let value;
    // get organization list:
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.orgfac = result['data'];
    this.organiz = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['value'] = obj._id.org.org_name;
      rObj['key'] = obj._id.org._id;
      return rObj;
    });
    if (this.organization || this.organiz.length === 1) {
      this.commonService.setLoader(true);
      value = this.organization;
      if (this.organization) {
        this.report.organization = [value];
        this.reportForm.controls.organization.patchValue([value]);
      }

      this.allFacilities();
    }
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
  }

  setupPresets() {

    let backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    }

    let startOfMonth = (month, year) => {
      return new Date(year, month, 1);
    }

    let endOfMonth = (month, year) => {
      return new Date(year, month + 1, 0);
    }

    let today = new Date();
    let yesterday = backDate(1);
    let minus7 = backDate(7)
    let minus30 = backDate(30);
    let monthFirstDate = startOfMonth(today.getMonth(), today.getFullYear());
    let monthEndDate = endOfMonth(today.getMonth(), today.getFullYear());
    let lastMonthFirstDate = startOfMonth(today.getMonth() - 1, today.getFullYear());
    let LastMonthEndDate = endOfMonth(today.getMonth() - 1, today.getFullYear());

    this.presets = [
      { presetLabel: "Today", range: { fromDate: today, toDate: today } },
      { presetLabel: "Yesterday", range: { fromDate: yesterday, toDate: today } },
      { presetLabel: "Last 7 Days", range: { fromDate: minus7, toDate: today } },
      { presetLabel: "Last 30 Days", range: { fromDate: minus30, toDate: today } },
      { presetLabel: "This Month", range: { fromDate: monthFirstDate, toDate: today } },
      { presetLabel: "Last Month", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
      { presetLabel: "Custom Range", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
    ]
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {    
    const today_st = moment();
    const today_ed = moment();
    let sDate, eDate;
    const today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const today_end = today_ed.set({ hour: 23, minute: 0, second: 0, millisecond: 0 });
    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      sDate = moment(range['startDate']).format('YYYY-MM-DD');

      this.start_date = range['startDate']['_d'].getTime();
    } else if (range.fromDate) {
      //This condition for new Date Picker
      range['fromDate'] = moment(range['fromDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.start_date = (range.fromDate).getTime();
    } else {
      sDate = moment(today_start['_d']).format('YYYY-MM-DD');

      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({ hour: 23, minute: 0, second: 0, millisecond: 0 });
      eDate = moment(today_start['_d']).format('YYYY-MM-DD');
      this.end_date = range['endDate']['_d'].getTime();
    }
    else if (range.toDate) {
      range['toDate'] = moment(range['toDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.end_date = (range.toDate).getTime()
    }
    else {
      eDate = moment(today_end['_d']).format('YYYY-MM-DD');

      this.end_date = today_end['_d'].getTime();
    }
    if (eDate === sDate) {
      this.datevalidation = true;
    } else {
      this.datevalidation = false;
    }

    // if((range['startDate'] && range['startDate']['_d']) && (range['endDate'] && range['endDate']['_d'])){
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getResidentWithDateWiseCareslevel(this.start_date, this.end_date)
    }

    // }
  }

  async getAllusers() {
    this.alluser = true;
    const output = [];
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac'
    };
    const payload = {
      'organization': this.reportForm.controls.organization.value,
      'facility': this.reportForm.controls.facility.value,
      'active': this.active
    };
    const result = await this.apiService.apiFn(action, payload);
    this.userslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['key'] = obj._id;
      return robj;
    });

    this.userslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });

    this.reportForm.controls.user
      .patchValue([...this.userslist.map(item => item.key), 0]);

    for (let i = 0; i < this.report.user.length; i++) {
      if (this.report.user[i] === 0) {
        this.report.user.splice(i, 1);
      }
    }
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }

  }

  async getAllresidents() {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': this.reportForm.controls.organization.value,
      'facility': this.reportForm.controls.facility.value,
      'resident_status': this.reportForm.controls.residentStatus.value,
      'care_level': this.reportForm.controls.residentLevel.value,
    };

    const result = await this.apiService.apiFn(action, payload);

    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${(obj['room'] && obj['room']['room']) ? obj['room']['room'] : ''}`
      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.resident
      .patchValue([...this.residentslist.map(item => item.key), 0]);
    // }
  }

  async getAllcares() {
    const action = {
      type: 'GET',
      target: 'cares/getCares'
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.carelist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['name'];
      robj['key'] = obj._id;
      return robj;
    });
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
  }

  async getResidentWithDateWiseCareslevel(sdate, edate) {
    // return;
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': this.reportForm.controls.organization.value,
      'facility': this.reportForm.controls.facility.value,
      'resident_status': this.reportForm.controls.residentStatus.value,
      'care_level': this.reportForm.controls.residentLevel.value,
      'start_date': sdate,
      'end_date': edate
    };

    const result = await this.apiService.apiFn(action, payload);

    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${(obj['room'] && obj['room']['room']) ? obj['room']['room'] : ''}`
      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.resident
      .patchValue([...this.residentslist.map(item => item.key), 0]);
    // }
  }

  changeActive(event) {
    this.active = event.checked;

    this.getAllusers()
  }

  async reportsSave(report, isValid, issave) {
    
    // if(report.residentStatus.includes("Hospitalized") || report.residentStatus.includes("Vacation") || report.residentStatus.includes("Skilled Nursing")){
    //   // check if Out of facility selected. If not then set it
    //   if(!report.include.includes("is_out_of_fac") ){
    //       report.include.push("is_out_of_fac");
    //   }
    // }
    console.log("=== After Save ==", report, this.report['startTime'])
    if (!this.report['startTime']) {
      this.nullStartDateValidation = true
    } else {
      this.nullStartDateValidation = false
    }

    if (!this.report['endTime']) {
      this.nullEndDateValidation = true
    } else {
      this.nullEndDateValidation = false
    }

    if (isValid) {

      // this.start = this.report['startTime'];
      // this.end = this.report['endTime'];
      // if (this.report['startTime'] !== '00:00' && this.report['startTime']) {
      //   this.start = moment(this.report['startTime']).format('HH:mm');
      // }

      // if (this.report['endTime'] !== '23:59' && this.report['endTime']) {
      //   this.end_date = moment(this.end_date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      //   this.end_date = this.end_date['_d'].getTime();
      //   this.end = moment(this.report['endTime']).format('HH:mm');
      // }

      // const time1 = this.start.split(':');
      // const time2 = this.end.split(':');

      this.start_date = moment(this.start_date).set({ hour: this.startHour, minute: 45, second: 0, millisecond: 0 });

      this.start_date = this.start_date['_d'].getTime();

      this.end_date = moment(this.end_date).set({ hour: this.endHour, minute: this.endMinute, second: 0, millisecond: 0 });
      this.end_date = this.end_date['_d'].getTime();

      // if (time1[0] === time2[0] && time1[1] === time2[1]) {
      //   this.equalvalidation = true;
      //   isValid = false;
      //   this.endvalidationqual = false;
      //   this.minutevalid = false;

      //   this.endtimevalidation = false;
      // } else {

      //   if (this.datevalidation) {

      //     this.equalvalidation = false;
      //     if (time1[0] > time2[0]) {

      //       isValid = false;
      //       this.endtimevalidation = true;
      //       this.endvalidationqual = false;
      //       this.minutevalid = false;
      //     } else {

      //       if ((time1[0] === time2[0]) && (time1[1] === time2[1])) {

      //         this.endvalidationqual = true;
      //         this.minutevalid = false;
      //         isValid = false;
      //         this.endtimevalidation = false;
      //         this.equalvalidation = false;
      //       } else {

      //         if (time1[0] === time2[0] && time1[1] > time2[1]) {

      //           this.minutevalid = true;
      //           this.endtimevalidation = true;
      //           isValid = false;

      //           this.equalvalidation = false;
      //           this.endvalidationqual = false;
      //         }
      //       }

      //     }

      //   } else {

      //     if ((time1[0] === time2[0]) && (time1[1] === time2[1])) {

      //       this.endvalidationqual = true;
      //       this.minutevalid = false;
      //       isValid = false;
      //       this.endtimevalidation = false;
      //       this.equalvalidation = false;
      //     } else {
      //       if (time1[0] === time2[0] && time1[1] > time2[1]) {
      //         this.minutevalid = true;
      //         this.endtimevalidation = true;
      //         isValid = false;
      //         this.equalvalidation = false;
      //         this.endvalidationqual = false;
      //       }
      //     }
      //     this.endvalidationqual = false;
      //     this.endtimevalidation = false;
      //   //  this.minutevalid = false;
      //  //   this.equalvalidation = false;
      //   }
      // }


      if (isValid) {

        if (this.selectedResident.selected) {
          this.allResidents = true;
        }
        if (this.selectedUser.selected) {
          this.allStaff = true;
        }
        if (this.CheckIn && this.reportForm.controls.care.value.length === 1) {
          this.CheckIn = true;
        } else {
          this.CheckIn = false;
        }


        if (this.selectedCare.selected) {
          this.allCares = true;
        }

        const data = {
          'org_list': this.reportForm.controls.organization.value.filter(function (item) {
            return item !== 0;
          }),
          'fac_list': this.reportForm.controls.facility.value.filter(function (item) {
            return item !== 0;
          }),
          'floor_list': this.reportForm.controls.floor.value,
          'sector_list': this.reportForm.controls.sector.value,
          'staff_list': this.reportForm.controls.user.value.filter(function (item) {
            return item !== 0;
          }),
          'res_list': this.reportForm.controls.resident.value,
          'care_list': this.reportForm.controls.care.value.filter(function (item) {
            return item !== 0;
          }),
          'outcomes': this.reportForm.controls.outcome.value ? this.reportForm.controls.outcome.value.filter(function (item) {
            return item !== 0;
          }) : this.report.outcome,
          'issave': issave,
          'start_date': moment(this.start_date).tz(this.timezone, true).valueOf(),
          'end_date': moment(this.end_date).tz(this.timezone, true).valueOf(),
          'allCares': this.allCares,
          'allResidents': this.allResidents,
          'allStaff': this.allStaff,
          'include': ['isCallLight', 'isFind', 'isNotify', 'is_out_of_fac', 'isNFC'],//this.reportForm.controls.include.value,
          'checkinOnly': this.CheckIn,
          'startHours': this.startHour,//moment(this.start_date).tz(this.timezone,true).utc().hours(),
          'endHours': this.endHour,//moment(this.end_date).tz(this.timezone,true).utc().hours(),
          'startMinutes': this.startMinute, //moment(this.start_date).tz(this.timezone,true).utc().minutes(),
          'endMinutes': this.endMinute,//moment(this.end_date).tz(this.timezone,true).utc().minutes(),
          'timezone': this.timezone,
          'show_suspended_care': this.isShowSuspended,//this.reportForm.controls.showSuspended.value
          'care_level_list': this.reportForm.controls.residentLevel.value.filter(function (item) {
            return item !== 0;
          }),
          'allcare_level': this.alllevel

        };
        console.log('-------custom report data-------', data)
        // return

        this.reportData = data;
        if (issave === true) {
          const dialogRef = this.dialog.open(SavereportComponent, {
            width: '350px',
            data: { report: this.reportData }
          });
        } else {
          const action = {
            type: 'POST',
            target: 'reports/save'
          };
          const payload = { report: this.reportData };
          const result = await this.apiService.apiFn(action, payload);
          if (result['status']) {
            this.router.navigate(['/reports/report/view', this._aes256Service.encFnWithsalt(result['data']['_id'])]);
          }
        }
      }
    }
  }

  // fetch all facilities on the basis of selected organizations
  async allFacilities() {
    this.facilityDropdown = null;
    this.report.facility = null;

    this.floorDropdown = null;
    this.sectorDropdown = null;
    this.userslist = null;
    let output = [];
    if (this.reportForm.controls.organization.value || this.report.organization) {
      output = [];
    }
    const match = this.reportForm.controls.organization.value || this.report.organization;
    const action = { type: 'GET', target: 'users/get_fac' };
    const payload = { 'organization': match };
    const result = await this.apiService.apiFn(action, payload);
    this.facilityDropdown = result['data'];
    this.facilityData = result['data'];
    // tslint:disable-next-line: no-shadowed-variable
    output = this.facilityDropdown.reduce((output, item) => {
      const index = output.findIndex(o =>

        o.name === item.org.org_name);
      if (index >= 0) {
        output[index].fac.push({
          key: item._id.fac._id,
          value: item._id.fac.fac_name
        });
      } else {
        output.push({
          name: item.org.org_name,
          fac_id: item._id.fac._id,
          fac: [{
            key: item._id.fac._id,
            value: item._id.fac.fac_name
          }]
        });
      }
      return output;
    }, []);
    this.facilityDropdown = output;
    // this.reportForm.controls.floor
    // .patchValue([...this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat(), 0]);

    if (!this.allorg) {
      this.reportForm.controls.organization.setValue(this.report.organization);
      const data = this.reportForm.controls.organization.value.filter(function (item) {
        return item !== 0;
      });
      this.report.facility = [this.facility];
      this.reportForm.controls.facility.patchValue([this.facility]);


      this.allFloors();
      this.getAllusers();

    } else {
      let arr = [...this.facilityDropdown.map(item => item.fac.map(itm => itm.key)).flat()];
      this.reportForm.controls.facility.patchValue(arr);
      this.allFloors();
      this.getAllusers();

    }
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }

  }

  selectOrg(all, id) {
    this.allorg = true;
    this.facilityDropdown = null;
    this.report.facility = null;
    this.residentslist = null;
    this.report.resident = null;

    this.allFacilities();
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }
    if (this.reportForm.controls.organization.value.length === this.organiz.length) {
      this.allSelected.select();
    }
    for (let i = 0; i < this.report.organization.length; i++) {
      if (this.report.organization[i] === 0) {
        this.report.organization.splice(i, 1);
      }
    }
  }

  async selectAllOrg() {
    this.allorg = true;
    this.facilityDropdown = null;
    this.report.facility = null;
    if (this.allSelected.selected) {
      this.reportForm.controls.organization
        .patchValue([...this.organiz.map(item => item.key), 0]);
      for (let i = 0; i < this.report.organization.length; i++) {
        if (this.report.organization[i] === 0) {
          this.report.organization.splice(i, 1);
        }
      }

      await this.allFacilities();
    } else {
      this.facilityDropdown = null;
      this.floorDropdown = null;
      this.sectorDropdown = null;
      this.zoneDropdown = null;
      this.report.facility = null;
      this.report.floor = null;
      this.report.sector = null;
      this.report.room = null;
      this.userslist = null;
      this.report.user = null;
      this.residentslist = null;
      this.report.resident = null;
      this.reportForm.controls.organization.patchValue([]);
    }

  }

  selectAllFac() {
    this.commonService.setLoader(true);
    this.allfac = true;
    this.userslist = null;
    this.report.user = null;
    this.residentslist = null;
    this.report.resident = null;
    this.floorDropdown = null;
    this.sectorDropdown = null;
    this.report.floor = null;
    this.report.sector = null;
    if (this.selectedFacility.selected) {
      this.reportForm.controls.facility
        .patchValue([...this.facilityDropdown.map(item => item.fac.map(itm => itm.key)).flat(), 0]);
      this.allFloors();

      this.getAllusers();
      if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
        this.getAllresidents();
      }
      for (let i = 0; i < this.report.facility.length; i++) {
        if (this.report.facility[i] === 0) {
          this.report.facility.splice(i, 1);
        }
      }
    } else {
      this.floorDropdown = null;
      this.sectorDropdown = null;
      this.report.floor = null;
      this.report.sector = null;
      this.userslist = null;
      this.report.user = null;
      this.residentslist = null;
      this.report.resident = null;
      this.report.residentStatus = null;
      this.report.residentLevel = null;
      this.report.include = null;
      this.report.outcome = null;
      this.report.care = null;
      this.reportForm.controls.facility.patchValue([]);
      this.commonService.setLoader(false);
      if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
        this.getAllresidents();
      }
    }

  }

  selectFac(id) {
    this.allfac = true;
    this.floorDropdown = null;
    this.sectorDropdown = null;
    this.zoneDropdown = null;

    this.report.floor = null;
    this.report.sector = null;
    this.report.room = null;

    this.userslist = null;
    this.report.user = null;
    this.residentslist = null;
    this.report.resident = null;

    this.allFloors();

    this.getAllusers();

    if (this.selectedFacility.selected) {
      this.selectedFacility.deselect();
      return false;
    }

    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    const data = this.facilityDropdown.map(item => item.fac.map(itm => itm.key)).flat();

    if (this.reportForm.controls.facility.value.length === data.length) {
      this.selectedFacility.select();
    }

    for (let i = 0; i < this.report.facility.length; i++) {
      if (this.report.facility[i] === 0) {
        this.report.facility.splice(i, 1);
      }
    }
  }

  async allFloors() {
    let output = [];
    if (this.reportForm.controls.facility.value) {
      output = [];
    }
    const action = {
      type: 'GET',
      target: 'floorsector/floorsectorByMultipleFac'
    };
    this.reportForm.controls.facility.setValue(this.report.facility);
    const data = this.reportForm.controls.facility.value.filter(function (item) {
      return item !== 0;
    });
    const payload = { facId: data };
    const result = await this.apiService.apiFn(action, payload);
    this.floorDropdown = result['data'];
    this.floorData = result['data'];
    // tslint:disable-next-line: no-shadowed-variable
    output = this.floorDropdown.reduce((output, item) => {
      const index = output.findIndex(o =>
        o.name === item.fac_id.fac_name);
      if (index >= 0) {
        output[index].floor.push({
          key: item._id,
          value: item.floor
        });
      } else {
        output.push({
          name: item.fac_id.fac_name,
          sector: item.sector,
          floor: [{
            key: item._id,
            value: item.floor
          }]
        });
      }
      return output;
    }, []);
    this.floorDropdown = output.sort(function (a, b) {
      const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.floor
      .patchValue([...this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat(), 0]);

    this.allSectors();
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {

      this.getAllresidents();
    }
    this.commonService.setLoader(false);
  }

  selectAllFloor() {
    this.allfloor = true;

    if (this.selectedFloor.selected) {
      this.reportForm.controls.floor
        .patchValue([...this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat(), 0]);
      this.allSectors();
      if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
        this.getAllresidents();
      }
      for (let i = 0; i < this.report.floor.length; i++) {
        if (this.report.floor[i] === 0) {
          this.report.floor.splice(i, 1);
        }
      }
    } else {
      this.sectorDropdown = null;
      this.zoneDropdown = null;

      this.report.sector = null;
      this.report.room = null;

      this.reportForm.controls.floor.patchValue([]);
    }

  }

  selectFloor(id) {
    this.allfloor = true;
    this.sectorDropdown = null;
    this.zoneDropdown = null;

    this.report.sector = null;
    this.report.room = null;

    this.allSectors();
    if (this.selectedFloor.selected) {
      this.selectedFloor.deselect();
      return false;
    }
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    const data = this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat();
    if (this.reportForm.controls.floor.value.length === data.length) {
      this.selectedFloor.select();
    }

    for (let i = 0; i < this.report.floor.length; i++) {
      if (this.report.floor[i] === 0) {
        this.report.floor.splice(i, 1);
      }
    }

  }

  allSectors() {
    let data;
    if (this.floorData && this.reportForm.controls.floor.value) {
      data = this.reportForm.controls.floor.value.filter(function (item) {
        return item !== 0;
      });
    }
    this.sectorDropdown = this.floorData.filter(_ =>
      data.indexOf(_._id) > -1).map(({ fac_id, ...item }) =>
        ({ ...item, sector: this.sectorSort(item.sector), name: `${fac_id.fac_name} ( Floor:-${item.floor} )` })
      );
    this.sectorDropdown.sort(function (a, b) {
      const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.sector
      .patchValue([...this.sectorDropdown.map(item => item.sector.map(itm => itm._id)).flat(), 0]);
    this.reportForm.controls.care
      .patchValue([...this.carelist.map(item => item.key), 0]);
    // this.reportForm.controls.include
    //   .patchValue([...this.includes.map(item => item.key), 0]);
    // const index = this.reportForm.controls.include.value.indexOf(0);
    // if (index > -1) {
    //   this.reportForm.controls.include.value.splice(index, 1);
    // }
    this.reportForm.controls.outcome
      .patchValue([...this.outcomes.map(item => item.key), 0]);
    this.reportForm.controls.residentLevel
      .patchValue([...this.carelevelData.map(item => item.value), 0]);
    this.reportForm.controls.residentStatus
      .patchValue([...this.statusData.map(item => item.label), 0]);
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    // }
  }

  sectorSort(sortdata) {
    return sortdata.sort(function (a, b) {
      const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  }

  selectAllSector() {
    this.allsector = true;

    if (this.selectedSector.selected) {
      this.reportForm.controls.sector
        .patchValue([...this.sectorDropdown.map(item => item.sector.map(itm => itm._id)).flat(), 0]);
      if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
        this.getAllresidents();
      }
      for (let i = 0; i < this.report.sector.length; i++) {
        if (this.report.sector[i] === 0) {
          this.report.sector.splice(i, 1);
        }
      }
    } else {
      this.zoneDropdown = null;
      this.report.room = null;

      this.reportForm.controls.sector.patchValue([]);
    }
  }

  selectSector(id) {
    this.allsector = true;
    this.zoneDropdown = null;
    this.report.room = null;

    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    if (this.selectedSector.selected) {
      this.selectedSector.deselect();
      return false;
    }


    const data = this.sectorDropdown.map(item => item.sector.map(itm => itm._id)).flat();
    if (this.reportForm.controls.sector.value.length === data.length) {
      this.selectedSector.select();
    }
    for (let i = 0; i < this.report.sector.length; i++) {
      if (this.report.sector[i] === 0) {
        this.report.sector.splice(i, 1);
      }
    }
  }

  async allZones() {
    if (this.reportForm.controls.sector.value) {
    }
    const data = this.reportForm.controls.sector.value.filter(function (item) {
      return item !== 0;
    });
    const action = {
      type: 'GET',
      target: 'zones/ZonesByMultipleSec'
    };
    const payload = { sectorId: data };
    const result = await this.apiService.apiFn(action, payload);
    const result1 = result['data'].reduce(function (sectors, currentValue) {
      if (sectors.indexOf(currentValue.sector) === -1) {
        sectors.push(currentValue.sector);
      }
      return sectors;
    }, []).map(sector => {
      const filtered = result['data'].filter(_el => {
        return _el.sector === sector;
      });
      const srch = filtered[0];
      return {
        sector: sector,
        name: `${srch.fac.fac_name} (Floor-${srch.floor.floor} ,Sector-${srch.floor.sector.filter(el => el._id === sector)[0].name})`,
        room: filtered.map(_el => ({ _id: _el['_id'], name: _el['room'] }))
      };
    });
    this.zoneDropdown = result1;
  }

  // get facility list on the basis of organization
  async changeOrg(org) {
    this.report.facility = '';

    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { 'org_id': org };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.fac_name;
      rObj['value'] = obj._id;
      return rObj;
    });

  }

  // get floor list on the basis of facility
  async changeFac(fac) {
    const action = { type: 'GET', target: 'floorsector/floorsector_list' };
    const payload = { 'facId': fac };
    const result = await this.apiService.apiFn(action, payload);
    const secFac = result['data'];
    const _floors = [];
    this.floorlist = secFac.map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.floor;
      rObj['value'] = obj._id;
      rObj['sector'] = obj.sector;
      return rObj;
    });

  }

  // get sector list on the basis of floor
  async changeFloor(floor) {
    const _secList = [];
    this.seclist = this.floorlist.map(function (it) {
      if (it.value === floor) {
        it['sector'].map(function (item) {
          _secList.push(item);
        });
      }
    });
    this.seclist = _secList.map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.name;
      rObj['value'] = obj._id;
      return rObj;
    });
  }

  // get zone list on the basis of sector
  async changeSector(sector) {
    const action = { type: 'GET', target: 'zones/zone_list' };
    const payload = { 'sectorId': [sector] };
    const result = await this.apiService.apiFn(action, payload);
    this.zonelist = result['data'].map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.room;
      rObj['value'] = obj._id;
      return rObj;
    });
  }

  selectAllusers() {

    this.alluser = true;
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    if (this.selectedUser.selected) {
      this.reportForm.controls.user
        .patchValue([...this.userslist.map(item => item.key), 0]);

    } else {
      this.reportForm.controls.user.patchValue([]);

    }


  }

  selectUser(all, id) {

    this.alluser = true;
    if (this.selectedUser.selected) {
      this.selectedUser.deselect();
      return false;
    }

    if (this.reportForm.controls.user.value.length === this.userslist.length) {
      this.selectedUser.select();


    }
    for (let i = 0; i < this.report.user.length; i++) {
      if (this.report.user[i] === 0) {
        this.report.user.splice(i, 1);
      }
    }



  }

  selectAllresidents() {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.reportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.report.resident.length; i++) {
        if (this.report.resident[i] === 0) {
          this.report.resident.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.resident.patchValue([]);
    }
  }

  selectResident(all, id) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }

    if (this.reportForm.controls.resident.value.length === this.residentslist.length) {
      this.selectedResident.select();
    }

    for (let i = 0; i < this.report.resident.length; i++) {
      if (this.report.resident[i] === 0) {
        this.report.resident.splice(i, 1);
      }
    }

  }

  selectAllcares() {

    if (this.selectedCare.selected) {
      this.allCares = true;
      this.reportForm.controls.care
        .patchValue([...this.carelist.map(item => item.key), 0]);
      for (let i = 0; i < this.report.care.length; i++) {
        if (this.report.care[i] === 0) {
          this.report.care.splice(i, 1);
        }
      }
    } else {
      this.allCares = false;
      this.reportForm.controls.care.patchValue([]);
    }
  }

  selectCare(id, value) {
    if (value === 'Check-In') {
      this.CheckIn = true;
    }
    this.allCares = false;
    if (this.selectedCare.selected) {
      this.selectedCare.deselect();
      return false;
    }

    if (this.reportForm.controls.care.value.length === this.carelist.length) {
      this.selectedCare.select();
    }
    this.report.care = this.reportForm.controls.care.value;

    for (let i = 0; i < this.report.care.length; i++) {
      if (this.report.care[i] === 0) {
        this.report.care.splice(i, 1);
      }
    }
  }

  selectAlloutcomes() {
    this.alloutcome = true;
    if (this.selectedOutcome.selected) {
      this.reportForm.controls.outcome
        .patchValue([...this.outcomes.map(item => item.key), 0]);
      for (let i = 0; i < this.report.outcome.length; i++) {
        if (this.report.outcome[i] === 0) {
          this.report.outcome.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.outcome.patchValue([]);
    }
  }

  selectOutcome(value) {
    this.alloutcome = true;
    if (this.selectedOutcome.selected) {
      this.selectedOutcome.deselect();
      return false;
    }

    if (this.reportForm.controls.outcome.value.length === this.outcomes.length) {
      this.selectedOutcome.select();
    }

    for (let i = 0; i < this.report.outcome.length; i++) {
      if (this.report.outcome[i] === 0) {
        this.report.outcome.splice(i, 1);
      }
    }
  }
  selectAllIncludes() {
    this.allinclude = true;
    if (this.selectedInclude.selected) {
      this.reportForm.controls.include
        .patchValue([...this.includes.map(item => item.key), 0]);
      for (let i = 0; i < this.report.include.length; i++) {
        if (this.report.include[i] === 0) {
          this.report.include.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.include.patchValue([]);
    }


  }

  selectInclude(value) {
    this.allinclude = true;
    if (this.selectedInclude.selected) {
      this.selectedInclude.deselect();
      return false;
    }

    if (this.reportForm.controls.include.value.length === this.includes.length) {
      this.selectedInclude.select();
    }

    for (let i = 0; i < this.report.include.length; i++) {
      if (this.report.include[i] === 0) {
        this.report.include.splice(i, 1);
      }
    }
  }

  selectAllZone() {
    if (this.selectedZone.selected) {
      this.reportForm.controls.room
        .patchValue([...this.zoneDropdown.map(item => item.room.map(itm => itm._id)).flat(), 0]);
      this.allZones();
      for (let i = 0; i < this.report.room.length; i++) {
        if (this.report.room[i] === 0) {
          this.report.room.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.room.patchValue([]);
    }
  }

  selectZone(all, id) {
    if (this.selectedZone.selected) {
      this.selectedZone.deselect();
      return false;
    }

    const data = this.zoneDropdown.map(item => item.room.map(itm => itm._id)).flat();
    if (this.reportForm.controls.room.value.length === data.length) {
      this.selectedZone.select();
    }

    for (let i = 0; i < this.report.room.length; i++) {
      if (this.report.room[i] === 0) {
        this.report.room.splice(i, 1);
      }
    }
  }

  cancelForm() {
    this.router.navigate(['/reports']);
  }

  selectAllstatus() {
    this.allstatus = true;
    this.residentslist = null;
    this.report.resident = null;
    if (this.selectedStatus.selected) {
      this.reportForm.controls.residentStatus
        .patchValue([...this.statusData.map(item => item.label), 0]);

      for (let i = 0; i < this.report.residentStatus.length; i++) {
        if (this.report.residentStatus[i] === 0) {
          this.report.residentStatus.splice(i, 1);
        }
      }
      if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
        this.getAllresidents();
      }
    } else {
      this.residentslist = null;
      this.report.resident = null;
      this.reportForm.controls.residentStatus.patchValue([]);
    }
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
  }

  selectStatus(all, id) {
    this.allstatus = true;
    this.residentslist = null;
    this.report.resident = null;
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    if (this.selectedStatus.selected) {
      this.selectedStatus.deselect();
      return false;
    }

    if (this.reportForm.controls.residentStatus.value.length === this.statusData.length) {
      this.selectedStatus.select();
    }

    for (let i = 0; i < this.report.residentStatus.length; i++) {
      if (this.report.residentStatus[i] === 0) {
        this.report.residentStatus.splice(i, 1);
      }
    }
  }

  selectAllLevel() {
    this.alllevel = true;
    if (this.selectedLevel.selected) {
      this.reportForm.controls.residentLevel
        .patchValue([...this.carelevelData.map(item => item.value), 0]);
      if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
        this.getAllresidents();
      }
      for (let i = 0; i < this.report.residentLevel.length; i++) {
        if (this.report.residentLevel[i] === 0) {
          this.report.residentLevel.splice(i, 1);
        }
      }
    } else {
      this.alllevel = false;
      this.residentslist = null;
      this.report.resident = null;
      this.reportForm.controls.residentLevel.patchValue([]);
    }
  }

  selectLevel(all, id) {
    this.alllevel = true;
    this.residentslist = null;
    this.report.resident = null;
    if (this.reportForm.controls.organization.value && this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value && this.reportForm.controls.residentLevel.value) {
      this.getAllresidents();
    }
    if (this.selectedLevel.selected) {
      this.selectedLevel.deselect();
      return false;
    }
    if (this.reportForm.controls.residentLevel.value.length === this.carelevelData.length) {
      this.selectedLevel.select();
    }
    for (let i = 0; i < this.report.residentLevel.length; i++) {
      if (this.report.residentLevel[i] === 0) {
        this.report.residentLevel.splice(i, 1);
      }
    }
  }

  viewReports() {
    this.router.navigate(['/reports/view/custom/report']);
  }
  async loadCarelevel() {
    const action = { type: 'GET', target: 'residents/carelevellist' };
    const payload = { date: new Date() };
    const result = await this.apiService.apiFn(action, payload);
    this.carelevelData = result['data'];
  }
  removeValidationStartTime(e) {
    this.nullStartDateValidation = false
  }
  removeValidationEndTime(e) {
    this.nullEndDateValidation = false
  }
  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }
  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }

  changeShift(shiftNo) {    
    let hours;
    if (shiftNo === 0) {
      hours = Array.from({ length: 12 }, (v, k) => k);
      this.shiftType = 'All Shift';
      this.startTime.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      //this.endTime = moment(this.startTime).add(1, 'days');
      //this.endTime = moment(this.startTime).add(24, 'hours');
      this.endTime.set({ hour: 23, minute: 59, second: 0, millisecond: 0 });
    } else if (shiftNo === 1) {
      hours = Array.from({ length: 4 }, (v, k) => k);
      this.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.startTime.set({ hour: 5, minute: 45, second: 0, millisecond: 0 });
      this.endTime = moment(this.startTime).add(8, 'hours');
    } else if (shiftNo === 2) {
      hours = Array.from({ length: 4 }, (v, k) => k);
      this.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.startTime.set({ hour: 13, minute: 45, second: 0, millisecond: 0 });
      this.endTime = moment(this.startTime).add(8, 'hours');
    } else if (shiftNo === 3) {
      hours = Array.from({ length: 4 }, (v, k) => k);
      this.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.startTime.set({ hour: 21, minute: 45, second: 0, millisecond: 0 });
      this.endTime = moment(this.startTime).add(8, 'hours');
    }

    this.startHour = moment(this.startTime).hours();
    this.startMinute = moment(this.startTime).minutes();
    this.endHour = moment(this.endTime).hours();
    this.endMinute = moment(this.endTime).minutes();
  }
}

