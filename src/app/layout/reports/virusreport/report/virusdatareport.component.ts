/**
 * @author [Vaibhav P.]
 * @create date 2020-09-02 23:59:17
 * @modify date 2020-09-02 23:59:17
 * @desc [virus expand panel data and stats component]
 */
import { Component, OnInit, ElementRef, ViewChild, TemplateRef } from '@angular/core';
// import { forEach } from '@angular/router/src/utils/collection';
import { NgModel } from '@angular/forms';
import { MatOption } from '@angular/material';
import { Store } from "@ngrx/store";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ExportAsService } from 'ngx-export-as';
import * as _ from 'underscore';
import { Subscription } from 'rxjs/Rx';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ExcelService } from './../../../../shared/services/excel.service';
import { CommonService } from './../../../../shared/services/common.service';
import { insertRefFn } from './../../../../shared/store/shiftReport/action';
import { ApiService } from 'src/app/shared/services/api/api.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
interface shiftRepState { _shiftRep: object; }

@Component({
	selector: "app-virusdatareport",
	templateUrl: "./virusdatareport.component.html",
	styleUrls: ["./virusdatareport.component.scss"],
})
export class VirusdatareportComponent implements OnInit {
	sortedBy = {
		'Temperature': 0,
		'Blood Pressure': 1,
		'Pulse Automatic': 2,
		'Oxygen': 3,
		'Respirations': 4,
		'Height': 5,
		'Weight': 6,
		'Left': 7
	}

	data;
	careIdName;
	userName;
	shiftNo;

	usrSearch = '';
	shiSearch = '';
	usSearch = '';
	rSearch = '';

	start_date;
	end_date;

	residentList;
	selectShift;

	resultcount;
	virusResults = {};

	res_all;
	res_iso;
	res_po;
	doc;
	requestedPerformer = []

	timezone: any;
	utc_offset: any;
	private subscription: Subscription;
	isGroupByUsers: boolean = false;
	isGroupByResident: boolean = false;
	virusReportData: any = [];
	isListAll: boolean = false;
	constructor(
		private apiService: ApiService,
		public commonService: CommonService,
		private router: Router,
		private excelService: ExcelService,
		private fb: FormBuilder,
		public dialog: MatDialog,
		private _shiftRep: Store<shiftRepState>
	) { }

	@ViewChild('virsuCheck', { static: false }) virsuCheck: TemplateRef<any>;
	@ViewChild('allSelected', { static: false }) private allSelected: MatOption;
	@ViewChild('selectedResident', { static: false }) private selectedResident: MatOption;
	@ViewChild('dateRangePicker', { static: false }) dateRangePicker;

	alwaysShowCalendars: boolean;
	virusReportForm: FormGroup;
	floorlist;
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
	dialogRefs;
	houseReportForm: FormGroup;
	shiftArr;
	userlist: any;
	residentslist = [];
	residentOrg;
	residentFac;
	sTimeUTC;
	eTimeUTC;
	sMinute;
	eMinute;
	newDate1 = moment();
	newDate2 = moment();
	reportOrg;
	reportFac;
	isresident_status;
	isachive_status;
	allresident;

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
	selected_start_date: any;
	selected_end_date: any;

	ngOnInit() {

		let today = new Date();
		let lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
		const fromMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
		const fromMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);
		const toMin = new Date(today.getFullYear() - 10, today.getMonth(), 1);
		const toMax = new Date(today.getFullYear(), today.getMonth() + 1, 0);

		this.setupPresets();
		this.options = {
			presets: this.presets,
			format: 'mediumDate',
			range: { fromDate: today, toDate: today },
			applyLabel: "Done",
			fromMinMax: { fromDate: fromMin, toDate: fromMax },
			toMinMax: { fromDate: toMin, toDate: toMax },
		};


