import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewChecked } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { fromEvent } from 'rxjs';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap
} from 'rxjs/operators';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { ExcelService } from './../../../shared/services/excel.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { CommonService } from './../../../shared/services/common.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, AfterViewChecked {

  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService,
    private toastr: ToastrService
  ) { }


  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  public btnAction: Function;
  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  dataSource;
  displayedColumns = [];
  organiz; floorlist; faclist;
  loader = false;
  count; org_filter; fac_filter;
  isShow: boolean;
  topPosToStartShowing = 100;
  actualDataCount;
  search: any;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  orgSearch='';
  facSearch='';
  isArcheive:boolean=false;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'fac_org',
      value: 'Organization',
      name: 'fac_org.org_name',
      sort: true
    },
    {
      id: 'fac_name',
      value: 'Building',
      sort: true
    }
    , {
      id: 'fac_floor',
      value: 'Floors',
      sort: true
    }
    , {
      id: 'fac_phone1',
      value: 'Phone',
      sort: true
    }];
  exportdata;
  organization; facility;
  pagiPayload: PagiElement = {
    moduleName:'facilityList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: ''
  };
  public show = false;
  fac_name; org_name; seclist;
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  @HostListener('window:scroll')
  checkScroll() {

    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

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
  ngOnInit() {
    if(!this._commonService.checkAllPrivilege('Facility')){
      this.router.navigate(['/']);
    }

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.facilityList) {
        this.pagiPayload.previousPageIndex = pageListing.facilityList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.facilityList.pageIndex;
        this.pagiPayload.pageSize = pageListing.facilityList.pageSize;
        this.pagiPayload.length = pageListing.facilityList.length;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ facilityList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ facilityList: this.pagiPayload }));
    }
    this._commonService.payloadSetup('facilityList',this.pagiPayload)
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
    // Pagination
    this.getServerData(this.pagiPayload);
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

  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select Building to be deleted');
      }
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'facility', 'id': this.deleteArr, 'API': 'facility/delete' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result['status']) {
          this.toastr.success(result['message']);
          this.getServerData(this.pagiPayload);
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
    this.router.navigate(['/facility/form']);
  }

  viewFacility(id) {
    this.router.navigate(['/facility/view', this._aes256Service.encFnWithsalt(id)]);
  }

  editFacility(id) {
    this.router.navigate(['/facility/form', this._aes256Service.encFnWithsalt(id)]);
  }

  async toggle() {
    this.show = !this.show;
    const action = { type: 'GET', target: 'organization/orglist' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = result['data'];
  }

  async changeOrg(org, type) {
    this.facility = '';
    this.pagiPayload = {
      moduleName:'facilityList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.search
    };
    this.org_name = org.org_name;
    this.org_filter = org._id;
    this.pagiPayload['org_name'] = this.org_name;
    this.pagiPayload['org_filter'] = this.org_filter;
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    const action = { type: 'GET', target: 'facility/faclist' };
    this.getServerData(this.pagiPayload);
    const payload = { 'org_id': org._id };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = result['data'];
  }

  async changeFac(fac, type) {
    this.pagiPayload = {
      moduleName:'facilityList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.search
    };
    this.fac_name = fac.fac_name;
    const action = { type: 'GET', target: 'floorsector/floorsector_list' };
    const payload = { 'facId': fac._id };
    const result = await this.apiService.apiFn(action, payload);
    const secFac = result['data'];
    const _floors = [];
    this.floorlist = secFac.map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.floor;
      rObj['value'] = obj._id;
      rObj['sector'] = obj.sector;
      return rObj;
    });
    this.fac_filter = fac._id;
    this.pagiPayload['org_name'] = this.org_name;
    this.pagiPayload['fac_name'] = fac.fac_name;
    this.pagiPayload['fac_filter'] = this.fac_filter;
    delete this.pagiPayload['floor'];
    this.getServerData(this.pagiPayload);
  }

  deleteFacility(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'facility', 'id': this.deleteItem, 'API': 'facility/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }

    });
  }

  async exportFacility() {

    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'facility/export'
    };
    let _selectedUser={selectedUser:this.deleteArr}
    const payload =  {..._selectedUser, ...this.pagiPayload };
    let result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      const data = result['data'];
      this.exportdata = data;
      const facility = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(facility, 'Facility_Report');
    }
  }

  prepareUsersForCSV() {
    const facility = [];
    this.exportdata.forEach(item => {
      facility.push({
        'Facility': item.fac_name ? item.fac_name : '-',
        'Organization': item.fac_org ? item.fac_org['org_name'] : '-',
        'Floor': item.fac_floor ? item.fac_floor : '-',
        'Phone 1': item.fac_phone1 ? item.fac_phone1 : '-',
        'Phone 2': item.fac_phone2 ? item.fac_phone2 : '-',
        'Address 1': item.fac_address1 ? item.fac_address1 : '-',
        'Address 2': item.fac_address2 ? item.fac_address2 : '-',
        'City': item.fac_city ? item.fac_city : '-',
        'State': item.fac_state ? item.fac_state : '-',
        'Zip 1': item.fac_zip1 ? item.fac_zip1 : '-',
        'Zip 2': item.fac_zip2 ? item.fac_zip2 : '-'
      });
    });
    this._commonService.setLoader(false);
    return facility;
  }
  public async getFacilityDataFunction() {

    const action = {
      type: 'GET',
      target: 'facility'
    };

    const payload = this.pagiPayload;
    if(this.isArcheive === true){
      payload['restore_delete']=true;
    }else{
      payload['restore_delete']=false;
    }
    let result = await this.apiService.apiFn(action, payload);

    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      if ((!result['data']['_facility'] || result['data']['_facility'].length === 0) && this.pagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        result = result['data']['_facility'].map(item => {
          return {
            ...item,
            fac_name: item.fac_name,
            fac_org: item.fac_org ? item.fac_org['org_name'] : '--',
            fac_floor: item.fac_floor,
            fac_phone1: item.fac_phone1
          };
        });
        this.data = result;
        this.createTable(result);
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
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
    sessionStorage.setItem('pageListing', JSON.stringify({ facilityList: this.pagiPayload }));
    this.getFacilityDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({ facilityList: this.pagiPayload }));
    this._commonService.updatePayload(event,'facilityList',this.pagiPayload)
    this.getFacilityDataFunction();
  }

  resetFilter() {
    this.show = false;
    this.organization = '';
    this.facility = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    this.getServerData(this.pagiPayload);
  }

  //Start Fac restore changes
  achieve() {
    this.show = false;
    this.search='';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=true;
    this.getServerData(this.pagiPayload);
  }
  //reset default
  defArchieve() {
    this.show = false;
    this.search='';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=false;
    this.getServerData(this.pagiPayload);
  }

  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select Building to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr,'restore_data': 'restore_data' ,'API': 'facility/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Facility restored successfully');
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
  restoreFac(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'restore_user', 'id': this.deleteItem,'restore_data': 'restore_data', 'API': 'facility/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success('Facility restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  //End Fac restore changes

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
    const action = { type: 'GET', target: 'facility/count' };
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
  moduleName?:string,
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
}

