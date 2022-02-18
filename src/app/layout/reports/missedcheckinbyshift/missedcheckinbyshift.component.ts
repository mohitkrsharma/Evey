import { Component, OnInit,ViewChild, HostListener, ElementRef, TemplateRef } from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import * as moment from 'moment-timezone';
import * as _ from 'underscore';
import { CommonService } from 'src/app/shared/services/common.service';
import { Subscription } from 'rxjs/Rx';
import { ExcelService } from '../../../shared/services/excel.service';
import { ChartType, Label, MultiDataSet, ChartDataSets, ChartOptions } from 'chart.js';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-missedcheckinbyshift',
  templateUrl: './missedcheckinbyshift.component.html',
  styleUrls: ['./missedcheckinbyshift.component.scss']
})
export class MissedcheckinbyshiftComponent implements OnInit {
  newDate1; newDate2;
  isPopUpOpen:Boolean=false
  missedcheckl1:any = {
    organization: '',
    facility: '',
    date: new Date(),
    shift: '',
    timezone:'',
    utc_offset:''
  };
  isexport: Boolean = false;
  faclist: any;
  organiz: any;
  LineChart = null;
  currentDate = moment();
  shiftArr;
  fullResultData: any = [];
  show = false;
  HTMLWidth
  HTMLHeight
  topLeftMargin
  PDFWidth
  PDFHeight
  canvasImageWidth
  canvasImageHeight
  totalPDFPages
  pdf
  configuration = {
    company: 'Matildacloud.com',
    image: 'JPG',
    fastCompression: 'FAST',
    extension: '.pdf'
  }
  textConfiguration = {
    bold: 'bold',
    normal: 'normal',
    italic: 'italic',

  }
  fonConfiguration = {
    fontStyle: 'helvetica',
    fontSize: '20',
  }
  displayedColumns = ['lastname', 'firstname', 'checkin', 'performer'];

  // chart option
  chartOptions = {
    maintainAspectRatio: false,
    cutoutPercentage: 75,
    elements: {
      arc: {
        borderWidth: 0
      }
    },
    tooltips: { enabled: false }
  };

  private Color2 = [
    {
      backgroundColor: [
        '#ef4036', '#5fac00',
      ]
    }
  ];

  chartType = ['doughnut'];
  public doughnutChartType2: ChartType = 'doughnut';

  private subscription: Subscription;
  data: any;
  username: string;

  constructor(
    private apiService: ApiService,
    private router: Router,
    public commonService: CommonService,
    private excelService: ExcelService,
    private exportAsService: ExportAsService,
    public dialog: MatDialog,
  ) { }
  @ViewChild('missedCheckIns', {static: true}) missedCheckIns: TemplateRef<any>;
  CareData: any;
  chartLabel = [];
  finalCareDataArr = [];
  noRecord = false;
  shiftData: any;
  shiftType;
  showShiftType;
  userList: any;
  tableShow = false;
  shiSearch='';
  dialogRefs;
  locmissed;
  localshift;
  public doc: any;
  public totalPagesExp = '{total_pages_count_string}';

