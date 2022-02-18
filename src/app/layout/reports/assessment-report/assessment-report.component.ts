import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  HostListener,
  TemplateRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { Router } from '@angular/router';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as _ from 'underscore';
import * as xlsx from 'xlsx';
import * as asyncfunc from 'async';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Rx';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
} from '@angular/material/dialog';

import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { insertRefFn } from './../../../shared/store/shiftReport/action';
import { ExcelService } from './../../../shared/services/excel.service';

interface shiftRepState {
  _shiftRep: object;
}

@Component({
  selector: 'app-assessment-report',
  templateUrl: './assessment-report.component.html',
  styleUrls: ['./assessment-report.component.scss'],
})
export class AssessmentReportComponent implements OnInit {
  timezone: any;
  shiftArr;
  utc_offset: any;
  userlist;
  floorlist;

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
  assessmentReportForm: FormGroup;
  @ViewChild('assessmentReport', { static: false })
  assessmentReport: TemplateRef<any>;

  private subscription: Subscription;
  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private excelService: ExcelService,
    private _shiftRep: Store<shiftRepState>,
    private toastr: ToastrService,
    private exportAsService: ExportAsService,
    public commonService: CommonService,
    public dialog: MatDialog,
    private router: Router
  ) {}

  @ViewChild('shiftPerformance', { static: true })
  shiftPerformance: TemplateRef<any>;
  @ViewChild('allSelected', { static: true }) private allSelected: MatOption;
  @ViewChild('selectedResident', { static: true })
  private selectedResident: MatOption;
  @ViewChild('dateRangePicker', { static: true }) dateRangePicker;
  @ViewChild('inventoryReport', { static: false })
  inventoryReport: TemplateRef<any>;
  public doc: any;
  alwaysShowCalendars: boolean;
  ranges: any = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [
      moment().subtract(1, 'month').startOf('month'),
      moment().subtract(1, 'month').endOf('month'),
    ],
  };
  range: Range = { fromDate: new Date(), toDate: new Date() };

  countReportvalue;
  data;
  start_date;
  end_date;
  userName;
  dialogRefs;
  resultcount = false;
  isShow: boolean;
  topPosToStartShowing = 100;
  sTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
  eTime;
  allresident = false;
  residentOrg;
  residentFac;
  exportArr = [];
  margins = {
    top: 100,
    bottom: 50,
    left: 25,
    right: 30,
    width: 550,
  };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  residentslist = [];
  rSearch = '';
  tSearch = '';
  assessmentTypeList = [
    { value: 'All', type: 'all', key: 1 },
    { value: 'Mini Mental', type: 'mini_mental', key: 2 },
    { value: 'Functional', type: 'functional', key: 3 },
  ];

  ngOnInit() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
    const fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const toMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: 'Done',
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    this.subscription = this.commonService.contentdata.subscribe(
      (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
        }
      }
    );
    this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.userName = this.data.userName;
    this.loadReport();
  }

  async loadReport() {
    this.commonService.setLoader(true);
    const action = { type: 'POST', target: 'reports/view_assessment_reports' };
    const payload = this.data;

    let result = await this.apiService.apiFn(action, payload);
    // console.log('result-->', JSON.stringify(result['data']));
    if (result['data'] && result['data'].length > 0) {
      this.resultcount = true;
    } else {
      this.resultcount = false;
    }
    this.countReportvalue = result['data'];
    this.commonService.setLoader(false);
  }

  async setupPresets() {
    const backDate = (numOfDays) => {
      let today = new Date();
      return new Date(today.setDate(today.getDate() - numOfDays));
    };

    const startOfMonth = (month, year) => {
      return new Date(year, month, 1);
    };

    const endOfMonth = (month, year) => {
      return new Date(year, month + 1, 0);
    };

    const today = new Date();
    const yesterday = backDate(1);
    const minus7 = backDate(7);
    const minus30 = backDate(30);
    const monthFirstDate = startOfMonth(today.getMonth(), today.getFullYear());
    const monthEndDate = endOfMonth(today.getMonth(), today.getFullYear());
    const lastMonthFirstDate = startOfMonth(
      today.getMonth() - 1,
      today.getFullYear()
    );
    const LastMonthEndDate = endOfMonth(
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
        range: { fromDate: monthFirstDate, toDate: monthEndDate },
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

  cancelAssessment() {
    this.assessmentReportData.isachive = false;
    this.assessmentReportData.isresident = false;
    this.dialogRefs.close();
  }

  async expandPanel(residentName) {
    console.log('residentName--->', residentName);
    event.stopPropagation();
  }

  changeAssessmentType(assessmentType) {
    // console.log('assessmentType-->', assessmentType);
    this.assessmentReportData.assessment_type = assessmentType;
  }

  // Start of resident Common Functions
  async getAllresidents(reportType) {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org',
    };
    if (reportType === 'assessment') {
      this.residentOrg = this.assessmentReportData.organization;
      this.residentFac = this.assessmentReportData.facility;
    }
    const payload = {
      organization: [this.residentOrg],
      facility: [this.residentFac],
    };

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
    if (reportType === 'assessment') {
      this.assessmentReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
    }
  }

  updateRange(range: Range) {
    this.options.range = range;
    this.range = range;
    const today_st = moment();
    const today_ed = moment();
    const today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const today_end = today_ed.set({
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
      // This condition for new Date Picker
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

  formattedTime(ms: any) {
    const formattedTime = this.commonService.createTime(+ms);
    if (formattedTime) {
      return formattedTime;
    } else {
      return 0;
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
      this.data = JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      this.end_date = this.data.end_date;
      this.start_date = this.data.start_date;
      this.userName = this.data.userName;
      this.loadReport();
    } else {
      return;
    }
  }

  async download(userId) {
    // const startDate = this.getDateFromTimezone(this.start_date);
    // const endDate = this.getDateFromTimezone(this.end_date);
    // const shiftReport = await this.prepareForExportPDF(
    //   userId,
    //   startDate,
    //   endDate
    // );
  }

  selectAllresidents() {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.assessmentReportForm.controls.resident.patchValue([
        ...this.residentslist.map((item) => item.key),
        0,
      ]);
      for (let i = 0; i < this.assessmentReportData.resident.length; i++) {
        if (this.assessmentReportData.resident[i] === 0) {
          this.assessmentReportData.resident.splice(i, 1);
        }
      }
    } else {
      this.assessmentReportForm.controls.resident.patchValue([]);
    }
  }

  selectResident(all, id, residentCheck) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
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

