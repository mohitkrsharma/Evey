import {AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
// import { MatDialog, MatDialogConfig } from '@angular/material';
import {Subscription} from 'rxjs';
import {DateAdapter, MAT_DATE_FORMATS, MatOption, MatSelect, MatSelectChange, MatTableDataSource} from '@angular/material';
import {ApiService} from './../../../shared/services/api/api.service';
import {CommonService} from './../../../shared/services/common.service';
import {SocketService} from './../../../shared/services/socket/socket.service';
import {ConstantsService} from './../../../shared/services/constants.service';
import {Aes256Service} from './../../../shared/services/aes-256/aes-256.service';
import {FileUploader} from 'ng2-file-upload';
import {environment} from './../../../../environments/environment';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {EmergencyContactComponent} from './../../../shared/modals/emergency-contact/emergency-contact.component';
import {OpenTasksComponent} from './../../../shared/modals/open-tasks/open-tasks.component';
import * as moment from 'moment';
import {AlertComponent} from '../../../shared/modals/alert/alert.component';
import {CdkDrag, CdkDragMove, CdkDropList, CdkDropListGroup, moveItemInArray} from '@angular/cdk/drag-drop';
import {ViewportRuler} from '@angular/cdk/overlay';
//diagnosis component
import {DiagnosisComponent} from './../diagnosis/diagnosis.component';
import {AddPharmacyComponent} from 'src/app/shared/modals/add-pharmacy/add-pharmacy.component';
import {AddPhysicianComponent} from 'src/app/shared/modals/add-physician/add-physician.component';
import {StatusTransferredComponent} from 'src/app/shared/modals/status-transferred/status-transferred.component';
import {TopnavComponent} from '../../components/topnav/topnav.component';
import {OnFacilityChangeComponent} from 'src/app/shared/modals/on-facility-change/on-facility-change.component';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from '@angular/material-moment-adapter';
import {MAT_DATE_LOCALE} from 'mat-range-datepicker';
import {take} from 'rxjs/operators';
import { HttpClient, HttpResponse } from '@angular/common/http';

export interface PeriodicElement {
  care_name: string;
  care_id: string;
  care_note: string;
}
export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY'
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }
  ]
})
export class FormComponent implements OnInit, OnDestroy, AfterViewInit {
  isnotesrequired = false;
  isNoIsolation = false;
  isStatusChanged = false;
  isViewVitalHistory: boolean = false;
  isalltabidisable: boolean = false;
  floorFinalList;
  medicationData;
  iconError = '';
  iconSelected = '';
  uploader: FileUploader;
  uploader1: FileUploader;
  paramId: Boolean = false;
  emailNotMatch: Boolean = false;
  disable_checkin: Boolean = false;
  disable_2am_checkin: Boolean = false;
  SSNAlreadyExist: Boolean = false;
  BillingIdAlreadyExist: Boolean = false;
  @ViewChild('callConfirmDialog', {static: true}) callConfirmDialog: TemplateRef<any>;
  @ViewChild('confirmStatus', {static: true}) confirmStatus: TemplateRef<any>;
  @ViewChild('isolationData', {static: true}) isolationData: TemplateRef<any>;
  @ViewChild('openCareData', {static: true}) openCareData: TemplateRef<any>;
  @ViewChild('primaryPhysicianPopup', {static: true}) primaryPhysicianPopup: TemplateRef<any>;
  @ViewChild('primaryPharmacyPopup', {static: true}) primaryPharmacyPopup: TemplateRef<any>;
  @ViewChild(DiagnosisComponent, {static: true}) diagnoComponent;
  @ViewChild('confirmStatusChange', {static: true}) confirmStatusChange: TemplateRef<any>;
  @ViewChild(CdkDropListGroup, {static: true}) listGroup: CdkDropListGroup<CdkDropList>;
  @ViewChild(CdkDropList, {static: true}) placeholder: CdkDropList;
  @ViewChild('matOptionRef', {static: true}) matOptionRef: MatOption;
  @ViewChild('matselectPharmacy', {static: true}) matselectPharmacy: any;
  @ViewChild('matselectPhysician', {static: true}) matselectPhysician: any;
  @ViewChild('allEmergencyContactPopup', {static: true}) allEmergencyContactPopup: TemplateRef<any>;
  @ViewChild(TopnavComponent, {static: true}) topnavComponent: TopnavComponent;

  dialogConfig = new MatDialogConfig();
  diseasesSelected = []
  allergySelected = []
  dialogRefs: any;
  sanitize_care_notes = [];
  isolation_end_date: any = '';
  isolation_start_date: any = '';
  diseaseData: any = [];
  pre_diseases: any = [];
  displayData = [];
  oldValueIsolation: any;
  oldValueSetIsolation: any;
  oldValueTestingStatus: any;
  carelistData; carelist;
  tempcareImg;
  tempcareData;
  tempcareDataCare;
  ispending = false;
  showfaclist: boolean;
  isResidentProfileTab: boolean = false;
  ismultifac: Boolean = false;
  multifacility: any;
  multiorg: any;
  multicare: any;
  care;
  note;
  careEditlist: any = [];
  careEditnote: any;
  careEditname: any;
  assignNFClist: any = [];
  deletednfc: any = [];
  isolationForm: any = {
    custom_isolation: '',
    is_out_of_fac: '',
    isolation_apply_come_to_fac: ''
  };
  openCareForm: any = {
    care_name: '',
    care_note: '',
  };
  searchCtrl = '';
  careSearch = '';
  orgSearch = '';
  staSearch = '';
  secSearch = '';
  carSearch = '';
  nfcSearch = '';
  genderSearch = '';
  admitTypeSearch = '';
  phoneSearch = '';
  emailSearch = '';
  emailAddressSearch = ''
  prevSelectedFac = ''

  show = 'Home'
  show_home = false
  show_mobile = false

  show_email = 'Email'
  show_mainEmail = false
  show_otherEmail = false

  isStatusFacility = true;

  contact_type = [{ name: 'Mobile' }];
  email_type = [{ name: 'Email' }, { name: 'Other' }];
  dataSource = new MatTableDataSource([]);
  residentCareList: PeriodicElement[];
  residentActivityList = [];

  emergency_form_status;
  residentId;
  encResidentId;
  shownIndexOfEmergency = [];
  shownIndexOfcareNotes = [];
  public target: CdkDropList;
  public targetIndex: number;
  public source: CdkDropList;
  public sourceIndex: number;
  public dragIndex: number;
  public activeContainer;

  residentForm: FormGroup;
  viewmode = false;
  organiz = []; faclist; floorlist; zonelist; seclist; currentFaclist;
  statusData; carelevelData; secondarycarelevelData
  alllevels = false;
  nfc;
  nfc1 = '';
  // data = {
  //   priority: '',
  //   subject: '',
  //   message: '',
  //   files: []
  // }
  diseaseFetched: any;
  statusOldVal;
  resident: any = {
    first_name: '',
    last_name: '',
    middle_name: '',
    nick_name: '',
    gender: '',
    admin_type: '',
    social_security_no: '',
    dob: '',
    age: '',
    organization: '',
    facility: '',
    current_org: '',
    current_fac: '',
    admit_date: '',
    floor: '',
    sector: '',
    resident_status: 'Active',
    updated_status: '',
    care_level: '',
    secondary_care_level: [],
    billingId: '',
    email: '',
    confirmemail: '',
    home_phone: '',
    mobile_phone: '',
    is_out_of_fac: false,
    is_out_of_room: false,
    hospice: false,
    dnr: false,
    two_am_checkin: false,
    pre_diseases: [],
    custom_isolation: "",
    files: [],
    other_email: "",
    care_name: '',
    care_note: '',
    nfc: [],
    disease_id: [],
    allergy_id: [],
    phone_numbers: [],
    emails: [{ id: Math.random(), name: 'Email', value: '' }]
  };

  PhoneNumberTypeSearch = ''
  type_of_contact = [{ name: 'Mobile', value: '' }, { name: 'Home', value: '' }, { name: 'Work', value: '' }, { name: 'Email', value: '' }, { name: 'Other', value: '' }]
  email_type_list = [{ name: 'Email', value: '' }, { name: 'Other', value: '' }]
  buttonName = 'Edit';
  emergencyArr = [];
  nfclist = [];
  showAll = true;
  editAll = false;
  editButton = false;
  maxDate = new Date();
  residentMaxDate = new Date(new Date().setFullYear(this.maxDate.getFullYear() - 40));
  residentMinDate = new Date(new Date().setFullYear(this.maxDate.getFullYear() - 110));
  minDate = new Date(this.resident.dob);
  emergency = {
    isprimary: false,
    emergency_first_name: '',
    emergency_last_name: '',
    emergency_relation: '',
    emergency_email: '',
    emergency_confirmemail: '',
    emergency_home_phone: '',
    emergency_mobile_phone: '',
    emergency_notes: '',
  };
  health_data = {
    temperature: '',
    respiration: '',
    oxygen: '',
    weight: '',
    height: '',
    blood_sugar: '',
    pulse: '',
    blood_pressure: '',
    bmi: null
  };
  blood_pressure = {
    first_input: '',
    second_input: ''
  }
  open_cares;
  height_ft;
  nfc_org;
  nfc_fac;
  inches;
  orderCount = 0;
  unlinkOrderCount = 0;
  medicationOrderCount = 0;
  unProcessedMedicationOrderCount = 0;
  genders = [
    { name: 'Male' }, { name: 'Female' }, { name: 'Non-binary' }, { name: 'Transgender' }, { name: 'Intersex' }
  ]
  admit_types = [
    { name: 'Long Term' }, { name: 'Short Term' }
  ]

  public testing_status_array = [
    { label: 'None', value: 'None' },
    { label: 'In-Progress', value: 'In-Progress' },
    { label: 'Positive', value: 'Positive' },
    { label: 'Negative', value: 'Negative' }
  ];

  public covid_isolation_array = [
    { label: 'No Isolation', value: '' },
    { label: 'Stop Isolation', value: 'stop' },
    { label: '7 days', value: 7 },
    { label: '10 days', value: 10 },
    { label: '14 days', value: 14 },
    { label: 'Indefinite', value: 'Indefinite' }
  ];

  public out_of_fac_options = [
    { label: 'In building', value: false },
    { label: 'Out of building', value: true }
  ];
  oldFacility: string;
  oldStatus: string;
  oldSSN: string;
  oldBillingId: string;
  captionName;
  residentFullName;
  disable_secondary: true;
  old_is_out_of_fac: boolean;
  filteredTemperature;
  check_temp_min: any;
  residentName: any;
  check_temp_max: any;
  check_pul_min: any;
  check_pul_max: any;
  check_oxy_min: any;
  check_oxy_max: any;
  check_res_min: any;
  check_res_max: any;
  check_bp_min: any ;
  check_bp_max: any ;
  check_bs_min: any;
  check_bs_max: any;
  dnrStatus: any = '#B9BABC';
  start_fall_time: any;
  end_fall_time: any;
  checkFall: boolean = false;
  categories;
  subscription: Subscription = new Subscription();
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  ground_options = [
    {
      label: 'On-grounds',
      values: [
        {
          label: 'No Isolation',
          value: 'on-ground/no-isolation'
        },
        {
          label: '7 days Isolation',
          value: 'on-ground/7day-isolation'
        }
      ]
    },
    {
      label: 'Off-grounds',
      values: [
        {
          label: 'No Isolation',
          value: 'off-ground/no-isolation'
        },
        {
          label: '7 days Isolation',
          value: 'off-ground/7day-isolation'
        },
        {
          label: '10 days Isolation',
          value: 'off-ground/10day-isolation'
        },
        {
          label: '14 days Isolation',
          value: 'off-ground/14day-isolation'
        },
        {
          label: 'Indefinite',
          value: 'off-ground/Indefinite'
        }
      ]
    }
  ];

  //Pharmacy data
  assignedPharmacy = [];
  pharmacy = '';
  pharmacySearch = '';
  pharmacylist = [];
  allfetchedPharmacy = [];

  first_time_popup_pharmacy = true;
  from_pharmacy_name = '';
  to_pharmacy_name = '';
  single_pharmacy_name;
  //Physician data
  assignedPhysician = [];
  dignosePhysician = [];
  physician = '';
  physicianSearch = '';
  physicianlist = [];

  first_time_popup = true;
  from_physician_name = '';
  to_physician_name = '';
  single_physician_name = '';
  schedules = [];
  displayedColumns = ["care", "start_date", "end_date", "start_time", "duration", "repeat", "repeat_tenure", "repeat_on"]
  selectedCares: any = {
    care_id: '',
    note: '',
    user_id: '',
    subCare: false,
  };
  assignedInsurance = [
    {
      medicare: 'Part A',
      medicare_beneficiary_id: 'RS9999',
      mco_medicare_name: 'Company 1',
      insurance_name: 'INSR123',
      insurance_policy_no: 'IO5879',
    },
    {
      medicare: 'Part B',
      medicare_beneficiary_id: 'RS4878',
      mco_medicare_name: 'Company 2',
      insurance_name: 'INSR789',
      insurance_policy_no: 'IO5487',
    },
    {
      // medicare:'Part C',
      medicare_beneficiary_id: 'RS9090',
      mco_medicare_name: 'Company 1',
      insurance_name: 'INR999',
      insurance_policy_no: 'IO9595',
    },
    {
      medicare: 'Part D',
      medicare_beneficiary_id: 'RS8989',
      mco_medicare_name: 'Company 4',
      insurance_name: 'INSR123',
      insurance_policy_no: 'IO5879',
    },
    {
      medicare: 'Part A and B',
      medicare_beneficiary_id: 'RS666',
      mco_medicare_name: 'Company 2',
      insurance_name: 'IN99',
      insurance_policy_no: 'IO5879',
    },
    {
      medicare: 'Part A and D',
      medicare_beneficiary_id: 'RS1111',
      mco_medicare_name: 'Company 5',
      insurance_name: 'IN5968',
      insurance_policy_no: 'IO5879',
    },
    {
      medicare: 'Part A,B and D',
      medicare_beneficiary_id: 'RS9999',
      mco_medicare_name: 'Company 1',
      insurance_name: 'INSR123',
      insurance_policy_no: 'IOJKO9',
    },
  ];

  isFromResident = true;
  showSelectOptionPharmacy = true;
  showSelectOptionPhysician = true;

  //var declaration for Insurance by Kaushik
  addsMedCoverage: any[] = [
    { _id: "1", value: 'medicare-num', viewValue: 'Medicare (HIC) Number' },
    { _id: "2", value: 'medicaid-num', viewValue: 'Medicaid Number' },
    { _id: "3", value: 'mco-medicaid-num', viewValue: 'MCO Medicaid Number' },
    { _id: "4", value: 'mco-medicade-num', viewValue: 'MCO Medicade Number' },
    { _id: "5", value: 'medical-report-num', viewValue: 'Medical Record Number' },
    { _id: "6", value: 'part-d-policy-num', viewValue: 'Part D Policy Number' },
  ];

  payers: any[] = [
    { _id: '1', payer: 'MCO Elderly Waver (AmeriGroup)', type: 'Medicaid', rank: 'Secondary' },
    { _id: '2', payer: 'MCO Elderly Waver (AmeriHealth)', type: 'Medicaid', rank: 'Secondary' },
    { _id: '3', payer: 'MCO Elderly Waver (lowa Total Care)', type: 'Medicaid', rank: 'Secondary' },
    { _id: '4', payer: 'MCO Elderly Waver (United HealthCare)', type: 'Medicaid', rank: 'Secondary' },
    { _id: '5', payer: 'Medicaid Elderly Waver (Services)', type: 'Medicaid', rank: 'Secondary' },
    { _id: '6', payer: 'Flu Shot Payer', type: 'Outpatient', rank: 'Secondary' },
    { _id: '7', payer: 'AL Private Pay (Elderly Waver)', type: 'Private', rank: 'Secondary' },
    { _id: '8', payer: 'Prepaid HealthCare Days', type: 'Private', rank: 'Secondary' },
    { _id: '9', payer: 'Private Pay', type: 'Private', rank: 'Secondary' },
    { _id: '10', payer: 'Private Pay STS', type: 'Private', rank: 'Secondary' },
    { _id: '11', payer: 'Section 8 Payer', type: 'Private', rank: 'Secondary' }
  ];

  addedCoverages: any[] = [];
  payersColumns: string[] = ['payer', 'type', 'rank', 'action'];
  payersDataSource = new MatTableDataSource<any>();
  addedPayers: any[] = [];
  selectedIndexVal = new FormControl(0);
  organization; facility;
  residentInsurance: any = {
    company_name: '',
    policy_number: '',
    payers_and_insurance_id: ''
  }
  skillNursingFacility: any[] = [];
  assitedLivingFacility: any[] = [];
  coverageSearch: any = '';
  payerSearch: any = '';
  @ViewChild('medicalCoverage', {static: true}) medicalCoverage: MatSelect;
  @ViewChild('payr', {static: true}) payr: MatSelect;
  utc_timezone = '';
  activeClassIndex = null;
  selectedCareData;
  phoneArr: any[] = [{ id: Math.random(), name: 'Mobile', value: '' }];
  selectedCareList: any = [];
  timezone;
  contactApiCalled = true;
  orderApiCalled = true;
  facilityId;
  addResident = false;
  medAndTreatApiCalled = true;
  diagnosisApiCalled = true;
  careNotesApiCalled = true;
  scheduleApiCalled = true;
  payersAndInsuranceApiCalled = true;
  activityApiCalled = true;
  org_id: any;
  fac_id: any;
  apiPayload: { org_id: any; fac_id: any; care_type: string[]; };
  primaryPhysicianID: any;
  primaryPharmacyId: any;
  ordersCount: any;
  isDoneClicked = false;
  respHandle400;
  roomData = {
    room_id: '',
    room_name: ''
  };
  constructor(
    private apiService: ApiService,
    private router: Router,
    public route: ActivatedRoute,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private socketService: SocketService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService,
    private viewportRuler: ViewportRuler
  ) {
    this.target = null;
    this.source = null;

    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
    this.scrollWindow();
    this.apiService.Error400Response.subscribe((res: any) => {
      console.log(res,'=-=-=-=-resulte emnit')
      this.respHandle400 = res;
      if(this.respHandle400){
        console.log(this.resident['resident_status']);
        this.resident.resident_status = this.statusOldVal;
      }
    })
  }



