import { Component, OnInit, ViewChild, HostListener, TemplateRef, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatSort, PageEvent, MatDialogConfig, MatDialog, Sort } from '@angular/material';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Observable, Subscription } from 'rxjs/Rx';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as async from 'async';
import { ApiService } from '../../../shared/services/api/api.service';
import { ExcelService } from '../../../shared/services/excel.service';
import { CommonService } from '../../../shared/services/common.service';
import { Aes256Service } from '../../../shared/services/aes-256/aes-256.service';
import { DNRReportComponent } from '../dnr-report/dnr-report.component';

@Component({
  selector: 'app-dnr-view-report',
  templateUrl: './dnr-view-report.component.html',
  styleUrls: ['./dnr-view-report.component.scss']
})
export class DnrViewReportComponent implements OnInit {

  timezone: any;
  utc_offset: any;
  private subscription: Subscription;
  private subscription1: Subscription;
  public queryData: any;
  dialogRefs;
  dialogConfig = new MatDialogConfig();
  @Output() viewChange: EventEmitter<string> = new EventEmitter();

  public recordMessage: string;
  public loaderexport = false;
  public loadervalue = 0;
  public loaderbuffer = 2;
  public count: any;
  public doc: any;
  public result: any;
  public reportData;
  public exportData;
  public exportContentVal = [];
  public displayedColumns = ['residentName', 'unit', 'admitDate'];
  public pageEvent: PageEvent;
  public dataSource = new MatTableDataSource();
  @ViewChild('dnrReport', { static: false }) dnrReport: TemplateRef<any>;
  dnrreport = {
    organization: '',
    facility: '',
    date: new Date()
  };
  public isShow: boolean;
  sortedData: any[];
  public topPosToStartShowing = 100;
  public totalPagesExp = '{total_pages_count_string}';
  public sortActive = 'name';
  public sortDirection: 'asc' | 'desc' | '';
  public data;
  public inculdeA = {
    isCallLight: 'CL',
    isNotify: 'N',
    is_out_of_fac: 'O',
    isFind: 'F',
    isNFC: 'NF',
    is_virus_care: 'VC',
  };

