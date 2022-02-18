import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewChecked } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { ToastrService } from 'ngx-toastr';
import { fromEvent } from 'rxjs';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap
} from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, AfterViewChecked {

  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  public btnAction: Function;
  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  dataSource; sector;
  displayedColumns = [];
  organization; facility; floor;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  exportdata; checked;
  deleteArr = [];
  isShow: boolean;
  topPosToStartShowing = 100;
  deleteItem = [];
  data;
  count: Number;
  actualDataCount;
  search: any;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  floor_name; org_filter; fac_filter; floor_filter;
  floSearch = '';
  secSearch = '';
  isArcheive: boolean = false;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'floor',
      value: 'Floor',
      sort: true
    }
    , {
      id: 'sector',
      value: 'Sector',
      sort: false
    },
    {
      id: 'zones',
      value: 'Total Zones'
    }
  ];

  pagiPayload: PagiElement = {
    moduleName: 'fsList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: ''
  };

  public show = false; organiz;
  org_name; faclist;
  fac_name; floorlist; seclist;
  private subscription: Subscription;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) { }
  @HostListener('window:scroll')
  checkScroll() {
    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop returns
    // the same result in all the cases. window.pageYOffset is not supported below IE 9.
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
      behavior: 'smooth'
    });
  }

  async ngOnInit() {

    if (!this._commonService.checkAllPrivilege('Floors/Sectors')) {
      this.router.navigate(['/']);
    }

    this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.fsList) {

        this.pagiPayload.previousPageIndex = pageListing.fsList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.fsList.pageIndex;
        this.pagiPayload.pageSize = pageListing.fsList.pageSize;
        this.pagiPayload.length = pageListing.fsList.length;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ fsList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ fsList: this.pagiPayload }));
    }

    this._commonService.payloadSetup('fsList', this.pagiPayload)
    this.search = this.searchInput.nativeElement.value;
    // searching
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        // tslint:disable-next-line:max-line-length
        debounceTime(2000), // The user can type quite quickly in the input box, and that could trigger a lot of server requests. With this operator, we are limiting the amount of server requests emitted to a maximum of one every 150ms
        distinctUntilChanged(), // This operator will eliminate duplicate values
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this._commonService.setLoader(true);
    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.show = false;
        this.floor = null;
        this.floorlist = null;
        this.seclist = null;
        this.sector = null;
        delete this.pagiPayload['org_name'];
        delete this.pagiPayload['fac_name'];
        delete this.pagiPayload['floor'];
        delete this.pagiPayload['sector'];
        delete this.pagiPayload['org_filter'];
        delete this.pagiPayload['fac_filter'];
        delete this.pagiPayload['floor_filter'];
        delete this.pagiPayload['sector_filter'];
        this.pagiPayload['organization'] = this.organization = contentVal.org;
        this.pagiPayload['facility'] = this.facility = contentVal.fac;
        this.floorlist = contentVal.floorlist;
        // Pagination
        this.getServerData(this.pagiPayload);
      }
    });
    this.subscription = this._commonService.floorcontentdata.subscribe(async (data: any) => {
      if (data) {
        this.floorlist = data;
      }
    });
  }


  async changeFac(fac, type) {
    this.pagiPayload = {
      moduleName: 'fsList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.search
    };
    this.fac_name = fac.fac_name;
    this.fac_filter = fac._id;
    this.floorlist = this.floorlist;
    this.pagiPayload['org_name'] = this.org_name;
    this.pagiPayload['fac_name'] = this.fac_name;
    this.pagiPayload['fac_filter'] = this.fac_filter;
    this.pagiPayload['floor'] = '';
    this.pagiPayload['floor_filter'] = '';
    this.pagiPayload['sector_filter'] = '';
    this.getServerData(this.pagiPayload);
  }

  async changeFloor(floor, type) {
    this.sector = '';
    this.pagiPayload = {
      moduleName: 'fsList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.search
    };
    const _secList = [];
    this.seclist = this.floorlist.map(function (it) {
      if (it.value === floor.value) {
        it['sector'].map(function (item) {
          _secList.push(item);
        });
      }
    });
    this.seclist = _secList.map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.name;
      rObj['value'] = obj._id;
      return rObj;
    });
    this.floor_name = floor.value;
    this.floor_filter = floor._id;
    this.pagiPayload['org_name'] = this.org_name;
    this.pagiPayload['fac_name'] = this.fac_name;
    this.pagiPayload['floor'] = this.floor_name;
    this.pagiPayload['floor_filter'] = this.floor_filter;
    this.pagiPayload['organization'] = this.organization;
    this.pagiPayload['facility'] = this.facility;
    this.getServerData(this.pagiPayload);
  }

  async changeSector(sector, type) {
    this.pagiPayload['sector'] = sector.label;
    this.pagiPayload['sector_filter'] = sector.value;
    this.getServerData(this.pagiPayload);
  }

  toggle() {
    this.show = !this.show;
  }

  //Start Floor/Sector Changes restore
  achieve() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    this.search = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    delete this.pagiPayload['floor_filter'];
    delete this.pagiPayload['sector_filter'];
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = true;
    this.getServerData(this.pagiPayload);
  }
  defArchieve() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    this.search = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    delete this.pagiPayload['floor_filter'];
    delete this.pagiPayload['sector_filter'];
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = false;
    this.getServerData(this.pagiPayload);
  }

  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select floors/sectors to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr, 'restore_data': 'restore_data', 'API': 'floorsector/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Floor/Sector restored successfully');
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
  restoreFloSec(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'restore_user', 'id': this.deleteItem, 'restore_data': 'restore_data', 'API': 'floorsector/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.deleteItem = [];
        this.toastr.success('Floor/Sector restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  //End Floor/Sector Changes restore

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

  addForm() { // Custom-code!
    this.router.navigate(['/floorsector/form']);
  }

  selectAll() {
    if (this.checked === true) {
      this.data.forEach(element => {
        element.checked = false;
        this.deleteArr = [];
      });
    } else {
      this.data.forEach(element => {
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

  public async getFloorSectorDataFunction() {
    const action = {
      type: 'GET',
      target: 'floorsector'
    };
    const payload = this.pagiPayload;
    if (this.isArcheive === true) {
      payload['restore_delete'] = true;
    } else {
      payload['restore_delete'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      if ((!result['data']['_floorsector'] || result['data']['_floorsector'].length === 0) && this.pagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        result = result['data']['_floorsector'].map(item => {
          return {
            ...item,
            floor: item.floor != null ? item.floor : '--',
            sector: item.sector ? (item['sector'].map(itm => itm.name).toString()).replace(/,/g, ', ') : '--',
          };
        });
        this.data = result;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.createTable(result);
        this.checked = false;
        this.deleteArr = [];
        this._commonService.setLoader(false);
      }
    }
  }

  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem('pageListing', JSON.stringify({ fsList: this.pagiPayload }));
    this.getFloorSectorDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({ fsList: this.pagiPayload }));
    this._commonService.updatePayload(event, 'fsList', this.pagiPayload)
    this.getFloorSectorDataFunction();
  }

  viewFloorsector(id) {
    this.router.navigate(['/floorsector/view', this._aes256Service.encFnWithsalt(id)]);
  }

  async exportFloorsector() {
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'floorsector/export'
    };
    let _selectedUser = { selectedUser: this.deleteArr }
    const payload = { ..._selectedUser, ...this.pagiPayload };
    let result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      const data = result['data'];
      this.exportdata = data;
      const floorsector = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(floorsector, 'Floorsector_Report');
    }
  }

  prepareUsersForCSV() {
    const floorsector = [];
    this.exportdata.forEach(item => {
      floorsector.push({
        'Floor': item.floor != null ? item.floor : '-',
        'Organization': (item.fac_id && item['fac_id']['fac_org']) ? item['fac_id']['fac_org']['org_name'] : '-',
        'Facility': item.fac_id ? item['fac_id']['fac_name'] : '-',
        'sector': item['sector'] ? item['sector'].map(itm => itm.name).toString() : '--'
      });
    });
    this._commonService.setLoader(false);
    return floorsector;
  }

  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select floors/sectors to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { 'title': 'floor/sector', 'id': this.deleteArr, 'API': 'floorsector/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result['status']) {
          this.deleteArr = [];
          this.toastr.success(result['message']);
          this.getServerData(this.pagiPayload);
          this.facilityFloorUpdated(this.organization, this.facility)
          this.checked = false;
        } else {
          this.data.forEach(element => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  async facilityFloorUpdated(org, fac) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'users/set_selected_fac' },
      { org: org, fac: fac }
    )
      .then((result: any) => {

        this.floorlist = result.data.map(function (obj) {
          const rObj = {};
          rObj['label'] = obj.floor;
          rObj['value'] = obj._id;
          rObj['sector'] = obj.sector;
          return rObj;
        });
        let facilityData = [];
        if (result.facilityData) {
          facilityData = result.facilityData
        }
        this._commonService.setOrgFac({ org: org, fac: fac }, this.floorlist, facilityData);
        this._commonService.setFloor(this.floorlist);

      });
  }
  deleteFloorsector(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'floor/sector', 'id': this.deleteItem, 'API': 'floorsector/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.deleteItem = [];
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.facilityFloorUpdated(this.organization, this.facility)
        this.checked = false;
      }
    });
  }

  editFloorsector(id) {
    this.router.navigate(['./floorsector/form', this._aes256Service.encFnWithsalt(id), this._aes256Service.encFnWithsalt(this.organization), this._aes256Service.encFnWithsalt(this.facility)]);
  }

  resetFilter() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    delete this.pagiPayload['floor_filter'];
    delete this.pagiPayload['sector_filter'];
    this.getServerData(this.pagiPayload);
  }

  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'floorsector/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
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
  moduleName?: string,
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
}

