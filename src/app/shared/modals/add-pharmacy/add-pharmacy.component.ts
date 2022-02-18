import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-add-pharmacy',
  templateUrl: './add-pharmacy.component.html',
  styleUrls: ['./add-pharmacy.component.scss'],
})
export class AddPharmacyComponent implements OnInit {
  pharmacy: any = {
    name: '',
    address1: '',
    address2: '',
    state: '',
    city: '',
    zip: '',
    phone: '',
    fax: '',
    other: '',
    notes: '',
    phone_numbers: [],
  };
  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;
  organization;
  facility;
  private subscription: Subscription;
  isEdit = false;
  resident_id;
  // search
  staSearch = '';
  citSearch = '';
  PhoneNumberTypeSearch = '';
  // pharmacy popup specific details
  show = 'Fax';
  // pharmacy phone
  phone_pharmacy = true;
  fax_pharmacy = false;
  other_pharmacy = false;

  contact_type = [{ name: 'Fax' }, { name: 'Other' }];

  type_of_contact = [{ name: 'Phone' }, { name: 'Fax' }, { name: 'Other' }];
  phoneArr: any[] = [{ id: Math.random(), name: 'Fax', value: '' }];
  isedit = false;
  dialogConfig = new MatDialogConfig();
  dialogRefs: any;
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddPharmacyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if (data.pharmacy) {
        // take id from data
        let pharmacy_id = data.pharmacy._id;
        this.isEdit = true;
        // fetch that pharmacy add populate it

        this.editPharmacy(pharmacy_id);
      } else if (data.resident_id) {
        this.resident_id = data.resident_id;
      }
    }
  }

  ngOnInit() {
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
      }
    );
  }

  async addPharmacy(f, pharmacy) {
    console.log('phone numbers list', pharmacy.phone_numbers)
    this.commonService.setLoader(true);
    let form_status;
    form_status = f.form.status;
    if (form_status == 'VALID') {

      if (this.phoneArr[0].value != ''  ) {
        pharmacy.phone_numbers.unshift(this.phoneArr[0]);
      }

      let faxNumbers = pharmacy.phone_numbers.filter((e) => {
        return e.name.toLowerCase() == 'fax';
      });

      if (!(faxNumbers.length > 0)) {
        form_status = 'INVALID';
        this.toastr.error('Please add Fax number');
      }

      if (form_status == 'INVALID') {
        this.commonService.setLoader(false);
        return false;
      }

      const action = {
        type: 'POST',
        target: 'residents/add_pharmacy',
      };

      pharmacy.fac_id = this.facility;
      if (pharmacy.phone_numbers && pharmacy.phone_numbers.length) {
        pharmacy.phone_numbers.forEach((e) => delete e.id);
      }
      const payload = pharmacy;
      console.log('payload----->', payload);
      // console.log('f----->', f);
      const result = await this.apiService.apiFn(action, { data: payload });

      if (result) {
        this.toastr.success(
          this.isEdit
            ? 'Pharmacy updated successfully'
            : 'Pharmacy added successfully'
        );
      } else {
        this.toastr.error('Something went wrong, Please try again.');
      }
      this._dialogRef.close({ status: true, pharmacy: result });
      f.form.reset();
      this.contact_type = [{ name: 'Fax' }, { name: 'Other' }];
      this.pharmacy = this.Pharmacy();
      this.fax_pharmacy = false;
      this.other_pharmacy = false;
      this.isEdit = false;
    } else if (form_status == 'INVALID') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid pharmacy details');
      }
    }

    this.commonService.setLoader(false);
  }

  Pharmacy() {
    const pharmacy: any = {
      name: '',
      address1: '',
      address2: '',
      state: '',
      city: '',
      zip: '',
      phone: '',
      fax: '',
      other: '',
      notes: '',
      phone_numbers: [],
    };
    return pharmacy;
  }

  async editPharmacy(id) {
    // console.log(id);

    const action = {
      type: 'GET',
      target: 'pharmacy/view',
    };

    const payload = { _id: id };

    const result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      // for old records if there is no phone_numbers array than add default phone_numbers field there
      if (!result['data'].phone_numbers.length) {
        result['data'].phone_numbers = this.pharmacy.phone_numbers;
      } else {
        result['data'].phone_numbers = result[
          'data'
        ].phone_numbers.map((e) => ({ id: Math.random(), ...e }));
      }
      this.pharmacy = result['data'];
      if (result['data'].phone_numbers && result['data'].phone_numbers.length) {
        this.pharmacy.phone_numbers = result['data'].phone_numbers.map(e => ({ id: Math.random(), ...e }));
      }
      console.log('---editing pharmacy--', this.pharmacy, result['data']);
      if (this.pharmacy.fax) {
        this.fax_pharmacy = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Fax');
      }
      if (this.pharmacy.other) {
        this.other_pharmacy = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Other');
      }
      if (this.pharmacy.state) {
        this.changeState(this.pharmacy.state);
      }
    } else {
      this.toastr.error('Can not get pharmacy');
    }
  }

  cancelPharmacy(f) {
    this._dialogRef.close();
    f.form.reset();
    this.fax_pharmacy = false;
    this.other_pharmacy = false;
    this.isEdit = false;
    this.contact_type = [{ name: 'Fax' }, { name: 'Other' }];
    this.pharmacy = this.Pharmacy();
    this.phoneArr = [{ id: Math.random(), name: 'Fax', value: '' }];
  }

  select(state, city, flag) {
    if (flag === 0) {
      if (!state || state === undefined) {
        this.selectCitie = city.source.selected.viewValue;
      } else if (!city || city === undefined) {
        this.selectState = state.source.selected.viewValue;
      }
    } else {
      if (!state || state === undefined) {
        this.selectCitie = city;
      } else if (!city || city === undefined) {
        this.selectState = state;
      }
    }
  }

  async changeState(state) {
    const stateid = this.statelist.filter((s) => s.name === state);
    // this.commonService.setLoader(true);
    const action = { type: 'GET', target: 'organization/citieslist' };
    const payload = { state_Id: stateid[0].id };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result['data']['_cities'];
    this.Citielist.forEach((element) => {
      element['_id'] = element.id;
    });
    // this.commonService.setLoader(false);
  }

  changePharmacyPhone(event) {
    if (event == 'Phone') {
      this.phone_pharmacy = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Phone');
    }
    if (event == 'Fax') {
      this.fax_pharmacy = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Fax');
    }
    if (event == 'Other') {
      this.other_pharmacy = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Other');
    }
  }

  removePharmacyPhone(item) {
    // phone:'',
    // fax:'',
    // other:'',
    if (item == 'Phone') {
      this.phone_pharmacy = false;
      this.pharmacy.phone = '';
      this.contact_type.push({ name: 'Phone' });
    }

    if (item == 'Fax') {
      this.fax_pharmacy = false;
      this.pharmacy.fax = '';
      this.contact_type.push({ name: 'Fax' });
    }

    if (item == 'Other') {
      this.other_pharmacy = false;
      this.pharmacy.other = '';
      this.contact_type.push({ name: 'Other' });
    }
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  addPharmacyPhone(f, item) {
    // this.pharmacy.phone_numbers.push({
    //   id: this.pharmacy.phone_numbers.length + Math.random(),
    //   name: 'Phone',
    //   value: '',
    // });
    if (item.value == '') {
      this.toastr.error('Please enter the contact number.');
      return;
    }
    this.pharmacy.phone_numbers.unshift(this.phoneArr[0]);
    this.phoneArr = [{ id: this.pharmacy.phone_numbers.length + Math.random(), name: item.name, value: '' }];
  }

  removePharmacyField(index) {
    this.pharmacy.phone_numbers.splice(index, 1);
  }
}

