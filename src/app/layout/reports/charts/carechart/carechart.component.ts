import { Component, OnInit,ViewChild, HostListener, ElementRef, TemplateRef } from '@angular/core';
import { ApiService } from './../../../../shared/services/api/api.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
// import * as moment from 'moment';
import * as moment from 'moment-timezone'
import * as asyncfunc from 'async';
import * as _ from 'underscore';
import { CommonService } from 'src/app/shared/services/common.service';
import { MatRadioChange } from '@angular/material';
import { MatTableDataSource } from '@angular/material';
import { Subscription } from 'rxjs/Rx';
import { ExcelService } from '../../../../shared/services/excel.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';

export interface PeriodicElement {
  careName: string;
  total: number;
}

@Component({
  selector: 'app-carechart',
  templateUrl: './carechart.component.html',
  styleUrls: ['./carechart.component.scss']
})
export class CarechartComponent implements OnInit {
  shiftsTimeUTC; shifteTimeUTC; shiftsMinute; shifteMinute; newDate1; newDate2;
  careChart:any = {
    organization: '',
    facility: '',
    cType: 1,
    date:  this.getCurrentDateFromTimezone(),
    startTime:  this.getCurrentDateFromTimezone(),
    shift: ''
  };
  isexport: Boolean = false;
  displayedColumns = ['care', 'total'];
  show = false;
  faclist: any;
  organiz: any;
  LineChart = null;
  currentDate = moment();
  shiftArr;
  tType;
  dialogRefs;
  label_shift=''
  label_date:any=''
  last_name=''
  first_name=''
  isPopUpOpen:Boolean=false

  private subscription: Subscription;
  timezone:any;
  utc_offset:any;
  formatString: string = 'HH:mm';
  userLocalTimeZone = moment.tz.guess();
  addPopupStartMin;
  maxDate = new Date();
  allShiftLabels = ['0-1', '1-2', '2-3','3-4','4-5','5-6','6-7','7-8','8-9','9-10','10-11','11-12','12-13','13-14','14-15','15-16','16-17','17-18','18-19','19-20','20-21','21-22','22-23','23-24'];
  shift1Labels = ['6-7','7-8','8-9','9-10','10-11','11-12','12-13','13-14'];
  shift2Labels = ['14-15','15-16','16-17','17-18','18-19','19-20','20-21','21-22'];
  shift3Labels = ['22-23','23-24','0-1', '1-2', '2-3','3-4','4-5','5-6'];
  labels: any[] = [];
  constructor(
    private apiService: ApiService,
    private router: Router,
    public commonService: CommonService,
    private excelService: ExcelService,
    public dialog: MatDialog,
  ) { }
   @ViewChild('careChartData', {static: true}) careChartData: TemplateRef<any>;
  chartdata: PeriodicElement[];
  exportData:any
  dataSource = new MatTableDataSource(this.chartdata);
  CareData: any;
  chartLabel = [];
  finalCareDataArr = [];
  noRecord = false;
  shiftData:any= {};
  shiftType;
  columnNames = [
    {
      id: 'date',
      value: 'Date',
      title: 'Date',
      name: 'date',
      dataKey: 'Date'
    }, {
      id: 'quantity',
      value: 'Quantity',
      title: 'Quantity',
      name: 'quantity',
      dataKey: 'Quantity'
    }
  ];
  colorArray = [
    '#ff4000', '#c900c9', '#c4c400', '#00c8ff',
    '#d49800', '#3366E6', '#80ff80', '#cf0000',
    '#29474d', '#416332', '#964848', '#576b94', '#48631e',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
  ];

  exportdata;
  public doc: any;
  public totalPagesExp = '{total_pages_count_string}';
  shiSearch='';

