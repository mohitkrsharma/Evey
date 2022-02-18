import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  TemplateRef,
  AfterViewChecked,
} from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
} from '@angular/material/dialog';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, Subscription } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FileUploader } from 'ng2-file-upload';
import { environment } from './../../../../environments/environment';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SocketService } from './../../../shared/services/socket/socket.service';

import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from 'rxjs/operators';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { UserAccess } from 'src/app/shared/models/userAccess';
import { AddLocationComponent } from 'src/app/shared/modals/add-location/add-location.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  locationList: any;
  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService,
    private socketService: SocketService,
  ) {}
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('addModal', {static: true}) addModal: TemplateRef<any>;

  organization;
  facility;
  private subscription: Subscription;

  userFacilityList = [];
  ismultifac: Boolean = false;
  paramId: Boolean;
  faclist;
  job_type;
  showfaclist: boolean;
  multifacility: any;
  multiorg: any;
  duplicateFacility;
  string;
  public facListDone = [];
  orgSearch = '';
  facSearch = '';

  public btnAction: Function;
  dialogRefs = null;
  isEdit = false;
  careForm: FormGroup;
  alternateCare;
  assetTypeList = [];
  parentId = null;
  parentCare = null;
  caremsg;
  location: any = {
    name : '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip:null,
    onGround: false
  }
  finalCareArray: any = [];
  selectedTypeItem = false;
  selectedTypeInput = false;
  careType = [
    { key: 'default', value: 'Default' },
    { key: 'other', value: 'Other' },
    { key: 'check_in', value: 'Check In' },
    { key: 'emergency', value: 'Emergency' },
    { key: 'spa', value: 'Spa' },
    { key: 'laundry', value: 'Laundry' },
    { key: 'garbage', value: 'Garbage' },
    { key: 'meal', value: 'Meal' },
    { key: 'input', value: 'Input' },
    { key: 'special', value: 'Special' },
    { key: 'room_cleaning', value: 'Room Cleaning' },
    { key: 'restroom', value: 'Restroom' },
    { key: 'virus', value: 'Virus' },
    { key: 'special_input', value: 'Special Input' },
    { key: 'vital', value: 'Vital' },
    { key: 'notes', value: 'Notes' },
    { key: 'fall', value: 'Fall' },
    { key: 'call_light', value: 'Call Light' },
    { key: 'cleaning', value: 'Cleaning' },
    // { key: 'unassigned', value: 'Unassigned' },
    //  { key: 'enter', value: 'Enter' },
    // { key: 'exit', value: 'Exit' }
  ];
  uploader: FileUploader;
  buttonDisabled: boolean;
  iconError = '';
  addedType: any = [];
  iconSelected = '';
  selectedTypeItemVirus = false;
  typeSearch = '';
  altSearch = '';
  assetSearch = '';
  defSearch = '';
  org;
  fac;
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
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organiz;
  floorlist;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  count;
  actualDataCount;
  search: any;
  showNew = true;
  showSlider = false;
  showMinMax: boolean = false;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true,
    },
    {
      id: 'city',
      value: 'City',
      sort: false,
    },{
      id: 'state',
      value: 'State',
      sort: false,
    }
   
  ];
  exportdata;
  orgDisable: Boolean = false;
  facDisable: Boolean = false;
  pagiPayload: PagiElement = {
    pageIndex: 0,
    pageSize: 10,
    search: "",
    sort: {active: "name", direction: "asc"},
    fac_id: '',
  };
  public show = false;
  public careAccess: UserAccess = new UserAccess();
  privilege: string = 'add';
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;

  expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  regex = new RegExp(this.expression);

  @HostListener('window:scroll')
  checkScroll() {
    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

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
    if (!this._commonService.checkAllPrivilege('Cares')) {
      this.router.navigate(['/']);
    }
    this.getUserAccess();
    this._commonService.setLoader(true);
    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          // await this.userOrganization();
          // await this.userFacility();
    // await this.getAllLocation();

        }
      }
    );

    if (sessionStorage.getItem('locationListing')) {
      const locationListing = JSON.parse(sessionStorage.getItem('locationListing'));
      if (locationListing.locationList) {
        this.pagiPayload = locationListing.locationList;
        // this.pagiPayload.pageIndex = locationListing.locationList.pageIndex;
        // this.pagiPayload.pageSize = locationListing.locationList.pageSize;
        // this.pagiPayload.length = locationListing.locationList.length;
        // this.pagiPayload.sort = locationListing.locationList.sort;
        // this.pagiPayload.search = locationListing.locationList.search;
        this.search = locationListing.locationList.search;
      } else {
        sessionStorage.setItem(
          'locationListing',
          JSON.stringify({ locationList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'locationListing',
        JSON.stringify({ locationList: this.pagiPayload })
      );
    }
    // this._commonService.payloadSetup('locationList', this.pagiPayload);
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
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    // this.displayedColumns = this.displayedColumns.concat(['icon']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    // this.displayedColumns = this.displayedColumns.concat(['change_status']);
    // this.displayedColumns = this.displayedColumns.concat(['change_show_slider']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    // Pagination
    await this.getServerData(this.pagiPayload);

    // const action1 = { type: 'GET', target: 'assets/list_types' };
    // const payloadParent1 = { isFilteredList: false };
    // const result1 = await this.apiService.apiFn(action1, payloadParent1);
    // this.assetTypeList = result1['data'];

    // const action2   = { type: 'GET', target: 'organization/orglist' };
    // const payload2 = {};
    // const result2  = await this.apiService.apiFn(action2, payload2);
    // this.organiz   = result2['data'];

    this.subscription.add(this.socketService.udpateCareFn().subscribe(async (_response: any) => {
      this.getServerData(this.pagiPayload);
    }));
    this.subscription.add(this.socketService.addCareFn().subscribe(async (_response: any) => {
      this.getServerData(this.pagiPayload);
    }));
    this._commonService.setLoader(false);
  }

  async getAllLocation(){
    const action = { type: 'POST', target: `location/get` };
    const payload= {
      fac_id: this.facility,
      onGround: '',
      pageIndex: 10,
      pageSize: 0,
      search: "",
      sort: {active: "name", direction: "asc"}
    }
    const result = await this.apiService.apiFn(action, payload);
    // console.log(JSON.stringify(result))
    this.locationList = result['data']._locations;
  }

  async cancelForm() {
    delete this.location._id;
    this.isEdit= false;
    this.iconSelected = '';
    const _headers: any = [];
    this.location = {
      name : '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip:null,
      onGround: false
    }
    this.dialogRefs.close();
  }

  async onSubmit(location) {
    if (this.location.name == '' ) {
      this.toastr.error(`Location name can't be empty `);
      return;
    }
    if (this.location.line1 == '' ) {
      this.toastr.error(`Line1 can't be empty `);
      return;
    }
    if (this.location.line2 == '' ) {
      this.toastr.error(`Line2 can't be empty `);
      return;
    }
    if (this.location.city == '' ) {
      this.toastr.error(`City can't be empty `);
      return;
    }
    if (this.location.state == '' ) {
      this.toastr.error(`State can't be empty `);
      return;
    }
    if (this.location.zip == '' || this.location.zip == null ) {
      this.toastr.error(`Zip code can't be empty `);
      return;
    }
    this._commonService.setLoader(true);
    let vaild = location.form.status;
    if (location.name) {
      location.name = location.name.trim();
    }
    if (location.name === '') {
      vaild = 'INVALID';
    }
    // // console.log('vaild---->', vaild);
    // // console.log('cares.form.value---->', cares.form.value);
    if (vaild === 'VALID') {
      let action, payload;
      if(this.isEdit){
        this.isEdit = false;
        action = { type: 'POST', target: 'location/update' };
        payload= {
                _id: this.location._id,
                fac_id: this.facility,
                name: this.location.name,
                line1: this.location.line1,
                line2: this.location.line2,
                city: this.location.city,
                state: this.location.state,
                zip: `${this.location.zip}`,
                onGround: this.location.onGround
            }
      }
      else{
      action = { type: 'POST', target: 'location/add' };
      payload = this.location;
      payload.zip = `${this.location.zip}`
      payload.fac_id = this.facility;
      // console.log(payload)
      }
      
      // console.log('---location---', this.location);
      

      const result = await this.apiService.apiFn(action, payload);
      // console.log(JSON.stringify(result))
      if (result['status'] && result['data']) {
        // console.log(result)
        this._commonService.setLoader(false);
        this.toastr.success(result['message']);
      } else {
        this._commonService.setLoader(false);
        this.toastr.success(result['message']);
      }
      this.location = {
        name : '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip:null,
        onGround: false
      }
      // this._commonService.setLoader(false);
      // this.toastr.show('Care added successfully')
    } else {
      this._commonService.setLoader(false);
      this.toastr.error('Please enter Location details');
    }
  this.dialogRefs.close();

  }


  async addForm() {
    // console.log('this.care---->', this.care);
    this.showNew = true;
    // await this.userOrganization();
    // await this.userFacility();
    if (this.isEdit !== true) {
      this.privilege = 'add';
    }
    // this.faclist  = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    // dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(AddLocationComponent, dialogConfig);
    // this.router.navigate(['/announcement/form']);
  }

  async editForm(id) {
    // console.log(id)
    // console.log(this.locationList)
    this.showNew = true;
    // await this.userOrganization();
    // await this.userFacility();
   this.isEdit = true;
   this.location = this.locationList.find( item => item._id == id)
    // this.faclist  = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    // dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    dialogConfig.data = { location : this.location }
    this.dialogRefs = this.dialog.open(AddLocationComponent, dialogConfig);
    // this.router.navigate(['/announcement/form']);
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
      this.toastr.error('Please select Location to be delete');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'location', id: this.deleteArr, API: 'location/delete' },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.data.forEach((element) => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        } else {
          if (result['status']) {
            this.toastr.success(result['message']);
          }
          this.checked = false;
          this.getServerData(this.pagiPayload);
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
    // console.log(arr)
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    // console.log(this.dataSource)
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

  // addForm() { // Custom-code!
  //   this.router.navigate(['/cares/form']);
  // }

  viewLocation(id) {
    this.router.navigate([
      '/location/view',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }



  deleteLocation(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'location', id: this.deleteItem, API: 'location/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result['status']) {
          this.toastr.success(result['message']);
        }
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }


  public async getCaresDataFunction() {
    const action = {
      type: 'POST',
      target: 'location/get',
    };
    // this.pagiPayload.organization = this.organization;
    this.pagiPayload.fac_id = this.facility;
    const payload = {fac_id: this.pagiPayload.fac_id,
    pageIndex: this.pagiPayload.pageIndex,
    pageSize: this.pagiPayload.pageSize,
    search: this.pagiPayload.search,
    sort: {active: "name", direction: "asc"}
  }
    ;
    // console.log(payload)

    let result = await this.apiService.apiFn(action, payload);
    // console.log(JSON.stringify(result))
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      result = result['data']['_locations']
      this.data = result;
      // console.log(this.data)
      if (this.data && this.data.length > 0) {
        this.actualDataCount = this.data.length;
      }
      // console.log('this.data--->', this.data);
      this.locationList = this.data;
      this.createTable(result);
      this._commonService.setLoader(false);
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
    sessionStorage.setItem(
      'locationListing',
      JSON.stringify({ locationList: this.pagiPayload })
    );
    // this._commonService.updatePayload(null, 'physicianList', this.pagiPayload);
    this.getCaresDataFunction();
  }

  public async getServerData(event?) {
    this._commonService.setLoader(true);
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'locationListing',
      JSON.stringify({ locationList: this.pagiPayload })
    );
    // this._commonService.updatePayload(event, 'locationList', this.pagiPayload);
    this.subscription = await this._commonService.contentdata.subscribe(
      (contentVal: any) => {
        // console.log(contentVal);
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.getCaresDataFunction();
        }
      }
    );
  }


  getUserAccess(){
    this.careAccess.isView = this._commonService.checkPrivilegeModule('cares', 'view');
    this.careAccess.isAdd = this._commonService.checkPrivilegeModule('cares', 'add');
    this.careAccess.isEdit = this._commonService.checkPrivilegeModule('cares', 'edit');
    this.careAccess.isDelete = this._commonService.checkPrivilegeModule('cares', 'delete');
    this.careAccess.isExport = this._commonService.checkPrivilegeModule('cares', 'export');
  }


  // async getTotalCount() {
  //   this.isClicked = false;
  //   this.isLoading = true;
  //   const action = { type: 'GET', target: 'cares/count' };
  //   const payload = this.pagiPayload;
  //   const result = await this.apiService.apiFn(action, payload);
  //   if (result && result['status']) {
  //     this.isLoading = false;
  //     this.isClicked = true;
  //     this.totalCount = result['data']['_count'];
  //   }
  // }
  async ngAfterViewChecked(){
    this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled','true');
  }
}

export interface PagiElement {
  fac_id: "",
  pageIndex: number;
  pageSize: number;
  search: '';
  sort: Object;
}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  pageIndex: number;
  pageSize: number;
}
