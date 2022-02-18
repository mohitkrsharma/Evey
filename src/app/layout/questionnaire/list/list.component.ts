import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  TemplateRef,
  Input,
  Renderer2,
  OnDestroy,
} from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent } from '@angular/material';
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
import { MatOption } from '@angular/material';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from 'rxjs/operators';
// import { bypassSanitizationTrustResourceUrl } from '@angular/core/src/sanitization/bypass';
import { MatTable } from '@angular/material/table';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDragHandle,
  copyArrayItem,
  CdkDragEnter,
} from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SearchFilterBYPipe } from './../../../shared/services/search-filter-by.pipe';
import { StringFilterByPipe } from '../../../shared/pipes/string-filterdata';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { SocketService } from 'src/app/shared/services/socket/socket.service';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy {
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
    private _socketService: SocketService
  ) {
    this.createPropertyForm();
  }
  @ViewChild('table', {static: true}) table: MatTable<any>;
  @ViewChild('addQuestion', {static: true}) addQuestion: TemplateRef<any>;
  @ViewChild('addQuestionner', {static: true}) addQuestionner: TemplateRef<any>;
  @ViewChild('questionnerCopy', {static: true}) questionnerCopy: TemplateRef<any>;
  @ViewChild('questionPreview', {static: true}) questionPreview: TemplateRef<any>;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  // @ViewChild('renderer') private renderer: ElementRef;
  @Input()
  matchSize = true;
  public btnAction: Function;

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
  questionSearch = '';
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organiz;
  allFacList;
  floorlist;
  faclist;
  tempFaclist;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  sortActive = 'order';
  sortDirection: 'asc' | 'desc' | '';
  count;
  actualDataCount;
  search: any;
  filteredType: Observable<any[]>;
  filteredQuestionType: Observable<any[]>;
  isAdding: Boolean = true;
  suspendDays: any;
  width_strip: any = 100;
  ww: any = 237;
  vendor_questions: any = [];
  visitor_questions: any = [];
  employee_questions: any = [];
  general_questions: any = [];
  virus_questions: any = [];
  dragged_question: any = '';
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'question',
      value: 'Question',
      sort: false,
    },
    {
      id: 'type',
      value: 'Type',
      sort: false,
    },
  ];

  exportdata;
  pagiPayload = {
    moduleName: 'questionList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
  };
  onDrag = false;
  public show = false;
  // @HostListener('window:scroll')

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
  isEdit = false;
  isOptionField: boolean;

  public group: any = [
    { type: 'visitor', name: 'Visitor' },
    { type: 'employee', name: 'Employee' },
    { type: 'vendor', name: 'Vendor' },
    { type: 'resident', name: 'Resident' },
  ];
  question: any = {
    // is_visitor: '',
    group: '',
    type: '',
    question: '',
    field_label: this.fb.array([this.setInputType()]),
  };
  questionForm: FormGroup;
  questionnerForm: FormGroup;
  questionnerCopyName = new FormControl('');
  public temparray: any = [];
  public tempFacArray: any = [];
  editId: any = null;
  btnClass: string;
  questionnaireColumn: string[] = [
    'checkbox',
    'name',
    'access',
    'status',
    'date_modified',
    'platform',
    'action',
  ];
  questionnaireData = [];
  questionsDetail = {};
  copyQesSelected = false;
  private subscription: Subscription;
  organization;
  facility;
  selectedOrgDetails;
  preview = false;
  previewArr = [];
  questionnerDataCopy;
  addQues = true;
  showQues = false;
  oldName;
  platforms: string[] = ['iPhone', 'iPad', 'iPad Mini', 'Evey.io'];
  questionnaireStatus = false;
  selctedPlatforms: any[] = [];

  // new
  orgFacData: any[] = [];
  duplicateFacility;
  multifacility: any;
  multiorg: any;
  fac_address1: any;
  fac_address2: any;
  fac_city: any;
  fac_state: any;
  fac_zip1: any;
  fac_zip2: any;
  org;
  fac;
  ismultifac: Boolean = false;
  showfaclist: boolean;
  showNew = true;
  userFacilityList = [];
  orgSearch = '';
  facSearch = '';
  user: any = {
    org_name: '',
    org_id: '',
    fac: '',
    fac_name: '',
    name: '',
  };
  private questionnareSubscription: Subscription;
  privilege = 'add';
  tempUserFacilityList = [];

  checkScroll() {
    // window의 scroll top
    // tslint:disable-next-line:max-line-length
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
    if (!this._commonService.checkAllPrivilege('Questionnaires')) {
      this.router.navigate(['/']);
    }

    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        this.selectedOrgDetails = contentVal;
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
        await this.userFacility();
        await this.userOrganization();
      }
    );

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.questionList) {
        this.pagiPayload = pageListing.questionList;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ questionList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ questionList: this.pagiPayload })
      );
    }
    this._commonService.payloadSetup('questionList', this.pagiPayload);
    this.search = this.searchInput.nativeElement.value;
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => this.getServerData(this.pagiPayload))
      )
      .subscribe();
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(['position']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    // this.displayedColumns = this.displayedColumns.concat(['is_visitor']);
    // this.displayedColumns = this.displayedColumns.concat(['']);
    this.displayedColumns = this.displayedColumns.concat(['change_status']);

    this.displayedColumns = this.displayedColumns.concat(['actions']);
    // Pagination
    await this.getServerData(this.pagiPayload);
    await this.getData();
    await this.getAllFacList();
    // await this.getQuestions('');
    this.questionnareSubscription = this._socketService.updateQuestionnareDataGroupWiseFn().subscribe(async (_response: any) => {
      await this.getQuestionsDataFunction();
    });

    this.questionnareSubscription = this._socketService.addQuestionnareDataGroupWiseFn().subscribe(async (_response: any) => {
      await this.getQuestionsDataFunction();
    });
  }

  selectAll() {
    if (this.checked === true) {
      this.questionnaireData.forEach((element) => {
        element.checked = false;
        this.deleteArr = [];
      });
    } else {
      this.questionnaireData.forEach((element) => {
        this.deleteArr.push(element.name);
        element.checked = true;
      });
    }
  }

  selectElement(name, check) {
    if (check === true) {
      for (let i = 0; i < this.deleteArr.length; i++) {
        if (this.deleteArr[i] === name) {
          this.deleteArr.splice(i, 1);
        }
      }
    } else if (check === undefined || check === false) {
      this.deleteArr.push(name);
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
      this.toastr.error('Please select question to be delete');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'questions',
          id: this.deleteArr,
          API: 'questions/delete',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.data.forEach(
            (element) => (element.checked = this.checked = false)
          );
          this.deleteArr = [];
        } else {
          if (result['status']) {
            this.toastr.success(result['message']);
          }
          this.checked = false;
          this.getServerData(this.pagiPayload);
          this.getQuestions('');
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
  }

  ngOnDestroy() {
    this.questionnareSubscription.unsubscribe();
  }

  deleteQuestion(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'questions',
        id: this.deleteItem,
        API: 'questions/delete',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result !== false) {
        if (result['status']) {
          this.toastr.success(result['message']);
        }
        this.getServerData(this.pagiPayload);
        this.getQuestions('');
        this.checked = false;
      }
    });
  }

  public async getQuestionsDataFunction() {
    await this.apiService
      .apiFn(
        { type: 'POST', target: 'questions/questions_group_admin' },
        this.pagiPayload
      )
      .then(async (result: any) => {
        this.count = result['data'];
        if (result['status']) {
          const questionnaireArr = [];
          let platformArr = [];
          // tslint:disable-next-line:forin
          for (const element in result['data']) {
            await result['data'][element].forEach((el) => {
              if (el.platforms && el.platforms.length) {
                platformArr.push(el.platforms);
                result['data'][element]['platformData'] = platformArr;
              }
            });
            platformArr = [];
          }
          // console.log('result data---->', result['data']);
          // tslint:disable-next-line:forin
          for (const el in result['data']) {
            questionnaireArr.push({
              name: el,
              status: result['data'][el][0]['group_status']
                ? result['data'][el][0]['group_status']
                : false,
              access: result['data'][el][0]['access'] ? 'Private' : 'Public',
              date_modified: result['data'][el][0]['date_modified']
                ? result['data'][el][0]['date_modified']
                : null,
              platform: result['data'][el][0]['platforms']
                ? result['data'][el][0]['platforms']
                : '',
              platformData: result['data'][el]['platformData']
                ? result['data'][el]['platformData']
                : '',
              data: result['data'][el],
              facility: result['data'][el][0]['facility'],
            });
          }
          this.questionnaireData = questionnaireArr;
          // console.log('this.questionnaireData---->', this.questionnaireData);
          this.actualDataCount = this.questionnaireData.length;
          this.data = questionnaireArr;
          if (this.data && this.data.length > 0) {
            this.actualDataCount = this.data.length;
          }
          this.createTable(this.questionnaireData);
          this._commonService.setLoader(false);
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
    this._commonService.setLoader(false);
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
      JSON.stringify({ questionList: this.pagiPayload })
    );
    this.getQuestionsDataFunction();
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
    this._commonService.updatePayload(event, 'questionList', this.pagiPayload);
    this.getQuestionsDataFunction();
  }

  get optionsPoints() {
    return this.questionForm.get('options') as FormArray;
  }

  get suspendPoints() {
    return this.questionForm.get('suspend') as FormArray;
  }
  createPropertyForm() {
    this.questionForm = this.fb.group({
      _id: [null, []],
      // is_visitor: ['', []],
      group: ['', [Validators.required]],
      type: ['', [Validators.required]],
      question: ['', [Validators.required]],
      options: this.fb.array([this.setInputType()]),
      // suspend:this.fb.array([
      //   this.setSuspendType()
      // ]),
      searchCtrl: new FormControl(),
      searchCtrlForType: new FormControl(),
    });

    this.questionnerForm = this.fb.group({
      name: ['', [Validators.required]],
      facilities: this.fb.array([this.setFacInputType()]),
      searchCtrl: new FormControl(),
    });
    // this.tempFacArray = <FormArray>this.questionnerForm.controls['facilities'];
  }

  /* Add multiple input to the form */
  setInputType() {
    return this.fb.group({
      label: ['', []],
      suspend_days: ['', []],
      next_question: ['', []],
    });
  }
  // setSuspendType(){
  //   return this.fb.group({
  //     suspend_days:['',[]]
  //   })
  // }

  /* Add option for Radio, Dropdown and Multi Checkboxes */
  addOption() {
    this.temparray = <FormArray>this.questionForm.controls['options'];
    this.temparray.push(this.setInputType());
  }

  setFacInputType() {
    return this.fb.group({
      organization: new FormControl({
        value: this.organization,
        disabled: true,
      }),
      facility: ['', []],
    });
  }

  addfacility() {
    if (!this.showNew) {
      this.showNew = true;
      return;
    }
    // this.tempFacArray = <FormArray>this.questionnerForm.controls['facilities'];
    // this.tempFacArray.push(this.setFacInputType());
    // this.tempFacArray.value = this.tempFacArray.value.reverse();
    // console.log('this.tempFacArray---->', this.tempFacArray.value);
  }

  closeQuestionnerDialog(): void {
    this.tempUserFacilityList.filter((item, index) => {
      if (item.type == 'remove') {
        this.userFacilityList.push(item.data);
      } else if (item.type == 'add') {
        const removeIndex = this.userFacilityList.findIndex(
          (z) => z.fac == item.data.fac
        );
        if (removeIndex != null) {
          this.userFacilityList.splice(removeIndex, 1);
        }
      }
    });
    this.dialogRefs.close();
    this.user.org = '';
    this.user.fac = '';
    this.tempUserFacilityList = [];
    this.questionnerForm.reset();
    // this.userFacilityList = this.tempFacArray;
    this.userFacilityList = this.userFacilityList.filter(
      (e) => this.tempFacArray.findIndex((z) => z.fac == e.fac) == -1
    );
    // this.tempFacArray = <FormArray>this.questionnerForm.controls['facilities'];
    // for (let i = this.tempFacArray.length - 1; i >= 2; i--) {
    //   this.tempFacArray.removeAt(i);
    // }
  }

  selectedFac(value) {
    // this.faclist = this.userFacilityList.filter(item => {
    //   return item._id.toString() !== value._id;
    // });
    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z._id == e._id) == -1
    );
  }

  async addNewQuestionnareFn() {
    this.tempUserFacilityList = [];
    this.userFacilityList.forEach((element) => {
      const facName = this.allFacList.find(
        (item) => item.fac_id.toString() === element.fac
      ).fac_name;
      const orgName = this.allFacList.find(
        (item) => item.org_id.toString() === element.org
      ).org_name;
      element['fac_name'] = facName;
      element['org_name'] = orgName;
    });
    this.questionnerForm.controls['name'].setValue(this.user.name);
    await this.saveQuestionner();
  }

  async saveQuestionner() {
    // this.questionnerForm.enable();
    if (this.questionnerForm.valid) {
      this._commonService.setLoader(true);
      // const facilityData = this.filterFacility(
      //   this.questionnerForm.controls.facilities.value
      // );
      if (this.userFacilityList && this.userFacilityList.length < 1) {
        this._commonService.setLoader(false);
        this.toastr.error('Please select org and facility');
        return;
      }
      this.questionnerForm.controls['name'].setValue(this.user.name);
      const facilityData = this.userFacilityList;
      // console.log('this.addQues---->', this.addQues);
      const data = {
        group: this.addQues
          ? this.questionnerForm.controls.name.value
          : this.oldName,
        facility: facilityData,
        platforms: this.selctedPlatforms,
        access: { access: this.questionnaireStatus },
        group_status: true,
      };
      if (!this.addQues) {
        data['newName'] = this.questionnerForm.controls.name.value;
        // data['newName'] = this.user.name;
      }
      // console.log('saveQuestionner data---->', JSON.stringify(data));
      this.tempUserFacilityList = [];
      await this.postQuestionner(data);
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  get facilitiesPoints() {
    return this.questionnerForm.get('facilities') as FormArray;
  }

  removefacility(key) {
    // this.tempFacArray = <FormArray>this.questionnerForm.controls['facilities'];
    // this.tempFacArray.removeAt(key);
  }

  oldFacilities(index) {
    if (index == 0) {
      return 'add';
    } else if (index > 0) {
      return 'minus';
    } else {
      return 'none';
    }
  }

  /* Remove option for Radio, Dropdown and Multi Checkboxes */
  removeOption(key) {
    this.temparray = <FormArray>this.questionForm.controls['options'];
    this.temparray.removeAt(key);
  }

  addquestion() {
    this.router.navigate(['/createAQuestionnaire/form']);
    // const dialogConfig = new MatDialogConfig();
    // dialogConfig.maxWidth = '1000px';
    // dialogConfig.panelClass = 'repeatDialog';
    // //dialogConfig.disableClose = true;
    // dialogConfig.closeOnNavigation = true;
    // this.dialogRefs = this.dialog.open(this.addQuestion, dialogConfig);
  }

  addQuestionnaire() {
    this.user = {};
    this.userFacilityList = [];
    this.selctedPlatforms = [];
    this.addQues = true;
    this.privilege = 'add';
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '550px';
    dialogConfig.panelClass = 'repeatDialog';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addQuestionner, dialogConfig);
  }

  closeQuestionDialog(): void {
    this.isAdding = true;
    this.dialogRefs.close();
    this.isEdit = false;
    this.isOptionField = false;
    this.questionForm.reset();
    this.temparray = <FormArray>this.questionForm.controls['options'];
    this.temparray = <FormArray>this.questionForm.controls['options'];
    for (let i = this.temparray.length - 1; i >= 2; i--) {
      this.temparray.removeAt(i);
    }
  }

  getFieldType(event = '') {
    if (
      this.question.type === 'radio' ||
      this.question.type === 'select' ||
      this.question.type === 'checkbox'
    ) {
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
  checkAllwoNum(key) {
    const result = this._commonService.allwoNum(key);
    return result;
  }
  oldOptions(index) {
    if (index + 1 == this.temparray.length) {
      return 'add';
    } else if (index > 0) {
      return 'minus';
    } else {
      return 'none';
    }
  }

  async previousWindow() {
    this.isAdding = !this.isAdding;
    this.questionForm.enable();
  }

  async nextPage() {
    if (this.questionForm.valid) {
      this.isAdding = !this.isAdding;
      this.questionForm.disable();
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
  async saveQuestionDialog(report, isValid) {
    this.questionForm.enable();
    // return
    if (this.questionForm.valid) {
      this._commonService.setLoader(true);
      // console.log(this.questionForm.controls.is_visitor.value);
      const data = {
        _id: this.questionForm.controls._id.value,
        // 'is_visitor': this.questionForm.controls.is_visitor.value,
        group: this.questionForm.controls.group.value,
        type: this.questionForm.controls.type.value,
        question: this.questionForm.controls.question.value,
        options: this.isOptionField
          ? this.questionForm.controls.options.value
          : [],
      };
      // return
      await this.apiService
        .apiFn({ type: 'POST', target: 'questions/add' }, data)
        .then((result: any) => {
          if (result['data']['status']) {
            this.toastr.success(result['message']);
            this.closeQuestionDialog();
            this.getServerData(this.pagiPayload);
            this._commonService.setLoader(true);
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
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  async editQuestion(questionId) {
    this.router.navigate([
      '/createAQuestionnaire/edit',
      this._aes256Service.encFnWithsalt(questionId),
    ]);

    // this.isEdit = true;
    // this._commonService.setLoader(true);
    // const action = {
    //   type: 'POST', target: 'questions/view'
    // };
    // const payload = { questionId: questionId };
    // let result = await this.apiService.apiFn(action, payload)
    // this.question = result['data']['_question'];
    // this._commonService.setLoader(false);
    // this.temparray = <FormArray>this.questionForm.controls['options'];

    // if (this.question.options.length > 1) {
    //   this.question.options.forEach((element, ind) => {
    //     if (ind >= this.temparray.length) {
    //       this.addOption();
    //     }

    //   });
    // }
    // this.questionForm.patchValue(this.question);
    // this.getFieldType();
    // this.addquestion();
  }

  dropTable(event: CdkDragDrop<[]>) {
    const prevIndex = this.dataSource.filteredData.findIndex(
      (d) => d === event.item.data
    );
    const arr = {
      _id: event.item.data._id,
      previous_order:
        prevIndex + 1 + this.pagiPayload.pageIndex * this.pagiPayload.pageSize,
      current_order:
        event.currentIndex +
        1 +
        this.pagiPayload.pageIndex * this.pagiPayload.pageSize,
    };
    if (prevIndex !== event.currentIndex) {
      this.exchangeOrder(arr);
    }

    moveItemInArray(
      this.dataSource.filteredData,
      prevIndex,
      event.currentIndex
    );
    this.table.renderRows();
  }

  async exchangeOrder(arr) {
    const data = {
      _id: arr._id,
      previous_order: arr.previous_order,
      current_order: arr.current_order,
    };
    await this.apiService
      .apiFn({ type: 'POST', target: 'questions/exchangeOrder' }, data)
      .then((result) => {
        //
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }
  async exchangeOrderNew(arr) {
    const data = {
      _id: arr._id,
      previous_order: arr.previous_order,
      current_order: arr.current_order,
      group: arr.group,
    };
    await this.apiService.apiFn(
      { type: 'POST', target: 'questions/exchangeOrderNew' },
      data
    );
  }
  async changeStatus(event, name) {
    await this.apiService
      .apiFn(
        { type: 'POST', target: 'questionnaire/changeStatus' },
        { status: event.checked, group: name, fac_id: this.facility._id }
      )
      .then(async (result) => {
        await this.getQuestionsDataFunction();
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }

  async changeVsitor(event, question_id) {
    await this.apiService
      .apiFn(
        { type: 'POST', target: 'questions/changeVisitor' },
        { is_visitor: event.checked, questionId: question_id }
      )
      .then((result: any) => {})
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
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

  async previewQuestion(id) {
    this._commonService.setLoader(true);
    await this.apiService
      .apiFn({ type: 'POST', target: 'questions/view' }, { questionId: id })
      .then((result: any) => {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.maxWidth = '1000px';
        dialogConfig.panelClass = 'repeatDialog';
        // dialogConfig.disableClose = true;
        dialogConfig.closeOnNavigation = true;
        this.dialogRefs = this.dialog.open(this.questionPreview, dialogConfig);
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
    this._commonService.setLoader(false);
  }

  closePreviewDialog() {
    this.dialogRefs.close();
  }

  async getQuestions(index) {
    this._commonService.setLoader(true);
    this.questionnaireData = [];
    await this.apiService
      .apiFn({ type: 'POST', target: 'questions/questions_group_admin' }, {})
      .then(async (result: any) => {
        const data = result['data'];
        const questionnaireArr = [];
        let platformArr = [];
        // tslint:disable-next-line:forin
        for (const element in result['data']) {
          await result['data'][element].forEach((el) => {
            if (el.platforms && el.platforms.length) {
              platformArr.push(el.platforms);
              result['data'][element]['platformData'] = platformArr;
            }
          });
          platformArr = [];
        }
        // tslint:disable-next-line:forin
        for (const el in result['data']) {
          questionnaireArr.push({
            name: el,
            status: result['data'][el][0]['group_status']
              ? result['data'][el][0]['group_status']
              : false,
            access: result['data'][el][0]['access'] ? 'Private' : 'Public',
            date_modified: result['data'][el][0]['date_modified']
              ? result['data'][el][0]['date_modified']
              : null,
            platform: result['data'][el][0]['platforms']
              ? result['data'][el][0]['platforms']
              : '',
            platformData: result['data'][el]['platformData']
              ? result['data'][el]['platformData']
              : '',
            data: result['data'][el],
            facility: result['data'][el][0]['facility'],
          });
        }
        this.questionnaireData = questionnaireArr;
        this.actualDataCount = this.questionnaireData.length;
        this.createTable(this.questionnaireData);
        if (data.vendor) {
          this.vendor_questions = data.vendor.map((que) => {
            return {
              ...que,
              _id: que['_id'],
              question: que.question,
              order: que.order,
              options: que.options,
            };
          });
        } else {
          this.vendor_questions = [];
        }

        if (data.visitor) {
          this.visitor_questions = data.visitor.map((que) => {
            return {
              ...que,
              _id: que['_id'],
              question: que.question,
              order: que.order,
              options: que.options,
            };
          });
        } else {
          this.visitor_questions = [];
        }

        if (data.employee) {
          this.employee_questions = data.employee.map((que) => {
            return {
              ...que,
              _id: que['_id'],
              question: que.question,
              order: que.order,
              options: que.options,
            };
          });
        } else {
          this.employee_questions = [];
        }

        if (data.general) {
          this.general_questions = data.general.map((que) => {
            return {
              ...que,
              _id: que['_id'],
              question: que.question,
              order: que.order,
              options: que.options,
            };
          });
        } else {
          this.general_questions = [];
        }

        if (data.virus) {
          this.virus_questions = data.virus.map((que) => {
            return {
              ...que,
              _id: que['_id'],
              question: que.question,
              order: que.order,
              options: que.options,
            };
          });
        } else {
          this.virus_questions = [];
        }

        this.width_strip =
          this.vendor_questions.length + 1 < 5
            ? 100
            : (this.vendor_questions.length + 1) * 27;
        if (index != '') {
          this.groupChange({ index });
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
    this._commonService.setLoader(false);
  }

  async drop_vendor(event: CdkDragDrop<string[]>, index) {
    if (event.previousContainer === event.container) {
      const prevIndex = this.vendor_questions.findIndex(
        (d) => d === event.item.data
      );
      const arr = {
        _id: event.item.data._id,
        previous_order: prevIndex + 1,
        current_order: event.currentIndex + 1,
        group: 'vendor',
      };
      if (prevIndex !== event.currentIndex) {
        await this.exchangeOrderNew(arr);
      }
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const preQuestion = this.dataSource.filteredData.find(
        (d) => d === event.item.data
      );
      const arr = {
        question_id: preQuestion._id,
        currentIndex: event.currentIndex + 1,
        group: 'vendor',
      };
      await this.assignQuestion(arr);
    }
    this.getQuestions(index);
  }
  async drop_visitor(event: CdkDragDrop<string[]>, index) {
    if (event.previousContainer === event.container) {
      const prevIndex = this.visitor_questions.findIndex(
        (d) => d === event.item.data
      );
      const arr = {
        _id: event.item.data._id,
        previous_order: prevIndex + 1,
        current_order: event.currentIndex + 1,
        group: 'visitor',
      };
      if (prevIndex !== event.currentIndex) {
        await this.exchangeOrderNew(arr);
      }
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const preQuestion = this.dataSource.filteredData.find(
        (d) => d === event.item.data
      );
      const arr = {
        question_id: preQuestion._id,
        currentIndex: event.currentIndex + 1,
        group: 'visitor',
      };
      await this.assignQuestion(arr);
    }
    this.getQuestions(index);
  }
  async drop_employee(event: CdkDragDrop<string[]>, index) {
    if (event.previousContainer === event.container) {
      const prevIndex = this.employee_questions.findIndex(
        (d) => d === event.item.data
      );
      const arr = {
        _id: event.item.data._id,
        previous_order: prevIndex + 1,
        current_order: event.currentIndex + 1,
        group: 'employee',
      };
      if (prevIndex !== event.currentIndex) {
        await this.exchangeOrderNew(arr);
      }
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const preQuestion = this.dataSource.filteredData.find(
        (d) => d === event.item.data
      );
      const arr = {
        question_id: preQuestion._id,
        currentIndex: event.currentIndex + 1,
        group: 'employee',
      };
      await this.assignQuestion(arr);
    }
    this.getQuestions(index);
  }

  async drop_general(event: CdkDragDrop<string[]>, index) {
    if (event.previousContainer === event.container) {
      const prevIndex = this.general_questions.findIndex(
        (d) => d === event.item.data
      );
      const arr = {
        _id: event.item.data._id,
        previous_order: prevIndex + 1,
        current_order: event.currentIndex + 1,
        group: 'general',
      };
      if (prevIndex !== event.currentIndex) {
        await this.exchangeOrderNew(arr);
      }
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const preQuestion = this.dataSource.filteredData.find(
        (d) => d === event.item.data
      );
      const arr = {
        question_id: preQuestion._id,
        currentIndex: event.currentIndex + 1,
        group: 'general',
      };
      await this.assignQuestion(arr);
    }
    this.getQuestions(index);
  }

  async drop_virus(event: CdkDragDrop<string[]>, index) {
    if (event.previousContainer === event.container) {
      const prevIndex = this.virus_questions.findIndex(
        (d) => d === event.item.data
      );
      const arr = {
        _id: event.item.data._id,
        previous_order: prevIndex + 1,
        current_order: event.currentIndex + 1,
        group: 'virus',
      };
      if (prevIndex !== event.currentIndex) {
        await this.exchangeOrderNew(arr);
      }
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const preQuestion = this.dataSource.filteredData.find(
        (d) => d === event.item.data
      );
      const arr = {
        question_id: preQuestion._id,
        currentIndex: event.currentIndex + 1,
        group: 'virus',
      };
      await this.assignQuestion(arr);
    }
    this.getQuestions(index);
  }

  async assignQuestion(arr) {
    await this.apiService
      .apiFn({ type: 'POST', target: 'questions/assign_question' }, arr)
      .then((result: any) => {
        if (!result['status']) {
          this.toastr.error(result.message);
        } else {
          return result;
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }

  groupChange($event) {
    // this.width_strip = Math.ceil(((this.vendor_questions.length + 1) / 4)) * 100
    // this.width_strip = (this.general_questions.length+1)*27

    const group = $event.index;
    switch (group) {
      case 0:
        this.width_strip =
          this.vendor_questions.length + 1 < 5
            ? 100
            : (this.vendor_questions.length + 1) * 27;
        break;

      case 1:
        this.width_strip =
          this.visitor_questions.length + 1 < 5
            ? 100
            : (this.visitor_questions.length + 1) * 27;
        break;

      case 2:
        this.width_strip =
          this.employee_questions.length + 1 < 5
            ? 100
            : (this.employee_questions.length + 1) * 27;
        break;

      case 3:
        this.width_strip =
          this.general_questions.length + 1 < 5
            ? 100
            : (this.general_questions.length + 1) * 27;
        break;

      case 4:
        this.width_strip =
          this.virus_questions.length + 1 < 5
            ? 100
            : (this.virus_questions.length + 1) * 27;
        break;

      default:
        break;
    }
  }

  async unassignQuestion(question, index) {
    await this.apiService
      .apiFn({ type: 'DELETE', target: 'questions/unassign' }, question)
      .then((result: any) => {})
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
    this.getQuestions(index);
  }
  dragStart(event) {
    const question = event.source.data.question;
    this.dragged_question = question;
  }
  dragin(e) {
    this.onDrag = true;
  }
  dragout(e) {
    this.onDrag = false;
  }

  questionnaireClick(element) {
    if (!this._commonService.checkPrivilegeModule('questionnaires', 'edit')) {
      return false;
    }
    this.router.navigate(['createAQuestionnaire/view/' + element.name]);
    this.showQues = true;
    this.questionsDetail['name'] = element.name;
    this.dataSource = element.data;
    this.questionsDetail['data'] = element.data.map((que) => {
      return {
        ...que,
        _id: que['_id'],
        question: que.question,
        order: que.order,
        options: que.options,
      };
    });
  }

  async userFacility() {
    await this.apiService
      .apiFn(
        { type: 'GET', target: 'users/get_user_fac' },
        { org: this.organization }
      )
      .then(async (result: any) => {
        this.faclist = await result['data'].map((obj) => {
          return { fac_name: obj._id.fac.fac_name, _id: obj._id.fac._id };
        });
        this.tempFaclist = this.faclist;
        // console.log('this.tempFaclist----->', this.tempFaclist);
        for (var i = 0; i < this.faclist.length; i++) {
          if (this.selectedOrgDetails.fac == this.faclist[i]._id) {
            this.facility = this.faclist[i];
          }
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }

  // async userOrganization(){
  //   await this.apiService.apiFn({ type: 'GET', target: 'users/get_org' }, {})
  //   .then(async (result: any) => {
  //     this.organiz  = await result['data'].map(obj => {
  //         return {
  //           'org_name': obj._id.org.org_name,
  //           '_id': obj._id.org._id
  //         }
  //     });
  //     for (var i = 0; i < this.organiz.length; i++) {
  //       if(this.selectedOrgDetails.org == this.organiz[i]._id) this.organization = this.organiz[i];
  //     }
  //   })
  // }

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
    // console.log('this.organiz----->', this.organiz);
    for (var i = 0; i < this.organiz.length; i++) {
      // tslint:disable-next-line:triple-equals
      if (this.selectedOrgDetails.org == this.organiz[i]._id) {
        this.organization = this.organiz[i];
        // this.user.organization = this.organization.org_name;
        // this.user.organization_id = this.organization._id;
      }
    }
  }

  async getAllFacList() {
    const action = { type: 'GET', target: 'facility/getallfacilities' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.allFacList = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['fac_name'] = obj.fac_name;
      rObj['fac_id'] = obj._id;
      rObj['org_name'] = obj.org.org_name;
      rObj['org_id'] = obj.org._id;
      return rObj;
    });
    // console.log('this.organiz----->', this.allFacList);
  }

  filterFacility(facility) {
    let temp = [];
    facility.map((el) =>
      temp.push({ fac: el.facility._id, org: this.organization._id })
    );
    return temp;
  }

  copyQuestionner(data) {
    this.questionnerDataCopy = data;
    // console.log('this.questionnerDataCopy---->', this.questionnerDataCopy);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '550px';
    dialogConfig.panelClass = 'repeatDialog';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.questionnerCopy, dialogConfig);
  }

  closeQuestionnerCopyDialog() {
    this.dialogRefs.close();
  }

  async saveQuestionnerCopy() {
    this.questionnerForm.enable();
    if (this.questionnerCopyName.valid) {
      this._commonService.setLoader(true);
      // this.filterFacility(this.questionnerDataCopy.facility);
      const data = {
        group: this.questionnerCopyName.value,
        facility: this.questionnerDataCopy.facility
          ? this.questionnerDataCopy.facility
          : null,
        platforms: this.questionnerDataCopy.platform
          ? this.questionnerDataCopy.platform
          : null,
        access: this.questionnerDataCopy.access
          ? { access: this.questionnerDataCopy.access }
          : false,
        group_status: true,
      };
      // console.log('saveQuestionnerCopy data---->', JSON.stringify(data));
      await this.postQuestionner(data);
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  async postQuestionner(data) {
    await this.apiService
      .apiFn({ type: 'POST', target: 'questionnaire/questionnerAdd' }, data)
      .then(async (result: any) => {
        // console.log('result---->', result);
        if (result['status']) {
          // await this.getQuestions('');
          await this.getQuestionsDataFunction();
          this.questionnerForm.reset();
          this.questionnerCopyName.reset();
          this.setFacInputType();
          this._commonService.setLoader(false);
          this.dialogRefs.close();
          if ((this.addQues = false)) {
            this.toastr.success('Questionnaier updated successfully.');
          } else {
            this.toastr.success(result['message']);
          }
        } else {
          this._commonService.setLoader(false);
          this.toastr.error(result['message']);
        }
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this.toastr.error(error.message ? error.message : 'Some error occured');
      });
  }

  editQuestionner(data) {
    // console.log('data---->', data);
    // console.log('data---->', data.platformData);
    // console.log('data---->', data.platformData[0]);
    // console.log('data---->', data.facility);
    // console.log('this.tempFaclist---->', this.tempFaclist);
    if (data && data.facility) {
      data.facility.forEach((element) => {
        // const orgName = this.organiz.find(item => item._id.toString() === element.org).org_name;
        // tslint:disable-next-line:max-line-length
        // const facName = this.allFacList.find(item => item._id.toString() === element.fac) ? this.tempFaclist.find(item => item._id.toString() === element.fac).fac_name : '';
        // tslint:disable-next-line:max-line-length
        const facName = this.allFacList.find(
          (item) => item.fac_id.toString() === element.fac
        ).fac_name;
        const orgName = this.allFacList.find(
          (item) => item.org_id.toString() === element.org
        ).org_name;
        // console.log('facName---->', facName);
        element['fac_name'] = facName;
        element['org_name'] = orgName;
      });
      this.userFacilityList = data.facility;
    }

    // this.tempFacArray = this.userFacilityList;
    // console.log('this.userFacilityList---->', this.userFacilityList);
    this.addQues = false;
    this.privilege = 'edit';
    this.oldName = data.name;
    this.questionnerForm.controls['name'].setValue(data.name);
    this.user['name'] = data.name;
    this.questionnerDataCopy = data;
    if (data.platformData && data.platformData[0].length > 0) {
      this.selctedPlatforms = data.platformData[0];
    } else {
      this.selctedPlatforms = [];
    }
    // console.log('this.selctedPlatforms--->', this.selctedPlatforms);
    this.questionnaireStatus = data.group_status;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '550px';
    dialogConfig.panelClass = 'repeatDialog';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addQuestionner, dialogConfig);
  }

  deleteQuestionner(data) {
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'questions',
        id: data.name,
        API: 'questionnaire/questionnerDelete',
      },
    });
    dialogRef.afterClosed().subscribe(
      async (result) => {
        await this.getQuestions('');
      },
      (error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
    );
  }

  previewQuestions() {
    this.previewArr = this.questionsDetail['data'];
    this.preview = true;
  }

  removeQuestion(index) {
    //
  }

  dragQuestion(event: CdkDragDrop<any>) {
    if (event.previousContainer.id === event.container.id) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // moveItemInArray(this.previewArr, event.previousIndex, event.currentIndex);
  }

  back() {
    this.questionsDetail = {};
  }

  platformCheck(platform) {
    if (
      this.selctedPlatforms.length &&
      this.selctedPlatforms.indexOf(platform) > -1
    ) {
      return true;
    }
    return false;
  }

  platformChange(event) {
    if (this.selctedPlatforms && this.selctedPlatforms.length) {
      const index = this.selctedPlatforms.findIndex((item) => item === event);
      if (index > -1) {
        this.selctedPlatforms.splice(index, 1);
      } else {
        this.selctedPlatforms.push(event);
      }
    } else {
      this.selctedPlatforms.push(event);
    }
    // console.log('after this.selctedPlatforms----->', this.selctedPlatforms);
  }

  deleteQuestionnaires() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select questionnaire to be delete');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'questions',
          id: this.deleteArr,
          API: 'questionnaire/questionnerDelete',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.data.forEach(
            (element) => (element.checked = this.checked = false)
          );
          this.deleteArr = [];
        } else {
          if (result['status']) this.toastr.success(result['message']);
          this.checked = false;
          this.getServerData(this.pagiPayload);
          this.getQuestions('');
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

  // new code
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

  async changeFac(fac, e) {
    this.fac = fac;
  }

  async changeOrg(org) {
    this.org = org;
    this.user.fac = '';

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

  async addFacilityList(user, isFromDone?) {
    // console.log('user---->', user);
    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      this.duplicateFacility = false;
      if ((user.org_id === '' || user.org_id === undefined) && !isFromDone) {
        this.toastr.error('Select organization');
      } else if ((user.fac === '' || user.fac === undefined) && !isFromDone) {
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
              // org_id: user.org_id,
              // org: user.org_id,
              // fac_id: user.fac,
              // fac: user.fac,
              org: user.org_id,
              org_name: this.multiorg,
              fac: user.fac,
              fac_name: this.multifacility,
            },
          ];
          this.tempUserFacilityList = [
            {
              type: 'add',
              data: {
                org: user.org_id,
                org_name: this.multiorg,
                fac: user.fac,
                fac_name: this.multifacility,
              },
            },
          ];
        } else {
          if (
            this.userFacilityList.some(
              (item) =>
                item.fac.toLowerCase().trim() ===
                  this.multifacility.toLowerCase().trim() &&
                item.org.toLowerCase().trim() ===
                  this.multiorg.toLowerCase().trim()
            )
          ) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
              this.duplicateFacility = true;
            }
          } else {
            this.tempUserFacilityList.push({
              type: 'add',
              data: {
                org: user.org_id,
                org_name: this.multiorg,
                fac: user.fac,
                fac_name: this.multifacility,
              },
            });
            this.userFacilityList.push({
              org: user.org_id,
              org_name: this.multiorg,
              fac: user.fac,
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
        this.user['org_id'] = '';
        this.user['fac'] = '';
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        this.dialogRefs.close();
      }
    }
    // this.tempFacArray = this.userFacilityList;
    // console.log('this.userFacilityList---->', this.userFacilityList);
    this.removeAddedFac();
  }

  removeAddedFac() {
    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z.fac == e._id) == -1
    );
  }

  selectedFacility(item) {
    this.faclist = this.faclist.filter(
      (e) => this.tempFaclist.findIndex((z) => z._id == e._id) == -1
    );
  }

  async onRemoveFac(i, item) {
    if (i !== undefined && i != null) {
      this.userFacilityList.splice(i, 1);
      this.tempUserFacilityList.push({ type: 'remove', data: item });
      // this.user.facility.splice(i, 1);
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
