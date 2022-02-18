import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  TemplateRef,
  ElementRef,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { CommonService } from './../../services/common.service';
import { ApiService } from './../../services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { StringFilterByPipe } from './../../pipes/string-filterdata';
@Component({
  selector: 'app-emergency-contact',
  templateUrl: './emergency-contact.component.html',
  styleUrls: ['./emergency-contact.component.scss'],
})
export class EmergencyContactComponent implements OnInit {
  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;
  staSearch = '';
  citSearch = '';
  emailSearch = '';
  phoneSearch = '';
  relationSearch = '';
  PhoneNumberTypeSearch = '';
  emailAddressSearch = '';
  show = 'Home';

  show_home = true;
  show_mobile = false;
  show_office = false;
  show_fax = false;
  show_other = false;
  // {name:'Home'},{name:'Mobile'},{name:'Office'},{name:'Fax'}
  // show_email = 'Personal'//single field for validation

  show_email = false;
  show_work = false;

  // contact_type = [
  //   {name:'Home'},{name:'Mobile'},{name:'Office'},{name:'Fax'}
  // ]
  contact_type = [
    { name: 'Mobile' },
    { name: 'Office' },
    { name: 'Fax' },
    { name: 'Other' },
  ];
  email_type = [{ name: 'Personal' }, { name: 'Work' }];

  // new type list
  contact_type_list = [
    { name: 'Mobile', value: '' },
    { name: 'Home', value: '' },
    { name: 'Work', value: '' },
    // { name: 'Fax', value: '' },
    { name: 'Email', value: '' },
    { name: 'Work Email', value: '' },
    { name: 'Other', value: '' },
  ];

  // new email list
  email_type_list = [
    { name: 'Personal', value: '' },
    { name: 'Work', value: '' },
  ];

  form_status = 'INVALID';
  isEdit = false;
  reference_data;
  flag;
  disable = false;
  constructor(
    public _commonService: CommonService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<EmergencyContactComponent>
  ) {
    console.log('---data---', this.data);

    if (Object.keys(this.data).length != 0) {
      console.log(this.data.displayData);
      console.log(this.data.multiPOA);
      if (this.data.emergency) {
        if (this.data.emergency.phone_numbers && this.data.emergency.phone_numbers.length == 0) {
          this.data.emergency.phone_numbers = this.emergency.phone_numbers;
        } else {
          this.data.emergency.phone_numbers = this.data.emergency.phone_numbers.map(
            (e) => ({ id: Math.random(), ...e })
          );
        }
        if (!this.data.emergency.emails.length) {
          this.data.emergency.emails = this.emergency.emails;
        } else {
          this.data.emergency.emails = this.data.emergency.emails.map((e) => ({
            id: Math.random(),
            ...e,
          }));
        }
        // this.reference_data=clone(this.data.emergency)
        this.reference_data = JSON.parse(JSON.stringify(this.data.emergency));
        this.emergency = this.data.emergency;
        if(this.data.emergency.emails && this.data.emergency.emails.length){
          this.data.emergency.emails.forEach(el => {
            if(el.name === 'Personal'){
              let obj = { id: el.id, name: 'Email', value: el.value};
              this.emergency.phone_numbers.push(obj);
            } else {
              this.emergency.phone_numbers.push(el);
            }
          })
        }

        if(this.emergency.phone_numbers && this.emergency.phone_numbers.length > 0){
          this.emergency.phone_numbers.unshift({ id: Math.random(), name: 'Mobile', value: '' });
        }
        this.isEdit = true;
        if (this.emergency.state) {
          this.changeState(this.emergency.state);
        }

        //  this.flag = this.data.emergencyData.filter(data => (data.type_of_contact === 'Power of Attorney'))
        //  console.log('yyyyyyyyyyyyyyyyyy',this.flag)
        // this.disable = (this.flag  && this.flag.length) ? true : false
        this.checkedValue1 = this.data.emergency.type_of_contact;
        this.checkedValue = this.data.emergency.type_of_contact;
        this.type_of_contact = [
          { label: 'Emergency Contact', value: 'Emergency Contact' },
          {
            label: 'Power of Attorney Financial',
            value: 'Power of Attorney Financial',
          },
        ];
        this.type_of_contact_secondary = [
          {
            label: 'Power of Attorney Medical',
            value: 'Power of Attorney Medical',
          },
        ];
      } else {
        this.emergency = this.Emergency();
        console.log('---new form value--', this.emergency);
        this.type_of_contact = [
          { label: 'Emergency Contact', value: 'Emergency Contact' },
          {
            label: 'Power of Attorney Financial',
            value: 'Power of Attorney Financial',
          },
        ];
        this.type_of_contact_secondary = [
          {
            label: 'Power of Attorney Medical',
            value: 'Power of Attorney Medical',
          },
        ];
        if (this.data.resident_id) {
          this.emergency['resident_id'] = this.data.resident_id;
        }
        // if(this.data.isPowerOfAttorney){
        //   this.type_of_contact = [{ label: 'Emergency Contact', value: 'Emergency Contact'},

        //  ];
        // }
      }
    }
    console.log('isEdit', this.isEdit, this.emergency);
    if (this.isEdit) {
      if (this.emergency.homephone) {
        this.show_home = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Home');
      }
      if (this.emergency.mobilephone) {
        this.show_mobile = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Mobile');
      }
      if (this.emergency.office_phone) {
        this.show_office = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Office');
      }
      if (this.emergency.fax_no) {
        this.show_fax = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Fax');
      }
      if (this.emergency.otherphone) {
        this.show_other = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Other');
      }
      if (this.emergency.email) {
        this.show_email = true;
        this.email_type = this.email_type.filter((e) => e.name != 'Personal');
      }
      if (this.emergency.work_email) {
        this.show_work = true;
        this.email_type = this.email_type.filter((e) => e.name != 'Work');
      }
    }
  }
  selected = -1;

