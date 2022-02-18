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

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
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
  care: any = {
    name: '',
    default_selection: '',
    alternative_outcomes: '',
    default_value: '',
    order: '',
    type: '',
    min: '',
    max: '',
    unit: '',
    pricing: '',
    asset_type: '',
    organization: '',
    fac: '',
    facility: [],
    notes: [{ id: Math.random(), value: '' }],
  };
  careArray = [];
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
    { key: 'dining', value: 'Dining' }
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
    // {
    //   id: 'default_selection',
    //   value: 'Selection',
    //   sort: false,
    // },
    // , {
    //   id: 'default_value',
    //   value: 'Default Value',
    //   sort: true
    // }
    {
      id: 'order',
      value: 'Order',
      sort: true,
    },
    // {
    //   id: 'type',
    //   value: 'Type',
    //   sort: true,
    // },
  ];
  exportdata;
  orgDisable: Boolean = false;
  facDisable: Boolean = false;
  pagiPayload: PagiElement = {
    moduleName: 'careList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    organization: '',
    facility: '',
    sort: { active: 'name', direction: 'asc' },
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
          await this.userOrganization();
          await this.userFacility();
        }
      }
    );

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.careList) {
        this.pagiPayload = pageListing.careList;
        this.pagiPayload.previousPageIndex =
          pageListing.careList.previousPageIndex;
        // this.pagiPayload.pageIndex = pageListing.careList.pageIndex;
        // this.pagiPayload.pageSize = pageListing.careList.pageSize;
        // this.pagiPayload.length = pageListing.careList.length;
        // this.pagiPayload.sort = pageListing.careList.sort;
        // this.pagiPayload.search = pageListing.careList.search;
        this.search = pageListing.careList.search;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ careList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ careList: this.pagiPayload })
      );
    }
    this._commonService.payloadSetup('careList', this.pagiPayload);
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
    this.displayedColumns = this.displayedColumns.concat(['change_status']);
    // this.displayedColumns = this.displayedColumns.concat(['change_show_slider']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    // Pagination
    await this.getServerData(this.pagiPayload);
    await this.userOrganization();
    await this.userFacility();
    await this.load_careoutcome();
    await this.load_care_types();
    const action1 = { type: 'GET', target: 'assets/list_types' };
    const payloadParent1 = { isFilteredList: false };
    const result1 = await this.apiService.apiFn(action1, payloadParent1);
    this.assetTypeList = result1['data'];

    this.fileUploader();

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

  noteChange(event) {
    if (event.target.value.match(this.regex)) {
      this.toastr.warning('Links are not allowed.');
      event.target.value = '';
    }
    console.log('Care Notes: ', this.care.notes)
  }

  async changeOrg(org) {
    this.org = org;
    // const action  = { type: 'GET', target: 'facility/faclist' };
    // const payload = { 'org_id': org };
    // const result  = await this.apiService.apiFn(action, payload);
    // this.faclist  = result['data'];
    this.care.fac = '';

    const payload2 = { org: org };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
    this.faclist = await result2['data'].map(function (obj) {
      const fObj = {};
      fObj['fac_name'] = obj._id.fac.fac_name;
      fObj['_id'] = obj._id.fac._id;
      return fObj;
    });
    if (this.userFacilityList && this.userFacilityList.length) {
      this.removeAddedFac();
    }

    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName;
  }

  async addFacilityList(care, isFromDone?) {
    // console.log('addFacilityList care--->', care);
    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      this.duplicateFacility = false;
      if (
        (care.organization === '' || care.organization === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Select organization');
        return;
      } else if ((care.fac === '' || care.fac === undefined) && !isFromDone) {
        this.toastr.error('Select Building');
        this.duplicateFacility = true;
        return;
      } else {
        this.ismultifac = true;
        if (
          this.userFacilityList === undefined ||
          this.userFacilityList.length < 1
        ) {
          this.userFacilityList = [
            {
              org_id: care.organization,
              org_name: this.multiorg,
              fac_id: care.fac,
              fac_name: this.multifacility,
            },
          ];
        } else {
          if (
            this.userFacilityList.some(
              (item) =>
                item.fac_name.toLowerCase().trim() ===
                  this.multifacility.toLowerCase().trim() &&
                item.org_name.toLowerCase().trim() ===
                  this.multiorg.toLowerCase().trim()
            )
          ) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
              this.duplicateFacility = true;
            }
          } else {
            this.userFacilityList.push({
              org_id: care.organization,
              org_name: this.multiorg,
              fac_id: care.fac,
              fac_name: this.multifacility,
            });
          }
        }
        if (this.userFacilityList.length > 0) {
          this.showfaclist = true;
          this.ismultifac = true;
          // this.dataSource = new MatTableDataSource(this.userFacilityList);
        } else {
          this.ismultifac = false;
          this.showfaclist = false;
        }
        //io-1181 below code commented
        // if(this.isEdit == true){
        //     this.care['organization'] = '';
        //     this.faclist = [];
        // }
        //this.care['fac']          = '';
        //await this.userOrganization()
        //await this.userFacility()
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        //this.dialogRefs.close();
      }
      // this.care.fac = '';//io-1181
      //this.faclist = [];
    }
    this.removeAddedFac();
  }

  async onRemoveFac(i) {
    if (i != undefined && i != null) {
      this.addfacIn(i);
      this.userFacilityList.splice(i, 1);
      this.care.facility.splice(i, 1);
      this.facListDone = this.userFacilityList;
      if (this.userFacilityList.length > 0) {
        this.showfaclist = true;
        this.ismultifac = true;
      } else if (this.userFacilityList.length === 0) {
        this.showfaclist = false;
        this.ismultifac = false;
      }
    } else {
      this.showNew = false;
    }
  }
  removeAddedFac() {
    console.log('this.faclist---->', this.faclist);
    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z.fac_id == e._id) == -1
    );
    this.orgFacSelection(); //io-1181
  }

  async addfacIn(i) {
    if (this.care.organization) {
      await this.changeOrg(this.care.organization);
    }
    this.facDisable = false;
    this.care.fac = '';
    // this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id}) io-1181
  }
  checkAllwoNum(key) {
    const result = this._commonService.allwoNum(key);
    return result;
  }

  allwoNumDecimal(key) {
    const result = this._commonService.allwoNumDecimal(key);
    return result;
  }
  onTypeChange(newValue) {
    if (
      this.care.type === 'special' ||
      this.care.type === 'list' ||
      this.care.type === 'vital' ||
      this.care.type === 'room_cleaning' ||
      this.care.type === 'restroom'
    ) {
      this.selectedTypeItem = false;
    } else {
      this.selectedTypeItem = true;
    }

    if (newValue === 'virus') {
      this.selectedTypeItemVirus = true;
      this.selectedTypeItem = false;
    } else {
      this.selectedTypeItemVirus = false;
    }

    this.selectedTypeInput = false;
    if (
      this.care.type === 'input' ||
      this.care.type === 'multiple_input' ||
      this.care.type === 'special_input' ||
      this.care.type === 'height' ||
      this.care.type === 'weight' ||
      this.care.type === 'cleaning'
    ) {
      this.selectedTypeInput = true;
    }
    if(this.care.type === 'vital'){
      this.showMinMax = true;
    } else {
      this.showMinMax = false;
    }
  }

  select(org, fac, flag) {
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
    } else {
      if (!org || org === undefined) {
        this.multifacility = fac;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  checkForInputValue(type) {
    return ['input', 'multiple_input', 'special_input'].indexOf(type) > -1;
  }

  async load_careoutcome() {
    const action = {
      type: 'GET',
      target: 'cares/getcareoutcome',
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    // console.log('result data----->', result['data']);
    this.alternateCare = result['data'].reduce((obj, item, index) => {
      obj.push({ key: item._id, value: item.displayName });
      return obj;
    }, []);

    this.careArray = this.alternateCare;
    // console.log('getcareoutcome---->', this.careArray);
  }

  async load_care_types() {
    const action = {
      type: 'GET',
      target: 'cares/types',
    };
    const payload = {
      careId: '',
      fac_id: this.facility,
      org_id: this.organization,
    };
    const result = await this.apiService.apiFn(action, payload);
    this.addedType = result['data'];

    const _arr = [
      'room_cleaning',
      'restroom',
      'virus',
      'vital',
      'weight',
      'height',
    ];
    _arr.forEach((item) => {
      if (this.addedType.indexOf(item) > -1) {
        const index = this.careType.findIndex((_itm) => _itm.key === item);
        if (index > -1) {
          delete this.careType[index];
          this.careType = this.careType.filter(function (el) {
            return el != null;
          });
        }
      }
    });

    if (this.parentId != null) {
    }
  }

  select_alt_outcome(event) {
    const record = this.careArray.find((i) => i.key === event);
    if (this.finalCareArray && this.finalCareArray.length > 0) {
      if (this.finalCareArray.find((i) => i.key === event) === record) {
        for (let i = 0; i < this.finalCareArray.length; i++) {
          if (this.finalCareArray[i].key === record.key) {
            this.finalCareArray.splice(i, 1);
          }
        }
      } else {
        this.finalCareArray.push(record);
      }
    } else {
      this.finalCareArray.push(record);
    }
  }

  async cancelForm(care) {
    delete this.care._id;
    this.userFacilityList = [];
    this.facListDone = [];
    this.isEdit = false;
    this.selectedTypeItem = false;
    this.selectedTypeInput = false;
    this.selectedTypeItemVirus = false;
    this.iconSelected = '';
    const _headers: any = [];
    this.care = {
      name: '',
      default_selection: '',
      alternative_outcomes: '',
      default_value: '',
      order: '',
      type: '',
      min: '',
      max: '',
      unit: '',
      asset_type: '',
      organization: '',
      fac: [],
      facility: [],
    };
    this.dialogRefs.close();
  }

  async onSubmit(cares) {
    this._commonService.setLoader(true);
    let vaild = cares.form.status;
    if (cares.name) {
      cares.name = cares.name.trim();
    }
    if (cares.name === '') {
      vaild = 'INVALID';
    }
    // console.log('vaild---->', vaild);
    // console.log('cares.form.value---->', cares.form.value);
    if (vaild === 'VALID') {
      /* Organization/Facility Validation */
      this.duplicateFacility = '';

      // io-1181 below commented
      /* if(this.showNew){
        if (this.care.organization !== '') {
          if(this.care.fac === '' || this.care.fac === undefined){
            this._commonService.setLoader(false);
            this.toastr.error('Select facility.');
            return;
          }
        }
        if(!this.userFacilityList || !this.userFacilityList.length ){
          if( this.care.organization === '' && !this.care.facility.length){
            this._commonService.setLoader(false);
            this.toastr.error('Select organization.');
            return;
          }
        }
      }*/

      if (
        this.care.organization &&
        this.care.organization !== '' &&
        this.care.fac !== ''
      ) {
        this.addFacilityList(this.care, true);
      }
      /* End Organization/Facility Validation */
      if (!this.duplicateFacility) {
        if (!this.ismultifac) {
          this.care['facility'] = [
            {
              org: this.org,
              fac: this.fac,
            },
          ];
        } else {
          this.care['facility'] = this.userFacilityList.map((item) => ({
            org: item.org_id,
            fac: item.fac_id,
            selected: item['selected'],
          }));
        }
      }
      this.care.notes = this.care.notes
        .filter((e) => e.value !== '' && !(e.value as string).match(this.regex))
        .map((e) => e.value);
      const action = { type: 'POST', target: 'cares/add' };
      if (this.parentId) {
        this.care.parentCareId = this.parentId;
      }
      console.log('---care---', this.care);
      let payload = this.care;
      if(typeof(this.care.pricing) != 'number' && this.care.pricing.includes('$')){
        payload['pricing'] = parseFloat(this.care.pricing.substring(1));
      }
      const result = await this.apiService.apiFn(action, payload);
      if (result['status'] && result['data']) {
        const careID = result['data']['_id'];
        this.uploader.options.url =
          this.uploader.options.url.replace('}', '') + '/' + careID;
        if (this.uploader.queue && this.uploader.queue.length > 0) {
          this.uploader.queue.filter((x) => {
            x.url = x.url.replace('}', '') + '/' + careID;
          });
        }
        setTimeout(() => {
          this.uploadQueue(() => {
            setTimeout(() => {
              this._commonService.setLoader(false);
              if (result['status']) {
                if (this.toastr.currentlyActive === 0) {
                  this.toastr.success(result['message']);
                }
                if (this.parentId) {
                  this.router.navigate([
                    '/cares/view',
                    this._aes256Service.encFnWithsalt(this.parentId),
                  ]);
                } else {
                  this.cancelForm(cares);
                  this.getServerData(this.pagiPayload);
                  //this.router.navigate(['/cares']);
                }
              } else {
                if (this.toastr.currentlyActive === 0) {
                  this.toastr.error(result['message']);
                }
              }
            }, 100);
          });
        }, 100);
      } else {
        this._commonService.setLoader(false);
        this.toastr.error(result['message']);
      }
      // this._commonService.setLoader(false);
      // this.toastr.show('Care added successfully')
    } else {
      this._commonService.setLoader(false);
      this.toastr.error('Please enter care details');
    }
  }

  uploadQueue(next = null) {
    this.buttonDisabled = true;
    const files = this.uploader.queue;

    files.forEach((file) => {
      if (file.progress === 0) {
        file.upload();
        file.onError = (response: string, status: number, headers: any) => {};
        file.onSuccess = (response: any, status: number, headers: any) => {
          const res = JSON.parse(response);
          if (next) {
            next();
          }
        };
      }
    });

    if (!files || (files && files.length === 0)) {
      if (next) {
        next();
      }
    }
    setTimeout(() => {
      this.buttonDisabled = false;
    }, 200);
  }

  async userOrganization() {
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['org_name'] = obj._id.org.org_name;
      rObj['_id'] = obj._id.org._id;
      return rObj;
    });
    let defaultOrgName;
    for (var i = 0; i < this.organiz.length; i++) {
      if (this.organization == this.organiz[i]._id) {
        defaultOrgName = this.organiz[i].org_name;
      }
    }
    if (this.organiz.length === 1) {
      this.care.organization = this.organization;
      this.orgDisable = true;
      // await this.userFacility();
      console.log('this.care.organization--->', this.care.organization);
    } else {
      this.orgDisable = false;
    }
    this.multiorg = defaultOrgName;
    //io-1181 below commented
    /*if(this.isEdit !== true){
      this.care.organization = this.organization;
    }*/

    // console.log('userOrganization this.organiz--->', this.organiz);
  }

  async userFacility() {
    const payload = { org: this.organization };
    // console.log('payload--->', payload);
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload);
    this.faclist = await result2['data'].map(function (obj) {
      const fObj = {};
      fObj['fac_name'] = obj._id.fac.fac_name;
      fObj['_id'] = obj._id.fac._id;
      return fObj;
    });
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName;
    if (this.isEdit !== true) {
      // this.care.fac = this.facility;//io-1181
    } else {
      this.removeAddedFac(); // io-1181
      // this.faclist = []; //io-1181
    }
    this.orgFacSelection(); // io-1181

    // console.log('userFacility this.faclist---->', this.faclist);
  }

  async addForm() {
    console.log('this.care---->', this.care);
    this.showNew = true;
    await this.userOrganization();
    await this.userFacility();
    if (this.isEdit !== true) {
      this.care = this.Care();
      this.privilege = 'add';
      // this.isEdit === false;
    }
    // this.faclist  = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    // dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addModal, dialogConfig);
    // this.router.navigate(['/announcement/form']);
  }

  changeShowSlider(event) {
    console.log('event.checked', event.checked);
    this.showSlider = event.checked;
    this.care.showSlider = event.checked;
  }

  onFileChanged(event) {
    const _validFileExtensions = ['.jpg', '.jpeg', '.bmp', '.gif', '.png'];
    const oInput = event.target.files[0];

    const sFileName = oInput.name;
    if (sFileName.length > 0) {
      let blnValid = false;
      for (let j = 0; j < _validFileExtensions.length; j++) {
        const sCurExtension = _validFileExtensions[j];
        if (
          sFileName
            .substr(
              sFileName.length - sCurExtension.length,
              sCurExtension.length
            )
            .toLowerCase() === sCurExtension.toLowerCase()
        ) {
          blnValid = true;
          break;
        }
      }

      if (!blnValid) {
        this.iconError = 'Only image allow to upload.';
        this.iconSelected = '';
        return false;
      }
    }

    this.iconError = '';
    this.iconSelected = sFileName;
    return true;
  }

  async fileUploader(careId = '') {
    let url = '';
    if (careId !== '') {
      url = environment.config.api_url + 'cares/uploadicon/' + careId;
    } else {
      url = environment.config.api_url + 'cares/uploadicon';
    }
    const _headers: any = await this.apiService.setHeadersForFileUpload();
    if (this.care.image && this.care.image.location) {
      _headers.push({ name: 'oldimagename', value: this.care.image.imageName });
    }
    this.uploader = new FileUploader({
      url: url,
      method: 'POST',
      disableMultipart: false,
      headers: _headers,
      maxFileSize: 1024 * 1024, // 1 MB
      queueLimit: 1,
      allowedMimeType: ['image/jpeg', 'image/png', 'image/tiff'],
    });
    this.uploader.onBeforeUploadItem = (item) => {
      item.withCredentials = false;
    };
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
      this.toastr.error('Please select care to be delete');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'cares', id: this.deleteArr, API: 'cares/delete' },
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

  // addForm() { // Custom-code!
  //   this.router.navigate(['/cares/form']);
  // }

  viewCare(id) {
    this.router.navigate([
      '/cares/view',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }

  async editCare(id) {
    this.showNew = true;
    this._commonService.setLoader(true);
    this.isEdit = true;
    this.privilege = 'edit';
    const action = {
      type: 'POST',
      target: 'cares/view',
    };
    const payload = { careId: id };
    const result = await this.apiService.apiFn(action, payload);

    if (result['data'] && result['data'].notes && result['data'].notes.length) {
      result['data'].notes = result['data'].notes.map((e) => ({
        id: Math.random(),
        value: e,
      }));
    } else {
      result['data'].notes = [{ id: Math.random(), value: '' }];
    }

    this.care = result['data'];
    if(!this.care.pricing || typeof(this.care.pricing) === 'object'){
      this.care.pricing = '$' + 0;
    } else {
      this.care.pricing = Number.isInteger(this.care.pricing) ?  '$' + this.care.pricing + '.00' : '$' + this.care.pricing;
    }
    this.addCareNote(1);
    this.userFacilityList = this.care.facility.map((item) => ({
      org_id: item.org._id,
      org_name: item.org.org_name,
      fac_id: item.fac._id,
      fac_name: item.fac.fac_name,
      selected: item.selected,
    }));
    this.facListDone = this.userFacilityList;

    // io-1181 below if else and if condition
    if (result['data']['facility'].length > 0) {
      this.removeAddedFac();
      this.ismultifac = true;
    } else {
      this.ismultifac = false;
      this.showfaclist = false;
      this.orgFacSelection();
    }
    if (!this.care.organization) {
      this.care.organization = '';
    }

    if (this.care.parentCareId) {
      this.parentId = this.care.parentCareId;
    } else {
      this.careType.push();
    }
    if (
      this.care.type === 'special' ||
      this.care.type === 'list' ||
      this.care.type === 'room_cleaning' ||
      this.care.type === 'restroom'
    ) {
      this.selectedTypeItem = false;
    } else {
      this.selectedTypeItem = true;
    }

    if (this.care.type === 'virus') {
      this.selectedTypeItemVirus = true;
      this.selectedTypeItem = false;
    }

    this.selectedTypeInput = false;
    if (
      this.care.type === 'input' ||
      this.care.type === 'multiple_input' ||
      this.care.type === 'special_input' ||
      this.care.type === 'height' ||
      this.care.type === 'weight'
    ) {
      this.selectedTypeInput = true;
    }

    this.caremsg = '';
    if (this.care.name === 'ACCU Check') {
      this.caremsg =
        'Healthy minimum and maximum, before a meal, blood glucose is 80–130 mg/dLX according to the American Diabetes Association.';
    }

    const alternative_outcomes = [];
    if (this.care.alternative_outcomes) {
      this.care.alternative_outcomes.map(function (value, key) {
        const record = this.careArray.find((i) => i.key === value._id);
        alternative_outcomes.push(value._id);
        this.finalCareArray.push(record);
      }, this);
      this.care.alternative_outcomes = alternative_outcomes;
    }
    if (this.care.default_selection) {
      this.care.default_selection = this.care.default_selection._id;
    }
    this.care.type && this.care.type === 'vital' ? this.showMinMax = true : this.showMinMax = false;
    this.addForm();
    this._commonService.setLoader(false);
    //this.router.navigate(['/cares/form', this._aes256Service.encFnWithsalt(id) ]);
  }

  async toggle() {
    this.show = !this.show;
  }

  async changeName(name) {}

  async changeFac(fac, e) {
    this.fac = fac;
  }

  async changeSelection(selection) {}

  async changeDefaultvalue(deftaultvalue) {}
  async changeOrder(order) {}
  async changeType(type) {}

  deleteCare(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'cares', id: this.deleteItem, API: 'cares/delete' },
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

  async changeStatus(event, care_id, showSlider) {
    const action = { type: 'POST', target: 'cares/changeStatus' };
    const payload = { status: event.checked, careId: care_id };
    // console.log('status payload------>', payload);
    const result = await this.apiService.apiFn(action, payload);
    console.log('result of changeStatus', result);
  }

  // record pain when shown in list view
  async changePainSlider(event, care_id, status) {
    const action = { type: 'POST', target: 'cares/changeStatus' };
    const payload = { status: status, careId: care_id, showSlider: event.checked, updatePainSlider: true };
    // console.log('pain payload------>', payload);
    const result = await this.apiService.apiFn(action, payload);
    console.log('result of changePainSlider', result);
  }

  async exportCares() {
    const action = {
      type: 'POST',
      target: 'cares/export',
    };
    let _selectedUser = { selectedUser: this.deleteArr };
    const payload = { ..._selectedUser, ...this.pagiPayload };
    let result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      const data = result['data'];
      this.exportdata = data['_cares'];
      const cares = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(cares, 'Cares_Report');
    }
  }

  prepareUsersForCSV() {
    const cares = [];
    this.exportdata.forEach((item) => {
      cares.push({
        Name: item.name ? item.name : '-',
        Default_outcome: item.default_outcome ? item.default_outcome : '-',
        // 'Default_selection': item.default_selection ? item.default_selection : '-',
        Default_value: item.default_value ? item.default_value : '-',
        Order: item.order ? item.order : '-',
        Type: item.type ? item.type : '-',
        Deleted: item.deleted ? 'true' : 'false',
      });
    });
    return cares;
  }

  public async getCaresDataFunction() {
    const action = {
      type: 'GET',
      target: 'cares',
    };
    this.pagiPayload.organization = this.organization;
    this.pagiPayload.facility = this.facility;
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    console.log("Cares",result);
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      result = result['data']['_cares'].map((item) => {
        return {
          ...item,
          status: item.status != undefined ? item.status : true,
          icon: item.icon && item.icon != undefined ? item.icon : '',
          name: item.name,
          default_selection: item.default_selection
            ? item.default_selection.displayName
            : '-',
          default_value: item.default_value ? item.default_value : '-',
          order: item.order,
          type: item.type,
        };
      });
      this.data = result;
      if (this.data && this.data.length > 0) {
        this.actualDataCount = this.data.length;
      }
      console.log('this.data--->', this.data);
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
      'pageListing',
      JSON.stringify({ careList: this.pagiPayload })
    );
    this._commonService.updatePayload(null, 'physicianList', this.pagiPayload);
    this.getCaresDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ careList: this.pagiPayload })
    );
    this._commonService.updatePayload(event, 'careList', this.pagiPayload);
    this.subscription = await this._commonService.contentdata.subscribe(
      (contentVal: any) => {
        console.log(contentVal);
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.getCaresDataFunction();
        }
      }
    );
  }
  addCareNote(i) {

    this.care.notes.unshift({
      id: Math.random() + this.care.notes.length,
      value: ''
    })

    // this.care.notes.push({
    //   id: Math.random() + this.care.notes.length,
    //   value: '',
    // });
  }
  removeCareNote(i) {
    this.care.notes.splice(i, 1);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.care.notes, event.previousIndex, event.currentIndex);
  }

  Care() {
    return {
      name: '',
      default_selection: '',
      alternative_outcomes: '',
      default_value: '',
      order: '',
      type: '',
      min: '',
      max: '',
      unit: '',
      pricing: '',
      asset_type: '',
      organization: '',
      fac: '',
      facility: [],
      notes: [{ id: Math.random(), value: '' }],
    };
  }

  orgFacSelection() {
    console.log({
      org_ln: this.organiz.length,
      fac_ln: this.faclist.length,
      orglist: this.organiz,
      faclist: this.faclist,
    });
    console.log('----ln-----', this.organiz.length, this.faclist.length);

    if (this.organiz.length == 1 && this.faclist.length == 1) {
      // organization manage
      this.orgDisable = true;
      this.care.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = true;
      this.care.fac = this.faclist[0]['_id'];
      this.multifacility = this.faclist[0]['fac_name'];
    } else if (this.organiz.length == 1 && this.faclist.length > 1) {
      // console.log('this.faclist.length------------>', this.faclist);
      // organization manage
      this.care.organization = this.organization;
      this.orgDisable = true;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.care.fac = '';
    } else if (this.organiz.length > 1) {
      // organization manage
      this.orgDisable = false;
      // this.announcement.organization = ''
      // this.multiorg = this.organiz[0]['org_name']

      // facility manage
      this.facDisable = false;
      this.care.fac = '';
      this.multifacility =
        this.faclist && this.faclist.length && this.faclist[0]['fac_name']
          ? this.faclist[0]['fac_name']
          : '';
    } else if (this.organiz.length == 1 && this.faclist.length == 0) {
      // organization manage
      this.orgDisable = true;
      this.care.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.care.fac = '';
      //  this.multifacility=this.faclist[0]['fac_name']
    } else {
      // organization manage
      this.orgDisable = false;
      this.care.organization = '';

      // facility manage
      this.facDisable = false;
      this.care.fac = '';
    }
  }

  getUserAccess(){
    this.careAccess.isView = this._commonService.checkPrivilegeModule('cares', 'view');
    this.careAccess.isAdd = this._commonService.checkPrivilegeModule('cares', 'add');
    this.careAccess.isEdit = this._commonService.checkPrivilegeModule('cares', 'edit');
    this.careAccess.isDelete = this._commonService.checkPrivilegeModule('cares', 'delete');
    this.careAccess.isExport = this._commonService.checkPrivilegeModule('cares', 'export');
  }
  onPriceBlur(){
    if(this.care.pricing.includes('$')){
      this.care.pricing = parseFloat(this.care.pricing.substring(1))
    }
    var formatter = new Intl.NumberFormat('en-US',{
      style: 'currency',
      currency: 'USD'
    })
    this.care.pricing = formatter.format(this.care.pricing);
  }

  onCareNameBlur(){
    if(this.care.type && this.care.type.toLowerCase() === 'vital'){
      this.showMinMax = true;
    } else {
      this.showMinMax = false;
    }
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'cares/count' };
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

export interface PagiElement {
  moduleName?: string;
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
  organization: '';
  facility: '';
}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}