  async ngOnInit() {
    this._commonService.contentdata.pipe(
      take(1)
    ).subscribe((data: any) => {
      this.resident.organization = data.org;
      this.changeOrg(data.org, 0, data.fac);
    });

    // this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
    //   this.timezone = contentVal.timezone;
    //   this.facilityId = contentVal.fac;
    //   if (this.facilityId && this.route.params['_value']['id']) {
    //     await this.getResSchedules(this.route.params['_value']['id']);
    //   }
    // });
    // this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
    //   this._commonService.setLoader(true);
    //   if (contentVal.org && contentVal.fac) {
    //     this.organization = contentVal.org;
    //     this.facility = contentVal.fac;
    //   }
    // });
    // console.log('this.topnavComponent.orgfac().org::::::',this.topnavComponent.orgfac().org)
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
    this.scrollWindow()
    this.dataSource = new MatTableDataSource(this.residentCareList);
    if (!this._commonService.checkPrivilegeModule('residents', 'view')) {
      this.router.navigate(['/']);
    }
    this.subscription = await this._commonService.contentdata.subscribe(async (contentVal: any) => {
      this._commonService.setLoader(true);
      if (contentVal.org && contentVal.fac) {
        // console.log(contentVal)
        sessionStorage.setItem('org_id', contentVal.org);
         sessionStorage.setItem('fac_id', contentVal.fac);
        this.nfc_org = contentVal.org;
        this.nfc_fac = contentVal.fac;
        // await this.getAllcaresData();
        // await this.loadCarelevel();
        this.socketService.joinRoomWithfac(contentVal.fac, "RESI");
        this.socketService.joinRoomWithfac(contentVal.fac, "TRACK");
        this.socketService.joinRoomWithfac(contentVal.fac, "MASTER");
        this.functionForListeningResidentEvents();
        this.utc_timezone = contentVal.timezone;
        if (this.route.params['_value']['id']) {
          this.isalltabidisable = false;
          // this.getOrgFacility(this.nfc_org);
        } else {
          this.isalltabidisable = true;
        }
      }
    });

    this.apiPayload = {
      org_id: sessionStorage.getItem('org_id'),
      fac_id: sessionStorage.getItem('fac_id'),
      care_type: ["1", "3"],
    }
    // await this.loadDiseases();
    // await this.fileUploader();
    // await this.fileUploader1();
    this.statusData = this._constantsService.residentStatus();

    // await this.loadCarelevel();
    if (!this.route.params['_value']['id']) {
      this.resident.two_am_checkin = true;
    this.statusData = this._constantsService.residentStatus();
        await this.loadCarelevel();
        await this.unassignenfcs();
      // get organization list:]

      // await this.apiService.apiFn({ type: 'GET', target: 'organization/orglist' }, {})
      //   .then((result: any) => {
      //     if (result && result['status'] == true) {
      //       this.organiz = result.data;
      //     }
      //   });
      // .map(function (obj) {
      // console.log(this.organiz);
      // await this.setintialOrgAndFac(this.nfc_org, this.nfc_fac)
    }
    // this._commonService.setLoader(false);
    // get organization list:
    const action = { type: 'GET', target: 'organization/orglist' };
      const payload = {};
      const result = await this.apiService.apiFn(action, payload);
      if (result && result['data']) {
        this.organiz = await result['data']; // .map(function (obj) {
        // console.log('this.organiz----->', this.organiz);
      }

    if (this.route.params['_value']['id']) {
      // console.log('update---------------->')
      // this._commonService.setLoader(true);

      this.encResidentId = this.route.params['_value']['id'];
      // await this.getAssignedPhysician()
      this.viewmode = true;
      // this._commonService.setLoader(true);
      this.assignNFClist = [];
      this.paramId = true;
      await this.getProfileDetails();

    } else {
      this.resident.two_am_checkin = true;
      await this.changeStatus('Pending', 0);
      this.ispending = true

    }
    // this.getResidentMedicationOrderData(this.oldFacility, this.residentId);

    // this._commonService.setLoader(true);
    // await this.getPharmacy();
    // await this.getPhysician();


    // await this.getAllCaresIm();
    // this.getAllcares();
    // await this.getResidentUnlinkedLinkOrderData(this.oldFacility, this.residentId);
    // await this.getResidentMedicationOrderData(this.oldFacility, this.residentId);
    // this._commonService.setLoader(false);

    /*this.subscription.add(this.socketService.onVitalUpdate().subscribe(async (_response: any) => {
      this._commonService.setLoader(true);
      let resId = _response.residentId[0] ? _response.residentId[0] : "";
      _response = _response.careObjVal;
      if (resId == this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"])) {
        if (_response && _response._id === "Fall") {
          this.checkFall = true;
        }
      }
      if (_response && _response.data && Object.values(_response.data).length) {
        if (resId == this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"])) {
          if (_response && _response._id === "Temperature") {
            this.health_data["temperature"] = _response.data["first_input"];
            if (this.filteredTemperature) {
              if (_response.data["first_input"] > this.filteredTemperature) {
                let event = { value: 14 };
                this.customIsolation(event, false);
                this.resident.custom_isolation = 14;
              }
            }
          }
          if (_response && _response._id === "Respirations") {
            this.health_data["respiration"] = _response.data["first_input"];
          }
          if (_response && _response._id === "Oxygen") {
            this.health_data["oxygen"] = _response.data["first_input"];
          }
          if (_response && _response._id === "Weight") {
            this.health_data["weight"] = _response.data["first_input"];
          }
          if (_response && _response._id === "ACCU Check") {
            this.health_data['blood_sugar'] = _response.data['first_input']
          }
          if (_response && _response._id === "Blood Pressure") {
            this.health_data["blood_pressure"] = _response.data["first_input"] + '/' + _response.data['second_input'];
            this.blood_pressure['first_input'] = _response.data['first_input'];
            this.blood_pressure['second_input'] = _response.data['second_input'];
          }
          if (_response && _response._id === "Height") {
            const hie = (JSON.parse(_response.data["first_input"]) / 12);
            const hie1 = hie.toString().split('.');
            this.height_ft = parseInt(hie1[0]);
            this.inches = Math.round(JSON.parse(_response.data["first_input"]) - 12 * this.height_ft);
            this.health_data['height'] = _response.data["first_input"];
            //this.height_ft = Math.round((JSON.parse(_response.data["first_input"]) * 0.39) / 12);
            //this.inches = Math.round((JSON.parse(_response.data["first_input"]) * 0.39) % 12);
            //this.health_data["height"] = _response.data["first_input"];
          }

          if (_response && _response._id === "Pulse Automatic") {
            this.health_data["pulse"] = _response.data["first_input"];
          }

          if (_response && (_response._id === "Height" || _response._id === "Weight")) {
            const h = JSON.parse(this.health_data['height']) * 2.54 / 100;
            const bmi = (JSON.parse(this.health_data['weight']) * 0.45359237) / (h * h);
            this.health_data['bmi'] = Math.round(bmi);
          }
        }
      }
      this._commonService.setLoader(false);
    }),
    );*/


    // this.subscription.add(this.socketService.onResidentOutRoomFn().subscribe(async (_response: any) => {
    //   if (_response) {
    //     this._commonService.setLoader(true);
    //     if (this.resident._id !== undefined && this.resident._id === _response._id) {
    //       this.resident.is_out_of_room = _response.is_out_of_room;
    //     }
    //     this._commonService.setLoader(false);
    //   }
    // }));
    // this.subscription.add(this.socketService.addPharmacyFn().subscribe(async (_response: any) => {
    //   this._commonService.setLoader(true);
    //   await this.getPharmacy();
    //   this._commonService.setLoader(false);
    // }));
    // this.subscription.add(this.socketService.updatePharmacyFn().subscribe(async (_response: any) => {
    //   this._commonService.setLoader(true);
    //   await this.getPharmacy();
    //   this._commonService.setLoader(false);
    // }));

    // this.subscription.add(this.socketService.addPhysicianFn().subscribe(async (_response: any) => {
    //   this._commonService.setLoader(true);
    //   await this.getPhysician();
    //   this._commonService.setLoader(false);
    // }));
    // this.subscription.add(this.socketService.updatePhysicianFn().subscribe(async (_response: any) => {
    //   this._commonService.setLoader(true);
    //   await this.getPhysician();
    //   this._commonService.setLoader(false);
    // }));

    // console.log(this.health_data)

      this._commonService.setLoader(false);

  }


