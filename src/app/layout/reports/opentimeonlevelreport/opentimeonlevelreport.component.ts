import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatOption, PageEvent } from '@angular/material';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ExcelService } from 'src/app/shared/services/excel.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Subscription } from 'rxjs';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';
import { ToastrService } from 'ngx-toastr';
import { insertRefFn } from 'src/app/shared/store/shiftReport/action';
interface shiftRepState { _shiftRep: object; }

@Component({
  selector: 'app-opentimeonlevelreport',
  templateUrl: './opentimeonlevelreport.component.html',
  styleUrls: ['./opentimeonlevelreport.component.scss']
})
export class OpentimeonlevelreportComponent implements OnInit, OnDestroy {

  data: any;
  start_date;
  end_date;
  selected_start_date: any;
  selected_end_date: any;
  userName;
  shiftNo;
  selectShift;
  resultcount = true;
  timezone: any;
  utc_offset: any;
  carelevelData: any;
  selectedCarelevelName: string;
  private subscription: Subscription;
  timeOnCareLevelData: any[] = [];
  facilityId: any;
  panelOpenState = false;
  selectedCareLevels: any[] = [];
  totalHours: any;
  totalResident: any;
  totalActiveDays: any = 0;
  timeOnCareLevelArr: any[] = [];
  dailyPerResident: any;
  timegoalData: any;
  careLevelGoalHr: any = 0;
  careLvlGoalDiff: any = 0;
  careLvlGoalAvg: any = 0;
  // doc: any;
  sTime;
  eTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
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
  dialogRefs;
  timeOnLevelReportForm: FormGroup;
  reportOrg;
  reportFac;
  isresident_status;
  residentslist = [];
  alllevel = false;
  @ViewChild('selectedLevel', { static: false }) private selectedLevel: MatOption;
  @ViewChild('selectedResident', { static: false }) private selectedResident: MatOption;
  @ViewChild('openTimeonLevelsReport', { static: false }) openTimeonLevelsReport: TemplateRef<any>;
  residentOrg;
  residentFac;
  newDate1 = moment();
  newDate2 = moment();
  allresident = false;
  options: NgxDrpOptions;
  range: Range = { fromDate: new Date(), toDate: new Date() };
  shiftArr;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
  presets: Array<PresetItem> = [];
  selecteddate;
  selectedLevels: any[] = [];
  carSearch = '';
  shiSearch = '';
  resSearch = '';
  levelGoal: any;
  carelevels: any[] = [];
  selectedCareLevel: any;
  constructor(private apiService: ApiService,
    public commonService: CommonService,
    private router: Router,
    private excelService: ExcelService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private _shiftRep: Store<shiftRepState>) { }

