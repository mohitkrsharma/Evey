import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatSort, PageEvent } from '@angular/material';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Observable, Subscription } from 'rxjs/Rx';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as async from 'async';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-medication-view-report',
  templateUrl: './medication-view-report.component.html',
  styleUrls: ['./medication-view-report.component.scss']
})
export class MedicationViewReportComponent implements OnInit {

  timezone: any;
  utc_offset: any;
  private subscription: Subscription;
  private subscription1: Subscription;
  public queryData: any;
 

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
  public displayedColumns = [];
  public pageEvent: PageEvent;
  public dataSource =new MatTableDataSource();
  public isShow: boolean;
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
    // {
    //   id: 'doctor_name',
    //   value: 'Doctor',
    //   title: 'Doctor',
    //   name: 'doctor_name',
    //   dataKey: 'Doctor',
    //   sort: false,
    // },
    // {
    //   id: 'pharmacy_name',
    //   value: 'Pharmacy',
    //   title: 'Pharmacy',
    //   name: 'pharmacy_name',
    //   dataKey: 'Pharmacy',
    //   sort: false,
    // },
    {
      id: 'medication_duration',
      value: 'Duration',
      title: 'Duration',
      name: 'medication_duration',
      dataKey: 'Duration',
      sort: true,
    },
    {
      id: 'facility',
      value: 'Facility',
      title: 'Facility',
      name: 'facility',
      dataKey: 'Facility',
      sort: true,
    },
    {
      id: 'user',
      value: 'Staff',
      title: 'Staff',
      name: 'user',
      dataKey: 'Staff',
      sort: true,
    },
    {
      id: 'medication_schedule',
      value: 'Schedule',
      title: 'Schedule',
      name: 'medication_schedule',
      dataKey: 'Schedule',
      sort: true,
    },
    {
      id: 'ts_date_created',
      value: 'Performed Date',
      title: 'Performed Date',
      name: 'ts_date_created',
      dataKey: 'Performed Date',
      sort: true,
    },
    {
      id: 'care_notes',
      value: 'Notes',
      title: 'Notes',
      name: 'care_notes',
      dataKey: 'Notes',
      sort: false,
    },
  ];
  // dataSource;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  public pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    sort: { active: '', direction: 'asc' },
  };

  constructor(
    private router: Router,
    private _route: ActivatedRoute,
    private _apiService: ApiService,
    private _excelService: ExcelService,
    public _commonService: CommonService,
    public _aes256Service: Aes256Service
  ) { }

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
    this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
        }
      }
    );
    // this.subscription1 = this._commonService.medQueryData.subscribe((data: any) => {
    //   if (data) {
    //     this.queryData = data;
    //     console.log('this.queryData------>', this.queryData);
    //   }
    // });
    this.queryData = await this._aes256Service.decFnWithsalt(sessionStorage.getItem('medReportData'));
    // console.log('this.queryData------>', this.queryData);
    this._commonService.setLoader(true);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map((x) => x.id));
    this.getServerData(this.pagiPayload);
  }

  // create angular material table
  createTable(arr) {
    const tableArr = arr;
    // console.log('---table data----', tableArr);
    this.dataSource = new MatTableDataSource(tableArr);
  }

  // Get list of reports
  public async getMedReportDataFunction() {
    const action = { type: 'POST', target: 'reports/view_med_reports' };
    const payload = { medReportData: this.queryData, pagination: this.pagiPayload };
    let result = await this._apiService.apiFn(action, payload);
    // console.log('result----->', result);
    this.count = result['data'] && result['data']['count'] ? result['data']['count'] : 0;
    this._commonService.setLoader(false);
    if (result['data'] && result['data']['resp'].length) {
      result = result['data']['resp'].map((item) => {
        return {
          ...item,
          resident_name: item.residents ? `${item.residents.last_name ? item.residents.last_name : ''}, ${item.residents.first_name ? item.residents.first_name : ''}` : '',
          doctor_name: item.doctors && item.doctors.name ? item.doctors.name : '-',
          pharmacy_name: item.pharmacy && item.pharmacy.name ? item.pharmacy.name : '-',
          medication_duration: item.medicationDuration && item.medicationDuration.name ? item.medicationDuration.name : '-',
          medication_schedule: item.medicationSchedule && item.medicationSchedule.name ? item.medicationSchedule.name : '-',
          user: item.users ? `${item.users.last_name ? item.users.last_name : ''}, ${item.users.first_name ? item.users.first_name : ''}` : '',
          care_notes: item.care_notes ? item.care_notes : '--',
          ts_date_created: this.convertDateToFacilityTimezoneWise(Number(item.ts_date_created)),
          care_value: item.care_value ? item.care_value : '-',
          facility: item.facilityData && item.facilityData.fac_name ? item.facilityData['fac_name'] : '-',
        };
      });
      this.data = result;
      // console.log('this.data--->', this.data);
      this.exportData = result;
      this.createTable(this.data);
      this._commonService.setLoader(false);
    } else {
      this.recordMessage = 'No Data Found';
      this._commonService.setLoader(false);
    }
  }

  convertDateToFacilityTimezoneWise(start) {
    return new Date(start).toLocaleString('en-US', {timeZone: this.timezone});
  }

  // sort table data in asc or desc order
  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    // this._commonService.setLoader(true);
    this.pagiPayload.sort = {
      active: this.sort.active,
      direction: this.sort.direction,
    };
    console.log('this.pagiPayload.sort---->', this.pagiPayload.sort);
    this.getMedReportDataFunction();
  }

  async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.getMedReportDataFunction();
  }

  formatDate(ts_date_created) {
    if (ts_date_created) {
      return moment(ts_date_created).format('MMMM Do YYYY, HH:mm:ss');
    } else {
      return '';
    }
  }

  // Export PDF
  async exportContentData() {
    return new Promise(async (resolve) => {
      if (this.exportContentVal.length) {
        resolve(this.exportContentVal);
      } else {
        this.loaderexport = true;
        const actionCount = {
          type: 'POST',
          target: 'reports/export_med_count',
        };
        const payload = { medReportData: this.queryData };
        const resultCount = await this._apiService.apiFn(actionCount, payload);

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

        console.log('arrlen---->', medTrackcount, arrlen);
        const that = this;

        let resultAll = [];
        async.eachOfSeries(arrlen, async function (item, index, callback) {
            const action = { type: 'POST', target: 'reports/view_med_reports' };
            const payload = {
              medReportData: that.queryData,
              pagination: { pageIndex: item, pageSize: limit },
            };
            const result = await that._apiService.apiFn(action, payload);
            if (result['data'] && result['data']['resp'].length) {
              const data = result['data']['resp'];
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

  async onExportAsPDF() {
    let header = ['Resident', 'Duration', 'Facility', 'Staff', 'Schedule', 'Performed Date', 'Notes'];
    let dataArr = [];
    await this.exportContentData();
    const resultAll = this.exportContentVal;
    resultAll.forEach(item => {
      dataArr.push([
        item.residents ? `${item.residents.last_name ? item.residents.last_name : ''}, ${item.residents.first_name ? item.residents.first_name : ''}` : '',
        item.medicationDuration && item.medicationDuration.name ? item.medicationDuration.name : '-',
        item.facilityData && item.facilityData.fac_name ? item.facilityData['fac_name'] : '-',
        item.users ? `${item.users.last_name ? item.users.last_name : ''}, ${item.users.first_name ? item.users.first_name : ''}` : '',
        item.medication && item.medication.medication_schedule ? item.medication.medication_schedule : '-',
        this.convertDateToFacilityTimezoneWise(Number(item.ts_date_created)),
        item.care_notes ? item.care_notes : '-'
      ]);
    });
    let fontfamily = 'helvetica'
    let fontsize = 10;
    let x = 19.05;
    let y = 19.05;
    let doc = new jsPDF('p', 'mm', 'letter');
    doc.setFont(fontfamily, "normal");
    doc.setFontSize(16).setFont(fontfamily, 'bold');
    doc.text('Custom Med Report', x, y);
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
        doc.save('Custom Med Report');
  }

  pageContent(isHeader = undefined) {
    if (isHeader) {
    }
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
          resident_name: item.residents ? `${item.residents.last_name ? item.residents.last_name : ''}, ${item.residents.first_name ? item.residents.first_name : ''}` : '',
          doctor_name: item.doctors && item.doctors.name ? item.doctors.name : '-',
          pharmacy_name: item.pharmacy && item.pharmacy.name ? item.pharmacy.name : '-',
          medication_duration: item.medicationDuration && item.medicationDuration.name ? item.medicationDuration.name : '-',
          medication_schedule: item.medication && item.medication.medication_schedule ? item.medication.medication_schedule : '-',
          user: item.users ? `${item.users.last_name ? item.users.last_name : ''}, ${item.users.first_name ? item.users.first_name : ''}` : '',
          care_notes: item.care_notes ? item.care_notes : '--',
          ts_date_created: this.convertDateToFacilityTimezoneWise(Number(item.ts_date_created)),
          care_value: item.care_value ? item.care_value : '-',
          facility: item.facilityData && item.facilityData.fac_name ? item.facilityData['fac_name'] : '-',
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
        Facility: item.facility ? item.facility : '-',
        // 'Doctor Name': item.doctor_name ? item.doctor_name : '-',
        // 'Pharmacy Name': item.pharmacy_name ? item.pharmacy_name : '-',
        'Duration': item.medication_duration ? item.medication_duration : '-',
        'Schedule': item.medication_schedule ? item.medication_schedule : '-',
        'Care Value': item.care_value ? item.care_value : '-',
        Staff: item.user ? item.user : '-',
        'Performed Date': item.ts_date_created,
        Notes: item.care_notes ? item.care_notes : '-',
      });
    });
    this.loadervalue = 0;
    this.loaderbuffer = 2;
    this.loaderexport = false;
    return report;
  }

}
