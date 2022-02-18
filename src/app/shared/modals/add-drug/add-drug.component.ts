import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-add-drug',
  templateUrl: './add-drug.component.html',
  styleUrls: ['./add-drug.component.scss']
})
export class AddDrugComponent implements OnInit {

  physician: any = {
    first_name: '',
    last_name: '',
    practice_name: '',
    medical_profession_type: '',
    address1: '',
    address2: '',
    state: '',
    city: '',
    zip: '',
    mobile: '',
    home: '',
    office: '',
    fax: '',
    other: '',
    email: '',
    notes: '',
    phone_numbers: [{ id:Math.random(),name: 'Mobile', value: '' }],
  };

  // physician phone
  mobile_physician = true;
  home_physician = false;
  office_physician = false;
  fax_physician = false;
  other_physician = false;

  contact_type_physician = [
    { name: 'Home' },
    { name: 'Office' },
    { name: 'Fax' },
    { name: 'Other' },
  ];

  type_of_contact = [
    { name: 'Mobile' },
    { name: 'Home' },
    { name: 'Office' },
    { name: 'Fax' },
    { name: 'Other' },
  ];

  medical_profession = [
    { name: 'Alternate Physician' },
    { name: 'Attending Physician' },
    { name: 'Nurse' },
    { name: 'Nurse Practitioner' },
    { name: 'Medical Specialist' },
    { name: 'Physician’s Assistant' },
    { name: 'Dentist' },
    { name: 'Optometrist' },
    { name: 'Ophthalmologist' },
    { name: 'Cardiologist' },
    { name: 'Hematologist' },
    { name: 'Podiatrist' },
    { name: 'Neurologist' },
    { name: 'Nephrologist' },
    { name: 'Psychologist' },
    { name: 'Psychiatrist' },
  ];

  staSearch = '';
  citSearch = '';
  phoneSearch = '';
  professionSearch = '';
  PhoneNumberTypeSearch = '';
  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;
  organization;
  facility;
  isEdit = false;
  private subscription: Subscription;

  // new
  drugForm: FormGroup;
  typeSearch = '';
  dosageSearch = '';
  routeSearch = '';
  typeList = [];
  routeList = [];
  dosageFormList = [];

