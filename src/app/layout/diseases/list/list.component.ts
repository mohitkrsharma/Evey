import { Component, OnInit, ViewChild, HostListener, ElementRef, TemplateRef, AfterViewChecked } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';
import { CommonService } from './../../../shared/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, Subscription } from 'rxjs';
import { MatOption } from '@angular/material';
import { FormArray, FormBuilder, FormGroup,FormControl,Validators } from '@angular/forms';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap
} from 'rxjs/operators';

import {MatTable} from '@angular/material/table';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SearchFilterBYPipe } from './../../../shared/services/search-filter-by.pipe';
import { UserAccess } from 'src/app/shared/models/userAccess';
export interface PeriodicElement {
  org_name: string;
  org_id: string;
  fac_name: string;
  fac_id: string;
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
  ) { this.createPropertyForm();}
  @ViewChild('table', {static: true}) table: MatTable<any>;
  @ViewChild('addDiseaseEle', {static: true}) addDiseaseEle: TemplateRef<any>;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  dialogRefs = null;
  isEdit = false;
  isOptionField: boolean;
  disease: any = {   
    name: '',
    description: '',
    organization     : '',
    fac              : '',
    facility         : [],
  };
  diseaseForm: FormGroup;
  public temparray: any = [];
  editId: any = null;
  btnClass: string;

  org; fac;
  orgSearch='';
  facSearch='';
  userFacilityList: any[]=[];
  facListDone = [];
  ismultifac: Boolean = false;
  paramId: Boolean;
  multifacility: any;  
  multiorg: any;
  showfaclist: boolean;
  duplicateFacility;
  showNew=true
  orgDisable:Boolean = false
  facDisable:Boolean = false;
  privilege: string = 'add';
  public userAccess: UserAccess = new UserAccess();
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  public btnAction: Function;

  organization; facility;
  private subscription: Subscription;
  // MATPAGINATOR
  // pageEvent: PageEvent;
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
  organiz; floorlist; faclist;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  sortActive = 'order';
  sortDirection: 'asc' | 'desc' | '';
  count;
  actualDataCount;
  search: any;
  diseasesData;
  filteredDisease: Observable<any[]>;
  isArcheive:boolean=false;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true
    },
    {
      id: 'parent_name',
      value: 'Category',
      sort: true
    }
    ];
  exportdata;
  pagiPayload: PagiElement = {
    moduleName: 'diseaseList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' }
  };
  public show = false;
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
    this.search = this.searchInput.nativeElement.value;
    if(!this._commonService.checkAllPrivilege('Diseases')){
      this.router.navigate(['/']);
    }
    this.getUserAccess();
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.diseaseList) {
        this.pagiPayload = pageListing.diseaseList;
        this.search = pageListing.diseaseList.search;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({diseaseList: this.pagiPayload}));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({diseaseList: this.pagiPayload}));
    }
    this._commonService.payloadSetup('diseaseList',this.pagiPayload)
    
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
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['change_status']);

    this.displayedColumns = this.displayedColumns.concat(['actions']);
    // Pagination
    await this.getServerData(this.pagiPayload);
    await this.getDiseasesList();
    await this.getFilteredData();

     // get organization list:
    // const action2 = { type: 'GET', target: 'organization/orglist' };
    // const payload2 = {};
    // const result2 = await this.apiService.apiFn(action2, payload2);
    // this.organiz = result2['data'];
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility     = contentVal.fac;        
      }
    });
  }

   async changeOrg(org) {
    this.org = org;
    // const action  = { type: 'GET', target: 'facility/faclist' };
    // const payload = { 'org_id': org };
    // const result  = await this.apiService.apiFn(action, payload);
    // this.faclist  = result['data'];
    this.disease.fac = '';

    const payload2    = { org: org };
    const action2     = { type: 'GET', target: 'users/get_user_fac' };
    const result2     = await this.apiService.apiFn(action2, payload2);
    this.faclist      = await result2['data'].map(function (obj) {
        const fObj    = {};
        fObj['fac_name'] = obj._id.fac.fac_name;
        fObj['_id']      = obj._id.fac._id;
        return fObj;
    });
    if(this.userFacilityList && this.userFacilityList.length){
      this.removeAddedFac()
    }
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {      
      if(this.facility == this.faclist[i]._id){
        defaultFacName = this.faclist[i].fac_name;
      }
    }    
    this.multifacility = defaultFacName
  }

  async changeFac(fac, e) {
    this.fac = fac;
  }

  select(org, fac,flag) {
    if(flag === 0)
    {
      if (!org || org === undefined) {
      this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
      this.multiorg = org.source.selected.viewValue;
      }
    }
    else{
     if (!org || org === undefined) {
      this.multifacility = fac;      
      } else if (!fac || fac === undefined) {
      this.multiorg = org;
      } 
    }
  }

  async onRemoveFac(i) {

    if(i!=undefined && i!=null){
      this.addfacIn(i)
      this.userFacilityList.splice(i, 1);
      this.disease.facility.splice(i, 1);
      this.facListDone = this.userFacilityList;
      if (this.userFacilityList.length > 0) {
        this.showfaclist = true;
        this.ismultifac = true;
      } else if (this.userFacilityList.length === 0) {
        this.showfaclist = false;
        this.ismultifac = false;
      }
    }else{
      this.showNew=false;
    }

  }

    async addFacilityList(disease, isFromDone?) {


      if(!this.showNew){
        this.showNew=true
        return
      }else{

        this.duplicateFacility = false;
        if ((disease.organization === '' || disease.organization === undefined) && !isFromDone) {
          this.toastr.error('Select organization');
          return;
        } else if ( (disease.fac === '' || disease.fac === undefined) && !isFromDone) {
          this.toastr.error('Select Building');
          this.duplicateFacility = true;
          return;
        } else {
          this.ismultifac = true;
          if (this.userFacilityList === undefined || this.userFacilityList.length < 1) {
            this.userFacilityList = [
              {
                'org_id': disease.organization,
                'org_name': this.multiorg,
                'fac_id': disease.fac,
                'fac_name': this.multifacility,            
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
              this.userFacilityList.push({
                org_id: disease.organization,
                org_name: this.multiorg,
                fac_id: disease.fac,
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
          //io-1181 below code commented
          // if(this.isEdit == true){
          //   this.disease['organization'] = '';
          //   this.faclist = [];
          // }
          // this.disease['fac']          = '';
          // await this.userOrganization()
          // await this.userFacility()   
        }
        if( isFromDone === true && this.duplicateFacility != true){
          this.dialogRefs.close();
        }
        //this.faclist = [];
        // this.disease.fac = ""; //io-1181
      }
      this.removeAddedFac()
  }

  removeAddedFac(){
    console.log('--organiz--',this.organiz,this.faclist)

    this.faclist = this.faclist.filter(e=>this.userFacilityList.findIndex(z=>z.fac_id==e._id)==-1)
    this.orgFacSelection() //io-1181
  }

  async addfacIn(i){
    if(this.disease.organization){
      await this.changeOrg(this.disease.organization)
    }
    this.facDisable=false
    this.disease.fac = ''
    // this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id}) //io-1181
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
      this.toastr.error('Please select disease to be deleted');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
       width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'diseases', 'id': this.deleteArr, 'API': 'diseases/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        } else {
          if(result['status']){
            this.toastr.success(result['message']);
          }
          this.checked = false;
          this.getServerData(this.pagiPayload);
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

  deleteDisease(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'diseases', 'id': this.deleteItem, 'API': 'diseases/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result!=false){
        if(result['status']){
          this.toastr.success(result['message']);
        }
        this.getServerData(this.pagiPayload);
      this.checked = false;
      }

    });
  }

   //Changes Restore Start
   achieve() {
    this.search='';
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=true;
    this.getServerData(this.pagiPayload);
  }

  defArchieve() {
    this.search='';
    this.pagiPayload.pageIndex=0;
    this.pagiPayload.previousPageIndex=0;
    this.isArcheive=false;
    this.getServerData(this.pagiPayload);
  }

  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select disease to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr,'restore_data': 'restore_data' ,'API': 'diseases/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Disease restored successfully');
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
  restoreDis(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'restore_user', 'id': this.deleteItem,'restore_data': 'restore_data', 'API': 'diseases/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
       if(result!=false){
        if(result['status']){
          this.toastr.success('Diseases restored successfully');
        }
        this.getServerData(this.pagiPayload);
      this.checked = false;
      }
    });
  }

  //Changes Restore End




  public async getDiseasesDataFunction() {  
    const action = {
      type: 'GET',
      target: 'diseases'
    };
    const payload = this.pagiPayload;
     if(this.isArcheive === true){
      payload['restore']=true;
    }else{
      payload['restore']= false;
    }
    let result = await this.apiService.apiFn(action, payload);
   // result = result['data'];
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      result = result['data']['_diseases'].map(item => {
        return {
          ...item,
          name: item.name,
          parent_name: item.parent_name? item.parent_name : '-',
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
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({active: sort['active'], direction: 'asc'});
      this.sort._stateChanges.next();
      return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem('pageListing', JSON.stringify({diseaseList: this.pagiPayload}));
    this._commonService.updatePayload(null, 'diseaseList', this.pagiPayload);
    this.getDiseasesDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({diseaseList: this.pagiPayload}));
    this._commonService.updatePayload(event,'diseaseList',this.pagiPayload)
    this.getDiseasesDataFunction();

  }

  get optionsPoints() {
    return this.diseaseForm.get('options') as FormArray;
  }

  createPropertyForm() {
    this.diseaseForm = this.fb.group({
      _id: [null, []],      
      parent_id: ['',[]],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      searchCtrl: new FormControl(),

    });
  }

 async userOrganization(){
    const action  = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result  = await this.apiService.apiFn(action, payload);
    this.organiz  = await result['data'].map(function (obj) {
        const rObj = {};
        rObj['org_name'] = obj._id.org.org_name;
        rObj['_id']      = obj._id.org._id;
        return rObj;
    });
    let defaultOrgName;
    for (var i = 0; i < this.organiz.length; i++) {      
      if(this.organization == this.organiz[i]._id){
        defaultOrgName = this.organiz[i].org_name;
      }
    }    
    this.multiorg = defaultOrgName
    //io-1181 below commented
    /*if(this.isEdit !== true){
      this.disease.organization = this.organization;
    }*/
  }

  async userFacility(){
    const payload2    = { org: this.organization };
    const action2     = { type: 'GET', target: 'users/get_user_fac' };
    const result2     = await this.apiService.apiFn(action2, payload2);
    this.faclist      = await result2['data'].map(function (obj) {
        const fObj    = {};
        fObj['fac_name'] = obj._id.fac.fac_name;
        fObj['_id']      = obj._id.fac._id;
        return fObj;
    });
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {      
      if(this.facility == this.faclist[i]._id){
        defaultFacName = this.faclist[i].fac_name;
      }
    }    
    this.multifacility    = defaultFacName
    if(this.isEdit !== true){
      // this.disease.fac = this.facility;  //io-1181
    }else{
      this.removeAddedFac() //io-1181
      // this.faclist = [];  //io-1181
    }
    this.orgFacSelection() //io-1181
  }
   
  async addDisease() {
    this.showNew=true
    await this.userOrganization()
    await this.userFacility();
    if(this.isEdit == false){
      this.disease._id='';
      this.privilege = 'add';
    }
    //this.faclist   = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'shiftpopup';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addDiseaseEle, dialogConfig);
  }

  closeDiseaseDialog(disease): void {
    this.disease.organization     = '';
    this.disease.fac              = [];
    this.disease.facility         = ''
    delete this.disease._id
    this.userFacilityList    = [];
    this.facListDone         = [];
    this.duplicateFacility   = false;
    
    this.isEdit = false;
    this.isOptionField = false;
    this.diseaseForm.reset();
    this.dialogRefs.close();

    
  }

  async saveDiseaseDialog(disease) {

    if ( this.diseaseForm.valid &&  this.diseaseForm.controls.name.value.trim()!='') {

      /* Organization/Facility Validation */

      this.duplicateFacility = '';
      // io-1181 below commented
     /* if (this.disease.organization !== '' ) {
        if(this.disease.fac === '' || this.disease.fac === undefined){
          this._commonService.setLoader(false);
          this.toastr.error('Select Building.');
          return;
        }
      }
      if(!this.userFacilityList || !this.userFacilityList.length ){
        if( this.disease.organization === '' && !this.disease.facility.length){
          this._commonService.setLoader(false);
          this.toastr.error("Select organization.");
          return;
        }
      }*/
      if (this.disease.organization && this.disease.organization !== '' && this.disease.fac !== '') {
        this.addFacilityList(this.disease, true);
      }
      /* End Organization/Facility Validation */
      if (!this.duplicateFacility) {
        if (!this.ismultifac) {
            this.disease['facility'] = [{
              org: this.org,
              fac: this.fac
            }];

          } else {
            this.disease['facility'] = this.userFacilityList.map(item => (
              { org: item.org_id, fac: item.fac_id, selected: item['selected'] }));
          }
      } else {
        this._commonService.setLoader(false);
        return;
      }

      // console.log('this.disease.facility--->', this.disease.facility);
      // console.log('this.disease.facility.length--->', this.disease.facility.length);
      if (this.disease && this.disease.facility && this.disease.facility.length < 2) {
        if (this.disease.facility[0].org == undefined || this.disease.facility[0].fac == undefined) {
          this._commonService.setLoader(false);
          this.toastr.error('Please select org and facility.');
          return;
        }
     }

      this._commonService.setLoader(true);
      const data = {
        '_id': this.diseaseForm.controls._id.value,
        'parent_id': this.diseaseForm.controls.parent_id.value,
        'name': this.diseaseForm.controls.name.value,
        'description': this.diseaseForm.controls.description.value,
        'facility'  : this.disease.facility
      };

      const action = {
        type: 'POST',
        target: 'diseases/add'
      };
      const payload = data;
      // console.log('payload---->', JSON.stringify(payload));
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.toastr.success(result['message']);
        this.closeDiseaseDialog(disease);
        this.getServerData(this.pagiPayload);
        this.getDiseasesList();
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

  async editDisease(diseaseId){
    this._commonService.setLoader(true);
    this.show = true;
    this.paramId = true;
    this.isEdit  = true;
    this.privilege = 'edit';
    await this.userOrganization(); //  io-1181
    await this.userFacility(); //io-1181
      const action = {
        type: 'POST', target: 'diseases/view'
      };
      const payload = { diseaseId: diseaseId };
      const result = await this.apiService.apiFn(action, payload)
      this.disease = result['data']['_disease'];

      this.userFacilityList = this.disease.facility.map(item => ({
          org_id: item.org._id, org_name: item.org.org_name, 
          fac_id: item.fac._id, fac_name: item.fac.fac_name, selected: item.selected,
        })
      );
      this.facListDone = this.userFacilityList;

      // io-1181 below if else and if condition
      if (result['data']['_disease']['facility'].length > 0) {
        this.removeAddedFac()
        this.ismultifac = true;
      }
       else {
        this.ismultifac = false;
        this.showfaclist = false;
        this.orgFacSelection()
      }  
      if(!this.disease.organization){
        this.disease.organization = '';
      }  

      if(!this.disease.hasOwnProperty('description')){
        this.disease['description']='';
      }
      this._commonService.setLoader(false);
     
      this.diseaseForm.patchValue(this.disease);
      this.addDisease();

  }  

  async changeStatus(event, disease_id) {
    const action = { type: 'POST', target: 'diseases/changeStatus' };
    const payload = { 'status': event.checked, 'diseaseId': disease_id };
    const result = await this.apiService.apiFn(action, payload);
  }

  async getDiseasesList() {  
    const action = {
      type: 'GET',
      target: 'diseases/diseasesList'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    //result = result['data']._diseases;
    this.diseasesData = result['data'].map(function (obj) {
      const rObj = {};
      rObj['name'] = obj.name;
      rObj['_id'] = obj._id;
      return rObj;
     });
    }
    
  get searchCtrl() {
    return this.diseaseForm.get('searchCtrl');
  }
  getFilteredData(){
  this.filteredDisease = this.searchCtrl.valueChanges
      .pipe(
        startWith(''),
        map(item => item ? this.searchPipe.transform(this.diseasesData, item, 'name') : this.diseasesData.slice())
      );
   }

  getSelectedDisease(event){
    //this.diseaseForm.controls.parent_id=event.value;
  }

  orgFacSelection(){
    console.log({ 
      org_ln:this.organiz.length,
      fac_ln:this.faclist.length,
      orglist:this.organiz,
      faclist:this.faclist
    })
    console.log('----ln-----',this.organiz.length,this.faclist.length)
    if(this.organiz.length==1 && this.faclist.length==1){

      //organization manage
      this.orgDisable=true
      this.disease.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']
    
      //facility manage
      this.facDisable = true
      this.disease.fac=this.faclist[0]['_id']
      this.multifacility=this.faclist[0]['fac_name']
    }
    else if(this.organiz.length==1 && this.faclist.length>1){
      console.log('---here------------',this.faclist)
      //organization manage
      this.orgDisable=true
      this.disease.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.disease.fac=''

    }else if(this.organiz.length>1){
        //organization manage
        this.orgDisable=false
        // this.announcement.organization = ''
        // this.multiorg = this.organiz[0]['org_name']
      
        //facility manage
        this.facDisable = false
        this.disease.fac=''
        this.multifacility=(this.faclist && this.faclist.length && this.faclist[0]['fac_name'])?this.faclist[0]['fac_name']:''
    }else if(this.organiz.length==1 && this.faclist.length==0){
       //organization manage
       this.orgDisable=true
       this.disease.organization = this.organization
       this.multiorg = this.organiz[0]['org_name']
     
       //facility manage
       this.facDisable = false
       this.disease.fac=''
      //  this.multifacility=this.faclist[0]['fac_name']
    }
    else{
       //organization manage
      this.orgDisable=false
      this.disease.organization = ''

      //facility manage
      this.facDisable = false
      this.disease.fac=''
    }
  }
  getUserAccess(){
    this.userAccess.isView = this._commonService.checkPrivilegeModule('diseases','view');
    this.userAccess.isAdd = this._commonService.checkPrivilegeModule('diseases','add');
    this.userAccess.isEdit = this._commonService.checkPrivilegeModule('diseases','edit');
    this.userAccess.isDelete = this._commonService.checkPrivilegeModule('diseases','delete');
    this.userAccess.isExport = this._commonService.checkPrivilegeModule('diseases','export');
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'diseases/count' };
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
  moduleName?:string,
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
}