const statelist: State[] = [
  {
    id: 3825,
    name: 'Alabama',
    country_id: 233,
  },
  {
    id: 3826,
    name: 'Alaska',
    country_id: 233,
  },
  {
    id: 3827,
    name: 'Arizona',
    country_id: 233,
  },
  // {
  //   'id': 4021,
  //   'name': 'American Samoa',
  //   'country_id': 233
  // },
  {
    id: 3828,
    name: 'Arkansas',
    country_id: 233,
  },
  {
    id: 3830,
    name: 'California',
    country_id: 233,
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
    id: 3832,
    name: 'Colorado',
    country_id: 233,
  },
  {
    id: 3833,
    name: 'Connecticut',
    country_id: 233,
  },
  {
    id: 3834,
    name: 'Delaware',
    country_id: 233,
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
    id: 3836,
    name: 'Florida',
    country_id: 233,
  },
  {
    id: 3838,
    name: 'Hawaii',
    country_id: 233,
  },
  {
    id: 3839,
    name: 'Idaho',
    country_id: 233,
  },
  {
    id: 3840,
    name: 'Illinois',
    country_id: 233,
  },
  // {
  //   'id': 4023,
  //   'name': 'Guam',
  //   'country_id': 233
  // },
  {
    id: 3841,
    name: 'Indiana',
    country_id: 233,
  },
  {
    id: 3842,
    name: 'Iowa',
    country_id: 233,
  },
  {
    id: 3843,
    name: 'Kansas',
    country_id: 233,
  },
  {
    id: 3844,
    name: 'Kentucky',
    country_id: 233,
  },
  {
    id: 3845,
    name: 'Louisiana',
    country_id: 233,
  },
  {
    id: 3837,
    name: 'Georgia',
    country_id: 233,
  },
  // {
  //   'id': 3846,
  //   'name': 'Lowa',
  //   'country_id': 233
  // },
  {
    id: 3848,
    name: 'Maryland',
    country_id: 233,
  },
  {
    id: 3849,
    name: 'Massachusetts',
    country_id: 233,
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
    id: 3851,
    name: 'Michigan',
    country_id: 233,
  },
  {
    id: 3852,
    name: 'Minnesota',
    country_id: 233,
  },
  {
    id: 3853,
    name: 'Mississippi',
    country_id: 233,
  },
  {
    id: 3854,
    name: 'Missouri',
    country_id: 233,
  },
  {
    id: 3847,
    name: 'Maine',
    country_id: 233,
  },
  {
    id: 3858,
    name: 'New Hampshire',
    country_id: 233,
  },
  {
    id: 3859,
    name: 'New Jersey',
    country_id: 233,
  },
  {
    id: 3857,
    name: 'Nevada',
    country_id: 233,
  },
  {
    id: 3860,
    name: 'New Jersy',
    country_id: 233,
  },
  {
    id: 3861,
    name: 'New Mexico',
    country_id: 233,
  },
  {
    id: 3862,
    name: 'New York',
    country_id: 233,
  },
  {
    id: 3863,
    name: 'North Carolina',
    country_id: 233,
  },
  {
    id: 3864,
    name: 'North Dakota',
    country_id: 233,
  },
  {
    id: 3855,
    name: 'Montana',
    country_id: 233,
  },
  {
    id: 3856,
    name: 'Nebraska',
    country_id: 233,
  },
  // {
  //   'id': 4025,
  //   'name': 'Northern Mariana Islands',
  //   'country_id': 233
  // },
  {
    id: 3868,
    name: 'Oregon',
    country_id: 233,
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
    id: 3869,
    name: 'Pennsylvania',
    country_id: 233,
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
    id: 3871,
    name: 'Rhode Island',
    country_id: 233,
  },
  {
    id: 3865,
    name: 'Ohio',
    country_id: 233,
  },
  {
    id: 3866,
    name: 'Oklahoma',
    country_id: 233,
  },
  {
    id: 3872,
    name: 'South Carolina',
    country_id: 233,
  },
  {
    id: 3873,
    name: 'South Dakota',
    country_id: 233,
  },
  {
    id: 3875,
    name: 'Tennessee',
    country_id: 233,
  },
  // {
  //   'id': 3874,
  //   'name': 'Sublimity',
  //   'country_id': 233
  // },
  {
    id: 3876,
    name: 'Texas',
    country_id: 233,
  },
  // {
  //   'id': 3877,
  //   'name': 'Trimble',
  //   'country_id': 233
  // },
  {
    id: 3878,
    name: 'Utah',
    country_id: 233,
  },
  {
    id: 3879,
    name: 'Vermont',
    country_id: 233,
  },
  // {
  //   'id': 4028,
  //   'name': 'Virgin Islands',
  //   'country_id': 233
  // },
  {
    id: 3880,
    name: 'Virginia',
    country_id: 233,
  },
  {
    id: 3881,
    name: 'Washington',
    country_id: 233,
  },
  {
    id: 3883,
    name: 'Wisconsin',
    country_id: 233,
  },
  {
    id: 3884,
    name: 'Wyoming',
    country_id: 233,
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
