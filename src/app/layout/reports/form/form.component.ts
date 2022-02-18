import { Component, OnInit, ViewChild, HostListener, ElementRef, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { Subscription } from 'rxjs/Rx';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
//import { AmazingTimePickerService } from 'amazing-time-picker';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
/* import { NgxDrpOptions, PresetItem, Range, RangeStoreService } from 'ngx-mat-daterange-picker'; */
import * as moment from 'moment-timezone';
import { Chart, ChartType, Label, MultiDataSet, ChartDataSets, ChartOptions } from 'chart.js';

import { CommonService } from 'src/app/shared/services/common.service';
import { ApiService } from './../../../shared/services/api/api.service';
import { insertRefFn, insertTestingFn } from '../../../shared/store/shiftReport/action';
import { ExcelService } from '../../../shared/services/excel.service';
import { CustomMedicationReportComponent } from '../custom-medication-report/custom-medication-report.component';
import { DNRReportComponent } from '../dnr-report/dnr-report.component';

interface PrivilegeRepState { _authPrivileges: object; }
interface shiftRepState { _shiftRep: object; }

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  shiftArr;
  userIdArr = [];
  residentslist = [];
  userlist;
  userListCount;
  shift;
  newDate1 = moment();
  newDate2 = moment();
  newDate3 = moment();
  newDate4 = moment();
  sTime;
  eTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
  // selected
  DateSelected;
  faclist;
  org_name;
  fac_name;
  facility;
  organiz;
  timezone: any;
  utc_offset: any;
  toggleValue: Boolean = true;
  start_date;
  end_date;
  isSelectAll = false;
  facId;
  shiftData;
  /* report: any = {
    organization: '',
    facility: '',
    user: '',
    shift: '',
    shiftype: ''
  }; */

  privileges;
  isachive_status;
  isresident_status;
  allresident = false;
  alllevel = false;
  reportOrg;
  reportFac;
  residentOrg;
  residentFac;
  usSearch = '';
  rSearch = '';
  tSearch = '';
  resSearch = '';
  fallTypeSearch = '';
  view;

  tType;
  shiftArrCare;
  shifCareType;
  shiftsTimeUTC;
  shifteTimeUTC;
  shiftsMinute;
  shifteMinute;
  shiftCareData;
  formatString: string = 'HH:mm';
  userLocalTimeZone = moment.tz.guess();
  dialogConfig = new MatDialogConfig();
  addPopupStartMin;
  private subscription: Subscription;
  facilityId: any;
  carelevelsWithGoals: any[] = [];
  selectedCareLevel: any;
  constructor(
    private _authPrivileges: Store<PrivilegeRepState>,
    private fb: FormBuilder,
    private _shiftRep: Store<shiftRepState>,
    private apiService: ApiService,
    /* private atp: AmazingTimePickerService,*/
    // private rangeStoreService: RangeStoreService,
    private excelService: ExcelService,
    private exportAsService: ExportAsService,
    private router: Router,
    public dialog: MatDialog,
    private commonService: CommonService
  ) {}

  @ViewChild('shiftPerformance', { static: true })
  shiftPerformance: TemplateRef<any>;
  @ViewChild('missedCheckIns', { static: false })
  missedCheckIns: TemplateRef<any>;
  @ViewChild('careChartData', { static: false })
  careChartData: TemplateRef<any>;
  @ViewChild('careWithinhours', { static: false })
  careWithinhours: TemplateRef<any>;
  @ViewChild('virsuCheck', { static: false }) virsuCheck: TemplateRef<any>;
  @ViewChild('refusedcare', { static: true }) refusedcare: TemplateRef<any>;
  @ViewChild('fallcare', { static: false }) fallcare: TemplateRef<any>;
  @ViewChild('testingReport', { static: false })
  testingReport: TemplateRef<any>;
  @ViewChild('censusReport', { static: false }) censusReport: TemplateRef<any>;
  @ViewChild('dnrReport', { static: false }) dnrReport: TemplateRef<any>;
  @ViewChild('vitalsReport', { static: false }) vitalsReport: TemplateRef<any>;
  @ViewChild('inventoryReport', { static: false })
  inventoryReport: TemplateRef<any>;
  @ViewChild('assessmentReport', { static: false })
  assessmentReport: TemplateRef<any>;
  @ViewChild('medicationReport', { static: false })
  medicationReport: TemplateRef<any>;
  @ViewChild('houseReport', { static: false }) houseReport: TemplateRef<any>;
  @ViewChild('dateRangePicker', { static: false }) dateRangePicker;
  @ViewChild('allSelected', { static: false }) private allSelected: MatOption;
  @ViewChild('selectedUser', { static: false }) private selectedUser: MatOption;
  @ViewChild('selectedResident', { static: false })
  private selectedResident: MatOption;
  @ViewChild('selectedAssessment', { static: false })
  private selectedAssessment: MatOption;
  @ViewChild('openTimeonLevelsReport', { static: false })
  openTimeonLevelsReport: TemplateRef<any>;
  @ViewChild('selectedLevel', { static: false })
  private selectedLevel: MatOption;
  /* selected = [moment(), moment()]; */
  alwaysShowCalendars: boolean;
  floorlist;
  /*   ranges: any = {
      'Today': [moment(), moment()],
      'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    } */
  range: Range = { fromDate: new Date(), toDate: new Date() };
  maxDate = new Date();
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  ShiftreportForm: FormGroup;
  missedCheckInreportForm: FormGroup;
  virusReportForm: FormGroup;
  refusedCareForm: FormGroup;
  vitalsReportForm: FormGroup;
  inventoryReportForm: FormGroup;
  assessmentReportForm: FormGroup;
  medicationReportForm: FormGroup;
  houseReportForm: FormGroup;
  fallCareForm: FormGroup;
  testingForm: FormGroup;
  censusForm: FormGroup;
  dnrForm: FormGroup;
  timeOnLevelReportForm: FormGroup;
  usrSearch = '';
  shiSearch = '';
  dialogRefs;
  selecteddate;
  // MissedCheckIns
  missedcheckl1 = {
    organization: '',
    facility: '',
    date: new Date(),
    shift: '',
  };

  censusreport = {
    organization: '',
    facility: '',
    date: new Date(),
  };

  dnrreport = {
    organization: '',
    facility: '',
    date: new Date(),
  };

  // Virus report
  virusreport: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };
  // Vitals Report
  vitalreport: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };

  // Inventory Report
  inventoryReportData: any = {
    organization: '',
    facility: '',
    resident: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };

  // Assessment Report
  assessmentReportData: any = {
    organization: '',
    facility: '',
    resident: '',
    start_date: '',
    end_date: '',
    assessment_type: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };
  assessmentTypeList = [
    { value: 'All', type: 'all', key: 1 },
    { value: 'Mini Mental', type: 'mini_mental', key: 2 },
    { value: 'Functional', type: 'functional', key: 3 },
  ];

  // Medication Status Report
  medicationReportData: any = {
    organization: '',
    facility: '',
    resident: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };

  // Refuser Care Report
  refusedcareData: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };
  //House Keeping
  roomcleanreport: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
  };
  //Fall care report
  fallCareData: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
    fallType: '',
  };
  //Testing Report
  testingReportData: any = {
    // user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
    testingStatus: '',
  };
  //Care Chart By 24 Shift Time
  careChart = {
    organization: '',
    facility: '',
    cType: 1,
    date: this.getCurrentDateFromTimezone(),
    startTime: this.getCurrentDateFromTimezone(),
    shift: '',
  };
  // Shift Performance Report
  shiftperformancereport: any = {
    organization: '',
    facility: '',
    shift: '',
    user: '',
    isachive: false,
  };

  // Time On Level Report
  mdltimeOnLevelReport: any = {
    user: '',
    organization: '',
    facility: '',
    resident: '',
    shift: '',
    shiftType: '',
    start_date: '',
    end_date: '',
    daterange: [moment(), moment()],
    isachive: false,
    isresident: false,
    residentLevel: '',
    care: '',
  };

  virusReportResult: any = [];
  isexport: Boolean = false;
  LineChart = null;
  currentDate = moment();
  currentCareDate = moment();
  fullResultData: any = [];
  show = false;
  data: any;
  username: string;
  CareData: any;
  chartLabel = [];
  finalCareDataArr = [];
  noRecord = false;
  shiftType;
  showShiftType;
  userList: any;
  tableShow = false;
  public doc: any;
  public totalPagesExp = '{total_pages_count_string}';
  Falltypes;
  testingStatusList;
  newMaxDate: any;
  carSearch = '';
  public carelevelData: any;
  ngOnInit() {
    this.newMaxDate = new Date();
    let today = new Date();
    let lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const toMax = new Date();

    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: 'Done',
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    this.commonService.content.subscribe((updatedTitle) => {});
    sessionStorage.removeItem('pageListing');
    this.subscription = this.commonService.contentdata.subscribe(
      (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          // console.log('--facility timezone--',contentVal)
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
          this.facilityId = contentVal.fac;
          console.log('---timezone---', this.timezone, this.utc_offset);
          this.maxDate = this.getCurrentDateFromTimezone();
          this.options.toMinMax.toDate = this.getCurrentDateFromTimezone();
          // const currentDate = moment().tz(this.timezone).format('LLLL');
          const currentDate = moment(
            new Date(moment().tz(this.timezone).format('LLLL'))
          ).toISOString();

          // console.log(currentDate)

          const startTimeToday = this.convertNext30MinuteInterval(currentDate);
          // console.log(startTimeToday)
          const endTimeToday = moment(startTimeToday)
            .add(30, 'minutes')
            .toDate();
          this.addPopupStartMin = startTimeToday;
        }
      }
    );
  }

  getReport() {
    this.router.navigate(['/reports/report']);
  }

  convertNext30MinuteInterval(timeSelected) {
    console.log(timeSelected);
    const remainder = (moment().tz(this.timezone).minute() % 30) - 30;
    const dateTime = moment(timeSelected)
      .tz(this.timezone)
      .add(-remainder, 'minutes')
      .toDate();
    return dateTime;
  }

  getCustomMedReport() {
    this.dialogConfig.width = '700px';
    this.dialogConfig.autoFocus = false;
    this.dialogConfig.maxHeight = '835px';
    this.dialogConfig.panelClass = 'physician_dialog';

    const dialogRef = this.dialog.open(
      CustomMedicationReportComponent,
      this.dialogConfig
    );
    // dialogRef.afterClosed().subscribe(res => {
    //   if (res && res.physician.data) {
    //     this.assignPhysician(res.physician.data);
    //     this.router.navigate(['/reports/custommedreport']);
    //   }
    // })
  }

  openDNRReport() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '400px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(DNRReportComponent, dialogConfig);

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.dnrreport.organization = contentVal.org;
          this.dnrreport.facility = contentVal.fac;
          this.commonService.setLoader(false);
        }
      }
    );
  }

  // Common Functions for all popup
  cancel() {
    this.roomcleanreport.isachive = false;
    this.roomcleanreport.isresident = false;
    this.dialogRefs.close();
  }
  cancelVirus() {
    this.mdltimeOnLevelReport.isachive = false;
    this.mdltimeOnLevelReport.isresident = false;
    this.dialogRefs.close();
  }
  cancelTimeOnLevelReport() {
    this.virusreport.isachive = false;
    this.virusreport.isresident = false;
    this.dialogRefs.close();
  }
  cancelVital() {
    this.vitalreport.isachive = false;
    this.vitalreport.isresident = false;
    this.dialogRefs.close();
  }
  cancelInventory() {
    this.inventoryReportData.isachive = false;
    this.inventoryReportData.isresident = false;
    this.dialogRefs.close();
  }
  cancelAssessment() {
    this.assessmentReportData.isachive = false;
    this.assessmentReportData.isresident = false;
    this.dialogRefs.close();
  }

  cancelMedication() {
    this.medicationReportData.isachive = false;
    this.medicationReportData.isresident = false;
    this.dialogRefs.close();
  }
  cancelFall() {
    this.fallCareData.isachive = false;
    this.fallCareData.isresident = false;
    this.dialogRefs.close();
  }
  cancelShift() {
    this.shiftperformancereport.isachive = false;
    this.dialogRefs.close();
  }
  cancelTesting() {
    this.testingReportData.testingStatus = '';
    sessionStorage.removeItem('testingReportData');
    this.testingReportData.isachive = false;
    this.dialogRefs.close();
  }
  cancelMissed() {
    this.missedcheckl1.shift = '';
    // this.missedcheckl1.date = new Date();
    this.currentDate = moment();
    this.dialogRefs.close();
  }
  setupPresets() {
    let backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    };

    let startOfMonth = (month, year) => {
      return new Date(year, month, 1);
    };

    let endOfMonth = (month, year) => {
      return new Date(year, month + 1, 0);
    };

    let today = new Date();
    let yesterday = backDate(1);
    let minus7 = backDate(7);
    let minus30 = backDate(30);
    let monthFirstDate = startOfMonth(today.getMonth(), today.getFullYear());
    let monthEndDate = endOfMonth(today.getMonth(), today.getFullYear());
    let lastMonthFirstDate = startOfMonth(
      today.getMonth() - 1,
      today.getFullYear()
    );
    let LastMonthEndDate = endOfMonth(
      today.getMonth() - 1,
      today.getFullYear()
    );

    this.presets = [
      { presetLabel: 'Today', range: { fromDate: today, toDate: today } },
      {
        presetLabel: 'Yesterday',
        range: { fromDate: yesterday, toDate: today },
      },
      {
        presetLabel: 'Last 7 Days',
        range: { fromDate: minus7, toDate: today },
      },
      {
        presetLabel: 'Last 30 Days',
        range: { fromDate: minus30, toDate: today },
      },
      {
        presetLabel: 'This Month',
        range: { fromDate: monthFirstDate, toDate: today },
      },
      {
        presetLabel: 'Last Month',
        range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate },
      },
      {
        presetLabel: 'Custom Range',
        range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate },
      },
    ];
  }

  //Change Org Common Fuction
  async changeOrg(org) {
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { org_id: this.missedcheckl1.organization };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = await result['data'];
  }

  //Start of resident Common Functions
  async getAllresidents(reportType) {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org',
    };
    if (reportType === 'vital') {
      this.residentOrg = this.vitalreport.organization;
      this.residentFac = this.vitalreport.facility;
    } else if (reportType === 'virus') {
      this.residentOrg = this.virusreport.organization;
      this.residentFac = this.virusreport.facility;
    } else if (reportType === 'house') {
      this.residentOrg = this.roomcleanreport.organization;
      this.residentFac = this.roomcleanreport.facility;
    } else if (reportType === 'refused') {
      this.residentOrg = this.refusedcareData.organization;
      this.residentFac = this.refusedcareData.facility;
    } else if (reportType === 'fall') {
      this.residentOrg = this.fallCareData.organization;
      this.residentFac = this.fallCareData.facility;
    } else if (reportType === 'testing') {
      this.residentOrg = this.testingReportData.organization;
      this.residentFac = this.testingReportData.facility;
    } else if (reportType === 'timeOnlevel') {
      this.residentOrg = this.mdltimeOnLevelReport.organization;
      this.residentFac = this.mdltimeOnLevelReport.facility;
    } else if (reportType === 'inventory') {
      this.residentOrg = this.inventoryReportData.organization;
      this.residentFac = this.inventoryReportData.facility;
    } else if (reportType === 'assessment') {
      this.residentOrg = this.assessmentReportData.organization;
      this.residentFac = this.assessmentReportData.facility;
    } else if (reportType === 'medication') {
      this.residentOrg = this.medicationReportData.organization;
      this.residentFac = this.medicationReportData.facility;
    }
    const payload = {
      organization: [this.residentOrg],
      facility: [this.residentFac],
    };
    if (reportType === 'timeOnlevel') {
      payload['care_level'] = this.timeOnLevelReportForm.controls.residentLevel
        .value
        ? [this.timeOnLevelReportForm.controls.residentLevel.value]
        : [];
    } else if (reportType === 'vital') {
      payload['is_resArchive'] = true;
      payload['isAchive_data'] = true;
    }
    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      // tslint:disable-next-line: max-line-length
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
    if (reportType === 'vital') {
      this.vitalsReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'virus') {
      this.virusReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'house') {
      this.houseReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'refused') {
      this.refusedCareForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'fall') {
      this.fallCareForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'testing') {
      this.testingForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'timeOnlevel') {
      this.timeOnLevelReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'vital') {
      this.vitalsReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'inventory') {
      this.inventoryReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'assessment') {
      this.assessmentReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    } else if (reportType === 'medication') {
      this.medicationReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    }
  }

  selectAllresidents(CheckRep) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      if (CheckRep === 'vital') {
        this.vitalsReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.vitalreport.resident.length; i++) {
          if (this.vitalreport.resident[i] === 0) {
            this.vitalreport.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'virus') {
        this.virusReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.virusreport.resident.length; i++) {
          if (this.virusreport.resident[i] === 0) {
            this.virusreport.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'house') {
        this.houseReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.roomcleanreport.resident.length; i++) {
          if (this.roomcleanreport.resident[i] === 0) {
            this.roomcleanreport.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'refused') {
        this.refusedCareForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.refusedcareData.resident.length; i++) {
          if (this.refusedcareData.resident[i] === 0) {
            this.refusedcareData.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'fall') {
        this.fallCareForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.fallCareData.resident.length; i++) {
          if (this.fallCareData.resident[i] === 0) {
            this.fallCareData.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'testing') {
        this.testingForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.testingReportData.resident.length; i++) {
          if (this.testingReportData.resident[i] === 0) {
            this.testingReportData.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'timeOnlevel') {
        this.timeOnLevelReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.mdltimeOnLevelReport.resident.length; i++) {
          if (this.mdltimeOnLevelReport.resident[i] === 0) {
            this.mdltimeOnLevelReport.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'inventory') {
        this.inventoryReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.inventoryReportData.resident.length; i++) {
          if (this.inventoryReportData.resident[i] === 0) {
            this.inventoryReportData.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'assessment') {
        this.assessmentReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.assessmentReportData.resident.length; i++) {
          if (this.assessmentReportData.resident[i] === 0) {
            this.assessmentReportData.resident.splice(i, 1);
          }
        }
      } else if (CheckRep === 'medication') {
        this.medicationReportForm.controls.resident.patchValue([
          ...this.residentslist.map((item) => item.key),
          0,
        ]);
        for (let i = 0; i < this.medicationReportData.resident.length; i++) {
          if (this.medicationReportData.resident[i] === 0) {
            this.medicationReportData.resident.splice(i, 1);
          }
        }
      }
    } else {
      if (CheckRep === 'vital') {
        this.vitalsReportForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'virus') {
        this.virusReportForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'house') {
        this.houseReportForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'refused') {
        this.refusedCareForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'fall') {
        this.fallCareForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'testing') {
        this.testingForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'timeOnlevel') {
        this.timeOnLevelReportForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'inventory') {
        this.inventoryReportForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'assessment') {
        this.assessmentReportForm.controls.resident.patchValue([]);
      } else if (CheckRep === 'medication') {
        this.medicationReportForm.controls.resident.patchValue([]);
      }
    }
  }

  selectResident(all, id, residentCheck) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
    if (residentCheck === 'vital') {
      if (
        this.vitalsReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.vitalreport.resident.length; i++) {
        if (this.vitalreport.resident[i] === 0) {
          this.vitalreport.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'virus') {
      if (
        this.virusReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.virusreport.resident.length; i++) {
        if (this.virusreport.resident[i] === 0) {
          this.virusreport.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'house') {
      if (
        this.houseReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.roomcleanreport.resident.length; i++) {
        if (this.roomcleanreport.resident[i] === 0) {
          this.roomcleanreport.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'refused') {
      if (
        this.refusedCareForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.refusedcareData.resident.length; i++) {
        if (this.refusedcareData.resident[i] === 0) {
          this.refusedcareData.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'fall') {
      if (
        this.fallCareForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.fallCareData.resident.length; i++) {
        if (this.fallCareData.resident[i] === 0) {
          this.fallCareData.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'testing') {
      if (
        this.testingForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.testingReportData.resident.length; i++) {
        if (this.testingReportData.resident[i] === 0) {
          this.testingReportData.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'timeOnlevel') {
      if (
        this.timeOnLevelReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.mdltimeOnLevelReport.resident.length; i++) {
        if (this.mdltimeOnLevelReport.resident[i] === 0) {
          this.mdltimeOnLevelReport.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'inventory') {
      if (
        this.inventoryReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.inventoryReportData.resident.length; i++) {
        if (this.inventoryReportData.resident[i] === 0) {
          this.inventoryReportData.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'assessment') {
      if (
        this.assessmentReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.assessmentReportData.resident.length; i++) {
        if (this.assessmentReportData.resident[i] === 0) {
          this.assessmentReportData.resident.splice(i, 1);
        }
      }
    } else if (residentCheck === 'medication') {
      if (
        this.medicationReportForm.controls.resident.value.length ===
        this.residentslist.length
      ) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.medicationReportData.resident.length; i++) {
        if (this.medicationReportData.resident[i] === 0) {
          this.medicationReportData.resident.splice(i, 1);
        }
      }
    }
  }

  // Check Archive resident
  async isArchiveResi(event, checkResi) {
    if (checkResi === 'vital') {
      this.vitalreport.resident = '';
      this.reportOrg = this.vitalreport.organization;
      this.reportFac = this.vitalreport.facility;
    } else if (checkResi === 'virus') {
      this.virusreport.resident = '';
      this.reportOrg = this.virusreport.organization;
      this.reportFac = this.virusreport.facility;
    } else if (checkResi === 'house') {
      this.roomcleanreport.resident = '';
      this.reportOrg = this.roomcleanreport.organization;
      this.reportFac = this.roomcleanreport.facility;
    } else if (checkResi === 'refused') {
      this.refusedcareData.resident = '';
      this.reportOrg = this.refusedcareData.organization;
      this.reportFac = this.refusedcareData.facility;
    } else if (checkResi === 'fall') {
      this.fallCareData.resident = '';
      this.reportOrg = this.fallCareData.organization;
      this.reportFac = this.fallCareData.facility;
    } else if (checkResi === 'testing') {
      this.testingReportData.resident = '';
      this.reportOrg = this.testingReportData.organization;
      this.reportFac = this.testingReportData.facility;
    } else if (checkResi === 'timeOnlevel') {
      this.mdltimeOnLevelReport.resident = '';
      this.reportOrg = this.mdltimeOnLevelReport.organization;
      this.reportFac = this.mdltimeOnLevelReport.facility;
    }
    this.commonService.setLoader(true);
    if (event === true) {
      this.isresident_status = true;
    } else {
      this.isresident_status = false;
    }
    this.residentslist = [];
    const action = {
      type: 'GET',
      target: 'residents/get_res_org',
    };
    const payload = {
      organization: [this.reportOrg],
      facility: [this.reportFac],
      is_resArchive: this.isresident_status,
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
    if (checkResi === 'vital') {
      this.vitalsReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'shift') {
      this.ShiftreportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'virus') {
      this.virusReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'house') {
      this.houseReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.roomcleanreport.user.length; i++) {
        if (this.roomcleanreport.user[i] === 0) {
          this.roomcleanreport.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'refused') {
      this.refusedCareForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.refusedcareData.user.length; i++) {
        if (this.refusedcareData.user[i] === 0) {
          this.refusedcareData.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'fall') {
      this.fallCareForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.fallCareData.user.length; i++) {
        if (this.fallCareData.user[i] === 0) {
          this.fallCareData.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'testing') {
      this.testingForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      /*for (let i = 0; i < this.testingReportData.user.length; i++) {
        if (this.testingReportData.user[i] === 0) {
          this.testingReportData.user.splice(i, 1);
        }
      }*/
    }
    if (checkResi === 'timeOnlevel') {
      this.timeOnLevelReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.mdltimeOnLevelReport.user.length; i++) {
        if (this.mdltimeOnLevelReport.user[i] === 0) {
          this.mdltimeOnLevelReport.user.splice(i, 1);
        }
      }
    }
  }
  // End of Resident Common Functions

  // Start of user Functions
  selectAll(checkTypeData) {
    if (this.allSelected.selected) {
      if (checkTypeData === 'shift_all') {
        this.ShiftreportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.shiftperformancereport.user.length; i++) {
          if (this.shiftperformancereport.user[i] === 0) {
            this.shiftperformancereport.user.splice(i, 1);
          }
        }
      } else if (checkTypeData === 'vital_all') {
        this.vitalsReportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.vitalreport.user.length; i++) {
          if (this.vitalreport.user[i] === 0) {
            this.vitalreport.user.splice(i, 1);
          }
        }
      } else if (checkTypeData === 'virus_all') {
        this.virusReportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.vitalreport.user.length; i++) {
          if (this.virusreport.user[i] === 0) {
            this.virusreport.user.splice(i, 1);
          }
        }
      } else if (checkTypeData === 'house_all') {
        this.houseReportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.roomcleanreport.user.length; i++) {
          if (this.roomcleanreport.user[i] === 0) {
            this.roomcleanreport.user.splice(i, 1);
          }
        }
      } else if (checkTypeData === 'refused_all') {
        this.refusedCareForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.refusedcareData.user.length; i++) {
          if (this.refusedcareData.user[i] === 0) {
            this.refusedcareData.user.splice(i, 1);
          }
        }
      } else if (checkTypeData === 'fall_all') {
        this.fallCareForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.fallCareData.user.length; i++) {
          if (this.fallCareData.user[i] === 0) {
            this.fallCareData.user.splice(i, 1);
          }
        }
      } else if (checkTypeData === 'timeOnlevel_all') {
        this.timeOnLevelReportForm.controls.user.patchValue([
          ...this.userlist.map((item) => item._id),
          0,
        ]);
        for (var i = 0; i < this.mdltimeOnLevelReport.user.length; i++) {
          if (this.mdltimeOnLevelReport.user[i] === 0) {
            this.mdltimeOnLevelReport.user.splice(i, 1);
          }
        }
      }
    } else {
      if (checkTypeData === 'shift_all') {
        this.ShiftreportForm.controls.user.patchValue([]);
      } else if (checkTypeData === 'vital_all') {
        this.vitalsReportForm.controls.user.patchValue([]);
      } else if (checkTypeData === 'virus_all') {
        this.virusReportForm.controls.user.patchValue([]);
      } else if (checkTypeData === 'house_all') {
        this.houseReportForm.controls.user.patchValue([]);
      } else if (checkTypeData === 'refused_all') {
        this.refusedCareForm.controls.user.patchValue([]);
      } else if (checkTypeData === 'fall_all') {
        this.fallCareForm.controls.user.patchValue([]);
      } else if (checkTypeData === 'timeOnlevel_all') {
        this.timeOnLevelReportForm.controls.user.patchValue([]);
      }
    }
  }

  selectUser(all, id, checkUser) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (checkUser === 'shift') {
      if (
        this.ShiftreportForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.shiftperformancereport.user.length; i++) {
        if (this.shiftperformancereport.user[i] === 0) {
          this.shiftperformancereport.user.splice(i, 1);
        }
      }
    } else if (checkUser === 'vital') {
      if (
        this.vitalsReportForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    } else if (checkUser === 'virus') {
      if (
        this.virusReportForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    } else if (checkUser === 'house') {
      if (
        this.houseReportForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.roomcleanreport.user.length; i++) {
        if (this.roomcleanreport.user[i] === 0) {
          this.roomcleanreport.user.splice(i, 1);
        }
      }
    } else if (checkUser === 'refused') {
      if (
        this.refusedCareForm.controls.user.value.length == this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.refusedcareData.user.length; i++) {
        if (this.refusedcareData.user[i] === 0) {
          this.refusedcareData.user.splice(i, 1);
        }
      }
    } else if (checkUser === 'fall') {
      if (this.fallCareForm.controls.user.value.length == this.userlist.length)
        this.allSelected.select();

      for (var i = 0; i < this.fallCareData.user.length; i++) {
        if (this.fallCareData.user[i] === 0) {
          this.fallCareData.user.splice(i, 1);
        }
      }
    } else if (checkUser === 'timeOnlevel') {
      if (
        this.timeOnLevelReportForm.controls.user.value.length ==
        this.userlist.length
      )
        this.allSelected.select();

      for (var i = 0; i < this.mdltimeOnLevelReport.user.length; i++) {
        if (this.mdltimeOnLevelReport.user[i] === 0) {
          this.mdltimeOnLevelReport.user.splice(i, 1);
        }
      }
    }
  }
  /**
   * @author Keyur Patel
   * @param archivetoggle
   */
  async isArchiveData(event, checkType) {
    console.log(checkType, event);
    if (checkType === 'shift') {
      this.shiftperformancereport.user = '';
      this.reportOrg = this.shiftperformancereport.organization;
      this.reportFac = this.shiftperformancereport.facility;
    } else if (checkType === 'vital') {
      this.vitalreport.user = '';
      this.reportOrg = this.vitalreport.organization;
      this.reportFac = this.vitalreport.facility;
    } else if (checkType === 'virus') {
      this.virusreport.user = '';
      this.reportOrg = this.virusreport.organization;
      this.reportFac = this.virusreport.facility;
    } else if (checkType === 'house') {
      this.roomcleanreport.user = '';
      this.reportOrg = this.roomcleanreport.organization;
      this.reportFac = this.roomcleanreport.facility;
    } else if (checkType === 'refused') {
      this.refusedcareData.user = '';
      this.reportOrg = this.refusedcareData.organization;
      this.reportFac = this.refusedcareData.facility;
    } else if (checkType === 'fall') {
      this.fallCareData.user = '';
      this.reportOrg = this.fallCareData.organization;
      this.reportFac = this.fallCareData.facility;
    } else if (checkType === 'testing') {
      this.testingReportData.user = '';
      this.reportOrg = this.testingReportData.organization;
      this.reportFac = this.testingReportData.facility;
    }
    this.commonService.setLoader(true);
    if (event === true) {
      this.isachive_status = true;
    } else {
      this.isachive_status = false;
    }
    this.userlist = '';
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac',
    };
    const payload = {
      organization: [this.reportOrg],
      facility: [this.reportFac],
      isAchive_data: this.isachive_status,
    };

    var result = await this.apiService.apiFn(action, payload);
    console.log(result);
    this.userlist = null;
    this.userlist = await result['data'].map(function (obj) {
      var robj = {};
      robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['_id'] = obj._id;
      return robj;
    });
    this.userlist.sort(function (a, b) {
      var nameA = a.value.toUpperCase(),
        nameB = b.value.toUpperCase();
      if (nameA < nameB)
        //sort string ascending
        return -1;
      if (nameA > nameB) return 1;
      return 0; //default return value (no sorting)
    });
    if (checkType === 'vital') {
      this.vitalsReportForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
    }
    if (checkType === 'virus') {
      this.virusReportForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
      for (let i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    }
    if (checkType === 'house') {
      this.houseReportForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
      for (let i = 0; i < this.roomcleanreport.user.length; i++) {
        if (this.roomcleanreport.user[i] === 0) {
          this.roomcleanreport.user.splice(i, 1);
        }
      }
    }
    if (checkType === 'refused') {
      this.refusedCareForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
      for (let i = 0; i < this.refusedcareData.user.length; i++) {
        if (this.refusedcareData.user[i] === 0) {
          this.refusedcareData.user.splice(i, 1);
        }
      }
    }
    if (checkType === 'fall') {
      this.fallCareForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
      for (let i = 0; i < this.fallCareData.user.length; i++) {
        if (this.fallCareData.user[i] === 0) {
          this.fallCareData.user.splice(i, 1);
        }
      }
    }
    if (checkType === 'testing') {
      this.testingForm.controls.user.patchValue([
        ...this.userlist.map((item) => item._id),
        0,
      ]);
      for (let i = 0; i < this.testingReportData.user.length; i++) {
        if (this.testingReportData.user[i] === 0) {
          this.testingReportData.user.splice(i, 1);
        }
      }
    }
    this.commonService.setLoader(false);
  }

  //End Of user Functions

  cancelCareChart() {
    this.careChart.shift = '';
    this.careChart.cType = 1;
    this.careChart.date = this.getCurrentDateFromTimezone();
    this.careChart.startTime = this.getCurrentDateFromTimezone();
    this.currentCareDate = moment();
    this.dialogRefs.close();
  }
  //End Of Cancel Functions

  //Start Of Change Shift Functions
  changeShift(shiftNo) {
    let hours;
    this.newDate1 = moment(this.missedcheckl1.date);
    if (shiftNo === 0) {
      hours = Array.from({ length: 12 }, (v, k) => k);
      this.shiftType = 'All Shift';
      this.newDate1.set({ hour: 5, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(1, 'days');
    } else if (shiftNo === 1) {
      hours = Array.from({ length: 4 }, (v, k) => k);
      this.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 5, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftNo === 2) {
      hours = Array.from({ length: 4 }, (v, k) => k);
      this.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 13, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    } else if (shiftNo === 3) {
      hours = Array.from({ length: 4 }, (v, k) => k);
      this.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 21, minute: 45, second: 0, millisecond: 0 });
      this.newDate2 = moment(this.newDate1).add(8, 'hours');
    }
    let sTime = this.newDate1;
    let eTime = this.newDate2;
    this.shiftData = hours.reduce((obj, item) => {
      eTime = moment(sTime).add(60, 'minutes');
      const timeEnd = moment(eTime).add(60, 'minutes');
      obj.push({
        sr: item,
        sTime: sTime['_d'].getTime(),
        midTime: eTime['_d'].getTime(),
        eTime: timeEnd['_d'].getTime(),
      });
      sTime = moment(sTime).add(2, 'hours');
      return obj;
    }, []);
  }

  changeShiftForVitals(shiftNo) {
    let zone = this.timezone;

    this.newDate1 = moment.tz(zone);
    this.newDate2 = moment.tz(zone);

    // this.newDate1 = moment();
    // this.newDate2 = moment();

    if (shiftNo === 0) {
      this.vitalreport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.vitalreport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.vitalreport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.vitalreport.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
    console.log(
      '------shift changing time hours------',
      this.sTime,
      this.eTime
    );
  }

  changeVitalShift(shiftNo) {
    this.newDate1 = moment(
      this.commonService.convertLocalToTimezone(moment(), null, this.timezone)
    ).tz(this.timezone, true);
    this.newDate2 = moment(
      this.commonService.convertLocalToTimezone(moment(), null, this.timezone)
    ).tz(this.timezone, true);

    console.log('---function wise date---', this.newDate1, this.newDate2);
    if (shiftNo === 0) {
      this.vitalreport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.vitalreport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      console.log('---in shift 2-----------');
      this.vitalreport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      console.log('------in shift 3----------');
      this.vitalreport.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();

    console.log(
      'shift change',
      this.sTime,
      this.eTime,
      this.newDate1,
      this.newDate2
    );
  }

  changeCareShift(shiftNo) {
    this.newDate3 = moment.tz(this.timezone);
    this.newDate4 = moment.tz(this.timezone);
    // this.newDate3 = moment();//old
    // this.newDate4 = moment();//old
    if (shiftNo === 0) {
      this.shifCareType = 0;
      this.newDate3.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      this.newDate4.set({ hour: 23, minute: 59, second: 0, millisecond: 0 });
    } else if (shiftNo === 1) {
      this.shifCareType = 1;
      this.newDate3.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate4.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.shifCareType = 2;
      this.newDate3.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate4.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.shifCareType = 3;
      this.newDate3.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate4.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.shiftsTimeUTC = this.newDate3.hours();
    this.shifteTimeUTC = this.newDate4.hours();
    this.shiftsMinute = this.newDate3.minutes();
    this.shifteMinute = this.newDate4.minutes();
    this.shiftCareData = {
      shiftsTimeUTC: this.newDate3.utc().hours(),
      shifteTimeUTC: this.newDate4.utc().hours(),
      shiftsMinute: this.newDate3.utc().minutes(),
      shifteMinute: this.newDate4.utc().minutes(),
    };
  }

   changeAssessmentType(assessmentType) {
    //  console.log('assessmentType-->', assessmentType);
     this.assessmentReportData.assessment_type = assessmentType;
  }

  changeShiftPer(shiftNo) {
    this.shiftData = shiftNo;
    shiftNo = this.shiftData.no;
    // console.log('---shift id-----',shiftNo)
    // return;
    this.newDate1 = moment();
    this.newDate2 = moment();
    if (shiftNo == 1) {
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

  // Start Care 24 report functions
  openCarechart() {
    // Pop Up Open
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '800px';
    dialogConfig.panelClass = 'modal_report';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.careChartData, dialogConfig);

    this.commonService.setLoader(true);
    this.currentCareDate.utc();
    this.tType = 1;
    const shiftarray = this.commonService.shiftTime();
    this.shiftArrCare = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];
    this.careChart.date = this.getCurrentDateFromTimezone(); //(this.currentCareDate.subtract(1, 'days'))['_d'];
    this.careChart.startTime = this.getCurrentDateFromTimezone();
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.careChart.organization = contentVal.org;
          this.careChart.facility = contentVal.fac;
          this.commonService.setLoader(false);
        }
      }
    );
  }

  async changeCType(t) {
    if (t == 2) {
      this.careChart.shift = '';
    } else {
      this.careChart.startTime = this.getCurrentDateFromTimezone();
    }
    this.tType = t;
  }

  async careChartSubmit(f, data, p) {
    console.log('----here----');
    if (f.valid) {
      let vaild = f.form.status;
      data.organization = this.careChart.organization;
      data.facility = this.careChart.facility;
      data.shiftType = this.shifCareType;
      data.shiftData = this.shiftCareData;
      data.tType = this.tType;
      data.shiftsTimeUTC = this.shiftsTimeUTC;
      (data.shiftsMinute = this.shiftsMinute),
        (data.shifteMinute = this.shifteMinute),
        (data.shifteTimeUTC = this.shifteTimeUTC);
      data.timezone = this.timezone;
      if (data.tType === 2) {
        data.startDate = this.newDate3;
        data.endDate = this.newDate4;
      }

      if (
        data.organization === '' ||
        data.facility === '' ||
        p._validSelected === null ||
        p._validSelected === undefined ||
        p._validSelected === ''
      ) {
        vaild = 'INVALID';
      }
      if (vaild === 'VALID') {
        this.commonService.setLoader(true);
        const getData = {
          data: data,
          p: p._validSelected,
        };

        console.log('------------------care 24 data--------------', getData);
        // return
        localStorage.setItem('carechartpayload', JSON.stringify(getData));
        this.dialogRefs.close();
        this.router.navigate(['/reports/carechart']);
      }
    } else {
      return;
    }
  }
  /* End Care 24 report functions */

  /* Shift Performance Start */
  /**
   * @author Umang Kothari
   * @datetime 13 oct 2020
   * @description This function is created to open shift performance report value.
   */
  openShiftPerformance() {
    //Pop Up Open
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.shiftPerformance, dialogConfig);

    //Load Mulit Value for Popup
    this.ShiftreportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      isachive: false,
      usrSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.shiftperformancereport.user = '';
          this.shiftperformancereport.organization = contentVal.org;
          this.shiftperformancereport.facility = contentVal.fac;
          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.shiftperformancereport.organization],
            facility: [this.shiftperformancereport.facility],
          };
          var result = await this.apiService.apiFn(action, payload);
          result = result['data'];
          var result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            var robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });
          this.userlist.sort(function (a, b) {
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
          this.ShiftreportForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          for (let i = 0; i < this.shiftperformancereport.user.length; i++) {
            if (this.shiftperformancereport.user[i] === 0) {
              this.shiftperformancereport.user.splice(i, 1);
            }
          }
          // this.getShift()
          this.commonService.setLoader(false);
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
  }
  /**
   * @author Umang Kothari
   * @description Run Shift performance Report
   * @param report
   * @param isValid
   */
  async shiftPerformanceSubmit(report, isValid) {
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // ee = moment(moment(this.end_date)).tz(this.timezone,true);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();
      // let shift_name = ''

      // if (report.shift.name === 'shift 1 (06:00 AM - 02:00 PM)') {
      //   shift_name = '1st Shift (6:00am - 2:00pm)';
      // } else if (report.shift.name === 'shift 2 (02:00 PM - 10:00 PM)') {
      //   shift_name = '2nd Shift (2:00pm - 10:00pm)';
      // } else {
      //   shift_name = '3rd Shift (10:00pm - 6:00am)';
      // }
      // const s = moment(this.start_date);
      // let e;
      // if (report.shift.no === 3) {
      //   e = moment(this.end_date).add(1, 'day');
      // } else {
      //   e = moment(this.end_date);
      // }
      // //   const s = moment(this.start_date);
      // //   let e;
      // //   let shift_name=''

      // //    if (report.shift.name ==='shift 1 (06:00 AM - 02:00 PM)') {
      // //   shift_name = '1st Shift (6:00am - 2:00pm)';
      // //   e = moment(this.end_date);
      // // } else if (report.shift.name ==='shift 2 (02:00 PM - 10:00 PM)') {
      // //   shift_name = '2nd Shift (2:00pm - 10:00pm)';
      // //   e = moment(this.end_date);
      // // } else {
      // //   shift_name = '3rd Shift (10:00pm - 6:00am)';
      // //   e = moment(this.end_date).add(1, 'day');
      // // }
      // s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      // e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      // // const s = moment(this.start_date);
      // // let e= moment(this.end_date);
      // this.start_date = s['_d'].getTime();
      // this.end_date = e['_d'].getTime();
      // let ss, ee;

      // ss = moment(moment(this.start_date)).tz(this.timezone, true);
      // ee = moment(moment(this.end_date)).tz(this.timezone, true);

      // this.start_date = moment(moment(this.start_date)).tz(this.timezone, true).valueOf();
      // this.end_date = moment(moment(this.end_date)).tz(this.timezone, true).valueOf();

      // // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // // ee = moment(moment(this.end_date)).tz(this.timezone,true);

      // // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // // ee = moment(moment(this.end_date)).tz(this.timezone,true);

      // // this.start_date = moment(moment(this.start_date)).tz(this.timezone,true).valueOf();
      // // this.end_date = moment(moment(this.end_date)).tz(this.timezone,true).valueOf();

      // this.sTimeUTC = ss.utc().hours();
      // this.eTimeUTC = ee.utc().hours();
      // this.sMinute = ss.utc().minutes();
      // this.eMinute = ee.utc().minutes();
      /* const payload = {
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
         eMinute: this.sMinute,
         timezone: this.timezone
       };*/
      const payload = {
        shift: report.shift,
        // shiftData: this.shiftData,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.shiftperformancereport.facility,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };

      this._shiftRep.dispatch(insertRefFn(payload));
      console.log('---payload----', payload);
      this.dialogRefs.close();
      this.router.navigate(['/reports/shiftperformancereport']);
    } else {
      return;
    }
  }
  /* Shift Performance End */

  /* Missed CheckIns Start */

  openMissedCheckIns() {
    //Pop Up Open
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.missedCheckIns, dialogConfig);

    this.commonService.setLoader(true);
    this.currentDate.utc();
    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.missedcheckl1.organization = contentVal.org;
          this.missedcheckl1.facility = contentVal.fac;
          this.commonService.setLoader(false);
        }
      }
    );

    this.data = JSON.parse(sessionStorage.getItem('authReducer'));
    this.username = this.data.last_name + ', ' + this.data.first_name;
  }

  dateChange(ev) {
    this.missedcheckl1.shift = '';
  }

  async missedCheckInSubmit(f, data, p) {
    if (f.valid) {
      this.fullResultData = [];
      this.show = false;
      this.tableShow = false;
      this.userList = [];
      this.showShiftType = this.shiftType;

      this.shiftData = this.shiftData.map((e) => {
        return {
          sr: e.sr,
          sTime: this.convertEqTz(e.sTime),
          midTime: this.convertEqTz(e.midTime),
          eTime: this.convertEqTz(e.eTime),
        };
      });

      let schartDate, echartDate;
      if (this.shiftData) {
        const n = this.shiftData.length;
        schartDate = this.shiftData[0].sTime;
        echartDate = this.shiftData[n - 1].eTime;
      }
      this.commonService.setLoader(true);
      const action = { type: 'POST', target: 'reports/missed_checkin' };
      const payload: any = {
        org: data.organization,
        facId: data.facility,
        shiftData: this.shiftData,
        schartDate: schartDate,
        echartDate: echartDate,
        localshift: this.showShiftType,
      };
      localStorage.setItem('misspayload', JSON.stringify(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/missedlevel1checkin']);
    } else {
      return;
    }
  }
  /* Missed CheckIns End */

  /* Virus Check report start */
  openVirusCheck() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.virsuCheck, dialogConfig);

    this.virusReportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.virusreport.organization = contentVal.org;
          this.virusreport.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.virusreport.organization],
            facility: [this.virusreport.facility],
          };

          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });

          this.userlist.sort(function (a, b) {
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
          this.virusReportForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          // for (let i = 0; i < this.virusreport.user.length; i++) {
          //   if (this.virusreport.user[i] === 0) {
          //     this.virusreport.user.splice(i, 1);
          //   }
          // }

          this.getAllresidents('virus');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  async virusReportSubmit(report, isValid) {
    this.setTotalUserResidentInFac();
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // ee = moment(moment(this.end_date)).tz(this.timezone,true);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.virusreport.facility,
        orgId: this.virusreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };
      console.log('--cirus report payload-----', payload);
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/virussreport']);
    } else {
      return;
    }
  }
  /* Virus Check report end */

  /* Start Refused Care Report */
  openrefusedcare() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.refusedcare, dialogConfig);

    this.refusedCareForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.refusedcareData.organization = contentVal.org;
          this.refusedcareData.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.refusedcareData.organization],
            facility: [this.refusedcareData.facility],
          };

          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });

          this.userlist.sort(function (a, b) {
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
          this.refusedCareForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          // for (let i = 0; i < this.refusedcareData.user.length; i++) {
          //   if (this.refusedcareData.user[i] === 0) {
          //     this.refusedcareData.user.splice(i, 1);
          //   }
          // }

          this.getAllresidents('refused');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  async refusedCareSubmit(report, isValid) {
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.vitalreport.facility,
        orgId: this.vitalreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };

      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/refusedcare']);
    } else {
      return;
    }
  }
  /* End refused Care Report */

  /* Vitals Report Start  */
  openVitalsReport() {
    // debugger
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.vitalsReport, dialogConfig);

    this.vitalsReportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      isresident: false,
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });
    this.vitalreport.isachive = true;
    this.vitalreport.isresident = true;
    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.vitalreport.organization = contentVal.org;
          this.vitalreport.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.vitalreport.organization],
            facility: [this.vitalreport.facility],
            is_resArchive: true,
            isAchive_data: true,
          };

          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });

          this.userlist.sort(function (a, b) {
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
          this.vitalsReportForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);

          this.getAllresidents('vital');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  // Start Vitals Submit Data Functions
  async vitalsReportSubmit(report, isValid) {
    this.setTotalUserResidentInFac();
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.vitalreport.facility,
        orgId: this.vitalreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };
      console.log('---vitals report payload-----', payload);
      // return
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/vitalsreport']);
    } else {
      return;
    }
  }

  // Start Vitals Submit Data Functions(not use)
  async vitalsReportSubmitold(report, isValid) {
    console.log(
      '======initial start end================',
      this.start_date,
      this.end_date
    );
    this.commonService.setLoader(false);
    if (isValid) {
      const s = moment(this.start_date).tz(this.timezone, true);
      let e;
      if (report.shift === 3) {
        console.log('------in shift 3------------------------');
        // e = moment(this.end_date).tz(this.timezone, true).add(1, 'day');
        e = moment.tz(this.end_date, this.timezone).add(1, 'day');
      } else {
        console.log('----else shift block----------------');
        // e = moment(this.end_date).tz(this.timezone, true);
        e = moment.tz(this.end_date, this.timezone);
      }
      console.log('---hours----', this.sTime, this.eTime);
      console.log('---s before---e before------', s.hour(), e.hour());
      s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      console.log('---s---e------', s, e);
      // moment(today_end['_d']).tz(this.timezone, true).valueOf()
      // this.start_date = moment(s['_d']).tz(this.timezone, true).valueOf();
      // this.end_date = moment(e['_d']).tz(this.timezone, true).valueOf();
      this.start_date = moment(s).tz(this.timezone, true).valueOf();
      this.end_date = moment(e).tz(this.timezone, true).valueOf();
      console.log('---timestamp-------', this.start_date, this.end_date);
      let ss, ee;
      // ss = moment(this.start_date).tz(this.timezone, true);
      // ee = moment(this.end_date).tz(this.timezone, true);
      // console.log('------ss ee values--------',ss,ee)
      // this.sTimeUTC = moment(ss).tz(this.timezone, true).utc().hours();
      // this.eTimeUTC = moment(ee).tz(this.timezone, true).utc().hours();
      // this.sMinute = moment(ss).tz(this.timezone, true).utc().minutes();
      // this.eMinute = moment(ee).tz(this.timezone, true).utc().minutes();

      ss = moment(this.start_date).tz(this.timezone).toDate();
      ee = moment(this.end_date).tz(this.timezone).toDate();

      let shour = moment.utc(ss);
      let ehour = moment.utc(ee);

      this.sTimeUTC = shour.hours();
      this.eTimeUTC = ehour.hours();
      this.sMinute = shour.minutes();
      this.eMinute = ehour.minutes();

      let sUTC = moment.tz(this.start_date, 'America/Chicago').utc().valueOf();
      let eUTC = moment.tz(this.end_date, 'America/Chicago').utc().valueOf();

      const payload = {
        shift: report.shift,
        start_date: sUTC, //this.start_date,
        end_date: eUTC, //this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.vitalreport.facility,
        orgId: this.vitalreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };
      console.log('payload', payload);
      // return
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/vitalsreport']);
    } else {
      return;
    }
  }
  // End Vitals Submit Data Functions

  /* Inventory Report Start  */
  openInventoryReport() {
    // debugger
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.inventoryReport, dialogConfig);

    this.inventoryReportForm = this.fb.group({
      resident: ['', [Validators.required]],
      isresident: false,
      rSearch: '',
    });

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.inventoryReportData.organization = contentVal.org;
          this.inventoryReportData.facility = contentVal.fac;
          this.getAllresidents('inventory');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  // Start Inventory Submit Data Functions
  async inventoryReportSubmit(report, isValid) {
    // this.setTotalUserResidentInFac();
    if (isValid) {
      const s = moment(this.start_date);
      const e = moment(this.end_date);
      s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      this.start_date = s['_d'].getTime();
      this.end_date = e['_d'].getTime();
      let ss, ee;

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        // shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        // userId: report.user,
        residentId: report.resident,
        // sTimeUTC: this.sTimeUTC,
        // eTimeUTC: this.eTimeUTC,
        facId: this.inventoryReportData.facility,
        orgId: this.inventoryReportData.organization,
        // sMinute: this.sMinute,
        // eMinute: this.sMinute,
        timezone: this.timezone,
      };
      console.log('---invetory report payload-----', payload);
      // return
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/viewinventoryreport']);
    } else {
      return;
    }
  }

  /* Start House  Keeping Functions */
  openHouseKeeping() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.houseReport, dialogConfig);

    this.houseReportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      isresident: false,
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.roomcleanreport.organization = contentVal.org;
          this.roomcleanreport.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.roomcleanreport.organization],
            facility: [this.roomcleanreport.facility],
          };

          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });

          this.userlist.sort(function (a, b) {
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
          this.houseReportForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          for (let i = 0; i < this.roomcleanreport.user.length; i++) {
            if (this.roomcleanreport.user[i] === 0) {
              this.roomcleanreport.user.splice(i, 1);
            }
          }
          this.getAllresidents('house');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  //Submit House Keeping
  async HouseReportSubmit(report, isValid) {
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.roomcleanreport.facility,
        orgId: this.roomcleanreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
      };
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/roomcleanreport']);
    } else {
      return;
    }
  }
  /* End House Keeping Functions */

  /* Start Fall care report */
  openfallcare() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.fallcare, dialogConfig);

    this.fallCareForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
      fallTypeSearch: ['', [Validators.required]],
    });

    this.Falltypes = this.commonService.fallTypeList();

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.fallCareData.organization = contentVal.org;
          this.fallCareData.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.fallCareData.organization],
            facility: [this.fallCareData.facility],
          };

          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });

          this.userlist.sort(function (a, b) {
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
          this.fallCareForm.controls.user.patchValue([
            ...this.userlist.map((item) => item._id),
            0,
          ]);
          // for (let i = 0; i < this.fallCareData.user.length; i++) {
          //   if (this.fallCareData.user[i] === 0) {
          //     this.fallCareData.user.splice(i, 1);
          //   }
          // }
          this.getAllresidents('fall');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  async fallCareSubmit(report, isValid) {
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        userId: report.user,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.fallCareData.facility,
        orgId: this.fallCareData.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
        fallType: report.fallType,
      };
      console.log('----fall payload---', payload);
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      console.log('---payload data----', payload);
      this.router.navigate(['/reports/falldatareport']);
    } else {
      console.log('-----in valid-------');
      return;
    }
  }
  /* End Fall Care Report */

  /* Start Testing Report */
  openTestingReport() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.testingReport, dialogConfig);

    this.testingForm = this.fb.group({
      // user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
      testingStatus: ['', [Validators.required]],
    });

    const testStatusArr = this.commonService.testingStatusList();
    this.testingStatusList = [...[{ no: 3, name: 'All' }], ...testStatusArr];

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.testingReportData.organization = contentVal.org;
          this.testingReportData.facility = contentVal.fac;

          const action = {
            type: 'GET',
            target: 'users/get_users_org_fac',
          };
          const payload = {
            organization: [this.testingReportData.organization],
            facility: [this.testingReportData.facility],
          };

          const result = await this.apiService.apiFn(action, payload);
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });

          /* this.userlist.sort(function (a, b) {
           const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
           if (nameA < nameB) { // sort string ascending
             return -1;
           }
           if (nameA > nameB) {
             return 1;
           }
           return 0; // default return value (no sorting)
         });
         this.testingForm.controls.user
           .patchValue([...this.userlist.map(item => item._id), 0]);
           for (let i = 0; i < this.fallCareData.user.length; i++) {
             if (this.fallCareData.user[i] === 0) {
               this.fallCareData.user.splice(i, 1);
             }
           }*/
          this.getAllresidents('testing');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  async testingReportSubmit(report, isValid) {
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      let { userName } = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.testingReportData.facility,
        orgId: this.testingReportData.organization,
        sMinute: this.sMinute,
        userName: userName,
        eMinute: this.sMinute,
        timezone: this.timezone,
        testingStatus: report.testingStatus,
      };
      console.log('----testing report payload---', payload);
      // return
      this._shiftRep.dispatch(insertTestingFn(payload));

      console.log(
        '---testing report data from session---',
        JSON.parse(sessionStorage.getItem('testingReportData'))
      );

      this.dialogRefs.close();
      this.router.navigate(['/reports/testingreport']);
    } else {
      console.log('-----in valid-------');
      return;
    }
  }
  /* End Testing Report */

  // Extra Functions
  activity_list() {
    this.router.navigate(['/reports/activity']);
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString('en-US', {
      timeZone: this.timezone,
    });
    return new Date(newDate);
  }

  convertEqTz(s) {
    return moment(s).tz(this.timezone, true).valueOf();
  }

  /**
   * @author Umang Kothari
   * @param range
   */
  updateRange(range: Range) {
    this.options.range = range;
    this.range = range;
    var today_st = moment();
    var today_ed = moment();
    var today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    var today_end = today_ed.set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });

    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      this.start_date = range['startDate']['_d'].getTime();
    } else if (range.fromDate) {
      //This condition for new Date Picker
      range['fromDate'] = moment(range['fromDate'])
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        .toDate();
      this.start_date = range.fromDate.getTime();
    } else {
      this.start_date = today_start['_d'].getTime();
    }

    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({
        hour: 23,
        minute: 59,
        second: 0,
        millisecond: 0,
      });
      this.end_date = range['endDate']['_d'].getTime();
    } else if (range.toDate) {
      range['toDate'] = moment(range['toDate'])
        .set({ hour: 23, minute: 59, second: 0, millisecond: 0 })
        .toDate();
      this.end_date = range.toDate.getTime();
    } else {
      this.end_date = today_end['_d'].getTime();
    }
    console.log('range in local timezone', this.start_date, this.end_date);
    console.log(
      'range in facility timezone',
      moment(moment(this.start_date)).tz(this.timezone, true).valueOf(),
      moment(moment(this.end_date)).tz(this.timezone, true).valueOf()
    );
    console.log('---select range------');
    console.log(range, this.start_date, this.end_date);
    console.log('---select range------');
  }

  // No Range Of this (No use)
  updateRangeOld(range: Range) {
    console.log('----range--------', range);
    var today_st = moment(
      this.commonService.convertLocalToTimezone(moment(), null, this.timezone)
    );
    var today_ed = moment(
      this.commonService.convertLocalToTimezone(moment(), null, this.timezone)
    );

    console.log('--initial date--', today_st, today_ed);

    var today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    var today_end = today_ed.set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });

    console.log('---today after setting hours---', today_start, today_end);

    if (range['startDate'] && range['startDate']['_d']) {
      // console.log('---d exist  startdate')
      range['startDate'] = range['startDate'].set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      // this.start_date = range['startDate']['_d'].getTime();
      this.start_date = moment(range['startDate']['_d'])
        .tz(this.timezone, true)
        .valueOf();
    } else {
      console.log('---d not exist  startdate');
      // this.start_date = today_start['_d'].getTime();
      this.start_date = moment(today_start['_d'])
        .tz(this.timezone, true)
        .valueOf();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      // console.log('---d exist  endate')
      range['endDate'] = range['endDate'].set({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
      });
      // this.end_date = range['endDate']['_d'].getTime();
      this.end_date = moment(range['endDate']['_d'])
        .tz(this.timezone, true)
        .valueOf();
    } else {
      console.log('---d not exist  endate');
      // this.end_date = today_end['_d'].getTime();
      this.end_date = moment(today_end['_d']).tz(this.timezone, true).valueOf();
    }

    // console.log('---select range------')
    console.log('update range', range, this.start_date, this.end_date);
    // console.log('---select range------')
  }
  //No use of this function
  async getShift() {
    let shiftList = [];
    const action = {
      type: 'GET',
      target: 'shift/',
    };
    let obj = {
      organization: this.shiftperformancereport.organization,
      facility: this.shiftperformancereport.facility,
    };
    // console.log('----object----',obj)
    const payload = obj;
    let result = await this.apiService.apiFn(action, payload);

    // console.log('---shift list----',result)

    if (result['status']) {
      let data = result['data'];
      data.forEach((e) => {
        shiftList.push({
          no: e._id,
          name: `${e.shift_name} (${e.start_time} - ${e.end_time})`,
        });
      });

      this.shiftArr = shiftList;
    }
  }
  //No Use
  DisplayCurrentTime(sDate) {
    const date = new Date(sDate);
    let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
    const am_pm = date.getHours() >= 12 ? 'PM' : 'AM';
    hours = hours === 0 ? 12 : hours;
    const hours1 = hours < 10 ? '0' + hours : hours;
    const minutes =
      date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    return hours1 + ':' + minutes + ' ' + am_pm;
  }
  //No Use
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
  //No use
  getuserTime(data, time) {
    const check = data.hData.find((t) => t.time === time);
    if (check) {
      return check.count;
    }
    return '';
  }
  // No use
  openCareswithinhours() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.careWithinhours, dialogConfig);
  }

  openCensusReport() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '400px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.censusReport, dialogConfig);

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.censusreport.organization = contentVal.org;
          this.censusreport.facility = contentVal.fac;
          this.commonService.setLoader(false);
        }
      }
    );
  }

  CensusSubmit(p) {
    let dateFrom = moment(this.censusreport.date)
      .subtract(6, 'd')
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .valueOf();
    let dateTo = moment(this.censusreport.date)
      .set({ hour: 23, minute: 59, second: 59, millisecond: 0 })
      .valueOf();
    const payload: any = {
      org: this.censusreport.organization,
      facId: this.censusreport.facility,
      dateTo: dateTo,
      dateFrom: dateFrom,
    };
    localStorage.setItem('censuspayload', JSON.stringify(payload));
    this.dialogRefs.close();
    this.router.navigate(['/reports/census']);
    // console.log(payload);
    // let hours;
    // this.newDate1 = moment(this.censusreport.date);
    // hours = Array.from({ length: 12 }, (v, k) => k);
    // this.shiftType = 'All Shift';
    // this.newDate1.set({ hour: 5, minute: 45, second: 0, millisecond: 0 });
    // this.newDate2 = moment(this.newDate1).add(1, 'days');
    // let sTime = this.newDate1;
    // let eTime = this.newDate2;

    // const action = { type: 'POST', target: 'reports/census' };
    // const payload: any = {
    //   'org': this.censusreport.organization,
    //   'facId': this.censusreport.facility,
    //   'schartDate': this.convertEqTz(sTime),
    //   'echartDate': this.convertEqTz(eTime),
    // };
    // console.log(payload);
  }

  ReportSubmit(p) {
    let dateFrom = moment(this.dnrreport.date)
      .subtract(6, 'd')
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .valueOf();
    let dateTo = moment(this.dnrreport.date)
      .set({ hour: 23, minute: 59, second: 59, millisecond: 0 })
      .valueOf();
    const payload: any = {
      org: this.dnrreport.organization,
      facId: this.dnrreport.facility,
      dateTo: dateTo,
      dateFrom: dateFrom,
    };
    localStorage.setItem('dnrpayload', JSON.stringify(payload));
    this.dialogRefs.close();
    this.router.navigate(['/reports/dnr']);
  }

  setTotalUserResidentInFac() {
    const rList = this.residentslist.length;
    const uList = this.userlist.length;
    const virusReportUserResdLength = {
      userLength: uList,
      residentLength: rList,
    };
    sessionStorage.setItem(
      'virusReportUserResdLength',
      JSON.stringify(virusReportUserResdLength)
    );
  }
  checkUserPrivilegeModule(moduleName, actionName) {
    return this.commonService.checkPrivilegeModule(moduleName, actionName);
  }

  updateCareTimeChanged(careChart, event) {
    let timeendDisp;
    if (
      moment(event.value).tz(this.userLocalTimeZone).format('HH:mm') ==
      moment().set({ hour: 23, minute: 45 }).format('HH:mm')
    ) {
      timeendDisp = moment(event.value)
        .add(14, 'minutes')
        .tz(this.userLocalTimeZone)
        .format('YYYY-MM-DDTHH:mm');
    } else {
      timeendDisp = moment(event.value)
        .add(15, 'minutes')
        .tz(this.userLocalTimeZone)
        .format('YYYY-MM-DDTHH:mm');
    }
    careChart.endTime = timeendDisp;
    careChart.startTime = event.value;
  }

  openTimeonLevelsreport() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(
      this.openTimeonLevelsReport,
      dialogConfig
    );

    this.timeOnLevelReportForm = this.fb.group({
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
      residentLevel: ['', [Validators.required]],
      resSearch: [' '],
      carSearch: '',
      DateSelected: '',
    });

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ no: 0, name: 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.mdltimeOnLevelReport.organization = contentVal.org;
          this.mdltimeOnLevelReport.facility = contentVal.fac;

          // const action = {
          //   type: 'GET',
          //   target: 'users/get_users_org_fac'
          // };
          // const payload = {
          //   organization: [this.mdltimeOnLevelReport.organization],
          //   facility: [this.mdltimeOnLevelReport.facility]
          // };

          // const result = await this.apiService.apiFn(action, payload);
          // this.userlist = await result['data'].map(function (obj) {
          //   const robj = {};
          //   robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
          //   robj['_id'] = obj._id;
          //   return robj;
          // });

          // this.userlist.sort(function (a, b) {
          //   const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
          //   if (nameA < nameB) { // sort string ascending
          //     return -1;
          //   }
          //   if (nameA > nameB) {
          //     return 1;
          //   }
          //   return 0; // default return value (no sorting)
          // });
          // this.timeOnLevelReportForm.controls.user
          //   .patchValue([...this.userlist.map(item => item._id), 0]);
          // for (let i = 0; i < this.mdltimeOnLevelReport.user.length; i++) {
          //   if (this.mdltimeOnLevelReport.user[i] === 0) {
          //     this.mdltimeOnLevelReport.user.splice(i, 1);
          //   }
          // }
          // await this.loadCarelevel();
          await this.getCarelevelsWithTimegoal();
          await this.getAllresidents('timeOnlevel');
          this.commonService.setLoader(false);
        }
      }
    );
  }
  timeOnLevelsReportSubmit(report, isValid) {
    // debugger
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

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // ee = moment(moment(this.end_date)).tz(this.timezone,true);

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        shift: report.shift,
        start_date: this.start_date,
        end_date: this.end_date,
        residentId: report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.mdltimeOnLevelReport.facility,
        orgId: this.mdltimeOnLevelReport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
        careLevel: [report.residentLevel],
        levelName: this.selectedCareLevel,
        goals: this.carelevelsWithGoals,
        isIncArchive: report.isresident,
      };
      console.log('--cirus report payload-----', payload);
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/timeonLevelsReport']);
    } else {
      return;
    }
  }

  selectAllLevel() {
    this.alllevel = true;
    if (this.selectedLevel.selected) {
      this.timeOnLevelReportForm.controls.residentLevel.patchValue([
        ...this.carelevelData.map((item) => item.value),
        0,
      ]);
      // if (this.timeOnLevelReportForm.controls.organization.value && this.timeOnLevelReportForm.controls.facility.value &&
      //   this.timeOnLevelReportForm.controls.residentStatus.value && this.timeOnLevelReportForm.controls.residentLevel.value) {
      this.getAllresidents('timeOnlevel');
      //}
      for (let i = 0; i < this.mdltimeOnLevelReport.residentLevel.length; i++) {
        if (this.mdltimeOnLevelReport.residentLevel[i] === 0) {
          this.mdltimeOnLevelReport.residentLevel.splice(i, 1);
        }
      }
    } else {
      this.alllevel = false;
      this.residentslist = null;
      this.mdltimeOnLevelReport.resident = null;
      this.timeOnLevelReportForm.controls.residentLevel.patchValue([]);
    }
  }

  selectLevel(label, id) {
    // this.alllevel = true;
    this.residentslist = null;
    this.mdltimeOnLevelReport.resident = null;
    this.selectedCareLevel = label;
    // if (this.timeOnLevelReportForm.controls.organization.value && this.timeOnLevelReportForm.controls.facility.value &&
    //   this.timeOnLevelReportForm.controls.residentStatus.value && this.timeOnLevelReportForm.controls.residentLevel.value) {
    this.getAllresidents('timeOnlevel');
    // }
    // if (this.selectedLevel.selected) {
    //   this.selectedLevel.deselect();
    //   return false;
    // }
    // if (this.timeOnLevelReportForm.controls.residentLevel.value.length === this.carelevelData.length) {
    //   this.selectedLevel.select();
    // }
    // for (let i = 0; i < this.mdltimeOnLevelReport.residentLevel.length; i++) {
    //   if (this.mdltimeOnLevelReport.residentLevel[i] === 0) {
    //     this.mdltimeOnLevelReport.residentLevel.splice(i, 1);
    //   }
    // }
  }

  async loadCarelevel() {
    const action = { type: 'GET', target: 'residents/carelevellist' };
    const payload = { date: new Date() };
    const result = await this.apiService.apiFn(action, payload);
    this.carelevelData = result['data'];
  }

  async getCarelevelsWithTimegoal() {
    const action = { type: 'GET', target: 'reports/carelevel_timegoal' };
    const payload = { facilityId: this.facilityId };
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['data'] && result['data'].length > 0) {
      this.carelevelsWithGoals = result['data'][0].timegoals.map((el) => {
        return { label: el.name, value: el.care_level_id, goal: el.value };
      });
      this.carelevelsWithGoals.sort((a, b) => {
        return a.label.localeCompare(b.label);
      });
    } else {
      console.log('error');
    }
  }

  /* Assessment Report Start  */
  openAssessmentReport() {
    // debugger
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.assessmentReport, dialogConfig);

    this.assessmentReportForm = this.fb.group({
      resident: ['', [Validators.required]],
      isresident: false,
      assessment_type: '',
      rSearch: '',
      tSearch: '',
    });

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.assessmentReportData.organization = contentVal.org;
          this.assessmentReportData.facility = contentVal.fac;
          this.getAllresidents('assessment');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  // Start Assessment Submit Data Functions
  async assessmentReportSubmit(report, isValid) {
    if (isValid) {
      const s = moment(this.start_date);
      const e = moment(this.end_date);
      s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      this.start_date = s['_d'].getTime();
      this.end_date = e['_d'].getTime();
      let ss, ee;

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        start_date: this.start_date,
        end_date: this.end_date,
        residentId: report.resident,
        facId: this.assessmentReportData.facility,
        orgId: this.assessmentReportData.organization,
        assessment_type: this.assessmentReportData.assessment_type,
        timezone: this.timezone,
      };
      console.log('---assessment report payload-----', payload);
      // return
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.router.navigate(['/reports/viewassessmentreport']);
    } else {
      return;
    }
  }

  /* Medication Report Start  */
  openMedicationReport() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.medicationReport, dialogConfig);

    this.medicationReportForm = this.fb.group({
      resident: ['', [Validators.required]],
      isresident: false,
      rSearch: '',
    });

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.medicationReportData.organization = contentVal.org;
          this.medicationReportData.facility = contentVal.fac;
          this.getAllresidents('medication');
          this.commonService.setLoader(false);
        }
      }
    );
  }

  // Start Assessment Submit Data Functions
  async medicationReportSubmit(report, isValid) {
    if (isValid) {
      const s = moment(this.start_date);
      const e = moment(this.end_date);
      s.set({ hour: this.sTime, minute: 0, second: 0, millisecond: 0 });
      e.set({ hour: this.eTime, minute: 0, second: 0, millisecond: 0 });
      this.start_date = s['_d'].getTime();
      this.end_date = e['_d'].getTime();
      let ss, ee;

      ss = moment(moment(this.start_date)).tz(this.timezone, true);
      ee = moment(moment(this.end_date)).tz(this.timezone, true);

      this.start_date = moment(moment(this.start_date))
        .tz(this.timezone, true)
        .valueOf();
      this.end_date = moment(moment(this.end_date))
        .tz(this.timezone, true)
        .valueOf();

      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        start_date: this.start_date,
        end_date: this.end_date,
        residentId: report.resident,
        facId: this.medicationReportData.facility,
        orgId: this.medicationReportData.organization,
        timezone: this.timezone,
      };
      console.log('---assessment report payload-----', payload);
      // return
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      // this.router.navigate(['/reports/viewmedicationReport']);
    } else {
      return;
    }
  }
}

export interface PresetItem {
  presetLabel: string;
  range: Range;
}

export interface Range {
  fromDate: Date;
  toDate: Date;
}

export interface CalendarOverlayConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  shouldCloseOnBackdropClick?: boolean;
}

export interface NgxDrpOptions {
  presets: Array<PresetItem>;
  format: string;
  range: Range;
  excludeWeekends?: boolean;
  locale?: string;
  fromMinMax?: Range;
  toMinMax?: Range;
  applyLabel?: string;
  cancelLabel?: string;
  animation?: boolean;
  calendarOverlayConfig?: CalendarOverlayConfig;
  placeholder?: string;
  startDatePrefix?: string;
  endDatePrefix?: string;
}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}

export interface matRangeDatepickerRangeValue<D> {
  begin: D | null;
  end: D | null;
}