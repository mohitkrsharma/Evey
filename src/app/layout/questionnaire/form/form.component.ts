import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { MatDialog, PageEvent } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ExcelService } from 'src/app/shared/services/excel.service';
import { FileUploader } from 'ng2-file-upload';
import { environment } from './../../../../environments/environment';
import { SearchFilterBYPipe } from 'src/app/shared/services/search-filter-by.pipe';
import * as moment from 'moment';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private searchPipe: SearchFilterBYPipe,
    public _commonService: CommonService,
    private _aes256Service: Aes256Service,
    private route: ActivatedRoute
  ) {
    this.createPropertyForm();
  }

  organization;
  orgLogo;
  facility;
  private subscription: Subscription;
  duplicateFacility;

  uploader: FileUploader;
  buttonDisabled: Boolean;
  iconError = '';
  addedType: any = [];
  iconSelected = [];
  displayFile: any = [];
  deleteFile: any = [];
  // fileNameList:any=[]
  isAdding: Boolean = true;
  isEdit = false;
  public show = false;
  isOptionField: boolean;
  btnClass: string;
  search: any;
  filteredType: Observable<any[]>;
  filteredQuestionType: Observable<any[]>;
  data: any;
  paramId: any;
  ismultifac: any = false;
  organiz: any;
  org: any;
  fac: any;
  faclist: any = [];
  orgSearch = '';
  facSearch = '';
  questionSearch = '';
  multifacility: any;
  fac_address1: any;
  fac_address2: any;
  fac_city: any;
  fac_state: any;
  fac_zip1: any;
  fac_zip2: any;
  multiorg: any;
  userFacilityList: any = [];
  showfaclist: Boolean;
  questionOnChange = '';
  questionNameType: Boolean = false;
  questionEmpType: Boolean = false;
  questionResType: Boolean = false;
  questionBillingType: Boolean = false;
  questionTextType: Boolean = false;
  questionTextareaType: Boolean = false;
  questionDateType: Boolean = false;
  questionMultiType: Boolean = false;
  questionRadioType: Boolean = false;
  questionDropType: Boolean = false;
  questionDisplayType: Boolean = false;
  questionVitalType: Boolean = false;
  orgDisable: Boolean = false;
  facDisable: Boolean = false;
  MultiCheck: any;
  imagesPreview: any = [];
  showNew = true;
  selectedDate = moment().format('YYYY-MM-DD');
  public facListDone = [];
  public Question_Types: any = [
    {
      type: 'checkbox',
      name: 'Multiple Choice',
      value: 'Multiple Choice',
    },
    {
      type: 'radio',
      name: 'Single Choice',
      value: 'Single Choice',
    },
    {
      type: 'select',
      name: 'Dropdown',
      value: 'Select',
    },
    {
      type: 'text',
      name: 'Input',
      value: 'Text',
    },
    {
      type: 'textarea',
      name: 'Text Area',
      value: 'Text Area',
    },
    {
      type: 'image',
      name: 'Image',
      value: 'Image',
    },
    {
      type: 'name',
      name: 'Name',
      value: 'Name',
    },
    {
      type: 'date',
      name: 'Calendar',
      value: 'Calendar',
    },
    {
      type: 'employee_id',
      name: 'Employee ID',
      value: 'Employee ID',
    },
    {
      type: 'billing_id',
      name: 'Billing ID',
      value: 'Billing ID',
    },
    // {
    //   type: 'resident_id',
    //   name: 'Resident ID',
    //   value: 'Resident ID'
    // },
    // {
    //   type: 'vital',
    //   name: 'Vital',
    // },
  ];
  dialogRefs = null;
  public group: any = [
    { type: 'visitor', name: 'Visitor' },
    { type: 'employee', name: 'Employee' },
    { type: 'vendor', name: 'Vendor' },
    { type: 'resident', name: 'Resident' },
  ];
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    group: '',
  };
  question: any = {
    // group: '',
    type: '',
    question: '',
    field_label: this.fb.array([]),
    // organization: '',
    // fac: '',
    // facility: [],
  };
  public temparray: any = [];
  questionForm: FormGroup;
  questionnaire;
  questionnaireGroupName = '';
  questionId = '';

  async ngOnInit() {
    this.showNew = true;
    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
        await this.userOrganization();
        await this.userFacility();
      }
    );
    await this.getData();
    // this.getOrganization();
    if (this.route.params['_value']['group']) {
      console.log('group wise');
      this.questionnaire = this.route.params['_value']['group'];
      this.pagiPayload['group'] = this.questionnaire;
      this.questionnaireGroupName = this.questionnaire;
    }
    if (this.route.params['_value']['id']) {
      console.log('id wise');
      this._commonService.setLoader(true);
      //   const action = { type: 'POST', target: 'beacons/view' };
      this.paramId = this._aes256Service.decFnWithsalt(
        this.route.params['_value']['id']
      );
      const questionId = this._aes256Service.decFnWithsalt(
        this.route.params['_value']['id']
      );
      this.questionId = questionId;
      await this.editQuestion(questionId);
      this._commonService.setLoader(false);
    }
    // console.log('this.questionId---->', this.questionId);
    await this.getServerData(this.pagiPayload);
  }
  get optionsPoints() {
    this.MultiCheck = this.questionForm.get('options').value;
    return this.questionForm.get('options') as FormArray;
  }

  get suspendPoints() {
    return this.questionForm.get('suspend') as FormArray;
  }

  createPropertyForm() {
    this.questionForm = this.fb.group({
      _id: [null, []],
      // group: ['', [Validators.required]],
      type: ['', [Validators.required]],
      question: ['', [Validators.required]],
      options: this.fb.array([]),
      searchCtrl: new FormControl(),
      searchCtrlForType: new FormControl(),
      // organization: new FormControl(),
      // fac: new FormControl(),
    });
  }

  /* Add option for Radio, Dropdown and Multi Checkboxes */
  addOption() {
    this.temparray = <FormArray>this.questionForm.controls['options'];
    if (this.temparray.status === 'INVALID') {
      return this.toastr.error('Kindly enter the value for option(s).');
    }
    this.temparray.insert(0, this.setInputType());
  }

  /* Remove option for Radio, Dropdown and Multi Checkboxes */
  removeOption(key) {
    this.temparray = <FormArray>this.questionForm.controls['options'];
    this.temparray.removeAt(key);
    if (
      this.question.type == 'image' ||
      this.question.type == 'vital' ||
      this.question.type == 'display'
    ) {
      this.iconSelected.splice(key + 1, 1);
      this.displayFile.splice(key + 1, 1);
      // this.fileNameList.splice(key+1,1)
      this.imagesPreview.splice(key + 1, 1);
    }
  }

  /* Add multiple input to the form */
  setInputType() {
    return this.fb.group({
      origImageName: ['', []],
      imageName: ['', []],
      url: ['', []],
      label: ['', []],
      file: ['', []],
      suspend_days: ['', []],
      next_question: ['', []],
    });
  }

  // OnKeypress Question Get Start
  onKeypressCheckEvent(event: any) {
    this.questionOnChange = event.target.value;
  }
  // OnKeypress Question Get End

  getFieldType(event = '') {
    if (this.question.type === 'name') {
      this.questionNameType = true;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionRadioType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionDropType = false;
      this.questionBillingType = false;
    } else if (this.question.type === 'employee_id') {
      this.questionNameType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionRadioType = false;
      this.questionDropType = false;
      this.questionDisplayType = false;
      this.questionBillingType = false;
      this.questionEmpType = true;
    } else if (this.question.type === 'resident_id') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionTextType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionRadioType = false;
      this.questionDropType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionResType = true;
    } else if (this.question.type === 'text') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionRadioType = false;
      this.questionDropType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionTextType = true;
    } else if (this.question.type === 'textarea') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionRadioType = false;
      this.questionDropType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionTextareaType = true;
    } else if (this.question.type === 'date') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionMultiType = false;
      this.questionRadioType = false;
      this.questionDropType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionDateType = true;
    } else if (this.question.type === 'select') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionRadioType = false;
      this.questionMultiType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionDropType = true;
    } else if (this.question.type === 'radio') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionDropType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionRadioType = true;
    } else if (this.question.type === 'checkbox') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = true;
      this.questionDropType = false;
      this.questionRadioType = false;
      this.questionDisplayType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
    } else if (this.question.type === 'vital') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionDropType = false;
      this.questionRadioType = false;
      this.questionDisplayType = false;
      this.questionBillingType = false;
      this.questionVitalType = true;
    } else if (this.question.type === 'image') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionDropType = false;
      this.questionRadioType = false;
      this.questionVitalType = false;
      this.questionBillingType = false;
      this.questionDisplayType = true;
    } else if (this.question.type === 'billing_id') {
      this.questionNameType = false;
      this.questionEmpType = false;
      this.questionResType = false;
      this.questionTextType = false;
      this.questionDateType = false;
      this.questionTextareaType = false;
      this.questionDateType = false;
      this.questionMultiType = false;
      this.questionDropType = false;
      this.questionRadioType = false;
      this.questionVitalType = false;
      this.questionDisplayType = false;
      this.questionBillingType = true;
    }

    if (
      this.question.type === 'radio' ||
      this.question.type === 'select' ||
      this.question.type === 'checkbox' ||
      this.question.type === 'display' ||
      this.question.type === 'vital' ||
      this.question.type === 'image'
    ) {
      // console.log('choice', this.temparray);
      this.btnClass = this.question.type + 'btn';
      this.isOptionField = true;
      this.temparray = <FormArray>this.questionForm.controls['options'];
      if (this.temparray.length < 2) {
        this.temparray.push(this.setInputType());
      }
    } else {
      // console.log('not choice');
      this.isOptionField = false;
      this.btnClass = '';
      this.temparray = [this.setInputType()];
    }
  }

  questionType(type) {
    const ind = this.Question_Types.findIndex((item) => item.type === type);
    if (ind > -1) {
      return this.Question_Types[ind].name;
    }
  }

  get searchCtrl() {
    return this.questionForm.get('searchCtrl');
  }
  get searchCtrlForType() {
    return this.questionForm.get('searchCtrlForType');
  }
  getData() {
    this.filteredType = this.searchCtrl.valueChanges.pipe(
      startWith(''),
      map((item) =>
        item
          ? this.searchPipe.transform(this.Question_Types, item, 'name')
          : this.Question_Types.slice()
      )
    );

    this.filteredQuestionType = this.searchCtrlForType.valueChanges.pipe(
      startWith(''),
      map((item) =>
        item
          ? this.searchPipe.transform(this.group, item, 'name')
          : this.group.slice()
      )
    );
  }

  oldOptions(index) {
    if (index == 0) {
      return 'add';
    } else {
      if (
        this.question.type == 'display' ||
        this.question.type == 'vital' ||
        this.question.type == 'image'
      ) {
        return 'minus';
      } else {
        if (index == 1) {
          return 'none';
        } else {
          return 'minus';
        }
      }
    }

    // if(index+1==this.temparray.length){
    //     return 'add';
    // }else if(this.question.type=='display' ||this.question.type=='vital'){
    //     if(index>=0){
    //         return 'minus'
    //     }
    // }else if(index>0){
    //     return 'minus'
    // }else{
    //     return 'none'
    // }

    // if (index + 1 == this.temparray.length) {
    //     return 'add';
    // } else if (index > 0) {
    //     return 'minus';
    // } else {
    //     return 'none';
    // }
  }

  async previousWindow() {
    this.isAdding = !this.isAdding;
    this.questionForm.enable();
  }

  async nextPage() {
    if (
      this.temparray.length < 2 &&
      (this.question.type === 'radio' ||
        this.question.type === 'select' ||
        this.question.type === 'checkbox')
    ) {
      return this.toastr.error('Kindly select atleast 2 option.');
    }
    // console.log('this.questionForm--->', this.questionForm);
    // console.log("this.temparray--->", this.temparray);
    if (this.questionForm.valid) {
      if (
        this.question.organization &&
        this.question.organization !== '' &&
        this.question.fac !== ''
      ) {
        this.addFacilityList(this.question, true);
        if (this.duplicateFacility == true) {
          return;
        }
      }
      // if (!this.userFacilityList || !this.userFacilityList.length) {
      //     this.toastr.error('Please add facility data');
      //     return;
      // }
      this.isAdding = !this.isAdding;
      const optionArr: any = this.questionForm.get('options');
      for (let i = 0; i < optionArr['controls'].length; i++) {
        optionArr['controls'][i].get('suspend_days').enable();
        optionArr['controls'][i].get('next_question').enable();
      }
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
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
      JSON.stringify({ questionList: this.pagiPayload })
    );
    this.getQuestionsDataFunction();
  }

  public async getQuestionsDataFunction() {
    const action = {
      type: 'POST',
      target: 'questions/question_list',
    };
    // console.log('this.questionnaireGroupName--->', this.questionnaireGroupName);
    const payload = { group: this.questionnaireGroupName };
    if (this.questionId) {
      payload['_id'] = this.questionId;
    }
    // console.log('payload---->', payload);
    let result = await this.apiService.apiFn(action, payload);

    // console.log('result---->', result);
    // this.count = result['data']['_count'];
    if (result['status']) {
      result = result['data'].map((item) => {
        return {
          ...item,
          question: item.question,
          order: item.order,
          type: item.type ? this.questionType(item.type) : '',
        };
      });
      let resultData: any = [];
      resultData = result;
      const selectedQuestion = resultData.filter((element) => {
        return element._id.toString() !== this.questionId;
      });
      this.data = resultData.filter((element) => {
        return (
          element._id.toString() !== this.questionId &&
          selectedQuestion[0].order < element.order
        );
      });
      // this.data = result;
      // console.log('this.data---->', this.data);
      //   if (this.data && this.data.length > 0) {
      //     this.actualDataCount = this.data.length;
      //   }
      this._commonService.setLoader(false);
    }
  }

  async displayFileChange(event, index) {
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
        this.toastr.error('Only image are allowed');
        // this.iconError = 'Only image allow to upload.';
        this.iconSelected[index] = '';
        return false;
      }
    }

    if (this.isEdit && this.displayFile[index]) {
      if (this.MultiCheck[index] && this.MultiCheck[index].imageName) {
        this.deleteFile[index] = this.MultiCheck[index].imageName;
      }
    }

    this.iconError = '';
    this.iconSelected[index] = sFileName;
    var reader = new FileReader();
    reader.onload = (event: any) => {
      this.imagesPreview[index] = event.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);

    const filesData = event.target.files;
    this.displayFile[index] = filesData[0];
    // this.iconSelected[index]=sFileName
  }

  async saveQuestionDialog() {
    // console.log('this.questionForm--->', this.questionForm.value);
    // console.log('this.temparray.status--->', this.temparray.status);
    this.questionForm.enable();
    // return
    if (this.questionForm.valid) {
      this.question['facility'] = this.userFacilityList.map((item) => ({
        org: item.org_id,
        fac: item.fac_id,
      }));

      if (
        this.route.params['_value']['id'] &&
        this.question['facility'].some(
          (item) =>
            item.fac === this.question['fac'] &&
            this.question['organization'] === item.org
        )
      ) {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error('Facility already added');
        }
      } else {
        if (
          this.route.params['_value']['id'] &&
          this.question['organization'] &&
          this.question['fac']
        ) {
          this.question['facility'].push({
            org: this.question['organization'],
            fac: this.question['fac'],
          });
        }
      }

      const formData = new FormData();
      formData.append('username', 'test');
      const fd = new FormData();

      if (this.questionForm.controls._id.value) {
        fd.append('_id', this.questionForm.controls._id.value);
      }

      fd.append('type', this.questionForm.controls.type.value);
      fd.append('question', this.questionForm.controls.question.value);

      if (this.isOptionField) {
        fd.append(
          'options',
          JSON.stringify(this.questionForm.controls.options.value)
        );
      } else {
        fd.append('options', JSON.stringify([]));
      }
      // fd.append('facility',JSON.stringify(this.question.facility))

      this.displayFile.forEach((e, index) => fd.append(`file-${index}`, e));
      if (
        this.questionForm.controls.type.value == 'display' ||
        this.questionForm.controls.type.value == 'vital' ||
        this.questionForm.controls.type.value == 'image'
      ) {
        if (
          this.displayFile.length !=
          this.questionForm.controls.options.value.length
        ) {
          this.toastr.error('Please enter all options with image');
          return;
        }
      }
      if (this.deleteFile && this.deleteFile.length) {
        fd.append('deletefile', JSON.stringify(this.deleteFile));
      }

      // fd.forEach((value, key) => {
      //     console.log('key---->', key);
      //     console.log('value----->', value);
      //  });
      const action = {
        type: 'FORMDATA',
        target: 'questions/add',
      };
      const payload = fd;
      // console.log('payload----->', payload);
      if (!this.questionForm.controls._id.value) {
        // console.log('questions/add--->');
        const result = await this.apiService.apiFn(action, payload);

        if (result['status']) {
          await this.apiService
            .apiFn(
              { type: 'POST', target: 'questionnaire/questionnerAdd' },
              {
                group: this.questionnaire,
                options: JSON.stringify(result['data']['options']),
                type: this.questionForm.controls.type.value,
                question: this.questionForm.controls.question.value,
              }
            )
            .then(async (result: any) => {
              if (result['status']) {
                this._commonService.setLoader(true);
                this.toastr.success(result['message']);
                this.router.navigate([
                  '/createAQuestionnaire/view/' + this.questionnaire,
                ]);
              } else {
                this._commonService.setLoader(false);
                this.toastr.error(result['message']);
              }
            })
            .catch((error) => {
              this._commonService.setLoader(false);
              this.toastr.error(
                error.message ? error.message : 'Some error occured'
              );
            });
          // this.toastr.success(result['message']);
          // this.router.navigate(['/createAQuestionnaire']);
          // this.getServerData(this.pagiPayload);
          // this._commonService.setLoader(true);
        } else {
          this._commonService.setLoader(false);
          this.toastr.error(result['message']);
        }
      } else {
        // console.log('questionnaire/questionnerAdd--->');
        await this.apiService
          .apiFn(
            { type: 'POST', target: 'questionnaire/questionnerAdd' },
            {
              _id: this.questionForm.controls._id.value,
              group: this.questionnaire,
              options: JSON.stringify(this.questionForm.controls.options.value),
              type: this.questionForm.controls.type.value,
              question: this.questionForm.controls.question.value,
            }
          )
          .then(async (result: any) => {
            if (result['status']) {
              this._commonService.setLoader(true);
              this.toastr.success(result['message']);
              this.router.navigate([
                '/createAQuestionnaire/view/' + this.questionnaire,
              ]);
            } else {
              this._commonService.setLoader(false);
              this.toastr.error(result['message']);
            }
          })
          .catch((error) => {
            this._commonService.setLoader(false);
            this.toastr.error(
              error.message ? error.message : 'Some error occured'
            );
          });
      }
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  async editQuestion(questionId) {
    // console.log(questionId);
    // return
    this.isEdit = true;
    await this.userOrganization(); // io-1181
    await this.userFacility(); // io-1181
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'questionnaire/details',
    };
    const payload = { questionId: questionId };
    let result = await this.apiService.apiFn(action, payload);
    this.question = result['data']['_question'];
    this.questionnaireGroupName = this.question.group;
    this.questionId = this.question._id;
    // console.log('this.question----->', this.question);
    this.questionOnChange = result['data']['_question'].question;
    this._commonService.setLoader(false);
    this.temparray = <FormArray>this.questionForm.controls['options'];
    if (
      this.question &&
      this.question.options &&
      this.question.options.length > 1
    ) {
      for (let index = 0; index < this.question.options.length; index++) {
        // this.addOption();
        this.temparray.push(this.setInputType());
      }
      // this.question.options.forEach((element, ind) => {
      //   if (ind >= this.temparray.length) {
      //       this.addOption();
      //     }
      // });
    }

    this.question.options.map((e) => {
      this.displayFile.push(e.origImageName);
      this.iconSelected.push(e.origImageName);
    });
    this.question.options.map((e) => this.imagesPreview.push(e.url));
    this.questionForm.patchValue(this.question);

    this.getFieldType();
  }

  checkAllwoNum(key) {
    const result = this._commonService.allwoNum(key);
    return result;
  }

  cancelForm() {
    this.router.navigate(['/createAQuestionnaire/view/' + this.questionnaire]);
  }

  async getOrganization() {
    await this.apiService
      .apiFn({ type: 'GET', target: 'organization/orglist' }, {})
      .then((result: any) => (this.organiz = result['data']))
      .catch((error) => {});
    // console.log(this.organiz);
  }

  async changeOrg(org) {
    this.org = org;
    // const action = { type: 'GET', target: 'facility/faclist' };
    // const payload = { org_id: org };
    // const result = await this.apiService.apiFn(action, payload);
    // this.faclist = result['data'];
    this.question.fac = '';

    const payload2 = { org: org };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
    this.faclist = await result2['data'].map((obj) => {
      return {
        fac_name: obj._id.fac.fac_name,
        _id: obj._id.fac._id,
      };
    });
    if (this.userFacilityList && this.userFacilityList.length) {
      this.removeAddedFac();
    }
    let defaultFacName;
    for (let i = 0; i < this.faclist.length; i++) {
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
    // console.log(org, fac, flag);
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
    } else {
      if (!org || org === undefined) {
        this.multifacility = fac;
        this.fac_address1 = fac.fac_address1;
        this.fac_address2 = fac.fac_address2;
        this.fac_city = fac.fac_city;
        this.fac_state = fac.fac_state;
        this.fac_zip1 = fac.fac_zip1;
        this.fac_zip2 = fac.fac_zip2;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  async userOrganization() {
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = await result['data'].map((obj) => {
      return {
        org_name: obj._id.org.org_name,
        _id: obj._id.org._id,
        org_logo:
          obj._id.org.logo && obj._id.org.logo.location
            ? obj._id.org.logo.location
            : '',
      };
    });
    let defaultOrgName;
    const orgData = this.organiz.filter((item) => {
      return item._id.toString() == this.organization;
    });
    // console.log('orgData--->', orgData);
    this.orgLogo = orgData && orgData.length ? orgData[0].org_logo : '';
    // console.log('this.orgLogo---->', this.orgLogo);
    for (let i = 0; i < this.organiz.length; i++) {
      if (this.organization == this.organiz[i]._id) {
        defaultOrgName = this.organiz[i].org_name;
      }
    }
    this.multiorg = defaultOrgName;
    // io-1181 below commented
    // if(this.isEdit !== true){
    //   this.question.organization = this.organization;
    // }
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
      //   this.question.fac = this.facility; //io-1181
    } else {
      this.removeAddedFac(); //io-1181
      //this.faclist = []; //io-1181
    }
    this.orgFacSelection(); //io-1181
  }

  async addFacilityList(user, isFromDone?) {
    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      this.duplicateFacility = false;
      if (
        (this.question.organization === '' ||
          this.question.organization === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Please select organization');
      } else if (
        (this.question.fac === '' || this.question.fac === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Please select Building');
        this.duplicateFacility = true;
      } else {
        this.ismultifac = true;
        if (
          this.userFacilityList === undefined ||
          this.userFacilityList.length < 1
        ) {
          this.userFacilityList = [
            {
              org_id: this.question.organization,
              org_name: this.multiorg,
              fac_id: this.question.fac,
              fac_name: this.multifacility,
              // 'fac_address1':this.fac_address1,
              // 'fac_address2':this.fac_address2,
              // 'fac_city':this.fac_city,
              // 'fac_state':this.fac_state,
              // 'fac_zip1':this.fac_zip1,
              // 'fac_zip2':this.fac_zip2,
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
              this.duplicateFacility = true;
              this.toastr.error('Facility already added');
            }
          } else {
            this.userFacilityList.push({
              org_id: this.question.organization,
              org_name: this.multiorg,
              fac_id: this.question.fac,
              fac_name: this.multifacility,
              // 'fac_address1':this.fac_address1,
              // 'fac_address2':this.fac_address2,
              // 'fac_city':this.fac_city,
              // 'fac_state':this.fac_state,
              // 'fac_zip1':this.fac_zip1,
              // 'fac_zip2':this.fac_zip2,
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
        // io-1181 below code commented
        // if(this.isEdit == true){
        //     this.question['organization'] = '';
        //     this.faclist = [];
        // }
        // this.question['fac'] = '';
        // await this.userOrganization()
        // await this.userFacility()
      }
      // this.question.fac = ''; //io-1181
      // console.log(this.userFacilityList);
    }
    this.removeAddedFac();
  }

  async onRemoveFac(i) {
    if (i != undefined && i != null) {
      this.addfacIn(i);
      this.userFacilityList.splice(i, 1);
      this.question.facility.splice(i, 1);
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
    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z.fac_id == e._id) == -1
    );
    this.orgFacSelection(); // io-1181
  }

  async addfacIn(i) {
    if (this.question.organization) {
      await this.changeOrg(this.question.organization);
    }
    this.facDisable = false;
    this.question.fac = '';
    // this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id}) //io-1181
  }

  orgFacSelection() {
    if (this.organiz.length == 1 && this.faclist.length == 1) {
      // organization manage
      this.orgDisable = true;
      this.question.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = true;
      this.question.fac = this.faclist[0]['_id'];
      this.multifacility = this.faclist[0]['fac_name'];
    } else if (this.organiz.length == 1 && this.faclist.length > 1) {
      // organization manage
      this.orgDisable = true;
      this.question.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.question.fac = '';
    } else if (this.organiz.length > 1) {
      // organization manage
      this.orgDisable = false;
      // this.announcement.organization = ''
      // this.multiorg = this.organiz[0]['org_name']

      // facility manage
      this.facDisable = false;
      this.question.fac = '';
      this.multifacility =
        this.faclist && this.faclist.length && this.faclist[0]['fac_name']
          ? this.faclist[0]['fac_name']
          : '';
    } else if (this.organiz.length == 1 && this.faclist.length == 0) {
      // organization manage
      this.orgDisable = true;
      this.question.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.question.fac = '';
      //  this.multifacility=this.faclist[0]['fac_name']
    } else {
      // organization manage
      this.orgDisable = false;
      this.question.organization = '';
      // facility manage
      this.facDisable = false;
      this.question.fac = '';
    }
  }
}
