import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  TemplateRef,
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
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
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
import { MatOption } from '@angular/material';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from 'rxjs/operators';
//  import { bypassSanitizationTrustResourceUrl } from '@angular/core/src/sanitization/bypass';

import { MatTable } from '@angular/material/table';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
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
    private fb: FormBuilder,
    public _commonService: CommonService
  ) {
    this.createPropertyForm();
  }
  @ViewChild('table', { static: true }) table: MatTable<any>;
  @ViewChild('addSymptomEle', { static: true }) addSymptomEle: TemplateRef<any>;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  @ViewChild('deleteButton', { static: true }) private deleteButton: ElementRef;
  @ViewChild('restoreButton', { static: true })
  private restoreButton: ElementRef;

  public btnAction: Function;
  organization;
  facility;
  private subscription: Subscription;
  addSymptomInput: any = {
    name: '',
    isolation_days: '',
    isCovid: false,
  };
  symptoms: any = {
    organization: '',
    fac: '',
    facility: [],
  };
  addSymptomList = [];
  //  MATPAGINATOR
  //  pageEvent: PageEvent;
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
  org;
  fac;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  sortActive = 'order';
  sortDirection: 'asc' | 'desc' | '';
  count;
  actualDataCount;
  search: any;
  isArcheive: boolean = false;
  orgSearch = '';
  facSearch = '';
  searchCtrl = '';
  theSearch = '';
  defaultAlert;
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
  public facList = [];
  public facList2 = [];
  public facListDone = [];
  showNew = true;
  showPop = true;
  orgDisable: Boolean = false;
  facDisable: Boolean = false;
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
      id: 'is_isolation',
      value: 'Isolation',
      sort: true,
    },
    {
      id: 'isolation_days',
      value: 'Isolation days',
      sort: true,
    },
  ];
  exportdata;
  pagiPayload: PagiElement = {
    moduleName: 'symptomList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };
  public show = false;
  @HostListener('window:scroll')
  dialogRefs = null;
  isEdit = false;
  isOptionField: boolean;
  symptom: any = {
    name: '',
    is_isolation: false,
    isolation_days: '',
  };
  symptomForm: FormGroup;
  public temparray: any = [];
  editId: any = null;
  btnClass: string;
  privilege = 'add';
  public isLoading = false;
  public isClicked = false;
  hasNextPage = false;
  enable_covid_toggle = false;
  public totalCount: any;
  checkScroll() {
    //  window의 scroll top
    //  Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

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

  //  TODO: Cross browsing
  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    if (!this._commonService.checkAllPrivilege('Symptoms')) {
      this.router.navigate(['/']);
    }

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.symptomList) {
        this.pagiPayload = pageListing.symptomList;
        this.search = pageListing.symptomList.search;
        //  this.pagiPayload = pageListing.symptomList;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ symptomList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ symptomList: this.pagiPayload })
      );
    }
    this._commonService.payloadSetup('symptomList', this.pagiPayload);

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.displayedColumns = this.displayedColumns.concat(['change_status']);

    this.displayedColumns = this.displayedColumns.concat(['actions']);
    //  Pagination
    this.getServerData(this.pagiPayload);
    //  get organization list:
    //  const action2  = { type: 'GET', target: 'organization/orglist' };
    //  const payload2 = {};
    //  const result2  = await this.apiService.apiFn(action2, payload2);
    //  this.organiz   = result2['data'];
    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
      }
    );
  }

  async changeOrg(org) {
    this.org = org;
    //  const action  = { type: 'GET', target: 'facility/faclist' };
    //  const payload = { 'org_id': org };
    //  const result  = await this.apiService.apiFn(action, payload);
    //  this.faclist  = result['data'];
    this.symptoms.fac = '';

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

  async changeFac(fac, e) {
    this.fac = fac;
  }

  select(org, fac, flag) {
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
      console.log(this.multiorg);
      console.log(this.multifacility);
    } else {
      if (!org || org === undefined) {
        this.multifacility = fac;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  async addFacilityList(symptoms, isFromDone?) {
    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      this.duplicateFacility = false;
      if (
        (symptoms.organization === '' || symptoms.organization === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Select organization');
        return;
      } else if (
        (symptoms.fac === '' || symptoms.fac === undefined) &&
        !isFromDone
      ) {
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
              org_id: symptoms.organization,
              org_name: this.multiorg,
              fac_id: symptoms.fac,
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
              org_id: symptoms.organization,
              org_name: this.multiorg,
              fac_id: symptoms.fac,
              fac_name: this.multifacility,
            });
          }
        }
        if (this.userFacilityList.length > 0) {
          this.showfaclist = true;
          this.ismultifac = true;
        } else {
          this.ismultifac = false;
          this.showfaclist = false;
        }

        // io-1181 below code commented
        //  if(this.isEdit == true){
        //      this.symptoms['organization'] = '';
        //      this.faclist = [];
        //  }
        //  this.symptoms['fac']          = '';
        //  await this.userOrganization()
        //  await this.userFacility()
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        // this.dialogRefs.close();
      }
      //  this.symptoms.fac = ''; io-1181
      // this.faclist = [];
    }
    this.removeAddedFac();
  }
  removeAddedFac() {
    console.log('--organiz--', this.organiz, this.faclist);

    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z.fac_id == e._id) == -1
    );
    this.orgFacSelection(); // io-1181
  }

  async addfacIn(i) {
    if (this.symptoms.organization) {
      await this.changeOrg(this.symptoms.organization);
    }
    this.facDisable = false;
    this.symptoms.fac = '';
    //  this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id}) io-1181
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

  async onRemoveFac(i) {
    if (i != undefined && i != null) {
      this.addfacIn(i);
      this.userFacilityList.splice(i, 1);
      this.symptoms.facility.splice(i, 1); // io-1181
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

  delete() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select symptom to be deleted');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'symptoms', id: this.deleteArr, API: 'symptoms/delete' },
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
    //  this.dataSource.sort = this.sort;
    let arrLen = arr.length;
    if (arrLen < this.pagiPayload.pageSize) {
      let startIndex = this.pagiPayload.pageIndex * this.pagiPayload.pageSize;
      let endIndex = startIndex + arrLen;
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = startIndex + 1 + ' - ' + endIndex;
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    } else {
      let tempRange = this.paginator._intl.getRangeLabel(
        this.pagiPayload.pageIndex,
        this.pagiPayload.pageSize,
        arr.length
      );
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = tempRange.substring(0, tempRange.indexOf('o'));
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    }
  }

  deleteSymptom(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'symptoms', id: this.deleteItem, API: 'symptoms/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result != false) {
        if (result['status']) {
          this.toastr.success(result['message']);
        }
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  changeCovidToggle(event) {
    this.addSymptomInput.isCovid = event.checked;
    // this.enable_covid_toggle = event.checked;
  }

  // Changes Restore Start
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
      this.toastr.error('Please select symptom to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'restore_user',
          id: this.deleteArr,
          restore_data: 'restore_data',
          API: 'symptoms/delete',
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
          this.toastr.success('Symptom restored successfully');
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
  //  Single Restore Button
  restoreSym(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'restore_user',
        id: this.deleteItem,
        restore_data: 'restore_data',
        API: 'symptoms/delete',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result != false) {
        if (result['status']) {
          this.toastr.success('Symptom restored successfully');
        }
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  // Changes Restore End

  public async getSymptomsDataFunction() {
    const action = {
      type: 'GET',
      target: 'symptoms',
    };
    const payload = this.pagiPayload;
    if (this.isArcheive === true) {
      payload['restore'] = true;
    } else {
      payload['restore'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    //  result = result['data'];
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      result = result['data']['_symptoms'].map((item) => {
        return {
          ...item,
          name: item.name,
          is_isolation: item.is_isolation ? 'Yes' : 'No',
          isolation_days: item.is_isolation ? item.isolation_days : '--',
          order: item.order,
        };
      });
      this.data = result;
      if (this.data && this.data.length > 0) {
        this.actualDataCount = this.data.length;
      }
      this.createTable(result);
      this._commonService.setLoader(false);
    }
  }

  sortData(sort?: PageEvent) {
    //  console.log('sortsortsortsortsort',sort);
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
      JSON.stringify({ symptomList: this.pagiPayload })
    );
    this._commonService.updatePayload(null, 'symptomList', this.pagiPayload);
    this.getSymptomsDataFunction();
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
      JSON.stringify({ symptomList: this.pagiPayload })
    );
    this._commonService.updatePayload(event, 'symptomList', this.pagiPayload);
    this.getSymptomsDataFunction();
  }

  get optionsPoints() {
    return this.symptomForm.get('options') as FormArray;
  }
  createPropertyForm() {
    this.symptomForm = this.fb.group({
      _id: [null, []],
      name: ['', [Validators.required]],
      is_isolation: [false, []],
      isCovid: [false, []],
      isolation_days: ['', []],
    });
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
    this.multiorg = defaultOrgName;
    // io-1181 below commented
    /* if(this.isEdit !== true){
      this.symptoms.organization = this.organization;
    }*/
  }

  async userFacility() {
    const payload2 = { org: this.organization };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
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
      //  this.symptoms.fac = this.facility; // io-1181
    } else {
      this.removeAddedFac(); //  io-1181
      //  this.faclist = []; io-1181
    }

    this.orgFacSelection(); // io-1181
  }

  async addSymptom() {
    this.showNew = true;
    this.showPop = true;
    await this.userOrganization();
    await this.userFacility();
    if (this.isEdit == false) {
      this.addSymptomInput.name = '';
      this.addSymptomInput.isolation_days = '';
      this.addSymptomInput.isCovid = false;
      this.privilege = 'add';
    }
    // this.faclist   = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'repeatDialog';
    //  dialogConfig.disableClose      = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addSymptomEle, dialogConfig);
  }

  closeSymptomDialog(symptoms): void {
    this.symptoms.organization = '';
    this.symptoms.fac = [];
    this.symptoms.facility = '';
    delete this.symptoms._id;
    this.userFacilityList = [];
    this.facListDone = [];
    this.isEdit = false;
    this.duplicateFacility = false;
    this.isOptionField = false;
    this.symptomForm.reset();
    this.addSymptomList = [];
    this.dialogRefs.close();
  }

  async saveSymptomDialog(symptoms) {
    if (!this.addSymptomList.length && !this.addSymptomInput.name) {
      this._commonService.setLoader(false);
      this.toastr.error('Please add symptom name.');
      return;
    }
    // if (this.addSymptomInput.isCovid && !this.addSymptomInput.isolation_days) {
    //   this._commonService.setLoader(false);
    //   this.toastr.error('Please add isolation days.');
    //   return;
    // }
    /* Organization/Facility Validation */
    this.duplicateFacility = '';

    //  io-1181 below commented
    //  if(this.showNew){
    //    if (symptoms.organization !== '' && !symptoms._id) {
    //      if(symptoms.fac === '' || symptoms.fac === undefined){
    //        this.toastr.error('Select facility.');
    //        return;
    //      }
    //    }
    //    if(!this.userFacilityList || !this.userFacilityList.length ){
    //      if( symptoms.organization === '' && !symptoms.facility.length){
    //        this.toastr.error('Select organization.');
    //        return;
    //      }
    //    }
    //  }

    if (symptoms.organization !== '' && symptoms.fac !== '') {
      this.addFacilityList(symptoms, true);
    }
    /* End Organization/Facility Validation */
    if (!this.duplicateFacility) {
      if (!this.ismultifac) {
        this.symptoms['facility'] = [
          {
            org: this.org,
            fac: this.fac,
          },
        ];
      } else {
        this.symptoms['facility'] = this.userFacilityList.map((item) => ({
          org: item.org_id,
          fac: item.fac_id,
          selected: item['selected'],
        }));
      }
    }
    let data: any = [];
    if (this.isEdit) {
      if (
        this.addSymptomInput.name === '' ||
        this.addSymptomInput.name === undefined
      ) {
        this.toastr.error('Please enter Symptom name.');
        return;
      }
      if (this.addSymptomInput.isCovid && !this.addSymptomInput.isolation_days) {
        this._commonService.setLoader(false);
        this.toastr.error('Please add isolation days.');
        return;
      }
      data = {
        _id: this.symptom._id,
        name: this.addSymptomInput.name,
        facility: this.symptoms.facility,
        isCovid: this.addSymptomInput.isCovid,
        is_isolation:
          this.addSymptomInput.isolation_days &&
          this.addSymptomInput.isolation_days != ''
            ? true
            : false,
        isolation_days:
          this.addSymptomInput.isolation_days &&
          this.addSymptomInput.isolation_days != ''
            ? this.addSymptomInput.isolation_days
            : 0,
      };
    } else {
      //  console.log('addd--->');
      const nTagIdArray = [];
      for (let i = 0; i < this.addSymptomList.length; i++) {
        if (this.addSymptomList[i].name !== '') {
          const newVar = {
            name: this.addSymptomList[i].name,
            facility: this.symptoms.facility,
            isCovid: this.addSymptomList[i].isCovid,
            isolation_days:
              this.addSymptomList[i].isolation_days &&
              this.addSymptomList[i].isolation_days != ''
                ? this.addSymptomList[i].isolation_days
                : 0,
            is_isolation:
              this.addSymptomList[i].isolation_days &&
              this.addSymptomList[i].isolation_days != ''
                ? true
                : false,
          };
          nTagIdArray.push(newVar);
        }
      }
      if (!nTagIdArray.length && !this.addSymptomInput.name) {
        this._commonService.setLoader(false);
        this.toastr.error('Please add symptom name.');
        return;
      }
      if (this.addSymptomInput.name) {
        const newVar2 = {
          name: this.addSymptomInput.name,
          facility: this.symptoms.facility,
          isCovid: this.addSymptomInput.isCovid,
          isolation_days:
            this.addSymptomInput.isolation_days &&
            this.addSymptomInput.isolation_days != ''
              ? this.addSymptomInput.isolation_days
              : 0,
          is_isolation:
            this.addSymptomInput.isolation_days &&
            this.addSymptomInput.isolation_days != ''
              ? true
              : false,
        };
        nTagIdArray.push(newVar2);
      }
      //  return;
      let checkID: any;
      checkID = {
        ntags: nTagIdArray,
      };
      data = checkID;
      /*let checkData = [];
        let iterator  = data.ntags;
        iterator.forEach(function(item) {
          Object.keys(item).forEach(function(key) {
          checkData.push(item[key]);
          });
        });
        let duplicate      = checkData.filter((s => v => s.has(v) || !s.add(v))(new Set));
        let checkDuplicate = duplicate.filter(x => x).join(', ');
        if(checkDuplicate.length > 0){
         this._commonService.setLoader(false);
         this.toastr.error('Please enter unique NFC tags.');
         return false;
        }             */
    }
    //  console.log('this.symptoms.facility.length--->', this.symptoms.facility.length);
    //  console.log('this.symptoms.facility--->', this.symptoms.facility);
    if (
      this.symptoms &&
      this.symptoms.facility &&
      this.symptoms.facility.length < 2
    ) {
      if (
        this.symptoms.facility[0].org == undefined ||
        this.symptoms.facility[0].fac == undefined
      ) {
        this._commonService.setLoader(false);
        this.toastr.error('Please select org and facility.');
        return;
      }
    }
    /*if ( this.symptomForm.valid &&  this.symptomForm.controls.name.value.trim()!='') {*/
    this._commonService.setLoader(true);
    //  const data = {
    //    '_id': this.symptomForm.controls._id.value,
    //    'name': this.symptomForm.controls.name.value,
    //    'is_isolation': this.symptomForm.controls.is_isolation.value,
    //    'isolation_days': (this.symptomForm.controls.is_isolation.value && this.symptomForm.controls.isolation_days.value!='')?this.symptomForm.controls.isolation_days.value:0,
    //  };

    const action = {
      type: 'POST',
      target: 'symptoms/add',
    };
    const payload = data;
    console.log(' == save payload ==', JSON.stringify(payload)); //  return;
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message']);
      this.addSymptomList = [];
      this.closeSymptomDialog(symptoms);
      this.getServerData(this.pagiPayload);
      this._commonService.setLoader(true);
      //  this.dialogRefs.close();
    } else {
      this._commonService.setLoader(false);
      this.toastr.error(result['message']);
    }
    //  } else {
    //    this.toastr.error('Please fill all fields');
    //    this._commonService.setLoader(false);
    //  }
  }

  async editSymptom(symptomId) {
    this.showNew = true;
    this.privilege = 'edit';
    await this.userOrganization(); //  io-1181
    await this.userFacility(); //  io-1181
    this.showPop = true;
    this.isEdit = true;
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'symptoms/view',
    };
    const payload = { symptomId: symptomId };
    const result = await this.apiService.apiFn(action, payload);
    this.symptom = result['data']['_symptom'];
    if (
      this.symptom.facility &&
      this.symptom.facility.length &&
      this.symptom.facility[0].org
    ) {
      this.userFacilityList = this.symptom.facility.map((item) => ({
        org_id: item.org._id,
        org_name: item.org.org_name,
        fac_id: item.fac._id,
        fac_name: item.fac.fac_name,
        selected: item.selected,
      }));
    }
    this.facListDone = this.userFacilityList;

    // io-1181 below if else and if condition
    if (result['data']['_symptom']['facility'].length > 0) {
      this.removeAddedFac();
      this.ismultifac = true;
    } else {
      this.ismultifac = false;
      this.showfaclist = false;
      this.orgFacSelection();
    }
    if (!this.symptoms.organization) {
      this.symptoms.organization = '';
    }

    this.addSymptomList = [];
    this.addSymptomInput['name'] = this.symptom.name;
    this.addSymptomInput['isolation_days'] = this.symptom.isolation_days;
    this.addSymptomInput['isCovid'] = this.symptom.isCovid;
    this._commonService.setLoader(false);

    this.symptomForm.patchValue(this.symptom);
    this.addSymptom();
  }

  async changeStatus(event, symptom_id) {
    const action = { type: 'POST', target: 'symptoms/changeStatus' };
    const payload = { status: event.checked, symptomId: symptom_id };
    const result = await this.apiService.apiFn(action, payload);
    //  console.log('result of enable disable user',result);
  }

  addOption(addSymptomInput) {
    if (!this.showPop) {
      this.showPop = true;
      return;
    } else {
      if (addSymptomInput.name === '' || addSymptomInput.name === undefined) {
        this.toastr.error('Please enter Symptom name.');
      } else {
        if (addSymptomInput.isCovid && !addSymptomInput.isolation_days) {
          this.toastr.error('Please enter isolation days.');
          return;
        }
        if (
          this.addSymptomList === undefined ||
          this.addSymptomList.length < 1
        ) {
          this.addSymptomList = [
            {
              name: addSymptomInput.name,
              isolation_days: addSymptomInput.isolation_days,
              isCovid: addSymptomInput.isCovid,
            },
          ];
        } else {
          this.addSymptomList.push({
            name: addSymptomInput.name,
            isolation_days: addSymptomInput.isolation_days,
            isCovid: addSymptomInput.isCovid,
          });
        }
        this.addSymptomInput['name'] = '';
        this.addSymptomInput['isolation_days'] = '';
        this.addSymptomInput['isCovid'] = false;
        console.log(' == End ==', this.addSymptomList);
      }
    }
  }

  removeOption(key) {
    if (key) {
      this.addSymptomList.splice(key, 1);
    } else {
      this.showPop = false;
    }
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
      this.symptoms.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = true;
      this.symptoms.fac = this.faclist[0]['_id'];
      this.multifacility = this.faclist[0]['fac_name'];
    } else if (this.organiz.length == 1 && this.faclist.length > 1) {
      console.log('---here------------', this.faclist);
      // organization manage
      this.orgDisable = true;
      this.symptoms.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
    } else if (this.organiz.length > 1) {
      // organization manage
      this.orgDisable = false;
      //  this.announcement.organization = ''
      //  this.multiorg = this.organiz[0]['org_name']

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
      this.multifacility =
        this.faclist && this.faclist.length && this.faclist[0]['fac_name']
          ? this.faclist[0]['fac_name']
          : '';
    } else if (this.organiz.length == 1 && this.faclist.length == 0) {
      // organization manage
      this.orgDisable = true;
      this.symptoms.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
      //   this.multifacility=this.faclist[0]['fac_name']
    } else {
      // organization manage
      this.orgDisable = false;
      this.symptoms.organization = '';

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
    }
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'symptoms/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
    }
  }

  async ngAfterViewChecked() {
    this.hasNextPage == true
      ? document
          .getElementsByClassName('mat-paginator-navigation-next')[0]
          .removeAttribute('disabled')
      : document
          .getElementsByClassName('mat-paginator-navigation-next')[0]
          .setAttribute('disabled', 'true');
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
}
