import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MatTableDataSource, MatSort, PageEvent } from '@angular/material';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';

@Component({
  selector: 'app-carebyresident',
  templateUrl: './carebyresident.component.html',
  styleUrls: ['./carebyresident.component.scss']
})

export class CarebyresidentComponent implements OnInit {

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private excelService: ExcelService,
    private _commonService: CommonService,
    private router: Router
  ) { }

  range: Range = { fromDate: new Date(), toDate: new Date() };
  options: NgxDrpOptions;
  count;
  presets: Array<PresetItem> = [];
  start_date; end_date;
  displayedColumns = [];
  columnNames = [
    {
      id: 'care',
      value: 'Care',
      title: 'Care',
      name: 'care',
      dataKey: 'Care'
    }, {
      id: 'quantity',
      value: 'Quantity',
      title: 'Quantity',
      name: 'quantity',
      dataKey: 'Quantity'
    }
  ];
  dataSource;
  exportdata;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0
  };
  public doc: any;
  public totalPagesExp = '{total_pages_count_string}';

  ngOnInit() {
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    const today = new Date();
    // var fromMin = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    // var fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // var toMin = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // var toMax = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    this.setupPresets();
    this.options = {
      presets: this.presets,
      format: 'mediumDate',
      range: { fromDate: today, toDate: today },
      applyLabel: 'Submit'
    };
  }

  // helper function to create initial presets
  setupPresets() {
    const backDate = (numOfDays) => {
      const todayDate = new Date();
      return new Date(todayDate.setDate(todayDate.getDate() - numOfDays));
    };
    const today = new Date();
    const yesterday = backDate(1);
    const minus7 = backDate(6);
    const minus30 = backDate(29);
    const minus365 = backDate(365);

    // const currMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    // const currMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    this.presets = [
      { presetLabel: 'Yesterday', range: { fromDate: yesterday, toDate: yesterday } },
      { presetLabel: 'Last 7 Days', range: { fromDate: minus7, toDate: today } },
      { presetLabel: 'Last 30 Days', range: { fromDate: minus30, toDate: today } },
      { presetLabel: 'Last 365 Days', range: { fromDate: minus365, toDate: today } },
    ];
  }

  async submit(event) {
    if (event.pageIndex) {
      this.pagiPayload.previousPageIndex = event.previousPageIndex;
      this.pagiPayload.pageIndex = event.pageIndex;
      this.pagiPayload.pageSize = event.pageSize;
      this.pagiPayload.length = event.length;
    }
    const action = { type: 'GET', target: 'reports/carebyuse' };
    const payload = { 'start_date': this.start_date, 'end_date': this.end_date, pagination: this.pagiPayload };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data']['_report'].length) {
      this.count = result['data']['_count'];
      const data = result['data']['_report'];
      this.createTable(data);
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('No data found for this date');
      }
    }
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    this.dataSource.sort = this.sort;
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    this.range = range;
    this.start_date = this.range.fromDate.getTime();
    this.end_date = this.range.toDate.getTime();
    if (this.end_date < this.start_date) {
      this.toastr.error('End date should not be less than start date');
    }
  }

  async exportXlsx() {
    const action = {
      type: 'GET',
      target: 'reports/carebyuse/export'
    };
    const payload = { 'start_date': this.start_date, 'end_date': this.end_date };
    const result = await this.apiService.apiFn(action, payload);
    this.exportdata = result['data']['_report'];
    if (!this.exportdata.length) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('No data found for this date');
      }
    } else {
      const report = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(report, 'Careby_use_report');
    }
  }

  async exportPdf() {
    this._commonService.setLoader(true);
    // var outcome, perform;

    const action = {
      type: 'GET',
      target: 'reports/carebyuse/export'
    };
    const payload = { 'start_date': this.start_date, 'end_date': this.end_date };
    const result = await this.apiService.apiFn(action, payload);
    this.exportdata = result['data']['_report'];
    if (!this.exportdata.length) {
      this.toastr.error('No data found for this date');
    } else {
      const pdfdata = this.exportdata.map(it => {
        return {
          'Care': it.care,
          'Quantity': it.quantity
        };
      });
      this.doc = undefined;
      this.doc = new jsPDF('l', 'mm', 'a3');
      this.pageContent(true);
      this.doc.addPage();
      this.pageContent(false);
      // var doc = new jsPDF('p', 'pt');
      await this.doc.autoTable(this.columnNames, ((pdfdata.length) ? pdfdata : ['No visits tracked']), {
        headerStyles: {
          fillColor: 212,
          textColor: 20,
          halign: 'center',
          fontStyle: 'normal'
        },
        addPageContent: () => {
          this.pageContent(false);
        },
        startY: 20,
        margin: {
          top: 33,
          bottom: 20
        },
        styles: {
          overflow: 'linebreak',
          lineColor: [221, 221, 221],
          lineWidth: 0.3,
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          'Notes': {
            columnWidth: 120
          }
        },
        drawRow: (row, data) => {
          if (row.index === 0 && row.raw === 'No visits tracked') {
            this.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
            this.doc.autoTableText(row.raw, data.settings.margin.left + data.table.width / 2, row.y + row.height / 2, {
              halign: 'center',
              valign: 'middle'
            });
            return false;
          }
        }
      });
      this.doc.putTotalPages(this.totalPagesExp);
      this.doc.save('Custom Report');
      this._commonService.setLoader(false);
    }
  }

  prepareUsersForCSV() {
    const report = [];
    this.exportdata.forEach(item => {
      report.push({
        'Care': item.care ? item.care : '-',
        'Quantity': item.quantity ? item.quantity : '-',
      });
    });
    return report;
  }

  pageContent(isHeader = null) {
    if (isHeader) {
      // HEADER
      const pageHeight = (this.doc.internal.pageSize.height / 2.4);
      this.doc.setTextColor('#279ed5');
      this.doc.setFont('helvetica');
      this.doc.setFontType('normal');
      this.doc.setFontSize(24);
      this.doc.text(15, pageHeight - 20, 'Custom Report');
      this.doc.setFontSize(12);
    }
    // FOOTER
    let str = 'Page ' + this.doc.internal.getNumberOfPages();
    if (typeof this.doc.putTotalPages === 'function') {
      str = str + ' of ' + this.totalPagesExp;
    }
    this.doc.setFontSize(10);
    this.doc.setTextColor('#636c72');
    this.doc.text('Report Created by Evey.', 15, this.doc.internal.pageSize.height - 10);
    this.doc.text(str, this.doc.internal.pageSize.width + 25, this.doc.internal.pageSize.height - 10, null, null, 'right');
  }

  cancel() {
    this.router.navigate(['/reports']);
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

