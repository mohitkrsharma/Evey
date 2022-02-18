import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatPaginator,
} from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { ExcelService } from './../../../shared/services/excel.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent } from 'rxjs';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from 'rxjs/operators';
import { ThrowStmt } from '@angular/compiler';
import { Subscription } from 'rxjs';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { UserAccess } from 'src/app/shared/models/userAccess';

// import { setTimeout } from 'timers';

// import { save } from 'save-file'

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('searchInput', {static: true}) searchInput!: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  public btnAction: Function;
  exportdata;
  bulk = false;
  // MATPAGINATOR
  // pageEvent: PageEvent;
  pageIndex: number;
  pageSize: number;
  length: number;
  isShow: boolean;
  topPosToStartShowing = 100;
  facility;
  organization;
  floor;
  dataSource;
  displayedColumns = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  data;
  checked;
  deleteArr = [];
  deleteItem = [];
  zone_residents;
  filedata;
  bulkorg;
  bulkfac;
  bulkfloor;
  bulksec;
  search: any;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  actualDataCount;
  ready = false;
  floSearch = '';
  secSearch = '';
  isArcheive: boolean = false;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'room',
      value: 'Zone',
      sort: true,
    },
    // {
    //   id: 'type',
    //   value: 'Type',
    //   sort: true,
    // },
    {
      id: 'residents_id',
      value: 'Residents',
      sort: true,
    },
    {
      id: 'floor',
      value: 'Floor',
      sort: true,
    },
    {
      id: 'sector',
      value: 'Sector',
      sort: true,
    },
  ];

  count;
  pagiPayload: PagiElement = {
    moduleName: 'zoneList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'room', direction: 'asc' },
  };
  floor_name;
  sector;
  public show = false;
  organiz;
  faclist;
  org_name;
  fac_name;
  floorlist;
  seclist;
  downloadUrl;
  org_filter;
  fac_filter;
  floor_filter;
  sector_filter;
  private subscription: Subscription;
  public userAccess: UserAccess = new UserAccess();
  public isClicked: boolean = false;
  public isLoading: boolean = false;
  public totalCount: any;
  hasNextPage: boolean = false;
  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) {}
  @HostListener('window:scroll')
  checkScroll() {
    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases.
    // window.pageYOffset is not supported below IE 9.

    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

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
      behavior: 'smooth',
    });
  }

  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    if (!this._commonService.checkAllPrivilege('Zones')) {
      this.router.navigate(['/']);
    }
    this.getUserAccess();
    this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.zoneList) {
        this.pagiPayload.previousPageIndex =
          pageListing.zoneList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.zoneList.pageIndex;
        this.pagiPayload.pageSize = pageListing.zoneList.pageSize;
        this.pagiPayload.length = pageListing.zoneList.length;
        this.pagiPayload.sort = pageListing.zoneList.sort;
        this.pagiPayload.search = pageListing.zoneList.search;
        this.search = pageListing.zoneList.search;
        // this.pagiPayload = pageListing.zoneList;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ zoneList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ zoneList: this.pagiPayload })
      );
    }

    this._commonService.payloadSetup('zoneList', this.pagiPayload);
    
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
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.displayedColumns = this.displayedColumns.concat(['ready']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    this.subscription = this._commonService.contentdata.subscribe(
      (contentVal: any) => {
        if (contentVal.org && contentVal.fac && contentVal.floorlist) {
          this.floor = '';
          this.sector = '';
          this.seclist = null;
          this.floorlist = contentVal.floorlist;
          this.organization = this.pagiPayload['organization'] = contentVal.org;
          this.facility = this.pagiPayload['facility'] = contentVal.fac;

          // Pagination
          this.getServerData(this.pagiPayload);
          // this.changeFac(this.facility, 'filter')
        }
      }
    );

    this.subscription = this._commonService.floorcontentdata.subscribe(async data => {
      if (data) this.floorlist = data;
    });
    // this._commonService.setLoader(false);
  }

  async changeOrg(org, type) {
    if (type === 'bulk') {
      this.bulkorg = org.value;
      await this.apiService.apiFn({ type: 'GET', target: 'facility/faclist' }, { 'org_id': org.value })
      .then(async (result: any) => {
        this._commonService.setLoader(false);
        this.faclist = await result.data.map((obj) => {
          return {
            'label': obj.fac_name,
            'value': obj._id
          }
        });
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });
    } else {
      this.facility = '';
      this.floor = '';
      this.org_name = org.label;
      this.pagiPayload = {
        moduleName: 'zoneList',
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        search: this.search,
        sort: { active: 'room', direction: 'asc' }
      };

      this.org_name = org.label;
      this.org_filter = org.value;
      this.pagiPayload['org_name'] = this.org_name;
      this.pagiPayload['org_filter'] = this.org_filter;

      ['fac_name', 'floor', 'sector', 'fac_filter', 'floor_filter', 'sector_filter']
      .forEach(el => delete this.pagiPayload[el]);

      this.getServerData(this.pagiPayload);
       await this.apiService.apiFn({ type: 'GET', target: 'facility/faclist' }, { 'org_id': org.value })
      .then(async (result: any) => {
        this._commonService.setLoader(false);
        this.faclist = await result.data.map((obj) => {
          return {
            'label': obj.fac_name,
            'value': obj._id
          }
        })
        .catch((error) => {
          this._commonService.setLoader(false);
          this.toastr.error('Something went wrong, Please try again.');
        });
      });
      // this.floorlist = null;
    }
  }

  async changeFloor(floor, type) {
    if (type === 'bulk') {
      this.bulkfloor = floor.value;
    }
    this.pagiPayload = {
      moduleName: 'zoneList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.search,
      sort:  { active: 'room', direction: 'asc' }
    };
    let _secList = [];
    this.seclist = this.floorlist.map(it => {
      if (it.value === floor.value) {
        it['sector'].map(item => _secList.push(item));
      }
    });
    this.seclist = _secList.map(obj => {
      return { 'label': obj.name, 'value': obj._id }
    });
    this.floor_name = floor.label;
    this.floor_filter = floor.value;
    this.pagiPayload['floor'] = this.floor_name;
    this.pagiPayload['fac_name'] = this.fac_name;
    this.pagiPayload['org_name'] = this.org_name;
    this.pagiPayload['org_filter'] = this.org_filter;
    this.pagiPayload['fac_filter'] = this.fac_filter;
    this.pagiPayload['floor_filter'] = this.floor_filter;
    delete this.pagiPayload['sector'];
    delete this.pagiPayload['sector_filter'];
    if (type === 'filter') {
      this.sector = '';
      this.pagiPayload['organization'] = this.organization;
      this.pagiPayload['facility'] = this.facility;
      this.getServerData(this.pagiPayload);
    }
  }

  // fiter data toggle
  toggle() {
    this.show = !this.show;
    this.bulk = false;
    // this.organization = '';
    // this.facility = '';
    this.floor = '';
    this.sector = '';
    ['org_name', 'fac_name', 'floor', 'sector', 'sector_filter']
    .forEach(el => delete this.pagiPayload[el]);
    if (!this.show) this.getServerData(this.pagiPayload);
  }
  //Conitional based Data Pass
  achieve() {
    this.bulk = false;
    this.show = false;
    this.search='';
    ['org_name', 'fac_name', 'floor', 'sector', 'sector_filter']
    .forEach(el => delete this.pagiPayload[el]);
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=true;
    this.getServerData(this.pagiPayload);
  }
  
  //reset default
  defArchieve() {
    this.show = false;
    this.bulk = false;
    this.search='';
    ['org_name', 'fac_name', 'floor', 'sector', 'sector_filter']
    .forEach(el => delete this.pagiPayload[el]);
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=false;
    this.getServerData(this.pagiPayload);
  }
  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select zones to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'restore_user',
          id: this.deleteArr,
          restore_data: 'restore_data',
          API: 'zones/delete',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.data.forEach((element) => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Zone restored successfully');
          this.getServerData(this.pagiPayload);
          this.checked = false;
        }

        this.restoreButton['_elementRef'].nativeElement.classList.remove(
          'cdk-program-focused'
        );
        this.restoreButton['_elementRef'].nativeElement.classList.remove(
          'cdk-focused'
        );
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  //Single Restore Button
  restoreZone(id) {
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'restore_user',
        id: id,
        restore_data: 'restore_data',
        API: 'zones/delete',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success('Zone restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  //End Restore changes

  // bulk upload toggle
  bulkUpload() {
    this.bulk = !this.bulk;
    this.show = false;
    // this.organization = '';
    // this.facility = '';
    this.floor = '';
    this.sector = '';
    ['org_name', 'fac_name', 'floor', 'org_filter', 'fac_filter', 'floor_filter', 'sector', 'sector_filter']
    .forEach(el => delete this.pagiPayload[el]);

    this.seclist = '';
    this.pagiPayload['organization'] = this.organization;
    this.pagiPayload['facility'] = this.facility;
    this.getServerData(this.pagiPayload);
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    // this.dataSource.sort = this.sort;
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
    } else if (
      (this.deleteArr && this.deleteArr.length) === this.actualDataCount
    ) {
      this.checked = true;
    }
  }

  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select zones to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'zone', id: this.deleteArr, API: 'zones/delete' },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result && result['status']) {
          this.toastr.success(result['message']);
          this.getServerData(this.pagiPayload);
          this.checked = false;
        } else {
          this.data.forEach((element) => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove(
          'cdk-program-focused'
        );
        this.deleteButton['_elementRef'].nativeElement.classList.remove(
          'cdk-focused'
        );
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  addForm() {
    // Custom-code!
    this.router.navigate(['/zones/form']);
  }

  viewZone(id) {
    this.router.navigate([
      '/zones/view',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }
  

  editZone(id) {
    this.router.navigate([
      '/zones/form',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }

  deleteZone(id,resident_id) {
    
    this.deleteItem.push(id);
    if(resident_id !=""){
    this.zone_residents=resident_id;
    }else{this.zone_residents=null}
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass:'DeleteAlert',
      data: { 'title': 'zone', 'id': this.deleteItem,'residents':this.zone_residents, 'API': 'zones/delete' }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  async exportZone() {
    this._commonService.setLoader(true);
    let _selectedUser = {selectedUser:this.deleteArr}
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/export' }, 
      {..._selectedUser, ...this.pagiPayload }
    )
    .then((result: any) => {
      this._commonService.setLoader(false);
      if (result.status) {
        this.exportdata = result.data;
        this.excelService.exportAsExcelFile(this.prepareUsersForCSV(), 'Zone_Report');
      }
    })
    .catch((error) => {
      this._commonService.setLoader(false);
      this.toastr.error('Something went wrong, Please try again.');
    });
  }

  async changeSector(sector, type) {
    if (type === 'bulk') {
      this.bulksec = sector.value;
    } else {
      this.sector_filter = sector.value;
      this.pagiPayload['sector'] = sector.label;
      this.pagiPayload['sector_filter'] = this.sector_filter;
      this.getServerData(this.pagiPayload);
    }
  }

  prepareUsersForCSV() {
    this._commonService.setLoader(true);
    const zone = [];
    this.exportdata.forEach((item) => {
      let sec;
      if (item.floor && item.floor.sector) {
        sec = item.floor.sector.filter(it => it._id === item.sector);
        if (sec.length) sec = sec[0].name;
      }
      zone.push({
        Organization: item.org ? item['org']['org_name'] : '-',
        Facility: item.fac ? item['fac']['fac_name'] : '-',
        Floor: item.floor ? item.floor.floor : '-',
        Sector: item.floor ? sec : '--',
        Zone: item.room ? item.room : '--',
        'Zone Type': item.type ? item.type : '--',
        // 'sector':item['floor']['sector'].map(itm => itm.name).toString()
      });
    });
    this._commonService.setLoader(false);
    return zone;
  }

  public async getZoneDataFunction(sort?) {

    this._commonService.setLoader(true);
    this.pagiPayload['restore_delete']=this.isArcheive ? this.isArcheive : false;
    await this.apiService.apiFn(
      { type: 'GET', target: 'zones' }, 
      this.pagiPayload
    )
    .then((result: any) => {
      this._commonService.setLoader(false);

      this.count = result.data._count ? result.data._count: 0;
      this.hasNextPage = result.data['isNextPage'];
      if (result.status) {
        if ((!result.data._zones || result.data._zones.length === 0) && this.pagiPayload.pageIndex > 0) {
          this.paginator.previousPage();
        } else {
          this.data = result.data._zones.map(item => {
            let sec;
            if (item.floor && item.floor.sector) {
              sec = item.floor.sector.filter(it => it._id === item.sector);
              if (sec.length) sec = sec[0].name ? sec[0].name : '--';
            }
            const res = item.residents_id ? (item.residents_id.map(itm => itm.last_name + ', ' + itm.first_name).toString()).replace(/,/g, ', ') : '-';

            if (!res) this.ready = true;
            return {
              ...item,
              room: item.room ? item.room : '-',
              type: item.type ? item.type : '-',
              org: item.org ? item.org['org_name'] : '-',
              fac: item.fac ? item.fac['fac_name'] : '-',
              floor: item.floor ? item.floor['floor'] : '-',
              sector: item.floor && item.floor.sector.length && sec !== '' ? sec : '-',
              residents_id: res !== 'undefined undefined' ? res : '-'
            };
          });
          console.log(this.data)
          if(sort && sort['active'] == 'room'){
            const sortedData = this.data.slice();
          sortedData.sort(
            (a, b ) => sort.direction === 'asc'
              ? this._sortAlphanumeric(a[sort.active], b[sort.active])
              : this._sortAlphanumeric(b[sort.active], a[sort.active])
          );

          this.data = sortedData;
          }
          
          if (this.data && this.data.length > 0) {
            this.actualDataCount = this.data.length;
            
          }
          this.createTable(this.data);
          this.checked = false;
          this.deleteArr = [];
          this._commonService.setLoader(false);
        }
      } else {
      }
    })
    .catch((error) => {
      this._commonService.setLoader(false);
      this.toastr.error('Something went wrong, Please try again.');
    });
  }

  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {

      // this.sort['active'] = sort['active'];
      sort['direction'] = 'desc';
      // this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      // this.sort._stateChanges.next();

    }
    this._commonService.setLoader(true);
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ zoneList: this.pagiPayload })
    );
    this._commonService.updatePayload(null, 'zoneList', this.pagiPayload);
    this.getZoneDataFunction(sort);
  }

  _sortAlphanumeric(a: string, b: string): number {
    return a.localeCompare(b, 'en', { numeric: true });
  }

  public async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ zoneList: this.pagiPayload })
    );
    this._commonService.updatePayload(event, 'zoneList', this.pagiPayload);
    this.getZoneDataFunction();
  }

  resetFilter() {
    this.show = false;
    // this.organization = '';
    // this.facility = '';
    this.floor = '';
    this.sector = '';
    this.seclist = '';
    ['org_name','fac_name','floor','org_filter','fac_filter','floor_filter','sector','sector_filter']
    .forEach(el => delete this.pagiPayload[el]);
    // delete this.pagiPayload['org_name'];
    // delete this.pagiPayload['fac_name'];
    // delete this.pagiPayload['floor'];
    this.pagiPayload['organization'] = this.organization;
    this.pagiPayload['facility'] = this.facility;
    this.getServerData(this.pagiPayload);
  }

  async onFileChange(event, organization, facility, floor, sector) {
    if (organization && facility && floor && sector) {
      this._commonService.setLoader(true);
      const filesData = event.target.files;
      const filetype = filesData[0].name.split('.');
      if (filetype[1] === 'xlsx' || filetype[1] === 'xls') {
        const fd = new FormData();
        fd.append('file', filesData[0]);
        fd.append('organization', this.organization);
        fd.append('facility', this.facility);
        fd.append('floor', floor.value);
        fd.append('sector', sector.value);

        await this.apiService.apiFn({type: 'FORMDATA', target: 'zones/upload'}, fd)
        .then((result: any) => {
          this._commonService.setLoader(false);
          if (result.status) {
            this.toastr.success(result['message']);
          } else {
            this.toastr.error(result['message']);
          }
        })
        .catch((error)=> this._commonService.setLoader(false));
        this.show = false;
        this.bulk = false;
        // this.organization = '';
        // this.facility = '';
        this.floor = '';
        this.filedata = '';
        ['org_name','fac_name','floor'].forEach(el => delete this.pagiPayload[el]);

      } else {
        this.filedata = '';
        this._commonService.setLoader(false);
        this.toastr.error(
          'Use the sample data format for uploading zones',
          'Oops!'
        );
      }
    } else {
      this.filedata = '';
      this.toastr.error('Please select details first');
    }
  }

  prepareUsersForCSV2() {
    const zone = [];
    zone.push({
      'Zone Type': '',
      'Zone Name': '',
    });
    return zone;
  }

  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  async onChangeReady(id, event) {
    this._commonService.setLoader(true);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/ready_to_move' }, 
      { 'zoneId': id, value: event.checked }
    )
    .then((result: any) => {
      this._commonService.setLoader(false);
      if (result.status) {
        this.ready = event.checked;
        this.toastr.success('Ready to move status updated successfully');
      } else {
        this.toastr.error('Ready to move status cannot be updated');
      }
    })
    .catch((error) => {
      this._commonService.setLoader(false);
      this.toastr.error('Something went wrong, Please try again.');
    });
  }

  getUserAccess(){
    this.userAccess.isView = this._commonService.checkPrivilegeModule('zones','view');
    this.userAccess.isAdd = this._commonService.checkPrivilegeModule('zones','add');
    this.userAccess.isEdit = this._commonService.checkPrivilegeModule('zones','edit');
    this.userAccess.isDelete = this._commonService.checkPrivilegeModule('zones','delete');
    this.userAccess.isExport = this._commonService.checkPrivilegeModule('zones','export');
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'zones/count' };
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
  moduleName: string;
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
}
