import { Component, OnInit } from '@angular/core';
import { ApiService } from './../../../shared/services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material';
import { CommonService } from './../../../shared/services/common.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

export interface PeriodicElement {
  org_name: string;
  org_id: string;
  fac_name: string;
  fac_id: string;
}
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  organiz: any;
  org: any;
  faclist: any;
  messagerequired = false;
  announcement: any = {
    message: '',
    isactive: true,
    organization: '',
    fac: '',
    facility: [],
    border_color: '#0063AB',
    font_color: '#0063AB',
    background_color: '#FFFFFF',
    font_size: 17,
    isdefault: true,
    theme: 'Primary',
    priority: ''
  };
  minDate = new Date();
  userFacilityList: PeriodicElement[] = [];
  displayedColumns = ['org', 'fac', 'action'];
  dataSource = new MatTableDataSource(this.userFacilityList);
  multifacility: any;
  multiorg: any;
  fac: any;
  defaultAlert;


  constructor(
    private _apiService: ApiService,
    private _toastr: ToastrService,
    private _socketService: SocketService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _commonService: CommonService,
    private _constantsService: ConstantsService,
    private _aes256Service: Aes256Service,
  ) {
    this.defaultAlert = this._constantsService.alertData();
  }

  announce = { message: '', isactive: '' };
  editorValue = '';
  result: any;
  string = '';
  ismultifac: Boolean = false;
  paramId: Boolean;
  showfaclist: Boolean = false;
  fontSizeArr = [];
  orgSearch = '';
  searchCtrl = '';
  theSearch = '';
  async ngOnInit() {


    if (!this._commonService.checkPrivilegeModule('announcement', 'add')) {
      this._router.navigate(['/announcement']);
    }
    this._commonService.setLoader(true);
    this.fontSizeArr = this.range(10, 30, 2);
    if (this._route.params['_value']['id']) {

      this.paramId = true;
      const action = { type: 'POST', target: 'announcement/view' };
      const payload = { announceId: this._aes256Service.decFnWithsalt(this._route.params['_value']['id']) };
      const result = await this._apiService.apiFn(action, payload);
      this.announcement = result['data'];
      this.string = this.announcement['message'];
      this.announcement['isdefault'] = (this.announcement['isdefault'] === undefined) ? false : this.announcement['isdefault'];
      if (result['data']['facility'].length > 0) {
        this.multiorg = result['data']['facility'][0]['org'] ? result['data']['facility'][0]['org']['org_name'] : '';
        this.changeOrg(this.announcement.organization);
        this.ismultifac = true;
        this.showfaclist = true;
        this.multifacility = result['data']['facility'][0]['fac']['fac_name'];
      } else {
        this.ismultifac = false;
        this.showfaclist = false;
      }

      this.userFacilityList = result['data']['facility'].map(item => (
        {
          org_id: item.org._id, org_name: item.org.org_name, fac_id: item.fac._id,
          fac_name: item.fac.fac_name, selected: item.selected
        }
      ));

      this.dataSource = new MatTableDataSource(this.userFacilityList);

    }

    // get organization list:
    const action = { type: 'GET', target: 'organization/orglist' };
    const payload = {};
    const result = await this._apiService.apiFn(action, payload);
    this.organiz = result['data'];
    this._commonService.setLoader(false);
  }

  async changeOrg(org) {
    this._commonService.setLoader(true);
    this.org = org;
    const action = { type: 'GET', target: 'facility/faclist' };
    const payload = { 'org_id': org };
    const result = await this._apiService.apiFn(action, payload);
    this.faclist = result['data'];
    this.announcement.fac = '';
    this._commonService.setLoader(false);
  }

  onchangemessage(event) {
    if (!this.announcement['message']) {
      this.messagerequired = true;
    } else {
      const div = document.createElement('div');
      div.innerHTML = this.announcement.message;
      const allElements = div.getElementsByTagName('*');
      for (let i = 0, len = allElements.length; i < len; i++) {
        const element = allElements[i];
        element.removeAttribute('style');
      }
      const text = (div.textContent || div.innerText || '').replace(/ /g, '');
      if (text.length) {
        this.announcement.message = div.innerHTML;
        this.messagerequired = false;
      } else {
        this.messagerequired = true;
      }
    }
  }

  async addAnnouncement(f) {
    const vaild = f.form.status;
    if (!this.announcement['message']) {
      this.messagerequired = true;
    }

    const div = document.createElement('div');
    this.announcement.message = this.announcement.message.replace(/<\/?(?!u)(?!em)(?!strong)\w*\b[^>]*>/ig, '');
    div.innerHTML = this.announcement.message;
    const allElements = div.getElementsByTagName('*');
    for (let i = 0, len = allElements.length; i < len; i++) {
      const element = allElements[i];
      element.removeAttribute('style');
    }
    const text = (div.textContent || div.innerText || '').replace(/ /g, '');
    if (vaild === 'VALID' && this.messagerequired === false && text.length) {
      this._commonService.setLoader(true);
      if (!this.ismultifac) {
        this.announcement['facility'] = [{
          org: this.org,
          fac: this.fac
        }];

      } else {
        this.announcement['facility'] = this.userFacilityList.map(item => (
          { org: item.org_id, fac: item.fac_id, selected: item['selected'] }));
      }
      if (this._route.params['_value']['id'] && this.announcement['facility'].some(item => item.fac === this.announcement['fac'] &&
        this.announcement['organization'] === item.org)) {

        if (this._toastr.currentlyActive === 0) {
          this._toastr.error('Facility already added');
        }
      } else {
        if (this._route.params['_value']['id'] && this.announcement['organization'] && this.announcement['fac']) {
          this.announcement['facility'].push({
            org: this.announcement['organization'],
            fac: this.announcement['fac'],
            selected: false
          });
        }

        const action = { type: 'POST', target: 'announcement/add' };
        const payload = this.announcement;
        console.log("Payload",payload);
        const result = await this._apiService.apiFn(action, payload);

        if (result['status']) {
          this._toastr.success(result['message']);
          this._router.navigate(['/announcement']);
        } else {
          this._toastr.error(result['message']);
          this._commonService.setLoader(false);
        }
      }
    }

  }

  getAnnouncementFn() {
    this._socketService.getAnnouncementFn().subscribe(res => {
      this.announce['message'] = res['message'];
    });
  }

  cancel() {
    this._commonService.setLoader(true);
    this._router.navigate(['/announcement']);
  }

  // dateChange(ev) {
  //   this.minDate = ev;
  // }

  async addFacilityList(announcement) {
    // debugger
    if (announcement.organization === '' || announcement.organization === undefined) {
      this._toastr.error('Please select organization');
    } else if (announcement.fac === '' || announcement.fac === undefined) {
      this._toastr.error('Please select Building');
    } else {

      this.ismultifac = true;
      if (this.userFacilityList === undefined || this.userFacilityList.length < 1) {
        this.userFacilityList = [
          {
            'org_id': announcement.organization,
            'org_name': this.multiorg,
            'fac_id': announcement.fac,
            'fac_name': this.multifacility
          }
        ];
      } else {
        // tslint:disable-next-line: max-line-length
        if (this.userFacilityList.some(item => item.fac_name.toLowerCase().trim() === this.multifacility.toLowerCase().trim() && item.org_name.toLowerCase().trim() === this.multiorg.toLowerCase().trim())) {
          if (this._toastr.currentlyActive === 0) {
            this._toastr.error('Facility already added');
          }
        } else {
          this.userFacilityList.push({
            org_id: announcement.organization,
            org_name: this.multiorg,
            fac_id: announcement.fac,
            fac_name: this.multifacility
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
      this.announcement['organization'] = '';
      this.announcement['fac'] = '';
    }
  }

  async onRemoveFac(i) {
    this.userFacilityList.splice(i, 1);
    if (this.userFacilityList.length > 0) {
      this.showfaclist = true;
      this.ismultifac = true;
      this.dataSource = new MatTableDataSource(this.userFacilityList);
    } else if (this.userFacilityList.length === 0) {
      this.showfaclist = false;
      this.ismultifac = false;
    }
  }

  select(org, fac, flag) {
    console.log(org, fac);
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
    }
    else {
      if (!org || org === undefined) {
        this.multifacility = fac;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  async changeFac(fac, e) {
    this.fac = fac;
  }


  range(start, edge, step) {
    // If only 1 number passed make it the edge and 0 the start
    if (arguments.length === 1) {
      edge = start;
      start = 0;
    }

    // Validate edge/start
    edge = edge || 0;
    step = step || 1;

    // Create array of numbers, stopping before the edge
    const arr = [];
    for (arr; (edge - start) * step > 0; start += step) {
      arr.push(start);
    }
    return arr;
  }

  changeTheme(theme) {

    const _ind = this.defaultAlert.findIndex((item) => item.name === theme.value);
    if (_ind > -1) {
      this.announcement['border_color'] = this.defaultAlert[_ind]['property']['border_color'];
      this.announcement['font_color'] = this.defaultAlert[_ind]['property']['font_color'];
      this.announcement['background_color'] = this.defaultAlert[_ind]['property']['background_color'];
      this.announcement['font_size'] = this.defaultAlert[_ind]['property']['font_size'];
      this.announcement['priority'] = this.defaultAlert[_ind]['priority'];
    }

  }
}
