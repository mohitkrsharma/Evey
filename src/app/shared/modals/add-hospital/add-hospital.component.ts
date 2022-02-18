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
  selector: "app-add-hospital",
  templateUrl: "./add-hospital.component.html",
  styleUrls: ["./add-hospital.component.scss"],
})
export class AddHospitalComponent implements OnInit {
  hospital: any = {
    name: "",
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
    other: "",
    email: "",
    notes: "",
    phone_numbers: [],
    title: "",
    website_address: "",
  };

  // hospital phone
  mobile_hospital = true;
  home_hospital = false;
  office_hospital = false;
  fax_hospital = false;
  other_hospital = false;

  contact_type_hospital = [
    { name: "Home" },
    { name: "Office" },
    { name: "Other" },
  ];

  type_of_contact = [
    { name: "Mobile" },
    { name: "Home" },
    { name: "Office" },
    { name: "Other" },
  ];

  staSearch = "";
  citSearch = "";
  phoneSearch = "";
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
    public _dialogRef: MatDialogRef<AddHospitalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if (data.hospital && data.hospital._id) {
        // take id from data
        this.getHospitalById(data.hospital._id);
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

  async getHospitalById(id){
    this.commonService.setLoader(true);
    const action = {
      type: 'GET', target: 'hospital/view'
    };
    const payload = { _id : id };
    // // console.log(payload)
    const result = await this.apiService.apiFn(action, payload);
    console.log("Result of hosp---", result);
    if(result['data'].phone_numbers){
      const _foundFaxIndex = result['data'].phone_numbers.findIndex(p => p.name == 'fax');
      this.hospital = result['data'];
      if(_foundFaxIndex > -1){
        result['data'].fax = result['data'].phone_numbers[_foundFaxIndex]['value'];
        result['data'].phone_numbers.splice(_foundFaxIndex,1);
        this.hospital.phone_numbers = result['data'].phone_numbers;
      }
    }
    this.isEdit = true;
    this.changeState(this.hospital.state);
    this.commonService.setLoader(false);
  }

  cancelHospital(f) {
    // this._dialogRef.close();
    console.log("cancel", this.hospital);
    this._dialogRef.close({ status: true, hospital: this.hospital });
  }

  Hospital() {
    const hospital: any = {
      name: "",
      // department_name: '',
      address1: "",
      address2: "",
      state: "",
      city: "",
      zip: "",
      mobile: "",
      home: "",
      office: "",
      fax: "",
      other: "",
      email: "",
      phone_numbers: [],
      title: "",
      website_address: "",
    };
    return hospital;
  }

  async addHospital(f, hospital) {
    this.commonService.setLoader(true);
    let form_status;

    if (
      !this.hospital.name ||
      !this.hospital.fax ||
      !this.hospital.address1 ||
      !this.hospital.state ||
      !this.hospital.city ||
      !this.hospital.zip
    ) {
      f.form.status = "INVALID";
      form_status = f.form.status;
    } else {
      f.form.status = "VALID";
      form_status = f.form.status;
      hospital.phone_numbers.push({ name: 'fax', value: this.hospital.fax });
    }

    // console.log('hospital form value---->', f.form.value);
    // console.log('hospital details---->', hospital);

    if (form_status === "VALID") {
      if (this.phoneArr[0].value !== "") {
        hospital.phone_numbers.unshift(this.phoneArr[0]);
      }

      hospital.fac_id = this.facility;
      if (hospital.phone_numbers && hospital.phone_numbers.length) {
        hospital.phone_numbers.forEach((e) => delete e.id);
      }
      const action = {
        type: "POST",
        target: "hospital/save",
      };

      const payload = hospital;
      console.log('payload--->', payload);
      const result = await this.apiService.apiFn(action, payload);
      console.log("result--->", result);

      if (result) {
        this.toastr.success(
          this.isEdit
            ? "Hospital updated successfully"
            : "Hospital added successfully"
        );
      } else {
        this.toastr.error("Something went wrong, Please try again.");
      }
      this._dialogRef.close({ status: true, hospital: result["data"] });
    } else if (form_status === "INVALID") {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error("Please enter valid hospital details");
      }
    }

    this.commonService.setLoader(false);
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  changeHospitalPhone(event) {
    if (event == "Mobile") {
      this.mobile_hospital = true;
      this.contact_type_hospital = this.contact_type_hospital.filter(
        (e) => e.name != "Mobile"
      );
    }
    if (event == "Home") {
      this.home_hospital = true;
      this.contact_type_hospital = this.contact_type_hospital.filter(
        (e) => e.name != "Home"
      );
    }
    if (event == "Office") {
      this.office_hospital = true;
      this.contact_type_hospital = this.contact_type_hospital.filter(
        (e) => e.name != "Office"
      );
    }
    if (event == "Other") {
      this.other_hospital = true;
      this.contact_type_hospital = this.contact_type_hospital.filter(
        (e) => e.name != "Other"
      );
    }
  }

  removeHospitalPhone(item) {
    if (item == "Mobile") {
      this.mobile_hospital = false;
      this.hospital.mobile = "";
      this.contact_type_hospital.push({ name: "Mobile" });
    }

    if (item == "Home") {
      this.home_hospital = false;
      this.hospital.home = "";
      this.contact_type_hospital.push({ name: "Home" });
    }
    if (item == "Office") {
      this.office_hospital = false;
      this.hospital.office = "";
      this.contact_type_hospital.push({ name: "Office" });
    }
    if (item == "Other") {
      this.other_hospital = false;
      this.hospital.other = "";
      this.contact_type_hospital.push({ name: "Other" });
    }
  }

  async changeState(state) {
    const stateid = this.statelist.filter((s) => s.name === state);

    const action = { type: "GET", target: "organization/citieslist" };
    const payload = { state_Id: stateid[0].id };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result["data"]["_cities"];
    this.Citielist.forEach((element) => {
      element["_id"] = element.id;
    });
  }

  addHospitalPhone(item) {
    // this.hospital.phone_numbers.push({
    //   id: this.hospital.phone_numbers.length + Math.random(),
    //   name: 'Mobile',
    //   value: '',
    // });
    if (item.value === "") {
      this.toastr.error("Please enter the contact number.");
      return;
    }
    this.hospital.phone_numbers.unshift(this.phoneArr[0]);
    this.phoneArr = [
      {
        id: this.hospital.phone_numbers.length + Math.random(),
        name: item.name,
        value: "",
      },
    ];
  }

  removeHospitalField(index) {
    this.hospital.phone_numbers.splice(index, 1);
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
