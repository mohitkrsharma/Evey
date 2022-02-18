import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { FileUploader } from 'ng2-file-upload';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { environment } from './../../../../environments/environment';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {
  careForm: FormGroup;
  alternateCare;
  assetTypeList = [];
  parentId = null;
  parentCare = null;
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
    asset_type:'',
  };
  isEdit = false;
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
    { key: 'room_cleaning', value: 'Unit Cleaning' },
    { key: 'restroom', value: 'Restroom' },
    { key: 'virus', value: 'Virus' },
    { key: 'special_input', value: 'Special Input' },
    { key: 'vital', value: 'Vital' },
    { key: 'notes', value: 'Notes' },
    { key: 'fall', value: 'Fall' },
    { key: 'call_light', value: 'Call Light' },
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
  constructor(private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _location: Location,
    private _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public _commonService: CommonService
  ) { }


  async ngOnInit() {
    if(!this._commonService.checkPrivilegeModule('cares','add')){
      this.router.navigate(['/']);
    }

    this._commonService.setLoader(true);
    await this.load_careoutcome();
    await this.load_care_types();
    const action1 = { type: 'GET', target: 'assets/list_types' };
    const payloadParent1 = { isFilteredList: false };
    const result1 = await this.apiService.apiFn(action1, payloadParent1);
    this.assetTypeList = result1['data']; 
    if (this.route.params['_value']['id']) {
      this.isEdit = true;
      const action = {
        type: 'POST', target: 'cares/view'
      };
      const payload = { careId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
      const result = await this.apiService.apiFn(action, payload);

      this.care = result['data'];
      if (this.care.parentCareId) {
        this.parentId = this.care.parentCareId;

      } else {
        this.careType.push();
      }
      if (this.care.type === 'special' || this.care.type === 'list' ||
        this.care.type === 'room_cleaning' || this.care.type === 'restroom') {
        this.selectedTypeItem = false;
      } else {
        this.selectedTypeItem = true;
      }

      if (this.care.type === 'virus') {
        this.selectedTypeItemVirus = true;
        this.selectedTypeItem = false;
      }

      this.selectedTypeInput = false;
      if (this.care.type === 'input' || this.care.type === 'multiple_input' || this.care.type === 'special_input'
      || this.care.type === 'height' || this.care.type === 'weight' ) {
        this.selectedTypeInput = true;
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

    }
    if (this.route.params['_value']['parentId']) {

      this.parentId = this._aes256Service.decFnWithsalt(this.route.params['_value']['parentId']);
      const _arr = ['room_cleaning', 'restroom', 'virus', 'vital', 'weight', 'height'];
      _arr.forEach(item => {
        const index = this.careType.findIndex(_itm => _itm.key === item);
        if (index > -1) {
          delete this.careType[index];
          this.careType = this.careType.filter(function (el) {
            return el != null;
          });
        }
      });
    }
    if (this.parentId) {
      const action = { type: 'POST', target: 'cares/view' };
      const payloadParent = { careId: this.parentId };
      const result = await this.apiService.apiFn(action, payloadParent);
      this.parentCare = result['data'];
      if (this.parentCare.type === 'special' || this.parentCare.type === 'special_input' || this.parentCare.type === 'list' ||
        this.parentCare.type === 'room_cleaning' || this.parentCare.type === 'restroom' || this.parentCare.type === 'virus') {
        this.careType = [
          { key: 'default', value: 'Default' },
          { key: 'selection', value: 'Selection' },
          { key: 'input', value: 'Input' },
          { key: 'multiple_input', value: 'Multiple Input' },
          { key: 'list', value: 'List' },
          { key: 'special', value: 'Special' },
          { key: 'special_input', value: 'Special Input' },
          { key: 'other', value: 'Other' }
        ];
      }
      if (this.parentCare.type === 'vital') {
        this.careType.push({ key: 'height', value: 'Height' }, { key: 'weight', value: 'Weight' });

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
      }

    }

    this._commonService.setLoader(false);
    this.fileUploader();
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

    if (this.care.type === 'special' || this.care.type === 'list' || this.care.type === 'vital' ||
     this.care.type === 'room_cleaning' || this.care.type === 'restroom' ) {
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
    if (this.care.type === 'input' || this.care.type === 'multiple_input' || this.care.type === 'special_input'
     || this.care.type === 'height' || this.care.type === 'weight' ) {
      this.selectedTypeInput = true;
    }
  }

  checkForInputValue(type){

    return ['input','multiple_input','special_input'].indexOf(type)>-1
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

  async load_care_types() {
    const action = {
      type: 'GET', target: 'cares/types'
    };
    // tslint:disable-next-line: max-line-length
    const payload = { careId: (this.route.params['_value']['id'] !== undefined) ? this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) : '' };
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

  cancelForm() {
    this.router.navigate(['/cares']);
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
      const action = { type: 'POST', target: 'cares/add' };
      if (this.parentId) {
        this.care.parentCareId = this.parentId;
      }
      const payload = this.care;
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
                  this.router.navigate(['/cares/view', this._aes256Service.encFnWithsalt(this.parentId) ]);
                } else {
                  this.router.navigate(['/cares']);
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
    // this.toastr.show("Care added successfully")
    } else {
      this._commonService.setLoader(false);
      this.toastr.error('Please enter care details');
    }

  }

  change(event) {
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

  async fileUploader(careId = '') {

    let url = '';
    if (careId !== '') {
      url = environment.config.api_url + 'cares/uploadicon/' + careId;
    } else {
      url = environment.config.api_url + 'cares/uploadicon';
    }
    const _headers: any = await this.apiService.setHeadersForFileUpload();
    if (this.care.image && this.care.image.location) {
      _headers.push({ 'name': 'oldimagename', 'value': this.care.image.imageName });
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

}
