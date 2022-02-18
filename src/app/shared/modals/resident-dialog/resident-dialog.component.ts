import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
  PageEvent,
} from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
@Component({
  selector: 'app-resident-dialog',
  templateUrl: './resident-dialog.component.html',
  styleUrls: ['./resident-dialog.component.scss'],
})
export class ResidentDialogComponent implements OnInit {

  dialogConfig = new MatDialogConfig();
  residentSearch = '';
  subscription: Subscription = new Subscription();
  residentPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' }
  };
  selectedResidentData: any;
  residentData;
  facility;
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };
  search: string;
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<ResidentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  async ngOnInit() {
    this.subscription = await this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.residentPagiPayload['fac_id'] = this.facility = contentVal.fac;
        this.pagiPayload['facId'] = this.facility = contentVal.fac;
        await this.getResidentServerData(this.residentPagiPayload);
      }
    });
    if (this.data && this.data.orderType) {
      console.log(this.data)
    }
  }

  public async getResidentUsersDataFunction() {
    // this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'residents/list_resident_medication'
    };
    this.residentPagiPayload['fac_id'] = this.facility;
    this.residentPagiPayload['listType'] = 'dropdownView';
    const payload = this.residentPagiPayload;
    // console.log('getResidentUsersDataFunction payload----->', payload);
    const result = await this.apiService.apiFn(action, payload);
    // console.log('api residentData---->', result['data']['_residents']);

    if (result['status']) {
      this.residentData = await result['data']['_residents'].map(function (item) {
        const obj = {};
        obj['value'] = item.last_name + ', ' + item.first_name;
        obj['key'] = item._id;
        obj['facId'] = item.facility[0].fac;
        obj['room'] = item.room;
        return obj;
      });
      if (this.selectedResidentData) {
        const index = this.residentData.findIndex(item => item.key === this.selectedResidentData.key);
        if (index === -1) {
          this.residentData.push(this.selectedResidentData);
        }
      }
    }
    this.commonService.setLoader(false);
  }

  public async getResidentServerData(event?: PageEvent) {
    this.residentPagiPayload.previousPageIndex = event.previousPageIndex;
    this.residentPagiPayload.pageIndex = event.pageIndex;
    this.residentPagiPayload.pageSize = event.pageSize;
    this.residentPagiPayload.length = event.length;
    this.residentPagiPayload.search = this.residentSearch;
    this.getResidentUsersDataFunction();
  }

  async filterResident(event) {
    this.residentSearch = event;
    await this.getResidentServerData(this.residentPagiPayload);
  }

  async openSelectDropdown(event) {
    if (event === true) {
      this.residentSearch = '';
      await this.getResidentServerData(this.residentPagiPayload);
    }
  }

  selectResidentName(data, facId) {
    this.selectedResidentData = data;
    console.log("Resident Data",this.selectedResidentData);
  }

  async filterResidentData(event) {
    console.log('residentSearch--->', this.residentSearch);
    this.residentPagiPayload['search'] = this.residentSearch;
    await this.getResidentServerData(this.residentPagiPayload);
  }

  cancel() {
    this._dialogRef.close({ orderType: this.data.orderType, residentId: null });
  }

  done(){
    this._dialogRef.close({ orderType: this.data.orderType, residentId: this.selectedResidentData.key });
  }
}