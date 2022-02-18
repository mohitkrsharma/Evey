import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxDrpOptions, PresetItem, Range } from 'ngx-mat-daterange-picker';
import { MatOption } from '@angular/material';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-custom-medication-report',
  templateUrl: './custom-medication-report.component.html',
  styleUrls: ['./custom-medication-report.component.scss'],
})
export class CustomMedicationReportComponent implements OnInit, AfterViewInit {
  timezone;
  utc_offset;
  private subscription: Subscription;
  allorg = false;

  datevalidation = false;
  start;
  end;
  CheckIn = false;
  alloutcome = false;
  allSchedule = false;
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
  // ranges: any = {
  //   Today: [moment(), moment()],
  //   Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
  //   'Last 7 Days': [moment().subtract(6, 'days'), moment()],
  //   'Last 30 Days': [moment().subtract(29, 'days'), moment()],
  //   'This Month': [moment().startOf('month'), moment().endOf('month')],
  //   'Last Month': [
  //     moment().subtract(1, 'month').startOf('month'),
  //     moment().subtract(1, 'month').endOf('month'),
  //   ],
  // };
  singlefac = false;
  checked;
  reportForm: FormGroup;
  organiz;
  faclist;
  floorlist;
  seclist;
  zonelist;
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
  };

  checkall = false;
  facilityData;
  floorDropdown;
  floorData;
  sectorDropdown;
  userslist;
  residentslist;
  carelist = [];
  reportData;
  allCares = true;
  allResidents = false;
  allStaff = false;
  allcare = false;
  start_date;
  end_date;
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
  sSearch = '';

  public includes: any[] = [
    { key: 'isCallLight', value: 'Call Light' },
    { key: 'isFind', value: 'Find' },
    { key: 'isNotify', value: 'Notify Care Team' },
    { key: 'is_out_of_fac', value: 'Out Of Facility' },
    { key: 'isNFC', value: 'NFC' },
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
    { label: 'Other', value: 'Other' },
  ];

  public carelevelData: any;
  orgfac: any;
  range: Range = { fromDate: new Date(), toDate: new Date() };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  organization;
  facility;

  @ViewChild('allSelected', {static: false}) private allSelected: MatOption;
  @ViewChild('selectedUser', {static: false}) private selectedUser: MatOption;
  @ViewChild('selectedResident', {static: false}) private selectedResident: MatOption;
  @ViewChild('selectedCare', {static: false}) private selectedCare: MatOption;
  @ViewChild('selectedOutcome', {static: false}) private selectedOutcome: MatOption;
  @ViewChild('selectedSchedule', {static: false}) private selectedSchedule: MatOption;
  @ViewChild('selectedFacility', {static: false}) private selectedFacility: MatOption;
  @ViewChild('dateRangePicker', {static: false}) dateRangePicker;
  @ViewChild('selectedStatus', {static: false}) private selectedStatus: MatOption;
  @ViewChild('selectedLevel', {static: false}) private selectedLevel: MatOption;
  @ViewChild('selectedInclude', {static: false}) private selectedInclude: MatOption;

  outcomes;
  schedule;
  active: false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialog: MatDialog,
    private router: Router,
    private _aes256Service: Aes256Service,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<CustomMedicationReportComponent>,
    private cdr: ChangeDetectorRef,
  ) {}



  async ngOnInit() {
    // this.commonService.setLoader(true);
    // if (!this.commonService.checkPrivilegeModule('build_custom_med_report')) {
    //   this.router.navigate(['/']);
    // }
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(),today.getMonth() - 1);
    const fromMin = new Date(today.getFullYear()-10, today.getMonth(), 1);
    const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const toMin = new Date(today.getFullYear()-10, today.getMonth(), 1);
    const toMax = new Date();

    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: 'Done',
      fromMinMax: { fromDate: fromMin, toDate: fromMax},
      toMinMax: { fromDate: toMin, toDate: toMax},
    };
    this.loadCarelevel();
    this.commonService.setLoader(true);
    this.reportForm = this.fb.group({
      organization: ['', [Validators.required]],
      facility: ['', [Validators.required]],
      floor: [''],
      sector: [''],
      user: ['', [Validators.required]],
      resident: [''],
      care: [''],
      outcome: [''],
      schedule: [''],
      residentStatus: ['', [Validators.required]],
      residentLevel: ['', [Validators.required]],
      include: ['', [Validators.required]],
      searchCtrl: '',
      facSearch: '',
      floSearch: '',
      secSearch: '',
      usrSearch: '',
      resSearch: '',
      carSearch: '',
      rSearch: '',
      cSearch: '',
      inSearch: '',
      oSearch: '',
      sSearch: '',
    });

    const startDateData = moment().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDateData = moment().set({
      hour: 23,
      minute: 59,
      second: 0,
      millisecond: 0,
    });
    this.start_date = startDateData['_d'].getTime();
    this.end_date = endDateData['_d'].getTime();

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
          this.options.toMinMax.toDate = this.getCurrentDateFromTimezone()
          await this.getorg();
          await this.getAllcares();
        }
      }
    );
    this.subscription = this.commonService.floorcontentdata.subscribe(
      async (data: any) => {
        if (data) {
          this.floorlist = data;
        }
      }
    );

    await this.getAllOutComeList();
    await this.getAllScheduleList();
    // this.commonService.setLoader(false);
  }

  async getAllOutComeList() {
    const action = { type: 'GET', target: 'cares/getcareoutcome' };
    const payload = { flag: 'report' };
    const result = await this.apiService.apiFn(action, payload);
    this.outcomes = result['data'].map(function (obj) {
      const rObj = {};
      rObj['value'] = obj.name;
      rObj['key'] = obj.name;
      return rObj;
    });
  }

  async getAllScheduleList() {
    const action = { type: 'GET', target: 'residents/medication_frequency_list' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.schedule = result['data'].map(function (obj) {
      const rObj = {};
      rObj['value'] = obj.name;
      rObj['key'] = obj._id;
      return rObj;
    });
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  async getorg() {
    this.commonService.setLoader(true);
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
      // this.commonService.setLoader(true);
      value = this.organization;
      if (this.organization) {
        this.report.organization = [value];
        this.reportForm.controls.organization.patchValue([value]);
      }

      this.allFacilities();
    }
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
  }

  setupPresets() {

    let backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    };

    let startOfMonth = (month,year) =>{
         return new Date(year, month, 1);
    };

    let endOfMonth = (month,year) =>{
      return new Date(year, month + 1, 0);
    };

    const today = new Date();
    const yesterday = backDate(1);
    const minus7 = backDate(7)
    const minus30 = backDate(30);
    const monthFirstDate = startOfMonth(today.getMonth(),today.getFullYear());
    const monthEndDate = endOfMonth(today.getMonth(),today.getFullYear());
    const lastMonthFirstDate = startOfMonth(today.getMonth() -1 ,today.getFullYear());
    const LastMonthEndDate = endOfMonth(today.getMonth() -1,today.getFullYear());

    this.presets = [
      { presetLabel: 'Today', range: { fromDate: today, toDate: today } },
      { presetLabel: 'Yesterday', range: { fromDate: yesterday, toDate: today } },
      { presetLabel: 'Last 7 Days', range: { fromDate: minus7, toDate: today } },
      { presetLabel: 'Last 30 Days', range: { fromDate: minus30, toDate: today } },
      { presetLabel: 'This Month', range: { fromDate: monthFirstDate, toDate: today } },
      { presetLabel: 'Last Month', range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
      { presetLabel: 'Custom Range', range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
    ]
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    const today_st = moment();
    const today_ed = moment();
    let sDate, eDate;
    const today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const today_end = today_ed.set({
      hour: 23,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      sDate = moment(range['startDate']).format('YYYY-MM-DD');

      this.start_date = range['startDate']['_d'].getTime();
    } else if (range.fromDate) {
      // This condition for new Date Picker
      range['fromDate'] = moment(range['fromDate'])
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .toDate();
      this.start_date = range.fromDate.getTime();
    } else {
      sDate = moment(today_start['_d']).format('YYYY-MM-DD');

      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({
        hour: 23,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      eDate = moment(today_start['_d']).format('YYYY-MM-DD');
      this.end_date = range['endDate']['_d'].getTime();
    } else if (range.toDate) {
      range['toDate'] = moment(range['toDate'])
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .toDate();
      this.end_date = range.toDate.getTime();
    } else {
      eDate = moment(today_end['_d']).format('YYYY-MM-DD');

      this.end_date = today_end['_d'].getTime();
    }
    if (eDate === sDate) {
      this.datevalidation = true;
    } else {
      this.datevalidation = false;
    }

    if (
      range['startDate'] &&
      range['startDate']['_d'] &&
      range['endDate'] &&
      range['endDate']['_d']
    ) {
      this.getResidentWithDateWiseCareslevel(this.start_date, this.end_date);
    }
  }

  async getAllusers() {
    this.alluser = true;
    const output = [];
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac',
    };
    const payload = {
      organization: this.reportForm.controls.organization.value,
      facility: this.reportForm.controls.facility.value,
      active: this.active,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.userslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['key'] = obj._id;
      return robj;
    });

    this.userslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });

    this.reportForm.controls.user.patchValue([
      ...this.userslist.map((item) => item.key),
      0,
    ]);

    for (let i = 0; i < this.report.user.length; i++) {
      if (this.report.user[i] === 0) {
        this.report.user.splice(i, 1);
      }
    }
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
  }

  async getAllresidents() {
    this.commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'residents/get_res_org',
    };
    const payload = {
      organization: this.reportForm.controls.organization.value,
      facility: this.reportForm.controls.facility.value,
      resident_status: this.reportForm.controls.residentStatus.value,
      care_level: this.reportForm.controls.residentLevel.value,
    };

    const result = await this.apiService.apiFn(action, payload);

    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${
        obj['room'] && obj['room']['room'] ? obj['room']['room'] : ''
      }`;
      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.resident.patchValue([
      ...this.residentslist.map((item) => item.key),
      0,
    ]);
    // }
  }

  async getAllcares() {
    const action = {
      type: 'GET',
      target: 'cares/getCares',
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.carelist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['name'];
      robj['key'] = obj._id;
      return robj;
    });
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
  }

  async getResidentWithDateWiseCareslevel(sdate, edate) {
    // return;
    const action = {
      type: 'GET',
      target: 'residents/get_res_org',
    };
    const payload = {
      organization: this.reportForm.controls.organization.value,
      facility: this.reportForm.controls.facility.value,
      resident_status: this.reportForm.controls.residentStatus.value,
      care_level: this.reportForm.controls.residentLevel.value,
      start_date: sdate,
      end_date: edate,
    };

    const result = await this.apiService.apiFn(action, payload);

    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${
        obj['room'] && obj['room']['room'] ? obj['room']['room'] : ''
      }`;
      robj['key'] = obj._id;
      return robj;
    });
    this.commonService.setLoader(false);
    this.residentslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.resident.patchValue([
      ...this.residentslist.map((item) => item.key),
      0,
    ]);
    // }
  }

  async reportsSave(report, isValid, issave) {

    // console.log('report------->', report, this.datevalidation);

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

        const data = {
          org_list: this.reportForm.controls.organization.value,
          fac_list: this.reportForm.controls.facility.value,
          staff_list: this.reportForm.controls.user.value.filter(function (item) {
            return item !== 0;
          }),
          res_list: this.reportForm.controls.resident.value,
          // schedule_list: this.reportForm.controls.schedule.value,
          outcomes: this.reportForm.controls.outcome.value ? this.reportForm.controls.outcome.value.filter(function (item) {
                      return item !== 0;
              }) : this.report.outcome,
          issave: issave,
          start_date: moment(this.start_date).tz(this.timezone, true).valueOf(),
          end_date: moment(this.end_date).tz(this.timezone, true).valueOf(),
          allResidents: this.allResidents,
          allStaff: this.allStaff,
          timezone: this.timezone,
        };
        // console.log('custom med report data------->', JSON.stringify(data));
        // return

        this.reportData = data;
        // if (issave === true) {
        //   const dialogRef = this.dialog.open(SavereportComponent, {
        //     width: '350px',
        //     data: { report: this.reportData },
        //   });
        // } else {
        //   const action = {
        //     type: 'POST',
        //     target: 'reports/save',
        //   };
        //   const payload = { report: this.reportData };
        //   const result = await this.apiService.apiFn(action, payload);
        //   if (result['status']) {
        sessionStorage.setItem('medReportData', this._aes256Service.encFnWithsalt(this.reportData));
        this.commonService.setMedQueryData(JSON.stringify(this.reportData));
        this._dialogRef.close();
        this.router.navigate(['/reports/viewmedreport']);
        //   }
        // }
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
    if (
      this.reportForm.controls.organization.value ||
      this.report.organization
    ) {
      output = [];
    }
    const match =
      this.reportForm.controls.organization.value || this.report.organization;
    const action = { type: 'GET', target: 'users/get_fac' };
    const payload = { organization: match };
    const result = await this.apiService.apiFn(action, payload);
    this.facilityDropdown = result['data'];
    this.facilityData = result['data'];
    // tslint:disable-next-line: no-shadowed-variable
    output = this.facilityDropdown.reduce((output, item) => {
      const index = output.findIndex((o) => o.name === item.org.org_name);
      if (index >= 0) {
        output[index].fac.push({
          key: item._id.fac._id,
          value: item._id.fac.fac_name,
        });
      } else {
        output.push({
          name: item.org.org_name,
          fac_id: item._id.fac._id,
          fac: [
            {
              key: item._id.fac._id,
              value: item._id.fac.fac_name,
            },
          ],
        });
      }
      return output;
    }, []);
    this.facilityDropdown = output;
    // this.reportForm.controls.floor
    // .patchValue([...this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat(), 0]);

    if (!this.allorg) {
      this.reportForm.controls.organization.setValue(this.report.organization);
      const data = this.reportForm.controls.organization.value.filter(function (
        item
      ) {
        return item !== 0;
      });
      this.report.facility = [this.facility];
      this.reportForm.controls.facility.patchValue([this.facility]);

      this.allFloors();
      this.getAllusers();
    } else {
      let arr = [
        ...this.facilityDropdown
          .map((item) => item.fac.map((itm) => itm.key))
          .flat(),
      ];
      this.reportForm.controls.facility.patchValue(arr);
      this.allFloors();
      this.getAllusers();
    }
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
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
    if (
      this.reportForm.controls.organization.value.length === this.organiz.length
    ) {
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
      this.reportForm.controls.organization.patchValue([
        ...this.organiz.map((item) => item.key),
        0,
      ]);
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
      this.reportForm.controls.facility.patchValue([
        ...this.facilityDropdown
          .map((item) => item.fac.map((itm) => itm.key))
          .flat(),
        0,
      ]);
      this.allFloors();

      this.getAllusers();
      if (
        this.reportForm.controls.organization.value &&
        this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value &&
        this.reportForm.controls.residentLevel.value
      ) {
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
      this.report.schedule = null;
      this.report.care = null;
      this.reportForm.controls.facility.patchValue([]);
      this.commonService.setLoader(false);
      if (
        this.reportForm.controls.organization.value &&
        this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value &&
        this.reportForm.controls.residentLevel.value
      ) {
        this.getAllresidents();
      }
    }
  }

  selectFac(id) {
    this.allfac = true;
    this.floorDropdown = null;
    this.sectorDropdown = null;

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

    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
    const data = this.facilityDropdown
      .map((item) => item.fac.map((itm) => itm.key))
      .flat();

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
      target: 'floorsector/floorsectorByMultipleFac',
    };
    this.reportForm.controls.facility.setValue(this.report.facility);
    const data = this.reportForm.controls.facility.value.filter(function (
      item
    ) {
      return item !== 0;
    });
    const payload = { facId: data };
    const result = await this.apiService.apiFn(action, payload);
    this.floorDropdown = result['data'];
    this.floorData = result['data'];
    // tslint:disable-next-line: no-shadowed-variable
    output = this.floorDropdown.reduce((output, item) => {
      const index = output.findIndex((o) => o.name === item.fac_id.fac_name);
      if (index >= 0) {
        output[index].floor.push({
          key: item._id,
          value: item.floor,
        });
      } else {
        output.push({
          name: item.fac_id.fac_name,
          sector: item.sector,
          floor: [
            {
              key: item._id,
              value: item.floor,
            },
          ],
        });
      }
      return output;
    }, []);
    this.floorDropdown = output.sort(function (a, b) {
      const nameA = a.name.toUpperCase(),
        nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.floor.patchValue([
      ...this.floorDropdown
        .map((item) => item.floor.map((itm) => itm.key))
        .flat(),
      0,
    ]);

    this.allSectors();
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
    this.commonService.setLoader(false);
  }

  allSectors() {
    let data;
    if (this.floorData && this.reportForm.controls.floor.value) {
      data = this.reportForm.controls.floor.value.filter(function (item) {
        return item !== 0;
      });
    }
    this.sectorDropdown = this.floorData
      .filter((_) => data.indexOf(_._id) > -1)
      .map(({ fac_id, ...item }) => ({
        ...item,
        sector: this.sectorSort(item.sector),
        name: `${fac_id.fac_name} ( Floor:-${item.floor} )`,
      }));
    this.sectorDropdown.sort(function (a, b) {
      const nameA = a.name.toUpperCase(),
        nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
    this.reportForm.controls.sector.patchValue([
      ...this.sectorDropdown
        .map((item) => item.sector.map((itm) => itm._id))
        .flat(),
      0,
    ]);
    this.reportForm.controls.care.patchValue([
      ...this.carelist.map((item) => item.key),
      0,
    ]);
    this.reportForm.controls.include.patchValue([
      ...this.includes.map((item) => item.key),
      0,
    ]);
    const index = this.reportForm.controls.include.value.indexOf(0);
    if (index > -1) {
      this.reportForm.controls.include.value.splice(index, 1);
    }
    this.reportForm.controls.outcome.patchValue([
      ...this.outcomes.map((item) => item.key),
      0,
    ]);
    this.reportForm.controls.residentLevel.patchValue([
      ...this.carelevelData.map((item) => item.value),
      0,
    ]);
    this.reportForm.controls.residentStatus.patchValue([
      ...this.statusData.map((item) => item.label),
      0,
    ]);
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
    // }
  }

  sectorSort(sortdata) {
    return sortdata.sort(function (a, b) {
      const nameA = a.name.toUpperCase(),
        nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  }

  // get facility list on the basis of organization
  async changeOrg(org) {
    this.report.facility = '';

    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { org_id: org };
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
    const payload = { facId: fac };
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

  selectAllusers() {
    this.alluser = true;
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
    if (this.selectedUser.selected) {
      this.reportForm.controls.user.patchValue([
        ...this.userslist.map((item) => item.key),
        0,
      ]);
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
      this.reportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
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

    if (
      this.reportForm.controls.resident.value.length ===
      this.residentslist.length
    ) {
      this.selectedResident.select();
    }

    for (let i = 0; i < this.report.resident.length; i++) {
      if (this.report.resident[i] === 0) {
        this.report.resident.splice(i, 1);
      }
    }
  }


  selectAlloutcomes() {
    this.alloutcome = true;
    if (this.selectedOutcome.selected) {
      this.reportForm.controls.outcome.patchValue([
        ...this.outcomes.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.report.outcome.length; i++) {
        if (this.report.outcome[i] === 0) {
          this.report.outcome.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.outcome.patchValue([]);
    }
  }

  selectOutcome(value, val1) {
    this.alloutcome = true;
    if (this.selectedOutcome.selected) {
      this.selectedOutcome.deselect();
      return false;
    }

    if (
      this.reportForm.controls.outcome.value.length === this.outcomes.length
    ) {
      this.selectedOutcome.select();
    }

    for (let i = 0; i < this.report.outcome.length; i++) {
      if (this.report.outcome[i] === 0) {
        this.report.outcome.splice(i, 1);
      }
    }
    console.log(
      'single this.reportForm.controls.outcome---->',
      this.reportForm.controls.outcome.value
    );
  }
  selectAllIncludes() {
    this.allinclude = true;
    if (this.selectedInclude.selected) {
      this.reportForm.controls.include.patchValue([
        ...this.includes.map((item) => item.key),
        0,
      ]);
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

    if (
      this.reportForm.controls.include.value.length === this.includes.length
    ) {
      this.selectedInclude.select();
    }

    for (let i = 0; i < this.report.include.length; i++) {
      if (this.report.include[i] === 0) {
        this.report.include.splice(i, 1);
      }
    }
  }


  cancelForm() {
    this._dialogRef.close();
    // this.router.navigate(['/reports']);
  }

  selectAllstatus() {
    this.allstatus = true;
    this.residentslist = null;
    this.report.resident = null;
    if (this.selectedStatus.selected) {
      this.reportForm.controls.residentStatus.patchValue([
        ...this.statusData.map((item) => item.label),
        0,
      ]);

      for (let i = 0; i < this.report.residentStatus.length; i++) {
        if (this.report.residentStatus[i] === 0) {
          this.report.residentStatus.splice(i, 1);
        }
      }
      if (
        this.reportForm.controls.organization.value &&
        this.reportForm.controls.facility.value &&
        this.reportForm.controls.residentStatus.value &&
        this.reportForm.controls.residentLevel.value
      ) {
        this.getAllresidents();
      }
    } else {
      this.residentslist = null;
      this.report.resident = null;
      this.reportForm.controls.residentStatus.patchValue([]);
    }
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
  }

  selectStatus(all, id) {
    this.allstatus = true;
    this.residentslist = null;
    this.report.resident = null;
    if (
      this.reportForm.controls.organization.value &&
      this.reportForm.controls.facility.value &&
      this.reportForm.controls.residentStatus.value &&
      this.reportForm.controls.residentLevel.value
    ) {
      this.getAllresidents();
    }
    if (this.selectedStatus.selected) {
      this.selectedStatus.deselect();
      return false;
    }

    if (
      this.reportForm.controls.residentStatus.value.length ===
      this.statusData.length
    ) {
      this.selectedStatus.select();
    }

    for (let i = 0; i < this.report.residentStatus.length; i++) {
      if (this.report.residentStatus[i] === 0) {
        this.report.residentStatus.splice(i, 1);
      }
    }
  }

  viewReports() {
    this._dialogRef.close();
    this.router.navigate(['/reports/view/custom/report']);
  }

  async loadCarelevel() {
    const action = { type: 'GET', target: 'residents/carelevellist' };
    const payload = { date: new Date() };
    const result = await this.apiService.apiFn(action, payload);
    this.carelevelData = result['data'];
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  getCurrentDateFromTimezone(){
    let newDate = new Date().toLocaleString("en-US", {timeZone: this.timezone})
    return new  Date (newDate);
  }

  selectAllSchedule() {
    this.allSchedule = true;
    if (this.selectedSchedule.selected) {
      this.reportForm.controls.schedule.patchValue([
        ...this.schedule.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.report.schedule.length; i++) {
        if (this.report.schedule[i] === 0) {
          this.report.schedule.splice(i, 1);
        }
      }
    } else {
      this.reportForm.controls.schedule.patchValue([]);
    }
  }

  selectSchedule(value, val1) {
    this.allSchedule = true;
    if (this.selectedSchedule.selected) {
      this.selectedSchedule.deselect();
      return false;
    }

    if (
      this.reportForm.controls.schedule.value.length === this.schedule.length
    ) {
      this.selectedSchedule.select();
    }

    for (let i = 0; i < this.report.schedule.length; i++) {
      if (this.report.schedule[i] === 0) {
        this.report.schedule.splice(i, 1);
      }
    }
    console.log(
      'single this.reportForm.controls.schedule---->',
      this.reportForm.controls.schedule.value
    );
  }
}
