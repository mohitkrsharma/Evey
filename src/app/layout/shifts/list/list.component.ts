import {Component,OnInit,ViewChild,ElementRef,TemplateRef, AfterViewChecked} from "@angular/core";
import {MatTableDataSource,MatSort,PageEvent,MatDialogRef,MAT_DIALOG_DATA,MatDialogConfig, MatPaginator} from "@angular/material";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";
import * as moment from "moment";
import {fromEvent} from "rxjs";
import {debounceTime,map,distinctUntilChanged,filter,tap} from "rxjs/operators";
import {Subscription} from "rxjs";
import {ApiService} from "./../../../shared/services/api/api.service";
import {ExcelService} from "./../../../shared/services/excel.service";
import {AlertComponent} from "../../../shared/modals/alert/alert.component";
import {RestoreComponent} from "../../../shared/modals/restore/restore.component";
import {CommonService} from "./../../../shared/services/common.service";
import {Aes256Service} from "./../../../shared/services/aes-256/aes-256.service";
import {FormArray,FormBuilder,FormGroup,Validators} from "@angular/forms";
import { startOfMonth, startOfDay, startOfWeek, addWeeks, endOfDay, subDays, addDays, endOfMonth, endOfWeek, isSameDay,
        isSameMonth, addHours, addMinutes, addSeconds, format } from 'date-fns';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';

@Component({
    selector: "app-list",
    templateUrl: "./list.component.html",
    styleUrls: ["./list.component.scss"],
})