  emergency: any = {
    isprimary: false,
    first_name: '',
    last_name: '',
    relation: '',
    email: '',
    work_email: '',
    confirmemail: '',
    homephone: '',
    mobilephone: '',
    office_phone: '',
    fax_no: '',
    otherphone: '',

    notes: '',
    ismultiPoa: false,

    addrees1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    can_recieve_care_info: false,
    billing_contact: false,
    emergency_contact: '',
    //type_of_contact:'',
    type_of_contact: [],
    phone_numbers: [{ id: Math.random(), name: 'Home', value: '' }],
    emails: [{ id: Math.random(), name: 'Personal', value: '' }],
  };

  public resident_relationship = [
    {
      name: 'Primary options',
      relations: [
        {
          label: 'Son',
          value: 'Son',
        },
        {
          label: 'Daughter',
          value: 'Daughter',
        },
        {
          label: 'Spouse',
          value: 'Spouse',
        },
        {
          label: 'Friend',
          value: 'Friend',
        },
        {
          label: 'Sister',
          value: 'Sister',
        },
        {
          label: 'Brother',
          value: 'Brother',
        },
      ],
    },
    {
      name: 'Less used family options',
      relations: [
        {
          label: 'Significant Other',
          value: 'Significant Other',
        },
        {
          label: 'Brother-in-Law',
          value: 'Brother-in-Law',
        },
        {
          label: 'Daughter-in-Law',
          value: 'Daughter-in-Law',
        },
        {
          label: 'Sister-in-Law',
          value: 'Sister-in-Law',
        },
        {
          label: 'Son-in-Law',
          value: 'Son-in-Law',
        },
        {
          label: 'Grandchild',
          value: 'Grandchild',
        },
        {
          label: 'Niece',
          value: 'Niece',
        },
        {
          label: 'Nephew',
          value: 'Nephew',
        },
        {
          label: 'Step-Son',
          value: 'Step-Son',
        },
        {
          label: 'Step-Daughter',
          value: 'Step-Daughter',
        },
        {
          label: 'Step-Child',
          value: ' Step-Child',
        },
      ],
    },
    {
      name: 'Types of contacts',
      relations: [
        {
          label: 'Guardian',
          value: 'Guardian',
        },
        {
          label: 'Case Worker',
          value: 'Case Worker',
        },
        {
          label: 'Conservator',
          value: 'Conservator',
        },
        {
          label: 'Trust Officer',
          value: 'Trust Officer',
        },
        {
          label: 'Other',
          value: 'Other',
        },
      ],
    },
  ];

  public type_of_contact = [
    { label: 'Emergency Contact', value: 'Emergency Contact' },
    {
      label: 'Power of Attorney Financial',
      value: 'Power of Attorney Financial',
    },
  ];
  public type_of_contact_secondary = [
    { label: 'Power of Attorney Medical', value: 'Power of Attorney Medical' },
  ];

  checkedValue: any = [];
  checkedValue1: any = [];