  dialogConfig = new MatDialogConfig();
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddDrugComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  async ngOnInit() {
    // this.commonService.setLoader(true);
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
      }
    );
    this.drugForm = this.fb.group({ // Medication form
      name: ['', [Validators.required]],
      strength: ['', [Validators.required]],
      route: ['', [Validators.required]],
      ndc: ['', [Validators.required]],
      suffix_name: [''],
      non_suffix_name: [''],
      type: ['', [Validators.required]],
      dosage_form: ['', [Validators.required]],
      category_name: [''],
      laberer_name: [''],
      substance_name: [''],
      marketing_start_date: [''],
      marketing_end_date: [' '],
      application_number: [' '],
      unit: ['', [Validators.required]],
      pharm_class: [''],
      deschedule: [''],
      ndc_exclude_flag: [''],
      medicine_id: [''],
      certified_through: [''],
      isNarcotics: [''],
      typeSearch: '',
      dosageSearch: '',
      routeSearch: '',
    });
    await this.getDrugRoutesList();
    await this.getDrugDosageFormList();
    await this.getDrugTypeList();
    // this.commonService.setLoader(false);
  }

  cancel(f) {
    this._dialogRef.close();
    // f.form.reset();

    // this.home_physician = false;
    // this.office_physician = false;
    // this.fax_physician = false;
    // this.other_physician = false;
    // this.contact_type_physician = [
    //   { name: 'Home' },
    //   { name: 'Office' },
    //   { name: 'Fax' },
    //   { name: 'Other' },
    // ];
  }


  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  async changeState(state) {
    let stateid = this.statelist.filter((s) => s.name === state);

    const action = { type: 'GET', target: 'organization/citieslist' };
    const payload = { state_Id: stateid[0].id };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result['data']['_cities'];
    this.Citielist.forEach(element => {
      element["_id"] = element.id;
    });
  }

  async filterTypeData(event) {
    console.log('typeSearch--->', this.typeSearch);
    await this.getDrugTypeList();
  }

  async filterDosageData(event) {
    console.log('dosageSearch--->', this.dosageSearch);
    await this.getDrugDosageFormList();
  }

  async filterRoutesData(event) {
    console.log('routeSearch--->', this.routeSearch);
    await this.getDrugRoutesList();
  }

  async getDrugTypeList() {
    // get drug type list:
    const action = { type: 'GET', target: 'residents/get_drugs_types_list' };
    const payload = {
      // fac_id: this.facility,
      pageIndex: 0,
      pageSize: 10,
      search: this.typeSearch
    };
    const result = await this.apiService.apiFn(action, payload);
    this.typeList = result['data'];
    // console.log('this.typeList---->', this.typeList);
  }

  async getDrugDosageFormList() {
    // get drug type list:
    const action = { type: 'GET', target: 'residents/get_drugs_dosage_form_list' };
    const payload = {
      // fac_id: this.facility,
      pageIndex: 0,
      pageSize: 10,
      search: this.dosageSearch
    };
    const result = await this.apiService.apiFn(action, payload);
    this.dosageFormList = result['data'];
    // console.log('this.dosageFormList---->', this.dosageFormList);
  }

  async getDrugRoutesList() {
    // get drug type list:
    const action = { type: 'GET', target: 'residents/get_drugs_routes_list' };
    const payload = {
      // fac_id: this.facility,
      pageIndex: 0,
      pageSize: 10,
      search: this.routeSearch
    };
    const result = await this.apiService.apiFn(action, payload);
    this.routeList = result['data'];
    // console.log('this.routeList---->', this.routeList);
  }

  async drugDataSave(isValid) {


    if (isValid) {
        this.commonService.setLoader(true);
        const user_Id = sessionStorage.getItem('user_Id');
        let drugBody = {};
        drugBody = {
          name: this.drugForm.value.name,
          strength: this.drugForm.value.strength,
          route: this.drugForm.value.route,
          ndc: this.drugForm.value.ndc,
          suffix_name: this.drugForm.value.suffix_name,
          non_suffix_name: this.drugForm.value.non_suffix_name,
          type: this.drugForm.value.type,
          dosage_form: this.drugForm.value.dosage_form,
          category_name: this.drugForm.value.category_name,
          laberer_name: this.drugForm.value.laberer_name,
          substance_name: this.drugForm.value.substance_name,
          marketing_start_date: this.drugForm.value.marketing_start_date,
          marketing_end_date: this.drugForm.value.marketing_end_date,
          application_number: this.drugForm.value.application_number,
          unit: this.drugForm.value.unit,
          pharm_class: this.drugForm.value.pharm_class,
          deschedule: this.drugForm.value.deschedule,
          ndc_exclude_flag: this.drugForm.value.ndc_exclude_flag,
          medicine_id: this.drugForm.value.medicine_id,
          certified_through: this.drugForm.value.certified_through,
          isNarcotics: false,
          isTreatment: true,
        };

        const action = {
          type: 'POST',
          target: 'residents/add_prescriber_medicine'
        };
        const payload = drugBody;
        // console.log('drug payload--------->', payload);
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          this.commonService.setLoader(false);
          this._dialogRef.close({status: true, drug: result['data']});
          this.toastr.success('Drug data added successfully');
        } else {
          this.toastr.error('Something went wrong, Please try again.');
        }
    }
  }
}