export class ListComponent implements OnInit, AfterViewChecked {
    public btnAction: Function;
    public filtershow = false;
    public formatString: string = 'HH:mm';
    // MATPAGINATOR
    pageIndex: number;
    addPopupStartMin;
    pageSize: number;
    length: number;
    checked;
    deleteArr = [];
    deleteItem = [];
    data;
    arr = [];
    dataSource;
    count;
    displayedColumns = [];
    organization;
    facility;
    dialogRefs = null;
    isEdit = false;
    shiftName = '';
    shiftId;
    startTime;
    endTime;
    exisitingTime = [];
    // ddp list variable
    organiz;
    fac_list;
    sortActive = "name";
    sortDirection: "asc" | "desc" | "";
    search: any;
    isArcheive: boolean = false;
    @ViewChild("deleteButton", {static: true}) private deleteButton: ElementRef;
    @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
    pagiPayload: PagiElement = {
        moduleName:'shiftList',
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        search: "",
    };
    bulkorg;
    bulkfac;
    actualDataCount;
    @ViewChild(MatSort, {static: true}) sort: MatSort;
    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
    @ViewChild("searchInput", {static: true}) searchInput: ElementRef;
    @ViewChild("shiftAdd", {static: true}) shiftAdd: TemplateRef<any>;
    userIds = [];
    exisitingShift = [];
    columnNames = [
        {
            id: "shiftName",
            value: "Shift Name",
            sort: true,
        }
        , {
            id: "startTime",
            value: "Start Time",
            sort: true,
        }
        , {
            id: "endTime",
            value: "End Time",
            sort: true,
        }
        ,];
    private subscription: Subscription;
    privilege: string = 'add';
    constructor(private router: Router, private apiService: ApiService, private excelService: ExcelService, public dialog: MatDialog, private toastr: ToastrService, private _aes256Service: Aes256Service, public _commonService: CommonService, private fb: FormBuilder,) {
        this.createPropertyForm();
    }
    exportdata;
    filedata;
    floor;
    sector;
    org_name;
    faclist;
    floorlist;
    fac_name;
    seclist;
    floor_name;
    public show = false;
    shiftForm: FormGroup;
    public temparray: any = [];
    // nfcEdit:any ='';
    question;
    nfcEdit: any = {
        _id: "",
        starTime: "",
        endTime: "",
    };
    public isLoading: boolean = false;
    public isClicked: boolean = false;
    hasNextPage: boolean = false;
    public totalCount: any;
    async ngOnInit() {
        this._commonService.setLoader(true);
        if (sessionStorage.getItem("pageListing")) {
            const pageListing = JSON.parse(sessionStorage.getItem("pageListing"));
            if (pageListing.shiftList) {
                this.pagiPayload.previousPageIndex = pageListing.shiftList.previousPageIndex;
                this.pagiPayload.pageIndex = pageListing.shiftList.pageIndex;
                this.pagiPayload.pageSize = pageListing.shiftList.pageSize;
                this.pagiPayload.length = pageListing.shiftList.length;
            } else {
                sessionStorage.setItem("pageListing", JSON.stringify({
                    shiftList: this.pagiPayload
                }));
            }
        } else {
            sessionStorage.setItem("pageListing", JSON.stringify({
                shiftList: this.pagiPayload
            }));
        }
        this._commonService.payloadSetup('shiftList',this.pagiPayload)
        this.search = this.searchInput.nativeElement.value;
        fromEvent(this.searchInput.nativeElement, "keyup").pipe(
            // tslint:disable-next-line:max-line-length
            debounceTime(2000), // The user can type quite quickly in the input box, and that could trigger a lot of server requests. With this operator, we are limiting the amount of server requests emitted to a maximum of one every 150ms
            distinctUntilChanged(), // This operator will eliminate duplicate values
            tap(() => {
                this.getServerData(this.pagiPayload);
            })).subscribe();
        this.displayedColumns = this.displayedColumns.concat(["checkbox"]);
        this.displayedColumns = this.displayedColumns.concat(this.columnNames.map((x) => x.id));
        this.displayedColumns = this.displayedColumns.concat(["actions"]);
        this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
            this._commonService.setLoader(true);
            if (contentVal.org && contentVal.fac) {
                this.organization = this.pagiPayload["organization"] = contentVal.org;
                this.facility = this.pagiPayload["facility"] = contentVal.fac;
                this.getServerData(this.pagiPayload);
            }
        });
    }
    createTable(arr) {
        const tableArr: Element[] = arr;
        this.dataSource = new MatTableDataSource(tableArr);
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
    }
    createPropertyForm() {
        this.shiftForm = this.fb.group({
            _id: [null, []],
            shifts: this.fb.array([this.setInputType()]),
        });
    }

    updateCareTimeChanged(ci, timeData,event) {
    
        //const careVal = this.carelistData.filter(function (entry) { return entry._id === care_key; })[0];
        const timeendDisp = moment( event.value ).add(15, 'minutes').toDate();

        //const timeendDisp = moment( timeData.startTime ).add((careVal.max) ? careVal.max : 30, 'minutes').toDate();
        this.endTime   =  timeendDisp;
        this.startTime = event.value;
      }


    setInputType() {
        return this.fb.group({
            ntagid: ["", []],
        });
    }
    get optionsPoints() {
        return this.shiftForm.get("shifts") as FormArray;
    }
    addShift() {
        this.search = "";
        this.getServerData(this.pagiPayload);
        this.startTime = moment({
            hour: 9
        }).toDate(); // moment({ hour: 9 });
        this.endTime = moment({
            hour: 9
        }).add(30, "minutes").toDate();
        if (this.isEdit == false) {
            this.nfcEdit._id = "";
        }
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = "700px";
        dialogConfig.panelClass = "shiftpopup";
        //dialogConfig.disableClose = true;
        dialogConfig.closeOnNavigation = true;
        dialogConfig.autoFocus = false;
        const currentDate = new Date();
        //const startTimeToday = that.convertNext30MinuteInterval(currentDate);
        const startTime   = moment(currentDate).add(30, "minutes").toDate();
        this.temparray = <FormArray>this.shiftForm.controls["shifts"];
        this.dialogRefs = this.dialog.open(this.shiftAdd, dialogConfig);
    }
    async saveShiftDialog() {
        if (!this.shiftName) {
            this.toastr.error("Please enter shift name");
            this._commonService.setLoader(false);
            return;
        }
        if (this.shiftForm.valid) {
            this._commonService.setLoader(true);
            // console.log("------existing time---------", this.exisitingTime);
            let data = {};
            if (this.startTime == null || this.endTime == null) {
                this.toastr.error("Please select valid shift time.");
                this._commonService.setLoader(false);
                return;
            }
            let startdateformat: any = moment(this.startTime, "ddd DD-MMM-YYYY, HH:mm");
            let enddateformat: any = moment(this.endTime, "ddd DD-MMM-YYYY, HH:mm");
            // console.log("-----initial dates", this.startTime, this.endTime);
            // console.log("-------date validation-------", startdateformat.isValid(), enddateformat.isValid());
            if (startdateformat.isValid()) {
                startdateformat = moment(this.startTime, "ddd DD-MMM-YYYY, HH:mm").format("HH:mm");
                for (let i = 0; i < this.exisitingTime.length; i++) {
                    if (this.isEdit == true && this.exisitingTime[i]._id == this.shiftId) {
                        continue;
                    } else {
                        let iDate = this.startTime;
                        if (moment(this.exisitingTime[i].eTime).date() > moment(this.exisitingTime[i].sTime).date()) {
                            // console.log('----greater existing start time---------',iDate,this.exisitingTime[i].eTime)
                            let date1 = moment(iDate, 'HH:mm')
                            let date2End = moment(this.exisitingTime[i].eTime, 'HH:mm')
                            // console.log('-result-',this.compareDate(moment(iDate))<this.compareDate(moment(this.exisitingTime[i].eTime)))
                            if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.exisitingTime[i].eTime))) {
                                this.toastr.error("Shift time already exist.");
                                this._commonService.setLoader(false);
                                return;
                            }
                        } else if (moment(iDate).isBetween(this.exisitingTime[i].sTime, this.exisitingTime[i].eTime, null, "()")) {
                            // console.warn("-----This start date is in between existing date");
                            this.toastr.error("Shift time already exist.");
                            this._commonService.setLoader(false);
                            return;
                        }
                    }
                }
            } else {
                startdateformat = this.startTime;
                // let iDate = moment(this.startTime, "HH:mm").toDate();
                for (let i = 0; i < this.exisitingTime.length; i++) {
                    if (this.isEdit == true && this.exisitingTime[i]._id == this.shiftId) {
                        continue;
                    } else {
                        let iDate = moment(this.startTime, "HH:mm").toDate();
                        if (moment(this.exisitingTime[i].eTime).date() > moment(this.exisitingTime[i].sTime).date()) {
                            if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.exisitingTime[i].eTime))) {
                                this.toastr.error("Shift time already exist.");
                                this._commonService.setLoader(false);
                                return;
                            }
                        } else if (moment(iDate).isBetween(this.exisitingTime[i].sTime, this.exisitingTime[i].eTime, null, "()")) {
                            // console.warn("-----This start date is in between existing date");
                            this.toastr.error("Shift time already exist.");
                            this._commonService.setLoader(false);
                            return;
                        }
                    }
                }
            }
            if (enddateformat.isValid()) {
                enddateformat = moment(this.endTime, "ddd DD-MMM-YYYY, HH:mm").format("HH:mm");
                for (let i = 0; i < this.exisitingTime.length; i++) {
                    if (this.isEdit == true && this.exisitingTime[i]._id == this.shiftId) {
                        continue;
                    } else {
                        let iDate = this.endTime;
                        if (moment(this.exisitingTime[i].eTime).date() > moment(this.exisitingTime[i].sTime).date()) {
                            if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.exisitingTime[i].eTime))) {
                                this.toastr.error("Shift time already exist.");
                                this._commonService.setLoader(false);
                                return;
                            }
                        } else if (moment(iDate).isBetween(this.exisitingTime[i].sTime, this.exisitingTime[i].eTime, null, "()")) {
                            // console.warn("-----This  enddate is in between existing date");
                            this.toastr.error("Shift time already exist.");
                            this._commonService.setLoader(false);
                            return;
                        }
                    }
                }
            } else {
                enddateformat = this.endTime;
                for (let i = 0; i < this.exisitingTime.length; i++) {
                    if (this.isEdit == true && this.exisitingTime[i]._id == this.shiftId) {
                        continue;
                    } else {
                        let iDate = moment(this.endTime, "HH:mm").toDate();
                        if (moment(this.exisitingTime[i].eTime).date() > moment(this.exisitingTime[i].sTime).date()) {
                            if (this.compareDate(moment(iDate)) < this.compareDate(moment(this.exisitingTime[i].eTime))) {
                                this.toastr.error("Shift time already exist.");
                                this._commonService.setLoader(false);
                                return;
                            }
                        } else if (moment(iDate).isBetween(this.exisitingTime[i].sTime, this.exisitingTime[i].eTime, null, "()")) {
                            // console.warn("-----This  enddate is in between existing date");
                            this.toastr.error("Shift time already exist.");
                            this._commonService.setLoader(false);
                            return;
                        }
                    }
                }
            }
            // console.log("----after formatting date--------", startdateformat, enddateformat);
            if (this.isEdit == false && !this.shiftId) {
                console.log('---shift name--', this.shiftName);
                data = {
                    // start_time: this.startTime,
                    // end_time: this.endTime,
                    shift_name: this.shiftName,
                    start_time: startdateformat,
                    end_time: enddateformat,
                    org: this.organization,
                    fac: this.facility,
                };
            } else if (this.isEdit == true && this.shiftId) {

                data = {

                    // start_time: this.startTime,
                    // end_time: this.endTime,
                    _id: this.shiftId,
                    shift_name: this.shiftName,
                    start_time: startdateformat,
                    end_time: enddateformat,
                    org: this.organization,
                    fac: this.facility,
                };
            }
            // console.log("----------current date--------", moment().format());
            // console.log("---edit time dates", this.startTime, this.endTime);
            // console.log("--shift add obj-----", data);
            const action = {
                type: "POST",
                target: "shift/add",
            };
            const payload = data;
            const result = await this.apiService.apiFn(action, payload);
            if (result["status"]) {
                this.toastr.success(result["message"]);
                this.closeQuestionDialog();
                this.getData();
            } else {
                this._commonService.setLoader(false);
                this.toastr.error(result["message"]);
            }
        } else {
            this.toastr.error("Please fill all fields");
            this._commonService.setLoader(false);
        }
    }
    async getData() {
        this.exisitingTime = [];
        let timeRange = [];
        const action = {
            type: "GET",
            target: "shift/",
        };
        const payload = this.pagiPayload;
        if (this.isArcheive === true) {
            payload['restore'] = true;
        } else {
            payload['restore'] = false;
        }
        let result = await this.apiService.apiFn(action, payload);
        if (result["status"]) {
            // console.log("shift listing", result);
            this.count = result["count"];
            this.hasNextPage = result['isNextPage'];
            // this.shiftName = `shift ${this.count + 1}`;
            const dataNFC = result["data"];
            if (dataNFC && dataNFC.length > 0) {
                this.actualDataCount = dataNFC.length;
            }
            result = result["data"].map((item) => {
                timeRange.push({
                    _id: item._id,
                    sTime: moment(item.start_time, "HH:mm").toDate(),
                    eTime: moment(item.end_time, "HH:mm").toDate(),
                });
                for (let i = 0; i < timeRange.length; i++) {
                    // console.log("---stime hour-----", moment(timeRange[i].sTime).hour());
                    // console.log("---etime hour-----", moment(timeRange[i].eTime).hour());
                    if (
                        (moment(timeRange[i].sTime).hour() >= 12 && moment(timeRange[i].eTime).hour() <= 12) || moment(timeRange[i].eTime).isBefore(moment(timeRange[i].sTime))) {
                        let cloned = moment(timeRange[i]["eTime"]).clone();
                        cloned.add(1, "day"); // handle spanning days endTime
                        // console.log("----e change-------", cloned["_d"]);
                        timeRange[i]["eTime"] = cloned["_d"];
                        // if (currentTime.hour() <= 12) {
                        // 	currentTime.add(1, "days"); // handle spanning days currentTime
                        // }
                    }
                    // console.log("---changed------", timeRange[i]);
                }
                this.exisitingTime = timeRange;
                return {
                    ...item,
                    shiftName: item.shift_name,
                    startTime: item.start_time,
                    endTime: item.end_time,
                };
            });
            this.data = result;
            // console.log("--exisiting time---array", this.exisitingTime);
            this.createTable(result);
            this._commonService.setLoader(false);
            this.deleteArr = [];
        }
        this.shiftId = "";
    }
    getServerData(event?: PageEvent) {
        this._commonService.setLoader(true);
        this.pagiPayload.previousPageIndex = event.previousPageIndex;
        this.pagiPayload.pageIndex = event.pageIndex;
        this.pagiPayload.pageSize = event.pageSize;
        this.pagiPayload.length = event.length;
        this.pagiPayload.search = this.search;
        this.pagiPayload["organization"] = this.organization;
        this.pagiPayload["facility"] = this.facility;
        sessionStorage.setItem("pageListing", JSON.stringify({
            shiftList: this.pagiPayload
        }));
        this._commonService.updatePayload(event,'shiftList',this.pagiPayload)
        this.getData();
    }
    sortData(sort?: PageEvent) {
        if (sort["direction"] === "") {
            this.sort.active = sort["active"];
            this.sort.direction = "asc";
            this.sort.sortChange.emit({
                active: sort["active"],
                direction: "asc"
            });
            this.sort._stateChanges.next();
            return;
        }
        this._commonService.setLoader(true);
        this.pagiPayload["sort"] = sort;
        sessionStorage.setItem("pageListing", JSON.stringify({
            nfcList: this.pagiPayload
        }));
        this.getData();
    }
    selectAll() {
        if (this.checked === true) {
            this.data.forEach((element) => {
                element.checked = false;
                this.deleteArr = [];
            });
        } else {
            this.data.forEach((element) => {
                this.deleteArr.push(element._id);
                element.checked = true;
            });
        }
    }
    selectElement(id, check) {
        if (check === true) {
            for (let i = 0; i < this.deleteArr.length; i++) {
                if (this.deleteArr[i] === id) {
                    this.deleteArr.splice(i, 1);
                }
            }
        } else if (check === undefined || check === false) {
            this.deleteArr.push(id);
        }
        if ((this.deleteArr && this.deleteArr.length) < this.actualDataCount) {
            this.checked = false;
        } else if ((this.deleteArr && this.deleteArr.length) === this.actualDataCount) {
            this.checked = true;
        }
    }
    deleteShiftFn(id) {
        this.deleteArr = [];
        const dialogRef = this.dialog.open(AlertComponent, {
            width: '450px',
            panelClass: 'DeleteAlert',
            data: {
                title: "shift",
                id: id,
                API: "shift/delete"
            },
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result["status"]) {
                this.toastr.success(result["message"]);
                this.checked = false;
                this.getServerData(this.pagiPayload);
            }
        });
    }
    viewShiftFn(id) {
        this.router.navigate(["/shifts/view", this._aes256Service.encFnWithsalt(id)]);
    }
    delete() {
        if (this.deleteArr.length === 0) {
            if (this.toastr.currentlyActive === 0) {
                this.toastr.error("Please select shift to be deleted");
                this.checked = false;
            }
        } else {
            const dialogRef = this.dialog.open(AlertComponent, {
                width: '450px',
                panelClass: 'DeleteAlert',
                data: {
                    title: "shift",
                    id: this.deleteArr,
                    API: "shift/delete"
                },
            });
            dialogRef.afterClosed().subscribe((result) => {
                if (result && result["type"] == "success") {
                    this.toastr.success(result["message"]);
                    this.getServerData(this.pagiPayload);
                    this.checked = false;
                } else {
                    this.data.forEach((element) => {
                        element.checked = false;
                        this.checked = false;
                    });
                    this.deleteArr = [];
                }
                this.getServerData(this.pagiPayload);
                document.getElementById("searchInput").focus();
                document.getElementById("searchInput").blur();
            });
        }
    }
    async editShift(id) {
        // console.log("--------------------edit----------------", id);
        // return false;
        this.privilege = 'edit';
        this.isEdit = true;
        //this._commonService.setLoader(true);
        const action = {
            type: "POST",
            target: "shift/view"
        };
        const payload = {
            shiftId: id
        };
        let result = await this.apiService.apiFn(action, payload);
        //let result = await this.apiService.apiFn(action, payload);
        // console.log(result['data'].ntagid);
        // return false;
        this.nfcEdit = result["data"];
        this.nfcEdit._id = result["data"]._id;
        this.nfcEdit.startTime = moment(result["data"].start_time, ["MM-DD-YYYY", "YYYY-MM-DD"]).add(30, "minutes").toDate();
        this.nfcEdit.endTime = moment(result["data"].end_time, ["MM-DD-YYYY", "YYYY-MM-DD"]).add(30, "minutes").toDate();
        this.shiftName = result["data"].shift_name;
        this.startTime = moment(result["data"].start_time, ["MM-DD-YYYY", "YYYY-MM-DD"]).add(30, "minutes").toDate();
        this.endTime = moment(result["data"].end_time, ["MM-DD-YYYY", "YYYY-MM-DD"]).add(30, "minutes").toDate();
        this.shiftId = result["data"]._id;
        // console.log("--------ALL DATE----------", this.startTime, this.endTime);
        // console.log("---format date-------", moment(this.startTime, "HH:mm"), moment(this.endTime, "HH:mm"));
        // console.log("---full date-------", moment(this.startTime, "HH:mm").toDate(), moment(this.endTime, "HH:mm").toDate());
        this._commonService.setLoader(false);
        //this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
        // this.shiftForm.patchValue(this.nfcEdit);
        // console.log(this.shiftForm.patchValue(this.nfcEdit));
        this.addShiftdata();
    }
    addShiftdata() {
        // return;
        if (this.isEdit == false) {
            this.nfcEdit._id = "";
            this.privilege = 'add';
        }
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = "700px";
        dialogConfig.panelClass = "shiftpopup";
        //dialogConfig.disableClose = true;
        dialogConfig.closeOnNavigation = true;
        dialogConfig.autoFocus = false;
        this.temparray = <FormArray>this.shiftForm.controls["shifts"];
        this.dialogRefs = this.dialog.open(this.shiftAdd, dialogConfig);
    }
    closeQuestionDialog() {
        this.dialogRefs.close();
        this.isEdit = false;
        this.shiftName = ''
    }
    compareDate(m) {
        return m.minutes() + m.hours() * 60;
    }

    //Changes Restore Start
    achieve() {
        this.search = '';
        this.pagiPayload.pageIndex = 0;
        this.pagiPayload.previousPageIndex = 0;
        this.isArcheive = true;
        this.getServerData(this.pagiPayload);
    }
    defArchieve() {
        this.search = '';
        this.pagiPayload.pageIndex = 0;
        this.pagiPayload.previousPageIndex = 0;
        this.isArcheive = false;
        this.getServerData(this.pagiPayload);
    }
    deleteRestore() {
        if (this.deleteArr.length === 0) {
            this.toastr.error('Please select shift to be deleted');
            this.checked = false;
        } else {
            const dialogRef = this.dialog.open(RestoreComponent, {
                width: '450px',
                panelClass: 'DeleteAlert',
                data: { 'title': 'restore_user', 'id': this.deleteArr, 'restore_data': 'restore_data', 'API': 'shift/delete' }
            });
            dialogRef.afterClosed().subscribe(result => {
                if (!result) {
                    this.data.forEach(element => {
                        element.checked = false;
                    });
                    this.deleteArr = [];
                    this.checked = false;
                } else {
                    this.toastr.success('Shift restored successfully');
                    this.getServerData(this.pagiPayload);
                    this.checked = false;
                }

                this.restoreButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
                this.restoreButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
                document.getElementById('searchInput').focus();
                document.getElementById('searchInput').blur();
            });
        }
    }
    //Single Restore Button
    restoreDis(id) {
        this.deleteArr = [];
        const dialogRef = this.dialog.open(RestoreComponent, {
            width: '450px',
            panelClass: 'DeleteAlert',
            data: { 'title': 'restore_user', 'id': id, 'restore_data': 'restore_data', 'API': 'shift/delete' }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result != false) {
                if (result['status']) {
                    this.toastr.success('Shift restored successfully');
                }
                this.getServerData(this.pagiPayload);
                this.checked = false;
            }
        });
    }
    //Changes Restore End
    async getTotalCount() {
        this.isClicked = false;
        this.isLoading = true;
        const action = { type: 'GET', target: 'shift/count' };
        const payload = this.pagiPayload;
        const result = await this.apiService.apiFn(action, payload);
        if (result && result['status']) {
          this.isLoading = false;
          this.isClicked = true;
          this.totalCount = result['count'];
        }
    }
    async ngAfterViewChecked(){
        this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled','true');  
    }

}
export interface Element {
    position: number;
    name: string;
    weight: number;
    symbol: string;
}
export interface PagiElement {
    moduleName?:string,
    length: number;
    pageIndex: number;
    pageSize: number;
    previousPageIndex: number;
    search: "";
}
// filter() {}
// 	exportNFC() {}
// 	changeFloor(x, y) {}
// 	changeSector(x) {}
// 	resetFilter() {}
// 	checkAlphanum(x) {}
// 	removeOption(x) {}
// 	addOption() {}