  // const dialogConfig = new MatDialogConfig();

  //   dialogConfig:any = new MatDialogConfig();
  //  dialogConfig.panelClass = 'contactpopup';

  dialogRefs: any;
  @ViewChild('contactStatus', {static: true}) contactStatus: TemplateRef<any>;
  @ViewChild('notes', {static: true}) notes: ElementRef<any>;
  ngOnInit() {
    // this.contact_type = this._commonService.contactTypeList
    // console.log('edit dataaaaa',this.data)
    // this.emergency = this.data.emergencyData.filter(data => (data._id === this.data.emergencyId));
    // setTimeout(() => {
    // this.notes.nativeElement.focus();
    // }, 2000);
    
    
    // this._dialogRef.afterClosed().subscribe(res => {
    //   console.log('closing -->>',res);
    //   if(!res){
    //     if(this.emergency.phone_numbers && this.emergency.phone_numbers.length){
    //       let phone_numbers = this.emergency.phone_numbers.filter(el => el.name === 'Mobile' || el.name === 'Home' || el.name === 'Work');
    //       let emails = this.emergency.phone_numbers.filter(el => el.name === 'Email' || el.name === 'Work Email' || el.name === 'Other');
    //       this.emergency.phone_numbers = phone_numbers;
    //       this.emergency.emails = emails;
    //     }
    //   }
    // })
  }

  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpharesi(key);
    return result;
  }
  // ngAfterContentChecked(): void {
  //   console.log('----content checked----')
  //   this.notes.nativeElement.focus();
  // }
  onNoClick(f): void {
    // this.show = 'Home';
    // console.log('cancel form status', f.form.status, f.form.value);
    // console.log({
    //   touched: f.form.touched,
    //   pristine: f.form.pristine,
    //   dirty: f.form.dirty,
    //   valid: f.form.valid,
    // });
    // // this._dialogRef.close(['result']['status'] = false)

    // if (this.isEdit == true) {
    //   if (f.form.touched && !f.form.valid) {
    //     this.toastr.error('Please enter valid emergency contact details.');
    //     return;
    //   } else {
    //     
    //     // for (var variableKey in this.emergency) {
    //     //   if (this.emergency.hasOwnProperty(variableKey)) {
    //     //     delete this.emergency[variableKey];
    //     //   }
    //     // }
    //     this.emergency = this.reference_data
    //     // Object.assign(this.emergency, this.reference_data);
    //     this._dialogRef.close();
    //   }
    // } else {
    //   console.log('---else block only---');
    if(this.emergency.phone_numbers && this.emergency.phone_numbers.length){
      let phone_numbers = this.emergency.phone_numbers.filter(el => el.name === 'Mobile' || el.name === 'Home' || el.name === 'Work');
      let emails = this.emergency.phone_numbers.filter(el => el.name === 'Email' || el.name === 'Work Email' || el.name === 'Other');
      this.emergency.phone_numbers = phone_numbers;
      this.emergency.emails = emails;
    }
    Object.assign(this.emergency, this.reference_data);
    this._dialogRef.close();
    // }
  }

  onSubmit(f, emergency) {
    this.show = 'Home';
    // console.log('---emergency data status---', f.form.status);
    console.log('---emergency data form---', f.form);
    console.log('---emergency data emergency---', emergency);
    if (this.isEdit == false) {
      emergency.emergency_contact = this.data.lengthOfExistingContact + 1;
    }
    // return
    if(emergency.phone_numbers && emergency.phone_numbers.length){
      let phone_numbers = emergency.phone_numbers.filter(el => el.name === 'Mobile' || el.name === 'Home' || el.name === 'Work');
      let emails = emergency.phone_numbers.filter(el => el.name === 'Email' || el.name === 'Work Email' || el.name === 'Other');
      emergency.phone_numbers = phone_numbers;
      emergency.emails = emails;
    }

    console.log('---new emergency obj----', emergency);
    if(emergency.phone_numbers && emergency.phone_numbers.length > 1 && emergency.phone_numbers[0].value === ""){
      emergency.phone_numbers.splice(0,1);
      f.form.status = 'VALID';
    }

    if(emergency.emails && emergency.emails.length > 1 && emergency.emails[0].value === ""){
      emergency.emails.splice(0,1);
      f.form.status = 'VALID';
    }

    let vaild = f.form.status;
    if (emergency.first_name === '' || emergency.last_name === '') {
      vaild = 'INVALID';
    }
    if (emergency.emergency_contact != '' && this.isSameOrderExist(emergency)) {
      vaild = 'INVALID';
      this.toastr.error('Contact order already exists');
      return;
    }

    if (vaild === 'VALID') {
      console.log(this.checkedValue);
      this.emergency['type_of_contact'] = this.checkedValue;

      // const mergeData = this.emergency['type_of_contact'].flat(1);
      // let duplicate = mergeData.includes('Power of Attorney');
      // if(this.data.multiPOA == true && duplicate == true)
      // {
      //   let dialogConfig = new MatDialogConfig();
      //   dialogConfig.panelClass = 'contactpopup';
      //   this.emergency.ismultiPoa=true;
      //   dialogConfig.data = {
      //         'emergency': this.emergency,
      //       };
      //   this.dialogRefs = this.dialog.open(this.contactStatus, dialogConfig);
      // }
      // else{

      // }
      this.emergency.ismultiPoa = false;
      if (this.emergency.phone_numbers && this.emergency.phone_numbers.length) {
        this.emergency.phone_numbers.forEach((e) => delete e.id);
      }
      if (this.emergency.emails && this.emergency.emails.length) {
        this.emergency.emails.forEach((e) => delete e.id);
      }
      // return
      // emergency.form_status = f.form.status
      const action = {
        type: 'POST',
        target: 'residents/add_emergency_contact',
      };
      const payload = this.emergency;
      this.apiService
        .apiFn(action, payload)
        .then((result: any) => {
          if (result['status'] === true) {
            this.toastr.success(result['message']);
            this._dialogRef.close(result['data']);
          } else {
            this.toastr.error(result['message']);
          }
        })
        .catch((error: any) => {
          this.toastr.error(error.message);
        });
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter contact details');
      }
    }
  }

  async addEmergencycontact(action, payload) {
    const result = await this.apiService.apiFn(action, payload);
    console.log('result status', result['status']);
  }

  isSameOrderExist(item) {
    console.log('checking order', this.data);

    if (this.data.Poa && this.data.Poa.length) {
      console.log('Poa array', this.data.Poa);

      if (
        this.data.Poa.filter(
          (e) => e.emergency_contact == item.emergency_contact
        ).length == 0
      ) {
        return false;
      } else {
        return true;
      }
    } else if (this.data.emergencyData && this.data.emergencyData.length) {
      console.log('Emergency Array', this.data.emergencyData);

      const uniqueLength = this.data.emergencyData.filter((e) => e.emergency_contact).length;

      const uniqueOrders = new Set(this.data.emergencyData.filter((e) => e.emergency_contact).map((e) => +e.emergency_contact));
      // console.log('uniqueLength--->', uniqueLength);
      // console.log('uniqueOrders--->', uniqueOrders);

      // console.log('this.data.emergencyData.length---->', this.data.emergencyData.length);
      if (uniqueOrders.size < uniqueLength) {
        console.log('duplicate exist emergency array');
        return true;
      } else {
        return false;
      }
    }
  }
  hasDupsSimple(array) {
    console.log('array for filter----', array);
    return array.some(function (value) {
      // .some will break as soon as duplicate found (no need to itterate over all array)
      return +array.indexOf(value) != +array.lastIndexOf(value); // comparing first and last indexes of the same value
    });
  }
  contactType(event, value) {
    console.log('event', event);
    const pos = this.checkedValue.indexOf(value);
    if (pos > -1) {
      this.checkedValue.splice(pos, 1);
    } else {
      this.checkedValue.push(value);
    }
    console.log(this.checkedValue);
    //this.checkedValue = value;
    //this.emergency.type_of_contact = value;
  }

  addEmergencyPhone(f) {
    this.emergency.phone_numbers.unshift({
      id: this.emergency.phone_numbers.length + Math.random(),
      name: 'Home',
      value: '',
    });
  }

  removeEmergencyField(index) {
    this.emergency.phone_numbers.splice(index, 1);
  }

  addEmergencyEmail(f) {
    this.emergency.emails.unshift({
      id: this.emergency.phone_numbers.length + Math.random(),
      name: 'Personal',
      value: '',
    });
  }

  removeEmergencyEmailField(index) {
    this.emergency.emails.splice(index, 1);
  }

  changePhoneType(event) {
    this.show = event.value;
  }

  changeEmailType(event) {
    this.show_email = event.value;
  }

  allowOnlyNumber(key) {
    return this._commonService.allwoNumWithOutZero(key);
  }

  ChangeConfirm(emergency) {
    console.log('--in confirm--');
    this._dialogRef.close(emergency);
    this.dialogRefs.close();
  }

  onCancel(): void {
    this.dialogRefs.close();
  }

  async changeState(state) {
    let stateid = this.statelist.filter((s) => s.name === state);

    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'organization/citieslist' };
    const payload = { state_Id: stateid[0].id };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result['data']['_cities'];
    this.Citielist.forEach((element) => {
      element['_id'] = element.id;
    });
    this._commonService.setLoader(false);
  }

  removeEmergencyPhone(item) {
    console.log('--item--', item);
    // homephone: '',
    // mobilephone: '',
    // office_phone:'',
    // fax_no:'',
    if (item == 'Home') {
      this.show_home = false;
      this.emergency.homephone = '';
      this.contact_type.push({ name: 'Home' });
    }
    if (item == 'Mobile') {
      this.show_mobile = false;
      this.emergency.mobilephone = '';
      this.contact_type.push({ name: 'Mobile' });
    }
    if (item == 'Office') {
      this.show_office = false;
      this.emergency.office_phone = '';
      this.contact_type.push({ name: 'Office' });
    }
    if (item == 'Fax') {
      this.show_fax = false;
      this.emergency.fax_no = '';
      this.contact_type.push({ name: 'Fax' });
    }
    if (item == 'Other') {
      this.show_other = false;
      this.emergency.otherphone = '';
      this.contact_type.push({ name: 'Other' });
    }
  }

  changeEmergencyPhoneType(event) {
    if (event == 'Home') {
      this.show_home = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Home');
    }
    if (event == 'Mobile') {
      this.show_mobile = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Mobile');
    }
    if (event == 'Office') {
      this.show_office = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Office');
    }
    if (event == 'Fax') {
      this.show_fax = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Fax');
    }
    if (event == 'Other') {
      this.show_other = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Other');
    }
  }

  changeEmergencyEmailType(event) {
    if (event == 'Personal') {
      this.show_email = true;
      this.email_type = this.email_type.filter((e) => e.name != 'Personal');
    }
    if (event == 'Work') {
      this.show_work = true;
      this.email_type = this.email_type.filter((e) => e.name != 'Work');
    }
  }

  removeEmergencyEmail(item) {
    // email: '',
    // work_email:'',
    if (item == 'Personal') {
      this.show_email = false;
      this.emergency.email = '';
      this.email_type.push({ name: 'Personal' });
    }
    if (item == 'Work') {
      this.show_work = false;
      this.emergency.work_email = '';
      this.email_type.push({ name: 'Work' });
    }
  }

  toggleTypeOfContact(event, item) {
    if (event) {
      if (!(this.checkedValue.indexOf(item.label) > -1)) {
        this.checkedValue.push(item.label);
      }
    } else {
      if (this.checkedValue.indexOf(item.label) > -1) {
        this.checkedValue.splice(this.checkedValue.indexOf(item.label), 1);
      }
    }
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

  Emergency() {
    let emergency: any = {
      isprimary: false,
      first_name: '',
      last_name: '',
      relation: '',
      email: '',
      work_email: '',
      confirmemail: '',
      homephone: '',
      mobilephone: '',
      office_phone: '',
      fax_no: '',
      otherphone: '',

      notes: '',
      ismultiPoa: false,

      addrees1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      can_recieve_care_info: false,
      billing_contact: false,
      emergency_contact: '',
      //type_of_contact:'',
      type_of_contact: [],
      phone_numbers: [{ name: 'Home', value: '' }],
      emails: [{ name: 'Personal', value: '' }],
    };
    return emergency;
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

// Relationship: List the following as primary options: Son, Daughter, Spouse, Friend, Sister, Brother, The following are less used family options: Significant Other, Brother-in-Law, Sister-in-Law, Grandchild, Niece, Nephew, Step-Son, Step-Daughter, Step-Child, The following are other types of contacts: Guardian, Case Worker, Conservator, Trust Officer, Other

// public resident_relationship = [

// { label: 'Spouse', value: 'Spouse' },
// { label: 'Child', value: 'Child' },
// { label: 'Relative', value: 'Relative' },
// { label: 'Significant Other', value: 'Significant Other' },
// { label: 'Friend', value: 'Friend' },
// { label: 'Other', value: 'Other' }];
