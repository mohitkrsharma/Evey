import { Component, OnInit, ViewChild, HostListener, ElementRef, TemplateRef, AfterViewChecked } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { CommonService } from './../../../shared/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, Subscription } from 'rxjs';
import { MatOption } from '@angular/material';
import { FormArray, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { debounceTime, map, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { MatTable } from '@angular/material/table';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SearchFilterBYPipe } from './../../../shared/services/search-filter-by.pipe';
import * as moment from 'moment';
import { AlertComponent } from 'src/app/shared/modals/alert/alert.component';
import { id } from 'date-fns/locale';

export interface PeriodicElement {
  org_name: string;
  org_id: string;
  fac_name: string;
  fac_id: string;
  selected: boolean;
}

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
    private toastr: ToastrService,
    private fb: FormBuilder,
    private searchPipe: SearchFilterBYPipe,
    public _commonService: CommonService
  ) { this.createPropertyForm(); }
  @ViewChild('table', {static: true}) table: MatTable<any>;
  @ViewChild('addcarelevelEle', {static: true}) addcarelevelEle: TemplateRef<any>;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;

  public btnAction: Function;

  organization; facility;
  private subscription: Subscription;
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  isOptionField: boolean;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  chargeCode;
  organiz; floorlist; faclist;
  careLevelData;
  dataSource;
  displayedColumns = [];
  isShow: boolean;
  topPosToStartShowing = 100;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  sortActive = 'order';
  sortDirection: 'asc' | 'desc' | '';
  formatString = 'HH:mm'
  org; fac;
  orgSearch = '';
  facSearch = '';
  userFacilityList: PeriodicElement[];
  facListDone = [];
  ismultifac: Boolean = false;
  paramId: Boolean;
  multifacility: any;
  multiorg: any;
  count;
  actualDataCount;
  showfaclist: boolean;
  duplicateFacility;
  isArcheive: boolean = false;
  filteredCareLevel: Observable<any[]>;
  minDate = moment().utcOffset(0).set({hour:1,minute:0,second:0,millisecond:0});
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true
    }
  ];
  careLevel: any = {
    // name: '',
    description: '',
    organization: '',
    fac: '',
    facility: [],
    // parent_care_level: [],
    charge_code: '',
    // pricing: ''
  };
  search: any;
  dialogRefs = null;
  carelevelForm: FormGroup;
  isEdit = false;
  parent_care;
  pagiPayload = {
    moduleName: 'carelevelList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    organization: "",
    facility: '',
    type: []
  };
  showNew = true
  orgDisable: Boolean = false
  facDisable: Boolean = false
  public show = false;
  privilege: string = 'add';
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  careLevelFacility: any[] = [];
  selectedOrg: string = '';
  selectedFac: string = '';
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

  async ngOnInit() {
    /* if(!this._commonService.checkPrivilegeModule('carelevel')){
      this.router.navigate(['/']);
    } */
    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          await this.getServerData(this.pagiPayload);
        }
      }
    );
    const tableArr: Element[] = [];
    this.dataSource = new MatTableDataSource(tableArr);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.carelevelList) {
        this.pagiPayload = pageListing.carelevelList;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ carelevelList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ carelevelList: this.pagiPayload }));
    }
    this._commonService.payloadSetup('carelevelList', this.pagiPayload)
    this.search = this.searchInput.nativeElement.value;
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),

        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();
    await this.getServerData(this.pagiPayload);
    // await this.getCareLevelList();
    await this.getFilteredData();
    // await this.getChargeCodes();

    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    /* this.displayedColumns = this.displayedColumns.concat(['change_status']); */
  }

  getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.pagiPayload.facility = this.facility;
    sessionStorage.setItem('pageListing', JSON.stringify({ carelevelList: this.pagiPayload }));
    this._commonService.updatePayload(event, 'carelevelList', this.pagiPayload)
    this.getCareLevelDataFunction();
  }

  async changeOrg(org) {
    this.org = org;
    this.careLevel.fac = '';

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
      this.removeAddedFac()
    }
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName
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
    }
    else {
      if (!org || org === undefined) {
        this.multifacility = fac;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  async onRemoveFac(i) {

    if (i != undefined && i != null) {
      this.userFacilityList.splice(i, 1);
      this.careLevel.facility.splice(i, 1);
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

  async addFacilityList(careLevel, isFromDone?) {

    if (!this.showNew) {
      this.showNew = true;
      return
    } else {
      this.duplicateFacility = false;
      if ((careLevel.organization === '' || careLevel.organization === undefined) && !isFromDone) {
        this.toastr.error('Select organization');
        return;
      } else if ((careLevel.fac === '' || careLevel.fac === undefined) && !isFromDone) {
        this.toastr.error('Select Building');
        this.duplicateFacility = true;
        return;
      } else {
        this.ismultifac = true;
        if (this.userFacilityList === undefined || this.userFacilityList.length < 1) {
          this.userFacilityList = [
            {
              'org_id': careLevel.organization,
              'org_name': this.multiorg,
              'fac_id': careLevel.fac,
              'fac_name': this.multifacility,
              selected: false
            }
          ];
        } else {
          if (this.userFacilityList.some(item => item.fac_name.toLowerCase().trim() === this.multifacility.toLowerCase().trim() &&
            item.org_name.toLowerCase().trim() === this.multiorg.toLowerCase().trim())) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
              this.duplicateFacility = true;
            }
          } else {

            console.log('---multiorg name----', this.multiorg)

            this.userFacilityList.push({
              org_id: careLevel.organization,
              org_name: this.multiorg,
              fac_id: careLevel.fac,
              fac_name: this.multifacility,
              selected: false
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
        //io-1181 below code commented
        // if(this.isEdit == true){
        //   this.careLevel['organization'] = '';
        //   this.faclist = [];
        // }
        // this.disease['fac']          = '';
        // await this.userOrganization()
        // await this.userFacility()   
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        this.dialogRefs.close();
      }
      //this.faclist = [];
      // this.careLevel.fac = ""; //io-1181
    }

    console.log('----adedd--------', this.userFacilityList)

    this.removeAddedFac()
  }
  removeAddedFac() {
    console.log('--organiz--', this.organiz, this.faclist)
    if (this.userFacilityList && this.userFacilityList.length > 0) {
      this.faclist = this.faclist.filter(e => this.userFacilityList.findIndex(z => z.fac_id == e._id) == -1)
    }
    this.orgFacSelection() //io-1181
  }

  async addfacIn(i) {
    if (this.careLevel.organization) {
      await this.changeOrg(this.careLevel.organization)
    }
    this.facDisable = false
    this.careLevel.fac = ''
    // this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id}) io-1181
  }

  createPropertyForm() {
    this.carelevelForm = this.fb.group({
      _id: [null, []],
      name: ['', [Validators.required]],
      time_goal: ['', []],
      parent_care_level: ['', []],
      searchCtrl: new FormControl(),
      pricing: ['', [Validators.required]],
      charge_code: ['', []],
    });
  }

  public async getCareLevelDataFunction() {
    const action = {
      type: 'GET',
      target: 'care-level'
    };
    this.pagiPayload.type = ['1', '2']
    const payload = this.pagiPayload;
    console.log('sort payload-->>', payload);
    if (this.isArcheive === true) {
      payload['restore'] = true;
    } else {
      payload['restore'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    console.log('result',result);
    this.count = result['count'];
    this.hasNextPage = result['isNextPage'];
    //this.careLevel.parent_care_level = this.getParentCareLevel();
    if (result['status']) {
      result = result['data'].map(item => {
        return {
          ...item,
          name: item.label,
        };
      });
      this.data = result;
      if (this.data && this.data.length > 0) {
        this.actualDataCount = this.data.length;
      }
      this.createTable(result);
      this._commonService.setLoader(false);
      this.getParentCareLevel();
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

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    //this.dataSource.sort = this.sort;
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
    sessionStorage.setItem('pageListing', JSON.stringify({ carelevelList: this.pagiPayload }));
    this.getCareLevelDataFunction();
  }

  async addCareLevel() {
    this.showNew = true
    await this.getParentCareLevel();
    // await this.getChargeCodes();
    if (this.isEdit == false) {
      this.careLevel._id = '';
      this.privilege = 'add';
      await this.userOrganization()
      //await this.userFacility() 
    }
    //this.faclist   = [];
    //this.careLevel.parent_care_level =  this.getParentCareLevel();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'shiftpopup';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addcarelevelEle, dialogConfig);
  }

  async userOrganization() {
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = result['data'].map(org => { return { org_name: org._id.org.org_name, _id: org._id.org._id } });

    // this.organiz  = await result['data'].map(function (obj) {
    //     const rObj = {};
    //     rObj['org_name'] = obj._id.org.org_name;
    //     rObj['_id']      = obj._id.org._id;
    //     return rObj;
    // });
    let defaultOrgName;
    for (var i = 0; i < this.organiz.length; i++) {
      if (this.organization == this.organiz[i]._id) {
        defaultOrgName = this.organiz[i].org_name;
      }
    }
    if (this.organiz.length === 1) {
      this.careLevel.organization = this.organiz[0]._id;
      this.orgDisable = true;
      await this.userFacility();
    } else {
      this.orgDisable = false;
    }

    this.multiorg = defaultOrgName
    //io-1181 below commented
    /*if(this.isEdit !== true){
      this.careLevel.organization = this.organization;
    }*/
  }

  async userFacility() {
    const payload2 = { org: this.careLevel.organization };
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
    this.multifacility = defaultFacName
    if (this.isEdit !== true) {
      // this.careLevel.fac = this.facility; //io-1181
    } else {
      this.removeAddedFac() //io-1181
      // this.faclist = []; //io-1181
    }

    //this.orgFacSelection() //io-1181
  }

  closeCareLevelDialog(careLevel): void {
    this.careLevel.organization = '';
    this.careLevel.fac = [];
    this.careLevel.facility = ''
    delete this.careLevel._id
    this.userFacilityList = [];
    this.facListDone = [];
    this.duplicateFacility = false;
    this.careLevelFacility = [];
    this.dialogRefs.close();
    this.isEdit = false;
    this.isOptionField = false;
    this.carelevelForm.reset();
  }

  async saveCareLevelDialog(careLevel) {
    let flag = false;
    if ((this.careLevel.organization && this.careLevel.fac) || (this.userFacilityList && this.userFacilityList.length > 0)) {
      flag = true;
    } else {
      flag = false;
    }
    if (this.carelevelForm.valid && this.carelevelForm.controls.name.value.trim() != '' && flag) {

      /* Organization/Facility Validation */
      this.duplicateFacility = '';

      //io-1181 below commented
      /*if (this.careLevel.organization !== '' ) {
        if(this.careLevel.fac === '' || this.careLevel.fac === undefined){
          this._commonService.setLoader(false);
          this.toastr.error('Select facility.');
          return;        
        }
      } 
      if(!this.userFacilityList || !this.userFacilityList.length ){      
        if( this.careLevel.organization === '' && !this.careLevel.facility.length){
          this._commonService.setLoader(false);
          this.toastr.error("Select organization.");
          return;        
        }
      }*/

      if (this.careLevel.organization && this.careLevel.organization !== '' && this.careLevel.fac !== '') {
        this.addFacilityList(this.careLevel, true)
      }
      /* End Organization/Facility Validation */
      if (!this.duplicateFacility) {
        if (!this.ismultifac) {
          this.careLevel['facility'] = [{
            org: this.org,
            fac: this.fac
          }];

        } else {
          this.careLevel['facility'] = this.userFacilityList.map(item => (
            { org: item.org_id, fac: item.fac_id, selected: item['selected'] }));
        }
      } else {
        this._commonService.setLoader(false);
        return;
      }

      this._commonService.setLoader(true);
      const data = {
        '_id': this.carelevelForm.controls._id.value,
        'name': this.carelevelForm.controls.name.value,
        // 'time_goal':moment(this.carelevelForm.controls.time_goal.value).format('hh:mm'),
        'time_goal': moment(this.carelevelForm.controls.time_goal.value).hour().toString(),
        'parent_care_level': this.carelevelForm.controls.parent_care_level.value,
        'pricing': this.carelevelForm.controls.pricing.value,
        'charge_code': this.carelevelForm.controls.charge_code.value,
        'facility': this.careLevel.facility
      };

      const action = {
        type: 'POST',
        target: 'care-level/add'
      };
      const payload = data;

      console.log(payload);
      // return;

      const result = await this.apiService.apiFn(action, payload);
      console.log(result);
      if (result['status']) {
        this.toastr.success(result['message']);

        this.closeCareLevelDialog(careLevel);
        this.getServerData(this.pagiPayload);
        // this.getCareLevelList();
        this._commonService.setLoader(true);
      } else {
        this._commonService.setLoader(false);
        this.toastr.error(result['message']);
      }
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  // async getCareLevelList() {  
  //   const action = {
  //     type: 'GET',
  //     target: 'diseases/diseasesList'
  //   };
  //   const payload = this.pagiPayload;
  //   let result = await this.apiService.apiFn(action, payload);
  //   //result = result['data']._diseases;
  //   this.careLevelData = result['data'].map(function (obj) {
  //     const rObj = {};
  //     rObj['name'] = obj.name;
  //     rObj['_id'] = obj._id;
  //     return rObj;
  //    });
  // }

  async getParentCareLevel() {
    const action = {
      type: 'GET',
      target: 'care-level'
    };
    // this.pagiPayload.type = ['1'];
    let type = ['1']

    const payload = { type };
    if (this.isArcheive === true) {
      payload['restore'] = true;
    } else {
      payload['restore'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    this.parent_care = result['data'];
  }

  async getChargeCodes() {
    const action = {
      type: 'GET',
      target: 'care-level/charge_code'
    };
    const payload = [];

    let result = await this.apiService.apiFn(action, payload);
    console.log(result);
    this.chargeCode = result['data'];
  }

  async onAddCareLevel() {
    this._commonService.setLoader(true);
    this.showNew = true
    await this.getParentCareLevel();
    // await this.getChargeCodes();
    this.careLevel._id = '';
    this.privilege = 'add';
    await this.getUserOrganization();
    this._commonService.setLoader(false);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'shiftpopup';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addcarelevelEle, dialogConfig);
  }

  async getUserOrganization() {
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    if (result['status'] && result['data'] && result['data'].length > 0) {
      this.organiz = result['data'].map(org => { return { org_name: org._id.org.org_name, _id: org._id.org._id } });
      if (this.organiz && this.organiz.length === 1) {
        this.careLevel.organization = this.organiz[0]._id;
        this.selectedOrg = this.organiz[0].org_name;
        this.orgDisable = true;
        await this.getUserFacility();
      }
    } else {
      this.toastr.error('error in get organization');
    }
  }

  async getUserFacility() {
    const payload = { org: this.careLevel.organization };
    const action = { type: 'GET', target: 'users/get_user_fac' };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status'] && result['data'] && result['data'].length > 0) {
      this.faclist = await result['data'].map(fac => { return { fac_name: fac._id.fac.fac_name, _id: fac._id.fac._id } });
      if (this.faclist && this.faclist.length === 1) {
        this.careLevel.fac = this.faclist[0]._id;
        this.selectedFac = this.faclist[0].fac_name;
        this.facDisable = true;
      }
    } else {
      this.toastr.error('error in get facility');
    }
    if (this.isEdit) {
      if (this.careLevelFacility && this.careLevelFacility.length > 0) {
        this.faclist = await this.faclist.filter(e => this.careLevelFacility.findIndex(z => z.fac_id == e._id) == -1);
      }
    }
    console.log(this.faclist);
  }

  async onChangeOrg(org) {
    this.facDisable = false;
    this.faclist = [];
    await this.getUserFacility();
  }

  onAddFacility() {
    this.careLevelFacility.unshift(
      {
        org_id: this.careLevel.organization,
        org_name: this.selectedOrg,
        fac_id: this.careLevel.fac,
        fac_name: this.selectedFac
      }
    );
    let index = this.faclist.findIndex(fac => fac._id === this.careLevel.fac);

    if (this.faclist.length === 1) {
      this.careLevel.fac = this.faclist[0]._id;
      this.facDisable = true;
      this.faclist.splice(index, 1);
    } else {
      this.facDisable = false;
      this.faclist.splice(index, 1);
    }
    if (this.faclist.length === 0) {
      this.facDisable = true;
    }
  }

  onSelect(org, fac, flag) {
    if (org) {
      this.selectedOrg = org.source.selected.viewValue;
    } else if (fac) {
      this.selectedFac = fac.source.selected.viewValue;
    }
  }

  onRemoveCareLevelFacility(index, _id) {
    if (this.careLevelFacility && this.careLevelFacility.length > 0) {
      let tempFac = { fac_name: this.careLevelFacility[index].fac_name, _id: this.careLevelFacility[index].fac_id };
      if (this.careLevel.organization && this.careLevel.organization == this.careLevelFacility[index].org_id) {
        this.faclist.push(tempFac);
        if (this.faclist.length === 1) {
          this.careLevel.fac = this.faclist[0]._id;
          this.facDisable = true;
        } else {
          this.facDisable = false;
        }
      }
      this.careLevelFacility = this.careLevelFacility.filter(x => x.fac_id !== _id) || [];
      //this.careLevelFacility.splice(index, 1);
    }
  }

  async onSaveCareLevel(careLevel) {
    let flag = false;
    if ((this.careLevelFacility && this.careLevelFacility.length > 0)) {
      flag = true;
    } else {
      flag = false;
    }
    if (this.carelevelForm.valid && this.carelevelForm.controls.name.value.trim() != '' && flag) {
      this.careLevel['facility'] = this.careLevelFacility.map(item => (
        { org: item.org_id, fac: item.fac_id, selected: item['selected'] }));

      const data = {
        '_id': this.carelevelForm.controls._id.value,
        'name': this.carelevelForm.controls.name.value,
        'time_goal': moment(this.carelevelForm.controls.time_goal.value).hour().toString(),
        'parent_care_level': this.carelevelForm.controls.parent_care_level.value,
        'pricing': this.carelevelForm.controls.pricing.value,
        'charge_code': this.carelevelForm.controls.charge_code.value,
        'facility': this.careLevel.facility
      };
      const action = {
        type: 'POST',
        target: 'care-level/add'
      };
      const payload = data;
      console.log(payload);
      const result = await this.apiService.apiFn(action, payload);
      console.log(result);
      if (result['status']) {
        this.toastr.success(result['message']);
        this.closeCareLevelDialog(careLevel);
        this.getServerData(this.pagiPayload);
        this._commonService.setLoader(true);
      } else {
        this._commonService.setLoader(false);
        this.toastr.error(result['message']);
      }
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  async onEditCareLevel(careLevelId) {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'care-level/care_level' };
    const payload = { _id: careLevelId };
    this.privilege = 'edit';
    const result = await this.apiService.apiFn(action, payload);
    this.show = true
    this.showNew = true
    this.paramId = true;
    this.isEdit = true;
    this.careLevel = result['data'];
    if (this.careLevel.facility && this.careLevel.facility.length > 0) {
      this.careLevel.facility.forEach(item => {
        if (item.org && item.fac) {
          this.careLevelFacility.push({
            org_id: item.org._id, org_name: item.org.org_name,
            fac_id: item.fac._id, fac_name: item.fac.fac_name,
            selected: item.selected,
          });
        }
      });
    }
    await this.getUserOrganization();
    if (this.careLevel.time_goal && this.careLevel.time_goal != 'NaN') {
      this.careLevel.time_goal = moment().set({ hour: +this.careLevel.time_goal }).format('HH:mm')
    } else {
      this.careLevel.time_goal = '';
    }

    

    if (!this.careLevel.hasOwnProperty('description')) {
      this.careLevel['description'] = '';
    }
    this._commonService.setLoader(false);

    this.carelevelForm.patchValue(this.careLevel);
    await this.getParentCareLevel();
    // await this.getChargeCodes();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'shiftpopup';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addcarelevelEle, dialogConfig);
  }
  async editCareLevel(id) {
    const action = { type: 'GET', target: 'care-level/care_level' };
    const payload = { _id: id };
    this.privilege = 'edit';

    let result = await this.apiService.apiFn(action, payload);
    // return
    this.show = true
    this.showNew = true
    this.paramId = true;
    this.isEdit = true;
    //await this.userFacility()  //io-1181
    this._commonService.setLoader(true);
    this.careLevel = result['data'];
    await this.userOrganization() //io-1181
    if (this.careLevel.time_goal != 'NaN') {
      this.careLevel.time_goal = moment().set({ hour: +this.careLevel.time_goal }).format('HH')
    } else {
      this.careLevel.time_goal = '';
    }

    if (this.careLevel.facility && this.careLevel.facility.length > 0) {
      this.careLevel.facility.forEach(item => {
        if (item.org && item.fac) {
          this.userFacilityList.push({
            org_id: item.org._id, org_name: item.org.org_name,
            fac_id: item.fac._id, fac_name: item.fac.fac_name,
            selected: item.selected,
          });
        }
      });
    }
    this.facListDone = this.userFacilityList;

    //io-1181 below if else and if condition
    if (result['data']['facility'].length > 0) {
      //this.removeAddedFac()
      this.ismultifac = true;
    }
    else {
      this.ismultifac = false;
      this.showfaclist = false;
      this.orgFacSelection()
    }
    console.log('this.careLevel.organization--->', this.careLevel.organization);
    if (!this.careLevel.organization) {
      this.careLevel.organization = '';
    }

    if (!this.careLevel.hasOwnProperty('description')) {
      this.careLevel['description'] = '';
    }
    this._commonService.setLoader(false);

    this.carelevelForm.patchValue(this.careLevel);
    this.addCareLevel();
  }

  getSelectedParentCarelevel(event) {
    //this.diseaseForm.controls.parent_id=event.value;
  }

  getSelectedChargeCode(event) {
    //this.diseaseForm.controls.parent_id=event.value;
  }

  allwoNumDecimal(key) {
    const result = this._commonService.allwoNumDecimal(key);
    return result;
  }

  getFilteredData() {
    this.filteredCareLevel = this.searchCtrl.valueChanges
      .pipe(
        startWith(''),
        map(item => item ? this.searchPipe.transform(this.careLevelData, item, 'name') : this.careLevelData.slice())
      );
  }

  get searchCtrl() {
    return this.carelevelForm.get('searchCtrl');
  }

  orgFacSelection() {
    console.log({
      org_ln: this.organiz.length,
      fac_ln: this.faclist.length,
      orglist: this.organiz,
      faclist: this.faclist
    })
    console.log('----ln-----', this.organiz.length, this.faclist.length)
    if (this.organiz.length == 1 && this.faclist.length == 1) {

      //organization manage
      this.orgDisable = true
      this.careLevel.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = true
      this.careLevel.fac = this.faclist[0]['_id']
      this.multifacility = this.faclist[0]['fac_name']
    }
    else if (this.organiz.length == 1 && this.faclist.length > 1) {
      console.log('---here------------', this.faclist)
      //organization manage
      this.orgDisable = true
      //this.careLevel.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.careLevel.fac = ''

    } else if (this.organiz.length > 1) {
      //organization manage
      this.orgDisable = false
      // this.announcement.organization = ''
      // this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.careLevel.fac = ''
      this.multifacility = (this.faclist && this.faclist.length && this.faclist[0]['fac_name']) ? this.faclist[0]['fac_name'] : ''
    } else if (this.organiz.length == 1 && this.faclist.length == 0) {
      //organization manage
      this.orgDisable = true
      this.careLevel.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.careLevel.fac = ''
      //  this.multifacility=this.faclist[0]['fac_name']
    }
    else {
      //organization manage
      this.orgDisable = false
      this.careLevel.organization = ''

      //facility manage
      this.facDisable = false
      this.careLevel.fac = ''
    }
  }

  deleteCareLevel(carelevelId) {
    console.log(carelevelId);
    this.deleteItem.push(carelevelId);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'care-level', id: this.deleteItem, API: 'care-level/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result['status']) {
          this.toastr.success(result['message']);
        } else {
          this.toastr.warning(result['message']);
        }
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'care-level/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['count'];
    }
  }
  async ngAfterViewChecked() {
    this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
  }
}


