import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { AuthGuard } from './../../../shared/guard/auth.guard';
import { ToastrService } from 'ngx-toastr';
// import { Socket } from 'ngx-socket-io';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from "@angular/material/form-field";
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { MatTreeModule } from '@angular/material';

@Component({
  selector: 'app-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.scss']
})

export class TopnavComponent implements OnInit {
  public pushRightClass: string;
  data;
  token;
  orgdata; floorlist;
  organization; facility;
  organiz = []; fac = [];
  selectedfac: String;
  selectedorg: any;
  changeorg = false;
  @ViewChild('pharmacyPopup', { static: true }) pharmacyPopup: TemplateRef<any>;
  @ViewChild('physicianPopup', { static: true }) physicianPopup: TemplateRef<any>;
  @ViewChild('announcePopup', { static: true }) announcePopup: TemplateRef<any>;

  dialogConfig = new MatDialogConfig();
  dialogRefs: any;
  show = 'Phone'
  show_physician = "Mobile"

  //pharmacy phone
  phone_pharmacy = true
  fax_pharmacy = false
  other_pharmacy = false

  //physician phone
  mobile_physician = true
  home_physician = false
  office_physician = false
  fax_physician = false
  other_physician = false

  private subscription: Subscription = new Subscription();
  private facilitySub: Subscription;
  user_id;
  // contact_type=[
  //     {name:'Phone'},{name:'Fax'},{name:'Other'}
  // ]
  contact_type = [
    { name: 'Fax' }, { name: 'Other' }
  ]
  // contact_type_physician=[
  //   {name:'Mobile'},{name:'Home'},{name:'Office'},{name:'Fax'},{name:'Other'}
  // ]
  contact_type_physician = [
    { name: 'Home' }, { name: 'Office' }, { name: 'Fax' }, { name: 'Other' }
  ]
  medical_profession = [
    { name: 'Alternate Physician' }, { name: 'Attending Physician' }, { name: 'Nurse' }, { name: 'Nurse Practitioner' },
    { name: 'Medical Specialist' }, { name: 'Physician’s Assistant' }, { name: 'Dentist' }, { name: 'Optometrist' }, { name: 'Ophthalmologist' },
    { name: 'Cardiologist' }, { name: 'Hematologist' }, { name: 'Podiatrist' }, { name: 'Neurologist' }, { name: 'Nephrologist' }, { name: 'Psychologist' }, { name: 'Psychiatrist' }
  ]

  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;
  staSearch = '';
  citSearch = '';
  phoneSearch = ''
  professionSearch = ''
  hide = false;
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
    notes: ''
  };

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
    notes: ''
  };

  dataSource; orgfac;
  annouce_coun
  announce = []
  constructor(
    private _router: Router,
    private _apiService: ApiService,
    private toastr: ToastrService,
    public _commonService: CommonService,
    private dialog: MatDialog,
    public _authGuard: AuthGuard,
    // private _socket: Socket,
    private _socketService: SocketService,
    iconRegistry: MatIconRegistry, sanitizer: DomSanitizer
  ) {
    this._router.events.subscribe(val => {
      if (val instanceof NavigationEnd && window.innerWidth <= 992 && this.isToggled()) {
        this.toggleSidebar();
      }
    });

    //register icon from local svg file
    iconRegistry.addSvgIcon('annouce', sanitizer.bypassSecurityTrustResourceUrl("assets/images/announcement-white-icon.svg"));
  }

  async ngOnInit() {
    this.show = "Phone"
    this.pushRightClass = 'push-right';
    this.user_id = JSON.parse(JSON.stringify(await this._apiService.getauthData())).user_id
    await this.fetchData();
    await this.joinRoomFn('ANNOUNCE');
    await this.getAnnouce();
    // this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
    //     this._commonService.setLoader(true);
    //      if (contentVal.org && contentVal.fac) {
    //         this.org = contentVal.org;
    //         this.fac = contentVal.fac;
    //      }
    //       this._commonService.setLoader(false);
    //       this.unassignenfcs();
    //    });


    this.subscription.add(this._socketService.getAnnouncementFn().subscribe(async (_response) => {
      if (_response) {
        await this.getAnnouce()
      }
    }));

    this.facilitySub = this._commonService.facilitycontent.subscribe(res => {
      if (res != null) {
        //let facIndex = this.fac.findIndex(fac => fac.value === res.facility.value);
        if (res.org == this.selectedorg) {
          // if(facIndex === -1){
          //   this.fac.push(res.facility);
          // } else {
          //   this.fac[facIndex].label = res.facility.label
          // }
          this.getFac(res.org);
        }
      }
    });
  }

  async fetchData() {
    this._commonService.setLoader(true);
    await this._apiService.apiFn({ type: 'GET', target: 'users/get_org' }, {})
      .then(async (result: any) => {
        this.orgdata = result;
        this.organiz = await result.data.map((obj) => {
          return {
            'label': obj._id.org.org_name,
            'value': obj._id.org._id
          }
        });
        if (this.organiz.length === 1) {
          this.organization = this.organiz[0].label;
          this.selectedorg = this.organiz[0].value;
          await this.getFac(this.selectedorg);
        } else {
          await this._apiService.apiFn({ type: 'GET', target: 'users/selected_org_fac' }, {})
            .then(async (resultData: any) => {
              if (resultData.data.length) {
                this.selectedorg = resultData.data[0].org ? resultData.data[0].org : null;

                await this._apiService.apiFn({ type: 'GET', target: 'users/get_user_fac' }, { org: this.selectedorg })
                  .then(async (responseData: any) => {
                    this.fac = await responseData.data.map((obj) => {
                      return {
                        'label': obj._id.fac.fac_name,
                        'value': obj._id.fac._id
                      }
                    });
                    this.fac.sort((a, b) => a.label.localeCompare(b.label));
                    this.fac.sort((a, b) => a.label.localeCompare(b.label));
                    this.selectedfac = resultData.data[0].fac ? resultData.data[0].fac : null;
                    await this.changeSelection(this.selectedorg, this.selectedfac);
                  })
                  .catch((responseDataError) => {
                    this._commonService.setLoader(false);
                    this.toastr.error('Something went wrong, Please try again.')
                  });
              } else {
                this.selectedorg = resultData.data.facility[0].org;
                await this._apiService.apiFn({ type: 'GET', target: 'users/get_user_fac' }, { org: this.selectedorg })
                  .then(async (responseData: any) => {
                    this.fac = await responseData.data.map((obj) => {
                      return {
                        'label': obj._id.fac.fac_name,
                        'value': obj._id.fac._id
                      }
                    });
                    this.fac.sort((a, b) => a.label.localeCompare(b.label));
                    this.selectedfac = resultData.data.facility[0].fac;
                    await this.changeSelection(this.selectedorg, this.selectedfac);
                  })
                  .catch((responseDataError) => {
                    this._commonService.setLoader(false);
                    this.toastr.error('Something went wrong, Please try again.')
                  });
              }
            })
            .catch((resultDataError) => {
              this._commonService.setLoader(false);
              this.toastr.error('Something went wrong, Please try again.')
            });
        }
        this._commonService.setLoader(false);
      })
      .catch((resultError) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });
  }

  async getFac(org) {
    const payload = { org: org };
    const action1 = { type: 'GET', target: 'users/get_user_fac' };
    const result1 = await this._apiService.apiFn(action1, payload);
    this.fac = await result1['data'].map(function (obj) {
      const fObj = {};
      fObj['label'] = obj._id.fac.fac_name;
      fObj['value'] = obj._id.fac._id;
      return fObj;
    });
    this.fac.sort((a, b) => a.label.localeCompare(b.label));
    if (!this.changeorg) {
      if (this.fac.length === 1) {
        this.facility = this.fac[0].label;
        this.selectedfac = this.fac[0].value;
        await this.changeSelection(this.selectedorg, this.selectedfac);
      }
      if (this.organiz.length === 1 && this.fac.length !== 1) {
        let facId, orgId;
        await this.orgdata['data'].map(function (obj) {
          obj.facility.forEach(element => {
            if (element.selected === true) {
              facId = element.fac;
            }
          });
        });
        if (facId) {
          this.selectedfac = facId;
          await this.changeSelection(this.selectedorg, this.selectedfac);
        }
      }
    }
  }

  async selectOrganization(org) {
    this.changeorg = true;
    this.selectedfac = '';
    this.getFac(org);
  }

  isToggled(): boolean {
    const dom: Element = document.querySelector('body');
    return dom.classList.contains(this.pushRightClass);
  }

  toggleSidebar() {
    this._commonService.sidebarPanelContent.next(false);
    const dom: any = document.querySelector('body');
    dom.classList.toggle(this.pushRightClass);
  }

  async onLoggedout() {
    this._authGuard.destroyToken('User has been logged out successfully.', this.selectedfac);
  }

  onClickBuildVersion(): void {
    this._router.navigate(['./settings/build_restriction']);
  }

  // Change facility
  async changeSelection(org, fac) {
    localStorage.removeItem('assigned_to');

    await this._apiService.apiFn(
      { type: 'POST', target: 'users/set_selected_fac' },
      { org: org, fac: fac }
    )
      .then(async (result: any) => {
        // this._socket.disconnect();
        // this._socket.connect();
        this.floorlist = result.data.map(function (obj) {
          const rObj = {};
          rObj['label'] = obj.floor;
          rObj['value'] = obj._id;
          rObj['sector'] = obj.sector;
          return rObj;
        });
        let facilityData = [];
        if (result.facilityData) {
          facilityData = result.facilityData
        }
        this._commonService.setOrgFac({ org: org, fac: fac }, this.floorlist, facilityData);
        this._commonService.setFloor(this.floorlist);
        await this.getAnnouce()
      });
  }
  //Pharmacy popup
  onPharmaClick() {
    this.show = 'Phone'
    // console.log('pharma clicked')
    this.dialogConfig.width = '700px';
    this.dialogRefs = this.dialog.open(this.pharmacyPopup, this.dialogConfig);
  }

  cancelPharmacy(f) {
    // console.log('--cancel--', f)
    this.dialogRefs.close()
    f.form.reset()
    this.fax_pharmacy = false
    this.other_pharmacy = false
    this.contact_type = [
      { name: 'Fax' }, { name: 'Other' }
    ]
  }

  async addPharmacy(f, pharmacy) {
    this._commonService.setLoader(true)
    // console.log('----form----', f, pharmacy)

    let form_status = f.form.status

    if (form_status == 'VALID') {

      const action = {
        type: 'POST',
        target: 'residents/add_pharmacy'
      };

      pharmacy.fac_id = this.selectedfac
      const payload = pharmacy;

      // console.log('---payload---', payload, f.form.value)

      const result = await this._apiService.apiFn(action, { data: payload });

      // console.log('---result----', result)

      if (result) {
        this.toastr.success('Pharmacy added successfully')
      } else {
        this.toastr.error('Something went wrong, Please try again.')
      }
      this.dialogRefs.close()
      f.form.reset()
      this.contact_type = [
        { name: 'Fax' }, { name: 'Other' }
      ]
      this.fax_pharmacy = false
      this.other_pharmacy = false
    } else if (form_status == 'INVALID') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid pharmacy details');
      }
    }

    this._commonService.setLoader(false)
  }

  //Phusician popup
  onPhysicianClick() {
    this.show_physician = "Mobile"
    // console.log('pharma clicked')
    this.dialogConfig.width = '700px';
    this.dialogConfig.maxHeight = '810px'
    this.dialogConfig.panelClass = 'physician_dialog'
    this.dialogRefs = this.dialog.open(this.physicianPopup, this.dialogConfig);
  }

  cancelPhysician(f) {
    // console.log('--cancel--', f)
    this.dialogRefs.close()
    f.form.reset()
    this.home_physician = false
    this.office_physician = false
    this.fax_physician = false
    this.other_physician = false
    this.contact_type_physician = [
      { name: 'Home' }, { name: 'Office' }, { name: 'Fax' }, { name: 'Other' }
    ]
  }

  async addPhysician(f, physician) {
    this._commonService.setLoader(true)
    // console.log('----form----', f, physician)

    let form_status = f.form.status

    if (form_status == 'VALID') {

      const action = {
        type: 'POST',
        target: 'residents/add_prescriber'
      };

      physician.fac_id = this.selectedfac
      const payload = physician;

      // console.log('---payload---', payload, f.form.value)

      const result = await this._apiService.apiFn(action, { data: payload });

      // console.log('---result----', result)

      if (result) {
        this.toastr.success('Physician added successfully')
      } else {
        this.toastr.error('Something went wrong, Please try again.')
      }
      this.dialogRefs.close()
      f.form.reset()
      this.contact_type_physician = [
        { name: 'Home' }, { name: 'Office' }, { name: 'Fax' }, { name: 'Other' }
      ]
      this.home_physician = false
      this.office_physician = false
      this.fax_physician = false
      this.other_physician = false
    } else if (form_status == 'INVALID') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid physician details');
      }
    }

    this._commonService.setLoader(false)
  }


  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  async changeState(state) {

    let stateid = this.statelist.filter(s => s.name === state)

    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'organization/citieslist' };
    const payload = { state_Id: stateid[0].id };
    const result = await this._apiService.apiFn(action, payload);
    this.Citielist = result['data']['_cities'];
    this.Citielist.forEach(element => {
      element["_id"] = element.id;
    });
    this._commonService.setLoader(false);
  }

  select(state, city, flag) {
    if (flag === 0) {
      if (!state || state === undefined) {
        this.selectCitie = city.source.selected.viewValue;
      } else if (!city || city === undefined) {
        this.selectState = state.source.selected.viewValue;
      }
    }
    else {
      if (!state || state === undefined) {
        this.selectCitie = city;
      } else if (!city || city === undefined) {
        this.selectState = state;
      }
    }
  }

  changePhoneType(event) {
    this.show = event.value
  }
  changePhoneTypeForPhysician(event) {
    this.show_physician = event.value
  }

  changePharmacyPhone(event) {

    if (event == 'Phone') {
      this.phone_pharmacy = true
      this.contact_type = this.contact_type.filter(e => e.name != 'Phone')
    }
    if (event == 'Fax') {
      this.fax_pharmacy = true
      this.contact_type = this.contact_type.filter(e => e.name != 'Fax')
    }
    if (event == 'Other') {
      this.other_pharmacy = true
      this.contact_type = this.contact_type.filter(e => e.name != 'Other')
    }
  }

  removePharmacyPhone(item) {
    // phone:'',
    // fax:'',
    // other:'',
    if (item == 'Phone') {
      this.phone_pharmacy = false
      this.pharmacy.phone = ''
      this.contact_type.push({ name: "Phone" })
    }

    if (item == 'Fax') {
      this.fax_pharmacy = false
      this.pharmacy.fax = ''
      this.contact_type.push({ name: "Fax" })
    }

    if (item == 'Other') {
      this.other_pharmacy = false
      this.pharmacy.other = ''
      this.contact_type.push({ name: "Other" })
    }
  }

  changePhysicianPhone(event) {
    // {name:'Mobile'},{name:'Home'},{name:'Office'},{name:'Fax'},{name:'Other'}

    // console.log(event)

    // console.log(event)
    if (event == 'Mobile') {
      this.mobile_physician = true
      this.contact_type_physician = this.contact_type_physician.filter(e => e.name != 'Mobile')

    }
    if (event == 'Home') {
      this.home_physician = true
      this.contact_type_physician = this.contact_type_physician.filter(e => e.name != 'Home')
    }
    if (event == 'Office') {
      this.office_physician = true
      this.contact_type_physician = this.contact_type_physician.filter(e => e.name != 'Office')
    }
    if (event == 'Fax') {
      this.fax_physician = true
      this.contact_type_physician = this.contact_type_physician.filter(e => e.name != 'Fax')
    }
    if (event == 'Other') {
      this.other_physician = true
      this.contact_type_physician = this.contact_type_physician.filter(e => e.name != 'Other')
    }
  }

  removePhysicianPhone(item) {
    // mobile:'',
    // home:'',
    // office:'',
    // fax:'',
    // other:'',

    if (item == 'Mobile') {
      this.mobile_physician = false
      this.physician.mobile = ''
      this.contact_type_physician.push({ name: 'Mobile' })
    }

    if (item == 'Home') {
      this.home_physician = false
      this.physician.home = ''
      this.contact_type_physician.push({ name: 'Home' })
    }
    if (item == 'Office') {
      this.office_physician = false
      this.physician.office = ''
      this.contact_type_physician.push({ name: 'Office' })
    }
    if (item == 'Fax') {
      this.fax_physician = false
      this.physician.fax = ''
      this.contact_type_physician.push({ name: 'Fax' })
    }
    if (item == 'Other') {
      this.other_physician = false
      this.physician.other = ''
      this.contact_type_physician.push({ name: 'Other' })
    }
  }


  async getAnnouce() {
    const payload = {};
    payload['organization'] = this.selectedorg;
    payload['facility'] = this.selectedfac;
    payload['isAnouncementWindow'] = true;
    const action = { type: 'POST', target: 'announcement/get' };
    const result = await this._apiService.apiFn(action, payload);

    if (result['data'] && result['data'].length) {
      this.announce = result['data'].filter(e => e.theme != 'Red');
      // this.annouce_coun = this.announce.length 
    } else {
      // this.annouce_coun = 0 
    }

    await this.setUserReadAnnouce()
  }

  hideAnnouncemnt(index) {
    // this.announce.splice(index, 1);
    // this.annouce_coun = this.announce.length
  }

  async openAnnoucementPopup() {
    this._commonService.setLoader(true);
    await this.getAnnouce()
    this.dialogConfig.width = '700px';
    this.dialogConfig.panelClass = "annoucement_popup";
    this._commonService.setLoader(false);
    this.dialogRefs = this.dialog.open(this.announcePopup, this.dialogConfig);
    

  }

  async closePopup() {
    // const {user_id} = JSON.parse(JSON.stringify(await this._apiService.getauthData()))
    let announcement_id = this.announce.map(e => e._id)

    const payload = {
      user_id: this.user_id, announcement_id
    }
    // console.log('---payload---', payload)
    const action = { type: 'POST', target: 'users/update_read' };
    const result = await this._apiService.apiFn(action, payload);
    this.dialogRefs.close()
  }

  async setUserReadAnnouce() {
    const payload = {
      user_id: this.user_id
    }
    const action = { type: 'GET', target: 'users/get_read' };
    const result = await this._apiService.apiFn(action, payload);

    if (result && result['data']) {
      // console.log('---result data----',result['data'])
      let newAnnouce = result['data']['read']
      // console.log('---anouce--',this.announce)
      let new_annouce = this.announce.filter(val => newAnnouce.findIndex(e => String(e) == String(val._id)) == -1)


      this.annouce_coun = new_annouce.length
      // console.log('----new---', new_annouce)

    }


  }

  dashboardIconClick() {
    this._router.navigate(['/dashboard'])
  }

  async joinRoomFn(roomName, isLeaveRoom = false) {
    let room = `${this.selectedfac}-${roomName}`;
    this._socketService.connectFn(room).subscribe(async (res: any) => {
      if (res.connected) {
        // console.log('join announce');
      }
    });
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

