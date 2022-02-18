import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  MatTableDataSource,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
} from '@angular/material';
import { Subscription, Observable, Subject } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { letProto } from 'rxjs-compat/operator/let';

export interface PeriodicElement {
  org_name: string;
  org_id: string;
  fac_name: string;
  fac_id: string;
  fac_address1: string;
  fac_address2: string;
  fac_city: string;
  fac_state: string;
  fac_zip1: string;
  fac_zip2: string;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  @ViewChild('addFacility', { static: true }) addFacility: TemplateRef<any>;
  dialogRefs = null;
  public isDashboard: boolean;
  emailNotMatch: Boolean = false;
  // corrCheckEmail = false;
  workingEmailNotMatch: Boolean = false;
  // corrCheckWorkEmail = false;
  subscription: Subscription;
  access: any;
  private subject = new Subject<any>();
  modules: any = [];
  userAcsData = [];
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public _commonService: CommonService
  ) {}
  // userForm: FormGroup;
  organiz;
  faclist;
  positionsz;
  job_type;
  org;
  fac;
  duplicateFacility;
  shiftArr;
  sendcount: Number = 0;
  public facList = [];
  public facList2 = [];
  public facListDone = [];
  floorsector;
  multifacility: any;
  fac_address1: any;
  fac_address2: any;
  fac_city: any;
  fac_state: any;
  fac_zip1: any;
  fac_zip2: any;
  multiorg: any;
  userFacilityList: PeriodicElement[];
  displayedColumns = ['org', 'fac', 'action'];
  dataSource;
  places: Array<any> = [];
  showfaclist: boolean;
  ismultifac: Boolean = false;
  paramId: Boolean;
  checkexist: Boolean = true;
  userTypeList;
  posSearch = '';
  rolSearch = '';
  moduleSearch = '';
  orgSearch = '';
  facSearch = '';
  accessData = [];
  moduleData = [];
  app_notification: any = [];
  showNew = true;
  app_access;
  enable_livedashboard;
  email_notification_access;
  email_access;
  user: any = {
    first_name: '',
    last_name: '',
    job_title: '',
    other_job_title: '',
    role_id: '',
    email: '',
    confirmEmail: '',
    work_email: '',
    confirmWork_email: '',
    home_phone: '',
    mobile_phone: '',
    employeeId: '',
    shiftNo: '',
    organization: '',
    security_phrase: '',
    facility: [],
    enable_livedashboard: false,
    text_permission: false,
    email_access: false,
    app_notification: [
      {
        care_notification_access: false,
        care_notify_access: false,
        emergency_notification_access: false,
        schedule_notification_access: false,
      },
    ],
    app_access: false,
    email_notification_access: false,
    ipad_access: false,
    isAgencyType: false,
    isCasualPartTime: false,
  };
  privilege = 'add';

  async ngOnInit() {
    this.dataSource = new MatTableDataSource(this.userFacilityList);
    if (!this._commonService.checkPrivilegeModule('users', 'view')) {
      this.router.navigate(['/']);
    }
    this._commonService.setLoader(true);
    this.shiftArr = this._commonService.shiftTime();
    this.showfaclist = false;
    await this.apiService
      .apiFn({ type: 'GET', target: 'users/positions' }, { type: 'user' })
      .then(
        (resultPosition: any) =>
          (this.positionsz = resultPosition['data']['_positions'])
      )
      .catch((resultPositionError) =>
        this.toastr.error(resultPositionError['message'])
      );
    this.userType();
    this.getModules();
    if (this.route.params['_value']['id']) {
      let decrpytedParams = this._aes256Service.decFnWithsalt(
        this.route.params['_value']['id']
      );

      if (decrpytedParams.id) {
        decrpytedParams = decrpytedParams.id;
        this.isDashboard = true;
      } else {
        this.isDashboard = false;
      }

      this._commonService.setLoader(true);
      this.paramId = true;
      this.privilege = 'edit';
      const action = { type: 'POST', target: 'users/view' };
      const payload = { userId: decrpytedParams };
      const result = await this.apiService.apiFn(action, payload);

      this.getUserAccess(decrpytedParams);
      this.user = result['data'];
      this.user.app_notification.length === 0
        ? (this.user.app_notification = [
            {
              care_notification_access: false,
              care_notify_access: false,
              emergency_notification_access: false,
              schedule_notification_access: false,
            },
          ])
        : this.user.app_notification[0];
      // console.log('this.user----->', this.user);
      delete this.user.security_phrase;
      // this.user['role_id'] = result['data']['role_id']['_id'];
      if (result['data']['facility'].length > 0) {
        this.user.organization = result['data']['facility'][0]['org']['_id'];
        this.multiorg = result['data']['facility'][0]['org']
          ? result['data']['facility'][0]['org']['org_name']
          : '';
        this.changeOrg(this.user.organization);
        this.ismultifac = true;
        this.showfaclist = true;
        // this.user.fac = result['data']['facility'][0]['fac']['_id'];
        this.multifacility = result['data']['facility'][0]['fac']['fac_name'];
      } else {
        this.ismultifac = false;
        this.showfaclist = false;
      }
      // multi facility table show
      this.userFacilityList = result['data']['facility'].map((item) => ({
        org_id: item.org._id,
        org_name: item.org.org_name,
        fac_id: item.fac._id,
        fac_name: item.fac.fac_name,
        selected: item.selected,
        fac_address1: item.fac.fac_address1 ? item.fac.fac_address1 : '',
        fac_address2: item.fac.fac_address2 ? item.fac.fac_address2 : '',
        fac_city: item.fac.fac_city ? item.fac.fac_city : '',
        fac_state: item.fac.fac_state ? item.fac.fac_state : '',
        fac_zip1: item.fac.fac_zip1 ? item.fac.fac_zip1 : '',
        fac_zip2: item.fac.fac_zip2 ? item.fac.fac_zip2 : '',
      }));
      this.facListDone = this.userFacilityList;
      this.dataSource = new MatTableDataSource(this.userFacilityList);
      // this.user.shiftNo
      this.user.confirmEmail = result['data']['email'];
      this.user.confirmWork_email = result['data']['work_email'];
      this.job_type = this.user.job_title
        ? this.user.job_title.position_name.toLowerCase()
        : '';
      this.user.job_title = this.user.job_title ? this.user.job_title._id : '';
    }
    // get organization list:
    await this.apiService
      .apiFn({ type: 'GET', target: 'organization/orglist' }, {})
      .then((result: any) => (this.organiz = result['data']))
      .catch((error) => this.toastr.error(error['message']));
    // this.getRoleaccessDetails('',this.user.job_title);
    this._commonService.setLoader(false);
  }

  async changeOrg(org) {
    this.org = org;
    await this.apiService
      .apiFn({ type: 'GET', target: 'facility/faclist' }, { org_id: org })
      .then((result: any) => (this.faclist = result['data']))
      .catch((error) => this.toastr.error(error['message']));
    if (this.userFacilityList && this.userFacilityList.length) {
      this.removeAddedFac();
    }
    this.user.fac = '';
  }

  async getRoleaccessDetails(roleId, positionId) {
    /*  */
    await this.apiService
      .apiFn(
        { type: 'POST', target: 'users/get_role_access' },
        { position_id: positionId }
      )
      .then((result: any) => (this.accessData = result['data']))
      .catch((error) => this.toastr.error(error['message']));
  }

  async changeFac(fac, e) {
    this.fac = fac;
  }
  async changeAccesslevel(postion) {
    this.user.role_id = postion;
  }
  async changePosition(e) {
    const target = e.source.selected._element.nativeElement;
    this.job_type = target.innerText.trim().toLowerCase();
    // this.userAcsData = [];
  }

  select(org, fac, flag) {
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
    } else {
      if (!org || org === undefined) {
        this.multifacility = fac;
        this.fac_address1 = fac.fac_address1;
        this.fac_address2 = fac.fac_address2;
        this.fac_city = fac.fac_city;
        this.fac_state = fac.fac_state;
        this.fac_zip1 = fac.fac_zip1;
        this.fac_zip2 = fac.fac_zip2;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  cancel() {
    this.isDashboard
      ? this.router.navigate(['/dashboard'])
      : this.router.navigate(['/users']);
  }

  async onSave(f, user, flag) {
    let vaild = f.form.status;
    if (user.first_name) {
      user.first_name = user.first_name.trim();
    }
    if (user.last_name) {
      user.last_name = user.last_name.trim();
    }
    if (user.job_title) {
      user.job_title = user.job_title.trim();
    }

    // user.role_id = user.role_id.trim();
    if (
      user.first_name === '' ||
      user.last_name === '' ||
      user.job_title === '' /*|| user.role_id === ''*/
    ) {
      vaild = 'INVALID';
    }
    if (vaild === 'VALID' && user.text_permission === false) {
      this.toastr.error('Please agree to our policy!');
      return false;
    }
    if (this.userFacilityList === undefined || !this.userFacilityList.length) {
      this.toastr.error('Please add facility!');
      return false;
    }

    if (vaild === 'VALID') {
      const str = '' + user.employeeId;
      user.employeeId = str.padStart(6, '0');

      if (user.confirmEmail === user.email) {
        // this.emailNotMatch = true
        if (user.confirmWork_email === user.work_email) {
          // this.workingEmailNotMatch = false;
          if (!this.ismultifac) {
            this.user['facility'] = [
              {
                org: this.org,
                fac: this.fac,
              },
            ];
          } else {
            this.user['facility'] = this.userFacilityList.map((item) => ({
              org: item.org_id,
              fac: item.fac_id,
              selected: item['selected'],
            }));
          }
          if (
            this.route.params['_value']['id'] &&
            this.user['facility'].some(
              (item) =>
                item.fac === this.user['fac'] &&
                this.user['organization'] === item.org
            )
          ) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
            }
          } else {
            if (
              this.route.params['_value']['id'] &&
              this.user['organization'] &&
              this.user['fac']
            ) {
              this.user['facility'].push({
                org: this.user['organization'],
                fac: this.user['fac'],
                selected: false,
              });
            }

            this._commonService.setLoader(true);
            const clientKey = sessionStorage.getItem('authReducer');
            // this.user['facility'] = this.fac;
            const client = JSON.parse(clientKey);
            this.user['client_key'] = client.client_key;
            // return;
            const useraccessData = this.moduleData.map((item) => ({
              module: {
                module_id: item._id,
                access: item.position[0].access,
              },
            }));
            // var useraccessData.user_id = ;
            /*             console.log(useraccessData); */
            this.user['role_id'] = null;
            const action = { type: 'POST', target: 'users/add' };
            const payload = this.user;
            console.log('App Notification ---->>', this.app_notification);
            console.log('user payload ---->>>', payload);
            const result = await this.apiService.apiFn(action, payload);
            const accessaction = {
              type: 'POST',
              target: 'users/update_user_access',
            };
            const accesspayload = {
              user_id: this.user._id ? this.user._id : result['data']['_id'],
              module: this.userAcsData,
            };
            // useraccessData;
            if (result['status']) {
              const accessresult = await this.apiService.apiFn(
                accessaction,
                accesspayload
              );
              const LogedinUserId = sessionStorage.getItem('user_Id');
              if (
                LogedinUserId ==
                (this.user._id ? this.user._id : result['data']['_id'])
              ) {
                sessionStorage.setItem(
                  'userAccess',
                  JSON.stringify(this._aes256Service.encFn(this.userAcsData))
                );
              }
            }

            if (flag === 'mail') {
              await this.sendMail(result['data']);
            }
            this._commonService.setLoader(false);
            if (result['status']) {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.success(result['message']);
              }
              /* if(this.isDashboard==true){
                window.location.href='dashboard'
              }else{
                 window.location.href='users';
              } */
              this.router.navigate(['/users']);
            } else {
              if (this.toastr.currentlyActive === 0) {
                this.toastr.error(result['message']);
              }
            }
          }
        } else {
          this.toastr.error(
            'Confirm work email must be the same as work email'
          );
          this.workingEmailNotMatch = true;
        }
      } else {
        this.toastr.error(
          'Confirm personal email must be the same as personal email'
        );
        this.emailNotMatch = true;
      }
    }
    else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid user details');
      }
    }
  }

  async onChangeActive(status, _id, event) {
    this.userAcsData.map((e) => {
      if (e.module_id == _id) {
        if (event == 'view' && !status.checked) {
          Object.assign(e.access, {
            view: false,
            add: false,
            edit: false,
            delete: false,
            export: false,
          });
        } else {
          if (event == 'add') {
            e.access.add = status.checked;
          } else if (event == 'edit') {
            e.access.edit = status.checked;
          } else if (event == 'view') {
            e.access.view = status.checked;
          } else if (event == 'delete') {
            e.access.delete = status.checked;
          } else if (event == 'export') {
            e.access.export = status.checked;
          }
        }
      }
    });
  }

  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpha(key);
    return result;
  }

  prependZeros(num) {
    const str = '' + num;
    return str.padStart(6, '0');
  }

  async addFacilityList(user, isFromDone?) {
    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      this.duplicateFacility = false;
      if (
        (user.organization === '' || user.organization === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Select organization');
      } else if ((user.fac === '' || user.fac === undefined) && !isFromDone) {
        this.toastr.error('Select Building');
        this.duplicateFacility = true;
        return;
      } else {
        this.ismultifac = true;
        if (
          this.userFacilityList === undefined ||
          this.userFacilityList.length < 1
        ) {
          this.userFacilityList = [
            {
              org_id: user.organization,
              org_name: this.multiorg,
              fac_id: user.fac,
              fac_name: this.multifacility,
              fac_address1: this.fac_address1,
              fac_address2: this.fac_address2,
              fac_city: this.fac_city,
              fac_state: this.fac_state,
              fac_zip1: this.fac_zip1,
              fac_zip2: this.fac_zip2,
            },
          ];
        } else {
          if (
            this.userFacilityList.some(
              (item) =>
                item.fac_name.toLowerCase().trim() ===
                  this.multifacility.toLowerCase().trim() &&
                item.org_name.toLowerCase().trim() ===
                  this.multiorg.toLowerCase().trim()
            )
          ) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
              this.duplicateFacility = true;
            }
          } else {
            this.userFacilityList.push({
              org_id: user.organization,
              org_name: this.multiorg,
              fac_id: user.fac,
              fac_name: this.multifacility,
              fac_address1: this.fac_address1,
              fac_address2: this.fac_address2,
              fac_city: this.fac_city,
              fac_state: this.fac_state,
              fac_zip1: this.fac_zip1,
              fac_zip2: this.fac_zip2,
            });
          }
        }
        if (this.userFacilityList.length > 0) {
          this.showfaclist = true;
          this.ismultifac = true;
          this.dataSource = new MatTableDataSource(this.userFacilityList);
        } else {
          this.ismultifac = false;
          this.showfaclist = false;
        }
        //this.user['organization'] = '';
        this.user['fac'] = '';
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        this.dialogRefs.close();
      }
    }
    this.removeAddedFac();
  }

  async onRemoveFac(i) {
    if (i != undefined && i != null) {
      this.addfacIn(i);
      this.userFacilityList.splice(i, 1);
      if (this.userFacilityList.length > 0) {
        this.showfaclist = true;
        this.ismultifac = true;
        this.dataSource = new MatTableDataSource(this.userFacilityList);
      } else if (this.userFacilityList.length === 0) {
        this.showfaclist = false;
        this.ismultifac = false;
      }
    } else {
      this.showNew = false;
    }
  }

  async addmodule(event) {
    const tempModule = {};
    const module = this.modules.filter((mdl) => mdl._id == event);
    const flag = this.userAcsData.findIndex((modul) => modul.module_id == event);
    if (flag == -1) {
      tempModule['module_id'] = event;
      tempModule['module_name'] = module[0].module_name;
      tempModule['access'] = {
        add: false,
        view: false,
        edit: false,
        delete: false,
        export: false,
      };
      this.userAcsData.push(tempModule);
    } else {
      this.toastr.warning('Module is Already Added');
    }
    this.access = '';
    // this.checkexist = true;
    // let module = this.accessData.filter(e=>{if(e._id==event){return e}});
    // this.moduleData.filter(e=>{if(e._id==event){this.checkexist = false}})
    // if(this.checkexist){
    //   this.moduleData.push(module[0]);
    // }
    // else{
    //   this.toastr.error('Module is already added');
    // }
  }

  removeAddedFac() {
    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z.fac_id == e._id) == -1
    );
  }

  addfacIn(i) {
    this.faclist.push({
      fac_name: this.userFacilityList[i].fac_name,
      _id: this.userFacilityList[i].fac_id,
    });
  }

  async corrCheEmail(e, no, f) {
    if (no === '0') {
      if (this.user.email === e.target.value) {
        this.emailNotMatch = false;
        f.form.controls['confirmEmail'].setErrors(null);
      } else {
        this.emailNotMatch = true;
        f.form.controls['confirmEmail'].setErrors({ incorrect: true });
      }
    } else if (no === '1') {
      if (this.user.work_email === e.target.value) {
        this.workingEmailNotMatch = false;
        f.form.controls['confirmWork_email'].setErrors(null);
      } else {
        this.workingEmailNotMatch = true;
        f.form.controls['confirmWork_email'].setErrors({ incorrect: true });
      }
    }
  }

  async userType() {
    await this.apiService
      .apiFn({ type: 'GET', target: 'users/user_type' }, { role_type: 'users' })
      .then((result: any) => {
        if (result['status']) { this.userTypeList = result['data']['_roles']; }
      })
      .catch((error) => this.toastr.error(error['message']));
  }

  async onChangelivedashboard(e) {
    const userId = this.route.params['_value']['id']
      ? this._aes256Service.decFnWithsalt(this.route.params['_value']['id'])
      : '';
    const action = { type: 'POST', target: 'users/user_enable_live' };
    const payload = { user_id: userId, value: e.checked };
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.toastr.success(result['message']);
      sessionStorage.setItem('enable_livedashboard', e.checked);
    } else {
      this.toastr.error(result['message']);
    }
  }

  async sendMail(user) {
    const user_id = this.route.params['_value']['id']
      ? this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"])
      : user._id;
    if (this.sendcount === 0) {
      this._commonService.setLoader(true);
      await this.apiService
        .apiFn(
          { type: 'POST', target: 'users/email' },
          { userIds: [user_id], linkurl: window.location.origin }
        )
        .then((result: any) => {
          this._commonService.setLoader(false);
          if (result['success'] === true) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.success(result['message']);
            }
            this.sendcount = 1;
          } else {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.success(result['message']);
            }
          }
        })
        .catch((error) => {
          this._commonService.setLoader(false);
          this.toastr.error(error['message']);
        });
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('You already sent the invitation');
      }
    }
  }
  /* Opens Add Faclities Pop up */
  addFaclities() {
    this.showNew = true;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '750px';
    dialogConfig.panelClass = 'shiftpopup';
    // dialogConfig.disableClose      = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addFacility, dialogConfig);
  }
  // When click Done button from Add Facility pop up
  addFacilityDone(user) {
    this.duplicateFacility = '';
    if (user.organization !== '' && !user._id) {
      if (user.fac === '' || user.fac === undefined) {
        this.toastr.error('Select Building.');
        return;
      }
    }
    if (!this.userFacilityList || !this.userFacilityList.length) {
      if (user.organization === '' && !user.facility.length) {
        this.toastr.error('Select organization.');
        return;
      }
    }
    if (user.organization !== '' && user.fac !== '') {
      this.addFacilityList(user, true);
    }
    if (!this.duplicateFacility) { this.dialogRefs.close(); }
    this.facListDone = this.userFacilityList;
  }

  // When click Cancel from add Facility Pop up
  addFacilityCancel(user) {
    user.organization = [];
    user.fac = [];
    this.userFacilityList = [];
    this.facListDone = [];
    this.dialogRefs.close();
  }
  /* When click Cancel from Edit user Facility Pop up */
  editFacilityCancel(user) {
    this.dialogRefs.close();
  }

  async getModules() {
    const action = { type: 'GET', target: 'users/modules' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.modules = result['data']['_modules'];
    }
  }

  async getUserAccess(userId) {
    const action = { type: 'POST', target: 'users/user_access' };
    const payload = { userId: userId };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.userAcsData =
        result['data'] && result['data'].length && result['data'][0]['module']
          ? result['data'][0]['module']
          : [];
    }
  }
  async suspendUser(event, user_id) {
    if (event.checked === true) {
      await this.apiService
        .apiFn(
          { type: 'POST', target: 'users/suspend_user' },
          { active: event.checked, userId: user_id }
        )
        .then((result: any) => {
          console.log('result of enable disable user', result);
          this.user.active = event.checked;
        })
        .catch((error) => this.toastr.error(error['message']));
      this._commonService.setLoader(false);
      // this.getUsersDataFunction();
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '350px',
        data: {
          title: 'suspend_user',
          id: { active: event.checked, userId: user_id },
          API: 'users/suspend_user',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.user.active = !event.checked;
        }
        this._commonService.setLoader(false);
        // this.getUsersDataFunction();
      });
    }
  }

  async updateType(event, user_id, type) {
    if (user_id) {
      const action = { type: 'PUT', target: 'users/update_type' };
      const payload = { status: event.checked, userId: user_id, type: type };
      await this.apiService
        .apiFn(action, payload)
        .then((result: any) => {
          if (result) {
            console.log('Result', result);
            // this.user.isCasualPartTime = event.checked
            this.toastr.success(result['message']);
          }
        })
        .catch((error) => this.toastr.error(error['message']));
      this._commonService.setLoader(false);
    } else {
      if (type == 'agency') {
        this.user.isAgencyType = true;
        this.toastr.success('User Type updated as Agency');
      } else if (type == 'parttime') {
        this.user.isCasualPartTime = true;
        this.toastr.success('User Type updated as Casual Part-Time');
      }
    }
  }

  onModuleRemove(i) {
    this.userAcsData.splice(i, 1);
  }

  onChangeAppAccess(e) {}
}
