import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewChecked } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
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
import { SocketService } from '../../../shared/services/socket/socket.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { CommonService } from './../../../shared/services/common.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, AfterViewChecked {
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  public btnAction: Function;
  exportdata;
  search: any;
  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;

  dataSource;
  displayedColumns = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  isShow: boolean;
  topPosToStartShowing = 100;
  actualDataCount;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  isArcheive:boolean=false;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'org_name',
      value: 'Organization',
      sort: true
    }
    , {
      id: 'org_phone1',
      value: 'Phone',
      sort: true
    }
    , {
      id: 'org_city',
      value: 'City',
      sort: true
    }
    , {
      id: 'org_website',
      value: 'Website',
      sort: true
    }];
  count;
  pagiPayload: PagiElement = {
    moduleName:'orgList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: ''
  };
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
    private socketService: SocketService,
    public _commonService: CommonService
  ) { }
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
    if(!this._commonService.checkAllPrivilege('Organization')){
      this.router.navigate(['/']);
    }
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.orgList) {
        this.pagiPayload.previousPageIndex = pageListing.orgList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.orgList.pageIndex;
        this.pagiPayload.pageSize = pageListing.orgList.pageSize;
        this.pagiPayload.length = pageListing.orgList.length;
        // this.pagiPayload = pageListing.orgList;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ orgList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ orgList: this.pagiPayload }));
    }

    this._commonService.payloadSetup('orgList',this.pagiPayload)
    this.search = this.searchInput.nativeElement.value;
    // searching
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        // tslint:disable-next-line:max-line-length
        debounceTime(2000), // The user can type quite quickly in the input box, and that could trigger a lot of server requests. With this operator, we are limiting the amount of server requests emitted to a maximum of one every 150ms
        distinctUntilChanged(), // This operator will eliminate duplicate values
        tap(() => {
          this.getServerData(this.pagiPayload);
          // this.paginator.pageIndex = 0;
          // this.loadClientsList();
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
    // this.socketService.sendMessage({ payload: 'Socket Testing' });

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
    this.router.navigate(['/org/form']);
  }

  viewOrganization(id) {
    this.router.navigate(['/org/view', this._aes256Service.encFnWithsalt(id)]);
  }

  editOrganization(id) {
    this.router.navigate(['/org/form', this._aes256Service.encFnWithsalt(id)]);
  }

  deleteOrganization(id) {
    this.deleteArr = [];
    this.deleteArr.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'organization', 'id': this.deleteArr, 'API': 'organization/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }

    });
  }

  async exportOrganization() {
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'organization/export'
    };
    let _selectedUser={selectedUser:this.deleteArr}
    const payload =  {..._selectedUser, ...this.pagiPayload };
    let result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      const data = result['data'];
      this.exportdata = data;
      const facility = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(facility, 'Organization_Report');
    }
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
        this.toastr.error('Please select organization to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'organization', 'id': this.deleteArr, 'API': 'organization/delete' }
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


  prepareUsersForCSV() {
    const organization = [];
    this.exportdata.forEach(item => {
      organization.push({
        'Organization': item.org_name ? item.org_name : '-',
        'Website': item.org_website ? item.org_website : '-',
        'Phone 1': item.org_phone1 ? item.org_phone1 : '-',
        'Phone 2': item.org_phone2 ? item.org_phone2 : '-',
        'Address 1': item.org_address1 ? item.org_address1 : '-',
        'City': item.org_city ? item.org_city : '-',
        'State': item.org_state ? item.org_state : '-',
        'Zip 1': item.org_zip1 ? item.org_zip1 : '-',
        'Zip 2': item.org_zip2 ? item.org_zip2 : '-',
        'Latitude': item.org_lat ? item.org_lat : '-',
        'Longitude': item.org_long ? item.org_long : '-',
        'UUID': item.uuid ? item.uuid : '-'
      });
    });
    this._commonService.setLoader(false);
    return organization;
  }
  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  //Start Restore Function
  achieve() {
    this.search='';
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=true;
    this.getServerData(this.pagiPayload);
  }
  //reset default
  defArchieve() {
    this.search='';
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=false;
    this.getServerData(this.pagiPayload);
  }
  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select organization to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr,'restore_data': 'restore_data' ,'API': 'organization/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Organization restored successfully');
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
  restoreOrg(id) {
    this.deleteArr = [];
    this.deleteArr.push(id);
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'restore_user', 'id': this.deleteArr,'restore_data': 'restore_data', 'API': 'organization/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success('Organization restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  //End Restore Function
  public async getOrgDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'organization'
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
      if ((!result['data']['_organization'] || result['data']['_organization'].length === 0) && this.pagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        this.data = result['data']['_organization'];
        this.createTable(result['data']['_organization']);
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }

        this.checked = false;
        this.deleteArr = [];
        this._commonService.setLoader(false);
      }
    } else {

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
    sessionStorage.setItem('pageListing', JSON.stringify({ orgList: this.pagiPayload }));
    this.getOrgDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({ orgList: this.pagiPayload }));
    this._commonService.updatePayload(event,'orgList',this.pagiPayload)
    this.getOrgDataFunction();
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'organization/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    console.log('result', result);
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
