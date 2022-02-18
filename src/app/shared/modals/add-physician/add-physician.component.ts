import { Component, Inject, OnInit } from "@angular/core";
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material";
import { ToastrService } from "ngx-toastr";
import { Subscription } from "rxjs";
import { ApiService } from "src/app/shared/services/api/api.service";
import { CommonService } from "src/app/shared/services/common.service";
@Component({
  selector: "app-add-physician",
  templateUrl: "./add-physician.component.html",
  styleUrls: ["./add-physician.component.scss"],
})
export class AddPhysicianComponent implements OnInit {
  physician: any = {
    first_name: "",
    last_name: "",
    practice_name: "",
    medical_profession_type: "",
    address1: "",
    address2: "",
    state: "",
    city: "",
    zip: "",
    mobile: "",
    home: "",
    office: "",
    fax: "",
    pager: "",
    other: "",
    email: "",
    notes: "",
    phone_numbers: [],
    title: "",
    website_address: "",
    medicare_provider_number: "",
    medicaid_provider_number: "",
    national_provider_id: "",
    group_national_provider_id: "",
    registration_code: "",
    taxonomy_code: "",
    dea_number: "",
    state_license_number: "",
    isCredentialeChecked: false,
    isSanctionedChecked: false,
    credential: "",
  };

  credentialToggle = false;
  isCredentialeChecked = false;
  isSanctionedChecked = false;

  // physician phone
  mobile_physician = true;
  home_physician = false;
  office_physician = false;
  fax_physician = false;
  pager_physician = false;
  other_physician = false;

  contact_type_physician = [
    { name: "Home" },
    { name: "Office" },
    { name: "Fax" },
    { name: "Other" },
  ];

  type_of_contact = [
    { name: "Mobile" },
    { name: "Home" },
    { name: "Office" },
    { name: "Fax" },
    { name: "Pager" } /* adding pager */,
    { name: "Other" },
  ];

  titlesList = [
    { name: "Dr." },
    { name: "Mr." },
    { name: "Mrs." },
    { name: "Miss." },
    { name: "Ms." },
  ];

  medical_profession = [
    { name: "Alternate Physician" },
    { name: "Attending Physician (MD)" },
    { name: "Nurse" },
    { name: "Nurse Practitioner" },
    { name: "Medical Specialist" },
    { name: "Physician’s Assistant" },
    { name: "Dentist" },
    { name: "Optometrist" },
    { name: "Ophthalmologist" },
    { name: "Cardiologist" },
    { name: "Hematologist" },
    { name: "Podiatrist" },
    { name: "Neurologist" },
    { name: "Nephrologist" },
    { name: "Psychologist" },
    { name: "Psychiatrist" },
    { name: "Doctor of Nursing Practice (DNP)" },
    { name: "Urologist" },
    { name: "Doctor of Osteopathic Medicine (DO)" },
    { name: "Dietitian" },
    { name: "Physical Therapy (PT)" },
    { name: "Occupational Therapy (OT)" },
    { name: "Speech-Language Pathology (SLP)" },
    { name: "Rheumatologist" },
    { name: "Medical Director" },
  ];

  staSearch = "";
  citSearch = "";
  phoneSearch = "";
  professionSearch = "";
  titleSearch = "";
  PhoneNumberTypeSearch = "";
  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;
  organization;
  facility;
  isEdit = false;
  resident_id;
  openOtherDeatils = false;
  phoneArr: any[] = [{ id: Math.random(), name: "Mobile", value: "" }];
  private subscription: Subscription;

  dialogConfig = new MatDialogConfig();
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddPhysicianComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    debugger;
    console.log("Shared Module Add Physician");

