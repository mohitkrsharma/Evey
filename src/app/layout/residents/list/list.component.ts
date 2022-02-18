import {AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild,} from '@angular/core';
import {MatOption, MatPaginator, MatSort, MatTableDataSource, PageEvent,} from '@angular/material';
import {NavigationEnd, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ToastrService} from 'ngx-toastr';
import * as moment from 'moment-timezone';
import {fromEvent, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, tap,} from 'rxjs/operators';
import {ApiService} from './../../../shared/services/api/api.service';
import {AlertComponent} from '../../../shared/modals/alert/alert.component';
import {RestoreComponent} from '../../../shared/modals/restore/restore.component';
import {EVEY_FOOTER_LOGO, ExcelService} from './../../../shared/services/excel.service';
import {SocketService} from './../../../shared/services/socket/socket.service';
import {CommonService} from './../../../shared/services/common.service';
import {ConstantsService} from './../../../shared/services/constants.service';
import {Aes256Service} from './../../../shared/services/aes-256/aes-256.service';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import {UserAccess} from 'src/app/shared/models/userAccess';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('searchInput', {static: true}) searchInput !: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;

  floorlist;
  seclist;
  org;
  fac;
  org_filter;
  fac_filter;
  zn;
  public btnAction: Function;
  public filtershow = false;
  search: any;
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  exportdata;
  viewtype = 'unarchive';
  dataSource;
  displayedColumns = [];
  arr = [];
  filedata;
  residentlevel;
  public residentLocation: any;
  public locationSearch: any;
  public residentIsolation: any;
  public isolationSearch: any;
  resident_status
  isShow: boolean;
  topPosToStartShowing = 100;
  careSearch = '';
  statusSearch = '';
  isArcheive: boolean = false;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public show = false;
  public buttonName: any = 'Show';
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  actualDataCount;

  statusData = [
    { label: 'Active', value: 'Active' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Vacation', value: 'Vacation' },
    { label: 'Skilled Nursing', value: 'Skilled Nursing' },
    { label: 'Hospitalized', value: 'Hospitalized' }
  ];

  archiveStatusData = [
    { label: 'Transferred', value: 'Transferred', isOutOfFacility: true },
    { label: 'Deceased', value: 'Deceased' },
    { label: 'Moved', value: 'Moved' },
  ];

  isolationArr = [
    { label:'Yes', value: true},
    { label:'No', value: false}
  ];


  /**
* Pre-defined columns list for user table
*/
  columnNames = [
    {
      id: 'name',
      value: 'Resident Name',
      sort: true,
    },
    {
      id: 'care_level',
      value: 'Level',
      sort: true,
    },
    // {
    //   id: 'secondary_care_level',
    //   value: 'Secondary Level',
    //   sort: true
    // },
    {
      id: 'resident_status',
      value: 'Status',
      sort: true,
    },
    {
      id: 'archive_date',
      value: 'Admit Date',
      sort: true,
    },
  ];
  organization;
  facility;
  floor;
  checked;
  faclist;
  floorvalue;
  floor_filter;
  deleteArr = [];
  deleteItem = [];
  data: any = [];
  organiz;
  pagiPayload = {
    moduleName: 'residentList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };
  listType = null;
  count;
  sector;
  carelevelData;
  public covid_isolation_array = [
    { label: 'No Isolation', value: '' },
    { label: 'Stop Isolation', value: 'stop' },
    { label: '7 days', value: 7 },
    { label: '10 days', value: 10 },
    { label: '14 days', value: 14 },
    { label: 'Indefinite', value: 'Indefinite' }
  ];
  public is_out_of_fac: boolean = false;
  eventsubscription: Subscription;
  subscription1: Subscription;
  subscription: Subscription = new Subscription();
  ground_options = [
    {
      label: 'On-grounds',
      values: [
        {
          label: 'No Isolation',
          value: 'on-ground/no-isolation',
        },
        {
          label: '7 days Isolation',
          value: 'on-ground/7day-isolation',
        },
      ],
    },
    {
      label: 'Off-grounds',
      values: [
        {
          label: 'No Isolation',
          value: 'off-ground/no-isolation',
        },
        {
          label: '7 days Isolation',
          value: 'off-ground/7day-isolation',
        },
        {
          label: '10 days Isolation',
          value: 'off-ground/10day-isolation'
        },
        {
          label: '14 days Isolation',
          value: 'off-ground/14day-isolation',
        },
        {
          label: 'Indefinite',
          value: 'off-ground/Indefinite'
        }
      ]
    }
  ];
  public out_of_fac_options = [
    { label: 'In building', value: false },
    { label: 'Out of building', value: true }
  ];

  columnNames_resident = [
    {
      id: 'Last_Name',
      value: 'Last Name',
      title: 'Last Name',
      name: 'Last_Name',
      dataKey: 'Last_Name'
    },
    {
      id: 'First_Name',
      value: 'First Name',
      title: 'First Name',
      name: 'First Name',
      dataKey: 'First_Name'
    },
    {
      id: 'Isolation',
      value: 'Isolation',
      title: 'Isolation',
      name: 'Isolation',
      dataKey: 'Isolation'
    },
    {
      id: 'Unit',
      value: 'Unit',
      title: 'Unit',
      name: 'Unit',
      dataKey: 'Unit'
    },
    {
      id: 'Status',
      value: 'Status',
      title: 'Status',
      name: 'Status',
      dataKey: 'Status'
    },
  ];
  public doc: any;
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public userAccess: UserAccess = new UserAccess();
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  totalCount: any;
  constructor(
    private _router: Router,
    private apiService: ApiService,
    private dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private socketService: SocketService,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService
  ) { }

  @HostListener('window:scroll')
  checkScroll() {
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

  gotoTop() {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }

  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    this.gotoTop();
    if (!this._commonService.checkAllPrivilege('Residents')) {
      this._router.navigate(['/']);
    }
    this.getUserAccess();
    this.listType = this._router.url.split('/').pop();

    this._commonService.setLoader(true);
    this.eventsubscription = this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.listType = event.url.split('/').pop();
        this.setDisplayColumns();
        this.search = '';
        this.pagiPayload = {
          moduleName: 'residentList',
          length: 0,
          pageIndex: 0,
          pageSize: 10,
          previousPageIndex: 0,
          search: '',
          sort: { active: 'name', direction: 'asc' },
        };
        this.setLastCrumb(event.url);
        this.getServerData(this.pagiPayload);
      }
    });

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.residentList) {
        this.pagiPayload = pageListing.residentList;
        // this.pagiPayload.previousPageIndex =
        //   pageListing.residentList.previousPageIndex;
        // this.pagiPayload.pageIndex = pageListing.residentList.pageIndex;
        // this.pagiPayload.pageSize = pageListing.residentList.pageSize;
        // this.pagiPayload.length = pageListing.residentList.length;
        this.search = pageListing.residentList.search;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ residentList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ residentList: this.pagiPayload })
      );
    }

    this._commonService.payloadSetup('residentList', this.pagiPayload);

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this.btnAction = this.addForm.bind(this);
    this.setDisplayColumns();

    this.subscription1 = await this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this._commonService.setLoader(true);
        this.zn = contentVal.timezone;
        this.pagiPayload['organization'] = this.organization = contentVal.org;
        this.pagiPayload['facility'] = this.facility = contentVal.fac;
        this.socketService.joinRoomWithfac(contentVal.fac, "RESI");
        this.ResidentIsolationScketevent();
        await this.getServerData(this.pagiPayload);
        this._commonService.setLoader(false);
      } else {
        this._commonService.setLoader(false);
      }
    });

    this.subscription.add(this.socketService.onResidentOutOfFacilityFn().subscribe(async (_response: any) => {
      if (_response) {
        //console.log(">>>>sss",_response._id, _response.is_out_of_fac)
        if (_response.is_out_of_fac && this.data[this.getIndex(this.data, _response)]['isolation_end_date'] != "") {
          this.data[this.getIndex(this.data, _response)]['isolation_end_date'] = '';
        }
        this.data[this.getIndex(this.data, _response)]['outofFac'] = _response.is_out_of_fac;
        this.createTable(this.data);
      }
    }));
    this.subscription.add(this.socketService.onResidentIsVirusCheckFn().subscribe(async (_response: any) => {
      if (_response) {
        if (this.getIndex(this.data, _response) > -1) {
          this.data[this.getIndex(this.data, _response)]['isVirusCheck'] = _response.is_virus_check;
          this.createTable(this.data);
        }
      }
    }));

    this.subscription.add(this.socketService.onResidentListIsVirusCheckFn().subscribe(async (_response: any) => {
      if (_response) {
        _response.forEach((_item) => {
          if (this.getIndex(this.data, _response) > -1) {
            this.data[this.getIndex(this.data, _response)]['isVirusCheck'] = _response.is_virus_check;
          }
        });
        this.createTable(this.data);
      }
    }));
    const moreLinks = this._constantsService.residentMoreOption();
    // this._commonService.setMoreOption(moreLinks);
    this.carelevelData = this._constantsService.residentCareLevel();
  }
  ResidentIsolationScketevent() {
    this.subscription.add(this.socketService.onResidentIsIsolationFn().subscribe(async (_response: any) => {
      if (_response && this.data.length > 0) {
        if (this.getIndex(this.data, _response) > -1) {
          // tslint:disable-next-line: max-line-length
          this.data[this.getIndex(this.data, _response)]['isolation_end_date'] = '';
          this.data[this.getIndex(this.data, _response)]['isolation_start_date'] = '';
          setTimeout(() => {
            this.data[this.getIndex(this.data, _response)]['isolation_end_date'] = _response.end_time_isolation;
            this.data[this.getIndex(this.data, _response)]['isolation_start_date'] = _response.start_time_isolation;
            this.data[this.getIndex(this.data, _response)]['isolation_days'] = _response.custom_days === 'Indefinite' ? _response.custom_days : Number(_response.custom_days);
          }, 10);
          this.createTable(this.data);
        }
      }
    }));

    this.subscription.add(this.socketService.onResidentStopIsolationFn().subscribe(async (_response: any) => {
      if (_response) {
        if (_response && this.data.length > 0) {
          if (this.getIndex(this.data, _response) > -1) {
            this.data[this.getIndex(this.data, _response)]['isolation_end_date'] = '';
            this.data[this.getIndex(this.data, _response)]['isolation_start_date'] = '';
            this.data[this.getIndex(this.data, _response)]['isolation_days'] = '';
            this.createTable(this.data);
          }
        }
      }
    }));
  }
  setLastCrumb(url) {
    if (this.listType === 'deleted') {
      this._commonService.setLastCrumb({ label: 'Deleted Residents', routerLink: url });
    } else if (this.listType === 'removed') {
      this._commonService.setLastCrumb({ label: 'Removed Residents', routerLink: url });
    }
  }

  setDisplayColumns() {
    this.displayedColumns = [];
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    if (this.viewtype != 'archive') {
      for (let index = 0; index < this.columnNames.length; index++) {
        if (this.columnNames[index].id == 'archive_date') {
          this.columnNames[index].value = 'Admit Date'
        }
      }
    }
    if (this.viewtype == 'archive') {
      for (let index = 0; index < this.columnNames.length; index++) {
        if (this.columnNames[index].id == 'archive_date') {
          this.columnNames[index].value = 'Archive Date'
        }
      }
    }
    if (this.listType !== 'deleted') {
      this.displayedColumns = this.displayedColumns.concat(['outofFac']);
      this.displayedColumns = this.displayedColumns.concat(['isolation']);
      //this.displayedColumns = this.displayedColumns.concat(['isVirusCheck']);
    }
    this.displayedColumns = this.displayedColumns.concat(['actions']);
  }

  ngOnDestroy() {
    this._commonService.setMoreOption(false);
    this._commonService.setLastCrumb(false);
    this.subscription.unsubscribe();
    this.subscription1.unsubscribe();
    this.eventsubscription.unsubscribe();
  }

  download() {
    if (this.organization && this.facility) {
      for (let i = 0; i < 10; i++) {
        this.arr.push({
          org_id: this.organization['_id'],
          fac_id: this.facility,
        });
      }
      const residents = this.prepareForExport();
      this.excelService.exportAsExcelFile(residents, 'Add Resident');
    } else {
      this.toastr.error('Please select organization and facility');
    }
  }

  async onFileChange(event) {
    this._commonService.setLoader(true);
    const organization = this.pagiPayload['organization'];
    const facility = this.pagiPayload['facility'];
    const filesData = event.target.files;
    const filetype = filesData[0].name.split('.');
    if (filetype[1] === 'xlsx' || filetype[1] === 'xls') {
      const fd = new FormData();
      fd.append('file', filesData[0]);
      fd.append('organization', organization);
      fd.append('facility', facility);

      await this.apiService.apiFn({ type: 'FORMDATA', target: 'residents/upload' }, fd)
        .then((result: any) => {
          this._commonService.setLoader(false);
          if (result.status) {
            this.toastr.success(result['message']);
          } else {
            this.toastr.error(result['message']);
          }
        })
        .catch((error) => {
          this._commonService.setLoader(false);
          this.toastr.error('Something went wrong, Please try again.');
        });
      this.show = false;
      this.residentlevel = '';
      this.deletepagiPayload(['org_name', 'org_filter', 'fac_filter', 'floor_filter', 'fac_name', 'floor', 'sector', 'level']);
      this.filtershow = false;
      this.filedata = '';
    } else {
      this.toastr.error(
        'Use the sample data format for uploading residents',
        'Oops!'
      );
    }
  }

  prepareForExport() {
    const resident = [];
    this.arr.forEach((item) => {
      resident.push({
        first_name: null,
        last_name: null,
        email: null,
        home_phone: null,
        mobile_phone: null,
        facility: item.fac_id,
        organization: item.org_id,
        resident_status: 'Active',
      });
    });
    return resident;
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
      this.toastr.error('Please select residents to be deleted');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'residents',
          id: this.deleteArr,
          API: 'residents/delete',
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
          this.toastr.success('Resident deleted successfully');
          this.getServerData(this.pagiPayload);
          this.checked = false;
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
    // this.dataSource.sort = this.sort;
  }

  viewResident(id) {
    this._router.navigate([
      '/residents/view',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }

  addForm() {
    // Custom-code!
    this._router.navigate(['/residents/form']);
  }

  editResident(id) {
    this._commonService.setRegId(id);
    this._router.navigate(['/residents/form', this._aes256Service.encFnWithsalt(id)]);
  }

  toggle() {
    this.show = !this.show;
    this.filtershow = false;

    this.organization = '';
    this.facility = '',
      this.residentlevel = '';
    this.deletepagiPayload(['org_name', 'fac_name', 'floor', 'sector', 'org_filter', 'fac_filter', 'floor_filter', 'level']);
    this.getServerData(this.pagiPayload);
  }

  filter() {
    this.filtershow = !this.filtershow;
    this.show = false;

    //this.organization = '';
    //this.facility = '',
    this.residentlevel = '';
    this.deletepagiPayload(['org_name', 'fac_name', 'floor', 'sector', 'org_filter', 'fac_filter', 'floor_filter', 'level']);
    this.getServerData(this.pagiPayload);
  }

  //Start
  //Conitional based Data Pass
  achieve() {
    this.filtershow = false;
    this.show = false;
    this.search = '';
    this.viewtype = 'archive';
    this.resident_status = null;

    this.setDisplayColumns();
    this.deletepagiPayload(['org_name', 'fac_name', 'floor', 'sector', 'org_filter', 'fac_filter', 'floor_filter', 'level']);
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.pagiPayload['filter_resident_status'] = null;
    this.pagiPayload['filter_resident_status_id'] = null;
    this.isArcheive = true;
    this.getServerData(this.pagiPayload);
  }
  //reset default
  defArchieve() {
    this.filtershow = false;
    this.show = false;
    this.search = '';
    this.viewtype = 'unarchive';
    this.resident_status = null;

    this.setDisplayColumns();
    this.deletepagiPayload(['org_name', 'fac_name', 'floor', 'sector', 'org_filter', 'fac_filter', 'floor_filter', 'level']);
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.pagiPayload['filter_resident_status'] = null;
    this.pagiPayload['filter_resident_status_id'] = null;
    this.isArcheive = false;
    this.getServerData(this.pagiPayload);
  }

  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select residents to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'restore_user',
          id: this.deleteArr,
          restore_data: 'restore_data',
          API: 'residents/delete',
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
          this.toastr.success('Resident restored successfully');
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
  restoreResident(id) {
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'restore_user',
        id: id,
        restore_data: 'restore_data',
        API: 'residents/delete',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success('Resident restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  //End

  deleteResident(id) {
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'resident', id: id, API: 'residents/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  async exportResident() {
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'residents/export'
    };
    const payload = {}
    payload['organization'] = this.organization;
    payload['facility'] = this.facility;
    if (this.isArcheive === true) {
      payload['delete'] = true;
    } else {
      payload['delete'] = false;
    }
    if (this.filtershow == true) {
      // payload['resident_status']=this.resident_status.value
      // payload['level'] = this.residentlevel.value;
    }
    payload['listType'] = this.listType;

    // console.log('---payload-----',payload)

    // return

    let _selectedUser = { selectedUser: this.deleteArr }
    // const payload =  {..._selectedUser, ...this.pagiPayload };
    const result = await this.apiService.apiFn(action, payload);
    // result = result['data'];
    if (result['status']) {
      const data = result['data'];
      // console.log(">>>>export data>>>",data)
      this.exportdata = data;
      this.exportPdf()
    }
  }

  pageContent(isHeader = undefined) {
    if (isHeader) {
      // HEADER
      var pageHeight = (this.doc.internal.pageSize.height / 2.4);
      this.doc.setTextColor('#279ed5');
      this.doc.setFont('helvetica');
      this.doc.setFontType('normal');
      this.doc.setFontSize(24);
      this.doc.text(15, pageHeight - 20, 'Custom Report');
      this.doc.setFontSize(12);
    }
    // FOOTER

    this.doc.setFontSize(10);
    this.doc.setTextColor('#1975B8');
    this.doc.text("CONFIDENTIAL", 48, this.doc.internal.pageSize.height - 20, null, null, 'right');
    this.doc.addImage(EVEY_FOOTER_LOGO, "JPEG", 169, this.doc.internal.pageSize.height - 23, 15, 5);
  };

  async exportPdf() {
    const residents = [];
    let level = [
      "Level 1",
      "Level 2",
      "Level 3",
      "Short Term Stay",
      "Mobility Assistance (All Day)",
      "Bathing Assistance",
      "Level 4",
      "Supervision (during waking hours)",
      "Safety and Supervision (24 hours)",
      "Limited Assist AM cares",
      "Limited Assist AM and PM cares",
      "Self",
    ];


    level.forEach((lvl: any) => {
      let lvlRecord = this.exportdata.filter(e => e['primary_care_level'] === lvl)
      if (lvlRecord && lvlRecord.length) {
        if (this.filtershow == true) {
          if (this.residentlevel && this.resident_status) {
            if (lvl == this.residentlevel.value) {
              residents.push({
                Last_Name: lvl,
                First_Name: '',
                Isolation: '',
                // "  ": '',
                // "   ": '',
                // "    ": '',
                Unit: '',
                Status: '',
              })
            }
          }
          else {

            residents.push({
              Last_Name: lvl,
              First_Name: '',
              Isolation: '',
              // "  ": '',
              // "   ": '',
              // "    ": '',
              Unit: '',
              Status: '',
            })

          }

        }
        else {
          residents.push({
            Last_Name: lvl,
            First_Name: '',
            Isolation: '',
            // "  ": '',
            // "   ": '',
            // "    ": '',
            Unit: '',
            Status: '',
          })
        }


        lvlRecord.forEach(item => {
          if (this.filtershow == true) {
            if (this.residentlevel && this.resident_status) {
              if (lvl == this.residentlevel.value && this.resident_status.label == item.resident_status) {
                residents.push({
                  Last_Name: item.last_name ? item.last_name : '-',
                  First_Name: item.first_name ? item.first_name : '-',
                  Isolation: (item.isolations && item.isolations.length) ? 'Yes' : 'No',
                  Status: item.resident_status ? item.resident_status : '-',
                });
              }
            }
            else if (this.residentlevel) {
              if (lvl == this.residentlevel.value) {
                residents.push({
                  Last_Name: item.last_name ? item.last_name : '-',
                  First_Name: item.first_name ? item.first_name : '-',
                  Isolation: (item.isolations && item.isolations.length) ? 'Yes' : 'No',
                  Status: item.resident_status ? item.resident_status : '-',
                });
              }
            }
            else if (this.resident_status) {
              if (this.resident_status.label == item.resident_status) {
                residents.push({
                  Last_Name: item.last_name ? item.last_name : '-',
                  First_Name: item.first_name ? item.first_name : '-',
                  Isolation: (item.isolations && item.isolations.length) ? 'Yes' : 'No',
                  Status: item.resident_status ? item.resident_status : '-',
                });
              }
            }
            else {
              residents.push({
                Last_Name: item.last_name ? item.last_name : '-',
                First_Name: item.first_name ? item.first_name : '-',
                Isolation: (item.isolations && item.isolations.length) ? 'Yes' : 'No',
                Status: item.resident_status ? item.resident_status : '-',
              })
            }

          } else {
            if (item.room && item.resident_status == "Active") {
              residents.push({
                Last_Name: item.last_name ? item.last_name : '-',
                First_Name: item.first_name ? item.first_name : '-',
                Isolation: (item.isolations && item.isolations.length) ? 'Yes' : 'No',
                // "  ": '',
                // "   ": '',
                // "    ": '',
                Unit: item.room ? item.room : '-',
                Status: item.resident_status ? item.resident_status : '-',
              })
            }
            else if (item.resident_status != "Pending") {
              residents.push({
                Last_Name: item.last_name ? item.last_name : '-',
                First_Name: item.first_name ? item.first_name : '-',
                Isolation: (item.isolations && item.isolations.length) ? 'Yes' : 'No',
                Status: item.resident_status ? item.resident_status : '-',
              })
            }
          }
        })
      }
    })

    this.doc = undefined;
    this.doc = new jsPDF();

    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(24);
    this.doc.text("Resident List", 20, 30);

    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.text(this.exportdata[0].org, 20, 38);
    this.doc.text(this.exportdata[0].fac, 20, 43);
    this.doc.text(moment.tz(this.zn).format('MM/DD/YYYY'), 20, 48);

    let index: any;
    await this.doc.autoTable(this.columnNames_resident, ((residents.length) ? residents : ['No visits tracked']), {
      headerStyles: {
        // fillColor: 212,
        // textColor: 20,
        // halign: 'center',
        fontStyle: 'normal'
      },
      addPageContent: () => {
        this.pageContent(false)
      },
      didParseCell: function (cell, data) {
        if (cell.row.raw.Last_Name) {
          index = level.indexOf(cell.row.raw.Last_Name);
          if (index !== -1) {
            cell.cell.styles.fontStyle = 'bold';
            cell.cell.styles.fontSize = 12
          }
        }
      },
      startY: 60,
      margin: {
        top: 33,
        bottom: 30,
        left: 20,
        right: 20
      },
      styles: {
        overflow: 'linebreak',
        // lineColor: [221, 221, 221],
        lineWidth: 0,
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

    this.doc.save('Resident_Report');
    this._commonService.setLoader(false);
  }



  public async getResidentUsersDataFunction() {
    this._commonService.setLoader(true);
    let sec;
    const payload = this.pagiPayload;
    payload['listType'] = this.listType;
    payload['organization'] = this.organization;
    payload['facility'] = this.facility;
    if (this.isArcheive === true) {
      payload['delete'] = true;
      payload['listType'] = 'deleted';
    } else {
      payload['delete'] = false;
    }
    await this.apiService.apiFn({ type: 'GET', target: 'residents/get' }, payload)
      .then(async (result: any) => {
        this._commonService.setLoader(false);
        this.count = result.data['_count'];
        if (result.status) {
          if ((!result.data['_residents'] || result.data['_residents'].length === 0) && this.pagiPayload.pageIndex > 0) {
            this.paginator.previousPage();
          } else {
            this.count = result.data['_count'];
            this.hasNextPage = result.data['isNextPage'];
            result = result.data['_residents'].map(item => {
              if (item.sector && item.sector.length > 0) {
                sec = (item.sector).filter((it) => {
                  if (it._id === item.sectorId) return it.name;
                });
              }
              return {
                ...item,
                name: item.last_name + ',' + ' ' + item.first_name,
                secondary_care_level: item.secondary_care_level ? item.secondary_care_level.join(', ') : '-',
                // organization: item.organization ? item.organization : '--',
                facility: item.facility ? item.facility : '-',
                // sector: (sec && sec.length > 0) ? sec[0]['name'] : '--',
                // floor: item.floor ? item.floor : '-',
                resident_status: item.resident_status ? item.resident_status : '-',
                care_level: item.care_level ? item.care_level : '-',
                outofFac: item.outofFac ? item.outofFac : false,
                isVirusCheck: item.isVirusCheck ? item.isVirusCheck : false,
                isolation_end_date: item.isolation_end_date,
                isolation_apply_come_to_fac: item.isolation_apply_come_to_fac != undefined ? item.isolation_apply_come_to_fac : 'on-ground/no-isolation',
                old_isolation_apply_come_to_fac: item.isolation_apply_come_to_fac != undefined ? item.isolation_apply_come_to_fac : 'on-ground/no-isolation',
                archive_date: this.viewtype === 'archive' ? (item.archive_date ? moment(item.archive_date).format('MMMM Do YYYY') : '-') :  (item.admit_date ? moment(item.admit_date).format('MMMM Do YYYY') : '-'),
                // admit_date: item.admit_date != undefined ? moment(item.admit_date).format('MMMM Do YYYY') : '-',
                isolation_days: item.isolation_days ? item.isolation_days === 'Indefinite' ? item.isolation_days : Number(item.isolation_days) : '',
              };
            });
            this._commonService.setLoader(false);
            this.data = result;
            if (this.data && this.data.length > 0) {
              this.actualDataCount = this.data.length;
            }
            this.createTable(result);
            this.checked = false;
            this.deleteArr = [];
          }
        }
      })
      .catch((err) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });
  }

  async sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload.sort = { active: this.sort.active, direction: this.sort.direction };
    sessionStorage.setItem('pageListing', JSON.stringify({ residentList: this.pagiPayload }));
    this._commonService.updatePayload(null, 'residentList', this.pagiPayload);
    await this.getResidentUsersDataFunction();
    this._commonService.setLoader(false);
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({ residentList: this.pagiPayload }));
    this._commonService.updatePayload(event, 'residentList', this.pagiPayload);
    await this.getResidentUsersDataFunction();
    this._commonService.setLoader(false);
  }

  async onChangefacility(event, resid_id) {
    this._commonService.setLoader(true);
    const residentlist = [];
    residentlist.push(resid_id);
    // const payload = { 'residentList': residentlist, value: event.checked };
    await this.apiService.apiFn(
      { type: 'POST', target: 'residents/resi_outoffac' },
      { 'residentList': residentlist, value: event.value }
    )
      .then((result: any) => {
        this._commonService.setLoader(false);
        if (result.status) {
          this.is_out_of_fac = !this.is_out_of_fac
          this.toastr.success(result.message);
        } else {
          this.toastr.error(result.message);
        }
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });

    if (event.value) {
      const index = this.data.findIndex(item => item._id === resid_id);
      if (index > -1) {
        this.data[index]['old_isolation_apply_come_to_fac'] = this.data[index][
          'isolation_apply_come_to_fac'
        ] = 'on-ground/no-isolation';
      }
      this.stopOnOutOfFacilityIsolation(resid_id);
    }
  }
  confirmChangeFacility(event, resid_id) {
    this.onChangefacility(event, resid_id);
    // const dialogRef = this.dialog.open(ConfirmComponent, {
    //   width: '350px',
    //   data: { 'title': `Are you want to sure?`  }
    // });
    // dialogRef.afterClosed().subscribe(result => {

    //  if(result){
    //    this.onChangefacility(event, resid_id)
    //  }else{
    //   const index = this.data.findIndex(item => item._id === resid_id);
    //   if (index > -1) {
    //     this.data[index]['outofFac'] = !event.value;

    //   }
    //  }

    // });
  }
  async onChangeVirusCheck(event, resid_id) {
    const residentlist = [];
    residentlist.push(resid_id);
    await this.apiService.apiFn(
      { type: 'POST', target: 'residents/resi_viruscheck' },
      { 'residentList': residentlist, value: event.checked }
    )
      .then((result: any) => {
        this._commonService.setLoader(false);
        if (result.status) {
          this.toastr.success(result.message);
        } else {
          this.toastr.error(result.message);
        }
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });
  }

  changeLevel(level, type) {
    this._commonService.setLoader(true);
    this.pagiPayload['level'] = level.label;
    this.pagiPayload['level_id'] = level._id;
    this.getServerData(this.pagiPayload);
  }
  changeStatus(event, type) {
    this.resident_status = event
    this.pagiPayload['filter_resident_status'] = event.label;
    this.pagiPayload['filter_resident_status_id'] = event._id;
    this.getServerData(this.pagiPayload);
  }

  resetFilter() {
    //this.organization = '';
    //this.facility = '';
    this.floor = '';
    this.search = '';
    this.residentlevel = '';
    this.resident_status = '';
    this.residentLocation = '';
    this.residentIsolation = '';
    this.deletepagiPayload([
      'org_name',
      'fac_name',
      'floor',
      'org_filter',
      'level',
      'filter_resident_status',
      'filter_resident_status_id',
      'filter_resident_location',
      'is_out_of_fac',
      'filter_resident_isolation',
      'show_isolated'
    ]);
    this.getServerData(this.pagiPayload);
  }

  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  timerCompleted(event) {
  }

  async stopOnOutOfFacilityIsolation(resident_id) {
    this._commonService.setLoader(true);

    const index = this.data.findIndex(item => item._id === resident_id);

    if (index > -1 && this.data[index]['isolation_end_date'] != "") {
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/stop_isolation' },
        { 'resident_id': resident_id }
      );
    }
    this._commonService.setLoader(false);
  }

  async setIsolation(event, resident_id) {
    this._commonService.setLoader(true);
    let str = event.value;
    let days = (str == "on-ground/no-isolation" || str == "off-ground/no-isolation") ? "No Isolation" : ((str != "off-ground/Indefinite") ? parseInt(str.match(/\d+/)) + " days" : 'Indefinite');

    // const dialogRef = this.dialog.open(ConfirmComponent, {
    //   width: '350px',
    //   data: { 'title': `Are you want to sure ${days} isolation set to this resident?`  }
    // });
    // dialogRef.afterClosed().subscribe(async result => {

    //  if(result){
    await this.apiService.apiFn(
      { type: 'POST', target: 'residents/set_isolation' },
      { 'resident_id': resident_id, days: event.value }
    )
      .then((result: any) => {
        this._commonService.setLoader(false);
        if (result.status) {
          this.toastr.success(result.message);
          const index = this.data.findIndex(item => item._id === resident_id);
          if (index > -1) {
            this.data[index]['old_isolation_apply_come_to_fac'] = this.data[index]['isolation_apply_come_to_fac'];
          }
        } else {
          this.toastr.error(result['message']);
        }
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });
    //  }else{
    //   const index = this.data.findIndex(item => item._id === resident_id);
    //   if (index > -1) {
    //     this.data[index]['isolation_apply_come_to_fac'] = this.data[index]['old_isolation_apply_come_to_fac'];
    //   }
    //  }
    // });
  }

  getIndex(data, response) {
    if (response._ids && typeof (response._ids) === "object") {
      return data.findIndex(item => response._ids[0] == item._id);
    } else if (response._id && typeof (response._id) === "string") {
      return data.findIndex(item => response._id == item._id);
    } else {
      return data.findIndex(item => response.resident_id == item._id);
    }
  }

  deletepagiPayload(arr: string[]) {
    arr.forEach(el => delete this.pagiPayload[el]);
  }

  getUserAccess() {
    this.userAccess.isView = this._commonService.checkPrivilegeModule('residents', 'view');
    this.userAccess.isAdd = this._commonService.checkPrivilegeModule('residents', 'add');
    this.userAccess.isEdit = this._commonService.checkPrivilegeModule('residents', 'edit');
    this.userAccess.isDelete = this._commonService.checkPrivilegeModule('residents', 'delete');
    this.userAccess.isExport = this._commonService.checkPrivilegeModule('residents', 'export');
  }

  async confirmIsolation(event, residentId, msg = true) {
    this._commonService.setLoader(true);
    if (residentId !== undefined) {
      if (event.value != '' && event.value != 'stop') {
        await this.apiService.apiFn(
          { type: 'POST', target: 'residents/custom_isolation' },
          { 'resident_id': residentId, days: event.value }
        )
          .then((result: any) => {
            if (msg) {
              if (result.status) {
                this.toastr.success(result.message);
              } else {
                this.toastr.error(result.message);
              }
            }
          });
      }
      // if (event.value != '' && event.value == 'stop') {
      //   this.isNoIsolation = true;

      // }else{this.isNoIsolation = false;}

      if (event.value != '' && event.value == 'stop') {
        await this.apiService.apiFn(
          { type: 'POST', target: 'residents/stop_isolation' },
          { 'resident_id': residentId }
        )
          .then((result: any) => {
            if (msg) {
              if (result.status) {
                this.toastr.success(result.message);
              } else {
                this.toastr.error(result.message);
              }
            }
          });
      }

      //this.getServerData(this.pagiPayload)
    }
    this._commonService.setLoader(false);
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'residents/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
    }
  }
  async ngAfterViewChecked() {
    this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
  }

  changeLocation(event, type){
    console.log(event);
    this.pagiPayload['filter_resident_location'] = event.label;
    this.pagiPayload['is_out_of_fac'] = event.value;
    this.getServerData(this.pagiPayload);
  }

  async changeIsolation(event, type){
    console.log(event);
    this.pagiPayload['filter_resident_isolation'] = event.label;
    this.pagiPayload['show_isolated'] = event.value;
    this.getServerData(this.pagiPayload);
  }
}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}
