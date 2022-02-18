import { Component, OnInit, ViewChild, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
// import * as moment from 'moment';
import * as moment from 'moment-timezone';
import { Subscription } from 'rxjs/Rx';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as async from 'async';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
	selector: "app-view",
	templateUrl: "./view.component.html",
	styleUrls: ["./view.component.scss"],
})
export class ViewComponent implements OnInit, OnDestroy {
	timezone: any;
	utc_offset: any;
	private subscription: Subscription;
	public isLoading: boolean = false;
	public isClicked: boolean = false;
	hasNextPage: boolean = false;
	totalCount: any;
	selectedShift: string = '';
	username: string = '';
	startDate: any;
	endDate: any;
	constructor(
		private _route: ActivatedRoute,
		private _apiService: ApiService,
		private _excelService: ExcelService,
		public _commonService: CommonService,
		public _aes256Service: Aes256Service,
		private router: Router,
	) { }

	recordMessage: string;
	loaderexport = false;
	loadervalue = 0;
	loaderbuffer = 2;
	count: any;
	public doc: any;
	public result: any;
	reportData;
	exportData;
	exportContentVal = [];
	displayedColumns = [];
	pageEvent: PageEvent;
	datasource;
	isShow: boolean;
	topPosToStartShowing = 100;
	public totalPagesExp = "{total_pages_count_string}";
	sortActive = "name";
	sortDirection: "asc" | "desc" | "";
	data :any =[];
	inculdeA = {
		isCallLight: "CL",
		isNotify: "N",
		is_out_of_fac: "O",
		isFind: "F",
		isNFC: "NF",
		is_virus_care: "VC",
	};

	// Column names in table
	columnNames = [
		{
			id: "name",
			value: "Resident",
			title: "Resident",
			name: "name",
			dataKey: "Resident",
			sort: false,
		},
		{
			id: "facility",
			value: "Facility",
			title: "Facility",
			name: "facility",
			dataKey: "Facility",
			sort: true,
		},
		{
			id: "level",
			value: "Level",
			title: "Level",
			name: "level",
			dataKey: "Level",
			sort: true,
		},
		{
			id: "status",
			value: "Includes",
			title: "Status",
			name: "status",
			dataKey: "status",
			sort: false,
		},
		{
			id: "room",
			value: "Zone",
			title: "Zone",
			name: "room",
			dataKey: "Room",
			sort: true,
		},
		{
			id: "user",
			value: "Staff",
			title: "Staff",
			name: "user",
			dataKey: "Staff",
			sort: true,
		},
		{
			id: "care",
			value: "Care",
			title: "Care",
			name: "care",
			dataKey: "Care",
			sort: false,
		},
		{
			id: "outcome",
			value: "Outcome",
			title: "Outcome",
			name: "outcome",
			dataKey: "Outcome",
			sort: false,
		},
		{
			id: "total_minutes",
			value: "Total Minutes",
			title: "Total Minutes",
			name: "total_minutes",
			dataKey: "Total Minutes",
			sort: true,
		},
		{
			id: "ts_date_created",
			value: "Performed Date",
			title: "Performed Date",
			name: "ts_date_created",
			dataKey: "Performed Date",
			sort: true,
		},
		{
			id: "care_notes",
			value: "Notes",
			title: "Notes",
			name: "care_notes",
			dataKey: "Notes",
			sort: true,
		},
	];
	dataSource;
	// viewdata;
	@ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
	@ViewChild(MatSort, {static: false}) sort: MatSort;
	pagiPayload = {
		length: 0,
		pageIndex: 0,
		pageSize: 10,
		previousPageIndex: 0,
		sort: { active: "", direction: "asc" },
	};

	@HostListener("window:scroll")
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

	// TODO: Cross browsing
	gotoTop() {
		window.scroll({
			top: 0,
			left: 0,
			behavior: "smooth",
		});
	}

