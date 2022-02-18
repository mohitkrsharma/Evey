import { Component, OnInit, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatSort, MatTableDataSource } from '@angular/material';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatOption } from '@angular/material';
import { FormArray, FormBuilder, FormGroup, Validators,FormControl } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { Observable, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SearchFilterBYPipe } from './../../../shared/services/search-filter-by.pipe';
import { StringFilterByPipe } from '../../../shared/pipes/string-filterdata';
import { FileUploader } from 'ng2-file-upload';
import { environment } from './../../../../environments/environment';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap
} from 'rxjs/operators';
import { AddDepartmentComponent } from 'src/app/shared/modals/add-department/add-department.component';
@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  alternateCare;
  dialogRefs = null;

  organization; facility;
  private subscription: Subscription;

  dataSource;
  dataSource1;

  // @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('addModal', {static: true}) addModal: TemplateRef<any>;
  count;
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 99999999,
    previousPageIndex: 0,
    parentCareId: ''
  };
  data;
  data1;
  actualDataCount;
  actualDataCount1;
  displayedColumns1 = [];
  deleteItem = [];
  deleteItem1 = [];
  deleteArr = [];
  deleteArr1 = [];
  parentId = null;
  parentCare = null;
  assetTypeList = [];
  organiz;
  userFacilityList=[];
  ismultifac: Boolean = false;
  paramId: Boolean;
  faclist;  job_type;
  showfaclist: boolean;
  multifacility: any;  
  multiorg: any;
  duplicateFacility;
  string;
  public facListDone = [];
  orgSearch='';
  facSearch='';
  multipleInput;
  caremsg;
  
  hospital : any ;
   subCare: any = {
    name: '',
    default_selection: '',
    alternative_outcomes: '',
    default_value: '',
    order: '',
    type: '',
    min: '',
    max: '',
    unit: '',
    asset_type:'',
    organization : '',
    fac : '',
    facility : [],
    notes:[{id:Math.random(),value:''}]
  };
  showNew = true
  orgDisable:Boolean = false
  facDisable:Boolean = false
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
    { key: 'multiple_input', value: 'Multiple Input' },
   // { key: "unassigned", value: "Unassigned" },
  //  { key: "enter", value: "Enter" },
   // { key: "exit", value: "Exit" }
  ];
  uploader: FileUploader;
  buttonDisabled: boolean;
  iconError = '';
  addedType: any = [];
  iconSelected = '';
  selectedTypeItemVirus = false;
  typeSearch='';
  altSearch='';
  assetSearch='';
  defSearch='';
  org; fac;
  /**
    * Pre-defined columns list for user table
    */
  displayedColumns: string[] = ['name', 'address', 'fax', 'actions'];

  isEdit = false;
  careArray = [];
  finalCareArray: any = [];

  show = false;
  filteredCountries: Observable<any[]>;
  isShowCareMsg: boolean = false;

  isOptionField: boolean;
  question: any = {
    type: '',
    question: '',
    field_label: this.fb.array([
      this.setInputType(),
    ]),
  };
  questionForm: FormGroup;
  public temparray: any = [];
  editId: any = null;
  btnClass: string;
  showQuestion = false;
  checked = false;
  checked1 = false;
  displayUnit = false;
  departments: any = [];
  department: any ={
    name : '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: null,
    country: '',
    onGround: false
  };
  departmentList: any = [];
  hospitalId: any;
  room: any = [];

  constructor(private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private apiService: ApiService,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private _aes256Service: Aes256Service,
    private searchPipe: SearchFilterBYPipe,
    public _commonService: CommonService
    ) {
      this.createPropertyForm();
    }

  async ngOnInit() {
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility     = contentVal.fac;        
      }
    });
     this.route.params.subscribe(async param => {
      // // // console.log("this")
      this._commonService.setLoader(true);
      const id = this._aes256Service.decFnWithsalt(param['id']);
      this.hospitalId = id;
      // // console.log(id);
      await this.getHospitalById(id);
    });
  }

  async getHospitalById(id){
    this._commonService.setLoader(true);
    const action = {
      type: 'GET', target: 'hospital/view'
    };
    const payload = { _id : id };
    // // console.log(payload)
    const result = await this.apiService.apiFn(action, payload);
    // // console.log(result);
    this.hospital = result['data'];
    console.log("Hospital Detail view----", this.hospital);
    const _foundFax = this.hospital.phone_numbers.find(f => f.name == 'fax');
    const _foundMob = this.hospital.phone_numbers.find(f => f.name == 'mobile');
    if(_foundFax){
      this.hospital.fax = _foundFax.value;
    }
    if(_foundMob){
      this.hospital.mobile = _foundMob.value;
    }
    if(this.hospital.departments && this.hospital.departments.length > 0){
      this.departmentList = this.hospital.departments;
      this.departmentList = this.departmentList.map((e) => ({
        ...e,
        fax:
          (e.phone_numbers && e.phone_numbers.length)
            ? e.phone_numbers && e.phone_numbers.length
              ? this.formatPhoneNumberToUS(e.phone_numbers[0].value)
              : this.formatPhoneNumberToUS(e.mobile)
            : '-',
        address:
            (e.address1 ? e.address1 : "") + ", " + (e.address2 ? e.address2 : '') +
            ", " +
            (e.city ? e.city : '') +
            ", " +
            (e.state ? e.state : '') + ", " + (e.zip ? e.zip : '')
      }));
      this.show = true;
      this.createTable(this.departmentList);
    }
    this._commonService.setLoader(false);

  }

  formatPhoneNumberToUS(phone) {
    return this._commonService.formatPhoneNumberToUS(phone);
  }

  deleteDepartment(department) {
    this.deleteItem.push(department._id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'hospital', id: this.deleteItem, API: 'hospital/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result['status']) {
          // // console.log(this.deleteItem)
          this.deleteItem.map((id) =>{
            this.departmentList= this.departmentList.filter(x => {
              return x._id != id;
            })
          })
          this.createTable(this.departmentList)
          this.toastr.success("Department deleted successfully");
        }
        // this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
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

    if (this.subCare.type === 'special' || this.subCare.type === 'list' || this.subCare.type === 'vital' ||
     this.subCare.type === 'room_cleaning' || this.subCare.type === 'restroom' ) {
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
    if (this.subCare.type === 'input' || this.subCare.type === 'multiple_input' || this.subCare.type === 'special_input'
     || this.subCare.type === 'height' || this.subCare.type === 'weight' ) {
      this.selectedTypeInput = true;
    }

    this.multipleInput = false;
    if (this.subCare.type === 'multiple_input') {
      this.multipleInput = true;
    }
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


  async changeFac(fac, e) {
    this.fac = fac;
  }

  checkForInputValue(type){
    return ['input','multiple_input','special_input'].indexOf(type)>-1
  }

  createTable(arr) {
    this.show = true;
    const tableArr: Element[] = arr;
    console.log("Table array----", tableArr);
    this.dataSource = new MatTableDataSource(tableArr);
  }

  createTable1(arr) {
    const tableArr: Element[] = arr;
    this.dataSource1 = new MatTableDataSource(tableArr);
  }

  async addDepartment(hospital) {
    this.isEdit = false;
    this.department = {
      name : '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      onGround: false
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    //dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    dialogConfig.data = {  hospital : hospital, hospital_id: hospital._id };
    this.dialogRefs = this.dialog.open(AddDepartmentComponent, dialogConfig);
    this.dialogRefs.afterClosed().subscribe((result:any) => {
      if(result){
        this.getHospitalById(this.hospitalId);
      }
    })
  }

  async editDepartment(department){
    this.isEdit = true;
    //this.department = this.departmentList.find( item => item._id == id)
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    //dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    dialogConfig.data = { department: department, hospital_id: department.parent_id, hospital : this.hospital };
    this.dialogRefs = this.dialog.open(AddDepartmentComponent, dialogConfig);
    this.dialogRefs.afterClosed().subscribe((result:any) => {
      if(result){
        this.getHospitalById(this.hospitalId);
      }
    });
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
      this.toastr.error('Please select department to be delete');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'hospital', id: this.deleteArr, API: 'hospital/delete' },
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
            // // console.log(this.deleteArr)
            this.toastr.success("Departments deleted successfully");
          }
          this.checked = false;
          // this.getServerData(this.pagiPayload);
        }
        // this.deleteButton['_elementRef'].nativeElement.classList.remove(
        //   'cdk-program-focused'
        // );
        // this.deleteButton['_elementRef'].nativeElement.classList.remove(
        //   'cdk-focused'
        // );
        // document.getElementById('searchInput').focus();
        // document.getElementById('searchInput').blur();
      });
    }
  }

  deleteHospital(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'hospital', id: this.deleteItem, API: 'hospital/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result['status']) {
          // // console.log(this.deleteItem)
          this.deleteItem.map((id) =>{
            this.departmentList= this.departmentList.filter(x => {
              return x._id != id;
            })
          })
          this.createTable(this.departmentList)
          
          
          this.toastr.success(result['message']);
        }
        // this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  createPropertyForm() {
    this.questionForm = this.fb.group({
      _id: [null, []],
      care_id: ['', [Validators.required]],
      type: ['', [Validators.required]],
      question: ['', [Validators.required]],
      options: this.fb.array([
        this.setInputType(),
      ]),
      searchCtrl: new FormControl()

    });
  }

  /* Add multiple input to the form */
  setInputType() {
    return this.fb.group({
      label: ['', []],
    });
  }

  /* Add option for Radio, Dropdown and Multi Checkboxes */
  addOption() {
    this.temparray = <FormArray>this.questionForm.controls['options'];

    this.temparray.push(this.setInputType());
  }

  /* Remove option for Radio, Dropdown and Multi Checkboxes */
  removeOption(key) {
    this.temparray = <FormArray>this.questionForm.controls['options'];
    this.temparray.removeAt(key);

  }

  get searchCtrl() {
    return this.questionForm.get('searchCtrl');
  }

}