  functionForListeningResidentEvents() {
    this.subscription.add(this.socketService.onResidentOutOfFacilityFn().subscribe(async (_response: any) => {
      if (_response) {
        if (this.resident._id !== undefined && this.resident._id === _response._id) {
          this.old_is_out_of_fac = this.resident['is_out_of_fac'] = _response.is_out_of_fac;
          if (_response.is_out_of_fac && this.isolation_end_date != '') {
            // commented due to do not need to stop isolation if resident going out building
            // this.isolation_end_date = '';
            // this.isolation_start_date = '';
          }
        }
      }
    }));

    this.subscription.add(this.socketService.onResidentIsIsolationFn().subscribe(async (_response: any) => {
      if (_response) {
        if (_response._ids.indexOf(this.resident._id) > -1) {
          // tslint:disable-next-line: max-line-length
          this.isolation_end_date = '';
          this.isolation_start_date = '';
          this.resident.custom_isolation = '';
          setTimeout(() => {
            this.isolation_end_date = _response.end_time_isolation;
            this.isolation_start_date = _response.start_time_isolation;
            this.resident.custom_isolation = !isNaN(_response.custom_days) ? parseInt(_response.custom_days) : _response.custom_days;
            this.oldValueIsolation = this.resident.custom_isolation;
          }, 10);
        }

      }
    }));
    this.subscription.add(this.socketService.onResidentTestingStatusFn().subscribe(async (_response: any) => {
      if (_response) {
        if (this.resident._id !== undefined && this.resident._id === _response._id) {
          this.oldValueTestingStatus = this.resident['testing_status'] = _response.testing_status;
          if (this.resident['testing_status'] === 'Positive') {
            let event = { value: 14 };
            this.customIsolation(event, false);
            this.resident.custom_isolation = 14;
          }
        }
      }
    }));

    this.subscription.add(this.socketService.onResidentStopIsolationFn().subscribe(async (_response: any) => {
      if (_response) {
        if (_response.resident_id == this.resident._id) {
          this.isolation_end_date = '';
          this.isolation_start_date = '';
          this.oldValueIsolation = this.resident.custom_isolation = '';
        }
      }
    }));

    this.subscription.add(this.socketService.onVitalUpdate().subscribe(async (_response: any) => {
      this._commonService.setLoader(true);
      let resId = _response.residentId[0] ? _response.residentId[0] : "";
      _response = _response.careObjVal;
      if (resId == this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"])) {
        if (_response && _response._id === "Fall") {
          this.checkFall = true;
        }
      }
      if (_response && _response.data && Object.values(_response.data).length) {
        if (resId == this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"])) {
          if (_response && _response._id === "Temperature") {
            this.health_data["temperature"] = _response.data["first_input"];
            if (this.filteredTemperature) {
              if (_response.data["first_input"] > this.filteredTemperature) {
                let event = { value: 14 };
                this.customIsolation(event, false);
                this.resident.custom_isolation = 14;
              }
            }
          }
          if (_response && _response._id === "Respirations") {
            this.health_data["respiration"] = _response.data["first_input"];
          }
          if (_response && _response._id === "Oxygen") {
            this.health_data["oxygen"] = _response.data["first_input"];
          }
          if (_response && _response._id === "Weight") {
            this.health_data["weight"] = _response.data["first_input"];
          }
          if (_response && _response._id === "ACCU Check") {
            this.health_data['blood_sugar'] = _response.data['first_input']
          }
          if (_response && _response._id === "Blood Pressure") {
            this.health_data["blood_pressure"] = _response.data["first_input"] + '/' + _response.data['second_input'];
            this.blood_pressure['first_input'] = _response.data['first_input'];
            this.blood_pressure['second_input'] = _response.data['second_input'];
          }
          if (_response && _response._id === "Height") {
            const hie = (JSON.parse(_response.data["first_input"]) / 12);
            const hie1 = hie.toString().split('.');
            this.height_ft = parseInt(hie1[0]);
            this.inches = Math.round(JSON.parse(_response.data["first_input"]) - 12 * this.height_ft);
            this.health_data['height'] = _response.data["first_input"];
            //this.height_ft = Math.round((JSON.parse(_response.data["first_input"]) * 0.39) / 12);
            //this.inches = Math.round((JSON.parse(_response.data["first_input"]) * 0.39) % 12);
            //this.health_data["height"] = _response.data["first_input"];
          }

          if (_response && _response._id === "Pulse Automatic") {
            this.health_data["pulse"] = _response.data["first_input"];
          }

          if (_response && (_response._id === "Height" || _response._id === "Weight")) {
            const h = JSON.parse(this.health_data['height']) * 2.54 / 100;
            const bmi = (JSON.parse(this.health_data['weight']) * 0.45359237) / (h * h);
            this.health_data['bmi'] = Math.round(bmi);
          }
        }
      }
      this._commonService.setLoader(false);
    }),
    );

    this.subscription.add(this.socketService.onTrackCareUpdateFn().subscribe(async (_response: any) => {
      if (_response) {
        _response.forEach(el => {
          var vitalresident = el.resident[0];
          if (vitalresident._id == this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"])) {
            if (el.care.type !== 'enter' || el.care.type !== 'unassigned' || el.care.type !== 'exit') {
              switch (el.care.name) {
                case 'Temperature':
                  this.health_data["temperature"] = el.track_details["first_input"];
                  if (this.filteredTemperature) {
                    if (el.track_details["first_input"] > this.filteredTemperature) {
                      let event = { value: 14 };
                      this.customIsolation(event, false);
                      this.resident.custom_isolation = 14;
                    }
                  }
                  break;
                case 'Blood Pressure':
                  this.health_data["blood_pressure"] = el.track_details["first_input"] + '/' + el.track_details['second_input'];
                  this.blood_pressure['first_input'] = el.track_details['first_input'];
                  this.blood_pressure['second_input'] = el.track_details['second_input'];
                  break;
                case 'Pulse Automatic':
                  this.health_data["pulse"] = el.track_details["first_input"];
                  break;
                case 'Oxygen':
                  this.health_data["oxygen"] = el.track_details["first_input"];
                  break;
                case 'Respirations':
                  this.health_data["respiration"] = el.track_details["first_input"];
                  break;
                case 'ACCU Check':
                  this.health_data['blood_sugar'] = el.track_details['first_input']
                  break;
                case 'Height':
                  const hie = (JSON.parse(el.track_details["first_input"]) / 12);
                  const hie1 = hie.toString().split('.');
                  this.height_ft = parseInt(hie1[0]);
                  this.inches = Math.round(JSON.parse(el.track_details["first_input"]) - 12 * this.height_ft);
                  this.health_data['height'] = el.track_details["first_input"];
                  break;
                case 'Weight':
                  const h = JSON.parse(this.health_data['height']) * 2.54 / 100;
                  const bmi = (JSON.parse(this.health_data['weight']) * 0.45359237) / (h * h);
                  this.health_data['bmi'] = Math.round(bmi);
                  break;
                case 'Fall':
                  this.checkFall = true;
                  break;
                default:
                  break;
              }
            }
          }
        })
      }
    }))

    this.subscription.add(this.socketService.onResidentOutRoomFn().subscribe(async (_response: any) => {
      if (_response) {
        this._commonService.setLoader(true);
        if (this.resident._id !== undefined && this.resident._id === _response._id) {
          this.resident.is_out_of_room = _response.is_out_of_room;
        }
        this._commonService.setLoader(false);
      }
    }));

    // this.subscription.add(this.socketService.updateResidentFn().subscribe(async (_response: any) => {
    //   if (_response) {
    //     if (this.resident._id !== undefined && this.resident._id === _response._id) {
    //       this.old_is_out_of_fac = this.resident['is_out_of_fac'] = _response.is_out_of_fac;
    //       if (_response.is_out_of_fac && this.isolation_end_date != '') {
    //         // this.isolation_start_date = '';
    //       }
    //     }
    //   }
    // }));
  }
  async assignCareSelect(selectedCare) {
    let multi;
    this.carelist.filter(item => {
      if (item.key === selectedCare.care_id) {
        multi = item.value
      } else {
        if (item.subCares) {
          item.subCares.filter(data => {
            if (data.key === selectedCare.care_id) {
              multi = data.value
            }
          })
        }
      }
    })
    if (!this.editAll) {
      this.changeCare(selectedCare.care_id, multi);
    }
    if (selectedCare.care_id) {
      this.selectedCareData = {
        care_id: '',
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
              });
              // this.carelist[i].subCares.splice(j, 1);
              break;
            }
          }
        }
      }
      if (this.toastr.currentlyActive === 0) this.toastr.success('Care added successfully');

      /* If one care is added then open duration section */
    } else {
      this.toastr.error('Please select care.');
      return;
      // if (this.toastr.currentlyActive === 0)
      //   this.toastr.error("Please select care")
    }
  }
  async deleteAssignedCare(careID) {
    for (let i = 0; i < this.selectedCareList.length; i++) {
      if (this.selectedCareList[i].care.key === careID && !this.selectedCareList[i].care.parentCareId) {
        this.carelist.push(this.selectedCareList[i].care);
        this.selectedCareList.splice(i, 1);
        break;
      } else if (this.selectedCareList[i].care.key === careID && this.selectedCareList[i].care.subCare === true) {
        for (let j = 0; j < this.carelist.length; j++) {
          if (this.carelist[j].key === this.selectedCareList[i].care.parentCareId) {
            this.carelist[j].subCares.push(this.selectedCareList[i].care);
            this.selectedCareList.splice(i, 1);
            break;
          }
        }
      }

    }
    if (!this.selectedCareList.length) {
      // this.getAllcaresData();
    }
    /*  If any data change after click Preview button then revert it to Preview button */
    // if(this.afterpreview2 == true){
    //   this.afterpreview2 = false;
    //   this.thirdEdit     = true;
    // }
    this.toastr.success('Care removed successfully');
  }
  /* Toggle for manage Parent cares open/close  */
  activeToggler(selectedIndex, event) {
    event.stopPropagation();
    this.activeClassIndex = (this.activeClassIndex == selectedIndex) ? null : selectedIndex;
  }

  // Resident Profile API

  async getProfileDetails() {
    this._commonService.setLoader(true);
    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: `residents/${this.residentId}/profile` };

    const result = await this.apiService.apiFn(action, this.apiPayload);
    // console.log(JSON.stringify(result));


    //   const action = { type: 'POST', target: 'residents/view' };
    //   this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    //   const payload = { residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
    //   const result = await this.apiService.apiFn(action, payload);
    // console.log(JSON.stringify(result));


      // only for testing
      // const actionP1 = { type: 'POST', target: 'residents/medicationTrackList' };
      // const payloadP1= {"user_id" : "5efaee9f86c55b19e66b121d", "fac_id" : this.fac_id};
      // const resultP1 = await this.apiService.apiFn(actionP1, payloadP1);
      this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
        this.timezone = contentVal.timezone;
        this.facilityId = contentVal.fac;
        // if (this.residentId && this.facilityId) {
        //   await this.getResSchedules(this.residentId);
        // } else if (this.facilityId) {
        //   this.subscription = this._commonService.residentcontentdata.subscribe(async (result: any) => {
        //     console.log('resident Id>>>>>>>>>', result)
        //     if (result) {
        //       await this.getResSchedules(result);
        //     }
        //   })
        // }
      })
      // this.resident.diseases_id = result['data'].disease_id
      // this.resident.allergy_id = result['data'].allergy_id

      // console.log('--resident data---',this.resident.diseases_id,this.resident.allergy_id)

      // (result['data'].primary_physician_id && result['data'].primary_physician_id._id)?


      // Orders count

      if(result && result['orders_count']){
        this.ordersCount = result['orders_count'];
      }


      if (result && result['data']['vital_data']) {
        result['data']['vital_data'].map((item) => {
          if (item && item.name === 'Temperature') {
            if (!item.max_value || !item.min_value) {
              this.check_temp_min = '';
              this.check_temp_max = '';
            }
            else {
              this.check_temp_min = item.min_value;
              this.check_temp_max = item.max_value;
              this.filteredTemperature = item.max_value;
            }
          }
          //Pulse
          if (item && item.name === 'Pulse Automatic') {
            if (!item.max_value || !item.min_value) {
              this.check_pul_min = '';
              this.check_pul_max = '';
            }
            else {
              this.check_pul_min = item.min_value;
              this.check_pul_max = item.max_value;
            }
          }
          //Pulse
          //Oxygen
          if (item && item.name === 'Oxygen') {
            if (!item.max_value || !item.min_value) {
              this.check_oxy_min = '';
              this.check_oxy_max = '';
            }
            else {
              this.check_oxy_min = item.min_value;
              this.check_oxy_max = item.max_value;
            }
          }
          //Oxygen
          //Respirations
          if (item && item.name === 'Respirations') {
            if (!item.max_value || !item.min_value) {
              this.check_res_min = '';
              this.check_res_max = '';
            }
            else {
              this.check_res_min = item.min_value;
              this.check_res_max = item.max_value;
            }
          }
          //Respirations
          //Blood Pressure
          if (item && item.name === 'Blood Pressure') {
            if (!item.max_value || !item.min_value) {
              this.check_bp_min = '';
              this.check_bp_max = '';
            }
            else {
              this.check_bp_min = item.min_value;
              this.check_bp_max = item.max_value;
            }
          }
          //Blood Pressure
          //Blood Sugar
          if (item && item.name === 'ACCU Check') {
            if (!item.max_value || !item.min_value) {
              this.check_bs_min = '';
              this.check_bs_max = '';
            }
            else {
              this.check_bs_min = item.min_value;
              this.check_bs_max = item.max_value;
            }
          }
          //Blood Sugar
        });
      }
      // if(result && result['vital_data']){
      //   this.filteredTemperature= result['vital_data'].filter(
      //   obj => obj.name === 'Temperature');
      //   console.log(this.filteredTemperature);
      //   if(!this.filteredTemperature[0].min_value || !this.filteredTemperature[0].max_value){
      //        this.check_temp_min='';
      //        this.check_temp_max='';
      //   }else
      //   {
      //     this.check_temp_min=this.filteredTemperature[0].min_value;
      //     this.check_temp_max=this.filteredTemperature[0].max_value;
      //   }
      // }
      if (result && result['data']) {
        this.captionName = result['data']['first_name'].substring(0, 1) + result['data']['last_name'].substring(0, 1);
        this.residentFullName = result['data']['first_name'] + " " + result['data']['last_name'];
      }
      if (result && result['data'].health_data) {
        // console.log(result['data'].health_data, "inside healt data")
        result['data'].health_data.map((item) => {

          if (item && item._id === 'Temperature' && item.data) {
            this.health_data['temperature'] = item.data['first_input'];
          }
          if (item && item._id === 'Respirations' && item.data) {
            this.health_data['respiration'] = item.data['first_input'];
          }
          if (item && item._id === 'Oxygen' && item.data) {
            this.health_data['oxygen'] = item.data['first_input'];
          }
          if (item && item._id === 'Weight' && item.data) {
            this.health_data['weight'] = item.data['first_input'];
          }
          if (item && item._id === 'ACCU Check' && item.data) {
            this.health_data['blood_sugar'] = item.data['first_input']
          }

          if (item && item._id === 'Blood Pressure' && item.data) {
            this.health_data['blood_pressure'] = item.data['first_input'] + '/' + item.data['second_input'];
            this.blood_pressure['first_input'] = item.data['first_input'];
            this.blood_pressure['second_input'] = item.data['second_input'];
          }
          if (item && item._id === 'Height' && item.data) {
            const hie = (JSON.parse(item.data['first_input']) / 12);
            const hie1 = hie.toString().split('.');
            this.height_ft = parseInt(hie1[0]);
            this.inches = Math.round(JSON.parse(item.data['first_input']) - 12 * this.height_ft);
            this.health_data['height'] = item.data['first_input'];
          }

          if (item && item._id === 'Pulse Automatic' && item.data) this.health_data['pulse'] = item.data['first_input'];

          if ((this.health_data['height']) && (this.health_data['weight'])) {
            const h = JSON.parse(this.health_data['height']) * 2.54 / 100;
            const bmi = (JSON.parse(this.health_data['weight']) * 0.45359237) / (h * h);
            this.health_data['bmi'] = Math.round(bmi);
          }
        });
      }

      if (result && result['fall_data']) {
        result['fall_data'].map((item) => {
          if (item && item._id === 'Fall') {
            this.start_fall_time = new Date(item.data_fall);
            //this.end_fall_time =new Date(this.start_fall_time.getTime()+1000*60*60*24);
            this.end_fall_time = new Date();
            let diff = Math.abs(this.start_fall_time.getTime() - this.end_fall_time.getTime()) / 3600000;
            if (diff >= 24) {
              this.checkFall = false;
            } else {
              this.checkFall = true;
            }
          }
        });
      }

      //if there is no phone numbers added for old record then add default one field
      if (!result['data'].phone_numbers || !result['data'].phone_numbers.length) {
        result['data'].phone_numbers = this.resident.phone_numbers
      }
      if (!result['data'].emails || !result['data'].emails.length) {
        result['data'].emails = this.resident.emails
      } else {
        if (result['data'].phone_numbers && result['data'].phone_numbers.length) {
          result['data'].emails.forEach(email => {
            result['data'].phone_numbers.push(email)
          })
        } else {
          result['data'].phone_numbers = result['data'].emails
        }
      }
      if (result && result['data']) {
        this.resident = result['data'];
        // console.log('this.resident------------->',JSON.stringify(this.resident));
        if (result['data'].phone_numbers && result['data'].phone_numbers.length) {
          this.resident.phone_numbers = result['data'].phone_numbers.map(e => ({ id: Math.random(), ...e }));
        }
        if (this.resident && this.resident.room && this.resident.room._id) {
           this.roomData = {
             room_id: this.resident.room._id,
             room_name: this.resident.room.room,
           };
        }

        // Assign Primary Physician and Pharmacy ID

        if(result['data']['primary_physician_id']){
          this.primaryPhysicianID = result['data'].primary_physician_id['_id'];
        }
        if(result['data']['primary_pharmacy_id']){
          this.primaryPharmacyId = result['data'].primary_pharmacy_id;
        }
        // Care Level Drop Down

        if(result && result['data'].level_list){
          this.carelevelData = result['data'].level_list;
          this.carelevelData = this.carelevelData.sort((a,b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));
          console.log("Care level",this.carelevelData);
        }
          // For Organization and Facility

        if(result && result['data'].facility){
        this.resident.organization = result['data'].facility[0].org._id;
          this.getOrgFacility(this.resident.organization);
        this.resident.facility = this.oldFacility = result['data'].facility[0].fac._id;
        }

        // NFC dropdown

        if(result && result['data']['unassigned_nfc']){
          this.nfclist = result['data']['unassigned_nfc'];
        }



        // Admit Date

        if(result && result['data'].admit_date){
          this.resident.admit_date = new Date(result['data'].admit_date);
          // this.resident.facility = result['data'].facility[0].fac._id;
          }

          // Dob

          if(result && result['data'].dob){
            this.resident.dob = new Date(result['data'].dob);
            // this.resident.facility = result['data'].facility[0].fac._id;
            }

            // Care Level

            if(result && result['data'].care_level){
              this.resident.care_level = result['data'].care_level._id
            }
      }
      // this.resident.dob = new Date(result['data']['dob']);

      // this.resident.emails = result['data'].emails.map(e=>({id:Math.random(),...e}))
      //resident status pending
      this.statusOldVal = this.resident.resident_status;
      if (this.resident.resident_status == 'Pending') {
        this.ispending = true
      } else {
        this.ispending = false
      }

      if (this.resident.resident_status == 'Active') {
        this.resident.is_out_of_room = false
      }

      if (this.resident['updated_status'] == 'Transferred' || this.resident['updated_status'] == 'Moved' ||
        this.resident['updated_status'] == 'Skilled Nursing' || this.resident['updated_status'] == 'Hospitalized') {
        this.isStatusFacility = true;
      }
      // this.diseaseFetched = { diseases: this.resident.disease_id, allergies: this.resident.allergy_id }
      // this.diseaseFetched.push(this.resident.disease_id,this.resident.allergy_id)
      if (this.resident.mobile_phone) {
        this.show_mobile = true
        this.contact_type = this.contact_type.filter(e => e.name != 'Mobile')
      }
      if (this.resident.home_phone) {
        this.show_home = true
        this.contact_type = this.contact_type.filter(e => e.name != 'Home')
      }
      if (this.resident.email) {
        this.show_mainEmail = true
        this.email_type = this.email_type.filter(e => e.name != 'Email')
      }
      if (this.resident.other_email) {
        this.show_otherEmail = true
        this.email_type = this.email_type.filter(e => e.name != 'Other')
      }

      this.residentName = this.resident.last_name + ", " + this.resident.first_name;
      if (result && result['data']) {
        const a_nfc = result['data'].nfc;
        this.assignNFClist = a_nfc;
        // this.unassignenfcs();
        // await this.loadSecondaryCarelevel([result['data'].care_level["_id"]])
        // if (result['data']['cares'].length > 0) {
        //   // this.user.organization = result['data']['facility'][0]['org']['_id'];
        //   this.multiorg = result['data']['cares'][0]['care_id'] ? result['data']['cares'][0]['care_id'].name : '';
        //   //this.changeCare(this.resident.organization);
        //   this.ismultifac = true;
        //   this.showfaclist = true;
        //   this.multifacility = result['data']['cares'][0]['care_note'];
        // } else {
        //   this.ismultifac = false;
        //   this.showfaclist = false;
        // }
        // //Table data show start
        // if (this.carelevelData && this.carelevelData.length > 0 && result['data'].secondary_care_level && result['data'].secondary_care_level.length) {
        //   let checkCareLevel = this.secondarycarelevelData.length;
        //   let secCareLevel = result['data'].secondary_care_level ? result['data'].secondary_care_level.length : [];
        //   if (checkCareLevel == secCareLevel) {
        //     result['data'].secondary_care_level.push(0);
        //   }
        // }
        // if (result['data']['cares'] && result['data']['cares'] != undefined && result['data']['cares'].length > 0) {
        //   this.residentCareList = result['data']['cares'].map(item => ({
        //     care_id: item.care_id._id,
        //     care_name: item.care_id.name,
        //     care_note: item.care_note,
        //     selected: item.selected
        //   })
        //   );
        //   console.log('sanitize_care_notes::::::', this.sanitize_care_notes)

        // }

      }

      //this.dataSource = new MatTableDataSource(this.residentCareList);
      //Table data show end


      // this.displayData = (result['emergency'].length > 3) ? result['emergency'].slice(0, 3) : result['emergency'];

      // const action1 = { type: 'GET', target: 'residents/open-cares' };
      // const payload1 = { residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };

      // const cares = await this.apiService.apiFn(action1, payload1);
      // if (cares && cares['data']) {
      //   this.open_cares = cares['data'];
      // }
      // if (!this.resident.hasOwnProperty('pre_diseases')) {
      //   this.pre_diseases = [];
      // } else {
      //   this.resident.pre_diseases.forEach(element => {
      //     this.pre_diseases.push(element._id);
      //   });
      // }
      // if(this.resident.isolaton){

      // }
      this.old_is_out_of_fac = (this.resident['is_out_of_fac'] != undefined) ? this.resident['is_out_of_fac'] : false;
      this.isolation_end_date = result['data']['isolation_end_date'];
      this.isolation_start_date = result['data']['isolation_start_date'];
      this.resident.custom_isolation = result['data']['isolation_days'];
      this.oldValueIsolation = result['data']['isolation_days'];
      // this.oldValueTestingStatus = this.resident['data']['testing_status'];
      // tslint:disable-next-line: max-line-length
      this.oldValueSetIsolation = this.resident.isolation_apply_come_to_fac = (this.resident.isolation_apply_come_to_fac != '' && !isNaN(this.resident.isolation_apply_come_to_fac)) ? parseInt(this.resident.isolation_apply_come_to_fac) : this.resident.isolation_apply_come_to_fac;
      if (result['data']['emergency']) {
        this.emergency['emergency_first_name'] = result['data']['emergency']['first_name'];
        this.emergency['emergency_last_name'] = result['data']['emergency']['last_name'];
        this.emergency['emergency_relation'] = result['data']['emergency']['relation'];
        this.emergency['emergency_email'] = result['data']['emergency']['email'];
        this.emergency['emergency_home_phone'] = result['data']['emergency']['homephone'];
        this.emergency['emergency_mobile_phone'] = result['data']['emergency']['mobilephone'];
        this.emergency['emergency_notes'] = result['data']['emergency']['notes'];
        this.emergency['emergency_confirmemail'] = result['data']['emergency']['email'];
      }
      const final_data = { ...result['data'] };
      this.old_is_out_of_fac = this.resident['is_out_of_fac'] = final_data['is_out_of_fac'];
      this.resident['hospice'] = final_data['hospice'];
      this.resident['dnr'] = final_data['dnr'];
      if (this.resident['dnr'] == true) {
        this.dnrStatus = '#EF3E36';
      } else {
        this.dnrStatus = '#B9BABC';
      }
      this.resident['two_am_checkin'] = final_data['two_am_checkin']//true;
      this.resident['confirmemail'] = final_data['email'];

      // tslint:disable-next-line: max-line-length
      // if (final_data['care_level']['name'] === 'Level 1' || final_data['resident_status'] === 'Deceased' || final_data['resident_status'] === 'Moved' || final_data['resident_status'] === 'Transferred') {
      //   this.disable_checkin = true;
      // }
      // if (final_data['care_level']['name'] === 'Level 1' || final_data['resident_status'] === 'Deceased' || final_data['resident_status'] === 'Moved' || final_data['resident_status'] === 'Transferred') {
      //   this.disable_2am_checkin = true;
      // }
      // this.resident['care_level'] = final_data['care_level']['_id'];
      // this.resident['organization'] = final_data['facility'][0]['org']['_id'];
      // await this.changeOrg(this.resident['organization'], 0);
      // this.resident['facility'] = final_data['facility'][0]['fac']['_id'];
      // this.oldFacility = final_data['facility'][0]['fac']['_id'];
      // this.oldStatus = final_data['resident_status'];
      // this.oldSSN = final_data['social_security_no'];
      // this.oldBillingId = final_data["billingId"]
      // this.assignedAndFacPharmacy(result['pharmacies'], result['data'])
      // if (this.resident['resident_status'] === 'Transferred' || this.resident['resident_status'] === 'Moved' || this.resident['resident_status'] === 'Skilled Nursing' || this.resident['resident_status'] === 'Hospitalized') {
      //   this.isStatusFacility = true;
      // }
      // await this.getPayersInsurance();
      // console.log("  Final resident Data ===", this.resident)
      this._commonService.setLoader(false);
  }


  async getContactDetails(){
    this._commonService.setLoader(true);
    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: `residents/${this.residentId}/contacts` };

    const result = await this.apiService.apiFn(action, this.apiPayload);
    // console.log(JSON.stringify(result));

      if (result['data']['emergency']) {
        this.emergencyArr = result['data']['emergency'];
        console.log("Emergency Array",this.emergencyArr);
      }
      this.emergencyArr.forEach(e => {
        if (e.type_of_contact && e.type_of_contact.length) {
          e.type_of_contact = e.type_of_contact.sort()
        }
      });

      if(result['data']['pharmacies']){
        // this.assignedPharmacy = result['data']['pharmacies']
        this.assignedPharmacy = result['data']['pharmacies'].map(item => {
          return {
            ...item,
            isPrimary: (this.primaryPharmacyId)
              ? (String(item._id) == String(this.primaryPharmacyId) ? true : false) :
              false
          }
        }).sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary))
        // console.log(this.assignedPharmacy)
        // this.assignedPharmacy = result['data']['pharmacies']
      }
      // if(result['data']['doctors']){
      // this.assignedPhysician = result['data']['doctors']
      // }
      if (result && result['data']['doctors'] && result['data']) {
        this.assignedPhysician = result['data']['doctors'].map(item => {
          return {
            ...item,
            name: (item.last_name && item.first_name) ? `${item.last_name}, ${item.first_name}` : item.name,
            isPrimary: (this.primaryPhysicianID
              ? (String(item._id) == String(this.primaryPhysicianID) ? true : false) :
              false)
          }
        }).sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary))
        // console.log('--assigned physicians--',this.assignedPhysician)
      }
      this.assignedPhysician.filter(item => {
        if (item.phone_numbers && item.phone_numbers.length && item.phone_numbers.length > 1 || (item.phone_numbers && item.phone_numbers.length && item.phone_numbers.length && item.email)) {
          item['show'] = false;
        } else {
          item['show'] = true;
        }
      })
      this._commonService.setLoader(false);
  }


  async getDiagnosis(){
    this._commonService.setLoader(true);
    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      const action = { type: 'POST', target: `residents/${this.residentId}/diagnosis` };

      const result = await this.apiService.apiFn(action, this.apiPayload);
      // console.log(JSON.stringify(result));

      if(result['data']['disease']){
        // this.diseaseFetched = result['data']['disease'];
        this.diseaseFetched = { diseases: result['data']['disease'], allergies: result['data']['allergy']}

      }
      if(result['data']['physician']){
        this.dignosePhysician = result['data']['physician'].map(item => {
          return {
            ...item,
            name: (item.last_name && item.first_name) ? `${item.last_name}, ${item.first_name}` : item.name,
            isPrimary: (this.primaryPhysicianID
              ? (String(item._id) == String(this.primaryPhysicianID) ? true : false) :
              false)
          }
        }).sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary));
        // this.dignosePhysician = result['data']['physician'];
        // console.log(this.dignosePhysician);

      }
      this._commonService.setLoader(false);

  }

    // this.subscription.add(this.socketService.onResidentpreferred_physicianFn().subscribe(async (_response: any) => {
    //   if (_response) {
    //   }
    // }));
    // this.subscription.add(this.socketService.onResidentpreferred_pharmacyFn().subscribe(async (_response: any) => {
    //   if (_response) {

    //   }
    // }));
    // this.subscription.add(this.socketService.onResidentprimary_pharmacyFn().subscribe(async (_response: any) => {
    //   if (_response) {
    //   }
    // }));
    // this.subscription.add(this.socketService.onResidentprimary_physicianFn().subscribe(async (_response: any) => {
    //   if (_response) {
    //   }
    // }));



  async getScheduleData(){
    this._commonService.setLoader(true);

    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      const action = { type: 'POST', target: `residents/${this.residentId}/schedule` };

      const result = await this.apiService.apiFn(action, this.apiPayload);
      // console.log(JSON.stringify(result));

      if(result['data']){
        this.schedules = result['data'];
          // console.log("this.schedules after respondse >>>>>>", this.schedules)
          this.schedules.map(item => {
            if (item.start_time) {
              const start = moment.unix(item.start_time / 1000);
              const end = moment.unix(item.start_time / 1000).add(item.duration, 'second');
              item.start_time = item.start_time ? moment(start).tz(this.timezone).format("hh:mm A") : item.start_time
              item['end_time'] = moment(end).tz(this.timezone).format("hh:mm A")
            }
            // item.end_date = item.end_date ? moment(item.end_date).tz(this.timezone):item.end_date;
            // item.start_date = item.start_date ? moment(item.start_date).tz(this.timezone): item.start_date;
          })
      }

      this._commonService.setLoader(false);


  }

  async getPayersAndInsuranceData(){

    this._commonService.setLoader(true);
    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      const action = { type: 'POST', target: `residents/${this.residentId}/payersandins` };

      const result = await this.apiService.apiFn(action, this.apiPayload);
      // console.log(JSON.stringify(result));
      if (result['status'] && result['data'].length > 0) {
        const insuranceData = result['data'][0];
        this.addedPayers = insuranceData.payers;
        this.payersDataSource.data = this.addedPayers;
        this.addedCoverages = insuranceData.medical_coverage;
        this.residentInsurance.company_name = insuranceData.company_name;
        this.residentInsurance.policy_number = insuranceData.policy_number;
        this.residentInsurance.payers_and_insurance_id = insuranceData._id;
        for (let i = 0; i < this.addedCoverages.length; i++) {
          for (let j = 0; j < this.addsMedCoverage.length; j++) {
            if (this.addedCoverages[i].name === this.addsMedCoverage[j].value) {
              this.addsMedCoverage.splice(j, 1);
            }
          }
        }
        for (let k = 0; k < this.addedPayers.length; k++) {
          for (let l = 0; l < this.payers.length; l++) {
            if (this.addedPayers[k]._id === this.payers[l]._id) {
              this.payers.splice(l, 1);
            }
          }
        }
      }

      // if(result['data'].length > 0){
      //   this.residentInsurance.company_name = result['data'][0]['company_name'];
      //   this.residentInsurance.policy_number = result['data'][0]['policy_number'];
      //   this.addedCoverages = result['data'][0]['medical_coverage'];
      //   this.payersDataSource.data = result['data'][0]['payers'];
      // }

      this._commonService.setLoader(false);

  }

  async getCareNotesData(){
    this._commonService.setLoader(true);
    this.residentCareList = [];

    this.getAllcaresData();
    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      const action = { type: 'POST', target: `residents/${this.residentId}/carenotes` };

      const result = await this.apiService.apiFn(action, this.apiPayload);
      // console.log(JSON.stringify(result));

      if(result['data'].length > 0){
          this.showfaclist = true;
        const careList = result['data'];
        careList.map(item => {
          this.residentCareList.push({
            care_id: item.care_id._id,
            care_name: item.care_id.name,
            care_note: item.care_note,
          })
        })
      }else{ this.showfaclist = false;}

      this._commonService.setLoader(false);


  }

  async getActivityData() {
    this._commonService.setLoader(true);
    this.residentActivityList = [];

    this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: `residents/${this.residentId}/activities` };

    const result = await this.apiService.apiFn(action, this.apiPayload);
    this.showfaclist = true;
    this.residentActivityList = result['data'];
    if (this.residentActivityList.length > 0) {
      this.showfaclist = true;
    } else {
      this.showfaclist = false;
    }
    this._commonService.setLoader(false);
  }

  async getAllcaresData() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'cares/getCares' },
      { 'type_not_in': ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'], "isSchedule": true, 'organization': this.organization, 'facility': this.facility }
    )
      .then((result: any) => {
        this.tempcareImg = result['data']
        this.carelistData = result['data'];
        this.carelist = this.carelistData;
        this.carelist.filter(obj => {
          obj['key'] = obj._id ? obj._id : "";
          obj['value'] = obj.name ? obj.name : "";
          obj['subCares'] = obj.subCares ? obj.subCares : [],
            obj['image'] = (obj.image && obj.image.location) ? obj.image.location : "";
          if (obj.subCares && obj.subCares.length) {
            obj.subCares.filter(data => {
              data['key'] = data._id;
              data['value'] = data.name ? data.name : "";
              data['subCare'] = true;
              data['parentCareId'] = obj._id ? obj._id : "";
              data['image'] = (data.image && data.image.location) ? data.image.location : "";
            })
          }
        })
        this.carelist.filter(item => {
          if (item.subCares && item.subCares.length > 0) {
            item['hasSubCares'] = true;
          } else {
            item['hasSubCares'] = false;
          }
        })
        this.tempcareDataCare = this.carelist;
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
    /* End Manage Sub cares */
  }

  async getResidentUnlinkedLinkOrderData(facility, residentId) {
    const action = {
      type: 'POST',
      target: 'residents/all_orders_of_resident',
    };
    const payload = {
      facId: facility,
      folderName: "unlink_orders",
      resident_id: residentId
    }
    let result = await this.apiService.apiFn(action, payload);
    this.unlinkOrderCount = result['data']['_count'];
  }

  async getResidentMedicationOrderData(facility, residentId) {
    const action = {
      type: 'POST',
      target: 'residents/all_orders_of_resident',
    };
    const payload = {
      facId: facility,
      folderName: "medications",
      resident_id: residentId,
      prescriptionCreated:false
    }
    let result = await this.apiService.apiFn(action, payload);
    // console.log(JSON.stringify(result));

    this.medicationOrderCount = result['data']['_count'];


    const action1 = {
      type: 'GET',
      target: 'residents/medication_list',
    };
    const payload1 = {
      resident_id: residentId
    }
    let result1 = await this.apiService.apiFn(action1, payload1);

    if (result1 && result1["data"]) {
      let medicatedOrders = result1["data"]._medication.map(x => { return x.order_id });
      let medicationLinkedOrders = result["data"]._etherfaxes.map(x => { return x._id });
      var filtered = medicationLinkedOrders.filter(x => {
        if (!(medicatedOrders.indexOf(x) > -1)) {
          return true;
        }
      });
      this.unProcessedMedicationOrderCount = filtered.length;

    }

  }


  disableMessage() {
    if (this.isalltabidisable == true) {
      this.toastr.error('Please complete the resident profile process');
    }
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  ngAfterViewInit() {
    // let phElement = this.placeholder.element.nativeElement;
    // phElement.style.display = 'none';
    // phElement.parentNode.removeChild(phElement);
    // this.diseasesSelected = this.diagnoComponent.dataSourceDisease['data']
    // this.allergySelected = this.diagnoComponent.dataSourceAllergy['data']
  }
  repeatChanged() {
    this.dialogConfig.maxWidth = '500px';
    this.dialogRefs = this.dialog.open(this.callConfirmDialog, this.dialogConfig);
  }

  onNoClick(): void {
    this.resident.facility = this.oldFacility;
    this.dialogRefs.close(['result']['status'] = false);
  }

  onCancel(): void {
    this.resident.resident_status = this.oldStatus;
    this.dialogRefs.close(['result']['status'] = false);
  }

  popupAction(text) {
    this.dialogRefs.close(text);
  }
  onPhysicianPopupClose(): void {
    this.dialogRefs.close('No')
  }
  onPhysicianPopupConfirm(): void {
    this.dialogRefs.close('Yes')
  }
  onPharmacyPopupClose(): void {
    this.dialogRefs.close('No')
  }
  onPharmacyPopupConfirm(): void {
    this.dialogRefs.close('Yes')
  }

  async changeOrg(org, flag, fac_id = null) {
    this.resident.facility = '';
    await this.apiService.apiFn(
      { type: 'GET', target: 'facility/faclist' },
      { 'org_id': org }
    )
      .then((result: any) => {
        this.faclist = result.data;
        if (flag) {
          this.floorlist = null;
        }

        if (this.faclist && this.faclist.length > 0) {
          if (fac_id) {
            this.resident.facility = fac_id;
            this.changeFac(this.resident.facility, false);
          } else {
            this.resident.facility = this.faclist[0]._id;
            this.changeFac(this.resident.facility, true);
          }
        }
      });
  }

  async changeFac(fac, flag) {
    const action = { type: 'GET', target: 'floorsector/floorsector_list' };
    const payload = { 'facId': fac };
    const result = await this.apiService.apiFn(action, payload);
    // console.log(result)
    if (result && result['data']) {
      this.floorlist = result['data'];
      this.floorFinalList = [...result['data']];
    }
    if (flag && (!this.isStatusChanged)) {
      this.dialogRefs = this.dialog.open(OnFacilityChangeComponent, {
        width: '500px',
        panelClass: 'statuspopup',
        data: this.statusData
      });
      this.dialogRefs.afterClosed().subscribe(async result => {
        // console.log('result:::::::::::', result);
        if (result && result.status) {
          this.resident['resident_status'] = result.updated_status;
        }
        else {
          this.resident['facility'] = this.oldFacility;
          this.changeFac(this.resident['facility'], false);
        }
      });
    }
    let fac_data = this.faclist.filter(e => String(e._id) == String(fac));
    if (fac_data.length && fac_data[0].pharmacy) {
      // console.log('--there is facility pharmacy',this.assignedPharmacy)

      //check if selected facility's pharmacy is already assigned or not
      let checkIsAssignedAlready = this.assignedPharmacy.findIndex(e => String(e._id) == String(fac_data[0].pharmacy._id))
      // console.log('checkIsAssignedAlready',checkIsAssignedAlready)

      if (checkIsAssignedAlready == -1) {
        // console.log('--it is not assigned')

        //check if there is already other facility pharmacy exists
        let isfacPharmacyExists = this.assignedPharmacy.findIndex(e => e.is_fac == true)

        // console.log('--isFacpharmacyexists--',isfacPharmacyExists)

        //if exists remove that from assign list
        if (isfacPharmacyExists != -1) {

          //if old facility which we are removing is also a primary pharmacy for this resident remove it from primary as well
          if (String(this.assignedPharmacy[isfacPharmacyExists]._id) == String(this.resident.primary_pharmacy_id)) {
            this.resident.primary_pharmacy_id = null
          }

          this.assignedPharmacy.splice(isfacPharmacyExists, 1)
        }

        //add is_fac=true flag to facility pharmacy
        fac_data[0].pharmacy['is_fac'] = true

        //change fac_pharmacy_id value to latest facility pharmacy value
        this.resident.fac_pharmacy_id = fac_data[0].pharmacy._id

        //push new facility pharmacy to the assigned pharmacy list
        this.assignedPharmacy.push(fac_data[0].pharmacy)

        //get latest record to filter pharmacy dropdown
        this.getPharmacy()

      } else {
        // console.log('--pharmacy already assigned-- do nothing')
      }

      // console.log('-selected facility-',fac_data)

      // this.resident.fac_pharmacy_id = fac_data[0].pharmacy._id
      // let pharmacy = this.pharmacylist.filter(e=>String(e._id)==String(fac_data[0].pharmacy._id))
      // if(pharmacy.length){
      //   pharmacy[0]['is_fac']=true
      // }

      // let existingFacPharmacy = this.assignedPharmacy.findIndex(e=>e.is_fac==true)

      // if(existingFacPharmacy>=0){
      //   this.pharmacylist.push(this.assignedPharmacy[this.assignedPharmacy.findIndex(e=>e.is_fac==true)]);
      //   this.assignedPharmacy.splice(this.assignedPharmacy.findIndex(e=>e.is_fac==true),1)
      // }

      // if(this.assignedPharmacy.findIndex(e=>String(e._id)==String(pharmacy[0]._id))==-1 && pharmacy.length){
      //   this.assignedPharmacy.push(pharmacy[0])
      //   this.pharmacylist.splice(this.pharmacylist.findIndex(e=>e._id.toString()==pharmacy[0]._id.toString()),1)
      // }

      // this.assignPharmacy(fac_data[0].pharmacy,'selection')//old with api implementation
    }
  }

  async changeStatus(status, flag) {

    this.resident['resident_status'] = status;
    this.isStatusChanged = true;
    // console.log("this.isStatusChanged", this.isStatusChanged)
    if (this.resident['resident_status'] !== 'Active') {
      // this.zonelist = [];
    } else {
      // this.changeSector(this.resident['sector'], flag)
    }

    // when status selected to Transferred resident_status or Skilled Nursing
    // console.log('this.organiz.id::::::::::::',this.organiz.id)
    // tslint:disable-next-line:max-line-length
    if (this.resident['resident_status'] == 'Transferred' || this.resident['resident_status'] == 'Skilled Nursing') {
      //  alert(' selected.......')
      this.isStatusFacility = true;
      //this.resident['resident_status'] = this.oldStatus;
      this.dialogRefs = this.dialog.open(StatusTransferredComponent, {
        width: '500px',
        panelClass: 'statuspopup',
        data: { faclist: this.faclist, orgId: this.resident["organization"], currentFacId: this.resident["facility"] }
      });
      this.dialogRefs.afterClosed().subscribe(async result => {
        if (result && result['status']) {
          this.resident['updated_status'] = status;
          this.resident['resident_status'] = status;
          if (this.resident['facility'] !== result['updated_data'][0]['current_fac']) {
            await this.changeFac(result['updated_data'][0]['current_fac'], false);
            this.resident['facility'] = result['updated_data'][0]['current_fac'];
          }
        }
        else {
          this.resident['resident_status'] = status;
        }
      });
    } else {
      this.isStatusFacility = false;
    }
  }

  async changeCareLevel(carelevel, status, flag) {
    if (carelevel.label === 'Level 1' || status === 'Deceased' || status === 'Moved' || status === 'Transferred') {
      this.disable_checkin = true;
      this.resident.two_am_checkin = true;
    } else {
      this.disable_checkin = false;
    }
    this.resident['care_level'] = carelevel;
  }

  async changeRoom(room, flag) {
    this.resident['room'] = room;
  }

  selectMultipleCares(id) {
    this.alllevels = false;
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      return false;
    }
    if (this.resident.secondary_care_level.length === this.carelevelData.length) {
      this.allSelected.select();
    }
    for (let i = 0; i < this.resident.secondary_care_level.length; i++) {
      if (this.resident.secondary_care_level[i] === 0) {
        this.resident.secondary_care_level.splice(i, 1);
      }
      if (this.resident.care_level && (this.resident.secondary_care_level[i] === this.resident.care_level)) {
        this.resident.secondary_care_level.splice(i, 1);
      }
    }
  }

  changeButton(button) {
    if (button === 'View') {
      this.viewmode = true;
      this.buttonName = 'Edit';
    } else {
      this.viewmode = false;
      this.buttonName = 'View';
    }
  }

  selectAllLevels() {
    if (this.allSelected.selected) {
      this.alllevels = true;
      var arr = [];
      for (let i = 0; i < this.secondarycarelevelData.length; i++) {
        arr.push(this.secondarycarelevelData[i]._id);
      }
      arr.push(0);
      this.resident.secondary_care_level = [...arr];
    } else {
      arr = [];
      this.resident.secondary_care_level = [];
    }
    for (let i = 0; i < this.resident.secondary_care_level.length; i++) {
      if (this.resident.care_level && (this.resident.secondary_care_level[i] === this.resident.care_level)) {
        this.resident.secondary_care_level.splice(i, 1);
      }
    }
  }

  // On tab changed
  selectedTabChanged(event) {
    const tabName = event.tab.textLabel;
    // console.log(tabName)
    if(tabName === 'Contacts' && this.contactApiCalled) {
      this.getContactDetails();
      this.contactApiCalled = false;
    } else if (tabName === 'Orders' && this.orderApiCalled) {
    this.getResidentMedicationOrderData(this.oldFacility, this.residentId);
      this.orderApiCalled = false;
    } else if (tabName === 'Medications and Treatments' && this.medAndTreatApiCalled) {
      // this.getOrderDetails();
      this.medAndTreatApiCalled = false;
    } else if (tabName === 'Diagnosis' && this.diagnosisApiCalled) {
      this.getDiagnosis();
      this.diagnosisApiCalled = false;
    } else if (tabName === 'Care Notes' && this.careNotesApiCalled) {
      this.getCareNotesData();
      this.careNotesApiCalled = false;
    } else if (tabName === 'Schedule' && this.scheduleApiCalled) {
      this.getScheduleData();
      this.scheduleApiCalled = false;
    } else if (tabName === 'Payers and Insurance' && this.payersAndInsuranceApiCalled) {
      this.getPayersAndInsuranceData();
      this.payersAndInsuranceApiCalled = false;
    } else if (tabName === 'Activities' && this.activityApiCalled) {
      this.getActivityData();
      this.activityApiCalled = false;
    }
  }

  async onSubmit(f, resident) {
    this.isDoneClicked = true;


    // console.log('selected index tab:', this.selectedIndexVal.value)

    // if(this.selectedIndexVal.value === 2){
    //   resident['insurance'] =  Object.assign(this.residentInsurance, { medical_coverage: this.addedCoverages, payers: this.addedPayers});
    //   console.log(this.resident['insurance']);
    //   return;
    // }
    resident['insurance'] = Object.assign(this.residentInsurance, { medical_coverage: this.addedCoverages, payers: this.addedPayers });
    // this.diseasesSelected = this.diagnoComponent.dataSourceDisease['data']
    // this.allergySelected = this.diagnoComponent.dataSourceAllergy['data']

    // let disease_id = this.diseasesSelected.map(e => ({ name: e.name.name, code: e.code, active: e.active ? e.active : false, preCovid: e.name.preCovid ? e.name.preCovid : false }))
    // let allergy_id = this.allergySelected.map(e => ({ name: e.name.name, code: e.code, active: e.active ? e.active : false, preCovid: e.name.preCovid ? e.name.preCovid : false }))

    this.show = 'Home'
    // console.log(resident);
    // return false;
    if (this.route.params['_value']['id']) {
      this.emergency['resident_id'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    }

    this.resident.emergency = this.emergencyArr;

    // return
    let vaild = f.form.status;

    //let vaild = 'VALID';
    resident.pharmacy_id = this.assignedPharmacy.filter(e => !e.is_fac).map(e => e._id)
    resident.physician_id = this.assignedPhysician.map(e => e._id)
    resident.pre_diseases = this.pre_diseases;

    resident.first_name = resident.first_name.trim();
    resident.last_name = resident.last_name.trim();
    resident.billingId = resident.billingId.trim();

    // resident.disease_id = disease_id
    // resident.allergy_id = allergy_id

    // resident.allergy_id = allergy_id

    if (resident.social_security_no && !this._commonService.validSsn(resident.social_security_no)) {
      this.toastr.error('Please enter valid Social security Number');
      return;
    }

    if (resident.first_name === '' || resident.last_name === '' || resident.organization === ''
      || resident.facility === '' || resident.care_level === '' || resident.status === '' || resident.billingId === '') {
      vaild = 'INVALID';
    }
    // if (resident.care_name === '' || resident.care_name === undefined) {
    //   this.toastr.error('Please select care');
    // } else if (resident.care_note === '' || resident.care_note === undefined) {
    //   this.toastr.error('Please enter care note');
    // }
    if (vaild === 'VALID') {
      delete this.resident.emails
      // console.log('-----res----', resident)
      if (resident.phone_numbers && resident.phone_numbers.length) {
        let emails = []
        resident.phone_numbers.forEach(e => {
          delete e.id

          /* if(e.name=='Email' || e.name=='Other'){
             emails.push(e)

           }*/
        })
        this.phoneArr.forEach(e => {
          delete e.id
        })
        if (this.phoneArr[0].value != '') {
          this.resident.phone_numbers.unshift(this.phoneArr[0]);
        }
        resident.phone_numbers = resident.phone_numbers.filter(e => e.value != '')
        emails = resident.phone_numbers.filter(e => e.name == 'Email' || e.name == 'Other')
        resident.phone_numbers = resident.phone_numbers.filter(e => e.name != 'Email' && e.name != 'Other')
        resident.emails = emails
      }

      /*if(resident.emails && resident.emails.length){
        console.log('------resident emails----',this.resident.emails)
        resident.emails.forEach(e=>delete e.id)
      }*/
      // console.log(resident.secondary_care_level);
      if (resident.secondary_care_level != undefined) {
        const secCareindex = resident.secondary_care_level.indexOf(0);
        if (secCareindex > -1) {
          resident.secondary_care_level.splice(secCareindex, 1);
        }
      }
      // if(!this.route.params['_value']['id'] && this.resident.care_note === ""
      //   && !this.residentCareList)
      // {
      //     this.toastr.error('Please enter care note ');
      //     return false;
      // }
      // console.log(resident);
      // return false;
      // if(this.route.params['_value']['id'] && this.residentCareList.length ==0){
      //     this.toastr.error('Add minimum one care ');
      //     return false;
      // }


      //Start data
      if (!this.ismultifac) {
        if (!this.resident.care_name || !this.resident.care_note) {
          //if(this.resident.care_name === "" || this.resident.care_note ==="" ){
          this.resident['cares'] = [];
        } else {
          this.resident['cares'] = [{
            care_id: this.resident.care_name,
            care_note: this.resident.care_note,
          }];
        }
      } else {
        this.resident['cares'] = this.residentCareList.map(item => ({
          care_id: item.care_id, care_note: item.care_note, selected: item['selected']
        })
        );
      }

      // if (this.route.params['_value']['id']&& this.ismultifac && this.resident['cares'].some(
      //   item => item.care_id === this.resident.care_name))
      // {

      //   if (this.toastr.currentlyActive === 0) {
      //    this.toastr.error('Care already added');
      //   }
      // }

      //End data
      //else{
      if (this.route.params['_value']['id'] && this.resident['care_name'] && this.resident['care_note']) {
        if (!this.resident['cares'].some(
          item => item.care_id === this.resident.care_name)) {
          this.resident['cares'].push({
            care_id: this.resident.care_name,
            care_note: this.resident.care_note,
            selected: false
          });
        }
      }
      //return false;
      if (this.resident.resident_status === 'Transferred') {
        resident['resident_status'] = 'Pending';
        resident['updated_status'] = 'Transferred';
      }
      resident.fac_timezone = this.utc_timezone;
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'residents/add' };
      const payload = resident;
      // console.log('add_residents payload---->', payload);
      this.add_residents(action, payload);
      /*this._commonService.setLoader(true);
      if (this.route.params['_value']['id'] && this.oldFacility !== this.resident.facility) {
        this.resident.diff_res = true;
        this.dialogConfig.maxWidth = '500px';

        this.dialogConfig.data = {
          'action': { type: 'POST', target: 'residents/add' },
          'payload': resident
        };

        // this.dialog.open(RepeatCareComponent, dialogConfig);
        this.dialogRefs = this.dialog.open(this.callConfirmDialog, this.dialogConfig);
        this._commonService.setLoader(false);
      } else {
        if (this.route.params['_value']['id'] && this.oldStatus !== this.resident.resident_status &&
          (this.resident.resident_status === 'Deceased' || this.resident.resident_status === 'Transferred' || this.resident.resident_status === 'Moved')) {
          this.dialogConfig.maxWidth = '500px';
          const action = { type: 'POST', target: 'residents/add' };
          const payload = resident;
          this.dialogConfig.data = {
            'action': action,
            'payload': payload
          };
          this.dialogRefs = this.dialog.open(this.confirmStatus, this.dialogConfig);
          this._commonService.setLoader(false);
        } else if (this.route.params['_value']['id'] && this.oldStatus !== this.resident.resident_status && resident['resident_status'] === 'Pending') {
          this.dialogConfig.maxWidth = '500px';
          resident['room'] = null;
          const action = { type: 'POST', target: 'residents/add' };
          const payload = resident;
          this.dialogConfig.data = {
            'action': action,
            'payload': payload
          };
          this.dialogRefs = this.dialog.open(this.confirmStatus, this.dialogConfig);
          this._commonService.setLoader(false);
        } else {
          const action = { type: 'POST', target: 'residents/add' };
          const payload = resident;
          this.add_residents(action, payload);
        }
      }*/
      //}
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid resident details');
        this.isDoneClicked = false;
      }
    }
  }

  async add_residents(action, payload) {
    let newResidentId;
    await this.apiService.apiFn(action, payload)
      .then((result: any) => {
        // console.log(result)
        newResidentId = result['data']._id
        this._commonService.setLoader(false);
        const residentID = this.route.params['_value']['id'] ? this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) : result.data['_id'];
        // console.log(this.uploader1)
        if(this.uploader1){
          this.uploader1.options.url = this.uploader1.options.url.replace('}', '') + '/' + residentID;
        if (this.uploader1.queue && this.uploader1.queue.length > 0) {
          this.uploader1.queue.filter((x) => {
            x.url = x.url.replace('}', '') + '/' + residentID;
          });
        }
        setTimeout(() => {
          this.uploadImage(() => {
            setTimeout(() => {
              this._commonService.setLoader(false);
            }, 100);
          });

          // this.uploadQueue(() => {
          //   setTimeout(() => {
          //     this._commonService.setLoader(false);
          //   }, 100);
          // });
        }, 100);
        }

      });


    // tslint:disable-next-line: max-line-length
    this.route.params['_value']['id'] ? this.toastr.success('Resident updated successfully') : this.toastr.success('Resident added successfully');

    if (this.resident._id != undefined && this.isolation_end_date != '' && this.resident.is_out_of_fac) {
      this.isolation_end_date = '';
      let eve = { value: 'stop' };
      this.customIsolation(eve, false);

    }
    if (this.route.params['_value']['id']) {
      this.router.navigate(['/residents']);
    }
    else {
      if (newResidentId && this._commonService.checkPrivilegeModule('residents', 'edit')) {
        this.isDoneClicked = false;
        this.router.navigate(['/residents/form', this._aes256Service.encFnWithsalt(newResidentId)]);
      }
      else {
        this.router.navigate(['/residents']);
      }
    }
    // this.router.navigate(['/residents']);
  }

  async check_ssn_exist(action, payload) {

    const result = await this.apiService.apiFn(action, payload);
    this._commonService.setLoader(false);
    if (result['status'] == true) {
      this.resident.social_security_no = null;
      //  this.toastr.error('social security number already exist');
      this.SSNAlreadyExist = true;
    }
    else {
      this.SSNAlreadyExist = false;
    }
    return result['status'];
  }


  async check_billid_exist(action, payload) {

    const result = await this.apiService.apiFn(action, payload);
    this._commonService.setLoader(false);
    if (result['status'] == true) {
      this.resident.billingId = null;
      // this.toastr.error('Billing Id already exist,enter valid Billing Id');
      this.BillingIdAlreadyExist = true;
    }
    else {
      this.BillingIdAlreadyExist = false;
    }
    return result['status'];

  }

  async facilityChangeConfirm(action, payload) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/unassigned_resident' },
      { resident: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) }
    );
    this.dialogRefs.close(['result']['status'] = false);
    payload['room'] = null;
    this.add_residents(action, payload);
  }

  async onChangefacility(value: boolean) {
    //this.resident.out_of_Fac = event.checked;
    this._commonService.setLoader(true);
    this.old_is_out_of_fac = this.resident.is_out_of_fac = value;
    if (this.resident._id !== undefined) {
      const residentlist = [];
      residentlist.push(this.resident._id);
      //const payload = { 'residentList': residentlist, value: event.checked }
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/resi_outoffac' },
        { 'residentList': residentlist, value: value }
      )
        .then((result: any) => {
          console.log("Result---resi_outoffac",result);
          if (result.status) {
            this.toastr.success(result.message);
            if (value === false && this.resident['testing_status'] === 'Positive') {
              let eventt = { value: 14 };
              this.customIsolation(eventt, false);
            }
            // if (event.value === false && this.resident['testing_status'] === 'Positive') {
            //   let eventt = { value: 14 };
            //   this.customIsolation(eventt, false);
            // }
          } else {
            this.toastr.error(result['message']);
          }
        });
    }

    if (value) {
      this.oldValueSetIsolation = this.resident['isolation_apply_come_to_fac'] = 'on-ground/no-isolation';
      if (this.resident._id !== undefined) {
        this.isNoIsolation = true
        // this.customIsolation({ value: 'stop' }, false);
      }
    }
    this._commonService.setLoader(false);
  }

  async onChangeHospice(event) {
    this.resident.hospice = event.checked;
    if (this.resident._id !== undefined) {
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/resi_hospice' },
        { 'residentId': this.resident._id, days: event.checked }
      )
        .then((result: any) => {
          if (result.status) {
            this.toastr.success(result.message);
          } else {
            this.toastr.error(result.message);
          }
        });
    }
  }

  async onChangeDNR(event) {
    this.resident.dnr = event.checked;
    if (this.resident.dnr == true) {
      this.dnrStatus = '#EF3E36';
    } else {
      this.dnrStatus = '#B9BABC';
    }
    if (this.resident._id !== undefined) {
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/resi_dnr' },
        { 'residentId': this.resident._id, value: event.checked }
      )
        .then((result: any) => {
          if (result.status) {
            this.toastr.success(result.message);
          } else {
            this.toastr.error(result.message);
          }
        });
    }
  }

  async onChangeIsRoom(event) {
    this.resident.is_out_of_room = event;
    console.log("this.resident.is_out_of_room", this.resident.is_out_of_room)
    if (this.resident._id !== undefined) {
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/resi_out_of_room' },
        { 'resident_id': this.resident._id, status: event }
      )
        .then((result: any) => {
          console.log("this.resident.is_out_of_room", result);
          if (result['status']) {
            this.toastr.success(result['message']);
          } else {
            this.toastr.error(result['message']);
          }
        });
    }
  }

  async onChangeCheckin(event) {
    if (this.resident._id !== undefined) {
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/resi_two_am_checkin' },
        { 'residentId': this.resident._id, days: event.checked }
      )
        .then((result: any) => {
          if (result.status) {
            this.toastr.success(result.message);
          } else {
            this.toastr.error(result.message);
          }
        });
    }
  }

  cancel() {
    this.router.navigate(['/residents']);
  }

  checkAlpha(key, type) {
    if (type == 'alpharesi') {
      return this._commonService.allwoOnlyAlpharesi(key);
    } else if (type == 'alpha') {
      return this._commonService.allwoOnlyAlpha(key);
    } else if (type == 'alphaAndNumAndSpace') {
      return this._commonService.allwoAlphaAndNumAndSpace(key);
    }
  }
  checkAlphalast(key) {
    const result = this._commonService.allwoOnlyAlpha(key);
    return result;
  }

  checkIsUniqueSSN() {
    //this.resident.social_security_no
    console.log('this.oldSSN::::::::::::::', this.oldSSN)
    if (this.resident.social_security_no != this.oldSSN) {
      const action = { type: 'POST', target: 'residents/check_resident_ssn' };
      const payload = { social_security_no: this.resident.social_security_no };
      const result = this.check_ssn_exist(action, payload);


    }
  }
  checkIsUniqueBillId() {
    //this.resident.social_security_no
    console.log('this.oldBillingId::::::::::::::', this.oldBillingId)
    if (this.resident.billingId != this.oldBillingId) {
      const action = { type: 'POST', target: 'residents/check_resident_bilingid' };
      const payload = { billingId: this.resident.billingId };
      const result = this.check_billid_exist(action, payload);
    }
  }

  async corrCheEmail(e, f) {
    if (this.resident.email === e.target.value) {
      this.emailNotMatch = false;
      f.form.controls['confirmemail'].setErrors(null);
    } else {
      this.emailNotMatch = true;
      f.form.controls['confirmemail'].setErrors({ 'incorrect': true });
    }
  }

  async loadCarelevel() {

    await this.apiService.apiFn(
      { type: 'GET', target: 'residents/carelevellist' },
      { date: new Date(), type: ["1", "3"], facility: this.nfc_fac }
    )
      .then((result: any) => {
        this.carelevelData = result['data'].sort((a,b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));
      });
  }

  async loadSecondaryCarelevel(care: any = '') {
    const payload = { date: new Date(), type: ["2", "3"] };
    if (care.length) {
      payload['care'] = care
    }
    await this.apiService.apiFn(
      { type: 'POST', target: 'residents/carelevelsecondarylist' },
      payload
    )
      .then((result: any) => this.secondarycarelevelData = result.data);
  }

  async oncareSelect(item) {
    this.resident.secondary_care_level = [];
    this.loadSecondaryCarelevel([item])
  }

  async loadDiseases() {
    await this.apiService.apiFn({ type: 'GET', target: 'diseases/list' }, {})
      .then((result: any) => {
        this.diseaseData = result.data;
        this.categories = this.diseaseData.filter(c => c.parent_id === null).map(c => <{ name: string, sub: any, }>{
          name: c.name,
          sub: this.diseaseData.filter(sc => sc.parent_id !== null && sc.parent_id._id === c._id)
            .map(sc => <{ name: string, id: string, sub: any }>{
              name: sc.name, id: sc._id,
              // sub: this.diseaseData.filter(c => c.parent_id !== null && sc._id === c.parent_id._id).map(ss => <{ secondSub: object[] }>{
              //   secondSub: ss.name,id:ss._id,
              // })
            }),
        });
      });
  }

  selectDisease(id) {
    const pos = this.pre_diseases.indexOf(id);
    if (pos > -1) {
      this.pre_diseases.splice(pos, 1);
    } else {
      this.pre_diseases.push(id);
    }
  }

  async testingStatus(event) {
    this._commonService.setLoader(true);
    if (this.resident._id !== undefined) {
      const residentlist = [];
      residentlist.push(this.resident._id);
      const action = { type: 'POST', target: 'residents/resident_testing' };
      const payload = { 'residentList': residentlist, value: event.value };
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.toastr.success(result['message']);
        if (payload.value === 'Positive') {
          let event = { value: 14 };
        } else {
          let event = { value: 'stop' };
          this.customIsolation(event, false);
        }
      } else {
        this.toastr.error(result['message']);
      }
    }
    this._commonService.setLoader(false);
    // const dialogRef = this.dialog.open(ConfirmComponent, {
    //   width: '350px',
    //   data: { 'title': `Are you want to sure update testing status?`  }
    // });
    // dialogRef.afterClosed().subscribe(async result => {

    //  if (result) {
    //   if (this.resident._id !== undefined) {

    //     const residentlist = [];
    //     residentlist.push(this.resident._id);
    //     const action = { type: 'POST', target: 'residents/resident_testing' };
    //     const payload = { 'residentList': residentlist, value: event.value };
    //     const result = await this.apiService.apiFn(action, payload);
    //     if (result['status']) {
    //       console.log(result['status']);
    //       this.toastr.success(result['message']);
    //       if(payload.value ==='Positive'){
    //         let event={ value:14};
    //          this.customIsolation(event,false);
    //       }

    //     } else {
    //       this.toastr.error(result['message']);
    //     }
    //    }
    //  } else {
    //   this.resident['testing_status'] = this.oldValueTestingStatus;
    //   console.log(this.resident['testing_status']);
    //  }

    // });
  }
  async customIsolation(event, msg = true) {
    this._commonService.setLoader(true);
    if (this.resident._id !== undefined) {
      if (event.value != '' && event.value != 'stop') {
        await this.apiService.apiFn(
          { type: 'POST', target: 'residents/custom_isolation' },
          { 'resident_id': this.resident._id, days: event.value }
        )
          .then((result: any) => {
            if (msg) {
              if (result.status) {
                this.toastr.success(result.message);
              } else {
                this.toastr.error(result.message);
              }
            }
          });
        this._commonService.setLoader(false);
      }
      // if (event.value != '' && event.value == 'stop') {
      //   this.isNoIsolation = true;

      // }else{this.isNoIsolation = false;}

      if (event.value != '' && event.value == 'stop') {
        await this.apiService.apiFn(
          { type: 'POST', target: 'residents/stop_isolation' },
          { 'resident_id': this.resident._id }
        )
          .then((result: any) => {
            if (msg) {
              if (result.status) {
                this.toastr.success(result.message);
              } else {
                this.toastr.error(result.message);
              }
            }
          });
        this._commonService.setLoader(false);
      }
    }
  }
  async setIsolation(event) {
    let str = event.value;
    let days = (str == 'on-ground/no-isolation' || str == 'off-ground/no-isolation') ? 'No Isolation' : ((str != 'off-ground/Indefinite') ? parseInt(str.match(/\d+/)) + ' days' : 'Indefinite');

    // const dialogRef = this.dialog.open(ConfirmComponent, {
    //   width: '350px',
    //   data: { 'title': `Are you want to sure ${days} isolation set to this resident?`  }
    // });
    // dialogRef.afterClosed().subscribe(async result => {

    //if (result) {
    this.oldValueSetIsolation = this.resident['isolation_apply_come_to_fac'] = event.value;
    if (this.resident._id !== undefined) {
      await this.apiService.apiFn(
        { type: 'POST', target: 'residents/set_isolation' },
        { 'resident_id': this.resident._id, days: event.value }
      )
        .then((result: any) => {
          if (result.status) {
            this.toastr.success(result.message);
          } else {
            this.toastr.error(result.message);
          }
        });
    }
    // } else {
    //  this.resident['isolation_apply_come_to_fac'] = this.oldValueSetIsolation;
    //  console.log(this.resident['isolation_apply_come_to_fac']);
    // }
    // });
  }

  timerCompleted(event) { }

  resetQueue() {
    if (this.uploader.queue.length > 0) this.uploader.queue = [];
  }

  async fileUploader1(residentId = '') {
    let url = '';
    if (residentId !== '') {
      url = environment.config.api_url + 'residents/attachmentupload/' + residentId;
    } else {
      url = environment.config.api_url + 'residents/attachmentupload';
    }
    // let url = environment.config.api_url + 'residents/attachmentupload';
    const _headers: any = await this.apiService.setHeadersForFileUpload();
    this.uploader1 = new FileUploader({
      url: url,
      method: 'POST',
      disableMultipart: false,
      headers: _headers,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      queueLimit: 5,
      allowedMimeType: [
        'application/msword',
        'application/pdf',
        'application/rss+xml',
        'application/vnd.google-earth.kml+xml',
        'application/vnd.google-earth.kmz',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.sun.xml.calc',
        'application/vnd.sun.xml.writer',
        //"application/x-gzip","application/zip",
        'audio/basic',
        'audio/flac',
        'audio/mid',
        'audio/mp4',
        'audio/mp3',
        'audio/mpeg',
        'audio/ogg',
        'audio/x-aiff',
        'audio/x-wav',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'image/x-ms-bmp',
        'text/calendar',
        'text/comma-separated-values',
        'text/csv',
        'text/css',
        'text/html',
        'text/plain',
        'text/x-vcard',
        'video/mp4',
        'video/mpeg',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo'
      ],
    });
    this.uploader1.onBeforeUploadItem = (item) => {
      item.withCredentials = false;
    };
  }

  async removeFile(path) {
    if (path != undefined && path != '') {
      // return
      await this.apiService.apiFn(
        { type: 'POST', target: 'users/attachmentremove' },
        { filepath: path }
      )
        .then((result: any) => {
          if (result.status == true) {
            // delete this.uploader.queue[index];
            // this.uploader.queue = this.uploader.queue.filter(function (el) {
            //   return el != null;
            // });
            let index = this.resident.files.findIndex(x => x.path === path);
            if (index > -1) this.resident.files.splice(index, 1);
          } else {
            this.toastr.error(result.message);
          }
        });
    }
  }

  openDialog() {
    let Poa = this.displayData;
    let multiPOA: boolean = false;
    if (this.displayData.length != 0) {
      //  let _Arr = this.emergencyArr.map(({ type_of_contact }) => type_of_contact);
      //  var searchParam = "Power of Attorney";
      //  var index = _Arr.findIndex(x=>x.includes(searchParam));
      //  console.log(index);
      //  for (var i = 0; i < this.displayData.length; i++) {
      //     if (this.displayData[i] === this.displayData[0]) {
      //         this.displayData[i].type_of_contact = ["Emergency Contact"];
      //         break;
      //     }

      // }
      let checkContact: any = this.displayData.map(function (value) {
        return value.type_of_contact;
      });
      // const mergeContact = checkContact.flat(1);
      // let duplicate = mergeContact.includes("Power of Attorney");
      // if(duplicate == true){
      //   multiPOA=true;
      // }
      // else{
      multiPOA = false;
      //}
    }
    //let  isPowerOfAttorney = false;
    //let _Arr = this.emergencyArr.map(({ type_of_contact }) => type_of_contact);
    //isPowerOfAttorney = _Arr.indexOf('Power of Attorney') > -1 ? true : false;
    let _emergency_contact = this.emergencyArr.map((item) => { return item.emergency_contact });
    let max_emergency_contact = Math.max.apply(null, _emergency_contact);
    if (!(max_emergency_contact > 0)) {
      max_emergency_contact = 0;
    }
    const dialogRef = this.dialog.open(EmergencyContactComponent, {
      // width: '670px',
      // disableClose:true,
      autoFocus: false,
      data: { resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']), Poa: Poa, multiPOA: multiPOA, lengthOfExistingContact: max_emergency_contact },
      panelClass: 'contactpopup',
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('---resss2---', result)
      if (result) {
        this.emergency = result;
        //console.log(result);
        //console.log(this.emergency);
        this.emergencyArr.push(result);
        console.log('--arr--', this.emergencyArr, this.emergency)
        //console.log(this.emergencyArr);
        // if(this.displayData.length > 1 && multiPOA ==true && result.ismultiPoa == true)
        // {
        //    let _Arr = this.displayData.map(({ type_of_contact }) => type_of_contact);
        //    var searchParam = "Power of Attorney";
        //    var index = _Arr.findIndex(x=>x.includes(searchParam));
        //    console.log(index);
        //    for (var i = 0; i < this.displayData.length; i++)
        //    {
        //      if (this.displayData[i] === this.displayData[index])
        //     {
        //       if(this.displayData[i].type_of_contact[0] == "Emergency Contact" ||
        //          this.displayData[i].type_of_contact[1] == "Emergency Contact"){
        //          this.displayData[i].type_of_contact = ["Emergency Contact"];
        //       }
        //       else
        //       {
        //         this.displayData[i].type_of_contact = [];
        //       }
        //       break;
        //     }

        //    }
        // }
        this.displayData = (this.emergencyArr.length > 3) ? this.emergencyArr.slice(0, 3) : this.emergencyArr;

      }
    });
  }

  openTasks() {
    const dialogRef = this.dialog.open(OpenTasksComponent, {
      width: '670px',
      data: this.open_cares
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  uploadQueue(next = null) {
    // this.buttonDisabled=true;
    const files = this.uploader1.queue;
    files.forEach(file => {
      if (file.progress == 0) {
        file.upload();
        file.onError = (response: string, status: number, headers: any) => {
          console.log('dfsdfsdfsdfsdfsdfsd', response, status);
        };
        file.onSuccess = (response: any, status: number, headers: any) => {
          const res = JSON.parse(response);
          file['newName'] = res.data.location;
          // let decResult = this.aes256Service.decFn(response);
          //const res = JSON.parse(response);
          //s

          //    this.item.images.push(res.imagData);
          // let  decResult = this.aes256Service.decFn(response);
          this.resident.files.push({ path: res.data.location });
          if (next) {
            next();
          }
        };
      }

    });
    if (files.length > 5) {
      this.toastr.error('Max 5 file allow to upload.');
    }
    if (!files || (files && files.length === 0)) {
      if (next) next();
    }
  }

  getDob(type: string, event) {
    this.resident.dob = event.value;
    var a = moment();
    var b = moment(event.value, 'YYYY');

    if (isNaN(a.diff(b, 'years')) || a.diff(b, 'years') < 0) {
      this.resident.age = 0
    } else {
      this.resident.age = a.diff(b, 'years'); // calculates patient's age in years
      this.minDate = new Date(moment(this.resident.dob).add(1, 'days').valueOf())
    }
    //this.events.push(`${type}: ${event.value}`);
  }
  minDateOfAdmit(resdate) {
    return new Date(moment(resdate).add(1, 'days').valueOf())
  }
  allowDateKeys(key) {
    return this._commonService.allowDateKeys(key);
  }
  admitDate(type: string, event) {
    this.resident.admit_date = event.value;
    //this.events.push(`${type}: ${event.value}`);
  }

  contactsToggle(action) {
    if (action == 'show') this.showAll = true;
    if (action == 'hide') this.showAll = false;
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
    // const residentID = this.route.params['_value']['id'] ? this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) : result['data']['_id'];
    // this.uploader.options.url = this.uploader.options.url.replace('}', '') + '/' + residentID;
    this.uploader.options.url = this.uploader.options.url.replace('}', '');
    if (this.uploader.queue && this.uploader.queue.length > 0) {
      this.uploader.queue.filter((x) => x.url = x.url.replace('}', ''));
    }

    setTimeout(() => {
      this.uploadImage(() => {
        setTimeout(() => {
          this._commonService.setLoader(false);
        }, 100);
      });

      // this.uploadQueue(() => {
      //   setTimeout(() => {
      //     this._commonService.setLoader(false);
      //   }, 100);
      // });

    }, 100);
    return true;
  }

  onFileChanged1(event) {
    const _validFileExtensions = ['.jpg', '.jpeg', '.bmp', '.gif', '.png'];

    if (this.uploader1.queue.length > 5) {
      this.uploader1.queue = [];
      this.toastr.error('Only 5 images upload allowed at a time');
    }
    return true;
  }

  uploadImage(next = null) {
    this._commonService.setLoader(true);
    // this.buttonDisabled = true;
    const files = this.uploader.queue;
    files.forEach(file => {
      if (file.progress == 0) {
        file.upload();
        file.onError = (response: string, status: number, headers: any) => {
        };
        file.onSuccess = (response: any, status: number, headers: any) => {
          const res = JSON.parse(response);
          this.resident.profile_image = res.data;
          this._commonService.setLoader(false);

          if (next) next();
        };
      }
    });

    if (!files || (files && files.length === 0)) {
      if (next) next();
    }
    // setTimeout(() => {
    // this.buttonDisabled = false;
    // }, 200);
  }

  async fileUploader(residentId = '') {
    let url = '';
    // if (residentId !== '') {
    //   url = environment.config.api_url + 'residents/profileimage/' + residentId;
    // } else {
    url = environment.config.api_url + 'residents/profileimage';
    // }
    const _headers: any = await this.apiService.setHeadersForFileUpload();
    // if (this.care.image && this.care.image.location) {
    //   _headers.push({ 'name': 'oldimagename', 'value': this.care.image.imageName });
    // }
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

  editContact(item, fromnotes) {
    let Poa = this.displayData;
    let multiPOA: boolean = false;
    if (this.displayData.length > 1) {
      let checkContact: any = this.displayData.map((value) => value.type_of_contact);
      // const mergeContact = checkContact.flat(1);
      // let check= mergeContact.filter((v) => (v === "Power of Attorney")).length;
      // console.log(check);
      // let duplicate = mergeContact.includes("Power of Attorney");
      // if(duplicate == true){
      //   multiPOA=true;
      // }
      // else{
      multiPOA = false;
      //}
      let _Arr = this.displayData.map(({ type_of_contact }) => type_of_contact);
      //var searchParam = "Power of Attorney";
      //var index = _Arr.findIndex(x=>x.includes(searchParam));
      //console.log(index);
    }

    //let isPowerOfAttorney = false;
    //let _Arr = this.emergencyArr.map(({ type_of_contact }) => type_of_contact);
    //isPowerOfAttorney = _Arr.indexOf('Power of Attorney') > -1 ? true : false;
    //residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id'])
    const dialogRef = this.dialog.open(EmergencyContactComponent, {
      width: '1130px',
      disableClose:true,
      autoFocus: false,
      panelClass: 'contactpopup',
      data: { multiPOA: multiPOA, 'emergency': item, 'emergencyData': this.emergencyArr, 'residentId': (this.route.params['_value']['id'] ? this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) : ''), isNoteClicked: fromnotes ? true : false }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (this.displayData.length > 1 && multiPOA == true && result.ismultiPoa == true) {
        // let _Arr = this.displayData.map(({ type_of_contact }) => type_of_contact);
        // console.log(_Arr);
        // var searchParam = "Power of Attorney";
        // var index = _Arr.findIndex(x=>x.includes(searchParam));
        // console.log(index);
        //  for (var i = 0; i < this.displayData.length; i++)
        //  {
        //    if (this.displayData[i] === this.displayData[index])
        //   {
        //     if(this.displayData[i].type_of_contact[0] == "Emergency Contact" ||
        //        this.displayData[i].type_of_contact[1] == "Emergency Contact"){
        //        this.displayData[i].type_of_contact = ["Emergency Contact"];
        //     }
        //     else
        //     {
        //       this.displayData[i].type_of_contact = [];
        //     }
        //     break;
        //   }

        //  }
      }

      // if (result) {
      // }
    });
  }

  deleteContact(item) {
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'emergency Contact', id: item._id, API: 'residents/delete_emergencyContact' }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log("contact result::::::", result)
      if (result && result.status === true) {
        this.toastr.success('Emergancy contact deleted successfully');
        // this._commonService.setLoader(true);
        var removeIndex = this.emergencyArr.map((item1) => item1._id).indexOf(item._id);
        // // remove object
        this.emergencyArr.splice(removeIndex, 1);
        this.emergencyArr = this.emergencyArr.map((e, i) => ({ ...e, emergency_contact: i + 1 }))

        //  this._commonService.setLoader(false);
      } else {
        this.toastr.error('no contact deleted');

      }
    });
  }

  confirmIsolation(event) {
    this.customIsolation(event);
    // const dialogRef = this.dialog.open(ConfirmComponent, {
    //   width: '350px',
    //   data: { 'title': `Are you want to sure ${event.value} days isolation to this resident?`  }
    // });
    // dialogRef.afterClosed().subscribe(result => {

    //  if (result) {
    //    this.customIsolation(event);
    //    console.log(this.customIsolation(event));
    //  } else {
    //   this.resident.custom_isolation = this.oldValueIsolation;
    //   console.log(this.resident.custom_isolation);
    //  }
    // });
  }

  confirmChangeFacility(event: MatSelectChange) {
    this.onChangefacility(event.value);
    // const dialogRef = this.dialog.open(ConfirmComponent, {
    //   width: '350px',
    //   data: { 'title': `Are you want to sure?`  }
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //    console.log(result);
    //  if (result) {
    //    console.log("-----11111---");
    //    this.onChangefacility(event);
    //  } else {
    //    console.log("-----22222222---");
    //   this.resident.is_out_of_fac = this.old_is_out_of_fac;
    //   console.log(this.resident.is_out_of_fac);
    //  }
    // });
  }

  async getAllCaresIm() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'cares/getCares' },
      { 'type_not_in': ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'] }
    )
      .then((result: any) => this.tempcareImg = result['data']);
  }

  // Start Care list data
  async getAllcaress() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'cares/getCares' },
      { 'type_not_in': ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'] }
    )
      .then(async (result: any) => {
        this.tempcareData = result.data;

        this.carelistData = result.data.filter(item => item.name && item.name != null);
        if (this.route.params['_value']['id'] && this.residentCareList) {
          for (var i = this.carelistData.length - 1; i >= 0; i--) {
            for (var j = 0; j < this.residentCareList.length; j++) {
              if (this.carelistData[i]._id === this.residentCareList[j].care_id) {
                this.carelistData.splice(i, 1);
              }
            }
          }
        }

        this.carelist = await result.data.map((obj) => {
          return { 'value': obj['name'], 'key': obj._id }
        });


      });
  }

  async getAllcares() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'cares/getCares' },
      { 'type_not_in': ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'] }
    )
      .then((result: any) => {
        this.carelistData = result['data'];
        this.carelist = this.carelistData;
        // console.log('this.carelistresponse-------->', this.carelist)
        this.carelist.filter(obj => {
          obj['key'] = obj._id ? obj._id : '';
          obj['value'] = obj.name ? obj.name : '';
          obj['subCares'] = obj.subCares ? obj.subCares : [],
            obj['image'] = (obj.image && obj.image.location) ? obj.image.location : '';
          if (obj.subCares && obj.subCares.length) {
            obj.subCares.filter(data => {
              data['key'] = data._id;
              data['value'] = data.name ? data.name : '';
              data['subCare'] = true;
              data['parentCareId'] = obj._id ? obj._id : '';
              data['image'] = (data.image && data.image.location) ? data.image.location : '';
            });
          }
        })
        this.carelist.filter(item => {
          if (item.subCares && item.subCares.length > 0) {
            item['hasSubCares'] = true;
          } else {
            item['hasSubCares'] = false;
          }
        });
      })
      .catch((error) => this.toastr.error(error.message ? error.message : 'Some error occured, please try again.'));
  }

  // activeToggler(selectedIndex,event) {
  //   event.stopPropagation();
  //   this.activeClassIndex = (this.activeClassIndex == selectedIndex) ? null : selectedIndex;
  // }

  async changeCare(care, multi) {
    this.multiorg = '';
    this.resident.care_name = care.value;
    this.multiorg = multi;
    // console.log('care---->', care.value);
    this.selectedCareList = [];
    const index = this.carelist.findIndex(item => item.key === care.value);
    // console.log('index--->', index);
    if (index != -1) {
      let careData =  this.carelist.filter(item => item.key === care.value);
      this.selectedCareList.push({
        care: careData[0]
      });
    } else {
      for (let i = 0; i < this.carelist.length; i++) {
        if (this.carelist[i].subCares && this.carelist[i].subCares.length) {
          for (let j = 0; j < this.carelist[i].subCares.length; j++) {
            if (this.carelist[i].subCares[j].key === care.value) {
              this.selectedCareList.push({
                care: this.carelist[i].subCares[j],
              });
              break;
            }
          }
        }
      }
    }
    this.activeClassIndex = null;
    // console.log('this.selectedCareList---->', this.selectedCareList);

    // for (let i = 0; i < this.carelist.length; i++) {
    //   if (this.carelist[i].key === care.value) {
    //     this.selectedCareList.push({
    //       care: this.carelist[i],
    //     });
    //     console.log('this.carelist[i]--->',this.carelist[i]);
    //     this.carelist.splice(i, 1);
    //   } else if (this.carelist[i].subCares && this.carelist[i].subCares.length) {
    //     for (let j = 0; j < this.carelist[i].subCares.length; j++) {
    //       if (this.carelist[i].subCares[j].key === care.value) {
    //         this.selectedCareList.push({
    //           care: this.carelist[i].subCares[j],
    //         });
    //         this.carelist[i].subCares.splice(j, 1);
    //         break;
    //       }
    //     }
    //   }
    // }
    // this.multiorg = care.source.selected.viewValue;
  }
  async selectedCare() {
    this.multicare = this.careEditlist[0].care_name;
    // this.careEditname.care_name = care;
    // console.log(this.careEditname.care_name);
  }
  select(care, type) {
    if ((!care || care != undefined) && type == 'org') this.multiorg = care;
    if ((!care || care != undefined) && type == 'care') this.multicare = care;
  }
  // selected(care) {
  //   if (!care || care != undefined) this.multicare = care;
  // }

  //  async addCareList(resident) {
  //    // console.log(resident);
  //    // return false;
  //    console.log(this.residentCareList);
  //    //return false;
  //   if (resident.care_name === '' || resident.care_name === undefined) {
  //     this.toastr.error('Please select care');
  //   } else if (resident.care_note === '' || resident.care_note === undefined) {
  //     this.toastr.error('Please enter care note');
  //   }
  //   else {
  //     this.ismultifac = true;
  //     if (this.residentCareList === undefined || this.residentCareList.length < 1) {
  //       this.residentCareList = [
  //         {
  //           'care_id': resident.care_name,
  //           'care_name': this.multiorg,
  //           'care_note': resident.care_note,
  //         }
  //       ];

  //     } else {
  //       if (this.residentCareList.some(item => item.care_name.toLowerCase().trim() === this.multiorg.toLowerCase().trim())) {
  //         if (this.toastr.currentlyActive === 0) {
  //           this.toastr.error('Care already added');
  //         }
  //       } else {
  //         console.log(this.residentCareList);
  //         console.log(this.multiorg);
  //         this.residentCareList.push({
  //           care_id:   resident.care_name,
  //           care_name: this.multiorg,
  //           care_note: resident.care_note,
  //         });
  //        }
  //     }
  //     if (this.residentCareList.length > 0) {
  //       this.showfaclist = true;
  //       this.ismultifac = true;
  //       console.log(this.multiorg);
  //        console.log(this.residentCareList);
  //       this.dataSource = new MatTableDataSource(this.residentCareList);
  //     } else {
  //       this.ismultifac = false;
  //       this.showfaclist = false;
  //     }
  //     this.resident['care_name'] = '';
  //     this.resident['care_note'] = '';
  //   }
  //   for (var i = this.carelistData.length - 1; i >= 0; i--) {
  //    for (var j = 0; j < this.residentCareList.length; j++) {
  //     if (this.carelistData[i]._id === this.residentCareList[j].care_id) {
  //       this.carelistData.splice(i, 1);
  //       }
  //     }
  //   }
  // }

  async onRemoveFac(i) {
    this.residentCareList.splice(i, 1);
    if (this.residentCareList.length > 0) {
      this.showfaclist = true;
      this.ismultifac = true;
      this.dataSource = new MatTableDataSource(this.residentCareList);
    } else if (this.residentCareList.length === 0) {
      this.showfaclist = false;
      this.ismultifac = false;
    }
  }

  // function to accept only alpha numeric character
  checkAlphanum(key) {
    return this._commonService.allwoAlphaAndNum(key);
  }
  isCareNoteTextExceed(note) {
    // let array = note.replaceAll('<p>', '').split('</p>');
    // if(array.length > 2){
    //   return true
    // }else{
    //   if(array[0] && $(array[0]).text().length > 35) {
    //     return true
    //   }else{
    //     return false
    //   }
    // }

    let array = note.replaceAll('<p>', '').split('</p>');
    if (array.length > 2) {
      return true;
    } else {
      return array[0] && array[0].length > 35;
    }
  }

  shortText(note) {

    let tagsrem = ['<p>', '<em>','</em>','<u>','</u>','<strong>','</strong>'];
    let newstring = note;
    tagsrem.map(item=>{
      newstring = newstring.replaceAll(item, '');
    })
    let arrraystring = newstring.split('</p>');

    let finalstring = '';
    arrraystring.map(item=>{
      finalstring += ' '+item;
    });
    return finalstring.slice(0, 35);
  }
  async editCareList(resident) {
    console.log("resident >>>", resident)
    this.selectedCareList = []
    this.editAll = true;
    // let filtered = this.tempcareData.filter(obj => obj._id === resident.care_id).map(obj => obj.name);
    this.selectedCareData = {
      care_id: '',
      note: '',
      user_id: '',
      image: ''
    };
    this.selectedCareList = [];
    for (let i = 0; i < this.tempcareDataCare.length; i++) {
      if (this.tempcareDataCare[i].key === resident.care_id) {
        this.selectedCareList.push({
          care: this.tempcareDataCare[i],
          note: this.tempcareDataCare[i].note,
          user_id: this.tempcareDataCare[i].user_id,
          repeat: 'every_day',
          repeat_old: 'every_day',
          timePopup: false,
        });
        // this.carelist.splice(i, 1);
      } else if (this.tempcareDataCare[i].subCares && this.tempcareDataCare[i].subCares.length) {
        for (let j = 0; j < this.tempcareDataCare[i].subCares.length; j++) {
          if (this.tempcareDataCare[i].subCares[j].key === this.carelist[i].care_id) {
            this.selectedCareList.push({
              care: this.tempcareDataCare[i].subCares[j],
              note: this.tempcareDataCare[i].note,
              user_id: this.tempcareDataCare[i].user_id,
              repeat: 'every_day',
              repeat_old: 'every_day',
              timePopup: false,
            });
            // this.tempcareData[i].subCares.splice(j, 1);
            break;
          }
        }
      }
    }
    this.careEditlist = [{
      'care_name': resident.care_name,
      'care_id': resident.care_id,
    }];
    this.careEditnote = resident.care_note;
    this.careEditname = resident.care_id;
    this.dialogRefs = this.dialog.open(this.openCareData, {
      width: '670px',
      data: { careEditnote: this.careEditnote, careEditname: this.careEditname },
      // disableClose: true
      //panelClass:'contactpopup',
    });
    this.dialogRefs.afterClosed().subscribe(result => {
      this.selectedCareList = [];
    })
    this.selectedCare();
  }
  // editCareData(resident,care,note){
  //     let filteredArray = this.careEditlist.filter( obj => obj.care_id === care ).map( obj => obj.care_name );
  //     this.multicare=filteredArray[0];
  //   if (care === '' || care === undefined) {
  //      this.toastr.error('Please select care');
  //    } else if (note === '' || note === undefined) {
  //      this.toastr.error('Please enter care note');
  //    }
  //    else
  //    {
  //      this.editAll =false;
  //      this.ismultifac = true;
  //      if (this.residentCareList === undefined || this.residentCareList.length < 1) {
  //        this.residentCareList.splice(care, 1);
  //        this.residentCareList = [
  //          {
  //            'care_id': care,
  //            'care_name': this.multicare,
  //            'care_note': note,
  //          }
  //        ];

  //      }
  //      else {
  //      let removeIndex = this.residentCareList.map(function(item1) { return item1.care_id; }).indexOf(care);
  //        this.residentCareList.splice(removeIndex,1);
  //        if (this.residentCareList.some(item => item.care_name.toLowerCase().trim() === this.multicare.toLowerCase().trim())) {
  //          if (this.toastr.currentlyActive === 0) {
  //            this.toastr.error('Care already added');
  //          }
  //        }
  //        else {
  //          this.residentCareList.push({
  //            care_id:   care,
  //            care_name: this.multicare,
  //            care_note: note,
  //          });
  //         }
  //      }
  //      if (this.residentCareList.length > 0) {
  //        this.showfaclist = true;
  //        this.ismultifac = true;
  //      } else {
  //        this.ismultifac = false;
  //        this.showfaclist = false;
  //      }
  //      this.resident['care_name'] = '';
  //      this.resident['care_note'] = '';
  //    }

  // }

  async deleteCare(item) {

    console.log('care note item', item)
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'Care details' }
    });
    dialogRef.afterClosed().subscribe(result => {

      if (result && result === true) {
        // call delete api here
        if (this.route.params["_value"]["id"]) {
          const action = {
            type: "POST",
            target: "residents/unlink_resident_care_notes",
          };
          const payload = {
            resident_id: this._aes256Service.decFnWithsalt(
              this.route.params["_value"]["id"]
            ),
            care_id: item.care_id,
          };

          this.deleteCareNoteDb(action, payload)

        }
        this._commonService.setLoader(true);
        var removeIndex = this.residentCareList.map((item1) => item1.care_id).indexOf(item.care_id);
        let deletedCare =
        {
          '_id': this.residentCareList[removeIndex].care_id,
          'name': this.residentCareList[removeIndex].care_name,
        };

        this.residentCareList.splice(removeIndex, 1);
        this._commonService.setLoader(false);
        this.getAllcaresData();
        // this.carelistData.push({
        //   '_id': this.residentCareList[removeIndex].care_id,
        //   'name': this.residentCareList[removeIndex].care_name,
        // });
      }
      if (this.residentCareList.length > 0) {
        this.showfaclist = true;
      } else if (this.residentCareList.length === 0) {
        this.showfaclist = false;
      }


    });

  }

  async deleteCareNoteDb(action, payload) {

    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status'] == true) {
      this.toastr.success(result["message"]);
    } else { this.toastr.error(result["message"]); }
  }


  async unassignenfcs() {
    // const payload1 = {
    // zoneId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
    // org:this.org_id,
    // fac:this.fac_id
    // org:this.nfc_org.toString(),
    // fac:this.nfc_fac.toString(),
    // };
    await this.apiService.apiFn(
      { type: 'POST', target: 'nfc/unassigned' },
      { org: this.nfc_org, fac: this.nfc_fac }
    )
      .then((result1: any) => this.nfclist = result1.data);
  }

  async assignNFC(nfc) {

    this.nfc = '';
    if (nfc) {
      //deep clone array so that if user seelct already selected option it won't be shown as a default selected option
      this.nfclist = JSON.parse(JSON.stringify(this.nfclist))
      if (this.assignNFClist.length > 0) {
        this.toastr.error('You can not assign more than one NFC')
        return
      } else {
        if (this.route.params['_value']['id']) {
          let residentId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id'])
          const action = { type: 'POST', target: 'residents/link_nfc_to_resident' };
          const payload = {
            resident_id: residentId,
            nfc: nfc
          }
          let result = await this.apiService.apiFn(action, payload);
          if (result && result['status'] == true) {
            this.toastr.success(result['message']);
            this.assignNFClist.push(nfc);
            this.resident.nfc = this.assignNFClist;
            for (let i = 0; i < this.nfclist.length; i++) {
              if (this.nfclist[i]._id === nfc._id) this.nfclist.splice(i, 1);
            }
          } else {
            this.toastr.error(result['message'])
          }
        } else {
          //this.resident.nfc = [];
          //this.resident.nfc.push(nfc);
          this.assignNFClist.push(nfc);
          this.resident.nfc = this.assignNFClist;
          for (let i = 0; i < this.nfclist.length; i++) {
            if (this.nfclist[i]._id === nfc._id) this.nfclist.splice(i, 1);
          }
          if (this.toastr.currentlyActive === 0) this.toastr.success('NFC assigned successfully');
        }
      }
    } else {
      if (this.toastr.currentlyActive === 0) this.toastr.error('Please select NFC');
    }
    this.nfc = ''
  }

  async unassignNFC(nfc) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'nfc/unassign' },
      { nfc: nfc._id }
    )
      .then((result: any) => {
        if (result.status == true && result.type == "Success") {
          this.deletednfc.push(nfc._id);
          this.nfclist.push(nfc);
          for (let i = 0; i < this.assignNFClist.length; i++) {
            if (this.assignNFClist[i]._id === nfc._id) this.assignNFClist.splice(i, 1);
          }
          for (let i = 0; i < this.resident.nfc.length; i++) {
            if (this.resident.nfc[i]._id === nfc._id) this.resident.nfc.splice(i, 1);
          }
          //this.resident.nfc='';
          this.toastr.success('NFC unassigned successfully');
        }
        else {
          this.toastr.error(result.message);
        }
      });
    this.nfc = '';
  }

  isolation() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.isolationForm.custom_isolation = this.resident.custom_isolation;
    this.isolationForm.is_out_of_fac = this.resident.is_out_of_fac;
    this.isolationForm.isolation_apply_come_to_fac = this.resident['testing_status'];
    this.dialogRefs = this.dialog.open(this.isolationData, dialogConfig);
  }

  closeIsolationDialog(): void {
    this.dialogRefs.close();
  }

  //New Care Changes Start
  async openCareDialog() {
    // await this.getAllcaresData();
    // console.log('ddddddddddddd');
    this.dialogRefs = this.dialog.open(this.openCareData, {
      width: '670px',
      data: { Poa: this.carelistData },
      // disableClose: true
      //panelClass:'contactpopup',
    });
  }

  async onCareSubmit(careOpen, resident) {
    // this.selectedCareList = [];
    let vaild = careOpen.form.status;
    if (resident.care_name === '' || resident.care_name === undefined || resident.care_note === '' || resident.care_note === undefined) {
      vaild = 'INVALID';
      this.toastr.error('Please Enter valid care notes')
    }
    // else if(resident.care_note === '' || resident.care_note === undefined){
    //   vaild = 'INVALID'
    //   this.isnotesrequired = true
    // }
    console.log(this.residentCareList)
    if (vaild === 'VALID') {
      this.ismultifac = true;
      if (this.residentCareList === undefined || this.residentCareList.length < 1) {
        this.residentCareList = [
          {
            'care_id': resident.care_name,
            'care_name': this.selectedCareList[0].care.name,
            'care_note': resident.care_note,
          }
        ];

      }
      else {
        this.residentCareList.push({
          care_id: resident.care_name,
          care_name: this.selectedCareList[0].care.name,
          care_note: resident.care_note,
        });
      }
      if (this.residentCareList.length > 0) {
        this.showfaclist = true;
        this.ismultifac = true;
        //console.log(this.multiorg);
        //console.log(this.residentCareList);
        this.dataSource = new MatTableDataSource(this.residentCareList);
      } else {
        this.ismultifac = false;
        this.showfaclist = false;
      }
      this.resident.care_name = '';
      this.resident.care_note = '';

      for (var i = this.carelistData.length - 1; i >= 0; i--) {
        for (var j = 0; j < this.residentCareList.length; j++) {
          if (this.carelistData[i]._id === this.residentCareList[j].care_id) {
            // this.carelistData.splice(i, 1);
          }
        }
      }
      if (this.residentCareList.length > 0) {
        const action = { type: 'POST', target: 'residents/add_resident_care_notes' };
        let careNotes = this.residentCareList.map(item => ({
          care_id: item.care_id, care_note: item.care_note
        }));
        const payload = {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          cares: careNotes
        }
        const result = await this.apiService.apiFn(action, payload);
        if (result && result["status"]) {
          this.toastr.success("Care notes added successfully")
        }
        else {
          this.toastr.error(result["message"])
        }
      }
      this.dialogRefs.close();
    }
  }

  async onCareEditSubmits(careOpen, resident, care, note) {
    console.log('careOpen---->', careOpen);
    console.log('care---->', care);
    console.log('resident---->', resident);
    console.log('note---->', note);
    console.log('this.selectedCareList---->', this.selectedCareList);
  }

  async onCareEditSubmit(careOpen, resident, care, note) {
    this.selectedCareList = [];
    let vaild = careOpen.form.status;
    // let filteredArray = this.carelist.filter(obj => obj.care_id === care).map(obj => obj.value);
    // this.multicare = filteredArray[0];
    if (care === '' || care === undefined || note === '' || note === undefined) {
      vaild = 'INVALID';
    }
    if (vaild === 'VALID') {
      this.editAll = false;
      this.ismultifac = true;
      if (this.residentCareList === undefined || this.residentCareList.length < 1) {
        this.residentCareList.splice(care, 1);
        this.residentCareList = [{
          'care_id': care,
          'care_name': this.multicare,
          'care_note': note,
        }];

      } else {
        let removeIndex = this.residentCareList.map(function (item1) { return item1.care_id; }).indexOf(care);
        this.residentCareList.splice(removeIndex, 1);
        if (this.residentCareList.some(item => item.care_name.toLowerCase().trim() === this.multicare.toLowerCase().trim())) {
          if (this.toastr.currentlyActive === 0) this.toastr.error('Care already added');
        } else {
          this.residentCareList.push({
            care_id: care,
            care_name: this.multicare,
            care_note: note,
          });
        }
      }
      if (this.residentCareList.length > 0) {
        this.showfaclist = true;
        this.ismultifac = true;
      } else {
        this.ismultifac = false;
        this.showfaclist = false;
      }
      this.resident['care_name'] = '';
      this.resident['care_note'] = '';
      if (this.residentCareList.length > 0) {
        const action = { type: 'POST', target: 'residents/add_resident_care_notes' };
        let careNotes = this.residentCareList.map(item => ({
          care_id: item.care_id, care_note: item.care_note
        }));
        const payload = {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          cares: careNotes
        }
        const result = await this.apiService.apiFn(action, payload);
        if (result && result["status"]) {
          this.toastr.success("Care notes updated successfully")
        }
        else {
          this.toastr.error(result["message"])
        }
      }
      this.dialogRefs.close();
    }
  }

  closeCareDialog(): void {
    this.selectedCareList = [];
    this.resident.care_name = '';
    this.resident.care_note = '';
    this.editAll = false;
    this.dialogRefs.close();
  }

  // if (this.toastr.currentlyActive === 0) {
  //   this.toastr.success('NFC assigned successfully');
  // }

  async getPharmacy() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'residents/pharmacy_list' },
      {}
    )
      .then((result: any) => {
        this.allfetchedPharmacy = result.data;
        this.pharmacylist = result.data._pharmacy.filter(item => this.assignedPharmacy.findIndex(e => String(e._id) == String(item._id)) < 0);
        // console.log('this.pharmacylist---->', this.pharmacylist);
        this.pharmacylist.sort((a, b) => a.name.localeCompare(b.name));
      });
  }
  async getPhysician() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'residents/prescriber_list' },
      {}
    )
      .then((result: any) => {
        console.log("Prescvribers----",result);
        this.physicianlist = result.data._doctors.filter(item => this.assignedPhysician.findIndex(e => String(e._id) == String(item._id)) < 0).map(item => {
          return {
            ...item,
            name: (item.last_name && item.first_name) ? `${item.last_name}, ${item.first_name}` : item.name
          }
        });
        this.physicianlist.sort((a, b) => a.name.localeCompare(b.name));
        // console.log('this.physicianlist---->', this.physicianlist);
      });
  }

  async getAssignedPhysician() {
    await this.apiService.apiFn(
      { type: 'GET', target: 'residents/prescriber_list' },
      { resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) }
    )
      .then((result: any) => {
        console.log('result1111111111111------>', result);
        this.assignedPhysician = result['data']['_doctors'].map(item => {
          return {
            ...item,
            name: (item.last_name && item.first_name) ? `${item.last_name}, ${item.first_name}` : item.name
          }
        });
      });
  }

  async assignPharmacy(pharmacy, from, event) {
    if (from == '') {
      this.assignedPharmacy.push(pharmacy);
    }
    if (pharmacy._id) {
      this.pharmacylist.splice(this.pharmacylist.findIndex(e => e._id.toString() == pharmacy._id.toString()), 1)
    }
    if (this.route.params['_value']['id'] && from == '') {
      const action = { type: 'POST', target: 'residents/link_pharmacy_to_resident' };
      const payload = {
        resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
        pharmacy_id: pharmacy._id,
        fac_id:this.facilityId
      }
      await this.apiService.apiFn(action, payload).then((result: any) => {
        if (result && result.status) {
          this.toastr.success(result.message);
        }
        else {
          this.toastr.error(result.message);
        }
      });
    }
    if (this.route.params['_value']['id'] && from == 'selection') {
      await this.apiService.apiFn(
        { type: 'POST', target: 'pharmacy/link_fac_pharmacy' },
        {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          pharmacy_id: pharmacy._id
        }
      )
        .then((result: any) => this.assignedAndFacPharmacy(this.assignedPharmacy.filter(e => e.is_fac != true), result.data));
    }
    this.resident.pharmacy_id = this.assignedPharmacy.map(e => e._id)

    if (from == 'selection') {
      this.resident.fac_pharmacy_id = pharmacy._id
      // this.assignedPharmacy.push(pharmacy);
    }
  }
  async assignPhysician(physician) {

    this.assignedPhysician.push(physician);
    this.assignedPhysician = this.assignedPhysician.sort((x, y) => Number(y) - Number(x)).map(item => {
      return {
        ...item,
        show:true,
        name: (item.last_name && item.first_name) ? `${item.last_name}, ${item.first_name}` : item.name
      }
    });
    // console.log('---assigned physician----',this.assignedPhysician)
    if (physician._id) {
      this.physicianlist.splice(this.physicianlist.findIndex(e => e._id.toString() == physician._id.toString()), 1)
    }
    if (this.route.params['_value']['id']) {
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'residents/link_physician_to_resident' };
      const payload = {
        resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
        physician_id: physician._id,
        fac_id:this.facilityId
      }
      await this.apiService.apiFn(action, payload)
        .then((result: any) => {
          ;
          if (result) {
            this.toastr.success(result.message);
            this._commonService.setLoader(false);
          }
        })

    }

    this.resident.physician_id = this.assignedPhysician.map(e => e._id)
  }

  async unassignPharmacy(pharmacy) {
    // return

    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        'title': 'Emergency Contact',
        'item': {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          pharmacy_id: pharmacy._id
        },
        'unlinkAPI': 'residents/unlink_pharmacy_to_resident'
      }
    });
    dialogRef.afterClosed().subscribe(async result => {

      if (result && result.status === true) {
        this._commonService.setLoader(true);
        this.pharmacy = ''
        this.assignedPharmacy.splice(this.assignedPharmacy.findIndex(e => e._id.toString() == pharmacy._id.toString()), 1)
        this.pharmacylist.push(pharmacy);
        if (pharmacy.isPrimary) {
          this.resident.primary_pharmacy_id = null
        }
        if (pharmacy.is_fac) {
          this.resident.fac_pharmacy_id = null
        }

        // if(this.route.params['_value']['id']){
        //   const action = { type: 'POST', target: 'residents/unlink_pharmacy_to_resident' };
        //   const payload = {
        //     resident_id:this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) ,
        //     pharmacy_id:pharmacy._id
        //   }

        //   const result = await this.apiService.apiFn(action, payload);
        // }

        this.getPharmacy()
        this.toastr.success(result.message);
        this._commonService.setLoader(false);
      }
      else {
        this.toastr.error(result.message);
      }
    });
  }
  unassignPhysician(physician) {
    // return

    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        'title': 'Emergency Contact', 'item': {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          physician_id: physician._id
        },
        unlinkAPI: 'residents/unlink_physician_to_resident'
      }
    });
    dialogRef.afterClosed().subscribe(async result => {
      // console.log('----result of unassign---',result)
      if (result && result.status === true) {
        this._commonService.setLoader(true);

        this.physician = ''
        this.assignedPhysician.splice(this.assignedPhysician.indexOf(physician), 1)
        this.physicianlist.push(physician)
        if (physician.isPrimary) {
          this.resident.primary_physician_id = null
        }
        // if(this.route.params['_value']['id']){
        //   const action = { type: 'POST', target: 'residents/unlink_physician_to_resident' };
        //   const payload = {
        //     resident_id:this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) ,
        //     physician_id:physician._id
        //   }

        //   const result = await this.apiService.apiFn(action, payload);
        // }
        this.toastr.success(result.message);
        this.getPhysician()
        this._commonService.setLoader(false);
      }
      else {
        this.toastr.error(result.message);
      }
    });
  }

  async assignUnassignPrimaryPharmacy(event, pharmacy) {
    if (event) {
      if (this.assignedPharmacy.filter(e => (e.isPrimary && String(e._id) != String(pharmacy._id))).length > 0) {
        this.first_time_popup_pharmacy = false

        const old_pharmacy = this.assignedPharmacy.filter(e => (e.isPrimary && String(e._id) != String(pharmacy._id)))

        this.from_pharmacy_name = (old_pharmacy[0].last_name && old_pharmacy[0].first_name) ? `${old_pharmacy[0].last_name}, ${old_pharmacy[0].first_name}` : `${old_pharmacy[0].name}`
        this.to_pharmacy_name = (pharmacy.last_name && pharmacy.first_name) ? `${pharmacy.last_name}, ${pharmacy.first_name}` : `${pharmacy.name}`;
      } else {
        this.first_time_popup_pharmacy = true
        this.single_pharmacy_name = (pharmacy.last_name && pharmacy.first_name) ? `${pharmacy.last_name}, ${pharmacy.first_name}` : `${pharmacy.name}`;
      }
      // console.log('---this popup value----',this.first_time_popup)
      this.dialogConfig.maxWidth = '500px';
      this.dialogConfig.panelClass = "ConfrimAlert";
      this.dialogRefs = this.dialog.open(this.primaryPharmacyPopup, this.dialogConfig);
      this.dialogRefs.afterClosed().subscribe(async result => {
        await this.primaryPharmacyToggleChange(event, pharmacy, result)
      });
    } else {
      await this.primaryPharmacyToggleChange(event, pharmacy, 'Yes')
    }
  }

  async assignUnassignPrimaryPhysician(event, physician) {
    if (event) {
      if (this.assignedPhysician.filter(e => (e.isPrimary && String(e._id) != String(physician._id))).length > 0) {
        this.first_time_popup = false;
        const old_physician = this.assignedPhysician.filter(e => (e.isPrimary && String(e._id) != String(physician._id)));

        this.from_physician_name = (old_physician[0].last_name && old_physician[0].first_name) ? `${old_physician[0].last_name}, ${old_physician[0].first_name}` : `${old_physician[0].name}`;
        this.to_physician_name = (physician.last_name && physician.first_name) ? `${physician.last_name}, ${physician.first_name}` : `${physician.name}`;
      } else {
        this.first_time_popup = true;
        this.single_physician_name = (physician.last_name && physician.first_name) ? `${physician.last_name}, ${physician.first_name}` : `${physician.name}`;
      }
      // console.log('---this popup value----',this.first_time_popup)
      this.dialogConfig.maxWidth = '500px';
      this.dialogRefs = this.dialog.open(this.primaryPhysicianPopup, this.dialogConfig);
      this.dialogRefs.afterClosed().subscribe(async result => {
        await this.primaryPhysicianToggleChange(event, physician, result)
      })
    } else {
      await this.primaryPhysicianToggleChange(event, physician, 'Yes')
    }

    // if(this.assignedPhysician.filter(e=>(e.isPrimary && String(e._id)!=String(physician._id))).length>0){

    //   this.dialogConfig.maxWidth = '500px';
    //   this.dialogRefs = this.dialog.open(this.primaryPhysicianPopup, this.dialogConfig);
    //   this.dialogRefs.afterClosed().subscribe(async result=>{
    //     await this.primaryPhysicianToggleChange(event,physician,result)
    //   })
    // }
    // else{
    //   await this.primaryPhysicianToggleChange(event,physician,'Yes')
    // }
  }

  async primaryPharmacyToggleChange(event, pharmacy, result) {
    if (result == 'Yes') {
      let resultResponse: any = {}
      if (this.route.params['_value']['id'] && this.pharmacylist) {
        console.log('----it is editing time-------')
        const action = { type: 'POST', target: event ? 'pharmacy/link_primary_pharmacy_to_resident' : 'pharmacy/unlink_primary_pharmacy_to_resident' };
        const payload = {
          residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          primaryPharmacyId: pharmacy._id,
          fac_id: this.facilityId
        }
        resultResponse = await this.apiService.apiFn(action, payload);
      }

      if (event) {
        this.toastr.success("Primary Pharmacy added successfully");
        this.resident.primary_pharmacy_id = pharmacy._id

        this.assignedPharmacy.forEach(e => {
          if (String(e._id) != String(pharmacy._id)) {
            e.isPrimary = false
          } else {
            e.isPrimary = true
          }
        })
      } else {
        this.toastr.success("Primary Pharmacy removed successfully");
        this.resident.primary_pharmacy_id = null
        this.assignedPharmacy.forEach(e => {
          if (String(e._id) == String(pharmacy._id)) {
            e.isPrimary = false
          }
        })
      }
    } else {
      this.assignedPharmacy = this.assignedPharmacy.map(e => {
        return {
          ...e,
          isPrimary: String(e._id) == String(pharmacy._id) ? false : e.isPrimary
        }
      })
    }
    this.assignedPharmacy = this.assignedPharmacy.sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary))
  }

  async primaryPhysicianToggleChange(event, physician, result) {
    if (result == 'Yes') {
      console.log('--event--', event, physician)
      let resultResponse: any = {}
      if (this.route.params['_value']['id'] && this.physicianlist) {
        console.log('----it is editing time-------')
        const action = { type: 'POST', target: event ? 'residents/link_primary_physician_to_resident' : 'residents/unlink_primary_physician_to_resident' };
        const payload = {
          residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
          primaryPhysicianId: physician._id,
          fac_id: this.facilityId
        }
        resultResponse = await this.apiService.apiFn(action, payload);
      }

      if (result && result['status']) {
        this.toastr.success(resultResponse['message']);
      }
      if (event) {
        this.toastr.success("Primary Physician added successfully");
        this.resident.primary_physician_id = physician._id
        this.assignedPhysician.forEach(e => {
          if (String(e._id) != String(physician._id)) {
            e.isPrimary = false
          } else {
            e.isPrimary = true
          }
        })
        // console.log('---assigned new---',this.assignedPhysician)
      } else {
        this.toastr.success("Primary Physician removed successfully");
        this.resident.primary_physician_id = null
        this.assignedPhysician.forEach(e => {
          if (String(e._id) == String(physician._id)) {
            e.isPrimary = false
          }
        })
      }
      // console.log('--edited physician--',physician)
      // }else{
      //   this.toastr.error('Can not assign/unassign primary physician, Please try again later.')
      // }
    } else {
      this.assignedPhysician = this.assignedPhysician.map(e => {
        // console.log('id',String(e._id),String(physician._id))
        return {
          ...e,
          isPrimary: String(e._id) == String(physician._id) ? false : e.isPrimary
        }
        // if(String(e._id)==String(physician._id)){
        //   e.isPrimary=false
        // }
      })
      // console.log('--on NO--',this.assignedPhysician)
    }
    this.assignedPhysician = this.assignedPhysician.sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary))
  }

  changePhoneType(event) {
    if (event == 'Home') {
      this.show_home = true
      this.contact_type = this.contact_type.filter(e => e.name != 'Home')
    }
    if (event == 'Mobile') {
      this.show_mobile = true
      this.contact_type = this.contact_type.filter(e => e.name != 'Mobile')
    }
    // console.log(event)
    // this.show=event
    // console.log(this.show)
  }

  changeEmailType(event) {
    if (event == 'Email') {
      this.show_mainEmail = true
      this.email_type = this.email_type.filter(e => e.name != 'Email')
    }
    if (event == 'Other') {
      this.show_otherEmail = true
      this.email_type = this.email_type.filter(e => e.name != 'Other')
    }
  }

  removePhoneField(item) {
    if (item == 'Home') {
      this.show_home = false
      this.resident.home_phone = ''
      this.contact_type.push({ name: 'Home' })
    }

    if (item = 'Mobile') {
      this.show_mobile = false
      this.resident.mobile_phone = ''
      this.contact_type.push({ name: 'Mobile' })
    }
  }

  onFocusOutEvent(event: any, fieldName){
    // console.log('fieldName------>', fieldName);
    // console.log('onFocusOutEvent------>', event.target.value);
    let formatName = event.target.value.substr(0,1).toUpperCase();
    formatName = formatName + event.target.value.substr(1);
    // console.log('formatName------>', formatName);
    if (fieldName === 'first_name') {
      this.resident.first_name = formatName;
    } else if (fieldName === 'last_name') {
      this.resident.last_name = formatName;
    } else if (fieldName === 'middle_name') {
      this.resident.middle_name = formatName;
    }
 }

  removeEmailField(item) {
    if (item == 'Email') {
      this.show_mainEmail = false
      this.resident.email = ''
      this.email_type.push({ name: 'Email' })

    }
    if (item == 'Other') {
      this.show_otherEmail = false
      this.resident.other_email = ''
      this.email_type.push({ name: 'Other' })
    }
  }

  assignedAndFacPharmacy(assignedPharmacy, facPharmacy) {
    this.assignedPharmacy = [];
    if (facPharmacy.fac_pharmacy_id) {
      facPharmacy.fac_pharmacy_id.is_fac = true
      if (assignedPharmacy.length) {
        this.assignedPharmacy = [...assignedPharmacy, ...facPharmacy.fac_pharmacy_id]
      } else {
        this.assignedPharmacy = [facPharmacy.fac_pharmacy_id]
      }
    } else {
      this.assignedPharmacy = assignedPharmacy
    }

    this.assignedPharmacy = this.assignedPharmacy.map(item => {
      return {
        ...item,
        isPrimary: (facPharmacy.primary_pharmacy_id && facPharmacy.primary_pharmacy_id)
          ? (String(item._id) == String(facPharmacy.primary_pharmacy_id) ? true : false) :
          false
      }
    }).sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary))
    this.getPharmacy();
  }

  addPharmacyPopup() {
    this.dialogConfig.width = "700px";
    this.dialogConfig.autoFocus = false;
    if (this.route) {
      if (this.route.params['_value']['id']) {
        this.dialogConfig.data = {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id'])
        }
      }
    }
    // this.dialogConfig.disableClose=true
    const dialogRef = this.dialog.open(AddPharmacyComponent, this.dialogConfig);
    dialogRef.afterClosed().subscribe(res => {
      if (res && res.pharmacy.data) {
        this.assignPharmacy(res.pharmacy.data, '', null);
      }
      else if (res && res.pharmacy) {
        this.assignPharmacy(res.pharmacy, '', null);
      }
    })
  }

  addPhysicianPopup() {
    this.dialogConfig.width = "700px";
    this.dialogConfig.height = "700px";
    this.dialogConfig.autoFocus = false;
    //this.dialogConfig.disableClose = true;;
    this.dialogConfig.maxHeight = "875px";
    this.dialogConfig.panelClass = "physician_dialog";
    // this.dialogConfig.disableClose = true;
    if (this.route) {
      if (this.route.params['_value']['id']) {
        this.dialogConfig.data = {
          resident_id: this._aes256Service.decFnWithsalt(this.route.params['_value']['id'])
        }
      }
    }
    const dialogRef = this.dialog.open(AddPhysicianComponent, this.dialogConfig);
    dialogRef.afterClosed().subscribe(res => {
      // console.log(res)
      if (res && res.physician.data) {
        this.assignPhysician(res.physician.data);
      }
      else if (res && res.physician) {
        this.assignPhysician(res.physician);
      }
    })
  }

  navigateToOrderLink() {
    this.router.navigate(['/residents/order', this._aes256Service.encFnWithsalt(this.residentId)]);
  }

  scrollWindow() {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
  }

  dragMoved(e: CdkDragMove) {
    let point = this.getPointerPositionOnPage(e.event);
    this.listGroup._items.forEach(dropList => {
      if (__isInsideDropListClientRect(dropList, point.x, point.y)) {
        this.activeContainer = dropList;
        return;
      }
    });
  }

  dropListDropped() {
    if (!this.target) return;

    let phElement = this.placeholder.element.nativeElement;
    let parent = phElement.parentElement;

    phElement.style.display = 'none';

    parent.removeChild(phElement);
    parent.appendChild(phElement);
    parent.insertBefore(this.source.element.nativeElement, parent.children[this.sourceIndex]);

    this.target = null;
    this.source = null;

    if (this.sourceIndex != this.targetIndex)
      moveItemInArray(this.emergencyArr, this.sourceIndex, this.targetIndex);

    this.emergencyArr = this.emergencyArr.map((e, i) => ({ ...e, emergency_contact: i + 1 }))
  }

  dropListEnterPredicate = (drag: CdkDrag, drop: CdkDropList) => {
    if (drop == this.placeholder) return true;
    if (drop != this.activeContainer) return false;

    let phElement = this.placeholder.element.nativeElement;
    let sourceElement = drag.dropContainer.element.nativeElement;
    let dropElement = drop.element.nativeElement;

    let dragIndex = __indexOf(dropElement.parentElement.children, (this.source ? phElement : sourceElement));
    let dropIndex = __indexOf(dropElement.parentElement.children, dropElement);

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = drag.dropContainer;

      phElement.style.width = sourceElement.clientWidth + 'px';
      phElement.style.height = sourceElement.clientHeight + 'px';

      sourceElement.parentElement.removeChild(sourceElement);
    }

    this.targetIndex = dropIndex;
    this.target = drop;

    phElement.style.display = '';
    dropElement.parentElement.insertBefore(phElement, (dropIndex > dragIndex
      ? dropElement.nextSibling : dropElement));

    this.placeholder.enter(drag, drag.element.nativeElement.offsetLeft, drag.element.nativeElement.offsetTop);
    return false;
  }

  /** Determines the point of the page that was touched by the user. */
  getPointerPositionOnPage(event: MouseEvent | TouchEvent) {
    // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
    const point = __isTouchEvent(event) ? (event.touches[0] || event.changedTouches[0]) : event;
    const scrollPosition = this.viewportRuler.getViewportScrollPosition();
    return {
      x: point.pageX - scrollPosition.left,
      y: point.pageY - scrollPosition.top
    };
  }

  formatSocialSecurity(val) {
    val = val.replace(/\D/g, '');
    val = val.replace(/^(\d{3})/, '$1-');
    val = val.replace(/-(\d{2})/, '-$1-');
    val = val.replace(/(\d)-(\d{4}).*/, '$1-$2');
    return val;
  }
  getPrimaryDoctor() {
    let primaryDoctor = this.assignedPhysician.filter(e => e.isPrimary)

    if (primaryDoctor && primaryDoctor.length) {
      return primaryDoctor[0].name
    } else {
      return 'No Primary Physician found.'
    }
  }
  getOtherDoctor() {
    let otherDoctors = this.assignedPhysician.filter(e => !e.isPrimary)
    return otherDoctors
  }

  addNewPhoneField(f, item) {
    // console.log('item---->', item);
    // console.log('this.resident.phone_numbers---->', this.resident.phone_numbers);
    // console.log('this.phoneArr---->', this.phoneArr);
    // this.phoneArr = [];
    // phoneArr.push({ id: this.resident.phone_numbers.length + Math.random(), name: 'Mobile', value: '' });
    // this.resident.phone_numbers.push({ id: this.resident.phone_numbers.length + Math.random(), name: item, value: '' });
    if (item.value == '') {
      this.toastr.error('Kindly enter the value in the field.');
      return;
    }
    this.resident.phone_numbers.unshift(this.phoneArr[0]);
    this.phoneArr = [{ id: this.resident.phone_numbers.length + Math.random(), name: item.name, value: '' }];
    // this.phoneArr.push({ id: this.resident.phone_numbers.length + Math.random(), name: 'Mobile', value: '' });
    // this.resident.phone_numbers = [...phoneArr, ...this.resident.phone_numbers];
  }

  removeAddedPhoneField(index, item) {
    this.resident.phone_numbers.splice(index, 1);
  }

  removeAddedPhoneFieldFn(index) {
    this.resident.phone_numbers.splice(index, 1);
  }

  addEmergencyEmail(f) {
    this.resident.emails.unshift({ id: this.resident.emails.length + Math.random(), name: 'Email', value: '' });
  }

  removeEmergencyEmailField(index) {
    this.resident.emails.splice(index, 1);
  }

  async setintialOrgAndFac(org, fac) {
    this.resident['organization'] = org;
    await this.changeOrg(this.resident['organization'], 0);
    this.resident['facility'] = fac;

    let fac_data = this.faclist.filter(e => String(e._id) == String(fac))

    if (fac_data.length && fac_data[0].pharmacy) {

      //add is_fac=true flag to facility pharmacy
      fac_data[0].pharmacy['is_fac'] = true

      this.resident.fac_pharmacy_id = fac_data[0].pharmacy._id

      //push new facility pharmacy to the assigned pharmacy list
      this.assignedPharmacy.push(fac_data[0].pharmacy)

      //get latest record to filter pharmacy dropdown
      await this.getPharmacy()
    }
  }
  openselectPharmacy() {
    if(this.allfetchedPharmacy.length === 0){
      this.getPharmacy();
    }
    this.matselectPharmacy.open();
    this.showSelectOptionPharmacy = false
  }
  openselectPhysician() {
    if(this.physicianlist.length === 0){
      this.getPhysician();
    }
    this.matselectPhysician.open();
    this.showSelectOptionPhysician = false
  }

  //this function will push or pull the index of record for which show/hide notes function is being called, so onclick all the option does not show up
  showHideNotes(item) {
    //check if this index exists in shownIndexOfEmergency array
    //if exists remove it else add it

    let checkIndexExists = this.shownIndexOfEmergency.findIndex(e => e == item)

    if (checkIndexExists >= 0) {
      this.shownIndexOfEmergency.splice(checkIndexExists, 1)
    } else {
      this.shownIndexOfEmergency.push(item)
    }
  }

  //this will be used in html to check the index existence to display show/hide related details
  checkIndexExistsOrNot(i) {
    let index = this.shownIndexOfEmergency.findIndex(e => e == i)
    if (index >= 0) {
      return true
    } else {
      return false
    }
  }
  //this function will push or pull the index of record for which show/hide care notes function is being called, so onclick all the option does not show up
  showHideCareNotes(item) {
    let checkIndexExists = this.shownIndexOfcareNotes.findIndex(e => e == item)

    if (checkIndexExists >= 0) {
      this.shownIndexOfcareNotes.splice(checkIndexExists, 1)
    } else {
      this.shownIndexOfcareNotes.push(item)
    }
  }
  //this will be used in html to check the index existence to display show/hide for care notes related details
  indexExistOfThisCare(i) {
    let index = this.shownIndexOfcareNotes.findIndex(e => e == i)
    if (index >= 0) {
      return true
    } else {
      return false
    }
  }

  checkEmergencyCheckExists(contactType) {
    const checkEmergency = contactType.findIndex(e => e == 'Emergency Contact')

    if (checkEmergency >= 0) {
      return true
    } else {
      return false
    }
  }

  checkFinancialPOAExists(contactType) {
    const checkEmergency = contactType.findIndex(e => e == 'Power of Attorney Financial')

    if (checkEmergency > -1) {
      return true
    } else {
      return false
    }
  }
  checkMedicalPOAExists(contactType) {
    const checkEmergency = contactType.findIndex(e => e == 'Power of Attorney Medical')

    if (checkEmergency > -1) {
      return true
    } else {
      return false
    }
  }

  formatPhoneNumberToUS(phone) {
    if (phone) {
      phone = phone.replace(/[^\d]/g, '');
      if (phone.length == 10) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      }
    }
    return null;
  }

  getFirstMatchingField(field, phone_numbers) {
    if (phone_numbers && phone_numbers.length) {
      const firstPhoneNumber = phone_numbers.filter(e => e.name == field)

      if (firstPhoneNumber && firstPhoneNumber.length) {
        return this.formatPhoneNumberToUS(firstPhoneNumber[0].value)
      } else {
        return ''
      }
    } else {
      return ''
    }
  };

  getFirstMatchingFieldEmails(field, emails) {
    if (emails && emails.length) {
      let firstEmail = emails.filter(e => e.name == field || e.name == 'Email')

      if (firstEmail && firstEmail.length) {
        return firstEmail[0].value
      } else {
        return ''
      }
    } else {
      return ''
    }
  }

  openPopupToShowAll() {
    this.dialogConfig.maxWidth = '1200px';
    this.dialogConfig.maxHeight = "835px";
    this.dialogConfig.panelClass = "physician_dialog";
    this.dialogRefs = this.dialog.open(this.allEmergencyContactPopup, this.dialogConfig);
    // setTimeout(() => {
    //   //let phElement = this.placeholder.element.nativeElement;
    //   //phElement.style.display = 'none';
    //   //phElement.parentNode.removeChild(phElement);
    // }, 1000);
  }
  viewAllcancel() {
    this.dialogRefs.close()
  }
  viewAllDoneButton() {
    this.dialogRefs.close()
  }


  //edit Pharmacy
  async editPharmacy(pharmacy) {
    let config = {
      width: "700px",
      autoFocus: false,
      // disableClose:true,
      maxHeight: "750px",
      panelClass: "physician_dialog",
      data: { pharmacy: pharmacy }
    }

    this.dialogRefs = this.dialog.open(AddPharmacyComponent, config);

    this.dialogRefs.afterClosed().subscribe(res => {
      if (res && res.status) {

        //first get this pharmacy from assigned list
        //check if it has isPrimary or is_fac attach to it?
        //if it is attach then also attach it to new changed pharamcy and then replace it to old one

        let oldPharmacy = this.assignedPharmacy.find(e => e._id == pharmacy._id)

        let newPharmacy = res.pharmacy.data

        if (oldPharmacy) {
          if (oldPharmacy.is_fac) newPharmacy.is_fac = true;
          if (oldPharmacy.isPrimary) newPharmacy.isPrimary = true;
        }
        this.assignedPharmacy.splice(this.assignedPharmacy.findIndex(e => e._id == pharmacy._id), 1, newPharmacy)
      }
    })
  }

  //edit physician
  async editPhysician(physician) {
    let config = {
      width: "700px",
      height: "875px",
      autoFocus: false,
      // disableClose:true,
      maxHeight: "875px !important",
      panelClass: "physician_dialog",
      data: { physician: physician }
    }

    this.dialogRefs = this.dialog.open(AddPhysicianComponent, config);

    this.dialogRefs.afterClosed().subscribe(res => {
      if (res && res.status) {
        let oldPhysician = this.assignedPhysician.find(e => e._id == physician._id)

        let newPhysician = res.physician.data

        if (oldPhysician) {
          if (oldPhysician.isPrimary) { newPhysician.isPrimary = true; }
        }
        newPhysician.name = (newPhysician.last_name && newPhysician.first_name) ? `${newPhysician.last_name}, ${newPhysician.first_name}` : newPhysician.name;

        this.assignedPhysician.splice(this.assignedPhysician.findIndex(e => e._id == physician._id), 1, newPhysician)
      }
    })
  }

  // get resident schedules
  async getResSchedules(result) {
    console.log('facId send to res schedule>>>>>', this.facilityId, 'resident Id', this.residentId, result);
    await this.apiService.apiFn(
      { type: 'GET', target: 'residents/get_res_schedules' },
      {
        resident_id: this.residentId ? this.residentId : result,
        fac_id: this.facilityId
      }
    )
      .then((result: any) => {
        console.log("Result of Resident schedule ========-------====-----====0----=====>>", result)
        if (result.status) {
          this.schedules = result.data;
          console.log("this.schedules after respondse >>>>>>", this.schedules)
          this.schedules.map(item => {
            if (item.start_time) {
              const start = moment.unix(item.start_time / 1000);
              const end = moment.unix(item.start_time / 1000).add(item.duration, 'second');
              item.start_time = item.start_time ? moment(start).tz(this.timezone).format("hh:mm A") : item.start_time
              item['end_time'] = moment(end).tz(this.timezone).format("hh:mm A")
            }
            // item.end_date = item.end_date ? moment(item.end_date).tz(this.timezone):item.end_date;
            // item.start_date = item.start_date ? moment(item.start_date).tz(this.timezone): item.start_date;
          })
        } else {
          this.toastr.error(result['message']);
        }
      })
      .catch(err => this.toastr.error(err['message']));
  }

  onViewVitalTrends() {
    let id = this.route.params['_value']['id'];
    this.router.navigate(['residents/form/' + id + '/vitalHistory']);
  }
  getWeekDays(days) {
    let keys = [];
    for (let el in days) {
      if (days[el]) keys.push(el.toLocaleLowerCase());
    }
    if (keys && keys.length && keys.length > 0) {
      return keys.toString().replace(/,/g, ', ')
    } else {
      return '--';
    }
  }

  //  drop() {
  //   if (!this.target)
  //     return;

  //   let phElement = this.placeholder.element.nativeElement;
  //   let parent = phElement.parentNode;

  //   phElement.style.display = 'none';

  //   parent.removeChild(phElement);
  //   parent.appendChild(phElement);
  //   parent.insertBefore(this.source.element.nativeElement, parent.children[this.sourceIndex]);

  //   this.target = null;
  //   this.source = null;

  //   if (this.sourceIndex != this.targetIndex)
  //     moveItemInArray(this.emergencyArr, this.sourceIndex, this.targetIndex);
  // }

  // enter = (drag: CdkDrag, drop: CdkDropList) => {
  //   if (drop == this.placeholder)
  //     return true;

  //   let phElement = this.placeholder.element.nativeElement;
  //   let dropElement = drop.element.nativeElement;

  //   let dragIndex = __indexOf(dropElement.parentNode.children, drag.dropContainer.element.nativeElement);
  //   let dropIndex = __indexOf(dropElement.parentNode.children, dropElement);

  //   // console.log('--enter event--',phElement,this.source)

  //   if (!this.source) {
  //     this.sourceIndex = dragIndex;
  //     this.source = drag.dropContainer;

  //     let sourceElement = this.source.element.nativeElement;
  //     phElement.style.width = sourceElement.clientWidth + 'px';
  //     phElement.style.height = sourceElement.clientHeight + 'px';

  //     sourceElement.parentNode.removeChild(sourceElement);
  //   }

  //   this.targetIndex = dropIndex;
  //   this.target = drop;

  //   phElement.style.display = '';
  //   dropElement.parentNode.insertBefore(phElement, (dragIndex < dropIndex)
  //     ? dropElement.nextSibling : dropElement);

  //   this.source.start();
  //   this.placeholder.enter(drag, drag.element.nativeElement.offsetLeft, drag.element.nativeElement.offsetTop);

  //   return false;
  // }

  onMedCoverageChange(selectedMedCoverage) {
    const medCovIndex = this.addsMedCoverage.findIndex(cov => cov.value === selectedMedCoverage);
    this.addedCoverages.push({ _id: this.addsMedCoverage[medCovIndex]._id, name: this.addsMedCoverage[medCovIndex].value, value: '', coverage_name: this.addsMedCoverage[medCovIndex].viewValue });
    this.addsMedCoverage.splice(medCovIndex, 1);
    this.medicalCoverage.value = '';
  }

  onPayerSelectionChange(selectedPayer) {
    const payerIndex = this.payers.findIndex(payer => payer._id === selectedPayer);
    this.addedPayers.push(this.payers[payerIndex]);
    this.payers.splice(payerIndex, 1);
    this.payersDataSource.data = this.addedPayers;
    this.payr.value = '';
  }

  onRemove(index) {
    this.addsMedCoverage.push({ value: this.addedCoverages[index].name, viewValue: this.addedCoverages[index].coverage_name });
    this.addedCoverages.splice(index, 1);
  }

  onRemovePayer(index) {
    this.payers.push(this.addedPayers[index]);
    this.addedPayers.splice(index, 1);
    this.payersDataSource.data = this.addedPayers;
  }

  async getPayersInsurance() {
    const action = { type: 'GET', target: 'residents/get_payers_insurance' };
    const payload = { residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status'] && result['data'].length > 0) {
      const insuranceData = result['data'][0];
      this.addedPayers = insuranceData.payers;
      this.payersDataSource.data = this.addedPayers;
      this.addedCoverages = insuranceData.medical_coverage;
      this.residentInsurance.company_name = insuranceData.company_name;
      this.residentInsurance.policy_number = insuranceData.policy_number;
      this.residentInsurance.payers_and_insurance_id = insuranceData._id;
      for (let i = 0; i < this.addedCoverages.length; i++) {
        for (let j = 0; j < this.addsMedCoverage.length; j++) {
          if (this.addedCoverages[i].name === this.addsMedCoverage[j].value) {
            this.addsMedCoverage.splice(j, 1);
          }
        }
      }
      for (let k = 0; k < this.addedPayers.length; k++) {
        for (let l = 0; l < this.payers.length; l++) {
          if (this.addedPayers[k]._id === this.payers[l]._id) {
            this.payers.splice(l, 1);
          }
        }
      }
    }
  }

  //get facility on init
  async getOrgFacility(org) {
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { org_id: org };
    const result = await this.apiService.apiFn(action, payload);
    console.log('new fn--->>', result);
    if (result['status'] && result['data'].length > 0) {
      this.faclist = result['data'];
      this.skillNursingFacility = result['data'].filter(el => el.type === 'Skilled Nursing');
      this.assitedLivingFacility = result['data'].filter(el => el.type === 'Assisted Living');
    } else {
      this.faclist = [];
    }
  }

  async onChangeStatus(event) {
    // let oldResidentStatus = this.resident['resident_status'];
    const residentStatus = event.value;
    if(residentStatus == 'Skilled Nursing' || residentStatus == 'Hospitalized' || residentStatus == 'Vacation') {
      this.resident.is_out_of_room = true;
    }
    const action = { type: 'POST', target: 'residents/change_status' };
    let payload = { };
    if (residentStatus === 'Transferred' || residentStatus === 'Skilled Nursing') {
      if (this.faclist) {
        this.faclist.filter(item => {
          if (item.type === 'Skilled Nursing' && item.fac_name.indexOf('(Skilled Nursing)') == -1) {
            item.fac_name = item.fac_name + ' (Skilled Nursing) '
          }
        })
      }
      let facilityToDisplay = residentStatus === 'Skilled Nursing' ? this.skillNursingFacility : this.faclist; //this.assitedLivingFacility;
      this.dialogRefs = this.dialog.open(StatusTransferredComponent, {
        width: '500px',
        panelClass: 'statuspopup',
        data: { faclist: facilityToDisplay, orgId: this.resident["organization"], currentFacId: this.resident["facility"] }
      });
      this.dialogRefs.afterClosed().subscribe(async response => {
        if (response && response['status']) {
          payload = {
            residentId: this.residentId,
            newStatus: residentStatus,
            oldFacility: this.resident['facility'],
            newFacility: response['updated_data'][0].current_fac
          };
          this.resident['facility'] = response['updated_data'][0].current_fac;

          this.dialogConfig.maxWidth = '500px';
          const action = { type: 'POST', target: 'residents/change_status' };
          const updateDocument = payload;
          this.dialogConfig.data = {
            'action': action,
            'payload': updateDocument
          };
          this.dialogRefs = this.dialog.open(this.confirmStatusChange, this.dialogConfig);
          if (this.resident && this.resident.room) {
            this.resident.room.room = '--';
          }
        } else {
          this.oldStatus = residentStatus;
          console.log("Old status",this.oldStatus);
          this.resident['resident_status'] = this.oldStatus;
        }
        // if (residentStatus === 'Transferred' || residentStatus === 'Skilled Nursing') {
        //   this.dialogConfig.maxWidth = '500px';
        //   const action = { type: 'POST', target: 'residents/change_status' };
        //   const updateDocument = payload;
        //   this.dialogConfig.data = {
        //     'action': action,
        //     'payload': updateDocument
        //   };
        //   this.dialogRefs = this.dialog.open(this.confirmStatusChange, this.dialogConfig);
        // } //else if(response && response['status'] && ) {
        //   const result = await this.apiService.apiFn(action, payload);
        //   if(result && result['status'] && result['data']){
        //     this.toastr.success('Resident Status updated successfully');
        //   } else {
        //     this.toastr.error('Error in Resident Status updating');
        //   }
        // }
      });
    } else {
      payload = { residentId: this.residentId, newStatus: residentStatus, oldFacility: this.resident['facility'], roomData: this.roomData};
      if (residentStatus === 'Moved' || residentStatus === 'Deceased') {
        this.dialogConfig.maxWidth = '500px';
        const action = { type: 'POST', target: 'residents/change_status' };
        const updateDocument = payload;
        this.dialogConfig.data = {
          'action': action,
          'payload': updateDocument
        };
        this.dialogRefs = this.dialog.open(this.confirmStatusChange, this.dialogConfig);
        if (this.resident && this.resident.room) {
          this.resident.room.room = '--';
        }
      } else {
        console.log("Payload",payload);
        // await this.apiService.apiFn(action, payload)
        // .then(res => {
        //   console.log("Resp--", res);
        // },(error) => console.log("Error", error)
        // )
        let result: any
        // .catch(err => console.log(err));
        result = await this.apiService.apiFn(action, payload);
        console.log(result,'-0-=---=-result')
        
        if (result && result['status'] && result['data']) {
          //this.toastr.success(result['message']);
          console.log(result);
          if (residentStatus === 'Vacation' || residentStatus === 'Skilled Nursing' || residentStatus === 'Hospitalized') {
            this.onChangefacility(true);
            this.onChangeIsRoom(true);
          }
          if (residentStatus === 'Active') {
            if (this.roomData && this.roomData.room_name) {
              this.resident.room.room = this.roomData.room_name;
            }
          }
        } 
        else {
          this.toastr.error(result['message']);
          this.resident.resident_status = this.statusOldVal;
        }
      }
    }

  }

  oldStatusValue(oldStatus){
    this.statusOldVal = oldStatus;
  }

  async onStatusChangeConfirm(action, payload) {
    this.dialogRefs.close(['result']['status'] = false);
    this._commonService.setLoader(true);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/unassigned_resident' },
      { resident: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) }
    );
    const result = await this.apiService.apiFn(action, payload);
    this._commonService.setLoader(false);
    if (result && result['status'] && result['data']) {
      this.oldStatus = this.resident['resident_status'];
      this.toastr.success('Resident Status updated successfully');
      if (payload.newStatus === 'Skilled Nursing') {
        this.onChangefacility(true);
      }
    } else {
      this.toastr.error('Error in Resident Status updating');
    }
  }

  async showHidePhysicianNotes(i, val) {
    this.assignedPhysician[i].show = !val;
  }

  async selectAdmitType(admitType) {
    console.log('admitType---->', admitType);
  }


  async deleteTagPhoto(item, index) {
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'Activity Photo' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {

      if (result && result === true) {
        // call delete api here
        if (this.route.params["_value"]["id"]) {
          this._commonService.setLoader(true);
           const residentTagPhoto = item.resident.filter((ele) => {
             return ele._id !== this.residentId;
           });
          const action = {
            type: "POST",
            target: "residents/save_activity_photo",
          };
          const payload = {
            resident: residentTagPhoto,
            _id: item._id,
          };
          const apiResult = await this.apiService.apiFn(action, payload);
          if (apiResult && apiResult['status']) {
            await this.getActivityData();
          }
        }
        this._commonService.setLoader(false);
      }
    });

  }
}

function __indexOf(collection, node) {
  return Array.prototype.indexOf.call(collection, node);
};

/** Determines whether an event is a touch event. */
function __isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return event.type.startsWith('touch');
}

function __isInsideDropListClientRect(dropList: CdkDropList, x: number, y: number) {
  const { top, bottom, left, right } = dropList.element.nativeElement.getBoundingClientRect();
  return y >= top && y <= bottom && x >= left && x <= right;
}
//NEw Care Changes End
// End Care list data