	async ngOnInit() {
		this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
			if (contentVal.org && contentVal.fac) {
				// console.log('--facility timezone--',contentVal)
				this.timezone = contentVal.timezone
				this.utc_offset = contentVal.utc_offset
				console.log('---timezone---', this.timezone, this.utc_offset);
				this._commonService.setLoader(true);
				this.displayedColumns = this.displayedColumns.concat(this.columnNames.map((x) => x.id));
				this.getServerData(this.pagiPayload);
			}
		});
		
	}

	// create angular material table
	createTable(arr) {
		const tableArr: Element[] = arr;
		console.log("---table data----", tableArr);
		this.dataSource = new MatTableDataSource(tableArr);
		// this.dataSource.sort = this.sort;
		setTimeout(() => {
			this.dataSource.paginator = this.paginator;
			let arrLen = arr.length;
			if (arrLen < this.pagiPayload.pageSize) {
				let startIndex = this.pagiPayload.pageIndex * this.pagiPayload.pageSize;
				let endIndex = startIndex + arrLen;
				document.getElementsByClassName('mat-paginator-range-label')[0].innerHTML = startIndex + 1 + ' - ' + endIndex;
				this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
			} else {
				let tempRange = this.paginator._intl.getRangeLabel(this.pagiPayload.pageIndex, this.pagiPayload.pageSize, arr.length);
				document.getElementsByClassName('mat-paginator-range-label')[0].innerHTML = tempRange.substring(0, tempRange.indexOf('o'));
				this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
			}
		});
		
	}

	// Get list of reports
	public async getReportDataFunction() {
		const id = this._aes256Service.decFnWithsalt(this._route.params["_value"]["id"]);
		const action = { type: "POST", target: "reports/view" };
		const payload = { reportId: id, pagination: this.pagiPayload };
		let result = await this._apiService.apiFn(action, payload);

		// this.viewdata = result['data']['view']
		if(result['status']){
			this.selectedShift = result['data']['obj']['shift'];
			console.log("Object Result",result['data']['obj']);
			this.username = `${result['data']['obj']['username']['last_name']}, ${result['data']['obj']['username']['first_name']}`;
			this.endDate = result['data']['obj']['eDate'];
			this.startDate = result['data']['obj']['sDate'];
		}
		if (result["data"] && result["data"]["resp"].length) {
			this.count = result["data"] && result["data"]["count"] ? result["data"]["count"] : 0;
			this.hasNextPage = result['data']['isNextPage'];
			result = result["data"]["resp"].map((_) => {
				const keypair = [];
				if (_.trackStatuses != null) {
					const peopleArray = Object.keys(_.trackStatuses).map((i) => {
						if (_.trackStatuses[i]) {
							keypair.push(i);
						}
					});
				}
				return {
					..._,
					time_duration: _.ts_time_track,
					name: this.formatName(_),
					room: _.room_id ? (_.room_id.room ? _.room_id.room : "-") : "-",
					care: _.care_name ? _.care_name : "-",
					outcome: _.care_value ? _.care_value : "-",
					total_minutes: _.ts_total_minutes,
					// total_minutes: Math.round(_.ts_total_minutes / 1000) != 0 ? Math.round(_.ts_total_minutes / 1000) : '1',
					user: _.user_id ? `${_.user_id.last_name ? _.user_id.last_name : ""}, ${_.user_id.first_name ? _.user_id.first_name : ""}` : "",
					care_notes: _.care_notes ? _.care_notes : "--",
					ts_date_created: ((_.ts_total_time && _.ts_total_time.start_time) ? this.convertDateToFacilityTimezoneWise(_.ts_total_time.start_time) : '--'),//moment(_.ts_total_time.start_time).format("MMMM Do YYYY, HH:mm:ss"),
					// this.formatDate(_.ts_total_time.start_time),
					level: _.care_level && _.care_level["name"] ? _.care_level["name"] : "-",
					facility: _.facilityData && _.facilityData.length ? _.facilityData[0]["fac_name"] : "-",
					status: keypair,
				};
			});

			this.data = result;
			if (this.pagiPayload.sort && this.pagiPayload.sort.active === "care") {
				this.data.sort(function (a, b) {
					const nameA = a.care.toUpperCase(),
						nameB = b.care.toUpperCase();
					if (nameA < nameB) {
						return -1;
					}
					if (nameA > nameB) {
						return 1;
					}
					return 0; // default return value (no sorting)
				});
			}
			if (this.pagiPayload.sort && this.pagiPayload.sort.active === "outcome") {
				this.data.sort(function (a, b) {
					const nameA = a.outcome.toUpperCase(),
						nameB = b.outcome.toUpperCase();
					if (nameA < nameB) {
						return -1;
					}
					if (nameA > nameB) {
						return 1;
					}
					return 0; // default return value (no sorting)
				});
			}
			this.exportData = result;
			this.createTable(this.data);
			this._commonService.setLoader(false);
		} else {
			this.count = 0;
			this.recordMessage = "No Data Found";
			this._commonService.setLoader(false);
		}
	}
	convertDateToFacilityTimezoneWise(start) {
		let utcDate = moment.utc(start)
		let tzdate = utcDate.clone().tz(this.timezone)

		return tzdate.format("MMMM Do YYYY, HH:mm:ss")
	}
	// sort table data in asc or desc order
	sortData(sort?: PageEvent) {
		if (sort["direction"] === "") {
			this.sort.active = sort["active"];
			this.sort.direction = "asc";
			this.sort.sortChange.emit({ active: sort["active"], direction: "asc" });
			this.sort._stateChanges.next();
			return;
		}
		this._commonService.setLoader(true);
		this.pagiPayload.sort = { active: this.sort.active, direction: this.sort.direction };
		this.getReportDataFunction();
	}

	async getServerData(event?: PageEvent) {
		this._commonService.setLoader(true);
		this.pagiPayload.previousPageIndex = event.previousPageIndex;
		this.pagiPayload.pageIndex = event.pageIndex;
		this.pagiPayload.pageSize = event.pageSize;
		this.pagiPayload.length = event.length;
		this.getReportDataFunction();
	}

	// get resident names
	formatName(row) {
		// tslint:disable-next-line: max-line-length
		return row.resident_id
			? row.resident_id && row.resident_id.length
				? row.resident_id.map((item) => `${item.last_name}, ${item.first_name}`).toString()
				: row.resident_id && !row.resident_id.length
					? `${row.resident_id.last_name}, ${row.resident_id.first_name}`
					: (!row.resident_id || row.resident_name === " ") && !row.care_id
						? row.room_id.residents_id
							.map((_) => `${_.last_name}, ${_.first_name}`)
							.toString()
							.replace("[", " ")
							.replace("]", " ")
						: row.room_id.residents_id
							.map((_) => `${_.last_name}, ${_.first_name}`)
							.toString()
							.replace("[", " ")
							.replace("]", " ")
			: "-";
	}

	formatResidentName(data) {
		if (data.resident_id && data.resident_id.length) {
			let fn = data.resident_id[0].first_name ? data.resident_id[0].first_name.charAt(0).toUpperCase() + data.resident_id[0].first_name.slice(1) : '';
			let ln = data.resident_id[0].last_name ? data.resident_id[0].last_name.charAt(0).toUpperCase() + data.resident_id[0].last_name.slice(1) : '';
			const name = ln + ', ' + fn;
			return name;
		} else {
			return '-';
		}
	}

	formatDate(ts_date_created) {
		if (ts_date_created) {
			return moment(ts_date_created).format("MMMM Do YYYY, HH:mm:ss");
		} else {
			return "";
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
					type: "GET",
					target: "reports/export_count",
				};
				const payloadCount = { reportId: this._aes256Service.decFnWithsalt(this._route.params["_value"]["id"]) };
				const resultCount = await this._apiService.apiFn(actionCount, payloadCount);

				let decExist = 0;
				const limit = 2500;
				const trackcount = resultCount["data"];

				const no = trackcount <= limit ? 1 : trackcount / limit;
				if (trackcount % limit !== 0 && trackcount > limit) {
					decExist = 1;
				}
				let arrlen;
				if (decExist === 1) {
					arrlen = trackcount.length <= limit ? [1] : Array.from({ length: no + 1 }, (v, k) => k);
				} else {
					arrlen = trackcount.length <= limit ? [1] : Array.from({ length: no }, (v, k) => k);
				}

				// console.log('resultCountresultCountresultCount',arrlen, resultCount);
				const reportId = this._aes256Service.decFnWithsalt(this._route.params["_value"]["id"]);
				const that = this;

				let resultAll = [];
				async.eachOfSeries(
					arrlen,
					async function (item, index, callback) {
						// console.log(item,index);
						// let action = { type: 'GET', target: 'reports/export' }
						const action = { type: "POST", target: "reports/view" };
						const payload = { reportId: reportId, pagination: { pageIndex: item, pageSize: limit } };
						const result = await that._apiService.apiFn(action, payload);
						if (result["data"] && result["data"]["resp"].length) {
							const data = result["data"]["resp"];
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
						// return resultAll;
					},
				);
			}
		});
	}

	// Export PDF
	async exportPdf() {
		const that = this;
		await this.exportContentData();
		const resultAll = this.exportContentVal;
		if (resultAll.length) {
			const data = resultAll.map((_) => {
				return {
					..._,
					time_duration: _.ts_time_track,
					name: that.formatName(_),
					room: _.room_id ? (_.room_id.room ? _.room_id.room : "") : "",
					care: _.care_name ? _.care_name : "-",
					outcome: _.care_value ? _.care_value : "-",
					total_minutes: _.ts_total_minutes,
					user: _.user_id ? `${_.user_id.last_name ? _.user_id.last_name : ""}, ${_.user_id.first_name ? _.user_id.first_name : ""}` : "",
					care_notes: _.care_notes ? _.care_notes : "--",
					ts_date_created: this.convertDateToFacilityTimezoneWise(_.ts_total_time.start_time),
				
					level: _.care_level && _.care_level["name"] ? _.care_level["name"] : "-",
					facility: _.facilityData && _.facilityData.length ? _.facilityData[0]["fac_name"] : "-",
					find: _.trackStatuses && _.trackStatuses.isFind != null ? "Yes" : "No",
					call_light: _.trackStatuses && _.trackStatuses.isCallLight != null ? "Yes" : "No",
					notify: _.trackStatuses && _.trackStatuses.isNotify != null ? "Yes" : "No",
					is_out_of_Fac: _.trackStatuses && _.trackStatuses.is_out_of_Fac != null ? "Yes" : "No",
				};
			});
			that.exportData = data;
			let pdfdata;
			if (that.exportData.length) {
				pdfdata = that.exportData.map((it, itr) => {
					return {
						Resident: it.name,
						Level: it.level,
						Find: it.find,
						"Call Light": it.call_light,
						Facility: it.facility,
						"Out Of Facility": it.is_out_of_Fac,
						"Notify Care Team": it.notify,
						Room: it.room,
						Staff: it.user,
						Care: it.care,
						Outcome: it.outcome,
						"Total Minutes": it.total_minutes,
						"Performed Date": it.ts_date_created,
						Notes: it.care_notes
					};
				});
			}
			that.doc = undefined;
			that.doc = new jsPDF("l", "mm", "a3");
			that.pageContent(true);
			that.pageContent(false);
			const doc = new jsPDF("p", "pt");
			that.columnNames.push(
				{
					id: "find",
					value: "Find",
					title: "Find",
					name: "find",
					dataKey: "Find",
					sort: false,
				},
				{
					id: "call_light",
					value: "Call Light",
					title: "Call Light",
					name: "call_light",
					dataKey: "Call Light",
					sort: false,
				},
				{
					id: "is_out_of_Fac",
					value: "Out Of Facility",
					title: "Out Of Facility",
					name: "is_out_of_Fac",
					dataKey: "Out Of Facility",
					sort: false,
				},
				{
					id: "notify",
					value: "Notify Care Team",
					title: "Notify Care Team",
					name: "notify",
					dataKey: "Notify Care Team",
					sort: false,
				},
			);

			for (let i = 0; i < that.columnNames.length; i++) {
				if (that.columnNames[i]["id"] === "status") {
					that.columnNames.splice(i, 1);
				}
			}

			await that.doc.autoTable(that.columnNames, pdfdata && pdfdata.length ? pdfdata : ["No visits tracked"], {
				theme: "striped",
				headerStyles: {
					textColor: 20,
					halign: "center",
					fontStyle: "normal",
				},
				addPageContent: () => {
					that.pageContent(false);
				},
				styles: {
					overflow: "linebreak",
					lineColor: [221, 221, 221],
					lineWidth: 0.3,
					halign: "center",
					valign: "middle",
				},
				columnStyles: {
					Sno: {
						columnWidth: 20,
					},
					Resident: {
						columnWidth: 20,
					},
					
					Staff: {
						columnWidth: 20,
					},
					
					Level: {
						columnWidth: 15,
					},
					Find: {
						columnWidth: 10,
					},
					"Call Light": {
						columnWidth: 10,
					},
					"Out Of Facility": {
						columnWidth: 10,
					},
					
					Notes: {
						columnWidth: 30,
					},
					
				},

				drawRow: (row, data) => {
					if (row.index === 0 && row.raw === "No visits tracked") {
						that.doc.rect(data.settings.margin.left, row.y, data.table.width, 8);
						that.doc.autoTableText(row.raw, data.settings.margin.left + data.table.width / 2, row.y + row.height / 2, {
							halign: "center",
							valign: "middle",
						});
						return false;
					}
				},
			});
			that.doc.putTotalPages(that.totalPagesExp);
			that.doc.save("Custom Report");
			that._commonService.setLoader(false);
			for (let i = 0; i < that.columnNames.length; i++) {
				console.log("----column id-------", that.columnNames[i]["id"]);
				if (that.columnNames[i]["id"] === "find") {
					that.columnNames.splice(i, 1);
				}
				if (that.columnNames[i]["id"] === "call_light") {
					that.columnNames.splice(i, 1);
				}
				if (that.columnNames[i]["id"] === "is_out_of_Fac") {
					that.columnNames.splice(i, 1);
				}
				if (that.columnNames[i]["id"] === "notify") {
					that.columnNames.splice(i, 1);
				}
			}
			that.columnNames.push({
				id: "status",
				value: "Includes",
				title: "Status",
				name: "status",
				dataKey: "status",
				sort: false,
			});
			
			that.loadervalue = 0;
			that.loaderbuffer = 2;
			that.loaderexport = false;
			return;
		}
	}

	async onExportAsPDF() {
		let header = ['Resident', 'Facility', 'Level', 'Includes', 'Zone', 'Staff', 'Care', 'Outcome', 'Total Minutes', 'Performed Date', 'Notes'];
		let dataArr = [];
		await this.exportContentData();
		const resultAll = this.exportContentVal;
		resultAll.forEach(item => {
		  dataArr.push([
			this.formatName(item),
			item.facilityData && item.facilityData.length ? item.facilityData[0]["fac_name"] : "-",
			item.care_level && item.care_level["name"] ? item.care_level["name"] : "-",
			item.trackStatuses && item.trackStatuses.isFind != null ? "Yes" : "No",
			item.room_id ? (item.room_id.room ? item.room_id.room : "") : "",
			item.user_id ? `${item.user_id.last_name ? item.user_id.last_name : ""}, ${item.user_id.first_name ? item.user_id.first_name : ""}` : "",
			item.care_name ? item.care_name : "-",
			item.care_value ? item.care_value : "-",
			item.ts_total_minutes,
			this.convertDateToFacilityTimezoneWise(item.ts_total_time.start_time),
			item.care_notes ? item.care_notes : "--"
		  ]);
		});
		let fontfamily = 'helvetica'
		let fontsize = 10;
		let x = 19.05;
		let y = 19.05;
		let doc = new jsPDF('l', '', '', '');
		doc.setFont(fontfamily, "normal");
		doc.setFontSize(16).setFont(fontfamily, 'bold');
		doc.text('Custom Reports', x, y);
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
			  columnStyles: {
				0: {cellWidth: 21},
				1: {cellWidth: 21},
				2: {cellWidth: 21},
				3: {cellWidth: 21},
				4: {cellWidth: 21},
				5: {cellWidth: 21},
				6: {cellWidth: 21},
				7: {cellWidth: 21},
				8: {cellWidth: 21},
				9: {cellWidth: 21},
			   10: {cellWidth: 21}
			  },
			  horizontalPageBreak: true,
			  didDrawPage: function () {
				doc.setTextColor('#1164A0');
				doc.setFontSize(8);
				doc.setFont(fontfamily, 'normal');
				doc.text('Reported by Evey®', x, 273.3, null, null, "left")
				doc.setFontSize(8).setFont(fontfamily, 'normal');
				doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, "right");
				doc.setTextColor('black');
				doc.setFontSize(fontsize);
				doc.setFont(fontfamily, 'normal');
			  }
			})
			y = doc.lastAutoTable.finalY + 10;
			doc.save('Custom Reports');
	  }

	pageContent(isHeader = undefined) {
		if (isHeader) {
		}
		// FOOTER
		let str = "Page " + this.doc.internal.getNumberOfPages();
		if (typeof this.doc.putTotalPages === "function") {
			str = str + " of " + this.totalPagesExp;
		}
		this.doc.setFontSize(10);
		this.doc.setTextColor("#636c72");

		this.doc.text("Report Created by Evey.", 15, this.doc.internal.pageSize.height - 10);
		this.doc.text(str, this.doc.internal.pageSize.width + 25, this.doc.internal.pageSize.height - 10, null, null, "right");
	}

	// export excel report
	async exportXlsx() {
		// const first_promise= await first_function();
		await this.exportContentData();
		const resultAll = this.exportContentVal;

		if (resultAll) {
			let data = resultAll.map((_) => {
				return {
					..._,
					time_duration: _.ts_time_track,
					residentName: this.formatName(_),
					room: _.room_id ? (_.room_id.room ? _.room_id.room : "") : "",
					care: _.care_name ? _.care_name : "-",
					outcome: _.care_value ? _.care_value : "-",
					total_minutes: _.ts_total_minutes,
					// timeTrackData: _.ts_time_track[(_.ts_time_track.length) - 1].end_time,
					user: _.user_id ? `${_.user_id.last_name ? _.user_id.last_name : ""}, ${_.user_id.first_name ? _.user_id.first_name : ""}` : "",
					care_notes: _.care_notes ? _.care_notes : "--",
					ts_date_created: this.convertDateToFacilityTimezoneWise(_.ts_total_time.start_time),//moment(_.ts_total_time.start_time).format("MMMM Do YYYY, HH:mm:ss"),
					// this.formatDate(_.ts_total_time.start_time),
					// ts_date_created: moment(_.ts_date_created).format('MMMM Do YYYY, HH:mm:ss'),//this.formatDate(_.ts_date_created),
					level: _.care_level && _.care_level["name"] ? _.care_level["name"] : "-",
					facility: _.facilityData && _.facilityData.length ? _.facilityData[0]["fac_name"] : "-",
					// find:_.is_find && _.is_find!=null?_.is_find:'-'
				};
			});
			data = data.map((item) => {
				return {
					...item,
					name: this.formatResidentName(item),
				};
			});
			this.exportData = data;
			const report = this.prepareUsersForCSV();
			this._excelService.exportAsExcelFile(report, "Report");
		}
	}

	// prepare csv data to be generated
	prepareUsersForCSV() {
		const report = [];
		this.exportData.forEach((item) => {
			report.push({
				Resident: item.name ? item.name : "-",
				Facility: item.facility ? item.facility : "-",
				Level: item.level ? item.level : "-",
				Find: item.trackStatuses && item.trackStatuses.isFind != null ? "Yes" : "No",
				"Call Light": item.trackStatuses && item.trackStatuses.isCallLight != null ? "Yes" : "No",
				"Out Of Facility": item.trackStatuses && item.trackStatuses.is_out_of_Fac != null ? "Yes" : "No",
				"Notify Care Team": item.trackStatuses && item.trackStatuses.isNotify != null ? "Yes" : "No",
				Zone: item.room ? item.room : "-",
				Staff: item.user ? item.user : "-",
				Care: item.care ? item.care : "-",
				Outcome: item.outcome ? item.outcome : "-",
				"Total Minutes": item.total_minutes,
				"Performed Date": item.ts_date_created,
				Notes: item.care_notes ? item.care_notes : "-",
				// tslint:disable-next-line: max-line-length
				// "facility" :(_.resident_id.length && _.resident_id.length ===1  && _.resident_id[0].facility && _.resident_id[0].facility.length)?_.resident_id[0].facility[0].fac['fac_name']:'-'
				// tslint:disable-next-line: max-line-length
				// 'Time Duration': JSON.stringify(arr).replace(/start_time/g, 'Start Time').replace(/end_time/g, 'End Time').replace('[', '').replace(']', '')
			});
		});
		this.loadervalue = 0;
		this.loaderbuffer = 2;
		this.loaderexport = false;
		return report;
	}

	async getTotalCount() {
		this.isClicked = false;
		this.isLoading = true;
		const id = this._aes256Service.decFnWithsalt(this._route.params["_value"]["id"]);
		const action = { type: 'POST', target: 'reports/view_count' };
		const payload = { reportId: id, pagination: this.pagiPayload };
		const result = await this._apiService.apiFn(action, payload);
		if (result && result['status']) {
			this.isLoading = false;
			this.isClicked = true;
			this.totalCount = result['data']['count'];
		}
	}

	openCustomerReport(){
		this.router.navigate(['/reports/report']);
	}

	ngOnDestroy(){
		this.subscription.unsubscribe();
	}
}
export interface Element {
	position: number;
	name: string;
	weight: number;
	symbol: string;
}

// export interface PagiElement {
//   length: number;
//   pageIndex: number;
//   pageSize: number;
//   previousPageIndex: number;
//   sort: Object;
// }

