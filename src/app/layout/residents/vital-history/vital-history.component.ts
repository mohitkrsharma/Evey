import { Component, OnInit, Input, ViewChild, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogConfig, MatOption } from '@angular/material';
import { Chart } from 'chart.js';
import { DisplayGraphDataComponent } from 'src/app/shared/modals/display-graph-data/display-graph-data.component';
import { ViewVitalsButtonsComponent } from 'src/app/shared/modals/view-vitals-buttons/view-vitals-buttons.component';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/shared/services/excel.service';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import * as jspdf from 'jspdf';
import * as moment from 'moment';
import 'jspdf-autotable';
import { ActivatedRoute, Router } from '@angular/router';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { insertRefFn, insertTestingFn } from '../../../shared/store/shiftReport/action';
interface shiftRepState { _shiftRep: object; }

@Component({
  selector: 'app-vital-history',
  templateUrl: './vital-history.component.html',
  styleUrls: ['./vital-history.component.scss']
})
export class VitalHistoryComponent implements OnInit {
  spanMsg: string = '';
  selectedRange: number = 7;
  labelsArray: string[] = [];
  residentslist = [];
  presets: Array<PresetItem> = [];
  utc_offset: any
  selectedVital: string = 'Blood Pressure';
  allVitalData: any[] = [];
  vitalHistFromDate: Date;
  vitalHistToDate: Date;
  maxDate = new Date();
  residentdata: any
  @Input() residentId: any;
  @Input() residentName: any;
  pointBackgroundColorSystolic: any = [];
  pointBackgroundColorDiastolic: any = [];
  pointBgColorForCares: any[] = [];
  canvas: any;
  ctx: any;
  doc: any;
  isDataInsufficient: boolean = true;
  @ViewChild('linechart', { static: true }) linechart: any;
  @ViewChild('virusCheck', { static: true }) virusCheck: TemplateRef<any>;
  @ViewChild('allSelected', { static: true }) private allSelected: MatOption;
  @ViewChild('vitalsReport', { static: true }) vitalsReport: TemplateRef<any>;
  @ViewChild('selectedResident', { static: true }) private selectedResident: MatOption;
  paramId: Boolean = false;
  residentFullName;
  captionName;
  resident: any = {
    first_name: '',
    last_name: '',
    middle_name: '',
    nick_name: '',
    gender: '',
    admin_type: '',
    social_security_no: '',
    dob: '',
    age: '',
    organization: '',
    facility: '',
    current_org: '',
    current_fac: '',
    admit_date: '',
    floor: '',
    sector: '',
    resident_status: 'Active',
    updated_status: '',
    care_level: '',
    secondary_care_level: [],
    billingId: '',
    email: '',
    confirmemail: '',
    home_phone: '',
    mobile_phone: '',
    is_out_of_fac: false,
    is_out_of_room: false,
    hospice: false,
    dnr: false,
    two_am_checkin: true,
    pre_diseases: [],
    custom_isolation: "",
    files: [],
    other_email: "",
    care_name: '',
    care_note: '',
    nfc: [],
    disease_id: [],
    allergy_id: [],
    phone_numbers: [{ id: Math.random(), name: 'Mobile', value: '' }],
    emails: [{ id: Math.random(), name: 'Email', value: '' }]
  };
  graphData: any = {
    labels: '',
    datasets: []
  };
  chartOptions: any = {
    tooltips: {
      titleFontSize: 14,
      titleFontFamily: 'SFProText-Regular',
      bodyFontSize: 14,
      bodyFontFamily: 'SFProText-Regular',
      displayColors: false
    },
    legend: {
      display: false,
      labels: {
        boxWidth: 50,
        fontColor: 'black',
        position: 'top',
        fontFamily: 'SFProText-Regular',
        fontSize: 15,
      }
    },
    hover: {
      intersect: true,
    },
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          unit: 'day'
        },
        ticks: {
          fontFamily: 'SFProText-Regular',
          fontSize: 14,
          padding: 15,
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true,
          fontFamily: 'SFProText-Regular',
          fontSize: 14,
          padding: 15
        }
      }]
    },
    animation: {
      onComplete: 'done'
    },
    bezierCurve: true,
  };
  mylineChart: any;
  addImage: boolean = true;
  vitals: string[] = ['Temperature', 'Blood Pressure', 'Pulse', 'Oxygen', 'Respirations', 'Blood Sugar', 'Weight'];

  health_data = {
    temperature: '',
    respiration: '',
    oxygen: '',
    weight: '',
    height: '',
    blood_sugar: '',
    pulse: '',
    blood_pressure: '',
    bmi: 0
  };
  blood_pressure = {
    first_input: '',
    second_input: ''
  };
  sTime
  eTime;
  sTimeUTC;
  eTimeUTC;
  sMinute;
  eMinute;
  height_ft;
  inches;
  userlist;
  residentOrg;
  residentFac;
  check_temp_min: any;
  check_temp_max: any;
  filteredTemperature: any;
  check_pul_min: any;
  check_pul_max: any;
  check_oxy_min: any;
  check_oxy_max: any;
  check_res_min: any;
  check_res_max: any;
  check_bp_min: any;
  check_bp_max: any;
  check_bs_min: any;
  check_bs_max: any;
  userList: any;
  dialogRefs;
  virusReportForm: FormGroup;
  vitalsReportForm: FormGroup;
  shiftArr;
  private subscription: Subscription;
  options: NgxDrpOptions;
  range: Range = { fromDate: new Date(), toDate: new Date() };
  start_date;
  end_date;
  timezone: any;
  newDate1 = moment();
  newDate2 = moment();
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
  rSearch = '';
  usSearch = '';
  shiSearch = '';
  reportOrg;
  reportFac;
  isresident_status;
  allresident = false;
  isachive_status;
  checkFall: boolean = false;
  oldValueTestingStatus = '';
  isolation_end_date = '';
  isolation_start_date: any = '';
  constructor(
    private _toastr: ToastrService,
    public _commonService: CommonService,
    private apiService: ApiService,
    private excelService: ExcelService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private _aes256Service: Aes256Service,
    private _shiftRep: Store<shiftRepState>
  ) { }

  async ngOnInit() {
    // debugger
    this._commonService.setLoader(true);
    window.scrollTo(0, 0);
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
      applyLabel: "Done",
      fromMinMax: { fromDate: fromMin, toDate: fromMax },
      toMinMax: { fromDate: toMin, toDate: toMax },
    };

    this._commonService.content.subscribe(updatedTitle => { });
    sessionStorage.removeItem('pageListing');
    this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        // console.log('--facility timezone--',contentVal)
        this.timezone = contentVal.timezone
        this.utc_offset = contentVal.utc_offset
        console.log('---timezone---', this.timezone, this.utc_offset)
        this.maxDate = this.getCurrentDateFromTimezone()
        this.options.toMinMax.toDate = this.getCurrentDateFromTimezone()
      }
    });

    if (this.route.params['_value']['id']) {
      this.paramId = true;
      const action = { type: 'POST', target: 'residents/view' };
      this.residentId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      const payload = { residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
      const result = await this.apiService.apiFn(action, payload);
      if (result && result['data']) {
        this.residentdata = result['data'];
      }
      this.residentName = this.residentdata.last_name + ", " + this.residentdata.first_name;
      this.setDateRange();
      this.canvas = this.linechart.nativeElement;
      this.ctx = this.canvas.getContext('2d');
      Chart.defaults.global.defaultFontFamily = "Lato";
      Chart.defaults.global.defaultFontSize = 18;
      await this.showlinechart();
      this.mylineChart = new Chart(this.ctx, {
        type: 'line',
        data: this.graphData,
        options: this.chartOptions
      });
      if (result && result['data']) {
        this.resident = result['data'];
        this.oldValueTestingStatus = this.resident['testing_status'];
        this.isolation_end_date = result['isolation_end_date'];
        this.isolation_start_date = result['isolation_start_date'];
        console.log('this.resident------------->', this.resident);
        // this.residentName = this.resident.last_name + ", " + this.resident.first_name;
      }
      //this._commonService.setLoader(false);
      if (result && result['data']) {
        this.captionName = result['data']['first_name'].substring(0, 1) + result['data']['last_name'].substring(0, 1);
        this.residentFullName = result['data']['first_name'] + " " + result['data']['last_name'];
      }
      if (result && result['vital_data']) {
        result['vital_data'].map((item) => {
          if (item && item.name === 'Temperature') {
            if (!item.max_value || !item.min_value) {
              this.check_temp_min = '';
              this.check_temp_max = '';
            }
            else {
              this.check_temp_min = item.min_value;
              this.check_temp_max = item.max_value;
              this.filteredTemperature = item.max_value;
            }
          }
          //Pulse
          if (item && item.name === 'Pulse Automatic') {
            if (!item.max_value || !item.min_value) {
              this.check_pul_min = '';
              this.check_pul_max = '';
            }
            else {
              this.check_pul_min = item.min_value;
              this.check_pul_max = item.max_value;
            }
          }
          //Pulse
          //Oxygen
          if (item && item.name === 'Oxygen') {
            if (!item.max_value || !item.min_value) {
              this.check_oxy_min = '';
              this.check_oxy_max = '';
            }
            else {
              this.check_oxy_min = item.min_value;
              this.check_oxy_max = item.max_value;
            }
          }
          //Oxygen
          //Respirations
          if (item && item.name === 'Respirations') {
            if (!item.max_value || !item.min_value) {
              this.check_res_min = '';
              this.check_res_max = '';
            }
            else {
              this.check_res_min = item.min_value;
              this.check_res_max = item.max_value;
            }
          }
          //Respirations
          //Blood Pressure
          if (item && item.name === 'Blood Pressure') {
            if (!item.max_value || !item.min_value) {
              this.check_bp_min = '';
              this.check_bp_max = '';
            }
            else {
              this.check_bp_min = item.min_value;
              this.check_bp_max = item.max_value;
            }
          }
          //Blood Pressure
          //Blood Sugar
          if (item && item.name === 'ACCU Check') {
            if (!item.max_value || !item.min_value) {
              this.check_bs_min = '';
              this.check_bs_max = '';
            }
            else {
              this.check_bs_min = item.min_value;
              this.check_bs_max = item.max_value;
            }
          }
          //Blood Sugar
        });
      }
      if (result && result['health_data']) {
        result['health_data'].map((item) => {
          console.log("Item", item);

          if (item && item._id === 'Temperature' && item.data) {
            this.health_data['temperature'] = item.data['first_input'];
          }
          if (item && item._id === 'Respirations' && item.data) {
            this.health_data['respiration'] = item.data['first_input'];
          }
          if (item && item._id === 'Oxygen' && item.data) {
            this.health_data['oxygen'] = item.data['first_input'];
          }
          if (item && item._id === 'Weight' && item.data) {
            this.health_data['weight'] = item.data['first_input'];
          }
          if (item && item._id === 'ACCU Check' && item.data) {
            this.health_data['blood_sugar'] = item.data['first_input']
          }

          if (item && item._id === 'Blood Pressure' && item.data) {
            this.health_data['blood_pressure'] = item.data['first_input'] + '/' + item.data['second_input'];
            this.blood_pressure['first_input'] = item.data['first_input'];
            this.blood_pressure['second_input'] = item.data['second_input'];

            console.log(this.health_data['blood_pressure']);
          }
          if (item && item._id === 'Height' && item.data) {
            const hie = (JSON.parse(item.data['first_input']) / 12);
            const hie1 = hie.toString().split('.');
            console.log(hie1);
            this.height_ft = parseInt(hie1[0]);
            this.inches = Math.round(JSON.parse(item.data['first_input']) - 12 * this.height_ft);
            this.health_data['height'] = item.data['first_input'];
          }

          if (item && item._id === 'Pulse Automatic' && item.data) {
            this.health_data['pulse'] = item.data['first_input'];
          }

          if ((this.health_data['height']) && (this.health_data['weight'])) {

            const h = JSON.parse(this.health_data['height']) * 2.54 / 100;
            const bmi = (JSON.parse(this.health_data['weight']) * 0.45359237) / (h * h);
            this.health_data['bmi'] = Math.round(bmi);
          }
        });
      }
    }
    this._commonService.setLoader(false);
  }
  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
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

  // get chart data from API
  async Getchartdata(residentId, careName, toDate, fromdate) {
    const action = { type: 'GET', target: 'residents/get_vitals_history' };
    const payload = { residentId: residentId, careName: careName, toDate: toDate, fromdate: fromdate };
    return await this.apiService.apiFn(action, payload);
  }

  async onDateChange(e) {
    console.log('Date Changed', e);
    let diffBetweenDate = new Date(this.vitalHistFromDate).getTime() - new Date(this.vitalHistToDate).getTime();
    let absDiffrence = Math.abs(diffBetweenDate / (1000 * 3600 * 24));
    if (absDiffrence < 7 || absDiffrence > 60) {
      this._toastr.warning('Range should be minimun 7 to maximun 60 days');
    } else {
      this.mylineChart.clear();
      await this.showlinechart();
      this.mylineChart.update();
    }
  }

  async onVitalClick(e) {
    this.selectedVital = e.target.innerText;
    this.mylineChart.clear();
    await this.showlinechart();
    this.mylineChart.update();
  }

  async showlinechart() {
    // debugger
    this._commonService.setLoader(true);
    let vital = this.selectedVital;
    if (this.selectedVital == 'Pulse') {
      vital = 'Pulse Automatic';
    } else if (this.selectedVital == 'Blood Sugar') {
      vital = 'ACCU Check';
    }
    const vitalfromdata = moment(new Date(this.vitalHistFromDate))['_d'].getTime();
    const vitaltodata = moment(new Date(this.vitalHistToDate))['_d'].getTime();
    const vitalsdata = await this.Getchartdata(this.residentId, vital, vitaltodata, vitalfromdata);
    console.log("VitalsData ====>>",vitalsdata);
    this.allVitalData = vitalsdata["data"];
    if (vitalsdata["status"] && vitalsdata["data"].length > 0) {
      if (this.selectedVital === 'Blood Pressure') {
        let labelsdata = [];
        let datasets1 = [];
        let dataset2 = [];
        let minSystolic = vitalsdata['min'];
        let maxSystolic = vitalsdata['max'];
        let minDiastolic = vitalsdata['min_value'];
        let maxDiastolic = vitalsdata['max_value'];
        vitalsdata["data"].forEach(bpelement => {
          if (bpelement.track_details) {
            if (bpelement.track_details.first_input != '0' || bpelement.track_details.second_input != "0") {
              const date = new Date(bpelement.date);
              const formatteddate = this.datetostringdate(date);
              labelsdata.push(formatteddate);
              datasets1.push(bpelement.track_details.first_input);
              dataset2.push(bpelement.track_details.second_input);
            }
          }
        });
        let Systolicdata = {
          data: datasets1,
          label: 'Systolic',
          pointBackgroundColor: this.pointBackgroundColorSystolic,
          pointRadius: 9,
          pointStyle: 'circle',
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#2F59A5',
          borderColor: "#2F59A5",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        }
        let Diastolicdata = {
          data: dataset2,
          label: 'Diastolic',
          pointBackgroundColor: this.pointBackgroundColorDiastolic,
          pointRadius: 9,
          pointStyle: 'circle',
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#84CFEC',
          borderColor: "#84CFEC",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        }
        this.graphData.labels = labelsdata;
        this.graphData.datasets = [Systolicdata, Diastolicdata];
        for (let i = 0; i < datasets1.length; i++) {
          // if (datasets1[i] > 140) {
          //   this.pointBackgroundColorSystolic.push('red');
          // }
          // else if (datasets1[i] > 120) {
          //   this.pointBackgroundColorSystolic.push('yellow');
          // }
          // else if (datasets1[i] > 90) {
          //   this.pointBackgroundColorSystolic.push('green');
          // }
          // else {
          //   this.pointBackgroundColorSystolic.push('blue');
          // }
          if(datasets1[i] > maxSystolic || datasets1[i] < minSystolic){
            this.pointBackgroundColorSystolic.push('#EF4036');
          } else {
            this.pointBackgroundColorSystolic.push('#1975b8');
          }
        }
        for (let i = 0; i < dataset2.length; i++) {
          // if (dataset2[i] > 140) {
          //   this.pointBackgroundColorDiastolic.push('red');
          // }
          // else if (dataset2[i] > 120) {
          //   this.pointBackgroundColorDiastolic.push('yellow');
          // }
          // else if (dataset2[i] > 90) {
          //   this.pointBackgroundColorDiastolic.push('green');
          // }
          // else {
          //   this.pointBackgroundColorDiastolic.push('blue');
          // }
          if(dataset2[i] > maxDiastolic || dataset2[i] < minDiastolic){
            this.pointBackgroundColorDiastolic.push('#EF4036');
          } else {
            this.pointBackgroundColorDiastolic.push('#1975b8');
          }
        }
      } else if (this.selectedVital == 'Pulse' && vitalsdata['pulse']) {
        // console.log('For pulse ------>>', vitalsdata);
        let pulseData = vitalsdata['data'];
        let minValue = vitalsdata['min_value'];
        let maxValue = vitalsdata['max_value'];
        pulseData = pulseData.sort((a, b) => a._id.batchkey - b._id.batchkey);
        console.log('pulsedata -->>>', pulseData);
        let labelsdata = [];
        let leftDataset = [];
        let rightDataset = [];
        let radialDataset = [];
        let apicalDataset = [];
        let automaticDataset = [];
        let pointBgColorLeft = [];
        let pointBgColorRight = [];
        let pointBgColorRadial = [];
        let pointBgColorApical = [];
        let pointBgColorAutomatic = [];
        for (let i = 0; i < pulseData.length; i++) {
          labelsdata.push(this.datetostringdate(pulseData[i].trackcareList[0].date));
          for (let j = 0; j < pulseData[i].trackcareList.length; j++) {
            let careName = pulseData[i].trackcareList[j].carename;
            let data = Number(pulseData[i].trackcareList[j].trackdetails.first_input);
            if (careName === 'Left') {
              leftDataset.push({ x: this.datetostringdate(pulseData[i].trackcareList[j].date), y: data});
            } else if (careName === 'Right') {
              rightDataset.push({x: this.datetostringdate(pulseData[i].trackcareList[j].date), y: data});
            } else if (careName === 'Radial') {
              radialDataset.push({x: this.datetostringdate(pulseData[i].trackcareList[j].date), y: data});
            } else if (careName === 'Apical') {
              apicalDataset.push({ x: this.datetostringdate(pulseData[i].trackcareList[j].date), y:data});
            } else if (careName === 'Automatic') {
              automaticDataset.push({x: this.datetostringdate(pulseData[i].trackcareList[j].date), y:data});
            }
          }
          //check if all array is inserted
          // leftDataset.length < i + 1 ? leftDataset.push(0) : '';
          // rightDataset.length < i + 1 ? rightDataset.push(0) : '';
          // radialDataset.length < i + 1 ? radialDataset.push(0) : '';
          // apicalDataset.length < i + 1 ? apicalDataset.push(0) : '';
          // automaticDataset.length < i + 1 ? automaticDataset.push(0) : '';
        }

       
        for(let leftIndex = 0; leftIndex < leftDataset.length; leftIndex++){
          if(leftDataset[leftIndex].y > maxValue || leftDataset[leftIndex].y < minValue){
            pointBgColorLeft.push('#EF4036');
          } else {
            pointBgColorLeft.push('#1975b8');
          }
        }

        for(let rightIndex = 0; rightIndex < rightDataset.length; rightIndex++){
          if(rightDataset[rightIndex].y > maxValue || rightDataset[rightIndex].y < minValue){
            pointBgColorRight.push('#EF4036');
          } else {
            pointBgColorRight.push('#1975b8');
          }
        }

        for(let radialIndex = 0; radialIndex < radialDataset.length; radialIndex++){
          if(radialDataset[radialIndex].y > maxValue || radialDataset[radialIndex].y < minValue){
            pointBgColorRadial.push('#EF4036');
          } else {
            pointBgColorRadial.push('#1975b8');
          }
        }

        for(let apicalIndex = 0; apicalIndex < apicalDataset.length; apicalIndex++){
          if(apicalDataset[apicalIndex].y > maxValue || apicalDataset[apicalIndex].y < minValue){
            pointBgColorApical.push('#EF4036');
          } else {
            pointBgColorApical.push('#1975b8');
          }
        }

        for(let autoMtcIndex = 0; autoMtcIndex < automaticDataset.length; autoMtcIndex++){
          if(automaticDataset[autoMtcIndex].y > maxValue || automaticDataset[autoMtcIndex].y < minValue){
            pointBgColorAutomatic.push('#EF4036');
          } else {
            pointBgColorAutomatic.push('#1975b8');
          }
        }



        let leftData = {
          data: leftDataset,
          label: 'Left',
          pointBackgroundColor: pointBgColorLeft,
          pointRadius: 9,
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#286EE7',
          borderColor: "#286EE7",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        };
        let rightData = {
          data: rightDataset,
          label: 'Right',
          pointBackgroundColor: pointBgColorRight,
          pointRadius: 9,
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#24a2ae',
          borderColor: "#24a2ae",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        };
        let radialData = {
          data: radialDataset,
          label: 'Radial',
          pointBackgroundColor: pointBgColorRadial,
          pointRadius: 9,
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#46bc81',
          borderColor: "#46bc81",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        };

        let apicalData = {
          data: apicalDataset,
          label: 'Apical',
          pointBackgroundColor: pointBgColorApical,
          pointRadius: 9,
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#32496f',
          borderColor: "#32496f",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        };

        let automaticData = {
          data: automaticDataset,
          label: 'Automatic',
          pointBackgroundColor: pointBgColorAutomatic,
          pointRadius: 9,
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#e0a743',
          borderColor: "#e0a743",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        };

        this.graphData.labels = labelsdata;
        this.graphData.datasets = [leftData, rightData, radialData, apicalData, automaticData];
      } else {
        let labelsdata = [];
        let dataset = [];
        let minValue = vitalsdata['min_value'];
        let maxValue = vitalsdata['max_value'];
        vitalsdata["data"].forEach(vital => {
          if (vital.track_details) {
            if (vital && vital.track_details && vital.track_details.first_input != '0') {
              const date = new Date(vital.date);
              const formatteddate = this.datetostringdate(date);
              labelsdata.push(formatteddate);
              dataset.push(vital.track_details.first_input);
            }
          }
        });

        for(let i=0; i < dataset.length; i++){
          if(dataset[i] > maxValue || dataset[i] < minValue){
            this.pointBgColorForCares.push('#EF4036')
          } else {
            this.pointBgColorForCares.push('#1975b8')
          }
        }
        let tempvitalsdata = {
          data: dataset,
          label: this.selectedVital,
          pointBackgroundColor:  this.pointBgColorForCares,//'#EEF34F',
          pointRadius: 9,
          pointHoverRadius: 9,
          fill: false,
          lineTension: 0.3,
          backgroundColor: '#53b7e5',
          borderColor: "#53b7e5",
          borderWidth: 2,
          fontFamily: 'SFProText-Regular'
        }

        
        this.graphData.labels = labelsdata;
        this.graphData.datasets = [tempvitalsdata];
      }
    } else {
      this.graphData.labels = [];
      this.graphData.datasets = [];
      Chart.plugins.register({
        afterDraw: function (chart) {
          if (chart.data.datasets.length === 0) {
            // No data is present
            var ctx = chart.chart.ctx;
            var width = chart.chart.width;
            var height = chart.chart.height
            chart.clear();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '16px SFProText-Regular';
            ctx.fillStyle = 'black';
            ctx.fillText('Insufficient Data', width / 2, height / 2);
            ctx.restore();
          }
        }
      });
    }
    this._commonService.setLoader(false);
  }
  datetostringdate(paramdate) {
    let date = new Date(paramdate);
    return moment(date).format('MM/DD/YYYY');
  }
  allowDateKeys(key) {
    const result = this._commonService.allowDateKeys(key);
    return result;
  }

  timerCompleted(event) { }


  onViewData() {
    const dialogRef = this.dialog.open(DisplayGraphDataComponent, {
      width: '700px',
      panelClass: 'contactpopup',
      data: { dataset: this.graphData.datasets, labels: this.graphData.labels, vital: this.selectedVital }
    });
    dialogRef.afterClosed().subscribe(res => {
      if (res != undefined) {
        this.addImage = false;
        if (res.exportValue == 'PDF') {
          this.onExportAsPDF();
        } else {
          this.onExportAsExcel();
        }
        this.addImage = true;
      }
    });
  }

  onExportAsPDF() {
    const vitalObj = this.generateExcelData();
    if (vitalObj.vitalArr.length > 0) {
      this.doc = undefined;
      this.doc = new jspdf('p', 'mm', 'letter');

      this.doc.pagesplit = true;
      let header = ['Resident Name: ' + this.residentName, 'Care Name: ' + this.selectedVital, 'Date Range: ' + this.datetostringdate(this.vitalHistFromDate) + ' to ' + this.datetostringdate(this.vitalHistToDate)];

      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", 'bold');
      this.doc.text('Resident Name: ' + this.residentName, 19.05, 19.05, null, null, "left");
      this.doc.text('Care Name: ' + this.selectedVital, 108, 19.05, null, null, "center");
      this.doc.text('Date Range: ' + this.datetostringdate(this.vitalHistFromDate) + ' to ' + this.datetostringdate(this.vitalHistToDate), 194, 19.05, null, null, "right");
      header = vitalObj.CareName == 'Blood Pressure' ? ['Date', 'Systolic', 'Diastolic'] : ['Date', vitalObj.CareName];
      let data = vitalObj.vitalArr;
      this.doc.autoTable({
        startY: 130,
        margin: { left: 19.05, right: 19.05 },
        head: [header],
        body: data
      });
      this.doc.addImage(this.getimagefromchart(), 'JPEG', 19.05, 35, 178, 76);
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", 'bold');
      this.doc.text('Resident Id: ' + this.residentId, 196.95, 259.95, null, null, "right");
      this.doc.setTextColor('#1975B8');
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", 'normal');
      this.doc.text('CONFIDENTIAL', 19.05, 266.3, null, null, "left");
      this.doc.setFontSize(12);
      this.doc.text('evey', 196.95, 266.3, null, null, "right");
      this.doc.save(this.selectedVital.replace(' ', '') + "-report.pdf");
    } else {
      this._toastr.warning('No Data available to export!');
    }
  }

  async onExportAsExcel() {
    const vitalObj = this.generateExcelData();
    if (vitalObj.vitalArr.length > 0) {
      this.excelService.generateExcelForVitalHistory(vitalObj, this.getimagefromchart());
    } else {
      this._toastr.warning('No Data available to export!');
    }
  }
  getimagefromchart() {
    return this.mylineChart.toBase64Image();
  }
  generateExcelData() {
    switch (this.selectedVital) {
      case 'Pulse':
        this.spanMsg = 'bpm';
        break;
      case 'Respirations':
        this.spanMsg = 'bpm';
        break;
      case 'Oxygen':
        this.spanMsg = 'mm Hg';
        break;
      case 'Weight':
        this.spanMsg = 'lbs';
        break;
      case 'Blood Sugar':
        this.spanMsg = 'mg/dL';
        break;
      case 'Temperature':
        this.spanMsg = '°';
        break;
      case 'Blood Pressure':
        this.spanMsg = 'mm Hg';
        break;
      default:
        this.spanMsg = '';
        break;
    }
    const vitalArr: any[] = [];
    if (this.selectedVital === 'Blood Pressure') {
      this.allVitalData.forEach(vital => {
        if (vital.track_details) {
          vitalArr.push([
            moment(vital.date).format('MM/DD/YYYY'),
            vital.track_details.first_input + ' ' + this.spanMsg,
            vital.track_details.second_input + ' ' + this.spanMsg
          ]);
        }
      })
    } else {
      this.allVitalData.forEach(vital => {
        if (vital.track_details) {
          vitalArr.push([
            moment(vital.date).format('MM/DD/YYYY'),
            vital.track_details.first_input + ' ' + this.spanMsg
          ]);
        }
      })
    }
    const vitalObj = {
      'ResidentName': this.residentName,
      'CareName': this.selectedVital,
      'DateRange': this.datetostringdate(this.vitalHistFromDate) + ' to ' + this.datetostringdate(this.vitalHistToDate),
      'vitalArr': vitalArr
    }
    return vitalObj;
  }

  onViewVitals() {
    const dialogRef = this.dialog.open(ViewVitalsButtonsComponent, {
      width: '700px',
      panelClass: 'contactpopup',
      data: { 'vital': this.selectedVital }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res != undefined) {
        this.selectedVital = res.selectedVital;
        this.mylineChart.clear();
        this.createChart();
      }
    })

  }

  async createChart() {
    this.mylineChart.clear();
    await this.showlinechart();
    this.mylineChart.update();
  }

  async onRangeChange() {
    this.setDateRange();
    this.mylineChart.clear();
    await this.showlinechart();
    this.mylineChart.update();
  }

  setDateRange() {
    this.vitalHistFromDate = new Date(Date.now() - (this.selectedRange - 1) * 24 * 60 * 60 * 1000);
    this.vitalHistToDate = new Date();
  }
  cancel() {
    let id = this.route.params['_value']['id']
    this.router.navigate(['/residents/form', id]);
  }

  onVitalChange() {
    //console.log(this.selectedVital);
    this.createChart();
  }

  openVirusCheck() {
    this._commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.virusCheck, dialogConfig);

    this.virusReportForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
    });

    const shiftarray = this._commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shift' }], ...shiftarray];

    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
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

        const result = await this.apiService.apiFn(action, payload);
        if (result && result['data']) {
          this.userlist = await result['data'].map(function (obj) {
            const robj = {};
            robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
            robj['_id'] = obj._id;
            return robj;
          });
        }
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
        this.virusReportForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
        for (let i = 0; i < this.virusreport.user.length; i++) {
          if (this.virusreport.user[i] === 0) {
            this.virusreport.user.splice(i, 1);
          }
        }

        this.getAllresidents('virus');
        this._commonService.setLoader(false);
      }
    });
  }

  async getAllresidents(reportType) {
    const action = {
      type: 'GET',
      target: 'residents/get_res_org'
    };
    if (reportType === 'vital') {
      this.residentOrg = this.vitalreport.organization;
      this.residentFac = this.vitalreport.facility;
    }
    else if (reportType === 'virus') {
      this.residentOrg = this.virusreport.organization;
      this.residentFac = this.virusreport.facility;
    }
    const payload = {
      'organization': [this.residentOrg],
      'facility': [this.residentFac]
    };

    const result = await this.apiService.apiFn(action, payload);
    if (result && result['data']) {
      this.residentslist = await result['data'].map(function (obj) {
        const robj = {};
        robj['value'] = `${obj['last_name']}, ${obj['first_name']}\u00A0\ ${(obj['room'] && obj['room']['room']) ? obj['room']['room'] : ''}`
        robj['key'] = obj._id;
        return robj;
      });
    }
    this._commonService.setLoader(false);
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
    if (reportType === 'vital') {
      this.vitalsReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
    }
    else if (reportType === 'virus') {
      this.virusReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
    }
  }

  selectAllresidents(CheckRep) {
    this.allresident = true;

    if (this.selectedResident.selected) {
      if (CheckRep === 'vital') {
        this.vitalsReportForm.controls.resident
          .patchValue([...this.residentslist.map(item => item.key), 0]);
        for (let i = 0; i < this.vitalreport.resident.length; i++) {
          if (this.vitalreport.resident[i] === 0) {
            this.vitalreport.resident.splice(i, 1);
          }
        }
      }
      else if (CheckRep === 'virus') {
        this.virusReportForm.controls.resident
          .patchValue([...this.residentslist.map(item => item.key), 0]);
        for (let i = 0; i < this.virusreport.resident.length; i++) {
          if (this.virusreport.resident[i] === 0) {
            this.virusreport.resident.splice(i, 1);
          }
        }
      }
    } else {
      if (CheckRep === 'vital') {
        this.vitalsReportForm.controls.resident.patchValue([]);
      }
      else if (CheckRep === 'virus') {
        this.virusReportForm.controls.resident.patchValue([]);
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
      if (this.vitalsReportForm.controls.resident.value.length === this.residentslist.length) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.vitalreport.resident.length; i++) {
        if (this.vitalreport.resident[i] === 0) {
          this.vitalreport.resident.splice(i, 1);
        }
      }
    }
    else if (residentCheck === 'virus') {
      if (this.virusReportForm.controls.resident.value.length === this.residentslist.length) {
        this.selectedResident.select();
      }

      for (let i = 0; i < this.virusreport.resident.length; i++) {
        if (this.virusreport.resident[i] === 0) {
          this.virusreport.resident.splice(i, 1);
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
  }

  cancelVirus() {
    this.virusreport.isachive = false;
    this.virusreport.isresident = false;
    this.dialogRefs.close();
  }

  async virusReportSubmit(report, isValid) {
    if (isValid) {
      this._commonService.setLoader(true);
      this.setTotalUserResidentInFac();
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
        eMinute: this.sMinute,
        timezone: this.timezone
      };
      console.log('--cirus report payload-----', payload)
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this._commonService.setLoader(false);
      this.router.navigate(['/reports/virussreport']);
    } else {
      return;
    }
  }

  //Check Archive resident
  async isArchiveResi(event, checkResi) {
    if (checkResi === 'vital') {
      this.vitalreport.resident = '';
      this.reportOrg = this.vitalreport.organization;
      this.reportFac = this.vitalreport.facility;
    }
    else if (checkResi === 'virus') {
      this.virusreport.resident = '';
      this.reportOrg = this.virusreport.organization;
      this.reportFac = this.virusreport.facility;
    }
    this._commonService.setLoader(true);
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
    this._commonService.setLoader(false);
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
    if (checkResi === 'vital') {
      this.vitalsReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    }
    if (checkResi === 'virus') {
      this.virusReportForm.controls.resident
        .patchValue([...this.residentslist.map(item => item.key), 0]);
      for (let i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    }
  }
  //End of Resident Common Functions

  //Start of user Functions
  selectAll(checkTypeData) {
    if (this.allSelected.selected) {
      if (checkTypeData === 'vital_all') {
        this.vitalsReportForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
        for (var i = 0; i < this.vitalreport.user.length; i++) {
          if (this.vitalreport.user[i] === 0) {
            this.vitalreport.user.splice(i, 1);
          }
        }
      }
      else if (checkTypeData === 'virus_all') {
        this.virusReportForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
        for (var i = 0; i < this.vitalreport.user.length; i++) {
          if (this.virusreport.user[i] === 0) {
            this.virusreport.user.splice(i, 1);
          }
        }
      }
    } else {
      if (checkTypeData === 'vital_all') {
        this.vitalsReportForm.controls.user.patchValue([]);
      }
      else if (checkTypeData === 'virus_all') {
        this.virusReportForm.controls.user.patchValue([]);
      }
    }
  }

  selectUser(all, id, checkUser) {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }

    if (checkUser === 'vital') {
      if (this.vitalsReportForm.controls.user.value.length == this.userlist.length)
        this.allSelected.select();

      for (var i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    }
    else if (checkUser === 'virus') {
      if (this.virusReportForm.controls.user.value.length == this.userlist.length)
        this.allSelected.select();

      for (var i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    }
  }
  /**
 * @author Kaushik Radadiya
 * @param archivetoggle 
 */
  async isArchiveData(event, checkType) {
    console.log(checkType, event);
    if (checkType === 'vital') {
      this.vitalreport.user = '';
      this.reportOrg = this.vitalreport.organization;
      this.reportFac = this.vitalreport.facility;
    }
    else if (checkType === 'virus') {
      this.virusreport.user = '';
      this.reportOrg = this.virusreport.organization;
      this.reportFac = this.virusreport.facility;
    }



    this._commonService.setLoader(true);
    if (event === true) {
      this.isachive_status = true;
    } else {
      this.isachive_status = false;
    }
    this.userlist = '';
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac'
    }
    const payload = {
      organization: [this.reportOrg],
      facility: [this.reportFac],
      isAchive_data: this.isachive_status
    };

    var result = await this.apiService.apiFn(action, payload);
    console.log(result);
    this.userlist = null;
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
    if (checkType === 'vital') {
      this.vitalsReportForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
      for (let i = 0; i < this.vitalreport.user.length; i++) {
        if (this.vitalreport.user[i] === 0) {
          this.vitalreport.user.splice(i, 1);
        }
      }
    }
    if (checkType === 'virus') {
      this.virusReportForm.controls.user
        .patchValue([...this.userlist.map(item => item._id), 0]);
      for (let i = 0; i < this.virusreport.user.length; i++) {
        if (this.virusreport.user[i] === 0) {
          this.virusreport.user.splice(i, 1);
        }
      }
    }

    this._commonService.setLoader(false);
  }

  //End Of user Functions

  changeShiftForVitals(shiftNo) {
    let zone = this.timezone

    this.newDate1 = moment.tz(zone);
    this.newDate2 = moment.tz(zone)

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
    console.log('------shift changing time hours------', this.sTime, this.eTime)
  }

  openVitalsReport() {
    this._commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
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

    const shiftarray = this._commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shift' }], ...shiftarray];

    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.vitalreport.organization = contentVal.org;
        this.vitalreport.facility = contentVal.fac;

        const action = {
          type: 'GET',
          target: 'users/get_users_org_fac'
        };
        const payload = {
          organization: [this.vitalreport.organization],
          facility: [this.vitalreport.facility]
        };

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
        this.vitalsReportForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);

        for (let i = 0; i < this.vitalreport.user.length; i++) {
          if (this.vitalreport.user[i] === 0) {
            this.vitalreport.user.splice(i, 1);
          }
        }

        this.getAllresidents('vital');
        this._commonService.setLoader(false);
      }
    });
  }
  // Start Vitals Submit Data Functions
  async vitalsReportSubmit(report, isValid) {
    if (isValid) {
      this._commonService.setLoader(true);
      this.setTotalUserResidentInFac();
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

      // ss = moment(this.start_date);
      // ee = moment(this.end_date);

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
        facId: this.vitalreport.facility,
        orgId: this.vitalreport.organization,
        sMinute: this.sMinute,
        eMinute: this.sMinute,
        timezone: this.timezone
      };
      console.log('---vitals report payload-----', payload)
      // return
      this._shiftRep.dispatch(insertRefFn(payload));
      this.dialogRefs.close();
      this._commonService.setLoader(false);
      this.router.navigate(['/reports/vitalsreport']);

    } else {
      return;
    }

  }

  setTotalUserResidentInFac() {
    let rList = this.residentslist.length;
    let uList = this.userlist.length;
    let virusReportUserResdLength = { 'userLength': uList, 'residentLength': rList };
    sessionStorage.setItem('virusReportUserResdLength', JSON.stringify(virusReportUserResdLength));
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