const statelist: State[] = [
  {
    'id': 3825,
    'name': 'Alabama',
    'country_id': 233
  },
  {
    'id': 3826,
    'name': 'Alaska',
    'country_id': 233
  },
  {
    'id': 3827,
    'name': 'Arizona',
    'country_id': 233
  },
  // {
  //   'id': 4021,
  //   'name': 'American Samoa',
  //   'country_id': 233
  // },
  {
    'id': 3828,
    'name': 'Arkansas',
    'country_id': 233
  },
  {
    'id': 3830,
    'name': 'California',
    'country_id': 233
  },
  // {
  //   'id': 3829,
  //   'name': 'Byram',
  //   'country_id': 233
  // },
  // {
  //   'id': 3831,
  //   'name': 'Cokato',
  //   'country_id': 233
  // },
  {
    'id': 3832,
    'name': 'Colorado',
    'country_id': 233
  },
  {
    'id': 3833,
    'name': 'Connecticut',
    'country_id': 233
  },
  {
    'id': 3834,
    'name': 'Delaware',
    'country_id': 233
  },
  // {
  //   'id': 3835,
  //   'name': 'District of Columbia',
  //   'country_id': 233
  // },
  // {
  //   'id': 4022,
  //   'name': 'Federated States Of Micronesia',
  //   'country_id': 233
  // },
  {
    'id': 3836,
    'name': 'Florida',
    'country_id': 233
  },
  {
    'id': 3838,
    'name': 'Hawaii',
    'country_id': 233
  },
  {
    'id': 3839,
    'name': 'Idaho',
    'country_id': 233
  },
  {
    'id': 3840,
    'name': 'Illinois',
    'country_id': 233
  },
  // {
  //   'id': 4023,
  //   'name': 'Guam',
  //   'country_id': 233
  // },
  {
    'id': 3841,
    'name': 'Indiana',
    'country_id': 233
  },
  {
    'id': 3842,
    'name': 'Iowa',
    'country_id': 233
  },
  {
    'id': 3843,
    'name': 'Kansas',
    'country_id': 233
  },
  {
    'id': 3844,
    'name': 'Kentucky',
    'country_id': 233
  },
  {
    'id': 3845,
    'name': 'Louisiana',
    'country_id': 233
  },
  {
    'id': 3837,
    'name': 'Georgia',
    'country_id': 233
  },
  // {
  //   'id': 3846,
  //   'name': 'Lowa',
  //   'country_id': 233
  // },
  {
    'id': 3848,
    'name': 'Maryland',
    'country_id': 233
  },
  {
    'id': 3849,
    'name': 'Massachusetts',
    'country_id': 233
  },
  // {
  //   'id': 4024,
  //   'name': 'Marshall Islands',
  //   'country_id': 233
  // },
  // {
  //   'id': 3850,
  //   'name': 'Medfield',
  //   'country_id': 233
  // },
  {
    'id': 3851,
    'name': 'Michigan',
    'country_id': 233
  },
  {
    'id': 3852,
    'name': 'Minnesota',
    'country_id': 233
  },
  {
    'id': 3853,
    'name': 'Mississippi',
    'country_id': 233
  },
  {
    'id': 3854,
    'name': 'Missouri',
    'country_id': 233
  },
  {
    'id': 3847,
    'name': 'Maine',
    'country_id': 233
  },
  {
    'id': 3858,
    'name': 'New Hampshire',
    'country_id': 233
  },
  {
    'id': 3859,
    'name': 'New Jersey',
    'country_id': 233
  },
  {
    'id': 3857,
    'name': 'Nevada',
    'country_id': 233
  },
  {
    'id': 3860,
    'name': 'New Jersy',
    'country_id': 233
  },
  {
    'id': 3861,
    'name': 'New Mexico',
    'country_id': 233
  },
  {
    'id': 3862,
    'name': 'New York',
    'country_id': 233
  },
  {
    'id': 3863,
    'name': 'North Carolina',
    'country_id': 233
  },
  {
    'id': 3864,
    'name': 'North Dakota',
    'country_id': 233
  },
  {
    'id': 3855,
    'name': 'Montana',
    'country_id': 233
  },
  {
    'id': 3856,
    'name': 'Nebraska',
    'country_id': 233
  },
  // {
  //   'id': 4025,
  //   'name': 'Northern Mariana Islands',
  //   'country_id': 233
  // },
  {
    'id': 3868,
    'name': 'Oregon',
    'country_id': 233
  },
  // {
  //   'id': 3867,
  //   'name': 'Ontario',
  //   'country_id': 233
  // },
  // {
  //   'id': 4026,
  //   'name': 'Palau',
  //   'country_id': 233
  // },
  {
    'id': 3869,
    'name': 'Pennsylvania',
    'country_id': 233
  },
  // {
  //   'id': 4027,
  //   'name': 'Puerto Rico',
  //   'country_id': 233
  // },
  // {
  //   'id': 3870,
  //   'name': 'Ramey',
  //   'country_id': 233
  // },
  {
    'id': 3871,
    'name': 'Rhode Island',
    'country_id': 233
  },
  {
    'id': 3865,
    'name': 'Ohio',
    'country_id': 233
  },
  {
    'id': 3866,
    'name': 'Oklahoma',
    'country_id': 233
  },
  {
    'id': 3872,
    'name': 'South Carolina',
    'country_id': 233
  },
  {
    'id': 3873,
    'name': 'South Dakota',
    'country_id': 233
  },
  {
    'id': 3875,
    'name': 'Tennessee',
    'country_id': 233
  },
  // {
  //   'id': 3874,
  //   'name': 'Sublimity',
  //   'country_id': 233
  // },
  {
    'id': 3876,
    'name': 'Texas',
    'country_id': 233
  },
  // {
  //   'id': 3877,
  //   'name': 'Trimble',
  //   'country_id': 233
  // },
  {
    'id': 3878,
    'name': 'Utah',
    'country_id': 233
  },
  {
    'id': 3879,
    'name': 'Vermont',
    'country_id': 233
  },
  // {
  //   'id': 4028,
  //   'name': 'Virgin Islands',
  //   'country_id': 233
  // },
  {
    'id': 3880,
    'name': 'Virginia',
    'country_id': 233
  },
  {
    'id': 3881,
    'name': 'Washington',
    'country_id': 233
  },
  {
    'id': 3883,
    'name': 'Wisconsin',
    'country_id': 233
  },
  {
    'id': 3884,
    'name': 'Wyoming',
    'country_id': 233
  },
  // {
  //   'id': 3882,
  //   'name': 'West Virginia',
  //   'country_id': 233
  // }
];

export interface State {
  id: number;
  name: string;
  country_id: number;
}
