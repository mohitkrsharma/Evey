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
  @ViewChild('table', {static: true}) table: MatTable<any>;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('addQuestion', {static: true}) addQuestion: TemplateRef<any>;
  @ViewChild('typeSector', {static: true}) private typeSector: MatOption;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
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
  displayedColumns = [];
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
  care : any ;
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
  typeSearch='';
  altSearch='';
  assetSearch='';
  defSearch='';
  org; fac;
  /**
    * Pre-defined columns list for user table
    */
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true
    }
    , {
      id: 'default_selection',
      value: 'Selection',
      sort: false
    }
    // , {
    //   id: 'default_value',
    //   value: 'Default Value',
    //   sort: true
    // }
    ,
    {
      id: 'order',
      value: 'Order',
      sort: true
    },
    {
      id: 'type',
      value: 'Type',
      sort: true
    }];

  columnNames1 = [
    {
      id: 'question',
      value: 'Question',
      sort: false
    }, {
      id: 'type',
      value: 'Question Type',
      sort: false
    }
  ];

  isEdit = false;
  careArray = [];
  finalCareArray: any = [];

  show = false;
  filteredCountries: Observable<any[]>;
  isShowCareMsg: boolean = false;

  public Question_Types: any = [
    {
      'type': 'checkbox',
      'name': 'Multiple choice'
    }, {

      'type': 'date',
      'name': 'Date Picker'
    }, {

      'type': 'radio',
      'name': 'Radio'
    }, {

      'type': 'select',
      'name': 'Dropdown'
    }, {
      'type': 'text',
      'name': 'Input'
    }, {
      'type': 'textarea',
      'name': 'Text Area'
    }];
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

    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(['icon']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['change_status']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    this.displayedColumns1 = this.displayedColumns1.concat(['checkbox']);
    this.displayedColumns1 = this.displayedColumns1.concat(['position']);
    this.displayedColumns1 = this.displayedColumns1.concat(this.columnNames1.map(x => x.id));
    this.displayedColumns1 = this.displayedColumns1.concat(['change_status']);
    this.displayedColumns1 = this.displayedColumns1.concat(['actions']);

    this.route.params.subscribe(async param => {
      // console.log('this')
      this._commonService.setLoader(true);
      const id = this._aes256Service.decFnWithsalt(param['id']);
      this.pagiPayload.parentCareId = id;
      const action = { type: 'POST', target: 'cares/view' };
      const payload = { careId: id };
      const result = await this.apiService.apiFn(action, payload);
      this.care = result['data'];

      console.log('this.care--->', this.care);

      // tslint:disable-next-line: max-line-length
      if (
        this.care.type === 'special' ||
        this.care.type === 'special_input' ||
        this.care.type === 'list' ||
        this.care.type === 'room_cleaning' ||
        this.care.type === 'restroom' ||
        this.care.type === 'virus' ||
        this.care.type === 'vital' ||
        this.care.type === 'fall'
      ) {
        await this.load_careoutcome();
        await this.getCaresDataFunction();

        this.show = true;
        if (this.care.type === 'virus' || this.care.type === 'fall') {
          await this.getCaresQuestionsFunction();
          this.showQuestion = true;
        }
      } else {
        const alternative_outcomes = this.care['alternative_outcomes'].map(
          (itm) => (itm.displayName ? itm.displayName : '-')
        );
        this.care.alternative_outcomes = this.care['alternative_outcomes']
          ? alternative_outcomes.toString().replace(/,/g, ', ')
          : '-';
        this.show = false;
        this.showQuestion = false;
      }
      
      this.displayUnit = false;
      if (this.care.type === 'input' || this.care.type === 'multiple_input' || this.care.type === 'special_input' 
      || this.care.type === 'height' || this.care.type === 'height' ) {
      this.displayUnit = true;
      }
      this._commonService.setLoader(false);
    });

    const action1 = { type: 'GET', target: 'assets/list_types' };
    const payloadParent1 = { isFilteredList: false };
    const result1 = await this.apiService.apiFn(action1, payloadParent1);
    this.assetTypeList = result1['data']; 

    this.fileUploader();
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility     = contentVal.fac;        
      }
    });
    // const action2   = { type: 'GET', target: 'organization/orglist' };
    // const payload2 = {};
    // const result2  = await this.apiService.apiFn(action2, payload2);
    // this.organiz   = result2['data'];
    // this.questionForm = this.fb.group({ // Question form
    //   _id:[null, []],
    //   care_id: ['', [Validators.required]],
    //   type: ['', [Validators.required]],
    //   question: ['', [Validators.required]]
    this.getData();
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
  async onRemoveFac(i) {

    if(i!=undefined && i!=null){
      this.addfacIn(i)
      this.userFacilityList.splice(i, 1);
      this.subCare.facility.splice(i, 1);
      this.facListDone = this.userFacilityList;
      if (this.userFacilityList.length > 0) {
        this.showfaclist = true;
        this.ismultifac  = true;
      } else if (this.userFacilityList.length === 0) {
        this.showfaclist = false;
        this.ismultifac  = false;
      }    
    }else{
      this.showNew=false
    }


  }

  async changeOrg(org) {
    this.org = org;
    // const action  = { type: 'GET', target: 'facility/faclist' };
    // const payload = { 'org_id': org };
    // const result  = await this.apiService.apiFn(action, payload);
    // this.faclist  = result['data'];
    this.subCare.fac = '';

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

  checkForInputValue(type){

    return ['input','multiple_input','special_input'].indexOf(type)>-1
  }  

  async load_care_types() {
    const action = {
      type: 'GET', target: 'cares/types'
    };
    const payload = { careId:  '' };
    const result = await this.apiService.apiFn(action, payload);
    this.addedType = result['data'];

    const _arr = ['room_cleaning', 'restroom', 'virus', 'vital', 'weight', 'height'];
    _arr.forEach(item => {
      if (this.addedType.indexOf(item) > -1) {
        const index = this.careType.findIndex(_itm => _itm.key === item);
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

   
  async cancelForm(subCare) {

    delete this.subCare._id
    this.userFacilityList    = [];
    this.facListDone         = [];
    this.isEdit              = false;
    this.selectedTypeItem = false;
    this.selectedTypeInput = false;    
    this.selectedTypeItemVirus = false;
    this.iconSelected = '';
    const _headers: any = []
    this.subCare = {
      name                 : '',
      default_selection    : '',
      alternative_outcomes : '',
      default_value        : '',
      order                : '',
      type                 : '',
      min                  : '',
      max                  : '',
      unit                 : '',
      asset_type           : '',
      organization         : '',
      fac                  : [],
      facility             : [],
    };
    this.isShowCareMsg = false;
    this.dialogRefs.close();
  }

  onFileChanged(event) {
    const _validFileExtensions = ['.jpg', '.jpeg', '.bmp', '.gif', '.png'];
    const oInput = event.target.files[0];

    const sFileName = oInput.name;
    if (sFileName.length > 0) {
      let blnValid = false;
      for (let j = 0; j < _validFileExtensions.length; j++) {
        const sCurExtension = _validFileExtensions[j];
        if (sFileName.substr(sFileName.length - sCurExtension.length, sCurExtension.length).toLowerCase() === sCurExtension.toLowerCase()) {
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
    if (this.subCare.image && this.care.image.location) {
      _headers.push({ 'name': 'oldimagename', 'value': this.subCare.image.imageName });
    }
    this.uploader = new FileUploader({
      url: url,
      method: 'POST',
      disableMultipart: false,
      headers: _headers,
      maxFileSize: 1024 * 1024, // 1 MB
      queueLimit: 1,
      allowedMimeType: [
        'image/jpeg',
        'image/png',
        'image/tiff',

      ],
    });
    this.uploader.onBeforeUploadItem = (item) => {
      item.withCredentials = false;
    };
  }

  async addFacilityList(subCare, isFromDone?) {

    if(!this.showNew){
      this.showNew=true
      return
    }else{
      this.duplicateFacility = false;
      if ((subCare.organization === '' || subCare.organization === undefined) && !isFromDone) {
        this.toastr.error('Select organization');
        return;
      } else if ( (subCare.fac === '' || subCare.fac === undefined) && !isFromDone) {
        this.toastr.error('Select Building');
        this.duplicateFacility = true;
        return;
      } else {
        this.ismultifac = true;
        if (this.userFacilityList === undefined || this.userFacilityList.length < 1) {
          this.userFacilityList = [
            {
              'org_id': subCare.organization,
              'org_name': this.multiorg,
              'fac_id': subCare.fac,
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
              org_id: subCare.organization,
              org_name: this.multiorg,
              fac_id: subCare.fac,
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
        //     this.subCare['organization'] = '';
        //     this.faclist = [];
        // }
        // this.subCare['fac']          = '';
        // await this.userOrganization()
        // await this.userFacility()   
      }
      if( isFromDone === true && this.duplicateFacility != true){
        //this.dialogRefs.close();
      }
      //this.faclist = [];
      // this.subCare.fac = ''; //io-1181
    }
    this.removeAddedFac()
  }
  removeAddedFac(){
    this.faclist = this.faclist.filter(e=>this.userFacilityList.findIndex(z=>z.fac_id==e._id)==-1)
    this.orgFacSelection() //io-1181
  }

  async addfacIn(i){
    if(this.subCare.organization){
      await this.changeOrg(this.subCare.organization)
    }
    this.facDisable=false
    this.subCare.fac = ''
    // this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id}) //io-1181
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
    if (vaild === 'VALID') { 

      /* Organization/Facility Validation */
      this.duplicateFacility = '';

      //io-1181 below commented
      // if(this.showNew){
      //   if (this.subCare.organization !== '' ) {
      //     if(this.subCare.fac === '' || this.subCare.fac === undefined){
      //       this._commonService.setLoader(false);
      //       this.toastr.error('Select Building.');
      //       return;        
      //     }
      //   } 
      //   if(!this.userFacilityList || !this.userFacilityList.length ){      
      //     if( this.subCare.organization === '' && !this.subCare.facility.length){
      //       this._commonService.setLoader(false);
      //       this.toastr.error('Select organization.');
      //       return;        
      //     }
      //   }
      // }

  
      if(this.subCare.organization && this.subCare.organization !== '' && this.subCare.fac !== ''){      
        this.addFacilityList(this.subCare,true)
      }
      /* End Organization/Facility Validation */
      if(!this.duplicateFacility)
      {
        if (!this.ismultifac) {
            this.subCare['facility'] = [{
              org: this.org,
              fac: this.fac
            }];

          } else {
            this.subCare['facility'] = this.userFacilityList.map(item => (
              { org: item.org_id, fac: item.fac_id, selected: item['selected'] }));
          }
      }  
      this.subCare.notes = this.subCare.notes.filter(e=>e.value!='').map(e=>e.value)      
      const action = { type: 'POST', target: 'cares/add' };
      if (this.care._id) {
        this.subCare.parentCareId = this.care._id;
      }
      const payload = this.subCare;
      const result = await this.apiService.apiFn(action, payload);
      if (result['status'] && result['data']) {
        const careID = result['data']['_id'];
        this.uploader.options.url = this.uploader.options.url.replace('}', '') + '/' + careID;
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
                  //this.router.navigate(['/cares/view', this._aes256Service.encFnWithsalt(this.parentId) ]);
                } else {
                  // this.cancelForm(cares);
                  // this.getCaresDataFunction();
                  //this.router.navigate(['/cares']);
                }
                this.cancelForm(cares);
                this.getCaresDataFunction();
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
    // this.toastr.show('Care added successfully')
    } else {
      this._commonService.setLoader(false);
      this.toastr.error('Please enter care details');
    }

  }

  uploadQueue(next = null) {
    this.buttonDisabled = true;
    const files = this.uploader.queue;

    files.forEach(file => {
      if (file.progress === 0) {
        file.upload();
        file.onError = (response: string, status: number, headers: any) => {
        };
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


  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
  }

  createTable1(arr) {
    const tableArr: Element[] = arr;
    this.dataSource1 = new MatTableDataSource(tableArr);
  }

  async load_careoutcome() {
    const action = {
      type: 'GET', target: 'cares/getcareoutcome'
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);

    this.alternateCare = result['data'].reduce((obj, item, index) => {
      obj.push({ key: item._id, value: item.displayName });
      return obj;
    }, []);
    this.careArray = this.alternateCare;
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

  // cancelForm() {
  //   this.router.navigate(['/cares']);
  // }

  async editCare(id) {
    this.showNew=true
    await this.userOrganization() //io-1181
    await this.userFacility()  //io-1181
    this._commonService.setLoader(true);
    this.isEdit  = true;
    const action = {
      type: 'POST', target: 'cares/view'
    };
    const payload = { careId: id };
    const result = await this.apiService.apiFn(action, payload);

    if(result['data'] && result['data'].notes && result['data'].notes.length){
      result['data'].notes = result['data'].notes.map(e=>({id:Math.random(),value:e}))
    }else{
      result['data'].notes = [{id:Math.random(),value:''}]
    }
    this.subCare = result['data'];
    this.addCareNote(1);
    if(this.subCare.facility){
      this.userFacilityList = this.subCare.facility.map(item => ({
        org_id: item.org._id, org_name: item.org.org_name,
        fac_id: item.fac._id, fac_name: item.fac.fac_name, selected: item.selected,
      })
      );
    } 
    this.facListDone = this.userFacilityList;

    //io-1181 below if else and if condition
    if (result['data']['facility'].length > 0) {
      this.removeAddedFac()
      this.ismultifac = true;
    }
     else {
      this.ismultifac = false;
      this.showfaclist = false;
      this.orgFacSelection()
    }  
    if(!this.subCare.organization){
      this.subCare.organization = '';
    }

    if (this.subCare.parentCareId) {
      this.parentId = this.subCare.parentCareId;

    } else {
      this.careType.push();
    }
    if (this.subCare.type === 'special' || this.subCare.type === 'list' ||
      this.subCare.type === 'room_cleaning' || this.subCare.type === 'restroom') {
      this.selectedTypeItem = false;
    } else {
      this.selectedTypeItem = true;
    }

    if (this.subCare.type === 'virus') {
      this.selectedTypeItemVirus = true;
      this.selectedTypeItem = false;
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

    this.caremsg = '';
    if(this.subCare.name === 'Temperature'){
      this.caremsg = "The CDC considers a person to have a fever when he or she has a measured temperature of 100.4° F or greater. A temperature of less than 95° F is hypothermia.";
    }
    else if(this.subCare.name === 'Pulse Automatic'){
      this.caremsg = "According to the Mayo Clinic a normal resting heart rate, or pulse, for adults ranges from 60 to 100 BPM.";
    }
    else if(this.subCare.name === 'Oxygen'){
      this.caremsg = "According to the Mayo Clinic normal arterial oxygen is approximately 75 to 100 mm Hg.";
    }
    else if(this.subCare.name === 'Blood Pressure'){
      this.caremsg = "The American Heart Association considers a Systolic measurement between 130 - 139 mm Hg / Dystolic between 80 - 89 to be considered High Blood Pressure.";
    }
    else if(this.subCare.name === 'Respirations'){
      this.caremsg = "Johns Hopkins defines normal respiration rates for an adult person at rest to range from 12 to 16 BPM.";
    }
    else if(this.subCare.name === 'Weight'){
      this.caremsg = "Standard minimum and maximum values for weight cannot be defined. Leave empty if you are not setting specific values for the individual.";
    }
    else if(this.subCare.name === 'ACCU Check'){
      this.caremsg = "Healthy minimum and maximum, before a meal, blood glucose is 80–130 mg/dLX according to the American Diabetes Association.";
    }


    const alternative_outcomes = [];
    if (this.subCare.alternative_outcomes) {
      this.subCare.alternative_outcomes.map(function (value, key) {
        const record = this.careArray.find((i) => i.key === value._id);
        alternative_outcomes.push(value._id);
        this.finalCareArray.push(record);
      }, this);
      this.subCare.alternative_outcomes = alternative_outcomes;
    }
    if (this.subCare.default_selection) {
      this.subCare.default_selection = this.subCare.default_selection._id;
    }
    this.addSubCare(null)
    this._commonService.setLoader(false);
    //this.router.navigate(['/cares/form', this._aes256Service.encFnWithsalt(id) ]);
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
      this.subCare.organization = this.organization;
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
      // this.subCare.fac = this.facility; //io-1181
    }else{
      this.removeAddedFac() //io-1181
      // this.faclist = []; //io-1181
    }
    this.orgFacSelection() //io-1181
  }

  async addSubCare(id) {
    this.showNew=true
    //this.router.navigate(['/cares/form/subcare', this._aes256Service.encFnWithsalt(id) ]);
    await this.userOrganization()
    await this.userFacility()  
    if(this.isEdit !== true){
      this.subCare  =this.SubCare()
      //this.isEdit === false;
    }
    //this.faclist  = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1000px';
    //dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'carepopup';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addModal, dialogConfig);
  }

  viewCare(id) {
    this.router.navigate(['/cares/view', this._aes256Service.encFnWithsalt(id) ]);
  }

  deleteCare(id) {
    const _arr = [id];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'cares', 'id': _arr, 'API': 'cares/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== false) {
        if (result['status']) {
          this.toastr.success(result['message']);
        }
        this.getCaresDataFunction();
      }

    });
  }

  public async getCaresDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'cares'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    if (result['status']) {
      result = result['data']['_cares'].map(item => {
        return {
          ...item,
          status: item.status !== undefined ? item.status :true,
          icon: item.icon && item.icon !== undefined ? item.icon : '',
          name: item.name,
          default_selection: item.default_selection ? item.default_selection.displayName : '-',
          default_value: item.default_value ? item.default_value : '-',
          order: item.order,
          type: item.type
        };
      });
      this.data = result;
      if (this.data && this.data.length > 0) {
        this.actualDataCount = this.data.length;
      }
      this.createTable(result);
      this._commonService.setLoader(false);
    }
    this._commonService.setLoader(false);
  }
  get optionsPoints() {
    return this.questionForm.get('options') as FormArray;
  }

  async changeCareStatus(event, care_id) {
    const action = { type: 'POST', target: 'cares/changeStatus' };
    const payload = { 'status': event.checked, 'careId': care_id };
    const result = await this.apiService.apiFn(action, payload);
   // console.log('result of enable disable user',result);
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
      this.toastr.error('Please select sub care to be deleted');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'cares', 'id': this.deleteArr, 'API': 'cares/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        } else {
          if (result['status']) {
            this.toastr.success(result['message']);
          }
          this.checked = false;
          this.getCaresDataFunction();
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');

      });
    }

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
  addquestion() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addQuestion, dialogConfig);
  }

  closeQuestionDialog(): void {
    this.dialogRefs.close();
    this.isEdit = false;
    this.isOptionField = false;
    this.questionForm.reset();
    this.temparray = <FormArray>this.questionForm.controls['options'];
    for (let i = this.temparray.length - 1; i >= 2; i--) {
      this.temparray.removeAt(i);
    }

  }



  getFieldType(event = '') {
    if (this.question.type === 'radio' || this.question.type === 'select' || this.question.type === 'checkbox') {
      this.btnClass = this.question.type + 'btn';
      this.isOptionField = true;
      this.temparray = <FormArray>this.questionForm.controls['options'];
      if (this.temparray.length < 2) {
        this.temparray.push(this.setInputType());
      }
    } else {
      this.isOptionField = false;
      this.btnClass = '';
      this.temparray = [this.setInputType()];

    }
  }

  public async getCaresQuestionsFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'questions'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    // console.log('result>>',result['data'])
    // console.log('result')
    this.count = result['data']['_count'];

    if (result['status'] && this.count > 0) {
      result = result['data']['_questions'].map(item => {
        return {
          ...item,
          type: this.questionType(item.type),
          care_id: item.care_id,
          question: item.question,
          order: item.order
        };
      });
      this.data1 = result;
      if (this.data1 && this.data1.length > 0) {
        this.actualDataCount1 = this.data1.length;
      }

      this.createTable1(result);
      this._commonService.setLoader(false);
    } else {
      this.data1 = [];
      this.actualDataCount1 = 0;
      this.createTable1([]);
    }
    this._commonService.setLoader(false);
  }
  async saveQuestionDialog() {
    this.questionForm.controls.care_id.patchValue(this.pagiPayload.parentCareId);
    if (this.questionForm.valid) {
      this._commonService.setLoader(true);
      const data = {
        '_id': this.questionForm && this.questionForm.controls._id.value ? this.questionForm.controls._id.value : '',
        'type': this.questionForm.controls.type.value,
        'question': this.questionForm.controls.question.value,
        'care_id': this.questionForm.controls.care_id.value,
        'options': (this.isOptionField) ? this.questionForm.controls.options.value : [],
      };

      const action = {
        type: 'POST',
        target: 'questions/addQuestionCareWise'
      };
      const payload = data;
      // console.log('payload---->', payload);
      const result = await this.apiService.apiFn(action, payload);
      console.log('result>>', result )
      if (result['status']) {
        this.toastr.success(result['message']);

        this.closeQuestionDialog();
        this.getCaresQuestionsFunction();
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

  async editQuestion(questionId) {
    this.isEdit = true;
    this._commonService.setLoader(true);
    const action = {
      type: 'POST', target: 'questions/view'
    };
    const payload = { questionId: questionId };
    const result = await this.apiService.apiFn(action, payload)
    this.question = result['data']['_question'];
    this._commonService.setLoader(false);
    // console.log('herer>>>>',this.question)

    this.temparray = <FormArray>this.questionForm.controls['options'];
    //  console.log('length>>>',this.temparray.length )
    // this.temparray.push(this.setInputType());

    if (this.question.options.length > 1) {
      this.question.options.forEach((element, ind) => {

        if (ind >= this.temparray.length) {
          this.addOption();
        }

      });
    }
    this.questionForm.patchValue(this.question);
    this.getFieldType();
    this.addquestion();

  }

  deleteQuestion(id) {
    const _arr = [id];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '350px',
      data: { 'title': 'question', 'id': _arr, 'API': 'questions/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {

      if (result != false) {
        if (result['status']) {
          this.toastr.success(result['message']);
        }
        this.getCaresQuestionsFunction();
      }

    });
  }
  selectAllQues() {
    if (this.checked1 === true) {
      this.data1.forEach(element => {
        element.checked = false;
        this.deleteArr1 = [];
      });
    } else {
      this.data1.forEach(element => {
        this.deleteArr1.push(element._id);
        element.checked = true;
      });
    }
  }
  selectElementQues(id, check) {
    if (check === true) {
      for (let i = 0; i < this.deleteArr1.length; i++) {
        if (this.deleteArr1[i] === id) {
          this.deleteArr1.splice(i, 1);
        }
      }
    } else if (check === undefined || check === false) {
      this.deleteArr1.push(id);
    }
    if ((this.deleteArr1 && this.deleteArr1.length) < this.actualDataCount1) {
      this.checked1 = false;
    } else if ((this.deleteArr1 && this.deleteArr1.length) === this.actualDataCount1) {
      this.checked1 = true;
    }
  }
  deleteQues() {
    if (this.deleteArr1.length === 0) {
      this.toastr.error('Please select question to be deleted');
      this.checked1 = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '350px',
        data: { 'title': 'cares', 'id': this.deleteArr1, 'API': 'questions/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data1.forEach(element => {
            element.checked = false;
            this.checked1 = false;
          });
          this.deleteArr1 = [];
        } else {
          if (result['status']) {
            this.toastr.success(result['message']);
          }
          this.checked1 = false;
          this.getCaresQuestionsFunction();
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');

      });
    }

  }
  dropTable(event: CdkDragDrop<[]>) {
    const prevIndex = this.dataSource1.filteredData.findIndex((d) => d === event.item.data);
    const arr = {
      _id: event.item.data._id,
      previous_order: prevIndex + 1 + (this.pagiPayload.pageIndex * this.pagiPayload.pageSize),
      current_order: event.currentIndex + 1 + (this.pagiPayload.pageIndex * this.pagiPayload.pageSize)

    };
    if (prevIndex !== event.currentIndex) {
      this.exchangeOrder(arr);
    }

    moveItemInArray(this.dataSource1.filteredData, prevIndex, event.currentIndex);
    this.table.renderRows();
  }

  async exchangeOrder(arr) {
    const data = {
      care_id: this.pagiPayload.parentCareId,
      _id: arr._id,
      previous_order: arr.previous_order,
      current_order: arr.current_order
    };

    const action = {
      type: 'POST',
      target: 'questions/exchangeOrder'
    };
    const payload = data;
    const result = await this.apiService.apiFn(action, payload);

  }

  async changeStatus(event, question_id) {
    const action = { type: 'POST', target: 'questions/changeStatus' };
    const payload = { 'status': event.checked, 'questionId': question_id };
    const result = await this.apiService.apiFn(action, payload);
  }

  questionType(type) {
    const ind = this.Question_Types.findIndex(item => item.type === type);
    if (ind > -1) {
      return this.Question_Types[ind].name;
    }
  }

  get searchCtrl() {
    return this.questionForm.get('searchCtrl');
  }

  getData(){
  this.filteredCountries = this.searchCtrl.valueChanges
      .pipe(
        startWith(''),
        map(item => item ? this.searchPipe.transform(this.Question_Types, item, 'name') : this.Question_Types.slice())
      );
   }
  addCareNote(i){
    //this.subCare.notes.push({id:Math.random()+this.subCare.notes.length,value:''});
    this.subCare.notes.unshift({id:Math.random()+this.subCare.notes.length,value:''});
  }
  removeCareNote(i){
    this.subCare.notes.splice(i,1);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.subCare.notes, event.previousIndex, event.currentIndex);
  }

  SubCare(){
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
      pricing:'',
      asset_type:'',
      organization : '',
      fac : '',
      facility : [],
      notes:[{id:Math.random(),value:''}]
    }
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
      this.subCare.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']
    
      //facility manage
      this.facDisable = true
      this.subCare.fac=this.faclist[0]['_id']
      this.multifacility=this.faclist[0]['fac_name']
    }
    else if(this.organiz.length==1 && this.faclist.length>1){
      console.log('---here------------',this.faclist)
      //organization manage
      this.orgDisable=true
      this.subCare.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.subCare.fac=''

    }else if(this.organiz.length>1){
        //organization manage
        this.orgDisable=false
        // this.announcement.organization = ''
        // this.multiorg = this.organiz[0]['org_name']
      
        //facility manage
        this.facDisable = false
        this.subCare.fac=''
        this.multifacility=(this.faclist && this.faclist.length && this.faclist[0]['fac_name'])?this.faclist[0]['fac_name']:''
    }else if(this.organiz.length==1 && this.faclist.length==0){
       //organization manage
       this.orgDisable=true
       this.subCare.organization = this.organization
       this.multiorg = this.organiz[0]['org_name']
     
       //facility manage
       this.facDisable = false
       this.subCare.fac=''
      //  this.multifacility=this.faclist[0]['fac_name']
    }
    else{
       //organization manage
      this.orgDisable=false
      this.subCare.organization = ''

      //facility manage
      this.facDisable = false
      this.subCare.fac=''
    }
  }

  onInfoClick(){
    this.isShowCareMsg = !this.isShowCareMsg;
  }
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  parentCareId: string;
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
}
