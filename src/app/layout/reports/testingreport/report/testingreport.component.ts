//Libs import
import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource, MatSort, PageEvent } from "@angular/material";
import { Router } from "@angular/router";
import * as _ from "underscore";
import * as moment from "moment-timezone";
import { Subscription } from "rxjs/Rx";
import * as async from 'async';
//Services
import { ApiService } from "src/app/shared/services/api/api.service";
import { CommonService } from "src/app/shared/services/common.service";
import { ExcelService } from "src/app/shared/services/excel.service";
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: "app-testingreport",
  templateUrl: "./testingreport.component.html",
  styleUrls: ["./testingreport.component.scss"],
})
export class TestingreportComponent implements OnInit {
  columnNames = [
    {
      id: "resident_name",
      value: "Resident Name",
      // sort: true
    },
    {
      id: "performer",
      value: "Performer",
      // sort: true
    },
    {
      id: "result",
      value: "Testing Result",
      // sort: true
    },
    {
      id: "time",
      value: "Time",
      // sort: true
    },

  ];

  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
  };

  private subscription: Subscription;
  timezone: any;
  utc_offset: any;
  data;
  userName;
  shiftNo;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  start_date;
  end_date;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  residentList;
  selectShift;
  count;
  resultcount;
  dataSource;
  testingData;
  exportdata;
  public exportContentVal = [];
  public loaderexport = false;
  public queryData: any;
  public loadervalue = 0;
  public loaderbuffer = 2;
  doc: any
  constructor(
    private apiService: ApiService,
    public commonService: CommonService,
    private router: Router,
    private excelService: ExcelService
  ) { }

  ngOnInit() {
    this.subscription = this.commonService.contentdata.subscribe(
      (contentVal: any) => {
        console.log(contentVal);
        if (contentVal.org && contentVal.fac) {
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
        }
      }
    );

    this.data = JSON.parse(sessionStorage.getItem("testingReportData"));
    // this.displayedColumns = this.displayedColumns.concat(["checkbox"]);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.getServerData(this.pagiPayload);
  }
  async loadReport() {
    this.commonService.setLoader(true);

    const action = { type: "POST", target: "reports/testing_report" };
    const payload = this.data;
    payload.pageSize = this.pagiPayload.pageSize
    payload.pageIndex = this.pagiPayload.pageIndex
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['count'];
    console.log("payload of data load", payload);
    console.log("---result data---", result, this.count);

    this.residentList = result["data"]["reports"];
    if (this.shiftNo === 0) {
      this.selectShift = "All Shifts";
    } else if (this.shiftNo === 1) {
      this.selectShift = "1st Shift (6:00am - 2:00pm)";
    } else if (this.shiftNo === 2) {
      this.selectShift = "2nd Shift (2:00pm - 10:00pm)";
    } else {
      this.selectShift = "3rd Shift (10:00pm - 6:00am)";
    }
    if (this.residentList && this.residentList.length > 0) {
      this.resultcount = true;
    } else {
      this.resultcount = false;
    }
    let reformattedResponse = []
    result = result['data']['reports'].map(item => {
      reformattedResponse.push(
        {
          resident_name: item.last_name + ", " + item.first_name,
          performer: item.testing_status_list.perform_by ? item.testing_status_list.perform_by : '',
          time: this.convertDateToFacilityTimeZone(item.testing_status_list.ts_time),
          result: item.testing_status_list.value
        }
      )

      /*item.testing_list.forEach(e=>{
        reformattedResponse.push(
          {
            resident_name: item.last_name + ", " + item.first_name,
            performer:e.perform_by?e.perform_by:'',
            time:this.convertDateToFacilityTimeZone(e.ts_time),
            result:e.value
          }
        )
      })*/
    })

    // console.log('---result----',reformattedResponse)
    this.testingData = reformattedResponse;
    this.createTable(reformattedResponse);
    this.commonService.setLoader(false);
  }

  checkScroll() {

    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop
    // returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  public async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    //this.getActivityFunction();
    this.loadReport();
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    console.log(tableArr);
    this.dataSource = new MatTableDataSource(tableArr);
  }

  convertDateToFacilityTimezoneWise(start) {
    return new Date(start).toLocaleString('en-US', {timeZone: this.timezone});
  }
  
  async downloadAll() {
    const action = { type: "POST", target: "reports/testing_report_export" };
    const payload = this.data;
    let result = await this.apiService.apiFn(action, payload);

    this.exportdata = result['data']['reports']

    let startDate = this.getDateFromTimezone(this.start_date);
    let endDate = this.getDateFromTimezone(this.end_date);
    let testingReport: any = await this.prepareForExportAll(startDate, endDate);
  }

  columnNames_1 = [
    {
      id: 'Resident_Name',
      value: 'Resident Name',
      title: 'Resident Name',
      name: 'Resident Name',
      dataKey: 'Resident_Name'
    },
    {
      id: 'Performer',
      value: 'Performer',
      title: 'Performer',
      name: 'Performer',
      dataKey: 'Performer'
    },
    {
      id: 'Testing_Result',
      value: 'Testing Result',
      title: 'Testing Result',
      name: 'Testing Result',
      dataKey: 'Testing_Result'
    },
    {
      id: 'Time',
      value: 'Time',
      title: 'Time',
      name: 'Time',
      dataKey: 'Time'
    },
  ];

  async prepareForExportAll(startDate, endDate) {

    let excelData = [];
    this.doc = undefined;
    this.doc = new jsPDF();


    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.text('Testing History Report', 20, 20);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.userName}`, 20, 30);
    this.doc.text(`${moment(startDate).format('L')}-${moment(endDate).format('L')}`, 20, 34);
    this.doc.text(`${this.selectShift}`, 20, 38);

    this.exportdata.forEach(e => {
      let dRow = {
        "Resident_Name": `${e.last_name}, ${e.first_name}`,
        "Performer": e.testing_status_list.perform_by,
        "Testing_Result": e.testing_status_list.value,
        "Time": this.convertDateToFacilityTimeZone(e.testing_status_list.ts_time),
      }

      excelData.push(dRow);
    })

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

    this.doc.save('Testing History Report');
    this.commonService.setLoader(false);
  }


  getDateFromTimezone(date) {
    let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
    return new Date(newDate);
  }

  convertDateToFacilityTimeZone(start) {
    let utcDate = moment.utc(start);
    let tzdate = utcDate.clone().tz(this.timezone);
    return tzdate.format("MMMM Do YYYY, HH:mm A");
  }
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}