  async ngOnInit() {
    this.commonService.setLoader(true);
    // this.currentDate.utc();
    // this.tType = 1;
    // this.shiftArr = this.commonService.shiftTime();
    // this.careChart.date = (this.currentDate.subtract(1, 'days'))['_d'];

    // this.careChart.startTime = new Date();
    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.careChart.organization = contentVal.org;
        this.careChart.facility = contentVal.fac;
        this.careChart.timezone = contentVal.timezone;
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;
        const currentDate = moment().tz(this.timezone).format('LLLL');
        const startTimeToday = this.convertNext30MinuteInterval(currentDate);
        const endTimeToday = moment(startTimeToday).add(30, 'minutes').toDate();
        this.addPopupStartMin = startTimeToday;
        // this.commonService.setLoader(false);
      }
    });
    const user = JSON.parse(sessionStorage.getItem('authReducer'));

    this.last_name = user.last_name,
    this.first_name = user.first_name;
    const getSes = JSON.parse(localStorage.getItem('carechartpayload'));

    const label_data = getSes ? getSes.data : null;
    this.label_shift = label_data.shift ? label_data.shift : '';
    // console.log('getSes---->', getSes);
    // console.log('label_data---->', label_data);
     console.log(this.label_shift, this.label_date);
     if (getSes !== null) {
      if (label_data) {
        switch (label_data.shift) {
          case 0:
          this.label_shift = 'All Shifts';
            break;
          case 1:
          this.label_shift = '1st Shift (06:00 - 14:00)';
            break;
          case 2:
          this.label_shift = '2nd Shift (14:00 - 22:00)';
            break;
          case 3:
          this.label_shift = '3rd Shift (22:00 - 06:00)';
            break;
          default:
            break;
        }
      }

     this.label_date = label_data.date ? label_data.date : '';

      console.log('data', getSes);
      
        const data = getSes.data;
        // data.date=new Date(data.date)
        // data.startTime=new Date(data.startTime)
        const p = new Date(getSes.p);
        // this.reSubmit(data, p);
      this.getCareWithin(data);
    }
    this.commonService.setLoader(false);
    if (getSes === null) {
      this.router.navigate(['/reports']);
    }
    // localStorage.removeItem('carechartpayload');

  }
  onChange(mrChange: MatRadioChange) {
    this.commonService.setLoader(true);
    this.tType = mrChange.value;
  }

  convertNext30MinuteInterval(timeSelected) {
    const remainder = (moment().tz(this.timezone).minute() % 30) - 30;
    const dateTime = moment(timeSelected).tz(this.timezone).add(-remainder, 'minutes').toDate();
    return dateTime;
  }

  updateCareTimeChanged(careChart, event) {
    let timeendDisp;
    if(moment(event.value).tz(this.userLocalTimeZone).format('HH:mm') == moment().set({hour: 23, minute:45}).format('HH:mm')) {
      timeendDisp = moment(event.value).add(14, 'minutes').tz(this.userLocalTimeZone).format('YYYY-MM-DDTHH:mm');
    } else {
      timeendDisp = moment(event.value).add(15, 'minutes').tz(this.userLocalTimeZone).format('YYYY-MM-DDTHH:mm');
    }
    careChart.endTime = timeendDisp;
    careChart.startTime = event.value;
  }

   async reSubmit(data,p) {
    //  console.log('-------data date-----',data.date)
    if(this.tType==1){
      this.label_shift=''
    }
    //  console.log('----external dialog------',data,p)
    this.finalCareDataArr = [];
    this.chartLabel = [];
    this.chartdata = [];
    data.organization = this.careChart.organization;
    data.facility = this.careChart.facility;
    data.timezone=this.careChart.timezone

    let selectedDate = moment(data.startTime).tz(this.timezone,true)

    let compHour = selectedDate.hour()
    // console.log('s--------start time-------',data,data.startTime)
    //   let time = moment(data.startTime).tz(this.timezone);

    //   console.log('----external time------',time)
    //   let compHour = time.hour();

    //   let sHourUTC = time.hours();
    //   let sMinuteUTC = time.minutes();

    //   // convert Date into UTC
    //   let sDate = moment(p);
    //   let eDate:any = moment(p);
    //   if (data.tType === 1) {
    //     sDate.set({ hour: sHourUTC, minute: sMinuteUTC, second: 0, millisecond: 0 });
    //     compHour = sHourUTC;
    //   } else {
    //     sDate.set({ hour: data.shiftsTimeUTC, minute: data.shiftsMinute, second: 0, millisecond: 0 });
    //   }
    //   let utcsDate = sDate['_d'].getTime();

    //   if (data.tType === 1) {
    //     eDate = eDate.add(1, 'days');
    //     eDate.set({ hour: sHourUTC, minute: sMinuteUTC, second: 0, millisecond: 0 });
    //     compHour = sHourUTC;
    //   } else {
    //     eDate = sDate.add(8, 'hours');
    //   }
    //   eDate = eDate['_d'].getTime();
    //   if (data.tType === 1) {
    //     data.shiftData = null;
    //   }

    //   utcsDate  = moment(utcsDate).tz(this.timezone,true).valueOf()
    //   eDate = moment(eDate).tz(this.timezone,true).valueOf()

    //   if(data.shiftData){
    //     data.shiftData.shiftsTimeUTC = moment.tz(utcsDate,this.timezone).utc().hours()
    //     data.shiftData.shiftsMinute = moment.tz(utcsDate,this.timezone).utc().minutes()
    //     data.shiftData.shifteTimeUTC = moment.tz(eDate,this.timezone).utc().hours()
    //     data.shiftData.shifteMinute = moment.tz(eDate,this.timezone).utc().minutes()
    //   }

      //request start and end date for payload
      let schartDate = moment(data.date).tz(this.timezone,true)
      let echartDate = moment(data.date).add(8,'hours').tz(this.timezone,true)

      //Current date's hour and minute value UTC according to timezone
      let currentDateHourInUTC = moment(data.date).tz(this.timezone,true).utc().hour()
      let currentDateMinuteInUTC = moment(data.date).tz(this.timezone,true).utc().minute()

      /*if(data.tType === 1){
        schartDate = schartDate.clone().set({hour:selectedDate.hour(),minute:selectedDate.minutes(),second:0,millisecond:0})
        echartDate = schartDate.clone().add(1,'days')
      }else if(data.tType === 2){
        schartDate = schartDate.clone().set({hour:data.shiftsTimeUTC,minute:data.shiftsMinute,second:0,millisecond:0})
        echartDate = schartDate.clone().add(8,'hours')
      }*/

      //When report is generated shift wise
      if(data.shiftData){
        data.shiftData.shiftsTimeUTC = moment.tz(schartDate.valueOf(),this.timezone).utc().hours()
        data.shiftData.shiftsMinute = moment.tz(schartDate.valueOf(),this.timezone).utc().minutes()
        data.shiftData.shifteTimeUTC = moment.tz(echartDate.valueOf(),this.timezone).utc().hours()
        data.shiftData.shifteMinute = moment.tz(echartDate.valueOf(),this.timezone).utc().minutes()
      }

      const action = { type: 'POST', target: 'reports/chart_shift_report' };
      const payload = {
        'org': data.organization,
        'facId': data.facility,
        'schartDate': schartDate.valueOf(),
        'echartDate': echartDate.valueOf(),
        'hour': currentDateHourInUTC,
        'minute': currentDateMinuteInUTC,
        'shiftData': data.shiftData,
        'shiftType': data.shiftType
      };

      // const payload = {
      //   'org': data.organization,
      //   'facId': data.facility,
      //   'schartDate': utcsDate,
      //   'echartDate': eDate,
      //   'hour': sHourUTC,
      //   'minute': sMinuteUTC,
      //   'shiftData': data.shiftData,
      //   'shiftType': data.shiftType
      // };
      console.log('---payload external----',payload)
      const result = await this.apiService.apiFn(action, payload);
      console.log('result external',result)
      // this.CareData = result['data']['_report'];
      // this.exportData = this.CareData
      // // console.log('----care chart response data-----',this.CareData)

      // const thisObj = this;
      // if (this.CareData && this.CareData.length > 0) {
      //   asyncfunc.eachOfSeries(this.CareData, function (item, i, callback) {
      //     let row, arr1, arr2, final;

      //     console.log('---comp hour----',compHour)

      //     // console.log('---final result----',item.finalCareData)
      //     if (data.tType === 1) {

      //       item.finalCareData.map((e=>e.hour = thisObj.convertDateToFacilityTimezoneWise(e.hour)))

      //       row = _.sortBy(item.finalCareData, 'hour');
      //       arr1 = _.filter(row, (num) => { if (num.hour < compHour) { return num; } });
      //       arr2 = _.filter(row, (num) => { if (num.hour >= compHour) { return num; } });
      //       // console.log('----arr-----',arr1,arr2)
      //       final = [...arr1, ...arr2];
      //       item.finalCareData = final;
      //       const labelArr = final.map(x => {
      //         const d = moment();
      //         d.utc();
      //         d.set({ hour: x.hour, minute: 0, second: 0, millisecond: 0 });
      //         // d.local();
      //         const tzHr=moment(d).tz(data.timezone)
      //         const res = tzHr.hour();
      //         // const res = d.hour();
      //         return `${x.hour.toString()}-${(x.hour + 1).toString()}`;
      //       }
      //       );
      //       // console.log('---labelArr------',labelArr,data.shiftsTimeUTC)
      //       thisObj.chartLabel = labelArr;
      //     } else {
      //       if (data.shiftType !== 2) {
      //         final = _.sortBy(item.finalCareData, 'hour');
      //       } else {
      //         let final1, row;
      //         row = _.sortBy(item.finalCareData, 'hour');
      //         const array1 = _.filter(row, (num) => { if (num.hour < data.shiftsTimeUTC) { return num; } });
      //         const array2 = _.filter(row, (num) => { if (num.hour >= data.shiftsTimeUTC) { return num; } });
      //         final1 = [...array1, ...array2];
      //         final = final1;
      //       }
      //       const labelArr = final.map(x => {

      //         const d = moment();
      //         d.utc();
      //         d.set({ hour: x.hour, minute: 0, second: 0, millisecond: 0 });
      //         // d.local();
      //         const tzHr=moment(d).tz(data.timezone)
      //         const res = tzHr.hour();
      //         // const res = d.hour();
      //         return `${res.toString()}-${(res + 1).toString()}`;
      //       }
      //       );
      //       thisObj.chartLabel = labelArr;
      //     }
      //     const arrr = [];
      //     const tablearr = [];
      //     const obj = {
      //       'label': final[0].careName,
      //       'data': final.map(x => x.notime),
      //       'fill': false,
      //       'lineTension': 0.2,
      //       'borderColor': thisObj.colorArray[i],
      //       'borderWidth': 1.7
      //     };
      //     const tableData = {
      //       'careName': final[0].careName,
      //       'total': obj.data.reduce((x, y) => {
      //         return x + y;
      //       })
      //     };
      //     arrr.push(obj);
      //     tablearr.push(tableData);
      //     thisObj.chartdata = [...thisObj.chartdata, ...tablearr];
      //     thisObj.finalCareDataArr = [...thisObj.finalCareDataArr, ...arrr];
      //     callback(null, true);


      //   }, async function (err, result) {
      //     if (err) {

      //     } else {
      //       const name = '';
      //       await thisObj.showCahrt(thisObj.finalCareDataArr, thisObj.chartLabel, name, {
      //         xAxes: [{
      //           display: true,
      //           scaleLabel: {
      //             display: true,
      //             labelString: 'Time'
      //           }
      //         }],
      //         yAxes: [{
      //           display: true,
      //           scaleLabel: {
      //             display: true,
      //             labelString: 'Total Cares'
      //           }
      //         }]
      //       });
      //     }
      //   });
      //   this.show = true;
      //   this.commonService.setLoader(false);
      //   this.noRecord = true;
      // } else {
      //   const name = 'No Data Found';
      //   await thisObj.showCahrt([{
      //     'label': [],
      //     'data': [],
      //     'fill': false,
      //     'lineTension': 0,
      //     'borderColor': '#ffffff',
      //     'borderWidth': 0
      //   }], [], name, {
      //     xAxes: [{
      //       display: false,
      //       scaleLabel: {
      //         display: true,
      //         labelString: 'Cares'
      //       }
      //     }],
      //     yAxes: [{
      //       display: false,
      //       scaleLabel: {
      //         display: true,
      //         labelString: 'Value'
      //       }
      //     }]
      //   });
      //   // this.noRecord = false;
      //   this.show = false;
      //   this.commonService.setLoader(false);
      // }

  }

  // Model Of Care Chart Start
   openCarechart(){
    // Pop Up Open

    this.isPopUpOpen=true
    this.careChart.cType= 1;
    this.tType=1;
    this.careChart.shift='';
    this.currentDate=moment();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'repeatDialog';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.careChartData, dialogConfig);

     this.commonService.setLoader(true);
     this.currentDate.utc();
     this.tType = 1;
     const shiftarray = this.commonService.shiftTime();
     this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];
     this.careChart.date = this.getCurrentDateFromTimezone(); // (this.currentDate.subtract(1, 'days'))['_d'];
     this.careChart.startTime = this.getCurrentDateFromTimezone(); // new Date();
     this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.careChart.organization = contentVal.org;
        this.careChart.facility = contentVal.fac;
        this.careChart.timezone=contentVal.timezone;
        this.commonService.setLoader(false);
      }
    });
  }
  //Model Of Care Chart End

  async submit(f, data, p) {
    console.log('--------internal data----',data,this.timezone)
    if(f.valid){

    this.commonService.setLoader(true);
    this.CareData=''
    // console.log('---internal dialog---',data,p._validSelected)
    /*if(this.tType==1){
      this.label_shift=''
    }*/
    this.finalCareDataArr = [];
    this.chartLabel = [];
    this.chartdata = [];
    let vaild = f.form.status;
    data.organization = this.careChart.organization;
    data.facility = this.careChart.facility;
    data.timezone = this.careChart.timezone;
    if (data.organization === '' || data.facility === '' || (p._validSelected === null || p._validSelected === undefined || p._validSelected === '')) {
      vaild = 'INVALID';
    }
    if (vaild === 'VALID') {

      let selectedDate = moment(data.startTime).tz(this.timezone,true)

      let compHour = selectedDate.hour()
      console.log('---comp hpour internal----',compHour)
      let schartDate = moment(data.date).tz(this.timezone,true)
      let echartDate = moment(data.date).add(8,'hours').tz(this.timezone,true)

      //Current date's hour and minute value UTC according to timezone
      let currentDateHourInUTC = moment(data.date).tz(this.timezone,true).utc().hour()
      let currentDateMinuteInUTC = moment(data.date).tz(this.timezone,true).utc().minute()

      /*if(this.tType === 1){
        this.shiftData = null
        schartDate = schartDate.clone().set({hour:selectedDate.hour(),minute:selectedDate.minutes(),second:0,millisecond:0})
        echartDate = schartDate.clone().add(1,'days')
      }else if(this.tType === 2){

        schartDate = schartDate.clone().set({hour:this.shiftsTimeUTC,minute:this.shiftsMinute,second:0,millisecond:0})
        echartDate = schartDate.clone().add(8,'hours')
      }*/

      //When report is generated shift wise
      if(this.shiftData){
        this.shiftData.shiftsTimeUTC = moment.tz(schartDate.valueOf(),this.timezone).utc().hours()
        this.shiftData.shiftsMinute = moment.tz(schartDate.valueOf(),this.timezone).utc().minutes()
        this.shiftData.shifteTimeUTC = moment.tz(echartDate.valueOf(),this.timezone).utc().hours()
        this.shiftData.shifteMinute = moment.tz(echartDate.valueOf(),this.timezone).utc().minutes()
      }

      const action = { type: 'POST', target: 'reports/chart_shift_report' };
      const payload = {
        'org': data.organization,
        'facId': data.facility,
        'schartDate': schartDate.valueOf(),
        'echartDate': echartDate.valueOf(),
        'hour': currentDateHourInUTC,
        'minute': currentDateMinuteInUTC,
        'shiftData': this.shiftData,
        'shiftType': this.shiftType
      };
      console.log('---payload internal----',payload)
      const result = await this.apiService.apiFn(action, payload);
      // console.log('---result internal---',result)
      this.commonService.setLoader(false);
      this.CareData = result['data']['_report'];
      this.exportData = this.CareData
      const thisObj = this;
      if (this.CareData && this.CareData.length > 0) {
        asyncfunc.eachOfSeries(this.CareData, function (item, i, callback) {
          let row, arr1, arr2, final;
          if (thisObj.tType === 1) {
            item.finalCareData.map((e=>e.hour = thisObj.convertDateToFacilityTimezoneWise(e.hour)))
            row = _.sortBy(item.finalCareData, 'hour');
            arr1 = _.filter(row, (num) => { if (num.hour < compHour) { return num; } });
            arr2 = _.filter(row, (num) => { if (num.hour >= compHour) { return num; } });
            final = [...arr1, ...arr2];
            item.finalCareData = final;

            // console.log('---final internal-----',final)
            const labelArr = final.map(x => {
              const d = moment();
              d.utc();
              d.set({ hour: x.hour, minute: 0, second: 0, millisecond: 0 });
              // d.local();
              const tzHr=moment(d).tz(data.timezone)
              const res = tzHr.hour();
              // const res = d.hour();
              return `${x.hour.toString()}-${(x.hour + 1).toString()}`;
            }
            );
            // console.log('---label arr internal-----',labelArr,thisObj.shiftsTimeUTC)
            thisObj.chartLabel = labelArr;
          } else {
            if (thisObj.shiftType !== 2) {
              final = _.sortBy(item.finalCareData, 'hour');
            } else {
              let final1, row;
              row = _.sortBy(item.finalCareData, 'hour');
              const array1 = _.filter(row, (num) => { if (num.hour < thisObj.shiftsTimeUTC) { return num; } });
              const array2 = _.filter(row, (num) => { if (num.hour >= thisObj.shiftsTimeUTC) { return num; } });
              final1 = [...array1, ...array2];
              final = final1;
            }
            const labelArr = final.map(x => {

              const d = moment();
              d.utc();
              d.set({ hour: x.hour, minute: 0, second: 0, millisecond: 0 });
              // d.local();
              const tzHr=moment(d).tz(data.timezone)
              const res = tzHr.hour();
              // const res = d.hour();
              return `${res.toString()}-${(res + 1).toString()}`;
            }
            );

            thisObj.chartLabel = labelArr;
          }
          const arrr = [];
          const tablearr = [];
          const obj = {
            'label': final[0].careName,
            'data': final.map(x => x.notime),
            'fill': false,
            'lineTension': 0.2,
            'borderColor': thisObj.colorArray[i],
            'borderWidth': 1.7
          };
          const tableData = {
            'careName': final[0].careName,
            'total': obj.data.reduce((x, y) => {
              return x + y;
            })
          };
          arrr.push(obj);
          tablearr.push(tableData);
          thisObj.chartdata = [...thisObj.chartdata, ...tablearr];
          thisObj.finalCareDataArr = [...thisObj.finalCareDataArr, ...arrr];
          callback(null, true);


        }, async function (err, result) {
          if (err) {

          } else {
            const name = '';
            await thisObj.showCahrt(thisObj.finalCareDataArr, thisObj.chartLabel, name, {
              xAxes: [{
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: 'Time'
                }
              }],
              yAxes: [{
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: 'Total Cares'
                }
              }]
            });
          }
        });
        this.show = true;
        this.commonService.setLoader(false);
        this.noRecord = true;
      } else {
        const name = 'No Data Found';
        await thisObj.showCahrt([{
          'label': [],
          'data': [],
          'fill': false,
          'lineTension': 0,
          'borderColor': '#ffffff',
          'borderWidth': 0
        }], [], name, {
          xAxes: [{
            display: false,
            scaleLabel: {
              display: true,
              labelString: 'Cares'
            }
          }],
          yAxes: [{
            display: false,
            scaleLabel: {
              display: true,
              labelString: 'Value'
            }
          }]
        });
        // this.noRecord = false;
        this.show = false;
        this.commonService.setLoader(false);
      }
    }
     this.dialogRefs.close();
    }else{
      return
    }
  }

  showCahrt(data, cLabel, name, res) {
    if (data && data.length > 0) {
      if (this.LineChart != null) {
        this.LineChart.destroy();
      }
      var canvas = <HTMLCanvasElement>document.getElementById('lineChart');
      var ctx = canvas.getContext('2d');

      this.LineChart = new Chart(ctx, {

        type: 'line',
        data: {
          labels: cLabel,
          datasets: data
        },
        options: {
          responsive: true,
          title: {
            text: name,
            display: true
          },
          scales: res
        }
      });
      if (this.chartdata && this.chartdata.length > 0) {
        this.isexport = true;
      } else {
        this.isexport = false;
      }
      this.dataSource = new MatTableDataSource(this.chartdata);

      if (name === 'No Data Found') {
        this.noRecord = false;
      }
    } else {
      this.noRecord = false;
    }
  }
  cancel() {
    this.careChart.shift='';
    this.careChart.cType= 1;
    this.careChart.date=this.getCurrentDateFromTimezone();
    this.careChart.startTime= this.getCurrentDateFromTimezone();
    this.currentDate=moment();
    this.dialogRefs.close();
    //this.router.navigate(['/reports']);
  }
  async changeOrg(org) {
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { 'org_id': this.careChart.organization };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = await result['data'];
  }
  async changeFac(fac) {

  }
  async changeCType(t) {
    if (t == 2) {
      this.careChart.shift = "";
    } else {
      this.careChart.startTime = this.getCurrentDateFromTimezone();
      // this.label_shift=''
    }
    this.tType = t;
  }
  changeShift(shiftNo) {
    this.newDate1 =  moment.tz(this.timezone)
    this.newDate2 = moment.tz(this.timezone)
    // this.newDate1 = moment();
    // this.newDate2 = moment();
    if (shiftNo === 0) {
      this.shiftType = 0;
      this.label_shift = 'All Shifts';
      this.newDate1.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 23, minute: 59, second: 0, millisecond: 0 });
    } else if (shiftNo === 1) {
      this.label_shift = "1st Shift (06:00 - 14:00)"
      this.shiftType = 1;
      this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      console.log(this.newDate1.valueOf(), this.newDate2.valueOf())
    } else if (shiftNo === 2) {
      this.label_shift="2nd Shift (14:00 - 22:00)"
      this.shiftType = 2;
      this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    } else if (shiftNo === 3) {
      this.label_shift="3rd Shift (22:00 - 06:00)"
      this.shiftType = 3;
      this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
      this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
    }
    this.shiftsTimeUTC = this.newDate1.hours();
    this.shifteTimeUTC = this.newDate2.hours();
    this.shiftsMinute = this.newDate1.minutes();
    this.shifteMinute = this.newDate2.minutes();
    this.shiftData = {
      'shiftsTimeUTC': this.newDate1.utc().hours(),
      'shifteTimeUTC': this.newDate2.utc().hours(),
      'shiftsMinute': this.newDate1.utc().minutes(),
      'shifteMinute': this.newDate2.utc().minutes()
    };
  }
  excelExport() {
    if (this.exportData && this.exportData.length > 0) {
      console.log('----chart data-----',this.exportData)
      this.exceldownload(this.exportData);
    }
  }

  columnNames_1 = [
    {
      id: 'Care',
      value: 'Care',
      title: 'Care',
      name: 'Care',
      dataKey: 'Care'
    },
    {
      id: 'Performer',
      value: 'Performer',
      title: 'Performer',
      name: 'Performer',
      dataKey: 'Performer'
    },
    {
      id: 'Resident',
      value: 'Resident',
      title: 'Resident',
      name: 'Resident',
      dataKey: 'Resident'
    },
    {
      id: 'Time',
      value: 'Time',
      title: 'Time',
      name: 'Time',
      dataKey: 'Time'
    },
  ];

  async exceldownload(data) {
    let excelData = []

    this.doc = undefined;
    this.doc = new jsPDF();

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);

    this.doc.text('Care Volume by Shift', 20, 20);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.last_name}, ${this.first_name}`, 20, 30);
    if (this.label_date) {
      this.doc.text(!this.isPopUpOpen?this.getTimeZoneDateFromStringDate(this.label_date):this.getTimeZoneDateFromStringDate(this.careChart.date), 20, 34);
    }
    this.doc.text(`${this.label_shift}`, 20, 38);

    // data.forEach(element => {

    //   element.finalCareData.forEach(e=>{

    //     if(e.notime==1){
    //       console.log('----here-----')
    //       let data = {
    //         "Care":e.careName,// + this.userName,
    //         "Performer":e.user_name,
    //         "Resident": e.resident_name,
    //         "Time":this.convertDateFromUtc(e.date)
    //       }

    //       excelData.push(data)
    //     }

    //   })
    // });
    data.forEach(el => {
      el.result.forEach(childEl => {
        let data = {
          "Care": childEl.careName,
          "Performer": childEl.user_name,
          "Resident": childEl.resident_name,
          "Time": this.convertDateFromUtc(childEl.date)
        };
        excelData.push(data);
      });
    });

    await this.doc.autoTable(this.columnNames_1, (excelData), {
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20
      },
      styles: {
        overflow: 'linebreak',
        lineWidth: 0.5,
        valign: 'middle'
      },
      theme: "plain",
      columnStyles: {
        'Notes': {
          columnWidth: 120
        }
      },
      drawRow: (row, data) => {
        if (row.index === 0 && row.raw == 'No visits tracked') {
          this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
          this.doc.autoTableText(row.raw, data.settings.margin.left + data.table.width / 2, row.y + row.height / 2, {
            halign: 'center',
            valign: 'middle'
          });
          return false;
        }
      }
    });

    this.doc.save('Care Volume by Shift');
    this.commonService.setLoader(false);
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }

  getCurrentDateFromTimezone(){
    let newDate = new Date().toLocaleString("en-US", {timeZone: this.timezone})
    return new  Date (newDate);
  }

  convertDateToFacilityTimezoneWise(start){

		let utcDate = moment.utc().set({hour:start})
    let tzdate = utcDate.clone().tz(this.timezone).hour()
    return tzdate
  }
  convertDateFromUtc(start){
		let utcDate = moment.utc(start)
		let tzdate = utcDate.clone().tz(this.timezone)

		return tzdate.format("MMMM Do YYYY, HH:mm:ss")
	}
  getTimeZoneDateFromStringDate(d){
    return moment(d).tz(this.timezone,true).format('L')
  }

  async onRunAnother(f, data, p){
    if(f.valid){
      console.log('date ---->>',data.date);
      let startDate = moment(data.date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).valueOf();
      let endDate = moment(data.date).set({ hour: 23, minute: 59, second: 0, millisecond: 0 }).valueOf();
      const action = { type: 'POST', target: 'reports/chart_shift_report' };
      const payload = {
        "org": data.organization,
        "facId": data.facility,
        "startDate": startDate,
        "endDate": endDate,
        "shiftsTimeUTC": this.shiftsTimeUTC,
        "shifteTimeUTC": this.shifteTimeUTC,
        "shift": data.shift,
        "shiftType": this.shiftType,
        "shiftsMinute": this.shiftsMinute,
        "shifteMinute": this.shifteMinute
      };
      console.log('payload --->>', payload);
      const result = await this.apiService.apiFn(action,payload);
      console.log('result ---->>', result);
      this.isexport = true;
      this.exportData = result['data']['result'];
      if(data.shift === 1){
        this.labels = this.shift1Labels;
      } else if(data.shift === 2){
        this.labels = this.shift2Labels;
      } else if(data.shift === 3){
        this.labels = this.shift3Labels;
      } else {
        this.labels = this.allShiftLabels;
      }
      this.dialogRefs.close();
      this.prepareDatasets(result['data'].result)
    }
  }

  async drawLineChart(chartdata){
    console.log('drawchart called ==>>',chartdata);
    console.log('labels ===>>', this.labels);
    if (this.LineChart != null) {
      this.LineChart.destroy();
    }
    this.noRecord = true;    
    var canvas = <HTMLCanvasElement>document.getElementById('lineChart');
    var ctx = canvas.getContext('2d');
    this.LineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: chartdata
      },
      options: {
        scales: {
          xAxes: [{
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
              padding: 15,
              stepSize: 1
            }
          }]
        },
        tooltips: {
          titleFontSize: 14,
          titleFontFamily: 'SFProText-Regular',
          bodyFontSize: 14,
          bodyFontFamily: 'SFProText-Regular',
          displayColors: true,
          callbacks: {
            title: function(tooltipItem, data) {              
              var title = data.datasets[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].x;
              return title;
            }
        }
        },
      }
    })
  }

  prepareDatasets(resultArr){
    let labelsArr = resultArr.map((el) => {
      let carename = el._id;
      let newArr = [];
      el.result.forEach(resultEl => {
        let index = newArr.findIndex(childEl => childEl.hour === resultEl.hour);
        if(index == -1){
          newArr.push({hour: resultEl.hour, total: resultEl.total})
        }
      });
      newArr.sort((a,b) => a.hour - b.hour);
      return { careName: carename, arr: newArr };
    });
    labelsArr.sort((a,b) => a.careName - b.careName);
    labelsArr.forEach(el => {
      let initialVal = 0;
      let sum = el.arr.reduce((prev,current) => prev + current.total,initialVal);
      this.dataSource.data.push({careName: el.careName, total: sum});
    })
    let datasets = [];
    labelsArr.forEach((el, index) => {
      let label = el.careName;
      let data = this.getChartdata(el.arr);
      datasets.push({
        'label': label,
        'data': data,
        'fill': false,
        'lineTension': 0.2,
        'borderColor': this.colorArray[index],
        'borderWidth': 1.7
      })
    });
    
    this.drawLineChart(datasets);
  }

  getChartdata(careArr){
    let resArr = [];
    careArr.forEach(el => {
      resArr.push({x: `${el.hour}-${el.hour + 1}`, y: el.total});
    })
    return resArr;
  }

  async getCareWithin(carePayload){
    let startDate = moment(carePayload.date).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).valueOf();
    let endDate = moment(carePayload.date).set({ hour: 23, minute: 59, second: 0, millisecond: 0 }).valueOf();
    const action = { type: 'POST', target: 'reports/chart_shift_report' };
    const payload = {
      "org": carePayload.organization,
      "facId": carePayload.facility,
      "startDate": startDate,
      "endDate": endDate,
      "shiftsTimeUTC": carePayload.shiftsTimeUTC,
      "shifteTimeUTC": carePayload.shifteTimeUTC,
      "shift": carePayload.shift,
      "shiftType": carePayload.shiftType,
      "shiftsMinute": carePayload.shiftsMinute,
      "shifteMinute": carePayload.shifteMinute
    }
    const result = await this.apiService.apiFn(action,payload);
    if(result && result['status']){
      this.isexport = true;
      this.exportData = result['data']['result'];
      if(carePayload.shift === 1){
        this.labels = this.shift1Labels;
      } else if(carePayload.shift === 2){
        this.labels = this.shift2Labels;
      } else if(carePayload.shift === 3){
        this.labels = this.shift3Labels;
      } else {
        this.labels = this.allShiftLabels;
      }
      this.prepareDatasets(result['data'].result)
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

//main submit button

      /*this.commonService.setLoader(true);
      let time = moment(data.startTime);
      // console.log('----internal time------',time)
      let compHour = time.hour();

      let sHourUTC = time.hours();
      let sMinuteUTC = time.minutes();

      // convert Date into UTC
      let sDate = moment(p._validSelected);
      let eDate = moment(p._validSelected);
      if (this.tType === 1) {
        sDate.set({ hour: sHourUTC, minute: sMinuteUTC, second: 0, millisecond: 0 });
        compHour = sHourUTC;
      } else {
        sDate.set({ hour: this.shiftsTimeUTC, minute: this.shiftsMinute, second: 0, millisecond: 0 });
      }
      let utcsDate = sDate['_d'].getTime();

      if (this.tType === 1) {
        eDate = eDate.add(1, 'days');
        eDate.set({ hour: sHourUTC, minute: sMinuteUTC, second: 0, millisecond: 0 });
        compHour = sHourUTC;
      } else {
        eDate = sDate.add(8, 'hours');
      }
      eDate = eDate['_d'].getTime();
      if (this.tType === 1) {
        this.shiftData = null;
      }*/
