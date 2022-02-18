import { Component, ElementRef, InjectionToken, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PresetItem, Range } from 'ngx-mat-daterange-picker';
import { MatDatepickerInputEvent, MatSelect, PageEvent } from '@angular/material';
import * as moment from 'moment';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { Observable, fromEvent, Subscription } from 'rxjs';
import { SearchFilterBYPipe } from '../../../shared/services/search-filter-by.pipe';
import { debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { AddPharmacyComponent } from 'src/app/shared/modals/add-pharmacy/add-pharmacy.component';
import { AddPhysicianComponent } from 'src/app/shared/modals/add-physician/add-physician.component';
import { AddDrugComponent } from 'src/app/shared/modals/add-drug/add-drug.component';
import { AddRecipientComponent } from 'src/app/shared/modals/add-recipient/add-recipient.component';
import { enableRipple } from '@syncfusion/ej2-base'
import { ScheduleModalComponent } from 'src/app/shared/modals/schedule-modal/schedule-modal.component';
import { DragNDropUploadComponent } from 'src/app/shared/modals/dragndropupload/dragndropupload.component';
import { AddSymptomComponent } from 'src/app/shared/modals/add-symptom/add-symptom.component';
import { AddTestingDeviceComponent } from 'src/app/shared/modals/add-testingdevice/add-testingdevice.component';
enableRipple(false);
import { TimePicker } from '@syncfusion/ej2-calendars';
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit, OnDestroy {

  selectedMedicationDate:any = {};
  eMarToggle: boolean = false;
  fileName: string;
  file: File;
  scheduleRepeat: any = {
    index: null,
    startDate: null,
    // startDate : new Date(),
    endDate: null,
    repeat_tenure: 1,
    repeat: 'every_day',
    repeat_old: null,
    repeat_on: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    repeat_option: 'on_day',
    repeat_checkoption: 'on_day'
  };
  carSearch = '';
  labProcessorSearch = '';
  addPopupStartMin;
  datevalidation = false;
  start;
  end;
  CheckIn = false;
  selected = [moment().utc(), moment().utc()];
  alwaysShowCalendars: boolean;
  selectedCare: any = {
    care_id: '',
    note: '',
    user_id: '',
    subCare: false,
  };
  careScheduleOrder: any;
  ranges: any = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [
      moment().subtract(1, 'month').startOf('month'),
      moment().subtract(1, 'month').endOf('month'),
    ],
  };
  checked;
  labTypeList = [
    { name: 'Full Blood Work', value: 'Full Blood Work'},
    { name: 'White Blood Cell Count', value: 'White Blood Cell Count'},
    { name: 'ACCU Check', value: 'ACCU Check'}
  ]
  medicationForm: FormGroup;
  labOrderForm: FormGroup;
  miscOrderForm: FormGroup;
  carelist = [];
  labProcessorlist = [];
  selectedList: any[] = [];
  medicationScheduleList = [];
  pharmacyList = [];
  administeredList = [];
  prescriberList = [];
  testingDeviceList = [];
  prescriptionList = [];
  medicationDurationList: any[];
  //medicationDetails: any = null;
  labOrderDetails: any = null;
  //miscOrderDetails: any = null;
  medicationDetails: any = {};
  //labOrderDetails: any = {};
  miscOrderDetails: any = {};
  //prescOrderDetails: any = {};

  showSymptoms: boolean = false;
  symptomsList = [];

  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'medication_name', direction: 'asc' },
  };

  drugPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    search: '',
  };

  pharmacyPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    search: '',
  };

  physicianPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    search: '',
  };

  symptomPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 500,
    search: '',
    previousPageIndex: 0
  };

  residentPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };
  start_date;
  end_date;
  msSearch = '';
  mdSearch = '';
  enable_prn = false;
  enable_supply = false;
  isGeneric = false;
  prescribedSearch:string = '';
  testingDeviceSearch:string = '';
  symptomSearch = '';
  pharmacySearch = '';
  administeredSearch = '';
  prescriptionSearch = '';
  medicationId = '';
  selectedVitals = [];
  vitalsList = [];
  residentPrimaryPhysician = [];
  residentPrimaryPharmacy = [];
  selectedAdminstrationFrequency = [];
  selectedWeeklyFrequency = [];
  selectedPrescription = [];

  range: Range = { fromDate: new Date(), toDate: new Date() };
  presets: Array<PresetItem> = [];
  filteredOptions: Observable<any[]>;
  filteredResidents: Observable<any[]>;
  organization;
  facility;
  floor;
  subscription: Subscription;
  residentSearch: any;
  residentData: any[];
  residentId: any;
  orderType: any;
  @ViewChild('addForm', {static: true}) addForm: TemplateRef<any>;
  dialogRefs;
  addDoctorPharmacyForm: FormGroup;
  formName: any;
  showFormName: string = '';
  facId = '';

  minDate = new Date();

  endtimevalidation = false;
  endvalidationqual = false;
  equalvalidation = false;
  minutevalid = false;
  dosageList = [
    { value: '0.5' },
    { value: '1' },
    { value: '1.5' },
    { value: '2' },
    { value: '2.5' },
    { value: '3' },
  ];
  dosageSelect = '';
  diagnosticDropValue = ''
  dSearch = '';
  // showDosageInput = true;
  showTabletList = true;
  drugStrength;
  searchRecipient: string = '';
  recipientsList: any = [ { _id: '1', name: 'Please search recipient'} ];
  orderId;
  fileUrl = '';
  thumbnailUrl = '';
  isTreatment = false;
  dialogConfig = new MatDialogConfig();
  physicianOffset = 0;
  customScheduleString:string = '';
  symptomOffset = 0;
  drugOffset = 0;
  pharmacyOffset = 0;
  totalDrugCount;
  totalPrescriberCount;
  totalSymptomsCount;
  totalPharmacyCount;
  medicationBatchId: any;
  userLocalTimeZone = moment.tz.guess();

  isNarcotics: any;
  pharmacyFaxNumber: any;
  totalAmount: any;

  allowSubstitution = false;
  brandNameRequired = false;
  neededStat = false;
  freqValue = false;
  dosageValue = '';
  viewPdf = false;
  zoomValue = 1;
  dosageUnit: any;
  paramId: Boolean = false;
  captionName;
  residentName;
  residentDOB;
  admitDate;
  residentsAge;
  residentsGender;
  residentdata;
  timeZone;
  addAnother:boolean = false;
  medpassSelected: any[] = [];
  weeklyDaysArr = [
    { id: 0, value: 'Every Other Day', isChecked: false },
    { id: 1, value: 'Sunday', isChecked: false },
    { id: 2, value: 'Monday', isChecked: false },
    { id: 3, value: 'Tuesday', isChecked: false },
    { id: 4, value: 'Wednesday', isChecked: false },
    { id: 5, value: 'Thursday', isChecked: false },
    { id: 6, value: 'Friday', isChecked: false },
    { id: 7, value: 'Saturday', isChecked: false },
  ];
  alternateDays = false;
  isInsulin = false;
  isInsulinErr = false;
  showNew = true;
  insulinData: any = {
    low: '',
    high: '',
    dose: '',
    unit: '',
  };
  insulinDoseList = [];

  sendCopyCount: number = 0;

  is_Stat: boolean = false;
  is_lab_processor_in_building: boolean = false;
  watermark: string = 'Time';
  // sets the format property to display the time value in 24 hours format.
  public formatString: string = 'HH:mm';
  interval: number = 60;
  carelistData: any;
  activeClassIndex = '';
  selectedCareList = [];
  files: any[] = [];
  orderReceivedBy = '';
  recipientCopy:  any[] = [];
  selectedPharmacies: any[] = [];
  selectedPhysicians: any[] = [];
  selectedHospitals: any[] = [];
  diagnosticsOrStandard = [
    { name: 'Diagnostic', value: 'diagnostic'},
    { name: 'Standard Lab', value: 'standard'}
  ];
  @ViewChild('searchInput', {static: true}) searchInput !: ElementRef;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    public dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public commonService: CommonService,
    private searchPipe: SearchFilterBYPipe
  ) {
    let timeObj: TimePicker = new TimePicker({
      value: new Date(),
      format: 'HH:mm',
      placeholder: 'Select a time'
  });
  timeObj.appendTo('#timepicker');
  }

  async ngOnInit() {
    this.commonService.setLoader(true);
    this.toggleSidebar();
    this.getAllcares();
    this.getAllHospitals();
    this.medicationForm = this.fb.group({ // Medication form
      care: [''],
      msSearch: '',
      mdSearch: '',
      medication_name: ['', [Validators.required]],
      ndc: [''],
      route: [''],
      instructions: [''],
      dosage: ['', [Validators.required]],
      administered_by: [''],
      prescription_number: [''],
      prescribedSearch: [' '],
      prescribed_by: [' '],
      pharmacySearch: [' '],
      administeredSearch: [' '],
      pharmacy_id: [' '],
      order_id: [' '],
      // expire_date: ['', [Validators.required]],
      // start_date: ['', [Validators.required]],
      expire_date: [''],
      start_date: [''],
      end_date: [''],
      // days: ['', [Validators.required]],
      days: ['', [Validators.required]],
      refills: ['', [Validators.required]],
      medication_schedule: [''],
      prescriptionSearch: [''],
      resident_id: [''],
      resident_name: [''],
      start_time: ['00:00'],
      end_time: ['23:59'],
      fac_id: [''],
      drug_id: [''],
      medication_duration: [''],
      quantity: [''],
      dSearch: '',
      reason: [''],
      initialText: [''],
      dosageForm: [''],
      pharmacistNotes: [''],
      notes_for_care: [''],
      progress_note: [''],
      orderDate: [''],
      writtenDate: [''],
      deaNumber: [''],
      sigText: [''],
      totalQuantity: [''],
      dosageText: [''],
      unit: [''],
      dosageStrength: [''],
      insulinDataArray: this.fb.array([]),
    });

    this.labOrderForm = this.fb.group({ // Lab order form
      order_id: '',
      resident_id: [ this.residentId, [Validators.required]],
      fac_id: [ this.facility, [Validators.required]],
      prescriber: ['', [Validators.required]],
      order_recieved_by: [this.orderReceivedBy, [Validators.required]],
      lab_kind: ['', [Validators.required]],
      lab_type: ['', [Validators.required]],
      testing_device: ['', [Validators.required]],
      order_date: ['', [Validators.required]],
      order_time: ['', [Validators.required]],
      exam_date: ['', [Validators.required]],
      is_lab_processor_in_building: [this.is_lab_processor_in_building, [Validators.required]],
      lab_processor_building: '',
      lab_processor: '',
      result_copy: [],
      notes: '',
      progress_note: ['', [Validators.required]],
      is_stat: [this.is_Stat, [Validators.required]],
      order_document: '',
      order_document_thumbnail: '',
      mimeType: '',
      fileName: '',
      base64: '',
      exam_time: '',
      symptoms: []
    });
    this.miscOrderForm = this.fb.group({ //Misc order form
      order_id: '',
      resident_id: [ this.residentId, [Validators.required]],
      fac_id: [ this.facility, [Validators.required]],
      prescriber: ['', [Validators.required]],
      order_recieved_by: [this.orderReceivedBy, [Validators.required]],
      order_date: ['', [Validators.required]],
      order_time: ['', [Validators.required]],
      start_time: ['', [Validators.required]],
      recipient: [],
      cares: [],
      notes: '',
      progress_note: '',
      aditional_info: '',
      is_self_managed: false,
      is_PRN: false,
      is_stat: false,
      is_display_on_eMAR: false,
      order_document: '',
      order_document_thumbnail: '',
      fileName: '',
      base64: '',
      prescribedSearch: ''
    });

    // if (!this.commonService.checkPrivilegeModule('medications','add')){
    //   this.router.navigate(['/']);
    // }
    
    this.subscription = this.commonService.contentdata.subscribe((contentVal: any) => {
      console.log("Content Val----",contentVal);
      this.commonService.setLoader(true);
      if (contentVal.org && contentVal.fac) {
        this.facId = contentVal.fac;
        this.organization = contentVal.org;
        this.timeZone = contentVal.timezone;
        this.medicationForm.controls.writtenDate.patchValue(new Date());
      }
    });
    this.addDoctorPharmacyForm = this.fb.group({
      name: ['', [Validators.required]],
      fac_id: [''],
    });
    this.selectedMedicationDate['minDate'] = new Date();
    this.selectedMedicationDate['minDateEnd'] = new Date();
    const startDateData = moment().set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDateData = moment().set({
      hour: 23,
      minute: 59,
      second: 0,
      millisecond: 0,
    });
    this.start_date = startDateData['_d'].getTime();
    this.end_date = endDateData['_d'].getTime();
    await this.getMedicationDurationList();
    await this.getAllVitalsList();
    await this.getAdministeredList();
    await this.getAllPrescriptionList();
    await this.getAllPharmacy();
    await this.getAllPrescriberList();
    await this.getAllTestingDeviceList();
    await this.getAllSymptomsList();
    await this.getAllMedicationSchedule();
    this.medicationId = null;
    this.medicationForm.controls.order_id.patchValue(null);
    //this.labOrderForm.controls.order_id.patchValue(null);
    this.miscOrderForm.controls.order_id.patchValue(null);
    if (this.route.snapshot.queryParamMap.get('residentId')) {
      console.log("Params",this._aes256Service.decFnWithsalt(this.route.snapshot.queryParamMap.get('residentId')));
      this.paramId = true;
      const action = { type: 'POST', target: 'residents/getResidentDataById' };
      const payload = { residentId: this._aes256Service.decFnWithsalt(this.route.snapshot.queryParamMap.get('residentId')) };
      const result = await this.apiService.apiFn(action, payload);
      if (result && result['data']) {
        this.residentdata = result['data'];
      }
      console.log('residentdata---->', this.residentdata);
      this.residentName = this.residentdata.last_name + ', ' + this.residentdata.first_name;
      this.residentDOB = moment(this.residentdata.dob).format('YYYY-MM-DD');
      this.admitDate = moment(this.residentdata.admit_date).format('YYYY-MM-DD');
      this.residentsAge = this.residentdata.age;
      this.residentsGender = this.residentdata.gender;
      this.organization = this.residentdata.facility[0]['org'];
      if (result && result['data']) {
        this.captionName =
          result['data']['first_name'].substring(0, 1) +
          result['data']['last_name'].substring(0, 1);
      }
    }
    if (this.route.params['_value']['medication_id']) {
      console.log("Params",this.route.params);
      this.commonService.setLoader(true);
      this.medicationId = this._aes256Service.decFnWithsalt(
        this.route.params['_value']['medication_id']
      );
      const action = { type: 'GET', target: 'residents/medication_list' };
      const payload = { medication_id: this.medicationId };
      // const payload = { medicationBatchId: this._aes256Service.decFnWithsalt(this.route.params['_value']['medication_id']) };
      let result = await this.apiService.apiFn(action, payload);
      console.log("Medication details----", result);
      result = result['data']['_medication'].map((item) => {
        return {
          ...item,
          ndc: item.drug.ndc,
          route: item.drug.route,
          medication_name:
            item.drug.name +
            ' ' +
            item.drug.suffix_name +
            ' ' +
            '( ' +
            item.drug.non_suffix_name +
            ' )' +
            ' ' +
            item.drug.strength.toFixed(2) +
            ' ' +
            item.drug.unit.split('/')[0],
          drug_name:
            item.drug.name +
            ' ' +
            item.drug.suffix_name +
            ' ' +
            '( ' +
            item.drug.non_suffix_name +
            ' )' +
            ' ' +
            item.drug.strength.toFixed(2) +
            ' ' +
            item.drug.unit.split('/')[0] +
            ' ' +
            item.drug.dosage_form,
          resident_name: item.resident.name,
          fac_id: item.resident.facility[0].fac,
        };
      });
      this.medicationDetails = result[0];
      if (this.medicationDetails) {
        // console.log('this.medicationDetails--->', this.medicationDetails);
        // this.medicationBatchId = this.medicationDetails.medicationBatchId;
        // this.medicationDetails.start_date = this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
        this.medicationDetails.writtenDate = this.medicationDetails.writtenDate
          ? moment(this.medicationDetails.writtenDate)['_d']
          : '';
        // this.medicationDetails.end_date = this.medicationDetails.end_date ? moment(this.medicationDetails.end_date)['_d'] : '';
        // this.medicationDetails.expire_date = this.medicationDetails.expire_date ? moment(this.medicationDetails.expire_date)['_d'] : '';
        // this.medicationDetails.start_time = this.medicationDetails.start_date;
        // this.medicationForm.controls.start_time.patchValue(this.medicationDetails.start_time);
        // this.medicationDetails.end_time = this.medicationDetails.end_date;
        // this.medicationForm.controls.end_time.patchValue(this.medicationDetails.end_time);
        this.medicationForm.controls.drug_id.patchValue(
          this.medicationDetails.drug._id
        );
        this.medicationForm.controls.ndc.patchValue(
          this.medicationDetails.drug.ndc
        );
        this.medicationForm.controls.route.patchValue(
          this.medicationDetails.drug.route
        );
        this.medicationForm.controls.order_id.patchValue(
          this.medicationDetails.order_id
        );
        this.residentId = this.medicationDetails.resident._id;
        // this.selectedMedicationDate['minDate'] =
        // this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
        // this.selectedMedicationDate['minDateEnd'] =
        // this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
        this.medicationDetails.dosage = String(this.medicationDetails.dosage);
        // await this.getDosageArrayList(this.medicationDetails.drug_name);
        await this.bindDataToDropdown(this.medicationDetails);
        this.drugStrength = this.medicationDetails.drug.strength;
        // console.log('this.medicationDetails---->', this.medicationDetails);
        this.medicationForm.controls.resident_id.patchValue(this.residentId);
        // vitals data
        this.selectedVitals = this.medicationDetails.vitals;
        this.vitalsList.forEach((ele) => {
          const index = this.selectedVitals.findIndex(
            (item) => item === ele.key
          );
          if (index !== -1) {
            ele.isChecked = true;
          } else {
            ele.isChecked = false;
          }
        });

        // administration frequency data
        this.medicationDetails.medicationDurations.forEach((element) => {
          this.selectedAdminstrationFrequency.push(element._id);
        });

        this.medicationDurationList.forEach((ele) => {
          const index = this.selectedAdminstrationFrequency.findIndex(
            (item) => item === ele.key
          );
          if (index !== -1) {
            ele.isChecked = true;
          } else {
            ele.isChecked = false;
          }
        });
        // this.selectedMedicationDate['startDate'] = this.medicationDetails.start_date;
        // this.selectedMedicationDate['minDateEnd'] = this.medicationDetails.start_date;
        // this.selectedMedicationDate['endDate'] = this.medicationDetails.start_date;

        this.medicationForm.controls.quantity.patchValue(
          this.medicationDetails.quantity
        );
        this.medicationForm.controls.days.patchValue(
          this.medicationDetails.days
        );
        this.medicationForm.controls.initialText.patchValue(
          this.medicationDetails.initialText
        );
        // this.medicationForm.controls.dosage.patchValue(Number(this.medicationDetails.dosage));
        const value = this.medicationDetails.drug.dosage_form.split(',');
        this.medicationForm.controls.dosageForm.patchValue(
          value[0].toLowerCase()
        );
        // this.getSigText();
        this.getTotalQuantity();
        if (
          this.medicationDetails.order &&
          this.medicationDetails.order.fileUrl
        ) {
          this.fileUrl = this.medicationDetails.order.fileUrl;
          this.thumbnailUrl = this.medicationDetails.order.thumbnailUrl;
          const extArr = this.medicationDetails.order.fileUrl
            .split('.')
            .reverse();
          if (extArr[0].toLocaleLowerCase() === 'pdf') {
            this.viewPdf = true;
          } else {
            this.viewPdf = false;
          }
        }
      }
      // if (this.labOrderDetails) {
      //   // console.log('this.medicationDetails--->', this.medicationDetails);
      //   // this.medicationBatchId = this.medicationDetails.medicationBatchId;
      //   // this.medicationDetails.start_date = this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
      //   this.labOrderDetails.writtenDate = this.labOrderDetails.writtenDate ? moment(this.labOrderDetails.writtenDate)['_d'] : '';
      //   // this.medicationDetails.end_date = this.medicationDetails.end_date ? moment(this.medicationDetails.end_date)['_d'] : '';
      //   // this.medicationDetails.expire_date = this.medicationDetails.expire_date ? moment(this.medicationDetails.expire_date)['_d'] : '';
      //   // this.medicationDetails.start_time = this.medicationDetails.start_date;
      //   // this.medicationForm.controls.start_time.patchValue(this.medicationDetails.start_time);
      //   // this.medicationDetails.end_time = this.medicationDetails.end_date;
      //   // this.medicationForm.controls.end_time.patchValue(this.medicationDetails.end_time);
      //   this.labOrderForm.controls.drug_id.patchValue(this.labOrderDetails.drug._id);
      //   this.labOrderForm.controls.ndc.patchValue(this.labOrderDetails.drug.ndc);
      //   this.labOrderForm.controls.route.patchValue(this.labOrderDetails.drug.route);
      //   this.labOrderForm.controls.order_id.patchValue(this.labOrderDetails.order_id);
      //   this.residentId = this.labOrderDetails.resident._id;
      //   // this.selectedMedicationDate['minDate'] =
      //   // this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
      //   // this.selectedMedicationDate['minDateEnd'] =
      //   // this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
      //   this.labOrderDetails.dosage = String(this.labOrderDetails.dosage);
      //   // await this.getDosageArrayList(this.medicationDetails.drug_name);
      //   await this.bindDataToDropdown(this.labOrderDetails);
      //   this.drugStrength = this.labOrderDetails.drug.strength;
      //   console.log('this.labOrderDetails---->', this.labOrderDetails);
      //   this.labOrderForm.controls.resident_id.patchValue(this.residentId);
      //   // vitals data
      //   this.selectedVitals = this.labOrderDetails.vitals;
      //   this.vitalsList.forEach(ele => {
      //     const index = this.selectedVitals.findIndex(item => item === ele.key);
      //     if (index !== -1) {
      //       ele.isChecked = true;
      //     } else {
      //       ele.isChecked = false;
      //     }
      //   });

      //   // administration frequency data
      //   this.labOrderDetails.medicationDurations.forEach(element => {
      //     this.selectedAdminstrationFrequency.push(element._id);
      //   });

      //   this.medicationDurationList.forEach(ele => {
      //     const index = this.selectedAdminstrationFrequency.findIndex(item => item === ele.key);
      //     if (index !== -1) {
      //       ele.isChecked = true;
      //     } else {
      //       ele.isChecked = false;
      //     }
      //   });
      //   // this.selectedMedicationDate['startDate'] = this.medicationDetails.start_date;
      //   // this.selectedMedicationDate['minDateEnd'] = this.medicationDetails.start_date;
      //   // this.selectedMedicationDate['endDate'] = this.medicationDetails.start_date;

      //   this.labOrderForm.controls.quantity.patchValue(this.labOrderDetails.quantity);
      //   this.labOrderForm.controls.days.patchValue(this.labOrderDetails.days);
      //   this.labOrderForm.controls.initialText.patchValue(this.labOrderDetails.initialText);
      //   // this.medicationForm.controls.dosage.patchValue(Number(this.medicationDetails.dosage));
      //   const value = this.labOrderDetails.drug.dosage_form.split(',');
      //   this.labOrderForm.controls.dosageForm.patchValue(value[0].toLowerCase());
      //   // this.getSigText();
      //   this.getTotalQuantity();
      //   if (this.labOrderDetails.order && this.labOrderDetails.order.fileUrl) {
      //     this.fileUrl = this.labOrderDetails.order.fileUrl;
      //     this.thumbnailUrl = this.labOrderDetails.order.thumbnailUrl;
      //     const extArr = this.labOrderDetails.order.fileUrl.split('.').reverse();
      //     if (extArr[0].toLocaleLowerCase() === 'pdf') {
      //       this.viewPdf = true;
      //     } else {
      //       this.viewPdf = false;
      //     }
      //   }
      // }
      // if (this.miscOrderDetails) {
      //   // console.log('this.medicationDetails--->', this.medicationDetails);
      //   // this.medicationBatchId = this.medicationDetails.medicationBatchId;
      //   // this.medicationDetails.start_date = this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
      //   this.miscOrderDetails.writtenDate = this.miscOrderDetails.writtenDate ? moment(this.miscOrderDetails.writtenDate)['_d'] : '';
      //   // this.medicationDetails.end_date = this.medicationDetails.end_date ? moment(this.medicationDetails.end_date)['_d'] : '';
      //   // this.medicationDetails.expire_date = this.medicationDetails.expire_date ? moment(this.medicationDetails.expire_date)['_d'] : '';
      //   // this.medicationDetails.start_time = this.medicationDetails.start_date;
      //   // this.medicationForm.controls.start_time.patchValue(this.medicationDetails.start_time);
      //   // this.medicationDetails.end_time = this.medicationDetails.end_date;
      //   // this.medicationForm.controls.end_time.patchValue(this.medicationDetails.end_time);
      //   this.miscOrderForm.controls.drug_id.patchValue(this.miscOrderDetails.drug._id);
      //   this.miscOrderForm.controls.ndc.patchValue(this.miscOrderDetails.drug.ndc);
      //   this.miscOrderForm.controls.route.patchValue(this.miscOrderDetails.drug.route);
      //   this.miscOrderForm.controls.order_id.patchValue(this.miscOrderDetails.order_id);
      //   this.residentId = this.miscOrderDetails.resident._id;
      //   // this.selectedMedicationDate['minDate'] =
      //   // this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
      //   // this.selectedMedicationDate['minDateEnd'] =
      //   // this.medicationDetails.start_date ? moment(this.medicationDetails.start_date)['_d'] : '';
      //   this.miscOrderDetails.dosage = String(this.miscOrderDetails.dosage);
      //   // await this.getDosageArrayList(this.medicationDetails.drug_name);
      //   await this.bindDataToDropdown(this.miscOrderDetails);
      //   this.drugStrength = this.miscOrderDetails.drug.strength;
      //   console.log('this.miscOrderDetails---->', this.miscOrderDetails);
      //   this.miscOrderForm.controls.resident_id.patchValue(this.residentId);
      //   // vitals data
      //   this.selectedVitals = this.miscOrderDetails.vitals;
      //   this.vitalsList.forEach(ele => {
      //     const index = this.selectedVitals.findIndex(item => item === ele.key);
      //     if (index !== -1) {
      //       ele.isChecked = true;
      //     } else {
      //       ele.isChecked = false;
      //     }
      //   });

      //   // administration frequency data
      //   this.miscOrderDetails.medicationDurations.forEach(element => {
      //     this.selectedAdminstrationFrequency.push(element._id);
      //   });

      //   this.medicationDurationList.forEach(ele => {
      //     const index = this.selectedAdminstrationFrequency.findIndex(item => item === ele.key);
      //     if (index !== -1) {
      //       ele.isChecked = true;
      //     } else {
      //       ele.isChecked = false;
      //     }
      //   });
      //   // this.selectedMedicationDate['startDate'] = this.medicationDetails.start_date;
      //   // this.selectedMedicationDate['minDateEnd'] = this.medicationDetails.start_date;
      //   // this.selectedMedicationDate['endDate'] = this.medicationDetails.start_date;

      //   this.miscOrderForm.controls.quantity.patchValue(this.miscOrderDetails.quantity);
      //   this.miscOrderForm.controls.days.patchValue(this.miscOrderDetails.days);
      //   this.miscOrderForm.controls.initialText.patchValue(this.miscOrderDetails.initialText);
      //   // this.medicationForm.controls.dosage.patchValue(Number(this.medicationDetails.dosage));
      //   const value = this.miscOrderDetails.drug.dosage_form.split(',');
      //   this.miscOrderForm.controls.dosageForm.patchValue(value[0].toLowerCase());
      //   // this.getSigText();
      //   this.getTotalQuantity();
      //   if (this.miscOrderDetails.order && this.miscOrderDetails.order.fileUrl) {
      //     this.fileUrl = this.miscOrderDetails.order.fileUrl;
      //     this.thumbnailUrl = this.miscOrderDetails.order.thumbnailUrl;
      //     const extArr = this.miscOrderDetails.order.fileUrl.split('.').reverse();
      //     if (extArr[0].toLocaleLowerCase() === 'pdf') {
      //       this.viewPdf = true;
      //     } else {
      //       this.viewPdf = false;
      //     }
      //   }
      // }
      this.commonService.setLoader(false);
    }
    if (this.route.snapshot.queryParamMap.get('orderId')) {
      console.log("Params",this.route.snapshot.queryParamMap.get('orderType'));
      this.commonService.setLoader(true);
      let orderId = '';
      let residentId = '';
      let orderType = '';
      orderId = this.route.snapshot.queryParamMap.get('orderId');
      residentId = this.route.snapshot.queryParamMap.get('residentId');
      orderType = this.route.snapshot.queryParamMap.get('orderType');
      this.orderId = this._aes256Service.decFnWithsalt(orderId);
      this.residentId = this._aes256Service.decFnWithsalt(residentId);
      this.orderType = orderType;
      console.log("Order Type",this.orderType, this.orderId);
      if(Object.keys(this.orderId).length && this.orderId !== ''){
        const action = { type: 'GET', target: 'residents/get_order' };
        const payload = { orderId: this.orderId };
        const result = await this.apiService.apiFn(action, payload);
        const data = result['data'][0];
        console.log("Data----------",data);
        this.medicationForm.controls.resident_id.patchValue(data.resident_id);
        this.medicationForm.controls.order_id.patchValue(data._id);
        this.labOrderForm.controls.resident_id.patchValue(data.resident_id);
        this.labOrderForm.controls.order_id.patchValue(data._id);
        this.miscOrderForm.controls.resident_id.patchValue(data.resident_id);
        this.miscOrderForm.controls.order_id.patchValue(data._id);
        this.fileUrl = data && data.fileUrl ? data.fileUrl : '';
        this.thumbnailUrl = data && data.thumbnailUrl ? data.thumbnailUrl : '';

        if (data && data.fileUrl) {
          const extArr = data && data.fileUrl.split('.').reverse();
          if (extArr[0].toLocaleLowerCase() === 'pdf') {
            this.viewPdf = true;
          } else {
            this.viewPdf = false;
          }
        }
      }
      
      // console.log('data------>', data);
      await this.getResidentPrimaryPharmacy();
      await this.getResidentPrimaryPhysician();
    }
    // if (this.medicationDetails && !this.medicationDetails.writtenDate) {
    //   this.medicationDetails.writtenDate = this.medicationForm.value.writtenDate;
    // }
    // if (this.labOrderDetails && !this.labOrderDetails.writtenDate) {
    //   this.labOrderDetails.writtenDate = this.labOrderForm.value.writtenDate;
    // }
    if (this.miscOrderDetails && !this.miscOrderDetails.writtenDate) {
      this.miscOrderDetails.writtenDate = this.miscOrderForm.value.writtenDate;
    }
    // if (this.prescOrderDetails && !this.prescOrderDetails.writtenDate) {
    //   this.prescOrderDetails.writtenDate = this.prescOrderForm.value.writtenDate;
    // }
    await this.getServerData(this.residentPagiPayload);
    this.commonService.setLoader(false);

    this.filteredOptions =
      this.medicationForm.controls.medication_name.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterPrescription(value))
      );

    this.filteredResidents =
      this.medicationForm.controls.resident_id.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterResident(value))
      );
  }

  // sensors formarray functions
  insulinDataArray(): FormArray {
    return this.medicationForm.get('insulinDataArray') as FormArray;
  }

  newInsulinData(): FormGroup {
    return this.fb.group({
      low: [''],
      high: [''],
      dose: [''],
      unit: ['iU'],
    });
  }

  addInsulinData() {
    this.insulinDataArray().insert(0, this.newInsulinData());
  }

  removeInsulinData(i: number) {
    this.insulinDataArray().removeAt(i);
  }

  toggleSidebar() {
    const dom: any = document.querySelector('body');
    dom.classList.toggle('push-right');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    const dom: any = document.querySelector('body');
    dom.classList.toggle('push-left');
  }

  setDiagnostic(){
    if(this.diagnosticDropValue == 'diagnostic'){
      this.showSymptoms = true;
    }
    else {
      this.showSymptoms = false;
    }
  }

  selectSymptom(symptom){

  }

  trigger() {
    let element = document.getElementById('upload_file') as HTMLInputElement;
    element.click();
  }

  openUploadModal(){
    this.dialogConfig.width = '600px';
    this.dialogConfig.autoFocus = false;
    this.dialogConfig.maxHeight = '500px';
    //this.dialogConfig.data = data;
    let _dialogRef = this.dialog.open(DragNDropUploadComponent, this.dialogConfig);
  }

  labProcessorInBuilding(){
    this.is_lab_processor_in_building = true;
  }

  async careSelect(selectedCare) {
    this.selectedCareList = [];
    if (selectedCare.care_id) {
      this.selectedCare = {
        care_id: selectedCare.care_id,
        note: '',
        user_id: '',
        image: ''
      };
      for (let i = 0; i < this.carelist.length; i++) {
        if (this.carelist[i].key === selectedCare.care_id) {
          this.selectedCareList.push({
            care: this.carelist[i],
            note: selectedCare.note,
            user_id: selectedCare.user_id,
            repeat: 'every_day',
            repeat_old: 'every_day',
            timePopup: false,
            startDate: this.scheduleRepeat.startDate,//moment(this.scheduleRepeat.startDate).tz(this.userLocalTimeZone,true),
            repeat_tenure: this.scheduleRepeat.repeat_tenure,
            repeat_on: this.scheduleRepeat.repeat_on,
            repeat_option: this.scheduleRepeat.repeat_option,
          });
          // this.carelist.splice(i, 1);
        } else if (this.carelist[i].subCares && this.carelist[i].subCares.length) {
          for (let j = 0; j < this.carelist[i].subCares.length; j++) {
            if (this.carelist[i].subCares[j].key === selectedCare.care_id) {
              this.selectedCareList.push({
                care: this.carelist[i].subCares[j],
                note: selectedCare.note,
                user_id: selectedCare.user_id,
                repeat: 'every_day',
                repeat_old: 'every_day',
                timePopup: false,
                startDate: this.scheduleRepeat.startDate,//moment(this.scheduleRepeat.startDate).tz(this.userLocalTimeZone,true),
                repeat_tenure: this.scheduleRepeat.repeat_tenure,
                repeat_on: this.scheduleRepeat.repeat_on,
                repeat_option: this.scheduleRepeat.repeat_option,
              });
              // this.carelist[i].subCares.splice(j, 1);
              break;
            }
          }
        }
      }
      if(this.careScheduleOrder && this.careScheduleOrder.length){
        console.log("CareScheduler----", this.careScheduleOrder);
        this.careScheduleOrder = this.selectedCareList;
      }
      if (this.toastr.currentlyActive === 0) this.toastr.success('Care added successfully');

      /* If one care is added then open duration section */
      if ((this.carelist.length || this.selectedCareList.length)) {
        this.selectedCareList.map((item, i) => {
          if (!this.selectedCareList[i].time) {
            this.selectedCareList[i].time = [];
          }
          if (!this.selectedCareList[i].repeat) {
            this.selectedCareList[i].repeat = '';
          }
          // if (!this.selectedCareList[i].startDate) {
          //   this.selectedCareList[i].startDate = this.getCurrentDateFromTimezone()//moment(moment.tz(this.timezone).format()).tz(this.userLocalTimeZone,true);
          // }
          // if (!this.selectedCareList[i].minDate) {
          //   this.selectedCareList[i].minDate = this.getCurrentDateFromTimezone()//moment(moment.tz(this.timezone).format()).tz(this.userLocalTimeZone,true);
          // }
          // if (!this.selectedCareList[i].minDateEnd) {
          //   this.selectedCareList[i].minDateEnd = this.getCurrentDateFromTimezone()//moment(moment.tz(this.timezone).format()).tz(this.userLocalTimeZone,true);
          // }
        });
       
      }
    } else {
      this.toastr.error('Please select care.');
      return;
      // if (this.toastr.currentlyActive === 0)
      //   this.toastr.error("Please select care")
    }
  }

  async getAllHospitals() {
    const action = { type: 'GET', target: 'hospital/list' };
    const payload = {
      moduleName: 'hospitalList',
      length: 0,
      pageIndex: 0,
      pageSize: 500,
      previousPageIndex: 0,
      search: '',
      sort: { active: 'name', direction: 'asc' },
      organization: '',
      facility: '',
    };
    await this.apiService.apiFn(action, payload)
      .then((result: any) => {
        this.labProcessorlist = result['data'];

        console.log("this.labProcessorlist after response>>>>>>>",this.labProcessorlist);
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
    /* End Manage Sub lab processors */
  }

  async getAllRecipientList(search){
    const payload = { fac_id: this.facId, search: search };
    const action = { type: 'GET', target: 'servicePlan/list_recipient'};
    await this.apiService.apiFn(action, payload)
      .then((result: any) => {
        console.log("Result of recipient----", result);
        if(result && result.data){
          this.recipientsList = [];
          //this.recipientsList = result['data'];
          result['data']['_hospitals'].forEach(h => {
            this.recipientsList.push(h);
          });
          result['data']['_labs'].forEach(h => {
            this.recipientsList.push(h);
          })
          result['data']['_pharmacy'].forEach(h => {
            this.recipientsList.push(h);
          })
          result['data']['_physician'].forEach(h => {
            this.recipientsList.push(h);
          })
        }
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
  }

  async getAllcares() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'cares/getCares' },
      { 'type_not_in': ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'], "isSchedule": true,'organization': this.organization,'facility' : this.facility }
    )
      .then((result: any) => {
        this.carelistData = result['data'];
        this.carelist = this.carelistData.filter(care => care.name == 'Vitals' || care.name == 'TEDS');

        console.log("this.carelist after response>>>>>>>",this.carelist)
        this.carelist.filter(obj=> {
          obj['key'] = obj._id ? obj._id : "";
          obj['value'] = obj.name ? obj.name : "";
          obj['subCares'] = obj.subCares ? obj.subCares.filter(sub => sub.name == 'ACCU Check' || sub.name == 'Blood Pressure' ||
            sub.name == 'Pulse' || sub.name == 'Oxygen' || sub.name == 'Temperature' ||
            sub.name == 'Respirations' || sub.name == 'Weight') : [],
          obj['image'] =(obj.image && obj.image.location) ? obj.image.location : "";
          if(obj.subCares && obj.subCares.length) {
            obj.subCares.filter(data=> {
              data['key'] = data._id;
              data['value'] = data.name ? data.name : "";
              data['subCare'] = true;
              data['parentCareId']= obj._id ? obj._id : "";
              data['image'] = (data.image && data.image.location) ? data.image.location : "";
            })
          }
        })
        
        this.carelist.filter(item=> {
          if(item.subCares && item.subCares.length > 0) {
            item['hasSubCares'] = true;
          } else {
            item['hasSubCares'] = false;
          }
        })
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
    /* End Manage Sub cares */
  }

  activeToggler(selectedIndex,event) {
    event.stopPropagation();
    this.activeClassIndex = (this.activeClassIndex == selectedIndex) ? null : selectedIndex;
  }

  openScheduleCare(){
    let dialogConfig = new MatDialogConfig();
    dialogConfig.width = '800px';
    dialogConfig.height = '400px';
    dialogConfig.data = { selectedCareList: this.selectedCareList, selectedFreq: this.medpassSelected }
    this.dialogRefs = this.dialog.open(ScheduleModalComponent, dialogConfig);
    this.dialogRefs.afterClosed().subscribe((res:any) => {
      if(res && res.selectedCareList && res.selectedCareList.length){
        this.careScheduleOrder = res.selectedCareList;
        this.selectedCareList = res.selectedCareList;
        if(res.customString){
          this.customScheduleString = res.customString;
        }
        if(res.selectedFreq){
          this.medpassSelected = res.selectedFreq;
        }
      }
      else {
        this.careScheduleOrder = [];
      }
    });
  }

  private _filterPrescription(value) {
    const filterValue = value.toLowerCase();
    return this.prescriptionList.filter((option) =>
      option.value.toLowerCase().includes(filterValue)
    );
  }

  convertNext30MinuteInterval(timeSelected) {
    const remainder = (moment().tz(this.timeZone).minute() % 30) - 30; //add time zone-----
    const dateTime = moment(timeSelected).tz(this.timeZone).add(-remainder, "minutes").toDate(); // add time zone-----
    return dateTime;
  }

  private _filterResident(value) {
    const filterValue = value.toLowerCase();
    return this.residentData.filter((option) =>
      option.name.toLowerCase().includes(filterValue)
    );
  }

  // resident list
  async getServerData(event?: PageEvent) {
    this.residentPagiPayload.previousPageIndex = event.previousPageIndex;
    this.residentPagiPayload.pageIndex = event.pageIndex;
    this.residentPagiPayload.pageSize = event.pageSize;
    this.residentPagiPayload.length = event.length;
    this.residentPagiPayload.search = this.residentSearch;

    await this.getResidentUsersDataFunction();
  }

  async getAllPharmacy() {
    // get pharmacy list:
    const action = { type: 'GET', target: 'residents/pharmacy_list' };
    this.pharmacyPagiPayload['fac_id'] = this.facId;
    // const payload = {
    //   fac_id: this.facId,
    //   pageIndex: 0,
    //   pageSize: 10,
    //   search: this.pharmacySearch
    // };
    const result = await this.apiService.apiFn(
      action,
      this.pharmacyPagiPayload
    );
    this.pharmacyList = await result['data']['_pharmacy'].map(function (obj) {
      const rObj = {};
      rObj['value'] = obj.name;
      rObj['key'] = obj._id;
      rObj['pharmacy_number'] = obj.phone_numbers;
      return rObj;
    });
    this.totalPharmacyCount = result['data']['_count'];
    // console.log('this.pharmacyList---->', this.pharmacyList);
  }

  async getAdministeredList() {
    // get administered list:
    const action = { type: 'GET', target: 'residents/get_administered_list' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.administeredList = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['value'] = obj.name;
      rObj['key'] = obj._id;
      return rObj;
    });
    // console.log('this.administeredList---->', this.administeredList);
    this.medicationForm.controls.administered_by.patchValue(
      this.administeredList[0].key
    );
  }

  async getAllPrescriberList() {
    // get prescriber (doctors) list:
    const action = { type: 'GET', target: 'residents/prescriber_list' };
    // const payload = {
    //   fac_id: this.facId,
    //   pageIndex: 0,
    //   pageSize: 10,
    //   search: this.prescribedSearch
    // };
    this.physicianPagiPayload['fac_id'] = this.facId;
    let result = await this.apiService.apiFn(action, this.physicianPagiPayload);
    result['data']['_doctors'] = result['data']['_doctors'].map((item) => {
      return {
        ...item,
        name:
          item && item.first_name && item.last_name
            ? item.title + ' ' + item.first_name + ' ' + item.last_name
            : '-',
      };
    });
    console.log("Prescribers list-----",result['data']);
    this.prescriberList = await result['data']['_doctors'].map(function (item) {
      const obj = {};
      obj['value'] = item.name;
      obj['key'] = item._id;
      obj['dea_number'] = item.dea_number;
      obj['medical_profession_type'] = item.medical_profession_type ? item.medical_profession_type : '';
      return obj;
    });
    this.totalPrescriberCount = result['data']['_count'];
    // console.log('this.prescriberList---->', result['data']);
  }

  async onChange(file) {
    this.commonService.setLoader(true);
    this.file = file.files[0];
    this.fileName = this.file.name;
    let base64;
        await this.getBase64(this.file).then((b: any)=> {
          base64 = (b ? b.split('data:application/pdf;base64,'): null);
        });
        const action = { type: 'POST', target: 'residents/upload_order_file' };
        const payload = { 
          mimeType: ".pdf",
          fac_id: this.facId,
          fileName: this.file.name,
          base64: base64[1],
          tagId: '',
        };
        let result : any = await this.apiService.apiFn(action, payload);

        this.commonService.setLoader(false);
        if(result && result['data']){
          console.log(result);
          this.fileUrl = result['data'] && result['data'].fileUrl ? result['data'].fileUrl : '';
          this.thumbnailUrl = result['data'] && result['data'].thumbnailUrl ? result['data'].thumbnailUrl : '';
          this.medicationForm.controls.order_id.patchValue(result['data']._id);
          this.labOrderForm.controls.order_id.patchValue(result['data']._id);
          this.miscOrderForm.controls.order_id.patchValue(result['data']._id);
          this.viewPdf = true;
          this.toastr.success("File Uploaded Successfully");
        }
        else {
          this.toastr.error(result.message);
        }
  }

  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  async getAllTestingDeviceList() {
    const action = { type: 'POST', target: 'device/get' };
    const payload = {
      fac_id: this.facId,
      pageIndex: 0,
      pageSize: 50,
      search: this.testingDeviceSearch
    };
    // this.physicianPagiPayload['fac_id'] = this.facId;
    let result = await this.apiService.apiFn(action, payload);
    result['data']['_devices'] = result['data']['_devices'].map((item) => {
      return {
        ...item,
        name: (item && item.name) ? item.name  : ''
      };
    });
    console.log("Prescribers list-----",result['data']['_devices']);
    this.testingDeviceList = await result['data']['_devices'].map(function (item) {
      const obj = {};
      obj['value'] = item.name;
      obj['key'] = item._id;
      return obj;
    });
    this.totalPrescriberCount = result['data']['_count'];
    // console.log('this.prescriberList---->', result['data']);
  }

  async getAllSymptomsList() {
    const action = {
      type: 'GET',
      target: 'symptoms',
    };
    const pagiPayload = this.symptomPagiPayload;
    let result = await this.apiService.apiFn(action, pagiPayload);
    result['data']['_symptoms'] = result['data']['_symptoms'].map((item) => {
      return {
        ...item,
          name: item.name,
          is_isolation: item.is_isolation ? 'Yes' : 'No',
          isolation_days: item.is_isolation ? item.isolation_days : '--',
          order: item.order
      };
    });
    this.symptomsList = await result['data']['_symptoms']
    this.totalSymptomsCount = result['data']['_count'];
  }

  async getAllPrescriptionList() {
    // get prescription list:
    const action = {
      type: 'GET',
      target: 'residents/prescriber_medicine_list',
    };
    // this.pagiPayload = {
    //   length: 0,
    //   pageIndex: 0,
    //   pageSize: 10,
    //   previousPageIndex: 0,
    //   search: this.prescriptionSearch,
    //   sort: { active: 'name', direction: 'asc' },
    // };
    this.drugPagiPayload['sort'] = { active: 'name', direction: 'asc' };
    const result = await this.apiService.apiFn(action, this.drugPagiPayload);
    this.prescriptionList = await result['data']['_prescribedMedication'].map(
      function (item) {
        const obj = {};
        obj['value'] =
          item.name +
          ' ' +
          item.suffix_name +
          ' ' +
          '( ' +
          item.non_suffix_name +
          ' )' +
          ' ' +
          item.strength.toFixed(2) +
          ' ' +
          item.unit.split('/')[0] +
          ' ' +
          item.dosage_form;
        obj['temp_value'] =
          item.name +
          ' ' +
          item.suffix_name +
          ' ' +
          '( ' +
          item.non_suffix_name +
          ' )' +
          ' ' +
          item.strength.toFixed(2) +
          ' ' +
          item.unit.split('/')[0];
        obj['key'] = item._id;
        obj['ndc'] = item.ndc;
        obj['unit'] = item.unit;
        obj['route'] = item.route;
        obj['strength'] = item.strength.toFixed(2);
        obj['isNarcotics'] = item.isNarcotics;
        obj['dosageForm'] = item.dosage_form;
        return obj;
      }
    );
    if (this.selectedPrescription && this.selectedPrescription.length) {
      this.prescriptionList.push(this.selectedPrescription[0]);
    }
    this.totalDrugCount = result['data']['_count'];
    // console.log('this.drugOffset---->', this.drugOffset);
    // console.log('this.totalDrugCount---->', this.totalDrugCount);
    // console.log('this.prescriptionList----->', this.prescriptionList);
  }

  async getMedicationDurationList() {
    // get medication duration list (Early morning):
    const action = { type: 'GET', target: 'residents/medication_duration' };
    this.pagiPayload = {
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: '',
      sort: { active: 'name', direction: 'asc' },
    };
    const result = await this.apiService.apiFn(action, this.pagiPayload);
    this.medicationDurationList = await result['data'].map(function (item) {
      const obj = {};
      obj['value'] = item.name;
      obj['key'] = item._id;
      obj['isChecked'] = false;
      return obj;
    });
    const index = this.medicationDurationList.findIndex(
      (item) => item.value === 'As Needed'
    );
    const data = this.medicationDurationList.splice(index, 1);
    this.medicationDurationList.push(data[0]);
    // console.log('this.medicationDurationList---->', this.medicationDurationList);
  }

  async getAllVitalsList() {
    // get cares vitals list:
    const action = { type: 'GET', target: 'cares/vitals' };
    this.pagiPayload = {
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.prescriptionSearch,
      sort: { active: 'name', direction: 'asc' },
    };
    const result = await this.apiService.apiFn(action, this.pagiPayload);
    this.vitalsList = await result['data'].map(function (item) {
      const obj = {};
      obj['value'] = item.name;
      obj['key'] = item._id;
      obj['isChecked'] = false;
      return obj;
    });
    // console.log('this.vitalsList---->', this.vitalsList);
  }

  async getResidentPrimaryPharmacy() {
    // get resident primary pharmacy data:
    const action = { type: 'POST', target: 'residents/primary_pharmacy' };
    const payload = { resident_id: this.residentId };
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['data'] && result['data'].length) {
      // console.log('result data------>', result['data']);
      this.residentPrimaryPharmacy = await result['data'].map(function (item) {
        const rObj = {};
        rObj['value'] = item.name;
        rObj['key'] = item._id;
        rObj['pharmacy_number'] = item.phone_numbers;
        return rObj;
      });
      // console.log('this.residentPrimaryPharmacy---->', this.residentPrimaryPharmacy);
      this.medicationForm.controls.pharmacy_id.patchValue(
        this.residentPrimaryPharmacy[0].key
      );
      const data = this.residentPrimaryPharmacy[0].pharmacy_number.filter(
        (item) => {
          return item.name === 'Fax';
        }
      );
      if (data && data.length) {
        this.pharmacyFaxNumber = data[0].value;
      }
    }
  }

  async getResidentPrimaryPhysician() {
    // get resident primary physician data:
    const action = { type: 'POST', target: 'residents/primary_physician' };
    const payload = { resident_id: this.residentId };
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['data'] && result['data'].length) {
      result['data'] = result['data'].map((item) => {
        return {
          ...item,
          name:
            item && item.title && item.first_name && item.last_name
              ? item.title + ' ' + item.first_name + ' ' + item.last_name
              : '-',
        };
      });
      this.residentPrimaryPhysician = await result['data'].map(function (item) {
        const obj = {};
        obj['value'] = item.name;
        obj['key'] = item._id;
        obj['dea_number'] = item && item.dea_number ? item.dea_number : '';
        return obj;
      });
      // console.log('this.residentPrimaryPhysician---->', this.residentPrimaryPhysician);
      this.medicationForm.controls.prescribed_by.patchValue(
        this.residentPrimaryPhysician[0].key
      );
      this.medicationForm.controls.deaNumber.patchValue(
        this.residentPrimaryPhysician[0].dea_number
      );
    }
  }

  // handler function that receives the updated date range object
  updateRange(range: Range) {
    const today_st = moment();
    const today_ed = moment();
    let sDate, eDate;
    const today_start = today_st.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const today_end = today_ed.set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 999,
    });
    if (range['startDate'] && range['startDate']['_d']) {
      range['startDate'] = range['startDate'].set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      sDate = moment(range['startDate']).format('YYYY-MM-DD');

      this.start_date = range['startDate']['_d'].getTime();
    } else {
      sDate = moment(today_start['_d']).format('YYYY-MM-DD');

      this.start_date = today_start['_d'].getTime();
    }
    if (range['endDate'] && range['endDate']['_d']) {
      range['endDate'] = range['endDate'].set({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
      });
      eDate = moment(today_start['_d']).format('YYYY-MM-DD');

      this.end_date = range['endDate']['_d'].getTime();
    } else {
      eDate = moment(today_end['_d']).format('YYYY-MM-DD');

      this.end_date = today_end['_d'].getTime();
    }
    if (eDate === sDate) {
      this.datevalidation = true;
    } else {
      this.datevalidation = false;
    }
  }

  async getAllMedicationSchedule() {
    // get medication schedule list
    const action = {
      type: 'GET',
      target: 'residents/medication_frequency_list',
    };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.medicationScheduleList = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['name'];
      robj['key'] = obj._id;
      return robj;
    });
    const dailySchedule = this.medicationScheduleList.filter((item) => {
      return item.value === 'Daily';
    });
    this.medicationForm.controls.medication_schedule.patchValue(
      dailySchedule[0].key
    );
  }

  changeISPRN(event) {
    this.enable_prn = event.checked;
  }

  changeISSupply(event) {
    this.enable_supply = event.checked;
  }

  changeIsGeneric(event) {
    this.isGeneric = event.checked;
  }

  changeIsTreatment(event) {
    this.isTreatment = event.checked;
  }

  changeAllowSubstitution(event) {
    this.allowSubstitution = event.checked;
  }

  changeBrandNameRequired(event) {
    this.brandNameRequired = event.checked;
    if (this.brandNameRequired) {
      this.medicationForm.controls.pharmacistNotes.patchValue(
        'Brand Medically Necessary '
      );
    } else {
      this.medicationForm.controls.pharmacistNotes.patchValue('');
    }
  }

  changeNeededStat(event) {
    this.neededStat = event.checked;
  }

  changeMedicationType(medType) {
    // console.log('medType----->', medType);
    if (medType === 'treatment') {
      this.isTreatment = true;
    } else {
      this.isTreatment = false;
    }
  }

  onChangeEvent(event, value) {
    if (value === 'quantity') {
      const frequencyCount =
        (this.selectedAdminstrationFrequency &&
          this.selectedAdminstrationFrequency.length) ||
        0;
      const baseValue =
        frequencyCount * Number(this.medicationForm.value.initialText);
      const daysCount = Number(this.medicationForm.value.quantity / baseValue);
      this.medicationForm.controls.days.patchValue(Number(daysCount));
    } else if (value === 'days') {
      const frequencyCounts =
        (this.selectedAdminstrationFrequency &&
          this.selectedAdminstrationFrequency.length) ||
        0;
      const baseValues =
        frequencyCounts *
        Number(this.medicationForm.value.initialText) *
        Number(this.medicationForm.value.days);
      this.medicationForm.controls.quantity.patchValue(Number(baseValues));
    } else if (value === 'initialText') {
      // console.log('value---->', value);
      const unitValue = this.selectedPrescription[0].unit.split('/');
      // console.log('unitValue---->', unitValue);
      // tslint:disable-next-line:max-line-length
      this.medicationForm.controls.dosage.patchValue(
        Number(this.medicationForm.value.initialText) *
          this.medicationForm.value.dosageStrength +
          ' ' +
          this.medicationForm.value.unit
      );
      // console.log('this.medicationForm.value.dosage--->', this.medicationForm.value.dosage);
      const frequencyCounts =
        (this.selectedAdminstrationFrequency &&
          this.selectedAdminstrationFrequency.length) ||
        0;
      const baseValues =
        frequencyCounts *
        Number(this.medicationForm.value.initialText) *
        Number(this.medicationForm.value.days);
      this.medicationForm.controls.quantity.patchValue(baseValues);
    } else if (value === 'insulinDose') {
      const insulinArr = this.medicationForm.value.insulinDataArray;
      if (insulinArr && insulinArr[0] !== undefined) {
        const lastArr = insulinArr[0];
        let doseValue = 0;
        insulinArr.forEach(element => {
          if (element.dose > doseValue) {
            doseValue = element.dose;
          }
        });
        this.medicationForm.controls.initialText.patchValue(doseValue);
        const frequencyCounts =
          (this.selectedAdminstrationFrequency &&
            this.selectedAdminstrationFrequency.length) ||
          0;
        const baseValues =
          frequencyCounts *
          Number(this.medicationForm.value.initialText) *
          Number(this.medicationForm.value.days);
        this.medicationForm.controls.quantity.patchValue(baseValues);
      }
    }
    // this.getSigText();
    this.getTotalQuantity();
  }

  onChangeFreqAndDosage(key, value) {
    // console.log('onChangeFreqAndDosage----->', key);
    if (key === 'initialText') {
      const frequencyCount =
        (this.selectedAdminstrationFrequency &&
          this.selectedAdminstrationFrequency.length) ||
        0;
      const baseValue = frequencyCount * Number(value);
      const daysCount = Number(this.medicationForm.value.quantity / baseValue);
      this.medicationForm.controls.days.patchValue(Number(daysCount));
    } else if (key === 'frequency') {
      const frequencyCounts = value;
      const baseValues =
        frequencyCounts *
        Number(this.medicationForm.value.initialText) *
        Number(this.medicationForm.value.days);
      this.medicationForm.controls.quantity.patchValue(baseValues);
    }
    // this.getSigText();
    this.getTotalQuantity();
  }

  getSigText() {
    let takeType = '';
    // tslint:disable-next-line:max-line-length
    // if (this.medicationForm.value.dosageForm && (this.medicationForm.value.dosageForm.includes('TABLET') || this.medicationForm.value.dosageForm.includes('CAPSULE'))) {
    //   if (this.medicationForm.value.dosage > 1) {
    //     this.dosageValue = this.dosageValue + 's';
    //   } else if (this.medicationForm.value.dosage <= 1) {
    //     if (this.dosageValue && this.dosageValue.length > 3) {
    //       this.dosageValue = this.dosageValue.substr(0, this.dosageValue.length - 1).toLowerCase();
    //     }
    //   }
    // }
    // tslint:disable-next-line:max-line-length
    if (
      this.medicationForm.value.dosageForm &&
      (this.medicationForm.value.dosageForm.includes('TABLET') ||
        this.medicationForm.value.dosageForm.includes('CAPSULE'))
    ) {
      takeType = 'by mouth';
    }
    let timeStr = 'time';
    if (
      this.selectedAdminstrationFrequency &&
      this.selectedAdminstrationFrequency.length > 1
    ) {
      timeStr = 'times';
    }
    // console.log('this.selectedAdminstrationFrequency.length---->', this.selectedAdminstrationFrequency.length, timeStr);
    // tslint:disable-next-line:max-line-length
    const sigText =
      this.medicationForm.value.initialText +
      ' ' +
      this.medicationForm.value.dosage +
      ' ' +
      this.dosageValue +
      ' ' +
      takeType +
      ' ' +
      this.selectedAdminstrationFrequency.length +
      ' ' +
      timeStr +
      ' per day for' +
      ' ' +
      this.medicationForm.value.days +
      ' ' +
      'days. Dispense' +
      ' ' +
      this.medicationForm.value.dosage *
        this.selectedAdminstrationFrequency.length *
        this.medicationForm.value.days +
      ' ' +
      this.dosageValue +
      '.';
    // console.log('sigText---->', sigText);
    // this.medicationForm.controls.sigText.patchValue(sigText);
  }

  getTotalQuantity() {
    // tslint:disable-next-line:max-line-length
    if (
      this.medicationForm.value.dosageForm &&
      (this.medicationForm.value.dosageForm.includes('TABLET') ||
        this.medicationForm.value.dosageForm.includes('CAPSULE'))
    ) {
      const value = this.medicationForm.value.dosageForm.split(',');
      this.dosageValue = value[0].toUpperCase();
      if (Number(this.medicationForm.value.initialText) > 1) {
        this.dosageValue = this.dosageValue + 'S';
      }
      // console.log('this.medicationForm.value.quantity--->', this.medicationForm.value.quantity);
      // console.log('this.dosageValue--->', this.dosageValue);
      if (this.medicationForm.value.quantity) {
        this.medicationForm.controls.totalQuantity.patchValue(
          this.medicationForm.value.quantity + ' ' + this.dosageValue
        );
      }
    } else {
      const value = this.medicationForm.value.dosageForm.split(',');
      this.dosageValue = value[0].toUpperCase();
      this.medicationForm.controls.totalQuantity.patchValue(
        this.medicationForm.value.quantity +
          ' ' +
          this.medicationForm.value.unit
      );
    }
  }

  async medicationSave(isValid) {
    // console.log('isValid--->', isValid);
    this.start = this.medicationForm.value.start_time;
    this.end = this.medicationForm.value.end_time;
    const writtenDate = moment(this.medicationForm.value.writtenDate).valueOf();

    if (!this.medicationForm.value.order_id) {
      return this.toastr.error('Please upload the order PDF..!');
    }

    if (!this.medicationForm.value.days) {
      return this.toastr.error('Kindly enter days..!');
    }

    if (this.isInsulin && this.isInsulinErr) {
       return this.toastr.error('High value should be greater then previous value or one of your high value is smaller then low value');
    }

    if (this.isNarcotics && !this.medicationForm.value.deaNumber) {
      return this.toastr.error('Kindly enter DEA number..!');
    }

    if (this.start && this.start !== '00:00') {
      this.start = moment(this.start).format('HH:mm');
    }

    if (this.end && this.end !== '23:59') {
      this.end = moment(this.end).format('HH:mm');
    }

    const time1 = this.start.split(':');
    const time2 = this.end.split(':');

    let start_date = moment(this.medicationForm.value.start_date).set({
      hour: time1[0],
      minute: time1[1],
      second: 0,
      millisecond: 0,
    });

    start_date = start_date;

    let end_date = moment(this.medicationForm.value.end_date).set({
      hour: time2[0],
      minute: time2[1],
      second: 0,
      millisecond: 0,
    });
    end_date = end_date;

    // if (time1[0] == time2[0] && time1[1] == time2[1]) {
    //     this.equalvalidation = true;
    //     isValid = false;
    //     this.endvalidationqual = false;
    //     this.minutevalid = false;
    //     this.endtimevalidation = false;
    // } else if ((time1[0] === time2[0]) && (time1[1] === time2[1])) {
    //     this.endvalidationqual = true;
    //     this.minutevalid = false;
    //     isValid = false;
    //     this.endtimevalidation = false;
    //     this.equalvalidation = false;
    // } else if (time1[0] === time2[0] && time1[1] > time2[1]) {
    //     this.minutevalid = true;
    //     this.endtimevalidation = true;
    //     isValid = false;
    //     this.equalvalidation = false;
    //     this.endvalidationqual = false;
    // } else if (time1[0] > time2[0]) {
    //     isValid = false;
    //     this.endtimevalidation = true;
    //     this.endvalidationqual = false;
    //     this.minutevalid = false;
    //     this.equalvalidation = false;
    // } else {
    //   this.endtimevalidation = false;
    //   this.endvalidationqual = false;
    //   this.minutevalid = false;
    //   this.equalvalidation = false;
    // }

    // const totalDays = Number(this.medicationForm.value.refills) * this.medicationForm.value.days;
    // const endDate = moment(start_date).add(totalDays, 'days').toDate();
    // const finalEndDate = moment(endDate).set({ hour: time2[0], minute: time2[1], second: 0, millisecond: 0 });
    const dosage = this.medicationForm.value.dosage.split(' ');
    // console.log('dosage---->', dosage , Number(dosage[0]))
    if (isValid) {
      this.commonService.setLoader(true);
      const user_Id = sessionStorage.getItem('user_Id');
      let medicationBody = {};
      // let daysCount = 0;
      // const quantityValue = Number(this.medicationForm.value.dosage) * this.medicationForm.value.days;
      // if (this.selectedAdminstrationFrequency && this.selectedAdminstrationFrequency.length) {
      //   daysCount = ( this.medicationForm.value.quantity / this.selectedAdminstrationFrequency.length );
      // } else {
      //   daysCount = this.medicationForm.value.quantity;
      // }
      // this.medicationForm.controls.quantity.patchValue(quantityValue);
      medicationBody = {
        administered_by: this.medicationForm.value.administered_by,
        dosageValue: this.medicationForm.value.dosage,
        dosage: Number(this.medicationForm.value.initialText),
        // start_date: Number(start_date['_d']),
        // end_date: Number(finalEndDate['_d']),
        // days: this.medicationForm.value.days,
        // days: this.medicationForm.value.days || 0,
        // expire_date: Number(this.medicationForm.value.expire_date),
        instructions: this.medicationForm.value.instructions,
        medication_name: this.medicationForm.value.medication_name,
        medication_schedule: this.medicationForm.value.medication_schedule,
        medicationDurations: this.selectedAdminstrationFrequency,
        refills: Number(this.medicationForm.value.refills),
        ndc: this.medicationForm.value.ndc,
        pharmacy_id: this.medicationForm.value.pharmacy_id,
        order_id: this.medicationForm.value.order_id,
        prescribed_by: this.medicationForm.value.prescribed_by,
        // prescription_number: this.medicationForm.value.prescription_number,
        route: this.medicationForm.value.route,
        // is_prn: this.enable_prn,
        // is_supply: this.enable_supply,
        resident_id: this.residentId,
        userId: user_Id,
        vitals: this.selectedVitals,
        // start_time: Number((Number(start_date['_d'].getHours()) + '.' + Number(start_date['_d'].getMinutes()))),
        // end_time: Number((Number(end_date['_d'].getHours()) + '.' + Number(end_date['_d'].getMinutes()))),
        fac_id: this.facId,
        drug_id: this.medicationForm.value.drug_id,
        // quantity: this.medicationForm.value.quantity || 0,
        file_url: this.fileUrl,
        // isTreatment: this.isTreatment,
        // isGeneric: this.isGeneric,
        isNarcotics: this.isNarcotics,
        pharmacy_fax_number: this.pharmacyFaxNumber,
        // new fields
        allowSubstitution: this.allowSubstitution,
        brandNameRequired: this.brandNameRequired,
        neededStat: this.neededStat,
        pharmacistNotes: this.medicationForm.value.pharmacistNotes,
        notes_for_care: this.medicationForm.value.notes_for_care,
        progress_note: this.medicationForm.value.progress_note,
        writtenDate: writtenDate,
        dosageCount: this.medicationForm.value.initialText,
        dosageForm: this.medicationForm.value.dosageForm,
        deaNumber: this.medicationForm.value.deaNumber,
        totalQuantity: this.medicationForm.value.totalQuantity,
        isReceived: false,
        selectedDays: this.alternateDays ? [] : this.selectedWeeklyFrequency,
        scaleValues: this.medicationForm.value.insulinDataArray,
        alternateDays: this.alternateDays,
        // sig: this.medicationForm.value.sigText,
      };

      // if (this.isTreatment) {
      //   medicationBody['reason'] = this.medicationForm.value.reason;
      // }

      if (this.medicationId) {
        medicationBody['_id'] = this.medicationId;
      }

      if (this.medicationForm.value.days) {
        medicationBody['days'] = this.medicationForm.value.days;
      }

      if (this.medicationForm.value.quantity) {
        medicationBody['quantity'] = this.medicationForm.value.quantity;
      }

      // update medication batch id wise
      // console.log('this.medicationBatchId---->', this.medicationBatchId);
      // if (this.medicationBatchId) {
      //   medicationBody['medicationBatchId'] = this.medicationBatchId;
      // }

      const action = {
        type: 'POST',
        target: 'residents/add_medication',
      };
      const payload = { medicationData: [medicationBody] };
      // console.log('medication payload--------->', JSON.stringify(payload));
      // this.commonService.setLoader(false);
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.commonService.setLoader(false);
        // this.router.navigate(['/medications']);
        this.router.navigate([
          '/residents/form',
          this._aes256Service.encFnWithsalt(this.residentId),
        ]);
      }
    } else {
      return this.toastr.error('Kindly enter all fields..!');
    }
  }

  async labOrderSave(isValid) {

    
    //this.start = this.labOrderForm.value.start_time;
    //this.end = this.labOrderForm.value.end_time;
    // const writtenDate = moment(this.labOrderForm.value.writtenDate).valueOf();

    // if (this.start && this.start !== '00:00') {
    //   this.start = moment(this.start).format('HH:mm');
    // }

    // if (this.end && this.end !== '23:59') {
    //   this.end = moment(this.end).format('HH:mm');
    // }

    if (!this.labOrderForm.value.order_id) {
      return this.toastr.error('Please upload the order PDF..!');
    }

    const fac = JSON.parse(sessionStorage.getItem('authReducer'));
    this.facility = fac['fac_id'];

    this.labOrderForm.value.order_time = moment(this.labOrderForm.value.order_date).valueOf();

    this.labOrderForm.value.fac_id = this.facility;
    this.labOrderForm.value.order_date = moment(this.labOrderForm.value.order_date).valueOf();
    this.labOrderForm.value.exam_date = moment(this.labOrderForm.value.exam_date).valueOf();
    this.labOrderForm.value.is_lab_processor_in_building = this.is_lab_processor_in_building;
    this.labOrderForm.value.order_recieved_by = this.orderReceivedBy ? this.orderReceivedBy : 'fax';

    console.log("Lab order Form----->",this.labOrderForm.value);
    
        this.commonService.setLoader(true);
        let labOrderBody = {};
        labOrderBody = {
          order_id: this.labOrderForm.value.order_id,
          fac_id: this.labOrderForm.value.fac_id,
          resident_id: this.residentId,
          prescriber: this.labOrderForm.value.prescriber,
          order_recieved_by: this.labOrderForm.value.order_recieved_by,
          lab_kind: this.labOrderForm.value.lab_kind,
          lab_type: this.labOrderForm.value.lab_type,
          testing_device: this.labOrderForm.value.testing_device,
          order_date: this.labOrderForm.value.order_date,
          order_time: this.labOrderForm.value.order_time,
          exam_date: this.labOrderForm.value.exam_date,
          exam_time: 1638880512241,
          is_lab_processor_in_building: this.is_lab_processor_in_building,
          lab_processor_building: this.labOrderForm.value.lab_processor_building || null,
          lab_processor: this.labOrderForm.value.lab_processor || null,
          // start_time: Number((Number(start_date['_d'].getHours()) + '.' + Number(start_date['_d'].getMinutes()))),
          // end_time: Number((Number(end_date['_d'].getHours()) + '.' + Number(end_date['_d'].getMinutes()))),
          
          result_copy: this.recipientCopy,
          notes: this.labOrderForm.value.notes,
          progress_note: this.labOrderForm.value.progress_note,
          is_stat: this.labOrderForm.value.is_stat,
          order_document: this.fileUrl,
          order_document_thumbnail: this.thumbnailUrl,
          mimeType: this.labOrderForm.value.mimeType,
          fileName: this.fileName,
          base64: this.labOrderForm.value.base64
        };

        console.log("Lab order Body Values", labOrderBody);

        const action = {
          type: 'POST',
          target: 'servicePlan/add_lab_order'
        };
        const payload = labOrderBody;
        console.log('lab order payload--------->', JSON.stringify(payload));
        // this.commonService.setLoader(false);
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          this.toastr.success("Lab order created successfully");
          this.commonService.setLoader(false);
          // this.router.navigate(['/medications']);
          if(!this.addAnother){
            this.router.navigate(['/residents/form', this._aes256Service.encFnWithsalt(this.residentId)]);
          }
          
        }
  }

  async miscOrderSave(isValid) {

    const fac = JSON.parse(sessionStorage.getItem('authReducer'));
    this.facility = fac['fac_id'];

    if (!this.miscOrderForm.value.order_id) {
      return this.toastr.error('Please upload the order PDF..!');
    }

    this.miscOrderForm.value.order_time = moment(this.miscOrderForm.value.order_date).valueOf();

    this.miscOrderForm.value.fac_id = this.facility;
    this.miscOrderForm.value.order_date = moment(this.miscOrderForm.value.order_date).valueOf();
    this.miscOrderForm.value.exam_date = moment(this.miscOrderForm.value.exam_date).valueOf();
    
    this.miscOrderForm.value.order_recieved_by = this.orderReceivedBy ? this.orderReceivedBy : 'fax';

    console.log("Misc order Form----->",this.miscOrderForm.value);
    
        this.commonService.setLoader(true);
        let miscOrderBody = {};
        miscOrderBody = {
          order_id: this.miscOrderForm.value.order_id,
          fac_id: this.miscOrderForm.value.fac_id,
          resident_id: this.residentId,
          prescriber: this.miscOrderForm.value.prescriber,
          order_recieved_by: this.miscOrderForm.value.order_recieved_by,
          order_date: this.miscOrderForm.value.order_date,
          order_time: this.miscOrderForm.value.order_time,
          start_time: 1638880512241,
          notes: this.miscOrderForm.value.notes,
          progress_note: this.miscOrderForm.value.progress_note,
          is_self_managed: this.miscOrderForm.value.is_self_managed,
          is_PRN: this.miscOrderForm.value.is_PRN,
          is_display_on_eMAR: this.miscOrderForm.value.is_display_on_eMAR,
          is_stat: this.miscOrderForm.value.is_stat,
          order_document: this.fileUrl,
          order_document_thumbnail: this.thumbnailUrl,
          mimeType: this.miscOrderForm.value.mimeType,
          fileName: this.fileName,
          base64: this.miscOrderForm.value.base64
        };

        console.log("Misc order Body Values", miscOrderBody);

        const action = {
          type: 'POST',
          target: 'servicePlan/add_miscellaneous_order'
        };
        const payload = miscOrderBody;
        // this.commonService.setLoader(false);
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          this.commonService.setLoader(false);
          console.log("Result of misc order--->",result);
          if(result['data']){
            this.toastr.success("Order Submitted successfully");
            if(!this.addAnother){
              this.router.navigate(['/residents/form', this._aes256Service.encFnWithsalt(this.residentId)]);
            }
            let careData:any[] = []; 
            const misc_order_id = result['data']['_id'];
            const carepart = {
              org_id: this.organization,
              fac_id: this.miscOrderForm.value.fac_id,
              resident_id: this.residentId,
              resident_note: '',
              care_id: this.selectedCare.care_id,
              care_note: this.selectedCare.note,
              assigned_to: null,
              start_date: moment(this.careScheduleOrder.start_date).tz(this.userLocalTimeZone, true).valueOf(),
              start_time: moment(this.careScheduleOrder.start_time).tz(this.userLocalTimeZone, true).valueOf(),
              end_date: this.careScheduleOrder.end_date ? moment(this.careScheduleOrder.end_date).tz(this.userLocalTimeZone, true).valueOf() : this.careScheduleOrder.end_date,
              repeat: this.careScheduleOrder.repeat,
              month_date: this.careScheduleOrder.month_date ? this.careScheduleOrder.month_date : undefined,
              repeat_checkoption: this.careScheduleOrder.repeat_checkoption,
              repeat_on: this.careScheduleOrder.repeat_on,
              repeat_tenure: this.careScheduleOrder.repeat_tenure,
              repeat_option: this.careScheduleOrder.repeat_option,
              duration: this.careScheduleOrder,
              shiftNumber: (this.careScheduleOrder.shiftNumber) ?  this.careScheduleOrder.shiftNumber : null,
              care_type: this.careScheduleOrder.careType,
              misc_order_id: misc_order_id 
            };
            console.log("Care Data--->",carepart);
            careData.push(carepart);
            // await this.apiService.apiFn({ type: 'POST', target: 'schedule/add' }, careData)
            //       .then((result: any) => {
            //         console.log("After create",result);
            //         if (result['status']) {
            //           this.toastr.success('Schedule care added successfully!');
            //           this.router.navigate(['/scheduling']);
            //         } else {
            //           this.commonService.setLoader(false);
            //           this.toastr.error('Unable to save Schedule care. Please check again!');
            //         }
            //       })
            //       .catch((error) => this.toastr.error('Unable to save Schedule care. Please check again!'));
          }
          // this.router.navigate(['/medications']);
          
        }
  }

  async selectPrescription(key) {
    const prescriptionValues = this.prescriptionList.filter(
      (item) => item.key === key
    );
    this.selectedPrescription = prescriptionValues;
    // console.log('prescriptionValues---->', prescriptionValues);
    this.getDosageArrayList(prescriptionValues[0].value);
    this.medicationForm.controls.ndc.patchValue(
      prescriptionValues[0].ndc + ' '
    );
    this.medicationForm.controls.route.patchValue(
      prescriptionValues[0].route + ' '
    );
    this.medicationForm.controls.drug_id.patchValue(key);
    this.medicationForm.controls.dosageForm.patchValue(
      prescriptionValues[0].dosageForm
    );
    this.medicationForm.controls.dosageStrength.patchValue(
      Number(prescriptionValues[0].strength)
    );
    const value = prescriptionValues[0].dosageForm.split(',');
    this.dosageValue = value[0].toLowerCase();
    // console.log('dosageValue---->', this.dosageValue);

    const unitValue = prescriptionValues[0].unit.split('/');
    // console.log('unitValue---->', unitValue);

    const dosageUnit = unitValue[unitValue.length - 1];
    // console.log('dosageUnit---->', dosageUnit);

    let matchValue = dosageUnit.match(/(\.\d+)/);
    // console.log('matchValue point---->', matchValue);

    const unit = unitValue[unitValue.length - 1].match(/[a-zA-Z]+/g);
    // console.log('unit---->', unit);
    this.medicationForm.controls.unit.patchValue(unit);
    const frequencyCounts =
      (this.selectedAdminstrationFrequency &&
        this.selectedAdminstrationFrequency.length) ||
      0;
    const initialText = this.medicationForm.value.initialText
      ? this.medicationForm.value.initialText
      : 1;
    const daysValue = this.medicationForm.value.days
      ? this.medicationForm.value.days
      : 1;

    let baseValues;
    if (matchValue !== null) {
      const mValue = matchValue[0] * 1;
      this.medicationForm.controls.dosageStrength.patchValue(mValue);

      baseValues =
        frequencyCounts *
        Number(initialText) *
        Number(daysValue) *
        matchValue[0];
      this.medicationForm.controls.dosage.patchValue(
        matchValue[matchValue.length - 1] + ' ' + this.medicationForm.value.unit
      );
      this.medicationForm.controls.quantity.patchValue(baseValues);
      // tslint:disable-next-line:max-line-length
      this.medicationForm.controls.dosage.patchValue(
        initialText * this.medicationForm.value.dosageStrength +
          ' ' +
          this.medicationForm.value.unit
      );
    } else {
      matchValue = dosageUnit.match(/(\d+)/);
      // console.log('matchValue---> digit', matchValue);
      if (matchValue === null) {
        baseValues = frequencyCounts * Number(initialText) * Number(daysValue);
        this.medicationForm.controls.quantity.patchValue(baseValues);
        this.medicationForm.controls.dosage.patchValue(
          initialText * this.medicationForm.value.dosageStrength +
            ' ' +
            this.medicationForm.value.unit
        );
      } else if (matchValue != null && matchValue[0] != 1) {
        // console.log('matchValue  not null--->', matchValue[0]);
        this.medicationForm.controls.dosageStrength.patchValue(
          Number(matchValue[0])
        );
        baseValues =
          frequencyCounts *
          Number(initialText) *
          Number(daysValue) *
          matchValue[0];
        // this.medicationForm.controls.dosage.patchValue(matchValue[matchValue.length - 1] + ' ' + unitValue[0]);
        this.medicationForm.controls.quantity.patchValue(baseValues);
        this.medicationForm.controls.dosage.patchValue(
          initialText * this.medicationForm.value.dosageStrength +
            ' ' +
            this.medicationForm.value.unit
        );
      } else if (matchValue != null && matchValue[0] == 1) {
        this.medicationForm.controls.unit.patchValue(unitValue[0]);
        baseValues = frequencyCounts * Number(initialText) * Number(daysValue);
        this.medicationForm.controls.quantity.patchValue(baseValues);
        this.medicationForm.controls.dosage.patchValue(
          initialText * this.medicationForm.value.dosageStrength +
            ' ' +
            unitValue[0]
        );
      } else {
        // console.log('matchValue---> else', matchValue[0]);
      }
    }

    // if (prescriptionValues[0].dosageForm.includes('TABLET') || prescriptionValues[0].dosageForm.includes('CAPSULE')) {
    //   const value = prescriptionValues[0].dosageForm.split(',');
    //   this.medicationForm.controls.totalQuantity.patchValue(baseValues + ' ' + value[0]);
    // } else {
    //   const value = prescriptionValues[0].dosageForm.split(',');
    //   this.dosageValue = value[0].toLowerCase();
    // }
    this.dosageUnit = dosageUnit;
    // this.medicationForm.controls.dosage.patchValue(prescriptionValues[0].ndc + ' ' + unitValue[0]);
    this.drugStrength = prescriptionValues[0].strength;
    this.isNarcotics = prescriptionValues[0].isNarcotics;

    this.getTotalQuantity();
    // this.getSigText();
  }

  getDosageArrayList(data) {
    // console.log('data---->', data)
    // if (data.includes('TABLET')) {
    //   this.dosageList  = [
    //                         {value: '0.5'},
    //                         {value: '1'},
    //                         {value: '1.5'},
    //                         {value: '2'},
    //                         {value: '2.5'},
    //                         {value: '3'}
    //                      ];
    //   this.showDosageInput = false;
    //   this.showTabletList = true;
    // } else if (data.includes('CAPSULE')) {
    //   this.showDosageInput = false;
    //   this.showTabletList = false;
    //   this.dosageList = [{value: '1'}, {value: '2'}, {value: '3'}];
    // } else {
    //   this.showDosageInput = true;
    // }
    // if (this.showDosageInput === this.showDosageInput) {
    //   this.medicationForm.controls.dosage.patchValue(1);
    // }
    // this.getSigText();
    // console.log('this.dosageList--->', this.dosageList);

    // console.log('data---->', data);
    const frmArray = this.medicationForm.get('insulinDataArray') as FormArray;
    frmArray.clear();
    if (data.includes('Insulin')) {
      this.isInsulin = true;
      this.showNew = true;
      // no. of freq * days * dose(last value of dose) for insulin
      this.addInsulinData();
      this.medicationForm.controls.initialText.patchValue(1);
    } else {
      this.medicationForm.value.insulinDataArray = this.fb.array([]);
      this.isInsulinErr = false;
      this.isInsulin = false;
      this.showNew = false;
    }
  }

  changeInsulinDose(event) {}

  insulinHighValueCheck(event) {
    const insulinArr = this.medicationForm.value.insulinDataArray;
    if (insulinArr && insulinArr.length) {
      const obj = insulinArr[0];
      if (Number(obj.high) < Number(obj.low)) {
        this.isInsulinErr = true;
        return this.toastr.error('High value should be greater then low value');
      } else {
        this.isInsulinErr = false;
      }
    }
    if (insulinArr && insulinArr.length > 1) {
      const obj = insulinArr[1];
      if (Number(obj.high) > Number(event.target.value)) {
        this.isInsulinErr = true;
        return this.toastr.error(
          'High value should be greater then previous value'
        );
      } else {
        this.isInsulinErr = false;
      }
    }
  }

  async onRemoveInsulinData(i) {
    if (i != undefined && i != null) {
      this.insulinDoseList.splice(i, 1);
    } else {
      this.showNew = false;
    }
  }

  selectPharmacy(pharmData) {
    // console.log('pharmData---->', pharmData);
    const data = pharmData.pharmacy_number.filter((item) => {
      return item.name === 'Fax';
    });
    // console.log('data---->', data);
    if (data && data.length) {
      this.pharmacyFaxNumber = data[0].value;
    }
  }

  selectPhysician(physicianData) {
    // console.log('physicianData---->', physicianData);
    if (physicianData.dea_number) {
      this.medicationForm.controls.deaNumber.patchValue(
        physicianData.dea_number
      );
    }
  }

  selectTestingDevice(deviceData) {
    // console.log('physicianData---->', physicianData);
    if (deviceData._id) {
      this.labOrderForm.controls.testing_device.patchValue(
        deviceData._id
      );
    }
  }

  bindDataToDropdown(data) {
    if (data) {
      // if drug data is not there is drop down
      if (data.drug) {
        const index = this.prescriptionList.findIndex(
          (item) => item.key === data.drug._id
        );
        if (index === -1) {
          const obj = {};
          obj['value'] =
            data.drug.name +
            ' ' +
            data.drug.suffix_name +
            ' ' +
            '( ' +
            data.drug.non_suffix_name +
            ' )' +
            ' ' +
            data.drug.strength.toFixed(2) +
            ' ' +
            data.drug.unit.split('/')[0] +
            ' ' +
            data.drug.dosage_form;
          obj['temp_value'] =
            data.drug.name +
            ' ' +
            data.drug.suffix_name +
            ' ' +
            '( ' +
            data.drug.non_suffix_name +
            ' )' +
            ' ' +
            data.drug.strength.toFixed(2) +
            ' ' +
            data.drug.unit.split('/')[0];
          obj['key'] = data.drug._id ? data.drug._id : null;
          obj['ndc'] = data.drug.ndc ? data.drug.ndc : '';
          obj['route'] = data.drug.route ? data.drug.route : '';
          obj['strength'] = data.drug.strength ? data.drug.strength : '';
          obj['dosageForm'] = data.drug.dosage_form;
          this.prescriptionList.push(obj);
        }
        // const value = data.drug.dosage_form.split(',');
        this.dosageValue = data.drug.dosage_form.toLocaleLowerCase();
      }

      // if doctor data is not there is drop down
      if (data.doctors) {
        const index = this.prescriberList.findIndex(
          (item) => item.key === data.doctors._id
        );
        if (index === -1) {
          const obj = {};
          obj['value'] =
            data.doctors.title +
            ' ' +
            data.doctors.first_name +
            data.doctors.last_name;
          obj['key'] = data.doctors._id ? data.doctors._id : null;
          this.prescriberList.push(obj);
        }
      }

      // if pharmacy data is not there is drop down
      if (data.pharmacy) {
        const index = this.pharmacyList.findIndex(
          (item) => item.key === data.pharmacy._id
        );
        if (index === -1) {
          const obj = {};
          obj['value'] = data.pharmacy.name ? data.pharmacy.name : '-';
          obj['key'] = data.pharmacy._id ? data.pharmacy._id : null;
          this.pharmacyList.push(obj);
        }
      }
    }
  }

  selectResidentName(key, facId) {
    this.medicationForm.controls.resident_id.patchValue(key);
    // this.medicationForm.controls.fac_id.patchValue(facId);
  }

  cancelForm() {
    // if (this.residentId && this.residentId !== undefined) {
    //   this.router.navigate(['/medications/list', this._aes256Service.encFnWithsalt(this.residentId)]);
    // } else {
    //   this.router.navigate(['/medications']);
    // }
    this.router.navigate([
      '/residents/form',
      this._aes256Service.encFnWithsalt(this.residentId),
    ]);
  }

  startDateChangeEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    if (this.selectedMedicationDate) {
      this.selectedMedicationDate['startDate'] = event.value;
      this.selectedMedicationDate['minDateEnd'] = event.value;
      this.selectedMedicationDate['minExpireDate'] = event.value;
    }
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpha(key);
    return result;
  }

  selectVitals(vitalData) {
    // console.log('frequevitalDatancyData--->', vitalData);
    const isChecked = !vitalData.isChecked;
    this.vitalsList.forEach((ele) => {
      if (ele.value === vitalData.value) {
        ele.isChecked = isChecked;
      }
    });
    let index = this.selectedVitals.findIndex((item) => item === vitalData.key);
    if (index === -1) {
      this.selectedVitals.push(vitalData.key);
    } else {
      this.selectedVitals.splice(index, 1);
    }
    // console.log('this.selectedVitals------>', this.selectedVitals);
  }

  async selectAdministrationFrequency(frequencyData) {
    // console.log('frequencyData--->', frequencyData.value);
    const isChecked = !frequencyData.isChecked;

    if (frequencyData.value === 'As Needed') {
      this.medicationDurationList.forEach((ele) => {
        if (ele.value === frequencyData.value) {
          ele.isChecked = isChecked;
        } else {
          ele.isChecked = false;
        }
      });
    } else {
      this.medicationDurationList.forEach((ele) => {
        if (ele.value === frequencyData.value) {
          ele.isChecked = isChecked;
        }
        if (ele.value === 'As Needed') {
          ele.isChecked = false;
        }
      });
    }

    if (frequencyData.value === 'As Needed') {
      this.freqValue = true;
      this.selectedAdminstrationFrequency = [];
      this.selectedAdminstrationFrequency.push(frequencyData.key);
    } else {
      if (this.freqValue) {
        this.freqValue = false;
        this.selectedAdminstrationFrequency = [];
        this.selectedAdminstrationFrequency.push(frequencyData.key);
      } else {
        const index = this.selectedAdminstrationFrequency.findIndex(
          (item) => item === frequencyData.key
        );
        if (index === -1) {
          this.selectedAdminstrationFrequency.push(frequencyData.key);
        } else {
          this.selectedAdminstrationFrequency.splice(index, 1);
        }
      }
    }

    await this.onChangeFreqAndDosage(
      'frequency',
      this.selectedAdminstrationFrequency.length
    );
    // console.log('this.selectedAdminstrationFrequency------>', this.selectedAdminstrationFrequency);
  }

  async selectWeeklyFrequency(frequencyData) {
    // console.log('frequencyData--->', frequencyData.value);
    const isChecked = !frequencyData.isChecked;

    if (frequencyData.value === 'Every Other Day') {
      this.weeklyDaysArr.forEach((ele) => {
        if (ele.value === frequencyData.value) {
          ele.isChecked = isChecked;
        } else {
          ele.isChecked = false;
        }
      });
    } else {
      this.weeklyDaysArr.forEach((ele) => {
        if (ele.value === frequencyData.value) {
          ele.isChecked = isChecked;
        }
        if (ele.value === 'Every Other Day') {
          ele.isChecked = false;
        }
      });
    }

    if (frequencyData.value === 'Every Other Day') {
      this.alternateDays = true;
      this.selectedWeeklyFrequency = [];
      this.selectedWeeklyFrequency.push(frequencyData.value);
    } else {
      if (this.alternateDays) {
        this.alternateDays = false;
        this.selectedWeeklyFrequency = [];
        this.selectedWeeklyFrequency.push(frequencyData.value);
      } else {
        const index = this.selectedWeeklyFrequency.findIndex(
          (item) => item === frequencyData.value
        );
        if (index === -1) {
          this.selectedWeeklyFrequency.push(frequencyData.value);
        } else {
          this.selectedWeeklyFrequency.splice(index, 1);
        }
      }
    }
    // console.log(
    //   'this.selectedWeeklyFrequency------>',
    //   this.selectedWeeklyFrequency
    // );
  }

  // async selectWeeklyFrequency(frequencyData) {
  //   const isChecked = !frequencyData.isChecked;
  //   this.weeklyDaysArr.forEach((ele) => {
  //     if (ele.value === frequencyData.value) {
  //       ele.isChecked = isChecked;
  //     }
  //   });

  //   const index = this.selectedWeeklyFrequency.findIndex(
  //     (item) => item === frequencyData.value
  //   );
  //   if (index === -1) {
  //     this.selectedWeeklyFrequency.push(frequencyData.value);
  //   } else {
  //     this.selectedWeeklyFrequency.splice(index, 1);
  //   }
  //   // console.log(
  //   //   'this.selectedWeeklyFrequency------>',
  //   //   this.selectedWeeklyFrequency
  //   // );
  // }

  async getResidentUsersDataFunction() {
    const action = {
      type: 'GET',
      target: 'residents/list_resident_medication',
    };
    this.residentPagiPayload['listType'] = 'dropdownView';
    this.residentPagiPayload['fac_id'] = this.facId;
    const payload = this.residentPagiPayload;
    const result = await this.apiService.apiFn(action, payload);

    this.residentData = await result['data']['_residents'].map(function (item) {
      const obj = {};
      obj['value'] = item.last_name + ' ' + item.first_name;
      obj['key'] = item._id;
      obj['facId'] = item.facility[0].fac;
      return obj;
    });
  }

  async filterResident(event) {
    this.residentSearch = event;
    await this.getServerData(this.residentPagiPayload);
    this.filteredResidents =
      this.medicationForm.controls.resident_id.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterResident(value))
      );
  }

  async filterPrescription(event) {
    this.prescriptionSearch = event;
    await this.getAllPrescriptionList();
    this.filteredOptions =
      this.medicationForm.controls.medication_name.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterPrescription(value))
      );
  }

  openAddForm(formValue) {
    this.formName = formValue;
  }

  async openAddModalPopUp() {
    // Pop Up Open
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '500px';
    dialogConfig.panelClass = 'add-pharmacy-doctor-class';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addForm, dialogConfig);

    this.addDoctorPharmacyForm.controls.fac_id.patchValue(this.facId);
  }

  async addData(isValid) {
    this.commonService.setLoader(true);
    if (isValid) {
      const user_Id = sessionStorage.getItem('user_Id');
      let body = {};
      body = {
        name: this.addDoctorPharmacyForm.value.name,
        resident_id: this.residentId,
        userId: user_Id,
        fac_id: this.addDoctorPharmacyForm.value.fac_id,
      };
      let action = {};
      if (this.formName === 'pharmacy') {
        action = {
          type: 'POST',
          target: 'residents/add_pharmacy',
        };
      } else {
        action = {
          type: 'POST',
          target: 'residents/add_prescriber',
        };
      }

      const payload = { data: body };
      // console.log('payload--------->', payload);
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.dialogRefs.close();
        this.addDoctorPharmacyForm.reset();
        this.commonService.setLoader(false);
        this.getAllPharmacy();
        this.getAllPrescriberList();
      }
    }
  }

  cancelAddForm() {
    this.addDoctorPharmacyForm.reset();
    this.dialogRefs.close();
  }

  addPharmacyPopup() {
    // console.log('add pharmacy');
    this.medicationForm.controls.pharmacy_id.patchValue('');
    // console.log('prescribed_by---->', this.medicationForm.controls.pharmacy_id.value);
    this.dialogConfig.width = '700px';
    this.dialogConfig.autoFocus = false;
    // this.dialogConfig.disableClose = true;
    const dialogRef = this.dialog.open(AddPharmacyComponent, this.dialogConfig);
  }

  addPhysicianPopup() {
    this.medicationForm.controls.prescribed_by.patchValue('');
    this.labOrderForm.controls.prescriber.patchValue('');
    this.miscOrderForm.controls.prescriber.patchValue('');
    // console.log('prescribed_by---->', this.medicationForm.controls.prescribed_by.value);
    console.log('add physician');
    let dialogConfig = new MatDialogConfig();
    dialogConfig.width = '600px';
    dialogConfig.height = '400px';
    dialogConfig.panelClass = 'physician_dialog';
    const dialogRef = this.dialog.open(AddPhysicianComponent, dialogConfig);
  }

  addTestingDevicePopup() {
    this.labOrderForm.controls.testing_device.patchValue('');
    // console.log('prescribed_by---->', this.medicationForm.controls.prescribed_by.value);
    console.log('add device');
    let dialogConfig = new MatDialogConfig();
    dialogConfig.width = '600px';
    dialogConfig.height = '300px';
    const dialogRef = this.dialog.open(AddTestingDeviceComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res:any) => {
      if(res && res.status){
        this.getAllTestingDeviceList();
      }
    });
  }

  weekDayTextInForm(data) {
    console.log("Weekly------", data);
    const checkData = [];
    for (const [key, value] of Object.entries(data)) {
      if (value) checkData.push((key.charAt(0).toUpperCase() + key.slice(1)));
    }
    let str = (checkData).toString();
    if (checkData.length > 1) {
      str = str.replace(checkData[checkData.length - 2] + ',', checkData[checkData.length - 2] + ' and ');
    }
    return str.replace(/,/g, ', ');
  }

  addRecipientPopup() {
    //this.medicationForm.controls.prescribed_by.patchValue('');
    this.labOrderForm.controls.result_copy.patchValue('');
    // console.log('prescribed_by---->', this.medicationForm.controls.prescribed_by.value);
    console.log('add recipient');
    this.dialogConfig.width = '600px';
    this.dialogConfig.autoFocus = false;
    // this.dialogConfig.disableClose = true;
    this.dialogConfig.height = '300px';
    this.dialogConfig.panelClass = 'recipient_dialog';
    this.dialogConfig.data = { selectedPhysicians: this.selectedPhysicians, selectedPharmacies: this.selectedPharmacies, selectedHospitals: this.selectedHospitals }
    const dialogRef = this.dialog.open(AddRecipientComponent, this.dialogConfig);
    dialogRef.afterClosed().subscribe((res:any) => {
      if(res && res.selectedPharmacies){
        this.selectedPharmacies = res.selectedPharmacies;
        this.sendCopyCount = res.selectedPharmacies.length ? res.selectedPharmacies.length : 0;
        res.selectedPharmacies.forEach(p => {
          this.recipientCopy.push(p);
        });
      }
      if(res && res.selectedPhysicians){
        this.selectedPhysicians = res.selectedPhysicians;
        this.sendCopyCount = (this.sendCopyCount) + (res.selectedPhysicians.length ? res.selectedPhysicians.length : 0);
        res.selectedPhysicians.forEach(p => {
          this.recipientCopy.push(p);
        }); 
      }
      if(res && res.selectedHospitals){
        this.selectedHospitals = res.selectedHospitals;
        this.sendCopyCount = (this.sendCopyCount) + (res.selectedHospitals.length ? res.selectedHospitals.length : 0); 
        res.selectedHospitals.forEach(p => {
          this.recipientCopy.push(p);
        }); 
      }
    })
  }

  async addAnotherLabOrder(){
    this.addAnother = true;
    await this.labOrderSave(true);
    //this.labOrderForm.reset();
    this.labOrderForm.controls.progress_note.patchValue('');
    this.labOrderForm.controls.notes.patchValue('');
    // this.labOrderForm.value.fac_id = this.facility;
    // this.labOrderForm.value.order_date = moment(this.labOrderForm.value.order_date).valueOf();
    // this.labOrderForm.value.exam_date = moment(this.labOrderForm.value.exam_date).valueOf();
    // this.labOrderForm.value.is_lab_processor_in_building = this.is_lab_processor_in_building;
    // this.labOrderForm.value.order_recieved_by = this.orderReceivedBy ? this.orderReceivedBy : 'fax';
    // this.labOrderForm.value.testing_device = this.orderReceivedBy ? this.orderReceivedBy : 'fax';
  }

  // async addAnotherMiscOrder(){
  //   this.addAnother = true;
  //   await this.miscOrderSave(true);
  //   this.miscOrderForm.reset();
  // }

  addSymptomPopup() {
    this.labOrderForm.controls.symptoms.patchValue('');
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'repeatDialog';
    dialogConfig.closeOnNavigation = true;
    const dialogRef = this.dialog.open(AddSymptomComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((res:any) => {
      if(res && res.success){
        this.getAllSymptomsList();
      }
    });
  }

  addDrugPopup() {
    this.medicationForm.controls.medication_name.patchValue('');
    // console.log('prescribed_by---->', this.medicationForm.controls.prescribed_by.value);
    // console.log('add drug');
    // console.log('add physician');
    this.dialogConfig.width = '700px';
    this.dialogConfig.autoFocus = false;
    // this.dialogConfig.disableClose = true;
    this.dialogConfig.maxHeight = '835px';
    this.dialogConfig.panelClass = 'physician_dialog';
    const dialogRef = this.dialog.open(AddDrugComponent, this.dialogConfig);
    // console.log('dialogRef---->', dialogRef);
  }

  async filterPhysicianData(event) {
    // console.log('filterPhysicianData event----->', event.target.value);
    const physicianSearch = this.prescribedSearch.trim();
    // console.log('physicianSearch--->', physicianSearch, physicianSearch.length);
    this.physicianPagiPayload['search'] = physicianSearch;
    await this.getAllPrescriberList();
  }

  async filterSymptomData(event) {
    const symptomSearch = this.symptomSearch.trim();
    console.log('symptomSearch--->', symptomSearch, symptomSearch.length);
    this.symptomPagiPayload['search'] = symptomSearch;
    await this.getAllSymptomsList();
  }

  async filterPharmacyData(event) {
    // console.log('filterPharmacyData event----->', event.target.value);
    const pharmacySearch = this.pharmacySearch.trim();
    // console.log('pharmacySearch--->', pharmacySearch, pharmacySearch.length);
    this.pharmacyPagiPayload['search'] = pharmacySearch;
    await this.getAllPharmacy();
  }

  async filterDrugData(event) {
    // console.log('filterDrugData event----->', event.target.value);
    // this.prescriptionSearch = this.prescriptionSearch.trim();
    const prescriptionSearch = this.prescriptionSearch.trim();
    // console.log('prescriptionSearch--->', prescriptionSearch, prescriptionSearch.length);
    this.drugPagiPayload['search'] = prescriptionSearch;
    await this.getAllPrescriptionList();
  }

  async openSelectDropdown(event) {
    // console.log('openSelectDropdown event--->', event);
    if (event === true) {
      // this.prescriptionSearch = '';
      this.drugPagiPayload['search'] = '';
      // this.medicationForm.controls.medication_name.patchValue('');
      await this.getAllPrescriptionList();
    }
  }

  async getNextPhysicianBatch() {
    this.physicianOffset = this.physicianOffset + 10;
    // console.log(
    //   'this.physicianOffset--->',
    //   this.physicianOffset,
    //   this.totalPrescriberCount
    // );
    if (this.physicianOffset < this.totalPrescriberCount) {
      this.physicianPagiPayload['pageSize'] =
        this.physicianPagiPayload['pageSize'] + 10;
      this.physicianPagiPayload['pageIndex'] = 0;
      //this.physicianPagiPayload['search'] = this.prescribedSearch;
      await this.getAllPrescriberList();
    }
    // console.log('physicianOffset---->', this.physicianOffset);
  }

  async getNextSymptomsBatch() {
    this.symptomOffset = this.symptomOffset + 10;
    console.log('this.symptomOffset--->', this.symptomOffset, this.totalSymptomsCount);
    if (this.symptomOffset < this.totalSymptomsCount) {
      this.symptomPagiPayload['pageSize'] = this.symptomPagiPayload['pageSize'] + 10;
      this.symptomPagiPayload['pageIndex'] = 0;
      this.symptomPagiPayload['search'] = this.symptomSearch;
      await this.getAllSymptomsList();
    }
    // console.log('physicianOffset---->', this.physicianOffset);
  }

  async getNextPharmacyBatch() {
    // console.log('getNextPharmacyBatch----->');
    this.pharmacyOffset = this.pharmacyOffset + 10;
    if (this.pharmacyOffset < this.totalPharmacyCount) {
      this.pharmacyPagiPayload['pageSize'] =
        this.pharmacyPagiPayload['pageSize'] + 10;
      this.pharmacyPagiPayload['pageIndex'] = 0;
      this.pharmacyPagiPayload['search'] = this.pharmacySearch;
      await this.getAllPharmacy();
    }
    // console.log('physicianOffset---->', this.pharmacyOffset);
  }

  async getNextDrugBatch() {
    // console.log('getNextDrugBatch----->');
    this.drugOffset = this.drugOffset + 10;
    if (this.drugOffset < this.totalDrugCount) {
      this.drugPagiPayload['pageSize'] = this.drugPagiPayload['pageSize'] + 10;
      this.drugPagiPayload['pageIndex'] = 0;
      this.drugPagiPayload['search'] = this.prescriptionSearch;
      await this.getAllPrescriptionList();
    }
    // console.log('drugOffset---->', this.drugOffset);
  }

  zoomOut() {
    if (this.zoomValue > 0) {
      this.zoomValue -= 0.5;
    } else {
      this.toastr.warning('You have zoomed out to max level.', 'Zoom Out');
    }
  }

  zoomIn() {
    if (this.zoomValue < 4) {
      this.zoomValue += 0.5;
    } else {
      this.toastr.warning('You have zoomed in to max level.', 'Zoom In');
    }
  }
}
