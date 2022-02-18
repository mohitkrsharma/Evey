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
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ViewComponent implements OnInit, OnDestroy {
  @ViewChild('table', { static: true }) table: MatTable<any>;
  @ViewChild('addQuestion', { static: true }) addQuestion: TemplateRef<any>;
  @ViewChild('questionnerCopy', { static: true })
  questionnerCopy: TemplateRef<any>;
  @ViewChild('questionPreview', { static: true })
  questionPreview: TemplateRef<any>;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  @ViewChild('deleteButton', { static: true }) private deleteButton: ElementRef;
  // @ViewChild('renderer') private renderer: ElementRef;
  @Input()
  matchSize = true;
  public btnAction: Function;
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  questionSearch = '';
  dataSource = [];
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organiz;
  floorlist;
  faclist;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
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
  dragged_question: any = '';
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
  public temparray: any = [];
  editId: any = null;
  btnClass: string;
  private subscription: Subscription;
  organization;
  facility;
  selectedOrgDetails;
  questionnaire;
  selectedQuestions = [];

  noWrapSlides = false;
  showIndicator = true;
  orgLogo = '';
  private questionnareSubscription: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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

  checkScroll() {
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

    this.route.params.subscribe(
      (params) =>
        (this.questionnaire = params.questionnaire ? params.questionnaire : '')
    );

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
    this.displayedColumns = this.displayedColumns.concat(['change_status']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    // Pagination
    await this.getServerData(this.pagiPayload);
    await this.getData();
    // await this.getQuestions('');

    this.questionnareSubscription = this._socketService
      .updateQuestionnareDataGroupWiseFn()
      .subscribe(async (_response: any) => {
        await this.getQuestionsDataFunction();
      });

    this.questionnareSubscription = this._socketService
      .addQuestionnareDataGroupWiseFn()
      .subscribe(async (_response: any) => {
        await this.getQuestionsDataFunction();
      });
  }

  selectAll() {
    if (this.checked === true) {
      this.selectedQuestions = [];
      this.dataSource.forEach((element) => {
        element.checked = false;
        this.deleteArr = [];
      });
    } else {
      this.selectedQuestions = this.data;
      this.dataSource.forEach((element) => {
        this.deleteArr.push(element._id);
        element.checked = true;
      });
    }
  }

  selectElement(id, check, element) {
    if (check === true) {
      const index = this.selectedQuestions.findIndex(
        (el) => el['_id'] == element['_id']
      );
      this.selectedQuestions.splice(index, 1);
      for (let i = 0; i < this.deleteArr.length; i++) {
        if (this.deleteArr[i] === id) {
          this.deleteArr.splice(i, 1);
        }
      }
    } else if (check === undefined || check === false) {
      this.selectedQuestions.push(element);
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
      this.toastr.error('Please select question to be delete');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'questions',
          id: this.deleteArr,
          API: 'questionnaire/deleteById',
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
    // this.dataSource = new MatTableDataSource(tableArr);
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
        API: 'questionnaire/deleteById',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result != false) {
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
    this.pagiPayload['group'] = this.questionnaire;
    await this.apiService
      .apiFn({ type: 'GET', target: 'questionnaire/list' }, this.pagiPayload)
      .then((result: any) => {
        console.log('questions view', result);
        this.count = result['data']['_count'];
        if (result['status']) {
          result = result['data']['_question_group'].map((item) => {
            return {
              ...item,
              question: item.question,
              order: item.order,
              type: item.type ? this.questionType(item.type) : '',
            };
          });
          this.data = result;
          if (this.data && this.data.length > 0) {
            this.actualDataCount = this.data.length;
          }
          // console.log('result---->', result);
          this.dataSource = result;
          this.createTable(result);
          this._commonService.setLoader(false);
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
    this._commonService.setLoader(false);
  }

  questionType(type) {
    const ind = this.Question_Types.findIndex((item) => item.type === type);
    if (ind > -1) {
      return this.Question_Types[ind].value;
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

  /* Remove option for Radio, Dropdown and Multi Checkboxes */
  removeOption(key) {
    this.temparray = <FormArray>this.questionForm.controls['options'];
    this.temparray.removeAt(key);
  }

  addquestion() {
    this.router.navigate(['/createAQuestionnaire/form/' + this.questionnaire]);
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
      if (this.temparray.length < 2) this.temparray.push(this.setInputType());
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
      let optionArr: any = this.questionForm.get('options');
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
    if (this.questionForm.valid) {
      this._commonService.setLoader(true);
      const data = {
        _id: this.questionForm.controls._id.value,
        group: this.questionForm.controls.group.value,
        type: this.questionForm.controls.type.value,
        question: this.questionForm.controls.question.value,
        options: this.isOptionField
          ? this.questionForm.controls.options.value
          : [],
      };
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
      '/createAQuestionnaire/edit/' + this.questionnaire,
      this._aes256Service.encFnWithsalt(questionId),
    ]);
  }

  dropTable(event: CdkDragDrop<[]>) {
    const prevIndex = this.dataSource.findIndex((d) => d === event.item.data);
    const arr = {
      _id: event.item.data._id,
      group: event.item.data.group,
      question: event.item.data.question,
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
    moveItemInArray(this.dataSource, prevIndex, event.currentIndex);
    this.table.renderRows();
  }

  async exchangeOrder(arr) {
    const data = {
      _id: arr._id,
      previous_order: arr.previous_order,
      current_order: arr.current_order,
      question: arr.question,
      group: arr.group,
    };
    const findBody = await this.getPayloadToSend(data);
    const payload = {
      updateData: findBody,
      fac_id: this.facility._id,
    };
    // console.log('payload--->', payload);

    // update questionnare order:
    const action = {
      type: 'POST',
      target: 'questionnaire/updateQuestionnareOrder',
    };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message'], 'Success');
      await this.getQuestionsDataFunction();
    } else {
      this.toastr.error('Failed to update questionnare data.', 'Error');
    }
  }

  async getPayloadToSend(data) {
    // console.log('data--->', data);
    const finalOrderData = [];
    let orderArrayToBeUpdate = [];
    if (data.current_order < data.previous_order) {
      orderArrayToBeUpdate = this.dataSource.filter((ele) => {
        return (
          ele.order >= data.current_order &&
          ele._id !== data._id &&
          ele.order <= data.previous_order
        );
      });
      orderArrayToBeUpdate.forEach((element) => {
        const obj = {};
        element['order'] += 1;
        obj['order'] = element['order'];
        obj['_id'] = element['_id'];
        obj['group'] = element['group'];
        obj['question'] = element['question'];
        finalOrderData.push(obj);
      });
    } else if (data.current_order > data.previous_order) {
      orderArrayToBeUpdate = this.dataSource.filter((ele) => {
        return (
          ele.order <= data.current_order &&
          ele._id !== data._id &&
          ele.order >= data.previous_order
        );
      });
      orderArrayToBeUpdate.forEach((element) => {
        element['order'] -= 1;
        const obj = {};
        obj['order'] = element['order'];
        obj['_id'] = element['_id'];
        obj['group'] = element['group'];
        obj['question'] = element['question'];
        finalOrderData.push(obj);
      });
    }
    finalOrderData.push({
      order: data.current_order,
      _id: data._id,
      group: data.group,
      question: data.question,
    });
    return finalOrderData;
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

  // old api call
  async changeStatusOld(event, question_id) {
    console.log('changeStatus event', event, question_id);
    await this.apiService
      .apiFn(
        { type: 'POST', target: 'questions/changeStatus' },
        { status: event.checked, questionId: question_id }
      )
      .then(async (result) => {
        await this.getQuestions('');
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }

  // new api call
  async changeStatus(event, question_id) {
    // console.log('changeStatus event', event, question_id);
    await this.apiService
      .apiFn(
        { type: 'POST', target: 'questionnaire/statusChangeById' },
        {
          status: event.checked,
          questionId: question_id,
          fac_id: this.facility._id,
        }
      )
      .then(async (result) => {
        await this.getQuestions('');
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

  async previewQuestion() {
    // console.log('this.selectedQuestions---->', this.selectedQuestions);
    if (this.selectedQuestions.length > 0) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.maxWidth = '1300px';
      dialogConfig.panelClass = 'repeatDialog';
      // dialogConfig.disableClose = true;
      dialogConfig.closeOnNavigation = true;
      this.dialogRefs = this.dialog.open(this.questionPreview, dialogConfig);
    } else {
      this.toastr.error('Please select questions.');
    }
  }

  closePreviewDialog() {
    this.dialogRefs.close();
  }

  async getQuestions(index) {
    this._commonService.setLoader(true);
    this.pagiPayload['group'] = this.questionnaire;
    await this.apiService
      .apiFn({ type: 'GET', target: 'questionnaire/list' }, this.pagiPayload)
      .then((result: any) => {
        const data = result['data'];
        this.dataSource = result.data['_question_group'];
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
    this._commonService.setLoader(false);
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
    let question = event.source.data.question;
    this.dragged_question = question;
  }

  dragin(e) {
    this.onDrag = true;
  }

  dragout(e) {
    this.onDrag = false;
  }

  async userFacility() {
    await this.apiService
      .apiFn(
        { type: 'GET', target: 'users/get_user_fac' },
        { org: this.organization }
      )
      .then(async (result: any) => {
        this.faclist = await result['data'].map((obj) => {
          return {
            fac_name: obj._id.fac.fac_name,
            _id: obj._id.fac._id,
          };
        });
        for (var i = 0; i < this.faclist.length; i++) {
          if (this.selectedOrgDetails.fac == this.faclist[i]._id)
            this.facility = this.faclist[i];
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }

  async userOrganization() {
    await this.apiService
      .apiFn({ type: 'GET', target: 'users/get_org' }, {})
      .then(async (result: any) => {
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

        const orgData = this.organiz.filter((item) => {
          return item._id.toString() == this.organization;
        });
        this.orgLogo = orgData && orgData.length ? orgData[0].org_logo : '';

        for (let i = 0; i < this.organiz.length; i++) {
          if (this.selectedOrgDetails.org == this.organiz[i]._id) {
            this.organization = this.organiz[i];
          }
        }
      })
      .catch((error) =>
        this.toastr.error(error.message ? error.message : 'Some error occured')
      );
  }

  closeQuestionnerCopyDialog() {
    this.dialogRefs.close();
  }

  previewQuestions() {}

  removeQuestion(index) {
    //
  }

  next() {}

  prev() {}
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