  async ngOnInit() {
    if (!this.commonService.checkAllPrivilege("Reports")) {
      this.router.navigate(["/"]);
    }
    let today = new Date();
    const fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
    const toMax = new Date();
    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: "Done",
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.selected_start_date = this.start_date;
    this.selected_end_date = this.end_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.selectedLevels = this.data.careLevel
    this.selectedCarelevelName = this.data.levelName;
    let tempArr = this.data.goals.filter(el => el.label === this.selectedCarelevelName) || [];
    this.levelGoal = tempArr[0].goal;
    this.careLevelGoalHr = this.levelGoal;
    this.carelevels = this.data.goals;
    if (this.shiftNo === 0) {
      this.selectShift = "All Shifts";
    } else if (this.shiftNo === 1) {
      this.selectShift = "1st Shift (6:00am - 2:00pm)";
    } else if (this.shiftNo === 2) {
      this.selectShift = "2nd Shift (2:00pm - 10:00pm)";
    } else {
      this.selectShift = "3rd Shift (10:00pm - 6:00am)";
    }

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.timezone = contentVal.timezone
        this.utc_offset = contentVal.utc_offset
        this.facilityId = contentVal.fac;
        this.resetVariables();
        this.mdltimeOnLevelReport.organization = contentVal.org;
        this.mdltimeOnLevelReport.facility = contentVal.fac;
        this.getTimeOnLevelGoalData();
      }
    });

  }
  async openontimelevelReport() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.openTimeonLevelsReport, dialogConfig);
    this.timeOnLevelReportForm = this.fb.group({
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
      residentLevel: ['', [Validators.required]],
      resSearch: [' '],
      carSearch: '',
      selecteddate: ''
    });
    this.commonService.setLoader(false);
    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];
  }
  async downloadAll() {

  }

  async loadCarelevel() {
    const action = { type: 'GET', target: 'residents/carelevellist' };
    const payload = { date: new Date() };
    const result = await this.apiService.apiFn(action, payload);
    this.carelevelData = result['data'];
  }

  async getTimeOnCareLevelReport() {
    this.data['facId'] = this.facilityId;
    const action = { type: 'POST', target: 'reports/time_on_care_level' };
    const payload = { "timeOnCareLevel": this.data };
    this.commonService.setLoader(true);
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.timeOnCareLevelData = result['data'].finalArr;
    } else {
      this.toastr.error('error in get time on care level report');
    }
    this.commonService.setLoader(false);
  }

  getTimeInHours(minutes) {
    return (minutes / 60).toFixed(2);
  }

  getDate(date) {
    return moment(date).tz(this.timezone, true).format("MMMM Do YYYY");
  }

  async getTimeOnCareLevelCount() {
    this.data['facId'] = this.facilityId;
    const action = { type: 'POST', target: 'reports/time_on_care_level_count' };
    const payload = { "timeOnCareLevel": this.data };
    const result = await this.apiService.apiFn(action, payload);
    console.log("Count result ------->>", result);
    this.totalHours = result['data'].totalMinutes;
    this.totalResident = result['data'].totalResident;
    // this.getDailyPerResident();
  }

  async getTimeOnEachCareLevel() {
    this.commonService.setLoader(true);
    let timeOnLevelPayload = this.data;
    timeOnLevelPayload['facId'] = this.facilityId;
    const action = { type: 'POST', target: 'reports/time_on_care_level' };
    const payload = { "timeOnCareLevel": timeOnLevelPayload };
    const result = await this.apiService.apiFn(action, payload);
    console.log('Report response ----->>', result);
    this.timeOnCareLevelData = result['data']['finalArr'];
    this.totalResident = result['data']['finalArr'].length;
    let sumActivedays = 0;
    let sumTotalmins = 0;
    result['data']['finalArr'].forEach(el => {
      sumActivedays += el.days;
      sumTotalmins += el.totalMinutes;
    });
    this.totalActiveDays = sumActivedays;
    this.totalHours = sumTotalmins;
    let hrs = this.getTimeInHours(this.totalHours);
    if (Number(hrs) != 0.00 && this.totalActiveDays != 0) {
      this.dailyPerResident = (Number(hrs) / this.totalActiveDays).toFixed(2);
    }
    if (this.levelGoal && this.dailyPerResident) {
      this.careLvlGoalDiff = Number(this.dailyPerResident) - this.levelGoal;
      this.careLvlGoalAvg = (Number(this.dailyPerResident) * 100 / this.levelGoal).toFixed(0);
      this.careLvlGoalAvg == 'NaN' ? this.careLvlGoalAvg = 0 : '';
      this.careLvlGoalDiff == 'NaN' ? this.careLvlGoalDiff = 0 : '';
    }
    this.commonService.setLoader(false);
  }

  getDailyAverage(days, mins) {
    let hrs = this.getTimeInHours(mins);
    return (parseInt(hrs) / days).toFixed(2);
  }

  getDailyPerResident() {
    let hrs = this.getTimeInHours(this.totalHours);
    let days = this.totalActiveDays;
    if (Number(hrs) != 0.00 && days != 0) {
      this.dailyPerResident = (Number(hrs) / days).toFixed(2);
    }
    if (this.careLevelGoalHr && this.dailyPerResident) {
      this.careLvlGoalDiff = Number(this.dailyPerResident) - this.careLevelGoalHr;
      this.careLvlGoalAvg = (Number(this.dailyPerResident) * 100 / this.careLevelGoalHr).toFixed(0);
      this.careLvlGoalAvg == 'NaN' ? this.careLvlGoalAvg = 0 : '';
      this.careLvlGoalDiff == 'NaN' ? this.careLvlGoalDiff = 0 : '';
    }
  }

  async loadTimeGoalData() {
    this.commonService.setLoader(true);
    const action = { type: 'GET', target: 'goals/timegoal' };
    const payload = { facilityId: this.facilityId, careLevel: this.data.careLevel[0] };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data'].length > 0) {
      console.log(result['data']);
      this.timegoalData = result['data'][0];
      this.timegoalData.timegoals.forEach(el => {
        let index = this.data.careLevel.findIndex(elem => el.care_level_id == elem);
        if (index != -1) {
          this.careLevelGoalHr += Number(el.value);
        }
      });
      console.log('careLevelGoalHr', this.careLevelGoalHr);
    }
    this.commonService.setLoader(false);
  }

  getGoalLevelWise(minutes, days) {
    let avg = this.getDailyAverage(days, minutes);
    return `${(Number(avg) * 100 / this.levelGoal).toFixed(0)}% (${(Number(avg) - this.levelGoal).toFixed(2)})`;
  }

  resetVariables() {
    this.totalActiveDays = 0;
    this.totalHours = 0;
    this.timeOnCareLevelArr = [];
    this.careLvlGoalDiff = 0;
    this.careLvlGoalAvg = 0;
    this.dailyPerResident = 0;
    this.careLevelGoalHr = 0;
    this.timeOnCareLevelData = [];
  }

  async onExportAsPDF() {
    let header = ['Resident Name', 'Start Date', 'End Date', 'Days', 'Total (hr)', 'Daily Ave (hr)', '% of Goal'];
    let dataArr = [];
    this.timeOnCareLevelData.forEach(el => {
      dataArr.push([
        el.residentName,
        moment(el.startDate).tz(this.timezone, true).format('MM/DD/YYYY'),
        moment(el.endDate).tz(this.timezone, true).format('MM/DD/YYYY'),
        el.days,
        this.getTimeInHours(el.totalMinutes),
        this.getDailyAverage(el.days, el.totalMinutes),
        this.getGoalLevelWise(el.totalMinutes, el.days)
      ]);
    });
    let fontfamily = 'helvetica'
    let fontsize = 10;
    let x = 19.05;
    let y = 19.05;
    let doc = new jsPDF('p', 'mm', 'letter');
    doc.setFont(fontfamily, "normal");
    doc.setFontSize(16).setFont(fontfamily, 'bold');
    doc.text('Time on Level Report', x, y);
    doc.setFontSize(fontsize).setFont(fontfamily, "normal");
    y = y + 6;
    doc.text(`Created by ${this.userName}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 6;
    doc.text(`${moment(this.getDateFromTimezone(this.start_date)).format('L')} - ${moment(this.getDateFromTimezone(this.end_date)).format('L')}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 6;
    doc.text(`${this.selectShift}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
    y = y + 8;
      let data = dataArr;
      doc.setFontSize(12).setFont(fontfamily, 'bold')
      doc.text(this.selectedCarelevelName, x, y);
        await doc.autoTable({
          startY: y + 6,
          margin: { left: 19.05, right: 19.05 },
          head: [header],
          body: data,
          theme: 'plain',
          styles: {
            overflow: 'linebreak',
            lineWidth: 0.1,
            valign: 'middle',
            lineColor: 211
          },
          horizontalPageBreak: true,
          didDrawPage: function () {
            doc.setTextColor('#1164A0');
            doc.setFontSize(8);
            doc.setFont(fontfamily, 'normal');
            doc.text('Reported by Evey®', x, 273.3, null, null, "left")
            doc.setFontSize(8).setFont(fontfamily, 'normal');;
            doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, "right");
            doc.setTextColor('black');
            doc.setFontSize(fontsize);
            doc.setFont(fontfamily, 'normal');
          }
        })
        y = doc.lastAutoTable.finalY + 10;
        doc.save('Time-on-Level-Report');
  }

  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }

  //run another changes begins

  timeOnLevelsReportSubmit(report, isValid) {
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

      this.start_date = moment(moment(this.start_date)).tz(this.timezone, true).valueOf();
      this.end_date = moment(moment(this.end_date)).tz(this.timezone, true).valueOf();

      // ss = moment(moment(this.start_date)).tz(this.timezone,true);
      // ee = moment(moment(this.end_date)).tz(this.timezone,true);


      this.sTimeUTC = ss.utc().hours();
      this.eTimeUTC = ee.utc().hours();
      this.sMinute = ss.utc().minutes();
      this.eMinute = ee.utc().minutes();

      const payload = {
        'shift': report.shift,
        'start_date': this.start_date,
        'end_date': this.end_date,
        'residentId': report.resident,
        sTimeUTC: this.sTimeUTC,
        eTimeUTC: this.eTimeUTC,
        facId: this.mdltimeOnLevelReport.facility,
        orgId: this.mdltimeOnLevelReport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone,
        careLevel: [report.residentLevel],
        levelName: this.selectedCareLevel,
        goals: this.data.goals,
        isIncArchive: report.isresident
      };
      console.log('--cirus report payload-----', payload)
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this.getSessionStorageData();
      // this.router.navigate(['/reports/timeonLevelsReport']);
    } else {
      return;
    }
  }

  async isArchiveResi(event, checkResi) {
    if (checkResi === 'timeOnlevel') {
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
      target: 'residents/get_res_org'
    };
    const payload = {
      'organization': [this.reportOrg],
      'facility': [this.reportFac],
      is_resArchive: this.isresident_status
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
    if (checkResi === 'timeOnlevel') {
      this.timeOnLevelReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.mdltimeOnLevelReport.user.length; i++) {
        if (this.mdltimeOnLevelReport.user[i] === 0) {
          this.mdltimeOnLevelReport.user.splice(i, 1);
        }
      }
    }
  }

  selectAllLevel() {
    this.alllevel = true;
    if (this.selectedLevel.selected) {
      this.timeOnLevelReportForm.controls.residentLevel
        .patchValue([...this.carelevelData.map(item => item.value), 0]);
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

  async getAllresidents(reportType) {

    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    if (reportType === 'timeOnlevel') {
      this.residentOrg = this.mdltimeOnLevelReport.organization;
      this.residentFac = this.mdltimeOnLevelReport.facility;
    }
    const payload = {
      'organization': [this.residentOrg],
      'facility': [this.residentFac],

    };
    if (reportType === 'timeOnlevel') {
      payload['care_level'] = [this.timeOnLevelReportForm.controls.residentLevel.value];
    }
    const result = await this.apiService.apiFn(action, payload);
    this.residentslist = await result['data'].map(function (obj) {
      const robj = {};
      // tslint:disable-next-line: max-line-length
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
    if (reportType === 'timeOnlevel') {
      this.timeOnLevelReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
    }

  }

  changeShiftForVitals(shiftNo) {
    let zone = this.timezone

    this.newDate1 = moment.tz(zone);
    this.newDate2 = moment.tz(zone)

    // this.newDate1 = moment();
    // this.newDate2 = moment();

    if (shiftNo === 0) {
      this.mdltimeOnLevelReport.shiftType = 'All';
    } else if (shiftNo === 1) {
      this.mdltimeOnLevelReport.shiftType = '1st Shift (6:00am - 2:00pm)';
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 2) {
      this.mdltimeOnLevelReport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.mdltimeOnLevelReport.shiftType = '3rd Shift (10:00pm - 6:00am)';
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.sTime = this.newDate1.hours();
    this.eTime = this.newDate2.hours();
    console.log('------shift changing time hours------', this.sTime, this.eTime)
  }

  selectResident(all, id, residentCheck) {
    this.allresident = true;
    if (this.selectedResident.selected) {
      this.selectedResident.deselect();
      return false;
    }
    if (residentCheck === 'timeOnlevel') {
      if (this.timeOnLevelReportForm.controls.resident.value.length === this.residentslist.length) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.mdltimeOnLevelReport.resident.length; i++) {
        if (this.mdltimeOnLevelReport.resident[i] === 0) {
          this.mdltimeOnLevelReport.resident.splice(i, 1);
        }
      }

    }

  }

  updateRange(range: Range) {
    this.options.range = range
    this.range = range;
    var today_st = moment();
    var today_ed = moment();
    var today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    var today_end = today_ed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 })

    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      this.start_date = range['startDate']['_d'].getTime();
    } else if (range.fromDate) {
      //This condition for new Date Picker
      range['fromDate'] = moment(range['fromDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.start_date = (range.fromDate).getTime();
    } else {
      this.start_date = today_start['_d'].getTime();
    }

    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
      this.end_date = range['endDate']['_d'].getTime();
    }
    else if (range.toDate) {
      range['toDate'] = moment(range['toDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
      this.end_date = (range.toDate).getTime()
    }
    else {
      this.end_date = today_end['_d'].getTime();
    }
    console.log('range in local timezone', this.start_date, this.end_date)
    console.log('range in facility timezone', moment(moment(this.start_date)).tz(this.timezone, true).valueOf(), moment(moment(this.end_date)).tz(this.timezone, true).valueOf())
    console.log('---select range------')
    console.log(range, this.start_date, this.end_date)
    console.log('---select range------')

  }

  cancelTimeOnLevelReport() {
    this.mdltimeOnLevelReport.isachive = false;
    this.mdltimeOnLevelReport.isresident = false;
    this.dialogRefs.close();
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

  //refactored code for time on level report
  async getTimeOnLevelGoalData() {
    this.commonService.setLoader(true);
    await this.getTimeOnEachCareLevel();
      // await this.getCounTimeOnCareLevel(filteredLevels);
      // await this.getTotalActiveDaysCount(filteredLevels);
      // this.selectedCareLevels = filteredLevels.map(el => {
      //   let index = this.carelevelData.findIndex(elem => elem._id === el);
      //   if (index != -1) {
      //     return { "careLevelId": el, "careLevelName": this.carelevelData[index].label }
      //   }
      // });
      // this.selectedCareLevels.sort(function (a, b) {
      //   var nameA = a.careLevelId.toUpperCase();
      //   var nameB = b.careLevelId.toUpperCase();
      //   if (nameA < nameB) {
      //     return -1;
      //   }
      //   if (nameA > nameB) {
      //     return 1;
      //   }
      //   return 0;
      // });
      // this.getDailyPerResident();
    this.commonService.setLoader(false);
  }

  getSessionStorageData() {
    this.resetVariables();
    this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.selected_start_date = this.start_date;
    this.selected_end_date = this.end_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.selectedLevels = this.data.careLevel;
    this.selectedCarelevelName = this.data.levelName;
    if (this.shiftNo === 0) {
      this.selectShift = "All Shifts";
    } else if (this.shiftNo === 1) {
      this.selectShift = "1st Shift (6:00am - 2:00pm)";
    } else if (this.shiftNo === 2) {
      this.selectShift = "2nd Shift (2:00pm - 10:00pm)";
    } else {
      this.selectShift = "3rd Shift (10:00pm - 6:00am)";
    }
    this.getTimeOnLevelGoalData();
  }

  selectLevel(label, id) {
    // this.alllevel = true;
    this.residentslist = null;
    this.mdltimeOnLevelReport.resident = null;
    this.selectedCareLevel = label
    this.getAllresidents('timeOnlevel');
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
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

export interface PresetItem {
  presetLabel: string;
  range: Range;
}

export interface CalendarOverlayConfig {
  panelClass?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  shouldCloseOnBackdropClick?: boolean;
}
export interface Range {
  fromDate: Date;
  toDate: Date;
}