  // Column names in table
  public columnNames = [
    {
      id: 'resident_name',
      value: 'Resident',
      title: 'Resident',
      name: 'resident_name',
      dataKey: 'Resident',
      sort: false,
    },
    {
      id: 'unit',
      value: 'Unit',
      title: 'Unit',
      name: 'unit',
      dataKey: 'Unit',
      sort: true,
    },
    {
      id: 'admit_date',
      value: 'Admit Date',
      title: 'Admit Date',
      name: 'admitDate',
      dataKey: 'AdmitDate',
      sort: true,
    }
  ];

  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private router: Router,
    private _route: ActivatedRoute,
    private _apiService: ApiService,
    private _excelService: ExcelService,
    public _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public commonService: CommonService
  ) { 
    this.commonService.dnrQueryContent.subscribe(res => {
      this.queryData = JSON.parse(res);
      this.getReportData();
    })
  }

  @HostListener('window:scroll')
  checkScroll() {
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  // TODO: Cross browsing
  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  async ngOnInit() {
    let data = await this._aes256Service.decFnWithsalt(sessionStorage.getItem('dnrReportData'))
    if(!this.queryData && data) {
      this.queryData = data;
      setTimeout(() => {
      this.getReportData();
      }, 200);
    }
  
  }

  async getData(){
    const action = { type: 'POST', target: 'reports/view_dnr_reports' };
    const payload = this.queryData;
    let result = await this._apiService.apiFn(action, payload);
    this.count = result['data'] ? result['data'].length : 0;
    this.commonService.setLoader(false);
    if(result['data']){
      console.log(result);
      result = result['data'].map((item) => {
        return {
          ...item,
          residentName: item.last_name ? `${item.last_name ? item.last_name : ''}, ${item.first_name ? item.first_name : ''}` : '',
          unit: item.unit ? item.unit : '- -',
          admitDate: moment(item.admit_date).tz(this.timezone, true).format("MMMM Do YYYY")
        };
      });
      this.data = result;
      this.exportData = result;
      this.dataSource = new MatTableDataSource(this.data);
      this.dataSource.sort = this.sort;
    }
  }

  async getReportData() {
    this.commonService.setLoader(true);
    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.timezone = contentVal.timezone;
        this.utc_offset = contentVal.utc_offset;
      }
    });
    this.getData()
  }

  openDNRReport() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '400px';
    dialogConfig.panelClass = 'Shiftreportclass';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(DNRReportComponent, dialogConfig);
    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.dnrreport.organization = contentVal.org;
        this.dnrreport.facility = contentVal.fac;
        this.commonService.setLoader(false);
      }
    });
  }

  async exportExcel() {
    this.commonService.setLoader(true);
    const that = this;
    await that.exportContentData();
    const resultAll = that.exportContentVal;
    if (resultAll.length) {
      that.loadervalue = 0;
      that.loaderbuffer = 2;
      that.loaderexport = false;
      const activity = await this.prepareUsersForCSV();
      this._excelService.exportAsExcelFile(activity, 'Dnr_Report');
    }
    this.commonService.setLoader(false);
  }

  ngAfterViewInit(){
    this.dataSource.sort = this.sort;
  }

  // Export PDF
  async exportContentData() {
    return new Promise(async (resolve) => {
      if (this.exportContentVal.length) {
        resolve(this.exportContentVal);
      } else {
        this.loaderexport = true;
        const action = {
          type: 'POST',
          target: 'reports/view_dnr_reports',
        };
        const payload = this.queryData;
        const resultCount = await this._apiService.apiFn(action, payload);

        let decExist = 0;
        const limit = 2500;
        const medTrackcount = resultCount['data'];

        const no = medTrackcount <= limit ? 1 : medTrackcount / limit;
        if (medTrackcount % limit !== 0 && medTrackcount > limit) {
          decExist = 1;
        }
        let arrlen;
        if (decExist === 1) {
          arrlen =
          medTrackcount.length <= limit ? [1] : Array.from({ length: no + 1 }, (v, k) => k);
        } else {
          arrlen = medTrackcount.length <= limit ? [1] : Array.from({ length: no }, (v, k) => k);
        }
        const that = this;

        let resultAll = [];
        async.eachOfSeries(arrlen, async function (item, index, callback) {
            const action = { type: 'POST', target: 'reports/view_dnr_reports' };
            const payload = that.queryData;
            const result = await that._apiService.apiFn(action, payload);
            if (result['data'] && result['data'].length) {
              const data = result['data'];
              resultAll = [...resultAll, ...data];
            }
            const totalItem = arrlen.length;
            that.loadervalue = (item / totalItem) * 100;
            that.loaderbuffer = that.loadervalue + 2;

            callback(null, result);
          },
          async function (result) {
            that.exportContentVal = resultAll;
            resolve(that.exportContentVal);
          }
        );
      }
    });
  }

  // Export PDF
  async onExportAsPDF() {
    let header = ['Resident Name', 'Unit', 'Admit Date'];
    let dataArr = [];
    this.exportData.forEach(el => {
      dataArr.push([
        el.last_name ? `${el.last_name ? el.last_name : ''}, ${el.first_name ? el.first_name : ''}` : '',
        el.unit,
        el.admit_date ? moment(el.admit_date).tz(this.timezone, true).format("MMMM Do YYYY") : '-',
      ]);
    });
    let fontfamily = 'helvetica'
    let fontsize = 10;
    let x = 19.05;
    let y = 19.05;
    let doc = new jsPDF('p', 'mm', 'letter');
    doc.setFont(fontfamily, "normal");
    doc.setFontSize(16).setFont(fontfamily, 'bold');
    doc.text('DNR Report', x, y);
    doc.setFontSize(fontsize).setFont(fontfamily, "normal");
    y = y + 3;
      let data = dataArr;
      doc.setFontSize(12).setFont(fontfamily, 'bold')
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
        doc.save('DNR-Report');
  }
  pageContent(isHeader = undefined) {
    if (isHeader) {
    }
    // FOOTER
    let str = 'Page ' + this.doc.internal.getNumberOfPages();
    if (typeof this.doc.putTotalPages === 'function') {
      str = str + ' of ' + this.totalPagesExp;
    }
    this.doc.setFontSize(10);
    this.doc.setTextColor('#636c72');

    this.doc.text(
      'Report Created by Evey.',
      15,
      this.doc.internal.pageSize.height - 10
    );
    this.doc.text(
      str,
      this.doc.internal.pageSize.width + 25,
      this.doc.internal.pageSize.height - 10,
      null,
      null,
      'right'
    );
  }

  // export excel report
  async exportXlsx() {

    await this.exportContentData();
    const resultAll = this.exportContentVal;

    if (resultAll) {
      const data = resultAll.map((item) => {
        return {
          ...item,
          resident_name: item.last_name ? `${item.last_name ? item.last_name : ''}, ${item.first_name ? item.first_name : ''}` : '',
          admit_date: moment(item.admit_date).tz(this.timezone, true).format("MMMM Do YYYY"),
          unit: item.unit
        };
      });
      this.exportData = data;
      const report = this.prepareUsersForCSV();
      this._excelService.exportAsExcelFile(report, 'Report');
    }
  }

  // prepare csv data to be generated
  prepareUsersForCSV() {
    const report = [];
    this.exportData.forEach((item) => {
      report.push({
        Resident: item.resident_name ? item.resident_name : '-',
        Unit: item.unit ? item.unit : '-',
        'Admit Date': item.admit_date ? item.admit_date : '-',
      });
    });
    this.loadervalue = 0;
    this.loaderbuffer = 2;
    this.loaderexport = false;
    return report;
  }

}
