import { NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from './../../../shared/services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { MatOption } from '@angular/material';
import { Router } from '@angular/router';
import { insertRefFn } from '../../../shared/store/shiftReport/action';
import * as moment from 'moment';
import { AmazingTimePickerService } from 'amazing-time-picker';
import { NgxDrpOptions, PresetItem, Range, RangeStoreService } from 'ngx-mat-daterange-picker';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';

interface shiftRepState {
  _shiftRep: object;
}

@Component({
  selector: 'app-roomcleanreport',
  templateUrl: './roomcleaningreport.component.html',
  styleUrls: ['./roomcleaningreport.component.scss']
})
export class RoomCleaningReportComponent implements OnInit {
  shiftArr;
  userIdArr = [];
  userlist;
  userListCount;
  shift;
  newDate1 = moment();
  newDate2 = moment();
  sTime;
  eTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;

  roomcleanreport:any = {
    organization: '',
    facility: '',
    shift: '',
    user: '',
    resident:''
  }
  faclist; org_name;
  fac_name; facility; organiz;
  toggleValue: Boolean = true;
  start_date;
  end_date;
  isSelectAll = false;
  facId;
  allresident = false;
  residentslist = [];
  report: any = {
    organization: '',
    facility: '',
    user: '',
    shift: '',
    shiftype: ''
  };

  private subscription: Subscription;
  @ViewChild('selectedResident', {static: true}) private selectedResident: MatOption;
  constructor(
    private fb: FormBuilder,
    private _shiftRep: Store<shiftRepState>,
    private apiService: ApiService,
    private atp: AmazingTimePickerService,
    private toastr: ToastrService,
    private router: Router,
    private rangeStoreService: RangeStoreService,
    public commonService: CommonService
  ) { }

  selected = [moment(), moment()];
  alwaysShowCalendars: boolean;
  floorlist;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
  range: Range = { fromDate: new Date(), toDate: new Date() };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  @ViewChild('dateRangePicker', {static: true}) dateRangePicker;
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  @ViewChild('selectedUser', {static: true}) private selectedUser: MatOption;
  reportForm: FormGroup;
  shiSearch='';
  usrSearch='';
  rSearch='';
  async ngOnInit() {

    
    let today = new Date();
    let lastMonth = new Date(today.getFullYear(),today.getMonth() - 1);
    var fromMin = new Date(today.getFullYear()-10, today.getMonth(), 1);
    var fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var toMin = new Date(today.getFullYear()-10, today.getMonth(), 1);
    var toMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: "Done",
      fromMinMax: {fromDate:fromMin, toDate:fromMax},
      toMinMax: {fromDate:toMin, toDate:toMax},
    };

    if(!this.commonService.checkAllPrivilege('Reports')){
      this.router.navigate(['/']);
    }
    this.commonService.setLoader(true);
    this.reportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: [''],
      shiSearch:'',
      usrSearch:'',
      rSearch:''
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shift' }], ...shiftarray];
    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.roomcleanreport.user = '';
        this.userlist = null;
        this.roomcleanreport.organization = contentVal.org;
        this.roomcleanreport.facility = contentVal.fac;
        const action = {
          type: 'GET',
          target: 'users/get_users_org_fac'
        }
        const payload = {
          organization: [this.roomcleanreport.organization],
          facility: [this.roomcleanreport.facility]
        };
        var result = await this.apiService.apiFn(action, payload);
        result = result['data'];
        var result = await this.apiService.apiFn(action, payload);
        this.userlist = await result['data'].map(function (obj) {
          var robj = {};
          robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
          robj['_id'] = obj._id;
          return robj;
        })
        this.userlist.sort(function (a, b) {
          var nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
          if (nameA < nameB) //sort string ascending
            return -1
          if (nameA > nameB)
            return 1
          return 0 //default return value (no sorting)
        })
        this.reportForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
        this.getAllresidents();
        this.commonService.setLoader(false);
      }
    })
    this.subscription = this.commonService.floorcontentdata.subscribe(async (data: any) => {
      if (data) {
        this.floorlist = data;
      }
    })
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  async getAllresidents() {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': [this.roomcleanreport.organization],
      'facility': [this.roomcleanreport.facility]
    };

    const result = await this.apiService.apiFn(action, payload);

    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value']=`${obj['last_name']}, ${obj['first_name']}\u00A0\ ${(obj['room']&&obj['room']['room'])?obj['room']['room']:''}`
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
    for (let i = 0; i < this.roomcleanreport.user.length; i++) {
      if (this.roomcleanreport.user[i] === 0) {
        this.roomcleanreport.user.splice(i, 1);
      }
    }
  }

  async setupPresets() {

    let backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    }

    let startOfMonth = (month,year) =>{
         return new Date(year, month, 1);
    }

    let endOfMonth = (month,year) =>{
      return new Date(year, month + 1, 0);
    }
  
    let today = new Date();
    let yesterday = backDate(1);
    let minus7 = backDate(7)
    let minus30 = backDate(30);
    let monthFirstDate = startOfMonth(today.getMonth(),today.getFullYear());
    let monthEndDate = endOfMonth(today.getMonth(),today.getFullYear());
    let lastMonthFirstDate = startOfMonth(today.getMonth() -1 ,today.getFullYear());
    let LastMonthEndDate = endOfMonth(today.getMonth() -1,today.getFullYear());

    this.presets = [
      { presetLabel: "Today", range: { fromDate: today, toDate: today } },
      { presetLabel: "Yesterday", range: { fromDate: yesterday, toDate: today } },
      { presetLabel: "Last 7 Days", range: { fromDate: minus7, toDate: today } },
      { presetLabel: "Last 30 Days", range: { fromDate: minus30, toDate: today } },
      { presetLabel: "This Month", range: { fromDate: monthFirstDate, toDate: monthEndDate } },
      { presetLabel: "Last Month", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
      { presetLabel: "Custom Range", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
    ]
  }

  selectAllresidents() {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.reportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.roomcleanreport.resident.length; i++) {
        if (this.roomcleanreport.resident[i] === 0) {
          this.roomcleanreport.resident.splice(i, 1);
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

    for (let i = 0; i < this.roomcleanreport.resident.length; i++) {
      if (this.roomcleanreport.resident[i] === 0) {
        this.roomcleanreport.resident.splice(i, 1);
      }
    }
  }

  updateRange(range: Range) {
    var today_st = moment();
    var today_ed = moment();
    var today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    var today_end = today_ed.set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      this.start_date = range['startDate']['_d'].getTime();
    }else if(range.fromDate) {
      //This condition for new Date Picker
      range['fromDate'] =moment( range['fromDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.start_date = (range.fromDate).getTime();
    } else {
      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
      this.end_date = range['endDate']['_d'].getTime();
    }else if(range.toDate){
      range['toDate'] = moment(range['toDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.end_date = (range.toDate).getTime()
    } else {
      this.end_date = today_end['_d'].getTime();
    }
  }

  async submit(report, isValid) {
    if (isValid) {
      const s = moment(this.start_date);
      let e;
      if (report.shift == 3) {
        e = moment(this.end_date).add(1, 'day');
      } else {
        e = moment(this.end_date);
      }
      s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      this.start_date = s['_d'].getTime();
      this.end_date = e['_d'].getTime();
      let ss, ee;
      ss = moment(this.start_date);
      ee = moment(this.end_date);
      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        'shift': report.shift,
        'start_date': this.start_date,
        'end_date': this.end_date,
        'userId': report.user,
        'residentId': report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.roomcleanreport.facility,
        sMinute: this.sMinute,
        eMinute: this.sMinute
      };

      this._shiftRep.dispatch(insertRefFn(payload));
      this.router.navigate(['/reports/roomcleanreport']);
    } else {
      return;
    }
  }

  cancel() {
    this.router.navigate(['/reports']);
  }

  async loadUserList(shiftNo) {
    this.shift = shiftNo;
  }


  async changeOrg(org) {
    this.reportForm.controls.facility.patchValue([]);
    this.reportForm.controls.user.patchValue([]);
    this.facility = null;
    this.org_name = org.label;
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { 'org_id': org };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = await result['data'];
  }


  async changeFac(fac) {
    this.reportForm.controls.user.patchValue([]);
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac'
    }
    const payload = {
      organization: [this.roomcleanreport.organization],
      facility: [this.roomcleanreport.facility]
    };
    var result = await this.apiService.apiFn(action, payload);
    result = result['data'];
    this.userlist = result;
    this.facId = fac;
    this.commonService.setLoader(false);
  }

  changeShift(shiftNo) {
    this.newDate1 = moment();
    this.newDate2 = moment();
    if (shiftNo === 0) {
      this.roomcleanreport.shiftType = 'All';
    }
    else if (shiftNo == 1) {
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo == 2) {
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo == 3) {
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
  }

  StartShiftTime(sh, sm, eh, em) {
    const startDate = moment();
    startDate.set({ hour: sh, minute: sm, second: 0 });
    const endDate = moment();
    endDate.set({ hour: eh, minute: em, second: 0 });
    const shiftDate = { 'startDate': startDate, 'endDate': endDate };
    return shiftDate;
  }

  selectAll() {
    if (this.allSelected.selected) {
      this.reportForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
      for (var i = 0; i < this.report.user.length; i++) {
        if (this.report.user[i] === 0) {
          this.report.user.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.user.patchValue([]);
    }
  }

  selectUser(all, id) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (this.reportForm.controls.user.value.length == this.userlist.length)
      this.allSelected.select();

    for (var i = 0; i < this.report.user.length; i++) {
      if (this.report.user[i] === 0) {
        this.report.user.splice(i, 1);
      }
    }
  }

}