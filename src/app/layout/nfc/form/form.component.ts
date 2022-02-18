import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from '../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {
  nfcForm: FormGroup;
  beacon;
  organiz; faclist; seclist; floorlist; zonelist; resilist;
  beaconlist = [];
  private subscription: Subscription;
  constructor(private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService) {

  }
  beacons;
  _formVal = {
    nfctype:'',
    ntagid: '',
    org: '',
    fac: '',
    floor: '',
    sector: '',
    type: '',
    room: '',
    resident: ''
  };
  paramId; resident;
  public roomtypes = [{ label: 'Room', value: 'room' },
  { label: 'Hallway', value: 'hallway' },
  { label: 'Other', value: 'other' },
  { label: 'Exit', value: 'exit' },
  { label: 'Dining', value: 'dining' },
  { label: 'Spa', value: 'spa' },
  { label: 'Laundry', value: 'laundry' },
  { label: 'Medcart', value: 'medcart' },
  { label: 'Weight', value: 'weight' },
  { label: 'Restroom', value: 'restroom' }];

  orgId; facId; floorId; roomId;
  count = 0;

  async ngOnInit() {
    if(!this._commonService.checkPrivilegeModule('beacons','add')){
      this.router.navigate(['/']);
    }
   // this._commonService.setLoader(true);
   if (this.route.params['_value']['id'] && (this.route.params['_value']['id'] !== 0 || this.route.params['_value']['id'] !== "0")) {
    this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
  }
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac && contentVal.floorlist) {
        this.count++;
        this._formVal.org = contentVal.org;
        this._formVal.fac = contentVal.fac;
        this.floorlist = contentVal.floorlist;
        this.seclist = null;
        this.zonelist = null;

        this._formVal.floor = '';
        this._formVal.sector = '';
        this._formVal.room = '';
        this._formVal.resident = '';

        if (this.paramId) {
          this._commonService.setLoader(true);
          const action = { type: 'POST', target: 'nfc/view' };
          const payload = { nfcId: this.paramId };
          const result = await this.apiService.apiFn(action, payload);
          this._formVal = result['data'];
          if(this._formVal.nfctype =="" || this._formVal.nfctype == null || this._formVal.nfctype == undefined){
            this._formVal.nfctype='res';
          }
          this.floorId = result['data']['floor']['_id'];
          this._formVal['floor'] = result['data']['floor']['_id'];

          this.count !== 1 ? this.changeFloor(this._formVal['floor'], 'nochange') : this.changeFloor(this._formVal['floor'], 'change');
          this.count !== 1 ? this.changeSector(result['data']['sector'], 'nochange') : this.changeSector(result['data']['sector'], 'change');
          const sector = this._formVal['sector'];
          const secdata = this.seclist.map(itm => itm.value);

          this._formVal['sector'] = (secdata.includes(sector)) ? this._formVal['sector'] : null;

          this.roomId = result['data']['room']['_id'];
          this._formVal['room'] = result['data']['room']['_id'];
          if(this._formVal['resident'] == null || this._formVal['resident'] == ""){
           this._formVal['resident']=null;
          }
          else
          {
             this._formVal['resident'] = this.resident = result['data']['resident']['_id'];
            
          }
          this.changeZone(this._formVal['room'], this._formVal['resident'], 'nochange');
          this._commonService.setLoader(false);
        } else {
          this._commonService.setLoader(false);
        }
      }
    });

    this.subscription = this._commonService.floorcontentdata.subscribe(async (data: any) => {
      if (data) {
        this.floorlist = data;
      }
    });
  }

  async residentslist(zoneId, residentId) {

    const action = { type: 'GET', target: 'residents/get_res_org_nfc' };
    const payload = {
      'organization': [this._formVal.org], 'facility': [this._formVal.fac], 'flag': 'nfc', 'residentId': residentId,
      'zoneId': zoneId
    };
    const result = await this.apiService.apiFn(action, payload);
    this.resilist = result['data'].map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.last_name + ', ' + obj.first_name;
      rObj['value'] = obj._id;
      return rObj;
    });

    this.resilist.sort(function (a, b) {
      const nameA = a.label.toUpperCase();
      const nameB = b.label.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  }

  async changeFloor(floor, value) {
    if (value === 'change') {
      this.seclist = null;
      this.zonelist = null;
    } else {
      this.seclist = null;
      this._formVal.sector = '';
      this._formVal.room = '';
      this.zonelist = null;
    }

    if (this.floorlist) {
      const _secList = [];
      this.seclist = this.floorlist.map(function (it) {
        if (it.value === floor) {
          it['sector'].map(function (item) {
            _secList.push(item);
          });
        }
      });
      this.seclist = _secList.map(function (obj) {
        const rObj = {};
        rObj['label'] = obj.name;
        rObj['value'] = obj._id;
        return rObj;
      });
      this.seclist.sort((a, b) =>
        (a.label).localeCompare((b.label), navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    } else {
      const _secList = [];
      this.seclist = this.floorlist.map(function (it) {
        if (it.value === floor) {
          it['sector'].map(function (item) {
            _secList.push(item);
          });
        }
      });
      this.seclist = _secList.map(function (obj) {
        const rObj = {};
        rObj['label'] = obj.name;
        rObj['value'] = obj._id;
        return rObj;
      });
      this.seclist.sort((a, b) =>
        (a.label).localeCompare((b.label), navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    }
  }

  async changeSector(sector, value) {
    if (value === 'change') {
    } else {
      this._formVal.room = '';
    }

    const action = { type: 'GET', target: 'zones/zone_list' };
    const payload = { 'sectorId': [sector] };   
    const result = await this.apiService.apiFn(action, payload); 
     
    if (result['data'] && result['data'].length) {
      this.zonelist = result['data'].map(function (obj) {
        const rObj = {};
        rObj['label'] = obj.room;
        rObj['value'] = obj._id;
        return rObj;
      });
    }
  }

  // cancel button
  cancel() {
    this.router.navigate(['./nfc']);
  }

  // function to accept only alpha numeric character
  checkAlphanum(key) {
    const result = this._commonService.allwoAlphaAndNum(key);
    return result;
  }

  // Add/Edit NFC form
  async onSubmit(f, nfc) {
    const valid = f.form.status;
    if (valid === 'VALID') {
      const action = {
        type: 'POST',
        target: 'nfc/add'
      };
      if(nfc.nfctype =='zone'){
        nfc.resident =null;
      }
      nfc.ntagid=nfc.nfctype+':'+nfc.ntagid;
      const payload =nfc; 
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.toastr.success(result['message']);
        this.router.navigate(['/nfc']);
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error(result['message']);
          nfc.ntagid='';
        }
      }
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter nfc details');
      }
    }
  }

  changeZone(zoneId, residentId, value) {
    if (value === 'change') {
      this.resilist = null;
      this._formVal['resident'] = null;
      this.paramId ? this.residentslist(zoneId, this.resident) : this.residentslist(zoneId, null);
    } else {
      this.resilist = null;
      this.residentslist(zoneId, residentId);
    }

  }

}
