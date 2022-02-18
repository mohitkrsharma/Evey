import { map } from 'rxjs/operators';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import { MatOption } from '@angular/material';
import * as moment from 'moment';
import * as _ from 'underscore';
import { CommonService } from 'src/app/shared/services/common.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { insertRefFn } from 'src/app/shared/store/shiftReport/action';
interface shiftRepState {
  _shiftRep: object;
}
@Component({
  selector: 'app-virusreport',
  templateUrl: './virusreport.component.html',
  styleUrls: ['./virusreport.component.scss']
})
export class VirusReportComponent implements OnInit {

  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  };
  shiftArr;
  residentslist = [];
  allresident = false;
  userlist;
  userListCount;

  newDate1 = moment();
  newDate2 = moment();
  start_date;
  end_date;
  sTime;
  eTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
  
  usSearch='';
  shiSearch=''
  rSearch='';
  virusreport:any = {
    user:'',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()]
  };
  virusReportResult: any = [];
  show = 'empty';
  reportForm: FormGroup;
 
  @ViewChild('selectedResident', {static: false}) private selectedResident: MatOption;

  @ViewChild('dateRangePicker', {static: false}) dateRangePicker;
  @ViewChild('allSelected', {static: false}) private allSelected: MatOption;
  private subscription: Subscription;


  constructor(
    private apiService: ApiService,
    private _shiftRep: Store<shiftRepState>,
    private router: Router,
    public commonService: CommonService,
    private fb: FormBuilder
  ) { }


  async ngOnInit() {
    if(!this.commonService.checkAllPrivilege('Reports')){
      this.router.navigate(['/']);
    }
    this.commonService.setLoader(true);
    this.reportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch:'',
      usSearch:'',
      shiSearch:'',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shift' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.virusreport.organization = contentVal.org;
        this.virusreport.facility = contentVal.fac;

        const action = {
          type: 'GET',
          target: 'users/get_users_org_fac'
        };
        const payload = {
          organization: [this.virusreport.organization],
          facility: [this.virusreport.facility]
        };
        // let result = await this.apiService.apiFn(action, payload);
        // result = result['data'];
        const result = await this.apiService.apiFn(action, payload);
        this.userlist = await result['data'].map(function (obj) {
          const robj = {};
          robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
          robj['_id'] = obj._id;
          return robj;
        });

        this.userlist.sort(function (a, b) {
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
        .patchValue([...this.userlist.map(item => item._id), 0]);

        this.getAllresidents();
        this.commonService.setLoader(false);
      }
    });

  }

  updateRange(range: Range) {
    const today_st = moment();
    const today_ed = moment();
    const today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const today_end = today_ed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      this.start_date = range['startDate']['_d'].getTime();
    } else {
      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      this.end_date = range['endDate']['_d'].getTime();
    } else {
      this.end_date = today_end['_d'].getTime();
    }
    this.virusreport.start_date = this.start_date;
    this.virusreport.end_date = this.end_date;
  }

  changeShift(shiftNo) {
    this.newDate1 = moment();
    this.newDate2 = moment();
    if (shiftNo === 0) {
      this.virusreport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.virusreport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.virusreport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.virusreport.shiftType = '3rd Shift (10:00pm - 6:00am)';
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

  async submit(report, isValid) {
    if (isValid) {
      const s = moment(this.start_date);
      let e;
      if (report.shift === 3) {
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
        facId: this.virusreport.facility,
        orgId: this.virusreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute
      };
      this._shiftRep.dispatch(insertRefFn(payload));
      this.router.navigate(['/reports/virussreport']);
    } else {
      return;
    }
  }

  async getAllresidents() {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': [this.virusreport.organization],
      'facility': [this.virusreport.facility]
    };

    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      // tslint:disable-next-line: max-line-length
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

  }

  

  cancel() {
    this.router.navigate(['/reports']);
  }

  selectAllresidents() {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.reportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.virusreport.resident.length; i++) {
        if (this.virusreport.resident[i] === 0) {
          this.virusreport.resident.splice(i, 1);
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

    for (let i = 0; i < this.virusreport.resident.length; i++) {
      if (this.virusreport.resident[i] === 0) {
        this.virusreport.resident.splice(i, 1);
      }
    }
  }

  selectAll() {
    if (this.allSelected.selected) {
      this.reportForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
      for (let i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
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

    if (this.reportForm.controls.user.value.length === this.userlist.length) {
      this.allSelected.select();
    }

    for (let i = 0; i < this.virusreport.user.length; i++) {
      if (this.virusreport.user[i] === 0) {
        this.virusreport.user.splice(i, 1);
      }
    }
  }

  caredate(item) {
    if (item.ts_total_time.start_time) {
      // tslint:disable-next-line: max-line-length
      return moment(item.ts_total_time.start_time).format('MMMM Do YYYY, hh:mm A') + ' - ' +  moment(item.ts_total_time.end_time).format('hh:mm A');
    } else {
      return '-';
    }
  }

  dob_date(item){
    if (item.residentData && item.residentData.dob) {
      return moment(item.residentData.dob).format('MMMM DD, YYYY') ;
    } else {
      return '-';
    }
  }

  cal_age(item) {
    if (item.residentData && item.residentData.dob) {
      // tslint:disable-next-line: radix
      return parseInt(moment().format('YYYY')) - parseInt(moment(item.residentData.dob).format('YYYY'));
    } else {
      return '-';
    }
  }

  care_name(data) {
    
    if (data.careData && data.careData.name) {
      return data.careData.name;
    } else {
      return '-';
    }

  }
  care_outcome(data) {
    let careUnit =''

    if(data.careData && data.careData.name){
      if(data.careData.name=="Blood Pressure"){
        careUnit="mm Hg"
      }else if(data.careData.name=="Oxygen"){
        careUnit="mm Hg"
      }else if(data.careData.name=="Pulse Automatic"){
        careUnit="bpm"
      }else if(data.careData.name=="Respirations"){
        careUnit="bpm"
      }else if(data.careData.name=="Weight"){
        careUnit="lbs"
      }
    }

    if (data.care_value === 'Performed') {
      if (data.careData.type === 'height') {
        return this.commonService.toFeet(data.track_details.first_input) + ' ' + ((data.careData.unit) ? data.careData.unit : '');
      } else {
        // tslint:disable-next-line: max-line-length
        return data.first_input + ( (data.second_input) ? ('/' + data.second_input) : '') + ' ' + ((data.careData && data.careData.unit) ? data.careData.unit : careUnit);
      }
    } else if (data.care_value === 'Discard') {
      return '-';
    } else {
      return data.care_value;
    }

  }
  care_note(data) {
    if (data.prev_care_id && data.prevCareData) {
      const prevTrackcare = data.prevCareData;
      const currentTrackVal = data;
      const prevCareDate = moment(prevTrackcare.dated).format('MMMM Do YYYY, hh:mm A');
      let careUnit =''
      if(data.careData){
        if(data.careData.name=="Blood Pressure"){
          careUnit="mm Hg"
        }else if(data.careData.name=="Oxygen"){
          careUnit="mm Hg"
        }else if(data.careData.name=="Pulse Automatic"){
          careUnit="bpm"
        }else if(data.careData.name=="Respirations"){
          careUnit="bpm"
        }else if(data.careData.name=="Weight"){
          careUnit="lbs"
        }
      }

      if ( data.care_value === 'Performed' ) {
        if (prevTrackcare.second_input) {
          // tslint:disable-next-line: max-line-length
          return prevTrackcare.first_input + '/' + prevTrackcare.second_input + ' ' + ((data.careData && data.careData.unit) ? data.careData.unit : careUnit) + ' last measurement on ' + prevCareDate;
        } else {
          if (prevTrackcare.first_input === currentTrackVal.first_input) {
            return 'No change since last measurement on ' + prevCareDate;
          } else {
            if  (prevTrackcare.first_input && prevTrackcare.first_input !== '') {
              const calVal = currentTrackVal.first_input - prevTrackcare.first_input;
              if (data.careData.type === 'height') {
                // tslint:disable-next-line: max-line-length
                return ((calVal > 0) ? '+' : '' ) + this.commonService.toFeet(calVal) + ' ' + ((data.careData && data.careData.unit) ? data.careData.unit : careUnit) + ' since last measurement on ' + prevCareDate;
              } else {
                return ((calVal > 0) ? '+' : '' ) + calVal.toFixed(2) + ' ' + ((data.careData && data.careData.unit) ? data.careData.unit : careUnit) + ' since last measurement on ' + prevCareDate;
              }
            } else {
              return '';
            }
          }
        }
      // } else if (data.outcome === 'Discard') {
      //   return trackVal.first_input + ' ' + careUnit + 'last measurement on ' + prevCareDate;
      } else {
        if  (prevTrackcare.first_input && prevTrackcare.first_input !== '') {
          const calVal = prevTrackcare.first_input;
          if ( prevTrackcare.careData &&prevTrackcare.careData.type === 'height') {
            return  this.commonService.toFeet(calVal) + ' ' + ((data.careData && data.careData.unit) ? data.careData.unit : careUnit) + ' last measurement on ' + prevCareDate;
          } else {
           return calVal + ' ' + ((data.careData && data.careData.unit) ? data.careData.unit : careUnit) + ' last measurement on ' + prevCareDate;
          }
        } else {
          return '';
        }
      }
    } else {
      return '';
    }

  }


  formatDate(time) {
    if (time) {
      const secondTime = moment(time).format('ss');
      const secondPTime = parseInt(secondTime);
      if (secondPTime < 30) {
        return moment(time).format('hh:mm A');
      } else {
        return moment(time).add(1, 'minutes').format('hh:mm A');
      }
    } else {
      return '';
    }
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }
}


export interface Range {
  fromDate: Date;
  toDate: Date;
}