  async ngOnInit() {
    if(!this.commonService.checkAllPrivilege('Reports')){
      this.router.navigate(['/']);
    }
    this.commonService.setLoader(true);
    this.currentDate.utc();
    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.missedcheckl1.organization = contentVal.org;
        this.missedcheckl1.facility = contentVal.fac;
        this.missedcheckl1.timezone = contentVal.timezone;
        this.missedcheckl1.utc_offset=contentVal.utc_offset
        //this.commonService.setLoader(false);
      }
    });

    this.data = JSON.parse(sessionStorage.getItem('authReducer'));
    //this.username = this.data.first_name + ', ' + this.data.last_name;
    this.username = this.capitalizeFirstLetter(this.data.last_name) + ', ' + this.capitalizeFirstLetter(this.data.first_name);
    const getSes=JSON.parse(localStorage.getItem('misspayload'));
    console.log(getSes);
    if(getSes !== null)
    {
        await this.Resubmit(getSes);
        console.log('-----schart date------',getSes.schartDate)
        this.locmissed=getSes.schartDate;
        this.localshift=getSes.localshift;
        console.log(this.locmissed);  
        if(this.localshift === 'All Shift') {
          this.localshift = 'All Shifts';
        }  
     }
    this.commonService.setLoader(false);
    if(getSes === null){
      this.router.navigate(['/reports']);
    }
    localStorage.removeItem('misspayload');

  }

  dateChange(ev) {
    this.missedcheckl1.shift = '';
  }
  convertToS(s){
    let utcDate = moment.utc(s)
		let tzdate = utcDate.clone().tz(this.missedcheckl1.timezone)

		return tzdate.format("HH:mm A")
  }
  convertEqTz(s){
    return moment(s).tz(this.missedcheckl1.timezone,true).valueOf()
  }
   async Resubmit(data) {
    this.fullResultData = [];
    this.show = false;
    this.tableShow = false;
    this.userList = [];
    this.commonService.setLoader(true);
    const action = { type: 'POST', target: 'reports/missed_checkin' };
    const result = await this.apiService.apiFn(action, data);
    if (result['data'] && result['data'].length > 0) {
      this.fullResultData = result['data'];
      this.fullResultData = this.fullResultData.filter((obj) => {
        if (obj.timeSolt) {
          return obj;
        }
      });
    }
    if (this.fullResultData.length > 0) {
      this.show = true;
      this.userList = this.fullResultData.reduce((obj, item) => {
        const arr1 = item.userCheckinCount.reduce((data, i) => {
          const index = obj.findIndex(name => name.username === i.username);
          if (index !== -1) {
            const oldhData = obj[index].hData;
            oldhData.push({ time: (item.timeSolt.sTime + 900000), count: i.totalcount });
            obj[index] = { username: obj[index].username, hData: oldhData, total: obj[index].total + i.totalcount };
          } else {
            data.push({
              username: i.username,
              hData: [{ time: (item.timeSolt.sTime + 900000), count: i.totalcount }],
              total: i.totalcount
            });
          }
          return data;
        }, []);
        obj.push(...arr1);
        return obj;
      }, []);
      if (this.userList && this.userList.length > 0) {
        this.tableShow = true;
      } else {
        this.tableShow = false;
      }
      this.commonService.setLoader(false);
      this.baseChartFunc();
    } else {
      this.fullResultData = [];
      this.show = true;
      this.commonService.setLoader(false);
    }
  }

  openMissedCheckIns(){
    this.missedcheckl1.shift='';
    this.missedcheckl1.date= new Date();
     //Pop Up Open 
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.missedCheckIns, dialogConfig);

    this.commonService.setLoader(true);
    this.currentDate.utc();
    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.missedcheckl1.organization = contentVal.org;
        this.missedcheckl1.facility = contentVal.fac;
        this.commonService.setLoader(false);
      }
    });

    this.data = JSON.parse(sessionStorage.getItem('authReducer'));
    //this.username = this.data.first_name + ', ' + this.data.last_name;
    this.username = this.capitalizeFirstLetter(this.data.last_name) + ', ' + this.capitalizeFirstLetter(this.data.first_name);
  }

  async submit(f,data) {
    if(f.valid){
      this.isPopUpOpen=true
      this.fullResultData = [];
      this.show = false;
      this.tableShow = false;
      this.userList = [];
      this.showShiftType = this.shiftType;
      this.shiftData=this.shiftData.map(e=>{
        return{
          sr:e.sr,
          sTime:this.convertEqTz(e.sTime),
          midTime:this.convertEqTz(e.midTime),
          eTime:this.convertEqTz(e.eTime),
        }
      })
      let schartDate, echartDate;
      if (this.shiftData) {
        const n = this.shiftData.length;
        schartDate = this.shiftData[0].sTime;
        echartDate = this.shiftData[n - 1].eTime;
      }
      this.commonService.setLoader(true);
      const action = { type: 'POST', target: 'reports/missed_checkin' };
      const payload = {
        'org': data.organization,
        'facId': data.facility,
        'shiftData': this.shiftData,
        'schartDate': schartDate,
        'echartDate': echartDate
      };
      console.log("this.shiftData--->", JSON.stringify(this.shiftData));
      const result = await this.apiService.apiFn(action, payload);
      if (result['data'] && result['data'].length > 0) {
        this.fullResultData = result['data'];
        this.fullResultData = this.fullResultData.filter((obj) => {
          if (obj.timeSolt) {
            return obj;
          }
        });
      }
      if (this.fullResultData.length > 0) {
        this.show = true;
        this.userList = this.fullResultData.reduce((obj, item) => {
          const arr1 = item.userCheckinCount.reduce((data, i) => {
            const index = obj.findIndex(name => name.username === i.username);
            if (index !== -1) {
              const oldhData = obj[index].hData;
              oldhData.push({ time: (item.timeSolt.sTime + 900000), count: i.totalcount });
              obj[index] = { username: obj[index].username, hData: oldhData, total: obj[index].total + i.totalcount };
            } else {
              data.push({
                username: i.username,
                hData: [{ time: (item.timeSolt.sTime + 900000), count: i.totalcount }],
                total: i.totalcount
              });
            }
            return data;
          }, []);
          obj.push(...arr1);
          return obj;
        }, []);
        if (this.userList && this.userList.length > 0) {
          this.tableShow = true;
        } else {
          this.tableShow = false;
        }
        this.commonService.setLoader(false);
        this.baseChartFunc();
      } else {
        this.fullResultData = [];
        this.show = true;
        this.commonService.setLoader(false);
      }
      this.dialogRefs.close();
      this.locmissed=null;
      this.localshift=null;
    }else{
      return
    }
  }

  cancel() {
    this.dialogRefs.close();
    this.missedcheckl1.date=new Date();
    this.missedcheckl1.shift='';
    //this.router.navigate(['/reports']);
  }

  async changeOrg(org) {
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { 'org_id': this.missedcheckl1.organization };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = await result['data'];
  }

  getuserTime(data, time) {
    const check = data.hData.find(t => t.time === time);
    if (check) {
      return check.count;
    }
    return '';
  }

  changeShift(shiftNo) {
    let hours;
    this.newDate1 = moment(this.missedcheckl1.date);
    if (shiftNo === 0) {
      hours = Array.from({ length: 12 }, (v, k) => k);
      this.shiftType = 'All Shifts';
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
      obj.push({ sr: item, sTime: sTime['_d'].getTime(), midTime: eTime['_d'].getTime(), eTime: timeEnd['_d'].getTime() });
      sTime = moment(sTime).add(2, 'hours');
      return obj;
    }, []);
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

  baseChartFunc() {
    const that = this;
    setTimeout(function () {
      that.fullResultData.map((value, itr) => {
        const chartName = 'doughnutChart' + itr;
        const doughnutChart2 = new Chart(chartName, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: value.checkinListresult.graphData,
              backgroundColor: ['#ef4036', '#32a53e']
            }]
          },
          options: that.chartOptions
        });
      });
    }, 1000);
  }

  onExportAsPDF(){
    var data = document.getElementById('contentToConvert');  
    html2canvas(data, {allowTaint: true,
      useCORS: true }).then(canvas => {
      canvas.getContext('2d');
      this.HTMLWidth = canvas.width;
      this.HTMLHeight = canvas.height;
      this.topLeftMargin = 50;
      this.PDFWidth = this.HTMLWidth + (this.topLeftMargin * 2);
      this.PDFHeight = (this.PDFWidth * 1.5) + (this.topLeftMargin * 2);
      this.canvasImageWidth = this.HTMLWidth;
      this.canvasImageHeight = this.HTMLHeight;
      this.totalPDFPages = Math.ceil(this.HTMLHeight / this.PDFHeight) - 1;  
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      this.pdf = new jsPDF('p', 'pt', [this.PDFWidth, this.PDFHeight])//new jsPDF(this.pdfConfiguration.orientation, this.pdfConfiguration.unit, this.pdfConfiguration.format);
      this.pdf.setFontSize(30);
      this.pdf.setFont(this.fonConfiguration.fontStyle, this.textConfiguration.bold);
      this.pdf.addImage(imgData, this.configuration.image, this.topLeftMargin, this.topLeftMargin, this.canvasImageWidth, this.canvasImageHeight);
      for (let i = 1; i <= this.totalPDFPages; i++) {
        this.pdf.addPage([this.PDFWidth, this.PDFHeight]);
        let margin = -(this.PDFHeight * i) + (this.topLeftMargin * 4);
        if (i > 1) {
          margin = margin + i * 8;
        }
        this.pdf.addImage(imgData, 'JPG', this.topLeftMargin, margin, this.canvasImageWidth, this.canvasImageHeight, 'FAST');
        this.pdf.setPage(i);
      }
      this.pdf.text(1, 40, "Missed Level 1 Check-in Report by Shift")
      this.pdf.save('Missed Level 1 Check-in Report by Shift');  
    }); 
  }

  downloadAll() {
    // getDateFromTimezone
    const onDate = this.locmissed !== null ? this.getDateFromTimezone(this.locmissed):this.getTimeZoneDateFromStringDate(this.missedcheckl1.date);
    // const onDate = this.locmissed !== null ? new Date(this.locmissed):new Date(this.missedcheckl1.date);
    const thisObj = this;
    const missedCheckinReport = thisObj.prepareForExportAll(onDate);
  }

  DisplayCurrentTime(sDate) {
    const date = new Date(sDate);
    let hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
    const am_pm = date.getHours() >= 12 ? 'PM' : 'AM';
    hours = (hours === 0) ? 12 : hours;
    const hours1 = hours < 10 ? '0' + hours : hours;
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    return hours1 + ':' + minutes + ' ' + am_pm;
  }

  columnNames_1 = [
    {
      id: 'Last_Name',
      value: 'Last Name',
      title: 'Last Name',
      name: 'Last Name',
      dataKey: 'Last_Name'
    },
    {
      id: 'First_Name',
      value: 'First Name',
      title: 'First Name',
      name: 'First Name',
      dataKey: 'First_Name'
    },
    {
      id: 'Check_In',
      value: 'Check-In',
      title: 'Check-In',
      name: 'Check-In',
      dataKey: 'Check_In'
    },
    {
      id: 'Performer',
      value: 'Performer',
      title: 'Performer',
      name: 'Performer',
      dataKey: 'Performer'
    },
  ];
  async prepareForExportAll(onDate) {
    const arr = [];
    const missedCheckinReport = [];

    this.doc = undefined;
    this.doc = new jsPDF();


    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.username}`, 20, 30);
    this.doc.text(`${moment(onDate).format('L')}`, 20, 34);
    this.doc.text(this.localshift!== null ?this.localshift: this.showShiftType, 20, 38);

    let blackSpace =  {
        'Last_Name': '',
        'First_Name': '',
        'Check_In': '',
        'Performer': '',
      };

    // if (this.tableShow) {
    //   let table1 = {
    //     'Missed Level 1 Check-in Report by Shift': 'Performer'
    //   };

    //   if (this.fullResultData.length > 0) {
    //     let _space = "";
    //     this.fullResultData.forEach((_col) => {
    //       table1[_space] = this.convertToS(_col.timeSolt.sTime + 900000);
    //       _space = _space + " ";

    //     })
    //     table1[_space] = "Total";

    //   }

    //   missedCheckinReport.push(table1);

    //   if (this.userList.length > 0) {
    //     this.userList.forEach((_rec) => {

    //       let table2 = {
    //         'Missed Level 1 Check-in Report by Shift': _rec.username
    //       };

    //       if (this.fullResultData.length > 0) {
    //         let _space = "";
    //         this.fullResultData.forEach((_col) => {
    //           table2[_space] = this.getuserTime(_rec, _col.timeSolt.sTime + 900000);
    //           _space = _space + " ";

    //         })
    //         table2[_space] = _rec.total;

    //       }

    //       missedCheckinReport.push(table2);
    //     })

    //   }



    //   missedCheckinReport.push(blackSpace);

    // }

    const userCountData = this.fullResultData;
    userCountData.forEach((item, inx) => {
      const table1Data = {
        'Last_Name': this.convertToS(item.timeSolt.sTime + 900000),
        'First_Name': '',
        'Check_In': '',
        'Performer': '',
      };

      if (inx > 0) {
        missedCheckinReport.push(blackSpace);
      }

      missedCheckinReport.push(table1Data);
      const dateCount = {
        'Last_Name': 'Check-in',
        'First_Name': item.checkinListresult.data.totalcount + '/' + item.checkinListresult.count,
        'Check_In': '',
        'Performer': '',
      };
      missedCheckinReport.push(dateCount);
      missedCheckinReport.push(blackSpace);

      if (item.missedcheckin.length > 0) {


        const userCountData1 = item.missedcheckin;
        userCountData1.forEach(_item => {
          const table1Data1 = {
            'Last_Name':this.capitalizeFirstLetter(_item.resident_last_name),
            'First_Name': this.capitalizeFirstLetter(_item.resident_first_name),
            'Check_In': (_item.check_in_time == 0) ? '-' : this.formatDate(_item.check_in_time),
            'Performer': _item.user_name,
          };
          missedCheckinReport.push(table1Data1);
        });
      }

    });

    await this.doc.autoTable(this.columnNames_1, (missedCheckinReport), {
      headerStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal'
      },
      // addPageContent: () => {
      //   // this.pageContent(false)
      // },
      startY: 42,
      margin: {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0.5,
        // halign: 'center',
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

    this.doc.save('Missed Level 1 Check-in Report by Shift');
    this.commonService.setLoader(false);

    // return missedCheckinReport;
  }

  getDateFromTimezone(date){
		let newDate = new Date(date).toLocaleString("en-US", {timeZone: this.missedcheckl1.timezone})
		return new  Date (newDate);
    }
    getTimeZoneDateFromStringDate(d){
      return moment(d).tz(this.missedcheckl1.timezone,true).format('L')
    }
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
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


