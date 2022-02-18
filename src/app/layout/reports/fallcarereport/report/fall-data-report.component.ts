/**
 * @author [Vaibhav P.]
 * @create date 2020-12-17 16:51:34
 * @modify date 2020-12-17 16:51:34
 * @desc [Fall care Report]
 */

//Libs import
import { Component, OnInit, ViewChild, HostListener, ElementRef, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { ExportAsService, ExportAsConfig } from 'ngx-export-as';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from "underscore";
import * as moment from "moment-timezone";
import { Subscription } from "rxjs/Rx";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Chart, ChartType, Label, MultiDataSet, ChartDataSets, ChartOptions } from 'chart.js';

//Services
import { ApiService } from "src/app/shared/services/api/api.service";
import { CommonService } from "src/app/shared/services/common.service";
import { ExcelService } from "src/app/shared/services/excel.service";
import { insertRefFn } from 'src/app/shared/store/shiftReport/action';

import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
interface shiftRepState { _shiftRep: object;}

@Component({
  selector: "app-fall-data-report",
  templateUrl: "./fall-data-report.component.html",
  styleUrls: ["./fall-data-report.component.scss"],
})
export class FallDataReportComponent implements OnInit {
  //Varibles Define
  private subscription: Subscription;
  timezone: any;
  utc_offset: any;
  data: any;
  shiftNo: Number;
  selectShift: String;
  resultCount: Number;
  fallResult: Object = {};
  userName: String;
  start_date: number;
  end_date: number;
  residentList: any;
  resultcount: Boolean;
  requestedPerformer:any = []
  fallCareForm: FormGroup;
  dialogRefs;
  shiftArr;
	userlist: any;
  residentslist = [];
  fallTypeSearch=''
	residentOrg;
	residentFac;
	sTimeUTC;
	eTimeUTC;
	sMinute;
	eMinute;
	newDate1 = moment();
	newDate2 = moment();
	reportOrg;
	usrSearch = '';
	shiSearch = '';
	usSearch = '';
	rSearch = '';
	reportFac;
  isresident_status;
  Falltypes;
	isachive_status;
  allresident;
  sTime;
  eTime;
  ranges: any = {
	  'Today': [moment(), moment()],
	  'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
	  'Last 7 Days': [moment().subtract(6, 'days'), moment()],
	  'Last 30 Days': [moment().subtract(29, 'days'), moment()],
	  'This Month': [moment().startOf('month'), moment().endOf('month')],
	  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
	}
	range: Range = { fromDate: new Date(), toDate: new Date() };
	options: NgxDrpOptions;
	presets: Array<PresetItem> = [];
  fallCareData: any = {
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
    fallType:''
  };
  doc:any


  constructor(
    private apiService: ApiService,
    public commonService: CommonService,
    private router: Router,
    private excelService: ExcelService,
    private _shiftRep: Store<shiftRepState>,
    public dialog: MatDialog,
    private fb: FormBuilder,
  ) {}

  @ViewChild('fallcare', {static: true}) fallcare: TemplateRef<any>;
  @ViewChild('dateRangePicker', {static: true}) dateRangePicker;
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  @ViewChild('selectedUser', {static: true}) private selectedUser: MatOption;
  @ViewChild('selectedResident', {static: true}) private selectedResident: MatOption;

  ngOnInit() {
	let today = new Date();
	let lastMonth = new Date(today.getFullYear(),today.getMonth() - 1);
    var fromMin = new Date(today.getFullYear()-10, today.getMonth(), 1);
    var fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    var toMin = new Date(today.getFullYear()-10, today.getMonth(), 1);
    var toMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);

	this.setupPresets();
	this.options = {
		presets: this.presets,
		format: 'mediumDate',
		range: { fromDate: today, toDate: today },
		applyLabel: "Done",
		fromMinMax: {fromDate:fromMin, toDate:fromMax},
		toMinMax: {fromDate:toMin, toDate:toMax},
	};

