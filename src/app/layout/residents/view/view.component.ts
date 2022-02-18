import { Component, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Subscription } from 'rxjs';
import { MatOption } from '@angular/material';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy  {
  floorFinalList;
  checked: Boolean = true;
  paramId: Boolean = false;
  emailNotMatch: Boolean = false;
  disable_checkin: Boolean = false;
  @ViewChild('callConfirmDialog', {static: true}) callConfirmDialog: TemplateRef<any>;
  @ViewChild('confirmStatus', {static: true}) confirmStatus: TemplateRef<any>;
  dialogConfig = new MatDialogConfig();
  dialogRefs: any;
  isolation_end_date: any = '';
  diseaseData: any = [];
  pre_diseases: any = [];
  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private socketService: SocketService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService,
  ) { }
  residentForm: FormGroup;
  organiz; faclist; floorlist; zonelist; seclist;
  statusData; carelevelData;
  alllevels = false;
  resident: any = {
    first_name: '',
    last_name: '',
    organization: '',
    facility: '',
    floor: '',
    sector: '',
    resident_status: '',
    care_level: '',
    secondary_care_level: [],
    billingId: '',
    email: '',
    confirmemail: '',
    home_phone: '',
    mobile_phone: '',
    is_out_of_fac: false,
    hospice: false,
    two_am_checkin: false,
    pre_diseases: []

  };
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

  public resident_relationship = [{ label: 'Spouse', value: 'Spouse' },
  { label: 'Child', value: 'Child' },
  { label: 'Relative', value: 'Relative' },
  { label: 'Significant Other', value: 'Significant Other' },
  { label: 'Friend', value: 'Friend' }];

  public testing_status_array = [
  { label: 'None', value: '' },
  { label: 'In-Progress', value: 'In-Progress' },
  { label: 'Positive', value: 'Positive' },
  { label: 'Negative', value: 'Negative' }];
  oldFacility: string;
  oldStatus: string;
  disable_secondary: true;

  subscription: Subscription = new Subscription();
  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;

  async ngOnInit() {
    this.loadCarelevel();
    this.loadDiseases();

    this.statusData = this._constantsService.residentStatus();

    if (!this.route.params['_value']['id']) {
      // get organization list:
      const action = { type: 'GET', target: 'organization/orglist' };
      const payload = {};
      const result = await this.apiService.apiFn(action, payload);
      this.organiz = await result['data']; // .map(function (obj) {
    }

    if (this.route.params['_value']['id']) {
      this._commonService.setLoader(true);
      this.paramId = true;
      const action = { type: 'POST', target: 'residents/view' };
      const payload = { residentId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
      const result = await this.apiService.apiFn(action, payload);
      this.resident = result['data'];
      this.resident.dob= new Date(result['data']['dob']);
      this.resident.admit_date = new Date(result['data']['admit_date']);
      if (!this.resident.hasOwnProperty('pre_diseases') && this.resident.pre_diseases.length === 0) {

        this.pre_diseases = [];
      } else {
        this.resident.pre_diseases.forEach(element => {
          console.log("element",element)
          this.pre_diseases.push(element);
          console.log("pre diseseses",this.pre_diseases)
        });
      }

      this.isolation_end_date = result['isolation_end_date'];

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

      this.resident['is_out_of_fac'] = final_data['is_out_of_fac'];
      this.resident['hospice'] = final_data['hospice'];
      this.resident['two_am_checkin'] = final_data['two_am_checkin'];
      this.resident['confirmemail'] = final_data['email'];

      // tslint:disable-next-line: max-line-length
      if (final_data['care_level']['name'] === 'Level 1' || final_data['resident_status'] === 'Deceased' || final_data['resident_status'] === 'Moved' || final_data['resident_status'] === 'Transferred') {
        this.disable_checkin = true;
      }
      this.resident['care_level'] = final_data['care_level']['_id'];
      this.resident['organization'] = final_data['facility'][0]['org']['_id'];
      this.changeOrg(this.resident['organization'], 0);
      this.resident['facility'] = final_data['facility'][0]['fac']['_id'];
      this.oldFacility = final_data['facility'][0]['fac']['_id'];
      this.oldStatus = final_data['resident_status'];
      this._commonService.setLoader(false);
    } else {
      this.changeStatus('Active', 0);
    }

    // get organization list:
    const action = { type: 'GET', target: 'organization/orglist' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = await result['data']; // .map(function (obj) {

    this.subscription.add(this.socketService.onResidentOutOfFacilityFn().subscribe(async (_response: any) => {
      if (_response) {
        if (this.resident._id !== undefined && this.resident._id === _response._id) {
          this.resident['is_out_of_fac'] = _response.is_out_of_fac;
        }
      }
    }));

    this.subscription.add(this.socketService.onResidentIsIsolationFn().subscribe(async (_response: any) => {
      if (_response) {
        // console.log("socket data>>",_response,this.resident._id)

        if (_response._ids.indexOf(this.resident._id) > -1) {
          // tslint:disable-next-line: max-line-length
          const EndTime = (this.isolation_end_date === '') ? _response.end_time_isolation : ((_response.end_time_isolation > this.isolation_end_date) ? _response.end_time_isolation : this.isolation_end_date);
          this.isolation_end_date = '';
          setTimeout(() => {
            this.isolation_end_date = EndTime;
          }, 0);
        }

      }
    }));

    this.subscription.add(this.socketService.onResidentStopIsolationFn().subscribe(async (_response: any) => {
      if (_response) {
                
        if (_response.resident_id==this.resident._id) {
          this.isolation_end_date = '';
         
        }

      }
    }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

  async changeOrg(org, flag) {
    this.resident.facility = '';
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { 'org_id': org };
    const result = await this.apiService.apiFn(action, payload);
    this.faclist = await result['data']; // .map(function (obj) {
    if (flag) {
      this.floorlist = null;

    }
  }

  async changeFac(fac, flag) {
    const action = { type: 'GET', target: 'floorsector/floorsector_list' };
    const payload = { 'facId': fac };
    const result = await this.apiService.apiFn(action, payload);
    this.floorlist = result['data'];
    this.floorFinalList = [...result['data']];
    if (flag) {
    }
  }


  async changeStatus(status, flag) {
    this.resident['resident_status'] = status;
    if (this.resident['resident_status'] !== 'Active') {
      // this.zonelist = [];
    } else {
      // this.changeSector(this.resident['sector'], flag)
    }
  }

  async changeCareLevel(carelevel, status, flag) {

    if (carelevel.label === 'Level 1' || status === 'Deceased' || status === 'Moved' || status === 'Transferred') {
      this.disable_checkin = true;
      this.resident.two_am_checkin = false;
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

  selectAllLevels() {
    if (this.allSelected.selected) {
      this.alllevels = true;
      var arr = [];
      for (let i = 0; i < this.carelevelData.length; i++) {
        arr.push(this.carelevelData[i]._id)
      }
      arr.push(0)
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

  async onSubmit(f, resident) {
    if (this.route.params['_value']['id']) {
      this.emergency['resident_id'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    }
    this.resident.emergency = this.emergency;
    let vaild = f.form.status;
    resident.pre_diseases = this.pre_diseases;
    resident.first_name = resident.first_name.trim();
    resident.last_name = resident.last_name.trim();

    if (resident.first_name === '' || resident.last_name === '') {
      vaild = 'INVALID';
    }
    if (vaild === 'VALID') {
      if (this.resident.email === this.resident.confirmemail) {
        this.emailNotMatch = false;
        f.form.controls['confirmemail'].setErrors(null);
      } else {
        this.emailNotMatch = true;
        f.form.controls['confirmemail'].setErrors({ 'incorrect': true });
      }
      if (!this.emailNotMatch) {
        this._commonService.setLoader(true);

        if (this.route.params['_value']['id'] && this.oldFacility !== this.resident.facility) {

          this.dialogConfig.maxWidth = '500px';

          const action = { type: 'POST', target: 'residents/add' };
          const payload = resident;
          this.dialogConfig.data = {
            'action': action,
            'payload': payload
          };

          // this.dialog.open(RepeatCareComponent, dialogConfig);
          this.dialogRefs = this.dialog.open(this.callConfirmDialog, this.dialogConfig);
          this._commonService.setLoader(false);


        } else {
          if (this.route.params['_value']['id'] && this.oldStatus !== this.resident.resident_status &&
           (this.resident.resident_status === 'Deceased' || this.resident.resident_status === 'Transferred' ||
            this.resident.resident_status === 'Moved')) {
            this.dialogConfig.maxWidth = '500px';

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
        }


      }

    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter resident details');
      }
    }
  }

  async add_residents(action, payload) {
    const result = await this.apiService.apiFn(action, payload);
    this._commonService.setLoader(false);
    // tslint:disable-next-line: max-line-length
    this.route.params['_value']['id'] ? this.toastr.success('Resident updated successfully') : this.toastr.success('Resident added successfully');
    this.router.navigate(['/residents']);
  }

  async facilityChangeConfirm(action, payload) {
    const action1 = { type: 'POST', target: 'zones/unassigned_resident' };
    const payload1 = { resident: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
    const result1 = await this.apiService.apiFn(action1, payload1);
    this.dialogRefs.close(['result']['status'] = false);
    payload['room'] = null;
    this.add_residents(action, payload);
  }

  onChangefacility(event) {
    this.resident.out_of_Fac = event.checked;
  }

  onChangeHospice(event) {
    this.resident.hospice = event.checked;
  }

  onChangeCheckin(event) {
    this.resident.two_am_checkin = event.checked;
  }

  cancel() {
    this.router.navigate(['/residents']);
  }

  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  checkAlphalast(key) {
    const result = this._commonService.allwoOnlyAlpha(key);
    return result;
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
    const action = { type: 'GET', target: 'residents/carelevellist' };
    const payload = { date: new Date() };
    const result = await this.apiService.apiFn(action, payload);
    this.carelevelData = result['data'];
  }

  async loadDiseases() {
    const action = { type: 'GET', target: 'diseases/list' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.diseaseData = result['data'];
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
    const residentlist = [];
    residentlist.push(this.resident._id);
    const action = { type: 'POST', target: 'residents/resident_testing' };
    const payload = { 'residentList': residentlist, value: event.value };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message']);
    } else {
      this.toastr.error(result['message']);
    }
  }

  timerCompleted(event){

  }

  openDialog(){
    
  }
}