    if (data) {
      if (data.physician) {
        // take id from data
        const physician_id = data.physician._id;
        if (physician_id) {
          this.isEdit = true;
          // fetch that physician add populate it

          this.editPhysician(physician_id);
        } else {
          this.physician = data.physician;
        }
      } else if (data.resident_id) {
        this.physician.title = this.titlesList.find(
          (item) => item.name == "Dr."
        ).name;
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
    console.log(this.physician);
  }

  sortedmedical_profession() {
    this.medical_profession = this.medical_profession.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return this.medical_profession;
  }

  cancelPhysician(f) {
    this._dialogRef.close();
    f.form.reset();
    this.phoneArr = [{ id: Math.random(), name: "Mobile", value: "" }];
    this.home_physician = false;
    this.office_physician = false;
    this.fax_physician = false;
    this.pager_physician = false;
    this.other_physician = false;
    this.contact_type_physician = [
      { name: "Home" },
      { name: "Office" },
      { name: "Fax" },
      { name: "Pager" } /* adding pager */,
      { name: "Other" },
    ];
  }

  async addPhysician(f, physician) {
    console.log("Physician------", physician);
    this.commonService.setLoader(true);
    var form_status;

    if (
      this.physician.first_name &&
      !this.physician.last_name &&
      !this.physician.practice_name
    ) {
      f.form.status = "INVALID";
      form_status = f.form.status;
    } else {
      f.form.status = "VALID";
      form_status = f.form.status;
    }

    // console.log('physician form value---->', f.form.value);
    // console.log('physician details---->', physician);

    if (form_status === "VALID") {
      if (this.phoneArr[0].value != "") {
        physician.phone_numbers.unshift(this.phoneArr[0]);
      }
      if (physician.credential) {
        if (physician.credential == "Credentialed") {
          physician.isCredentialeChecked = true;
        } else if (physician.credential == "Sanctioned") {
          physician.isSanctionedChecked = true;
        }
      }
      delete physician.credential;

      // if (physician.phone_numbers && physician.phone_numbers.length) {
      //   const faxNumbers = physician.phone_numbers.filter(
      //     (e) => e.name.toLowerCase() === 'fax'
      //   );
      //   // const officeNumber = physician.phone_numbers.filter(e => { return e.name.toLowerCase() == 'office' });
      //   // if (!(officeNumber.length > 0)) {
      //   //   form_status = 'INVALID'
      //   //   this.toastr.error('Please add Office number');
      //   // }
      //   if (!(faxNumbers.length > 0)) {
      //     form_status = 'INVALID';
      //     this.toastr.error('Please add Fax number');
      //   }

      //   if (form_status === 'INVALID') {
      //     this.commonService.setLoader(false);
      //     return false;
      //   }
      // }
      // console.log('this.resident_id---->', this.resident_id);
      // console.log('physician._id---->', physician._id);
      physician.fac_id = this.facility;
      if (physician.phone_numbers && physician.phone_numbers.length) {
        physician.phone_numbers.forEach((e) => delete e.id);
      }
      const action = {
        type: "POST",
        target: "residents/add_prescriber",
      };

      const payload = physician;
      console.log("Physician payload--->", payload);
      const result = await this.apiService.apiFn(action, { data: payload });

      if (result) {
        this.toastr.success(
          this.isEdit
            ? "Physician updated successfully"
            : "Physician added successfully"
        );
      } else {
        this.toastr.error("Something went wrong, Please try again.");
      }
      this._dialogRef.close({ status: true, physician: result });
      f.form.reset();
      this.contact_type_physician = [
        { name: "Home" },
        { name: "Office" },
        { name: "Fax" },
        { name: "Pager" } /* adding pager */,
        { name: "Other" },
      ];
      this.home_physician = false;
      this.office_physician = false;
      this.fax_physician = false;
      this.pager_physician = false;
      this.other_physician = false;
      this.openOtherDeatils = false;
    } else if (form_status == "INVALID") {
      if (this.toastr.currentlyActive === 0) {
        if (
          this.physician.first_name &&
          !this.physician.last_name &&
          !this.physician.practice_name
        ) {
          this.toastr.error("Please enter Last Name or Practice Name");
        } else {
          this.toastr.error("Please enter valid physician details");
        }
      }
    }

    this.commonService.setLoader(false);
  }

  async editPhysician(id) {
    // console.log(id);

    const action = {
      type: "GET",
      target: "physician/view",
    };

    const payload = { _id: id };

    const result = await this.apiService.apiFn(action, payload);

    if (result["status"]) {
      // if (!result['data'].phone_numbers.length) {
      //   result['data'].phone_numbers = this.physician.phone_numbers;
      // } else {
      //   result['data'].phone_numbers = result[
      //     'data'
      //   ].phone_numbers.map((e) => ({ id: Math.random(), ...e }));
      // }
      this.physician = result["data"];
      this.credentialToggle = this.physician.isSanctionedChecked;
      if (result["data"].phone_numbers && result["data"].phone_numbers.length) {
        this.physician.phone_numbers = result["data"].phone_numbers.map(
          (e) => ({ id: Math.random(), ...e })
        );
      }
      if (this.physician.state) {
        this.changeState(this.physician.state);
      }
      this.isEdit = true;
    } else {
      this.toastr.error("Can not get physician");
    }
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  changePhysicianPhone(event) {
    if (event == "Mobile") {
      this.mobile_physician = true;
      this.contact_type_physician = this.contact_type_physician.filter(
        (e) => e.name != "Mobile"
      );
    }
    if (event == "Home") {
      this.home_physician = true;
      this.contact_type_physician = this.contact_type_physician.filter(
        (e) => e.name != "Home"
      );
    }
    if (event == "Office") {
      this.office_physician = true;
      this.contact_type_physician = this.contact_type_physician.filter(
        (e) => e.name != "Office"
      );
    }
    if (event == "Fax") {
      this.fax_physician = true;
      this.contact_type_physician = this.contact_type_physician.filter(
        (e) => e.name != "Fax"
      );
    }
    /* adding pager */
    if (event == "Pager") {
      this.pager_physician = true;
      this.contact_type_physician = this.contact_type_physician.filter(
        (e) => e.name != "Pager"
      );
    }
    if (event == "Other") {
      this.other_physician = true;
      this.contact_type_physician = this.contact_type_physician.filter(
        (e) => e.name != "Other"
      );
    }
  }

  removePhysicianPhone(item) {
    if (item == "Mobile") {
      this.mobile_physician = false;
      this.physician.mobile = "";
      this.contact_type_physician.push({ name: "Mobile" });
    }

    if (item == "Home") {
      this.home_physician = false;
      this.physician.home = "";
      this.contact_type_physician.push({ name: "Home" });
    }
    if (item == "Office") {
      this.office_physician = false;
      this.physician.office = "";
      this.contact_type_physician.push({ name: "Office" });
    }
    if (item == "Fax") {
      this.fax_physician = false;
      this.physician.fax = "";
      this.contact_type_physician.push({ name: "Fax" });
    }
    /* adding pager */
    if (item == "Pager") {
      this.pager_physician = false;
      this.physician.pager = "";
      this.contact_type_physician.push({ name: "Pager" });
    }
    if (item == "Other") {
      this.other_physician = false;
      this.physician.other = "";
      this.contact_type_physician.push({ name: "Other" });
    }
  }

  async changeState(state) {
    let stateid = this.statelist.filter((s) => s.name === state);

    const action = { type: "GET", target: "organization/citieslist" };
    const payload = { state_Id: stateid[0].id };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result["data"]["_cities"];
    this.Citielist.forEach((element) => {
      element["_id"] = element.id;
    });
  }

  addPhysicianPhone(f, item) {
    // this.physician.phone_numbers.push({
    //   id: this.physician.phone_numbers.length + Math.random(),
    //   name: 'Mobile',
    //   value: '',
    // });
    if (item.value == "") {
      this.toastr.error("Please enter the contact number.");
      return;
    }
    console.log("Phone add-----", this.physician.phone_numbers);
    this.physician.phone_numbers.unshift(this.phoneArr[0]);
    this.phoneArr = [
      {
        id: this.physician.phone_numbers.length + Math.random(),
        name: item.name,
        value: "",
      },
    ];
  }

  removePhysicianField(index) {
    this.physician.phone_numbers.splice(index, 1);
  }

  changeCredentialed(event) {
    this.physician.isCredentialeChecked = event.checked;
    this.isCredentialeChecked = event.checked;
  }

  changeSanctioned(event) {
    this.physician.isSanctionedChecked = event.checked;
    this.isSanctionedChecked = event.checked;
  }

  onChangeActive(event) {
    this.physician.isCredentialeChecked = !event.checked;
    this.isCredentialeChecked = !event.checked;
    this.physician.isSanctionedChecked = event.checked;
    this.isSanctionedChecked = event.checked;
  }
}

const statelist: State[] = [
  {
    id: 3825,
    name: "Alabama",
    country_id: 233,
  },
  {
    id: 3826,
    name: "Alaska",
    country_id: 233,
  },
  {
    id: 3827,
    name: "Arizona",
    country_id: 233,
  },
  // {
  //   'id': 4021,
  //   'name': 'American Samoa',
  //   'country_id': 233
  // },
  {
    id: 3828,
    name: "Arkansas",
    country_id: 233,
  },
  {
    id: 3830,
    name: "California",
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
    name: "Colorado",
    country_id: 233,
  },
  {
    id: 3833,
    name: "Connecticut",
    country_id: 233,
  },
  {
    id: 3834,
    name: "Delaware",
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
    name: "Florida",
    country_id: 233,
  },
  {
    id: 3838,
    name: "Hawaii",
    country_id: 233,
  },
  {
    id: 3839,
    name: "Idaho",
    country_id: 233,
  },
  {
    id: 3840,
    name: "Illinois",
    country_id: 233,
  },
  // {
  //   'id': 4023,
  //   'name': 'Guam',
  //   'country_id': 233
  // },
  {
    id: 3841,
    name: "Indiana",
    country_id: 233,
  },
  {
    id: 3842,
    name: "Iowa",
    country_id: 233,
  },
  {
    id: 3843,
    name: "Kansas",
    country_id: 233,
  },
  {
    id: 3844,
    name: "Kentucky",
    country_id: 233,
  },
  {
    id: 3845,
    name: "Louisiana",
    country_id: 233,
  },
  {
    id: 3837,
    name: "Georgia",
    country_id: 233,
  },
  // {
  //   'id': 3846,
  //   'name': 'Lowa',
  //   'country_id': 233
  // },
  {
    id: 3848,
    name: "Maryland",
    country_id: 233,
  },
  {
    id: 3849,
    name: "Massachusetts",
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
    name: "Michigan",
    country_id: 233,
  },
  {
    id: 3852,
    name: "Minnesota",
    country_id: 233,
  },
  {
    id: 3853,
    name: "Mississippi",
    country_id: 233,
  },
  {
    id: 3854,
    name: "Missouri",
    country_id: 233,
  },
  {
    id: 3847,
    name: "Maine",
    country_id: 233,
  },
  {
    id: 3858,
    name: "New Hampshire",
    country_id: 233,
  },
  {
    id: 3859,
    name: "New Jersey",
    country_id: 233,
  },
  {
    id: 3857,
    name: "Nevada",
    country_id: 233,
  },
  {
    id: 3860,
    name: "New Jersy",
    country_id: 233,
  },
  {
    id: 3861,
    name: "New Mexico",
    country_id: 233,
  },
  {
    id: 3862,
    name: "New York",
    country_id: 233,
  },
  {
    id: 3863,
    name: "North Carolina",
    country_id: 233,
  },
  {
    id: 3864,
    name: "North Dakota",
    country_id: 233,
  },
  {
    id: 3855,
    name: "Montana",
    country_id: 233,
  },
  {
    id: 3856,
    name: "Nebraska",
    country_id: 233,
  },
  // {
  //   'id': 4025,
  //   'name': 'Northern Mariana Islands',
  //   'country_id': 233
  // },
  {
    id: 3868,
    name: "Oregon",
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
    name: "Pennsylvania",
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
    name: "Rhode Island",
    country_id: 233,
  },
  {
    id: 3865,
    name: "Ohio",
    country_id: 233,
  },
  {
    id: 3866,
    name: "Oklahoma",
    country_id: 233,
  },
  {
    id: 3872,
    name: "South Carolina",
    country_id: 233,
  },
  {
    id: 3873,
    name: "South Dakota",
    country_id: 233,
  },
  {
    id: 3875,
    name: "Tennessee",
    country_id: 233,
  },
  // {
  //   'id': 3874,
  //   'name': 'Sublimity',
  //   'country_id': 233
  // },
  {
    id: 3876,
    name: "Texas",
    country_id: 233,
  },
  // {
  //   'id': 3877,
  //   'name': 'Trimble',
  //   'country_id': 233
  // },
  {
    id: 3878,
    name: "Utah",
    country_id: 233,
  },
  {
    id: 3879,
    name: "Vermont",
    country_id: 233,
  },
  // {
  //   'id': 4028,
  //   'name': 'Virgin Islands',
  //   'country_id': 233
  // },
  {
    id: 3880,
    name: "Virginia",
    country_id: 233,
  },
  {
    id: 3881,
    name: "Washington",
    country_id: 233,
  },
  {
    id: 3883,
    name: "Wisconsin",
    country_id: 233,
  },
  {
    id: 3884,
    name: "Wyoming",
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