		if (!this.commonService.checkAllPrivilege("Reports")) {
			this.router.navigate(["/"]);
		}
		this.subscription = this.commonService.contentdata.subscribe((contentVal: any) => {
			if (contentVal.org && contentVal.fac) {
				// console.log('--facility timezone--',contentVal)
				this.timezone = contentVal.timezone
				this.utc_offset = contentVal.utc_offset
				console.log('---timezone---', this.timezone, this.utc_offset)
			}
		});
		this.load_careIdName();
		this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));

		this.end_date = this.data.end_date;
		this.start_date = this.data.start_date;
		this.selected_start_date = this.start_date;
		this.selected_end_date = this.end_date;
		this.userName = this.data.userName;
		this.shiftNo = this.data.shift;
		this.loadReport();
	}

	async loadReport() {
		this.requestedPerformer = [];
		this.commonService.setLoader(true);
		this.getCurrentView();
		if (this.isGroupByResident) {
			const action = { type: "POST", target: "reports/virus_report_grp_res" };
			const payload = this.data;
			const result = await this.apiService.apiFn(action, payload);
			this.residentList = result["data"]["reports"];
			this.residentList.forEach(e => {
				if (e._id && e._id.residentData && e._id.residentData._id[0]) {
					this.requestedPerformer.push(e._id.residentData._id[0])
				}
			})
			
		} else if (this.isGroupByUsers) {
			const action = { type: "POST", target: "reports/virus_report_new" };
			const payload = this.data;
			const result = await this.apiService.apiFn(action, payload);
			this.res_all = result['data']['c']['residents']
			this.res_iso = result['data']['c']['res_iso']
			this.res_po = result['data']['c']['res_p']
			this.residentList = result["data"]["reports"];
			this.residentList.forEach(e => {
				if (e._id && e._id.userData && e._id.userData._id) {
					this.requestedPerformer.push(e._id.userData._id)
				}
			})
		} else {
			this.resultcount = false;
			this.virusReportData = await this.getData('random');
			if (this.virusReportData.length > 0) {
				this.resultcount = true;
				this.virusReportData.forEach(elem => {
					if (elem.trackcareList[0].user_id) {
						this.requestedPerformer.push(elem.trackcareList[0].user_id)
					}
				})
			} else {
				this.resultcount = false;
			}

		}
		if (this.shiftNo === 0) {
			this.selectShift = "All Shifts";
		} else if (this.shiftNo === 1) {
			this.selectShift = "1st Shift (6:00am - 2:00pm)";
		} else if (this.shiftNo === 2) {
			this.selectShift = "2nd Shift (2:00pm - 10:00pm)";
		} else {
			this.selectShift = "3rd Shift (10:00pm - 6:00am)";
		}
		if (!this.isListAll) {
			if (this.residentList && this.residentList.length > 0) {
				this.resultcount = true;
			} else {
				this.resultcount = false;
			}
		}
		this.commonService.setLoader(false);
		if (!this.isListAll) {
			if (this.residentList.length === 1) {
				if (this.isGroupByResident) {
					this.expandPanel(this.residentList[0]._id.residentData._id[0]);
				} else {
					this.expandPanel(this.residentList[0]._id.userData._id);
				}
			}
		}
	}

	async setupPresets() {

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
			{ presetLabel: "This Month", range: { fromDate: monthFirstDate, toDate: monthEndDate } },
			{ presetLabel: "Last Month", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
			{ presetLabel: "Custom Range", range: { fromDate: lastMonthFirstDate, toDate: LastMonthEndDate } },
		]
	}

	async getData(paramId) {
		this.commonService.setLoader(true);

		const action = { type: "POST", target: "reports/virus_report_users" };
		const payload = this.data;
		if (this.isGroupByResident) {
			payload.isGroupByResident = this.isGroupByResident;
			payload.resident_Id = paramId;
		} else if (this.isGroupByUsers) {
			payload.isGroupByUser = this.isGroupByUsers;
			payload.user_id = paramId;
		} else if (this.isListAll) {
			payload.isListAll = this.isListAll;
		}


		const result = await this.apiService.apiFn(action, payload);

		if (result["data"]["reports"] && result["status"]) {

			result['data']['reports'].forEach(e => {
				e.trackcareList = e.trackcareList.sort((a, b) => this.sortedBy[a.careData.name] - this.sortedBy[b.careData.name])
			})
			this.virusResults[paramId] = result["data"]["reports"];
			//console.log('Report------>>',result["data"]["reports"]);
			this.commonService.setLoader(false);
			return this.virusResults[paramId];
		}
		this.commonService.setLoader(false);
	}

	async load_careIdName() {
		const action = {
			type: "GET",
			target: "cares/careIdName",
		};
		const payload = {};
		const result = await this.apiService.apiFn(action, payload);
		this.careIdName = result["data"];
	}

	timeConvert(num) {
		const hours = num / 60;
		const rhours = Math.floor(hours);
		const minutes = (hours - rhours) * 60;
		const rminutes = Math.round(minutes);
		return rhours + " hrs " + rminutes + " min";
	}

	async expandPanel(userID) {
		// event.stopPropagation();
		if (!this.virusResults.hasOwnProperty(userID)) {
			await this.getData(userID);
		}
	}

	caredate(trackcares) {
		try {
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

				let utcDate = moment.utc(lowDate)
				let tzdate = utcDate.clone().tz(this.timezone)

				let utcEndDate = moment.utc(highDate)
				let tzEndDate = utcEndDate.clone().tz(this.timezone)
				return tzdate.format("MMMM Do YYYY, hh:mm A") + " - " + tzEndDate.format("hh:mm A");
			} else {
				return "-";
			}
		} catch (e) {
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
			return parseInt(moment().format("YYYY")) - parseInt(moment(dob).format("YYYY"));
		} else {
			return "-";
		}
	}

	care_outcome(data) {
		let careUnit = "";

		if (data.careData && data.careData.name) {
			if (data.careData.name == "Blood Pressure") {
				careUnit = "mm Hg";
			} else if (data.careData.name == "Oxygen") {
				careUnit = "mm Hg";
			} else if (data.careData.name == "Pulse Automatic") {
				careUnit = "bpm";
			} else if (data.careData.name == "Respirations") {
				careUnit = "bpm";
			} else if (data.careData.name == "Weight") {
				careUnit = "lbs";
			} else if (data.careData.name == "Height") {
				careUnit = "ft";
			}
		}

		if (data.outcome === "Performed") {
			if (data.careData.type === "height") {
				return this.commonService.toFeet(data.track_details.first_input) + " " + (data.careData.unit ? data.careData.unit : "");
			} else {
				// tslint:disable-next-line: max-line-length
				if (data.track_details) {
					return (
						(data.track_details.first_input ? data.track_details.first_input : " ") +
						(data.track_details.second_input ? "/" + data.track_details.second_input : "") +
						" " +
						careUnit
					);
				}
			}
		} else if (data.outcome === "Discard") {
			return "-";
		} else {
			return data.outcome;
		}
	}

	care_note(data) {
		if (data.prev_trackcare_id) {
			const prevTrackcare = data.prev_trackcare;
			const trackVal = prevTrackcare.track_details;
			const oldtrackVal = data.track_details;
			const prevCareDate = moment.tz(prevTrackcare.ts_total_time.start_time, this.timezone).format("MMMM Do YYYY, hh:mm A");
			let careUnit = "";
			if (data.careData) {
				if (data.careData.name == "Blood Pressure") {
					careUnit = "mm Hg";
				} else if (data.careData.name == "Oxygen") {
					careUnit = "mm Hg";
				} else if (data.careData.name == "Pulse Automatic") {
					careUnit = "bpm";
				} else if (data.careData.name == "Respirations") {
					careUnit = "bpm";
				} else if (data.careData.name == "Weight") {
					careUnit = "lbs";
				} else if (data.careData.name == "Height") {
					careUnit = "ft";
				}
			}

			if (data.outcome === "Performed") {
				if (trackVal.second_input) {
					// tslint:disable-next-line: max-line-length
					return trackVal.first_input + "/" + trackVal.second_input + " " + careUnit + " last measurement on " + prevCareDate;
				} else {
					if (trackVal.first_input === oldtrackVal.first_input) {
						return "No change since last measurement on " + prevCareDate;
					} else {
						if (trackVal.first_input && trackVal.first_input !== "") {
							const calVal = oldtrackVal.first_input - trackVal.first_input;

							if (data.careData.type === "height") {
								// tslint:disable-next-line: max-line-length
								return (calVal > 0 ? "+" : "") + this.commonService.toFeet(calVal) + " " + careUnit + " since last measurement on " + prevCareDate;
							} else {
								return (calVal > 0 ? "+" : "") + calVal.toFixed(2) + " " + careUnit + " since last measurement on " + prevCareDate;
							}
						} else {
							return "";
						}
					}
				}
				// } else if (data.outcome === 'Discard') {
				//   return trackVal.first_input + ' ' + careUnit + 'last measurement on ' + prevCareDate;
			} else {
				if (trackVal.first_input && trackVal.first_input !== "") {
					if (data.careData.type === "height") {
						return this.commonService.toFeet(trackVal.first_input) + " " + careUnit + " since last measurement on " + prevCareDate;
					} else {
						return trackVal.first_input + " " + careUnit + " last measurement on " + prevCareDate;
					}
				} else {
					return "";
				}
			}
		} else {
			return "";
		}
	}

	care_additional_notes(data) {
		if (data.trackcareList) {
			const notes = [];
			data.trackcareList.map((item) => {
				if (item.notes && item.notes !== "") {
					notes.push(item.notes);
				}
			});
			if (notes.length) {
				return notes.toString();
			}
		}
		return false;
	}

	runNewReport() {
		//this.router.navigate(['/reports/virusreport']);
	}

	async download(userID) {
		// debugger
		let startDate = this.getDateFromTimezone(this.start_date);
		let endDate = this.getDateFromTimezone(this.end_date);
		let virusReport: any = await this.prepareForExport(userID, startDate, endDate);
	}

	async downloadAll() {
		let startDate = this.getDateFromTimezone(this.start_date);
		let endDate = this.getDateFromTimezone(this.end_date);
		let virusReport: any = await this.prepareForExportAll_new(startDate, endDate);
	}

	async prepareForExportAll_new(startDate, endDate) {
		this.commonService.setLoader(true);
		let fontfamily = 'SFProText-Regular'
		let fontsize = 12;
		let x = 19.05;
		let y = 15;
		this.doc = undefined;
		this.doc = new jsPDF('p', 'mm', 'letter');
		this.doc.setFont(fontfamily, "normal");
		this.doc.setFontSize(16).setFont(fontfamily, 'bold');
		this.doc.text('Virus Check Report', x, y)
		this.doc.setFontSize(fontsize).setFont(fontfamily, "normal");
		y = y + 12;
		this.doc.text(`Created by  ${this.userName}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
		y = y + 6;
		this.doc.text(`${moment(startDate).format('L')} - ${moment(endDate).format('L')}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
		y = y + 6;
		this.doc.text(`${this.selectShift}`, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
		if (this.resultcount && this.isListAll) {
			let TotoalPageCount = 1;
			for (var al = 0; al < this.virusReportData.length; al++) {
				var listdata = this.virusReportData[al];
				let last_name = listdata.trackcareList[0].residentData[0].last_name
				last_name = (last_name.length > 1) ? last_name[0].toUpperCase() + last_name.substr(1).toLowerCase() : last_name.toUpperCase();
				let first_name = listdata.trackcareList[0].residentData[0].first_name;
				first_name = (first_name.length > 1) ? first_name[0].toUpperCase() + first_name.substr(1).toLowerCase() : first_name.toUpperCase();
				let fullname = last_name + ", " + first_name;
				let care_time = this.caredate(listdata.trackcareList);

				y = y + 8;
				this.doc.setFontSize(fontsize).setFont(fontfamily, 'bold')
				this.doc.text(fullname, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				y = y + 5;
				this.doc.text(care_time, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal')
				y = y + 8;
				let unittext = 'Unit ';
				this.doc.text(unittext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				let unitvalue = (listdata.trackcareList[0].roomData.room ? listdata.trackcareList[0].roomData.room : '--') + ' ';
				this.doc.text(unitvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
				y = y + 5;
				let dobtext = 'Date of Birth (DOB) ';
				this.doc.text(dobtext, x, y);
				let dobvalue = (this.dob_date(listdata.trackcareList[0].residentData[0].dob) ? this.dob_date(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
				this.doc.text(dobvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
				y = y + 5;
				let agetext = 'Age ';
				this.doc.text(agetext, x, y);
				let agevalue = (this.cal_age(listdata.trackcareList[0].residentData[0].dob) ? this.cal_age(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
				this.doc.text(agevalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
				y = y + 5;
				let Currentstatustext = 'Current Status ';
				this.doc.text(Currentstatustext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				let Currentstatusvalue = (listdata.trackcareList[0].residentData[0].resident_status ? listdata.trackcareList[0].residentData[0].resident_status : '--')
				this.doc.text(Currentstatusvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				y = y + 5;
				let careleveltext = 'Care Level ';
				this.doc.text(careleveltext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				this.doc.text((listdata.trackcareList[0].level ? listdata.trackcareList[0].level : '--'), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				y = y + 5;
				let PerformerofVitalstext = 'Performer of Vitals ';
				this.doc.text(PerformerofVitalstext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				this.doc.text((listdata.trackcareList[0].userData.last_name + ', ' + listdata.trackcareList[0].userData.first_name), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
				y = y + 5;
				if (listdata.userInfo.length && listdata.userInfo[0].track_details && listdata.userInfo[0].track_details.questions) {
					y = y + 3;
					this.doc.setFontSize(12).setFont(fontfamily, 'bold');
					this.doc.text('Screening Questions', x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					y = y + 8;
					for (var q = 0; q < listdata.userInfo[0].track_details.questions.length; q++) {
						this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal');
						var questionitemdata = listdata.userInfo[0].track_details.questions[q];
						let questiontext = questionitemdata.question;
						let questionvalue = questionitemdata.answer;
						this.doc.text(questiontext, x, y)
						var qansxposition = questiontext.length;
						if (qansxposition >= 10 && qansxposition <= 40) {
							qansxposition = 100;
						}
						else if (qansxposition >= 50 && qansxposition <= 70) {
							qansxposition = 160;
						}
						else if (qansxposition >= 70 && qansxposition >= 90) {
							qansxposition = 170;
						}
						else if (qansxposition >= 70 && qansxposition <= 100) {
							qansxposition = 180;
						}
						else {
							qansxposition = 196;
						}
						this.doc.text(questionvalue, qansxposition, y).setFontSize(12).setFont(fontfamily, 'bold');
						y = y + 5;

					}
				}

				this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal');
				let virusdata = [];
				let columns = ["Vital", 'Outcome', 'Notes']
				for (var tcl = 0; tcl < listdata.trackcareList.length; tcl++) {
					let tclitemdata = listdata.trackcareList[tcl];
					let Vitalvalue = tclitemdata.careData.name;
					let Outcomevalue = this.care_outcome(tclitemdata);
					let Notesvalue = this.care_note(tclitemdata);
					virusdata.push([Vitalvalue, Outcomevalue, Notesvalue]);
				}

				let pageHeight = this.doc.internal.pageSize.height;

				await this.doc.autoTable(columns, (virusdata), {
					startY: y,
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
				let finalY = this.doc.autoTableEndPosY();
				if (finalY != 0) {
					y = parseInt(finalY);
					if (y >= 100) {
						y = parseInt(finalY)
					}
				}
				if (y <= 80) {
					this.doc.setTextColor('#1975B8');
					this.doc.setFontSize(10);
					this.doc.setFont(fontfamily, 'normal');
					this.doc.text('Reported by Evey®', x, 266.3, null, null, "left")
					this.doc.setFontSize(10).setFont(fontfamily, 'normal');;
					this.doc.text('CONFIDENTIAL', 196.95, 266.3, null, null, "right");
					this.doc.setTextColor('black');
					this.doc.setFontSize(fontsize);
					this.doc.setFont(fontfamily, 'normal');
				}
				else if (y <= 150 && TotoalPageCount == 1) {
					this.doc.setTextColor('#1975B8');
					this.doc.setFontSize(10);
					this.doc.setFont(fontfamily, 'normal');
					this.doc.text('Reported by Evey®', x, 266.3, null, null, "left");
					this.doc.setFontSize(10).setFont(fontfamily, 'normal');
					this.doc.text('CONFIDENTIAL', 196.95, 266.3, null, null, "right");
					this.doc.setTextColor('black');
					this.doc.setFontSize(fontsize);
					this.doc.setFont(fontfamily, 'normal');
				}
				else if (y >= 180) {
					this.doc.addPage();
					y = 15;
					TotoalPageCount++;
					this.doc.setTextColor('#1975B8');
					this.doc.setFontSize(10);
					this.doc.setFont(fontfamily, 'normal');
					this.doc.text('Reported by Evey®', x, 266.3, null, null, "left")
					this.doc.setFontSize(10).setFont(fontfamily, 'normal');;
					this.doc.text('CONFIDENTIAL', 196.95, 266.3, null, null, "right");
					this.doc.setTextColor('black');
					this.doc.setFontSize(fontsize);
					this.doc.setFont(fontfamily, 'normal');
				}
			}
		}
		else if (this.resultcount && this.isGroupByResident) {
			for (let r = 0; r < this.residentList.length; r++) {
				var residentitem = this.residentList[r];
				var residentlistdata = this.virusResults[residentitem._id.residentData._id[0]];
				let TotoalPageCount = 1;
				for (var al = 0; al < residentlistdata.length; al++) {
					var listdata = residentlistdata[al];
					let last_name = listdata.trackcareList[0].residentData[0].last_name
					last_name = (last_name.length > 1) ? last_name[0].toUpperCase() + last_name.substr(1).toLowerCase() : last_name.toUpperCase();
					let first_name = listdata.trackcareList[0].residentData[0].first_name;
					first_name = (first_name.length > 1) ? first_name[0].toUpperCase() + first_name.substr(1).toLowerCase() : first_name.toUpperCase();
					let fullname = last_name + ", " + first_name;
					let care_time = this.caredate(listdata.trackcareList);

					y = y + 8;
					this.doc.setFontSize(fontsize).setFont(fontfamily, 'bold')
					this.doc.text(fullname, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					y = y + 5;
					this.doc.text(care_time, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal')
					y = y + 8;
					let unittext = 'Unit ';
					this.doc.text(unittext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					let unitvalue = (listdata.trackcareList[0].roomData.room ? listdata.trackcareList[0].roomData.room : '--') + ' ';
					this.doc.text(unitvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
					y = y + 5;
					let dobtext = 'Date of Birth (DOB) ';
					this.doc.text(dobtext, x, y);
					let dobvalue = (this.dob_date(listdata.trackcareList[0].residentData[0].dob) ? this.dob_date(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
					this.doc.text(dobvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
					y = y + 5;
					let agetext = 'Age ';
					this.doc.text(agetext, x, y);
					let agevalue = (this.cal_age(listdata.trackcareList[0].residentData[0].dob) ? this.cal_age(listdata.trackcareList[0].residentData[0].dob) : '--') + ' ';
					this.doc.text(agevalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');;
					y = y + 5;
					let Currentstatustext = 'Current Status ';
					this.doc.text(Currentstatustext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					let Currentstatusvalue = (listdata.trackcareList[0].residentData[0].resident_status ? listdata.trackcareList[0].residentData[0].resident_status : '--')
					this.doc.text(Currentstatusvalue, 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					y = y + 5;
					let careleveltext = 'Care Level ';
					this.doc.text(careleveltext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					this.doc.text((listdata.trackcareList[0].level ? listdata.trackcareList[0].level : '--'), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					y = y + 5;
					let PerformerofVitalstext = 'Performer of Vitals ';
					this.doc.text(PerformerofVitalstext, x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					this.doc.text((listdata.trackcareList[0].userData.last_name + ', ' + listdata.trackcareList[0].userData.first_name), 70, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
					y = y + 5;
					if (listdata.userInfo.length && listdata.userInfo[0].track_details && listdata.userInfo[0].track_details.questions) {
						y = y + 3;
						this.doc.setFontSize(12).setFont(fontfamily, 'bold');
						this.doc.text('Screening Questions', x, y).setFontSize(fontsize).setFont(fontfamily, 'normal');
						y = y + 8;
						for (var q = 0; q < listdata.userInfo[0].track_details.questions.length; q++) {
							this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal');
							var questionitemdata = listdata.userInfo[0].track_details.questions[q];
							let questiontext = questionitemdata.question;
							let questionvalue = questionitemdata.answer;
							this.doc.text(questiontext, x, y)
							var qansxposition = questiontext.length;
							if (qansxposition >= 10 && qansxposition <= 40) {
								qansxposition = 100;
							}
							else if (qansxposition >= 50 && qansxposition <= 70) {
								qansxposition = 160;
							}
							else if (qansxposition >= 70 && qansxposition >= 90) {
								qansxposition = 170;
							}
							else if (qansxposition >= 70 && qansxposition <= 100) {
								qansxposition = 180;
							}
							else {
								qansxposition = 196;
							}
							this.doc.text(questionvalue, qansxposition, y).setFontSize(12).setFont(fontfamily, 'bold');
							y = y + 5;

						}
					}

					this.doc.setFontSize(fontsize).setFont(fontfamily, 'normal');
					let virusdata = [];
					let columns = ["Vital", 'Outcome', 'Notes']
					for (var tcl = 0; tcl < listdata.trackcareList.length; tcl++) {
						let tclitemdata = listdata.trackcareList[tcl];
						let Vitalvalue = tclitemdata.careData.name;
						let Outcomevalue = this.care_outcome(tclitemdata);
						let Notesvalue = this.care_note(tclitemdata);
						virusdata.push([Vitalvalue, Outcomevalue, Notesvalue]);
					}

					let pageHeight = this.doc.internal.pageSize.height;

					await this.doc.autoTable(columns, (virusdata), {
						headerStyles: {
							// fillColor: 212,
							// textColor: 20,
							// halign: 'center',
							fontStyle: 'normal'
						},
						startY: y,
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
					let finalY = this.doc.autoTableEndPosY();
					if (finalY != 0) {
						y = parseInt(finalY);
						if (y >= 100) {
							y = parseInt(finalY)
						}
					}
					if (y <= 80) {
						this.doc.setTextColor('#1975B8');
						this.doc.setFontSize(10);
						this.doc.setFont(fontfamily, 'normal');
						this.doc.text('Reported by Evey®', x, 266.3, null, null, "left")
						this.doc.setFontSize(10).setFont(fontfamily, 'normal');;
						this.doc.text('CONFIDENTIAL', 196.95, 266.3, null, null, "right");
						this.doc.setTextColor('black');
						this.doc.setFontSize(fontsize);
						this.doc.setFont(fontfamily, 'normal');
					}
					else if (y <= 150 && TotoalPageCount == 1) {
						this.doc.setTextColor('#1975B8');
						this.doc.setFontSize(10);
						this.doc.setFont(fontfamily, 'normal');
						this.doc.text('Reported by Evey®', x, 266.3, null, null, "left");
						this.doc.setFontSize(10).setFont(fontfamily, 'normal');
						this.doc.text('CONFIDENTIAL', 196.95, 266.3, null, null, "right");
						this.doc.setTextColor('black');
						this.doc.setFontSize(fontsize);
						this.doc.setFont(fontfamily, 'normal');
					}
					else if (y >= 180) {
						this.doc.addPage();
						y = 15;
						TotoalPageCount++;
						this.doc.setTextColor('#1975B8');
						this.doc.setFontSize(10);
						this.doc.setFont(fontfamily, 'normal');
						this.doc.text('Reported by Evey®', x, 266.3, null, null, "left")
						this.doc.setFontSize(10).setFont(fontfamily, 'normal');;
						this.doc.text('CONFIDENTIAL', 196.95, 266.3, null, null, "right");
						this.doc.setTextColor('black');
						this.doc.setFontSize(fontsize);
						this.doc.setFont(fontfamily, 'normal');
					}
				}
			}
		}

		this.doc.save('Virus check report');
		this.commonService.setLoader(false);
	}



	columnNames_2 = [
		{
			id: 'Residents',
			value: 'Residents',
			title: 'Residents',
			name: 'Residents',
			dataKey: 'Residents'
		},
		{
			id: 'Residents_in_Isolation',
			value: 'Residents in Isolation',
			title: 'Residents in Isolation',
			name: 'Residents in Isolation',
			dataKey: 'Residents_in_Isolation'
		},
		{
			id: 'Tested_Positive',
			value: 'Tested Positive',
			title: 'Tested Positive',
			name: 'Tested Positive',
			dataKey: 'Tested_Positive'
		},
	];
	async prepareForExportAll(startDate, endDate) {
		let virusReport = [];

		this.doc = undefined;
		this.doc = new jsPDF();


		this.doc.setFont("helvetica", "normal");
		this.doc.setFontSize(10);

		this.doc.text(`Created by : ${this.userName}`, 20, 30);
		this.doc.text(`${moment(startDate).format('L')} ${moment(endDate).format('L')}`, 20, 34);
		this.doc.text(`${this.selectShift}`, 20, 38);

		let res_col_1 = {
			"Residents": 'Residents',
			"Residents_in_Isolation": 'Residents in Isolation',
			"Tested_Positive": 'Tested Positive',
		}
		virusReport.push(res_col_1);
		//   this.res_all=result['data']['c']['residents']
		//   this.res_iso=result['data']['c']['res_iso']
		//   this.res_po=result['data']['c']['res_p']
		let res_col_2 = {
			"Residents": this.res_all,
			"Residents_in_Isolation": this.res_iso,
			"Tested_Positive": this.res_po,
		}
		virusReport.push(res_col_2);

		let newPromiseArray = this.requestedPerformer.map(e => {
			return this.getData(e)
		})
		// console.log('---new function call----',newPromiseArray)

		await Promise.all(newPromiseArray).then(async r => {

			let newArr = []
			let startDate = this.getDateFromTimezone(this.start_date);
			let endDate = this.getDateFromTimezone(this.end_date);
			r.forEach(e => {
				newArr.push(this.commonExcelFunction(e, startDate, endDate))
			})
			await Promise.all(newArr).then(r => {
				r.forEach(ele => {
					ele.forEach(e => {
						let f = Object.values(e)
						if (f[0] || f[1] || f[2]) {
							let data = {
								"Residents": f[0] || "",
								"Residents_in_Isolation": f[1] || "",
								"Tested_Positive": f[2] || ""
							}
							virusReport.push(data)
						}
					})
				})
			})
		})

		await this.doc.autoTable(this.columnNames_2, (virusReport), {
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

		this.doc.save('Virus check report');
		this.commonService.setLoader(false);
	}

	columnNames_1 = [
		{
			id: 'name',
			value: '',
			title: '',
			name: '',
			dataKey: 'name'
		},
		{
			id: 'outcome',
			value: '',
			title: '',
			name: '',
			dataKey: 'outcome'
		},
		{
			id: 'note',
			value: '',
			title: '',
			name: '',
			dataKey: 'note'
		},
	];
	async prepareForExport(userId, startDate, endDate) {
		var arr = [];
		let virusReport = [];
		arr = userId
		if (this.virusResults.hasOwnProperty(userId)) {
			arr = this.virusResults[userId];
		} else {
			await this.getData(userId)
			arr = this.virusResults[userId];
		}

		this.doc = undefined;
		this.doc = new jsPDF();


		this.doc.setFont("helvetica", "normal");
		this.doc.setFontSize(10);

		this.doc.text(`Created by : ${this.userName}`, 20, 30);
		this.doc.text(`${moment(startDate).format('L')}-${moment(endDate).format('L')}`, 20, 34);
		this.doc.text(`${this.selectShift}`, 20, 38);

		let table1 = {
			"name": 'Performer',
			"outcome": '',
			"note": '',
		}
		virusReport.push(table1);

		if (arr.length) {
			if (arr[0].trackcareList.length) {
				let f_name = arr[0].trackcareList[0].userData.first_name
				let l_name = arr[0].trackcareList[0].userData.last_name
				let performerName = {
					"name": l_name + ', ' + f_name,
					"outcome": '',
					"note": '',
				}
				virusReport.push(performerName);
			}
		}

		if (arr.length) {

			let uu = arr

			uu.forEach(i => {
				let resident_fname = i.trackcareList[0].residentData[0].first_name ? i.trackcareList[0].residentData[0].first_name : ''
				let resident_lname = i.trackcareList[0].residentData[0].last_name ? i.trackcareList[0].residentData[0].last_name : ''
				let name = resident_lname + ', ' + resident_fname

				let nameofuser = {
					"name": name,
					"outcome": '',
					"note": '',
				}

				virusReport.push(nameofuser);

				let care_time = this.caredate(i.trackcareList)

				let carePerformTime = {
					"name": care_time,
					"outcome": '',
					"note": '',
				}
				virusReport.push(carePerformTime);

				let unit_row = {
					"name": 'Unit',
					"outcome": i.trackcareList[0].roomData.room,
					"note": '',
				}
				virusReport.push(unit_row);

				let DOB_row = {
					"name": 'Date of Birth (DOB) :',
					"outcome": this.dob_date(i.trackcareList[0].residentData[0].dob),
					"note": '',
				}
				virusReport.push(DOB_row);

				let age_row = {
					"name": 'Age :',
					"outcome": this.cal_age(i.trackcareList[0].residentData[0].dob),
					"note": '',
				}
				virusReport.push(age_row);

				let status_row = {
					"name": 'Current Status :',
					"outcome": i.trackcareList[0].residentData[0].resident_status,
					"note": '',
				}
				virusReport.push(status_row);

				let care_l_row = {
					"name": 'Care Level :',
					"outcome": i.trackcareList[0].level,
					"note": '',
				}
				virusReport.push(care_l_row);

				let performer_row = {
					"name": 'Performer of Virus Check :',
					"outcome": i.trackcareList[0].userData.last_name + ', ' + i.trackcareList[0].userData.first_name,
					"note": '',
				}
				virusReport.push(performer_row);

				//   i.userInfo,length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions

				if (i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions) {
					let question_row = {
						"name": 'Screening Questions',
						"outcome": '',
						"note": '',
					}
					virusReport.push(question_row);
				}

				if (i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions) {
					let qq = i.userInfo[0].track_details.questions

					qq.forEach(e => {
						let q_row = {
							"name": e.question,
							"outcome": e.answer,
							"note": '',
						}
						virusReport.push(q_row);
					})
				}


				if (i.userInfo.length && i.userInfo[0].symtomsData.length) {
					let sym_row = {
						"name": 'Symptoms',
						"outcome": '',
						"note": '',
					}
					virusReport.push(sym_row);
					let ss = i.userInfo[0].symtomsData

					ss.forEach(s => {
						let symname_row = {
							"name": s.name,
							"outcome": '',
							"note": '',
						}
						virusReport.push(symname_row);
					})


				}

				i.trackcareList.forEach(r => {
					let rr_row = {
						"name": r.careData.name,
						"outcome": this.care_outcome(r),
						"note": this.care_note(r),
					}

					virusReport.push(rr_row);
				})

				if (this.care_additional_notes(i)) {
					let no_row = {
						"name": 'Additional Notes',
						"outcome": '',
						"note": '',
					}

					virusReport.push(no_row);

					let ee_row = {
						"name": this.care_additional_notes(i),
						"outcome": '',
						"note": '',
					}

					virusReport.push(ee_row);
				}
			})

		}

		await this.doc.autoTable(this.columnNames_1, (virusReport), {
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

		this.doc.save('Virus check report');
		this.commonService.setLoader(false);

	}

	async commonExcelFunction(userId, startDate, endDate) {
		var arr = [];
		let virusReport = [];
		arr = userId
		let blackSpace = {
			"Virus Check Report": '',
			"": '',
			" ": '',
			"  ": '',
			"   ": '',
			"    ": '',
			"     ": '',
			"      ": '',
		}
		let table1 = {
			"Virus Check Report": 'Performer',
			"": '',
			" ": '',
			"  ": '',
			"   ": '',
			"    ": '',
			"     ": '',
			"      ": ''
		}
		virusReport.push(table1);

		if (arr.length) {
			if (arr[0].trackcareList.length) {
				let f_name = arr[0].trackcareList[0].userData.first_name
				let l_name = arr[0].trackcareList[0].userData.last_name
				let performerName = {
					"Virus Check Report": l_name + ', ' + f_name,
					"": '',
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": ''
				}
				virusReport.push(performerName);
			}
		}

		virusReport.push(blackSpace);

		if (arr.length) {

			let uu = arr

			uu.forEach(i => {
				let resident_fname = i.trackcareList[0].residentData[0].first_name ? i.trackcareList[0].residentData[0].first_name : ''
				let resident_lname = i.trackcareList[0].residentData[0].last_name ? i.trackcareList[0].residentData[0].last_name : ''
				let name = resident_lname + ', ' + resident_fname

				let nameofuser = {
					"Virus Check Report": name,
					"": '',
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}

				virusReport.push(nameofuser);

				let care_time = this.caredate(i.trackcareList)

				let carePerformTime = {
					"Virus Check Report": care_time,
					"": '',
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(carePerformTime);
				virusReport.push(blackSpace);

				let unit_row = {
					"Virus Check Report": 'Unit',
					"": i.trackcareList[0].roomData.room,
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(unit_row);

				let DOB_row = {
					"Virus Check Report": 'Date of Birth (DOB) :',
					"": this.dob_date(i.trackcareList[0].residentData[0].dob),
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(DOB_row);

				let age_row = {
					"Virus Check Report": 'Age :',
					"": this.cal_age(i.trackcareList[0].residentData[0].dob),
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(age_row);

				let status_row = {
					"Virus Check Report": 'Current Status :',
					"": i.trackcareList[0].residentData[0].resident_status,
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(status_row);

				let care_l_row = {
					"Virus Check Report": 'Care Level :',
					"": i.trackcareList[0].level,
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(care_l_row);

				let performer_row = {
					"Virus Check Report": 'Performer of Virus Check :',
					"": i.trackcareList[0].userData.last_name + ', ' + i.trackcareList[0].userData.first_name,
					" ": '',
					"  ": '',
					"   ": '',
					"    ": '',
					"     ": '',
					"      ": '',
				}
				virusReport.push(performer_row);
				virusReport.push(blackSpace);

				//   i.userInfo,length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions

				if (i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions) {
					let question_row = {
						"Virus Check Report": 'Screening Questions',
						"": '',
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					}
					virusReport.push(question_row);
				}
				virusReport.push(blackSpace);

				if (i.userInfo.length && i.userInfo[0].track_details && i.userInfo[0].track_details.questions) {
					let qq = i.userInfo[0].track_details.questions

					qq.forEach(e => {
						let q_row = {
							"Virus Check Report": e.question,
							"": e.answer,
							" ": '',
							"  ": '',
							"   ": '',
							"    ": '',
							"     ": '',
							"      ": '',
						}
						virusReport.push(q_row);
					})
				}

				virusReport.push(blackSpace);

				if (i.userInfo.length && i.userInfo[0].symtomsData.length) {
					let sym_row = {
						"Virus Check Report": 'Symptoms',
						"": '',
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					}
					virusReport.push(sym_row);
					let ss = i.userInfo[0].symtomsData

					ss.forEach(s => {
						let symname_row = {
							"Virus Check Report": s.name,
							"": '',
							" ": '',
							"  ": '',
							"   ": '',
							"    ": '',
							"     ": '',
							"      ": '',
						}
						virusReport.push(symname_row);
					})


				}
				virusReport.push(blackSpace);

				i.trackcareList.forEach(r => {
					let rr_row = {
						"Virus Check Report": r.careData.name,
						"": this.care_outcome(r),
						" ": this.care_note(r),
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					}

					virusReport.push(rr_row);
				})
				virusReport.push(blackSpace);

				if (this.care_additional_notes(i)) {
					let no_row = {
						"Virus Check Report": 'Additional Notes',
						"": '',
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					}

					virusReport.push(no_row);

					let ee_row = {
						"Virus Check Report": this.care_additional_notes(i),
						"": '',
						" ": '',
						"  ": '',
						"   ": '',
						"    ": '',
						"     ": '',
						"      ": '',
					}

					virusReport.push(ee_row);
				}
				virusReport.push(blackSpace);
				virusReport.push(blackSpace);


			})

		}
		return virusReport;
	}

	getDateFromTimezone(date) {
		let newDate = new Date(date).toLocaleString("en-US", { timeZone: this.timezone })
		return new Date(newDate);
	}

	openVirusCheck() {
		this.commonService.setLoader(true);
		const dialogConfig = new MatDialogConfig();
		dialogConfig.maxWidth = '800px';
		dialogConfig.panelClass = 'Shiftreportclass';
		//dialogConfig.disableClose = true;
		dialogConfig.closeOnNavigation = true;
		this.dialogRefs = this.dialog.open(this.virsuCheck, dialogConfig);

		this.virusReportForm = this.fb.group({
			user: ['', [Validators.required]],
			shiftype: ['', [Validators.required]],
			resident: ['', [Validators.required]],
			rSearch: '',
			usSearch: '',
			shiSearch: '',
		});

		const shiftarray = this.commonService.shiftTime();
		this.shiftArr = [...[{ 'no': 0, 'name': 'All shifts' }], ...shiftarray];

		this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
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
				this.virusReportForm.controls.user
					.patchValue([...this.userlist.map(item => item._id), 0]);
				for (let i = 0; i < this.virusreport.user.length; i++) {
					if (this.virusreport.user[i] === 0) {
						this.virusreport.user.splice(i, 1);
					}
				}

				this.getAllresidents('virus');
				this.commonService.setLoader(false);
			}
		});
	}

	async virusReportSubmit(report, isValid) {
		if (isValid) {
			this.virusreport.isachive = false;
			this.virusreport.isresident = false;
			this.dialogRefs.close();
			this.isGroupByUsers = false;
			this.isGroupByResident = false;
			this.resultcount = false;
			this.isListAll = false;
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
			this.selected_end_date = this.end_date;
			this.selected_start_date = this.start_date;
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
			console.log('--virus report payload-----', payload);
			let rList = this.residentslist.length;
			let uList = this.userlist.length;
			let virusReportUserResdLength = { 'userLength': uList, 'residentLength': rList };
			sessionStorage.setItem('virusReportUserResdLength', JSON.stringify(virusReportUserResdLength));
			this._shiftRep.dispatch(insertRefFn(payload));
			//this.dialogRefs.close();
			//this.cancelVirus();
			this.data = JSON.parse(sessionStorage.getItem("shiftRep_Reducer"));
			this.end_date = this.data.end_date;
			this.start_date = this.data.start_date;
			this.userName = this.data.userName;
			this.shiftNo = this.data.shift;
			//this.commonService.setLoader(false);
			this.loadReport();
			//this.router.navigate(['/reports/virussreport']);
		} else {
			return;
		}
	}

	async getAllresidents(reportType) {

		const action = {
			type: 'GET',
			target: 'residents/get_res_org'
		};
		if (reportType === 'virus') {
			this.residentOrg = this.virusreport.organization;
			this.residentFac = this.virusreport.facility;
		}

		const payload = {
			'organization': [this.residentOrg],
			'facility': [this.residentFac]
		};
		this.allresident = false;
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
		if (reportType === 'virus') {
			this.virusReportForm.controls.resident
				.patchValue([...this.residentslist.map(item => item.key), 0]);
		}
	}

	selectAllresidents(CheckRep) {
		this.allresident = true;
		if (this.selectedResident.selected) {
			if (CheckRep === 'virus') {
				this.virusReportForm.controls.resident
					.patchValue([...this.residentslist.map(item => item.key), 0]);
				for (let i = 0; i < this.virusreport.resident.length; i++) {
					if (this.virusreport.resident[i] === 0) {
						this.virusreport.resident.splice(i, 1);
					}
				}
			}
		} else {
			if (CheckRep === 'virus') {
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
		if (residentCheck === 'virus') {
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
		var today_st = moment();
		var today_ed = moment();
		var today_start = today_st.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
		var today_end = today_ed.set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
		if (range['startDate'] && range['startDate']['_d']) {
			// console.log('---d exist  startdate')
			range['startDate'] = range['startDate'].set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
			this.start_date = range['startDate']['_d'].getTime();
		} else if (range.fromDate) {
			//This condition for new Date Picker
			range['fromDate'] = moment(range['fromDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
			this.start_date = (range.fromDate).getTime();
		} else {
			//  console.log('---d not exist  startdate')
			this.start_date = today_start['_d'].getTime();
		}
		if (range['endDate'] && range['endDate']['_d']) {
			// console.log('---d exist  endate')
			range['endDate'] = range['endDate'].set({ hour: 23, minute: 0, second: 0, millisecond: 0 })
			this.end_date = range['endDate']['_d'].getTime();
		} else if (range.toDate) {
			range['toDate'] = moment(range['toDate']).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toDate()
			this.end_date = (range.toDate).getTime()
		} else {
			// console.log('---d not exist  endate')
			this.end_date = today_end['_d'].getTime();
		}
		console.log('range in local timezone', this.start_date, this.end_date)
		console.log('range in facility timezone', moment(moment(this.start_date)).tz(this.timezone, true).valueOf(), moment(moment(this.end_date)).tz(this.timezone, true).valueOf())

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
			this.virusreport.shiftType = 'All';
		} else if (shiftNo === 1) {
			this.virusreport.shiftType = '1st Shift (6:00am - 2:00pm)';
			this.newDate1.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
			this.newDate2.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
		} else if (shiftNo === 2) {
			this.virusreport.shiftType = '2nd Shift (2:00pm - 10:00pm)';
			this.newDate1.set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
			this.newDate2.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
		} else if (shiftNo === 3) {
			this.virusreport.shiftType = '3rd Shift (10:00pm - 6:00am)';
			this.newDate1.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
			this.newDate2.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
		}
		this.sTime = this.newDate1.hours();
		this.eTime = this.newDate2.hours();
		console.log('------shift changing time hours------', this.sTime, this.eTime)
	}

	async isArchiveData(event, checkType) {
		console.log(checkType, event);
		if (checkType === 'virus') {
			this.virusreport.user = '';
			this.reportOrg = this.virusreport.organization;
			this.reportFac = this.virusreport.facility;
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
		if (checkType === 'virus') {
			this.virusReportForm.controls.user
				.patchValue([...this.userlist.map(item => item._id), 0]);
			for (let i = 0; i < this.virusreport.user.length; i++) {
				if (this.virusreport.user[i] === 0) {
					this.virusreport.user.splice(i, 1);
				}
			}
		}
		this.commonService.setLoader(false);
	}

	//Check Archive resident
	async isArchiveResi(event, checkResi) {
		if (checkResi === 'virus') {
			this.virusreport.resident = '';
			this.reportOrg = this.virusreport.organization;
			this.reportFac = this.virusreport.facility;
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

	selectAll(checkTypeData) {
		if (this.allSelected.selected) {
			if (checkTypeData === 'virus_all') {
				this.virusReportForm.controls.user
					.patchValue([...this.userlist.map(item => item._id), 0]);
				for (var i = 0; i < this.virusreport.user.length; i++) {
					if (this.virusreport.user[i] === 0) {
						this.virusreport.user.splice(i, 1);
					}
				}
			}

		} else {
			if (checkTypeData === 'virus_all') {
				this.virusReportForm.controls.user.patchValue([]);
			}
		}
	}

	selectUser(all, id, checkUser) {
		if (this.allSelected.selected) {
			this.allSelected.deselect();
			return false;
		}

		if (checkUser === 'virus') {
			if (this.virusReportForm.controls.user.value.length == this.userlist.length)
				this.allSelected.select();

			for (var i = 0; i < this.virusreport.user.length; i++) {
				if (this.virusreport.user[i] === 0) {
					this.virusreport.user.splice(i, 1);
				}
			}
		}

	}
	cancelVirus() {
		this.virusreport.isachive = false;
		this.virusreport.isresident = false;
		this.dialogRefs.close();
	}

	getCurrentView() {
		let orignlLength = JSON.parse(sessionStorage.getItem("virusReportUserResdLength"));
		let selectedUserLength = this.data.userId.length;
		let selectedResidentLength = this.data.residentId.length;
		let totalUserInFac = orignlLength.userLength;
		let totalResInFac = orignlLength.residentLength + 1;
		if (selectedUserLength == totalUserInFac && selectedResidentLength == totalResInFac) {
			this.isListAll = true;
			this.isGroupByUsers = false;
			this.isGroupByResident = false;
		} else if (selectedUserLength < totalUserInFac && selectedResidentLength == totalResInFac) {
			this.isGroupByUsers = true;
			this.isGroupByResident = false;
			this.isListAll = false;
		} else if (selectedUserLength == totalUserInFac && selectedResidentLength < totalResInFac) {
			this.isGroupByResident = true;
			this.isGroupByUsers = false;
			this.isListAll = false;
		} else if (selectedUserLength < totalUserInFac && selectedResidentLength < totalResInFac) {
			this.isGroupByResident = true;
			this.isGroupByUsers = false;
			this.isListAll = false;
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