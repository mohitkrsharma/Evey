import { Component, OnInit, ElementRef, ViewChild, HostListener, TemplateRef, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { Router } from '@angular/router';
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import * as _ from 'underscore';
import * as xlsx from 'xlsx';
import * as asyncfunc from 'async';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Rx';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';

import { ApiService } from './../../../../shared/services/api/api.service';
import { CommonService } from './../../../../shared/services/common.service';
import { insertRefFn } from './../../../../shared/store/shiftReport/action';
import { ExcelService } from './../../../../shared/services/excel.service';

interface shiftRepState {
  _shiftRep: object;
}

@Component({
  selector: 'app-censusreport',
  templateUrl: './censusreport.component.html',
  styleUrls: ['./censusreport.component.scss']
})
export class CensusreportComponent implements OnInit, OnDestroy {
  totalResident: any;
  totalActiveResident: any = 0;
  goalPercentage: any;
  facChange: boolean = false;
  timezone: any;
  shiftArr;
  utc_offset: any;
  userlist;
  floorlist;
  private subscription: Subscription;
  goals: any[] = [];
  goalsObj: any = {
    Level1: '',
    Level2: '',
    Level3: '',
    SafetyAndSupervision: '',
    Supervision: '',
    LimitedAssistAMcares: '',
    LimitedAssistPMcares: '',
    LimitedAssistAMandPMcares: '',
    MobilityAssistance: '',
    BathingAssistance: ''
  };
  ready: any;
  not_ready: any;
  goalDiffrnc: any = 0;
  hospice: any = 0;
  admits: number = 0;
  discharges: number = 0;
  moved: number = 0;
  transfered: number = 0;
  deceased: number = 0;
  level1Count: any = 0;
  level2Count: any = 0;
  level3Count: any = 0;
  safetyAndSupvsnCount: any = 0;
  supervsnCount: any = 0;
  lmAMCareCount: any = 0;
  lmPMCareCount: any = 0;
  lmAMPMCount: any = 0;
  mobiAstCount: any = 0;
  bathAstCount: any = 0;
  vacationCount: any = 0;
  skillNursCount: any = 0;
  hospitalizedCount: any = 0;
  totalUnit: any = 0;
  shiftType: string;
  careLevel: any[] = [];
  public maxDate: any;
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
  ) { }

  @ViewChild('shiftPerformance', {static: true}) shiftPerformance: TemplateRef<any>;
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  @ViewChild('selectedResident', {static: true}) private selectedResident: MatOption;
  @ViewChild('dateRangePicker', {static: true}) dateRangePicker;

  alwaysShowCalendars: boolean;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
  range: Range = { fromDate: new Date(), toDate: new Date() };

  currentDate = moment();
  censusreport: any = {
    organization: '',
    facility: '',
    date: new Date(),
    timezone: '',
    utc_offset: ''
  };
  data;
  username;
  runreportDate;
  censusData: any;
  dialogRefs;
  usrSearch = '';
  shiSearch = '';
  isShow: boolean;
  topPosToStartShowing = 100;
  newDate1 = moment();
  newDate2 = moment();
  allresident = false;
  allUserData: any;
  margins = {
    top: 100,
    bottom: 50,
    left: 25,
    right: 30,
    width: 550
  };
  options: NgxDrpOptions;
  presets: Array<PresetItem> = [];
  tilldate: any;
  dateFrom: any;
  HTMLWidth
  HTMLHeight
  topLeftMargin
  PDFWidth
  PDFHeight
  canvasImageWidth
  canvasImageHeight
  totalPDFPages
  pdf
  textConfiguration = {
    bold: 'bold',
    normal: 'normal',
    italic: 'italic',

  }
  fonConfiguration = {
    fontStyle: 'helvetica',
    fontSize: '20',
  }
  @ViewChild('content', {static: true}) content: ElementRef;
  @ViewChild('censusReport', {static: true}) censusReport: TemplateRef<any>;
  @ViewChild('reportContent', {static: true}) reportContent: ElementRef;
  @HostListener('window:scroll')

  checkScroll() {
    // window scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop 
    // returns the same result in all the cases. window.pageYOffset is not supported below IE 9.
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  // TODO: Cross browsing
  gotoTop() {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }

  async ngOnInit() {
    this.maxDate = new Date();
    this.currentDate.utc();
    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shift' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.censusreport.organization = contentVal.org;
        this.censusreport.facility = contentVal.fac;
        this.censusreport.timezone = contentVal.timezone;
        this.timezone = contentVal.timezone;
        this.censusreport.utc_offset = contentVal.utc_offset;
        this.facChange = true;
        let sesInfo = JSON.parse(localStorage.getItem('censuspayload'));
        if (this.facChange && this.router.url.includes('census')) {
          this.commonService.setLoader(true);
          this.resetCounts();
          await this.loadReport(sesInfo);
          await this.getAvailableZone();
          await this.getCareLevelNames();
          await this.getStatusList();
          await this.getGoals();
          await this.getAdmitCount();
          this.commonService.setLoader(false);
        }
      }
    });

    this.data = JSON.parse(sessionStorage.getItem('authReducer'));
    this.username = this.data.last_name + ', ' + this.data.first_name;
    const getSes = JSON.parse(localStorage.getItem('censuspayload'));
    this.censusreport.schartDate = getSes.schartDate;
    this.censusreport.echartDate = getSes.echartDate;
  }

  async loadReport(reportData) {
    this.tilldate = moment(reportData.dateTo);
    this.dateFrom = moment(reportData.dateFrom);//.tz(this.censusreport.timezone, true);
    this.runreportDate = moment(reportData.dateTo).format('L');
  }

  async getGoals() {
    const action = { type: 'GET', target: 'goals/goal' };
    const payload = { facilityId: this.censusreport.facility };
    const result = await this.apiService.apiFn(action, payload);
    console.log('Goals In census', result);
    //this.goal = result['data'];
    if (result['data'].length > 0) {
      this.goalDiffrnc = this.totalResident - result['data'][0].occupancy_goal;
      //console.log('goalDifference', this.goalDiffrnc);
      this.goalPercentage = ((this.totalResident * 100) / result['data'][0].occupancy_goal).toFixed(0);
      this.goals = result['data'][0].goals;
      console.log('Goals----------->>>', this.goals);
      if (this.careLevel.length > 0) {
        this.careLevel = this.careLevel.map(careLevel => {
          let index = this.goals.findIndex(goal => goal.care_level_id === careLevel._id);
          if (index != -1) {
            return { _id: careLevel._id, name: careLevel.name, count: careLevel.count, goal: this.goals[index].value }
          } else {
            return { _id: careLevel._id, name: careLevel.name, count: careLevel.count, goal: '' }
          }
        })
      }
    } else {
      this.goalDiffrnc = 0;
      this.goalPercentage = 0;
    }
    console.log('Goal Object', this.goalsObj);
  }

  getPercentage(goal, total) {
    if (total - goal > 0)
      return ((total * 100) / goal).toFixed(0) + '%' + ' ' + '(+' + (total - goal) + ')'
    else
      return ((total * 100) / goal).toFixed(0) + '%' + ' ' + '(' + (total - goal) + ')';
  }

  getDiff(total, goal) {
    return total - goal;
  }

  async getAdmitCount() {
    const action = { type: 'POST', target: 'reports/count_admit_dischrg' };
    let startDate = moment(this.dateFrom).valueOf();//moment(this.tilldate).subtract(6,'d').valueOf();
    let endDate = moment(this.tilldate).valueOf();
    const payload = { 'facilityId': this.censusreport.facility, start: startDate, end: endDate };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status'] && result['data']) {
      if (result['data'].admit > 0) {
        this.admits = result['data'].admit;
      } else {
        this.admits = 0;
      }
      if (result['data'].discharges && result['data'].discharges.length > 0) {
        result['data'].discharges.forEach(el => {
          if (el._id == 'Deceased') {
            this.deceased = el.count;
          } else if (el._id == 'Moved') {
            this.moved = el.count;
          }
        });
      }
      if (result['data'].transferredCount && result['data'].transferredCount.length > 0) {
        let transfered = result['data'].transferredCount.filter(el => el._id === 'Transferred') || [];
        if (transfered.length > 0) {
          this.transfered = transfered[0].count;
        } else this.transfered = 0;
      }
      // if(result['data'].movedCount && result['data'].movedCount.length > 0){
      //   result['data'].movedCount.forEach(el => {
      //     if(el._id == 'Moved'){
      //       this.moved = el.count;
      //     }
      //   })
      // }
      this.discharges = this.moved + this.deceased + this.transfered;
    } else {
      this.admits = 0;
      this.moved = 0;
      this.discharges = 0;
      this.transfered = 0;
      this.deceased = 0;
    }
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //get total resident

  //get resident level

  async getStatusList() {
    const action = {
      type: 'POST',
      target: 'reports/resident_status'
    };
    const payload = {
      'fac': this.censusreport.facility,
      'tilldate': new Date(this.tilldate.set({ hour: 23, minute: 59, second: 59 })).getTime()
    };
    const result = await this.apiService.apiFn(action, payload);
    console.log('payload status', result);
    if (result['status'] && result['data'] && result['data'].length > 0) {
      result['data'].forEach(resident_status => {
        if (resident_status._id === 'Active') {
          this.totalActiveResident = resident_status.count;
        }
        if (resident_status._id === 'Skilled Nursing') {
          this.skillNursCount = resident_status.count;
        }
        if (resident_status._id === 'Hospitalized') {
          this.hospitalizedCount = resident_status.count;
        }
        if (resident_status._id === 'Vacation') {
          this.vacationCount = resident_status.count;
        }
      })
    } else {
      this.vacationCount = 0;
      this.skillNursCount = 0;
      this.hospitalizedCount = 0;
      this.totalActiveResident = 0;
    }

  }

  async getAvailableZone() {
    const action = {
      type: 'GET',
      target: 'reports/available_zone'
    };
    const payload = {
      facility: this.censusreport.facility,
      tilldate: new Date(this.tilldate.set({ hour: 23, minute: 59, second: 59 })).getTime()
    }
    const result = await this.apiService.apiFn(action, payload);
    console.log('new zone result', result);
    if (result['status']) {
      this.totalResident = result['data']['totalResident'];
      this.totalUnit = result['data']['totalUnit'];
      this.not_ready = result['data']['not_ready'];
      this.ready = result['data']['ready'];
      this.hospice = result['data']['totalHospice'];
    } else {
      this.totalResident = 0;
      this.totalUnit = 0;
      this.not_ready = 0
      this.ready = 0;
      this.hospice = 0;
    }
  }

  openCensusReport() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '400px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.censusReport, dialogConfig);

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.censusreport.organization = contentVal.org;
        this.censusreport.facility = contentVal.fac;
        this.commonService.setLoader(false);
      }
    });
  }

  exportXlsx(){

  }
  onExportAsPDF(){
    var data = document.getElementById('contentToConvert');  
    html2canvas(data).then(canvas => {
      var imgWidth = 208;      
      var imgHeight = canvas.height * imgWidth / canvas.width;  
      const contentDataURL = canvas.toDataURL('image/png')  
      let pdf = new jspdf('p', 'mm', 'a4'); 
      var position = 20;  
      pdf.addImage(contentDataURL, 'PNG', 1, position, imgWidth, imgHeight) 
      pdf.setFontSize(16) 
      pdf.setFont('bold');
      pdf.text(1, 10, "Census Report")
      pdf.save('Census Report');  
    }); 
  }

  async CensusSubmit(p) {
    let dateFrom = moment(this.censusreport.date).subtract(6, 'd').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).valueOf();
    let dateTo = moment(this.censusreport.date).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).valueOf();
    const payload: any = {
      'org': this.censusreport.organization,
      'facId': this.censusreport.facility,
      'dateFrom': dateFrom,
      'dateTo': dateTo,
    };

    localStorage.setItem('censuspayload', JSON.stringify(payload));
    this.dialogRefs.close();
    //set status count to zero
    this.totalActiveResident = 0;
    this.skillNursCount = 0;
    this.vacationCount = 0;
    this.hospitalizedCount = 0;
    this.admits = 0;
    this.moved = 0;
    this.discharges = 0;
    this.transfered = 0;
    this.deceased = 0;
    //set status count end
    this.commonService.setLoader(true);
    await this.loadReport(payload);
    await this.getAvailableZone();
    await this.getCareLevelNames();
    await this.getStatusList();
    await this.getGoals();
    await this.getAdmitCount();
    this.commonService.setLoader(false);
  }
  convertEqTz(s) {
    return moment(s).tz(this.timezone, true).valueOf()
  }

  cancelCensus() {
    this.dialogRefs.close();
  }

  async getCareLevelNames() {
    const action = { type: 'GET', target: 'care-level/names' };
    const payload = { fac: this.censusreport.facility, tilldate: new Date(this.tilldate.set({ hour: 23, minute: 59, second: 59 })).getTime() };
    const result = await this.apiService.apiFn(action, payload);
    console.log("carelevel result", result);
    if (result && result['status']) {
      this.careLevel = result['data'];
    }
  }

  resetCounts() {
    this.vacationCount = 0;
    this.skillNursCount = 0;
    this.hospitalizedCount = 0;
    this.totalActiveResident = 0;
    this.admits = 0;
    this.moved = 0;
    this.discharges = 0;
    this.transfered = 0;
    this.deceased = 0;
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
