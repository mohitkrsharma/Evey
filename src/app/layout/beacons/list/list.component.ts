import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource, MatPaginator, MatSort, PageEvent } from '@angular/material';
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
import { CommonService } from './../../../shared/services/common.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

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
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) { }

  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  public btnAction: Function;
  count; floor_name;
  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  bulkorg; bulkfac;
  public show = false;
  public buttonName: any = 'Show';
  exportdata;
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organiz; faclist; floorlist; seclist;
  isArcheive: boolean =false;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('searchInput', {static: true}) searchInput!: ElementRef;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  filedata;
  actualDataCount;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true
    },
    // , {
    //   id: 'type',
    //   value: 'Type',
    //   sort: true
    // },
    {
      id: 'floor',
      value: 'Floor',
      sort: true
    }, {
      id: 'sector',
      value: 'Sector',
      sort: true
    }
    , {
      id: 'room',
      value: 'Assignment',
      sort: true
    }
    , {
      id: 'acceptable_range',
      value: 'Acceptable Range',
      sort: true
    }
    , {
      id: 'battery',
      value: 'Battery %',
      sort: true
    }
  ];
  arr = [];
  bulk; organization; facility; floor;
  org_name; fac_name;
  sector;
  pagiPayload: PagiElement = {
    moduleName:'beaconList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: ''
  };
  search: any;
  floSearch='';
  secSearch='';
  private subscription: Subscription;
  floor_filter; org_filter; fac_filter;
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;

  @HostListener('window:scroll')
  checkScroll() {
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
    if(!this._commonService.checkAllPrivilege('Beacons')){
      this.router.navigate(['/']);
    }
    this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.beaconList) {
        this.pagiPayload.previousPageIndex = pageListing.beaconList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.beaconList.pageIndex;
        this.pagiPayload.pageSize = pageListing.beaconList.pageSize;
        this.pagiPayload.length = pageListing.beaconList.length;

      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ beaconList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ beaconList: this.pagiPayload }));
    }
    this._commonService.payloadSetup('beaconList',this.pagiPayload)
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
    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {

      if (contentVal.org && contentVal.fac) {
        this.floor = '';
        this.sector = '';
        this.seclist = null;
        this.floorlist = null;

        this.pagiPayload['organization'] = contentVal.org;
        this.pagiPayload['facility'] = contentVal.fac;

        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        const action = { type: 'GET', target: 'floorsector/floorsector_list' };
        const payload = { 'facId': this.facility };
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
        this._commonService.setLoader(true);

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



  download() {
    for (let i = 0; i < 10; i++) {
      this.arr.push({});
    }
    const users = this.prepareForCSV();
    this.excelService.exportAsExcelFile(users, 'Add beacon');

  }

  prepareForCSV() {
    const beacon = [];
    this.arr.forEach(item => {
      beacon.push({
        'Beacon Name': null,
        'Major': null,
        'Minor': null,
        'Beacon Type': null,
        'Acceptable Range': null,
        'Beacon ID': null
      });
    });
    return beacon;
  }


  toggle() {
    this.show = !this.show;
    this.bulk = false;
    this.floor = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
  }

  //Restore Changes Start
  achieve() {
    this.show = false;
    this.bulk = false;
    this.floor = '';
    this.search='';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=true;
    this.getServerData(this.pagiPayload);
  }

   defArchieve() {
    this.bulk = false;
    this.show = false;
    this.floor = '';
    this.search='';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=false;
    this.getServerData(this.pagiPayload);
  }

  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select beacons to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr,'restore_data': 'restore_data' ,'API': 'beacons/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Beacons restored successfully');
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
  restoreBeacon(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'restore_user', 'id': this.deleteItem,'restore_data': 'restore_data', 'API': 'beacons/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.deleteItem = [];
        this.toastr.success('Beacon restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  //Restore Changes End

  uploadbulk() {
    this.bulk = !this.bulk;
    this.show = false;
    this.floor = '';

    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
  }

  async onFileChange(event, floor, sector) {
    this._commonService.setLoader(true);
    const filesData = event.target.files;
    const filetype = filesData[0].name.split('.');
    if (filetype[1] === 'xlsx' || filetype[1] === 'xls') {
      const formData = new FormData();
      formData.append('username', 'test');

      const fd = new FormData();
      fd.append('file', filesData[0]);
      fd.append('organization', this.organization);
      fd.append('facility', this.facility);


      const action = { type: 'FORMDATA', target: 'beacons/upload' };
      const payload = fd;

      const result = await this.apiService.apiFn(action, payload);
      this._commonService.setLoader(false);
      if (result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      } else {
        this.toastr.error(result['message']);
      }

      this.show = false;
      this.floor = '';
      delete this.pagiPayload['org_name'];
      delete this.pagiPayload['fac_name'];
      delete this.pagiPayload['floor'];
      this.bulk = false;
      this.filedata = '';
    } else {
      this._commonService.setLoader(false);
      this.filedata = '';
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Use the sample data format for uploading beacons');
      }
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
        this.toastr.error('Please select beacons to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'beacons', 'id': this.deleteArr, 'API': 'beacons/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result['status']) {
          this.deleteArr = [];
          this.toastr.success(result['message']);
          this.checked = false;
          this.getServerData(this.pagiPayload);
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

  async changeFac(fac, type) {
    this.filedata = '';
    if (type === 'bulk') {
      this.bulkfac = fac.value;
      const action = { type: 'GET', target: 'floorsector/floorsector_list' };
      const payload = { 'facId': fac.value };
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
    } else {
      this.bulkfac = fac.value;
      this.floor = '';
      delete this.pagiPayload['floor'];
      this.pagiPayload = {
        moduleName:'beaconList',
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        search: this.search
      };
      this.fac_name = fac.label;
      const action = { type: 'GET', target: 'floorsector/floorsector_list' };
      const payload = { 'facId': fac.value };
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

      this.fac_filter = fac.value;
      this.pagiPayload['org_name'] = this.org_name;
      this.pagiPayload['fac_name'] = this.fac_name;

      this.pagiPayload['org_filter'] = this.org_filter;
      this.pagiPayload['fac_filter'] = this.fac_filter;
      if (type === 'filter') {
        this.getServerData(this.pagiPayload);
      }
    }

  }

  async changeFloor(floor, type) {
    this.filedata = '';
    this.sector = '';
    if (type === 'bulk') {
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
    } else {

      this.pagiPayload = {
        moduleName:'beaconList',
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
      this.floor_name = floor.label;
      this.floor_filter = floor.value;
      this.pagiPayload['org_name'] = this.org_name;
      this.pagiPayload['fac_name'] = this.fac_name;
      this.pagiPayload['floor'] = this.floor_name;

      this.pagiPayload['org_filter'] = this.org_filter;
      this.pagiPayload['fac_filter'] = this.fac_filter;
      this.pagiPayload['floor_filter'] = this.floor_filter;
      this.pagiPayload['organization'] = this.organization;
      this.pagiPayload['facility'] = this.facility;
      this.getServerData(this.pagiPayload);
    }

  }


  async changeSector(sector, type) {
    this.pagiPayload['sector'] = sector.value;
    if (type !== 'bulk') {
      this.getServerData(this.pagiPayload);
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
    this.router.navigate(['/beacons/form']);
  }

  async deleteBeacon(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'beacon', 'id': this.deleteItem, 'API': 'beacons/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.deleteItem = [];
        this.toastr.success(result['message']);
        this.checked = false;
        this.getServerData(this.pagiPayload);
      }
    });
  }

  async viewBeacon(id) {
    this.router.navigate(['/beacons/view', this._aes256Service.encFnWithsalt(id) ]);
  }

  async editBeacon(id) {
    this.router.navigate(['/beacons/edit', this._aes256Service.encFnWithsalt(id) ]);
  }

  public async getBeaconDataFunction() {

    const action = {
      type: 'GET',
      target: 'beacons'
    };
    const payload = this.pagiPayload;
     if(this.isArcheive === true){
      payload['restore_delete']=true;
    }else{
      payload['restore_delete']= false;
    }
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      if ((!result['data']['_beacon'] || result['data']['_beacon'].length === 0) && this.pagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        const dataBeacon = result['data']['_beacon'];
        if (dataBeacon && dataBeacon.length > 0) {
          this.actualDataCount = dataBeacon.length;
        }
        result = result['data']['_beacon'].map(item => {
          return {
            ...item,
            floor: item.floor ? item.floor : '--',
            sector: item.sectorData && item.sectorData[0] ? (item['sectorData'][0].map(itm => (itm._id === item.sector) ? itm.name : '').toString()).replace(/,/g, '') : '--',
          };
        });
        this.data = result;
        this.createTable(result);
        this._commonService.setLoader(false);
        this.deleteArr = [];
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
    sessionStorage.setItem('pageListing', JSON.stringify({ beaconList: this.pagiPayload }));
    this.getBeaconDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({ beaconList: this.pagiPayload }));
    this._commonService.updatePayload(event,'beaconList',this.pagiPayload)
    this.getBeaconDataFunction();

  }

  async exportBeacon() {

    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'beacons/export'
    };
    
    let _selectedUser={selectedUser:this.deleteArr}
    const payload =  {..._selectedUser, ...this.pagiPayload };
    let result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      const data = result['data'];
      this.exportdata = data;
      const beacon = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(beacon, 'Beacon_Report');
    }
  }

  resetFilter() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    this.seclist = '';

    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];

    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    delete this.pagiPayload['floor_filter'];
    delete this.pagiPayload['sector'];

    this.getServerData(this.pagiPayload);
  }

  prepareUsersForCSV() {
    const beacon = [];
    this.exportdata.forEach(item => {
      beacon.push({
        'Name': item.name,
        'Major': item.major,
        'Minor': item.minor,
        'Battery': item.battery,
        'Beacon Type': item.beacon_type,
        'Organization': item.organization ? item.organization['org_name'] : '--',
        'Facility': item.facility ? item.facility['fac_name'] : '--',
        'Floor': item.floor ? item.floor[0] : '--',
        'Zone': item.room ? item.room['room'] : '--',
        // tslint:disable-next-line: max-line-length
        'Sector': item.sectorData && item.sectorData[0] ? (item['sectorData'][0].map(itm => (itm._id === item.sector) ? itm.name : '').toString()).replace(/,/g, '') : '--',
        'Acceptable Range': item.acceptable_range ? item.acceptable_range : '--',
        'Area Type': item.area_type ? item.area_type : '--',
        'Deleted': item.deleted ? 'Yes' : 'No'
      });
    });
    this._commonService.setLoader(false);
    return beacon;
  }

  // searching
  onChange(item, event) {
    this.search = item;
    this.search
      .debounceTime(2000)
      .distinctUntilChanged()
      .mergeMap(search => this.getServerData(this.pagiPayload))
      .subscribe(() => { });
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'beacons/count' };
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