    this.subscription = this.commonService.contentdata.subscribe(
      (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.timezone = contentVal.timezone;
          this.utc_offset = contentVal.utc_offset;
        }
      }
    );

    this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));

    this.end_date = this.data.end_date;
    this.start_date = this.data.start_date;
    this.userName = this.data.userName;
    this.shiftNo = this.data.shift;
    this.loadReport();
  }

  //load initial report
  async loadReport() {
    this.commonService.setLoader(true);
    const action = { type: "POST", target: "reports/fall_care" };
    const payload = this.data;

    const result = await this.apiService.apiFn(action, payload);
    this.residentList = result["data"]["reports"];
    this.residentList.forEach(e=>{
			if(e._id && e._id.userData && e._id.userData._id){
				this.requestedPerformer.push(e._id.userData._id)
			}
		})
    console.log('------response fall--------',result)
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
    this.commonService.setLoader(false);
  }

  //User wise panel Expansion
  async expandPanel(userID) {
    // event.stopPropagation();
    if (!this.fallResult.hasOwnProperty(userID)) {
      await this.getUserData(userID);
    }
  }

  //Fetch particular user data on panel expland
  async getUserData(userID) {
    this.commonService.setLoader(true);

    const action = { type: "POST", target: "reports/fall_care_users" };
    const payload = this.data;
    payload.user_id = userID;

    const result = await this.apiService.apiFn(action, payload);
    console.log(result);
    if (result["data"]["reports"] && result["status"]) {
      this.fallResult[userID] = result["data"]["reports"];
      this.commonService.setLoader(false);
      return this.fallResult[userID];
    }
    this.commonService.setLoader(false);
  }

  async setupPresets() {

	let backDate = (numOfDays) => {
	  let today = new Date();
	  return new Date(today.setDate(today.getDate() - numOfDays));
	}
  
	let startOfMonth = (month,year) =>{
	   return new Date(year, month, 1);
	}
  
	let endOfMonth = (month,year) =>{
	  return new Date(year, month + 1, 0);
	}
	
	let today = new Date();
	let yesterday = backDate(1);
	let minus7 = backDate(7)
	let minus30 = backDate(30);
	let monthFirstDate = startOfMonth(today.getMonth(),today.getFullYear());
	let monthEndDate = endOfMonth(today.getMonth(),today.getFullYear());
	let lastMonthFirstDate = startOfMonth(today.getMonth() -1 ,today.getFullYear());
	let LastMonthEndDate = endOfMonth(today.getMonth() -1,today.getFullYear());
  
	this.presets = [
	  { presetLabel: "Today", range: { fromDate: today, toDate: today } },
	  { presetLabel: "Yesterday", range: { fromDate: yesterday, toDate: today } },
	  { presetLabel: "Last 7 Days", range: { fromDate: minus7, toDate: today } },
	  { presetLabel: "Last 30 Days", range: { fromDate: minus30, toDate: today } },
	  { presetLabel: "This Month", range: { fromDate: monthFirstDate, toDate: monthEndDate } },
	  { presetLabel: "Last Month", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
	  { presetLabel: "Custom Range", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
	]
  }

  caredate(trackcares) {
    if (trackcares && trackcares.length) {
      let lowDate = trackcares[0].ts_total_time.start_time;
      let highDate = trackcares[0].ts_total_time.end_time;
      trackcares.map(function (item) {
        if (lowDate > item.ts_total_time.start_time) {
          lowDate = item.ts_total_time.start_time;
        }
        if (highDate < item.ts_total_time.end_time) {
          highDate = item.ts_total_time.end_time;
        }
      });

      let utcDate = moment.utc(lowDate);
      let tzdate = utcDate.clone().tz(this.timezone);

      let utcEndDate = moment.utc(highDate);
      let tzEndDate = utcEndDate.clone().tz(this.timezone);

      return (
        tzdate.format("MMMM Do YYYY, hh:mm A") +
        " - " +
        tzEndDate.format("hh:mm A")
      );
    } else {
      return "-";
    }
  }

  dob_date(dob) {
    if (dob) {
      return moment(dob).format("MMMM DD, YYYY");
    } else {
      return "-";
    }
  }

  cal_age(dob) {
    if (dob) {
      // tslint:disable-next-line: radix
      return (
        parseInt(moment().format("YYYY")) - parseInt(moment(dob).format("YYYY"))
      );
    } else {
      return "-";
    }
  }

  getHeadInjury(tr) {
    if (!tr.trackStatuses || tr.trackStatuses.isHeadInjury==false) {
      return "No";
    } else {
      return "Yes";
    }
  }

  getPainLevel(tr) {
    /*
    0 No Pain
    1-2 Mild Pain
    3-4 Moderate Pain
    5-6 Severe Pain
    7-8 Very Severe Pain
    9-10 Worst Pain Possible
    */

    let painlevel = "0 (No Pain)";
    // trackStatuses.painLevel
    if (!tr.trackStatuses || !tr.trackStatuses.painLevel) {
      return painlevel;
    } else {
      switch (tr.trackStatuses.painLevel) {
        case 0:
          painlevel = "0 (No Pain)";
          break;
        case 1:
          painlevel = "1 (Mild Pain)";
          break;
        case 2:
          painlevel = "2 (Mild Pain)";
          break;
        case 3:
          painlevel = "3 (Moderate Pain)";
          break;
        case 4:
          painlevel = "4 (Moderte Pain)";
          break;
        case 5:
          painlevel = "5 (Severe Pain)";
          break;
        case 6:
          painlevel = "6 (Severe Pain)";
          break;
        case 7:
          painlevel = "7 (Very Severe Pain)";
          break;
        case 8:
          painlevel = "8 (Very Severe Pain)";
          break;
        case 9:
          painlevel = "9 (Worst Pain Possible)";
          break;
        case 10:
          painlevel = "10 (Worst Pain Possible)";
          break;

        default:
          painlevel = "0 (N0 Pain)";
          break;
      }
      return painlevel;
    }
  }

  async downloadAll(){
    console.log('----download all report----')
	this.commonService.setLoader(true);

    let startDate = this.getDateFromTimezone(this.start_date);
    let endDate = this.getDateFromTimezone(this.end_date);
    console.log('---date----',startDate,endDate)
		let fallCareReport:any = await this.prepareForExportAll(startDate, endDate);
  }

  async onExportReport(){
    this.commonService.setLoader(true);
    const action = {
		type: "POST", target: "reports/fall_care_users"
    };
    const payload = this.data;
    const result = await this.apiService.apiFn(action, payload);
    let orgName, facname;
    if(result){
      orgName = result['data']['org'];
      facname = result['data']['fac'];
    }
    let doc = new jsPDF('p','mm','letter');
    doc.setFont("helvetica","bold");
    doc.setFontSize(16);
    doc.text('Unit Clean Report',19.05,19.05);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report Generated by ${this.userName}, ${orgName}, ${facname}`,19.05,24);
    doc.text(`${moment().tz(this.timezone, true).format('MMMM D, YYYY')}`,19.05, 28);

    let y = 70;
    let arr = this.residentList[0];

    for(let i=0; i < this.residentList.length; i++){
      let el = this.residentList[i];
      let performer = `${el.userData.last_name}, ${el.userData.first_name}`;
      doc.setFontSize(12);
      if(y >= 260){
        doc.addPage();
        y = 20;
      }
      doc.text(`Performer: ${performer}`, 19.05, y);
      y += 10;

      for(let j=0; j < el.records.length; j++){
        let childEl = el.records[j];
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Resident: ${childEl.updatedResidentData.last_name}, ${childEl.updatedResidentData.first_name}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Unit: ${childEl.roomData.room}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Status: ${childEl.resident_status}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`Total Time: ${childEl.totalMin}`, 19.05, y);
        y = y + 5;
        if(y >= 260){
          doc.addPage();
          y = 20;
        }
        doc.text(`${ moment(childEl.startTime).tz(this.timezone, true).format('MMMM D, YYYY HH:mm')} - ${moment(childEl.endTime).tz(this.timezone, true).format('HH:mm')}`, 19.05, y);
        y = y + 8;
        let newArr = [];
        let rowArr = [];
        let tableData = [];
        let careNote = childEl.items[0].care_notes;
        childEl.items.forEach((item, index) => {
          let carenm = item.careData.name;
          tableData.push([carenm === 'Room Cleaning' ? 'Unit Cleaning' : carenm, "", ""]);
          item.track_details.arr_room_clean.forEach(care => {
            if(typeof(care) === 'object'){
              Object.keys(care).forEach(keyy => {
                //tableData.push([this.careIdName[keyy], "", ""]);
                care[keyy].forEach(subkey => {
                  Object.keys(subkey).forEach(key2 => {
                    //tableData.push([this.careIdName[key2], subkey[key2], ""]);
                  })
                });
              })
            }
          });
          if(index === tableData.length - 1){
            tableData[index][1] = item.care_value;
            tableData[index][2] = item.care_notes;
          }
        });
        rowArr = tableData;
        if(rowArr.length > 1){
          rowArr[Math.round(rowArr.length / 2)][2] = careNote ? careNote : '';
        } else {
          rowArr[0][2] = careNote ? careNote : '';
        }
        
        await doc.autoTable({
          horizontalPageBreak: true,
          headStyles: {
            fontStyle: 'bold',
          },
          startY: y,
          margin: {
            left: 19.5,
            right: 19.5,
            top: 15,
            bottom: 15,
          },
          styles: {
            overflow: 'linebreak',
            lineWidth: 0.1,
            valign: 'middle',
            lineColor: 211
          },
          theme: 'plain',
          head: [['Care', 'Outcome', 'Notes']],
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 25, fontStyle: 'bold'},
            2: { cellWidth: 80 },
          },
          body: rowArr,
          willDrawCell: function(data){
            if(data.row.section === 'body' && data.column.index === 0){
              if(data.row.cells[1].raw == ''){
                doc.setFont('helvetica', 'bold');
              }
            }
          },
          didDrawPage: function () {
            doc.setTextColor('#1164A0');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Reported by Evey®', 19.05, 273.3, null, null, "left")
            doc.setFontSize(8).setFont('helvetica', 'normal');;
            doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, "right");
            doc.setTextColor('black');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
          }
        });

        y = doc.lastAutoTable.finalY + 10;
      }
    }

    this.commonService.setLoader(false);
    

    doc.save('room-clean-pdf');
  }

  columnNames_1 = [
    {
      id: 'Key',
      value: '',
      title: '',
      name: '',
      dataKey: 'Key'
    },
    {
      id: 'Value',
      value: '',
      title: '',
      name: '',
      dataKey: 'Value'
    },
  ];
  async prepareForExportAll(startDate,endDate){
    let fallCareReport = [];

	this.doc = undefined;
    this.doc = new jsPDF('p','mm','letter');
	this.doc.setFont("helvetica","bold");
    this.doc.setFontSize(16);
    this.doc.text('Fall Care report',19.05,19.05);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);

    this.doc.text(`Created by : ${this.userName}`, 20, 30);
    this.doc.text(`${moment(startDate).format('L')}-${moment(endDate).format('L')}`, 20, 34);
    this.doc.text(`${this.selectShift}`, 20, 38);


      let newPromiseArray =  this.requestedPerformer.map(e=>{
        return this.getUserData(e)
      })

	  let finalShiftArr=[]
      await Promise.all(newPromiseArray).then(async r=>{
      
        let newArr = []
        let startDate = this.getDateFromTimezone(this.start_date);
        let endDate = this.getDateFromTimezone(this.end_date);
		console.log("result array",r);
        r.forEach(e=>{
          newArr.push(this.commonExcelFunction(e,startDate,endDate))
        })
        await Promise.all(newArr).then(r=>{
          r.forEach(ele=>{
            ele.forEach(e=>{
				let f = Object.values(e)
				if(f[0] || f[1]){
					let data = {
						Key: f[0] || "",
						Value: f[1] || ""
					}
					  finalShiftArr.push(data)
				}
            })
          })
        })
      })

	  await this.doc.autoTable(this.columnNames_1, (finalShiftArr), {
		headerStyles: {
		  fontStyle: 'normal'
		},
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

		this.doc.save('Fall Care report');
    	this.commonService.setLoader(false);
  }

  async commonExcelFunction(userId, startDate, endDate){
		var arr = [];
		let fallReport = [];	
		arr=userId
		let blackSpace = {
			"Fall Care Report": '',
			"": '',
			" ": '',
			"  ": '',
			"   ": '',
			"    ": '',
			"     ": '',
			"      ": '',
		  }
		  let table1 = {
			"Fall Care Report": 'Performer',
			"": '',
			" ": '',
			"  ": '',
			"   ": '',
			"    ": '',
			"     ": '',
			"      ": ''
		  }
		  fallReport.push(table1);
		 
		  if(arr.length){
			  if(arr[0].trackcareList.length){
				  let f_name=arr[0].trackcareList[0].userData.first_name
				  let l_name=arr[0].trackcareList[0].userData.last_name
				  let performerName = {
					"Fall Care Report": l_name + ', ' + f_name,
					"": '',
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": ''
				  }
				  fallReport.push(performerName);
				}
		  }	

		  fallReport.push(blackSpace);

		  if(arr.length){
			 
				  let uu = arr

				  uu.forEach(i=>{
					  let resident_fname = i.trackcareList[0].residentData[0].first_name?i.trackcareList[0].residentData[0].first_name:''
					  let resident_lname = i.trackcareList[0].residentData[0].last_name?i.trackcareList[0].residentData[0].last_name:''
					  let name = resident_lname + ', ' +  resident_fname
					  
					  let nameofuser = {
						"Fall Care Report": name,
						"": '',
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }

					  fallReport.push(nameofuser);

					  let care_time = this.caredate(i.trackcareList)

					  let carePerformTime = {
						"Fall Care Report": care_time,
						"": '',
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(carePerformTime);
					  fallReport.push(blackSpace);

					  let unit_row = {
						"Fall Care Report": 'Unit',
						"": i.trackcareList[0].roomData.room,
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(unit_row);

					  let DOB_row = {
						"Fall Care Report": 'Date of Birth (DOB) :',
						"": this.dob_date(i.trackcareList[0].residentData[0].dob) ,
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(DOB_row);

					  let age_row = {
						"Fall Care Report": 'Age :',
						"": this.cal_age(i.trackcareList[0].residentData[0].dob)  ,
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(age_row);

					  let status_row = {
						"Fall Care Report": 'Current Status :',
						"": i.trackcareList[0].residentData[0].resident_status  ,
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(status_row);

					  let care_l_row = {
						"Fall Care Report": 'Care Level :',
						"": i.trackcareList[0].level  ,
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(care_l_row);

					  let performer_row = {
						"Fall Care Report": 'Performer of Fall Care :',
						"": i.trackcareList[0].userData.last_name + ', ' + i.trackcareList[0].userData.first_name ,
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					  }
					  fallReport.push(performer_row);
					  fallReport.push(blackSpace);

            let head_injury = {
              "Fall Care Report": 'Head Injury',
              "": this.getHeadInjury(i.trackcareList[0]),
              " ": '',
              "  ": '',
              "   ": '',
              "    ": '',
              "     ": '',
              "      ": '',
              }
              fallReport.push(head_injury);
              fallReport.push(blackSpace);


            let pain_level = {
              "Fall Care Report": 'Pain Level',
              "": this.getPainLevel(i.trackcareList[0]),
              " ": '',
              "  ": '',
              "   ": '',
              "    ": '',
              "     ": '',
              "      ": '',
              }
              fallReport.push(pain_level);
              fallReport.push(blackSpace);

              let notes = {
                "Fall Care Report": 'Notes',
                "":i.trackcareList[0].notes?i.trackcareList[0].notes:'Null',
                " ": '',
                "  ": '',
                "   ": '',
                "    ": '',
                "     ": '',
                "      ": '',
                }
                fallReport.push(notes);
                fallReport.push(blackSpace);
  

					//   i.userInfo,length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions
					
					  // if(i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions){
						// let question_row = {
						// 	"Fall Care Report": 'Screening Questions',
						// 	"": '',
						// 	" ": '',
						// 	"  ": '',
						// 	"   ": '',
						// 	"    ": '',
						// 	"     ": '',
						// 	"      ": '',
						//   }
						//   fallReport.push(question_row);
					  // }
					  // fallReport.push(blackSpace);

					  // if(i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions){
						// let qq = i.userInfo[0].track_details.questions

						// qq.forEach(e=>{
						//   let q_row = {
						// 	  "Fall Care Report": e.question,
						// 	  "": e.answer,
						// 	  " ": '',
						// 	  "  ": '',
						// 	  "   ": '',
						// 	  "    ": '',
						// 	  "     ": '',
						// 	  "      ": '',
						// 	}
						// 	fallReport.push(q_row);
						// })
					  // }

					  // fallReport.push(blackSpace);

					  // if(i.userInfo.length && i.userInfo[0].symtomsData.length){
						// let sym_row = {
						// 	"Fall Care Report": 'Symptoms',
						// 	"": '',
						// 	" ": '',
						// 	"  ": '',
						// 	"   ": '',
						// 	"    ": '',
						// 	"     ": '',
						// 	"      ": '',
						//   }
						//   fallReport.push(sym_row);
						//   let ss=i.userInfo[0].symtomsData

						//   ss.forEach(s=>{
						// 	let symname_row = {
						// 		"Fall Care Report": s.name,
						// 		"": '',
						// 		" ": '',
						// 		"  ": '',
						// 		"   ": '',
						// 		"    ": '',
						// 		"     ": '',
						// 		"      ": '',
						// 	  }
						// 	  fallReport.push(symname_row);
						//   })

						 
					  // }
					  // fallReport.push(blackSpace);

				  })
			 
		  }
		  return fallReport;
	}

  getDateFromTimezone(date){
    let newDate = new Date(date).toLocaleString("en-US", {timeZone: this.timezone})
    return new  Date (newDate);
  }

  openfallcare() {
    this.commonService.setLoader(true);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '800px';
    dialogConfig.panelClass = 'Shiftreportclass';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.fallcare, dialogConfig);

    this.fallCareForm = this.fb.group({
      user: ['', [Validators.required]],
      shiftype: ['', [Validators.required]],
      resident: ['', [Validators.required]],
      rSearch: '',
      usSearch: '',
      shiSearch: '',
      fallTypeSearch: ['', [Validators.required]]
    });

    this.Falltypes = this.commonService.fallTypeList()

    const shiftarray = this.commonService.shiftTime();
    this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];

    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.fallCareData.organization = contentVal.org;
        this.fallCareData.facility = contentVal.fac;

        const action = {
          type: 'GET',
          target: 'users/get_users_org_fac'
        };
        const payload = {
          organization: [this.fallCareData.organization],
          facility: [this.fallCareData.facility]
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
        this.fallCareForm.controls.user
          .patchValue([...this.userlist.map(item => item._id), 0]);
          for (let i = 0; i < this.fallCareData.user.length; i++) {
            if (this.fallCareData.user[i] === 0) {
              this.fallCareData.user.splice(i, 1);
            }
          }
        this.getAllresidents('fall');
        this.commonService.setLoader(false);
      }
    });
  }

  async getAllresidents(reportType) {

		const action = {
		  type: 'GET',
		  target: 'residents/get_res_org'
		};
		if (reportType === 'fall') {
		  this.residentOrg = this.fallCareData.organization;
		  this.residentFac = this.fallCareData.facility;
		}
	
		const payload = {
		  'organization': [this.residentOrg],
		  'facility': [this.residentFac]
		};
	
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
		if (reportType === 'fall') {
		  this.fallCareForm.controls.resident
			.patchValue([...this.residentslist.map(item => item.key), 0]);
		}
	  }
	
	  selectAllresidents(CheckRep) {
		this.allresident = true;
		if (this.selectedResident.selected) {
		  if (CheckRep === 'fall') {
			this.fallCareForm.controls.resident
			  .patchValue([...this.residentslist.map(item => item.key), 0]);
			for (let i = 0; i < this.fallCareData.resident.length; i++) {
			  if (this.fallCareData.resident[i] === 0) {
				this.fallCareData.resident.splice(i, 1);
			  }
			}
		  }
		} else {
		  if (CheckRep === 'fall') {
			this.fallCareForm.controls.resident.patchValue([]);
		  }
		}
	  }
	
	  selectResident(all, id, residentCheck) {
		this.allresident = true;
		if (this.selectedResident.selected) {
		  this.selectedResident.deselect();
		  return false;
		}
		if (residentCheck === 'fall') {
		  if (this.fallCareForm.controls.resident.value.length === this.residentslist.length) {
			this.selectedResident.select();
		  }
	
		  for (let i = 0; i < this.fallCareData.resident.length; i++) {
			if (this.fallCareData.resident[i] === 0) {
			  this.fallCareData.resident.splice(i, 1);
			}
		  }
		}
	
	  }
	
	  updateRange(range: Range) {
		var today_st = moment();
		var today_ed = moment();
		var today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
		var today_end = today_ed.set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
		if (range['startDate'] && range['startDate']['_d']) {
		  // console.log('---d exist  startdate')
		  range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
		  this.start_date = range['startDate']['_d'].getTime();
		}else if(range.fromDate) {
			//This condition for new Date Picker
			range['fromDate'] =moment( range['fromDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
			this.start_date = (range.fromDate).getTime();
		} else {
		  //  console.log('---d not exist  startdate')
		  this.start_date = today_start['_d'].getTime();
		}
		if (range['endDate'] && range['endDate']['_d']) {
		  // console.log('---d exist  endate')
		  range['endDate'] = range['endDate'].set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
		  this.end_date = range['endDate']['_d'].getTime();
		} else if(range.toDate){
			range['toDate'] = moment(range['toDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
			this.end_date = (range.toDate).getTime()
		} else {
		  // console.log('---d not exist  endate')
		  this.end_date = today_end['_d'].getTime();
		}
		console.log('range in local timezone', this.start_date, this.end_date)
		//console.log('range in facility timezone', moment(moment(this.start_date)).tz(this.timezone, true).valueOf(), moment(moment(this.end_date)).tz(this.timezone, true).valueOf())
	
	  }
	
	  checkAllwoNum(key) {
		const result = this.commonService.allwoNum(key);
		return result;
	  }
	
	  changeShiftForVitals(shiftNo) {
		let zone = this.timezone
	
		this.newDate1 = moment.tz(zone);
		this.newDate2 = moment.tz(zone)
	
		// this.newDate1 = moment();
		// this.newDate2 = moment();
	
		if (shiftNo === 0) {
		  this.fallCareData.shiftType = 'All';
		} else if (shiftNo === 1) {
		  this.fallCareData.shiftType = '1st Shift (6:00am - 2:00pm)';
		  this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
		  this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
		} else if (shiftNo === 2) {
		  this.fallCareData.shiftType = '2nd Shift (2:00pm - 10:00pm)';
		  this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
		  this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
		} else if (shiftNo === 3) {
		  this.fallCareData.shiftType = '3rd Shift (10:00pm - 6:00am)';
		  this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
		  this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
		}
		this.sTime = this.newDate1.hours();
		this.eTime = this.newDate2.hours();
		console.log('------shift changing time hours------', this.sTime, this.eTime)
	  }
	
	  async isArchiveData(event, checkType) {
		console.log(checkType, event);
		if (checkType === 'fall') {
		  this.fallCareData.user = '';
		  this.reportOrg = this.fallCareData.organization;
		  this.reportFac = this.fallCareData.facility;
		}
	
		this.commonService.setLoader(true);
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
		if (checkType === 'fall') {
		  this.fallCareForm.controls.user
			.patchValue([...this.userlist.map(item => item._id), 0]);
			for (let i = 0; i < this.fallCareData.user.length; i++) {
			  if (this.fallCareData.user[i] === 0) {
				this.fallCareData.user.splice(i, 1);
			  }
			}
		}
		this.commonService.setLoader(false);
	  }
	
	  //Check Archive resident
	  async isArchiveResi(event, checkResi) {
		if (checkResi === 'fall') {
		  this.fallCareData.resident = '';
		  this.reportOrg = this.fallCareData.organization;
		  this.reportFac = this.fallCareData.facility;
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
		if (checkResi === 'fall') {
		  this.fallCareForm.controls.resident
			.patchValue([...this.residentslist.map(item => item.key), 0]);
		  for (let i = 0; i < this.fallCareData.user.length; i++) {
			if (this.fallCareData.user[i] === 0) {
			  this.fallCareData.user.splice(i, 1);
			}
		  }
		}
	  }
	
	  selectAll(checkTypeData) {
		if (this.allSelected.selected) {
		  if (checkTypeData === 'fall_all') {
			this.fallCareForm.controls.user
			  .patchValue([...this.userlist.map(item => item._id), 0]);
			for (var i = 0; i < this.fallCareData.user.length; i++) {
			  if (this.fallCareData.user[i] === 0) {
				this.fallCareData.user.splice(i, 1);
			  }
			}
		  }
	
		} else {
		  if (checkTypeData === 'fall_all') {
			this.fallCareForm.controls.user.patchValue([]);
		  }
		}
	  }
	
	  selectUser(all, id, checkUser) {
		if (this.allSelected.selected) {
		  this.allSelected.deselect();
		  return false;
		}
	
		if (checkUser === 'fall') {
		  if (this.fallCareForm.controls.user.value.length == this.userlist.length)
			this.allSelected.select();
	
		  for (var i = 0; i < this.fallCareData.user.length; i++) {
			if (this.fallCareData.user[i] === 0) {
			  this.fallCareData.user.splice(i, 1);
			}
		  }
		}
	
    }

    cancelFall() {
      this.fallCareData.isachive = false;
      this.fallCareData.isresident = false;
      this.dialogRefs.close();
    }

    async fallCareSubmit(report,isValid){
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
          facId: this.fallCareData.facility,
          orgId: this.fallCareData.organization,
          sMinute: this.sMinute,
          eMinute: this.sMinute,
          timezone: this.timezone,
          fallType:report.fallType
        };
   //     console.log('----fall payload---',payload)
        this._shiftRep.dispatch(insertRefFn(payload));
		this.dialogRefs.close();
		this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));

		this.end_date = this.data.end_date;
		this.start_date = this.data.start_date;
		this.userName = this.data.userName;
		this.shiftNo = this.data.shift;
		this.loadReport();
/*         console.log('---payload data----',payload)
        this.router.navigate(['/reports/falldatareport']); */
      } else {
        console.log('-----in valid-------')
        return;
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