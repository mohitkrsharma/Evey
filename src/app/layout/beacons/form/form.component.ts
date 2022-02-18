import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

export interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {

  public zone_type = [{ label: 'Room', value: 'room' },
  { label: 'Hallway', value: 'hallway' },
  { label: 'Other', value: 'other' },
  { label: 'Exit', value: 'exit' },
  { label: 'Dining', value: 'dining' },
  { label: 'Spa', value: 'spa' },
  { label: 'Laundry', value: 'laundry' },
  { label: 'Medcart', value: 'medcart' },
  { label: 'Weight', value: 'weight' },
  { label: 'Restroom', value: 'restroom' }];

  beaconForm: FormGroup;
  organiz;
  faclist;
  seclist; floorlist; zonelist;
  beacon: any = {
    name: '',
    major: '',
    minor: '',
    organization: '',
    facility: '',
    protocol: 'ibeacon',
    beacon_type: '',
    acceptable_range: '',
    tag:''
  };
  paramId;
  privilege: string = 'add';
  foods: Food[] = [
    { value: 'steak-0', viewValue: 'Steak' },
    { value: 'pizza-1', viewValue: 'Pizza' },
    { value: 'tacos-2', viewValue: 'Tacos' }
  ];

  public btnAction: Function;
  private subscription: Subscription;
  constructor(private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    public _commonService: CommonService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
  ) { }
  count = 0;
  async ngOnInit() {
    this.route.params['_value']['id'] ? this.privilege = 'edit' : this.privilege = 'add';
    if(!this._commonService.checkAllPrivilege('Beacons')){
      this.router.navigate(['/']);
    }
  //  this._commonService.setLoader(true);
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.count++;
        this.beacon['organization'] = contentVal.org;
        this.beacon['facility'] = contentVal.fac;
        this.floorlist = null;
        this.seclist = null;
        this.zonelist = null;
        this.beacon.zonelist = null;


        const action = { type: 'GET', target: 'floorsector/floorsector_list' };
        const payload = { 'facId': this.beacon['facility'] };
        const result = await this.apiService.apiFn(action, payload);
        const secFac = result['data'];
        const _floors = [];
        this.floorlist = secFac.map(function (obj) {
          const rObj = {};
          rObj['label'] = obj.floor;
          rObj['value'] = obj._id;
          rObj['sector'] = obj.sector;
          return rObj;
        });

        this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
        this.beacon.beacon_type = 'location';

        if (this.route.params['_value']['id']) {
          this._commonService.setLoader(true);
          const action = { type: 'POST', target: 'beacons/view' };
          const payload = { beaconId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
          const result = await this.apiService.apiFn(action, payload);
          this.beacon = result['data'];
          if(!this.beacon.hasOwnProperty('tag')){
            this.beacon['tag']='';
          }
          this._commonService.setLoader(false);
        }
        this._commonService.setLoader(false);

      }
    });

  }

  cancelForm() { // Custom-code!
    this.router.navigate(['/beacons']);
  }

  public async onSubmit(f, beacon: any) {
    beacon.name = beacon.name.trim();
    const valid = f.form.status;
    if (valid === 'VALID') {
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'beacons/add' };
      const payload = { 'beacon': beacon };
      const result = await this.apiService.apiFn(action, payload);
      this._commonService.setLoader(false);

      if (result['status']) {
        this.toastr.success(result['message']);
        this.router.navigate(['/beacons']);
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error('Beacon already exist');
        }
      }

    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter beacon details');
      }
    }
  }

  prependZeros(num) {
    const str = ('' + num);
    return str.padStart(6, '0');
  }

  async loadSector(floor) {
    let findsector = [], strSector;
    strSector = JSON.stringify(this.floorlist);
    strSector = JSON.parse(strSector);
    findsector = [...strSector];
    if (findsector) {
      const _secList = [];
      this.seclist = findsector.map(function (it) {
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

    } else {
      const action = { type: 'GET', target: 'floorsector/floorsector_list' };
      const payload = { 'facId': this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']) };
      const result = await this.apiService.apiFn(action, payload);
      const secFac = result['data'];
      const _floors = [];
      this.floorlist = secFac.map(function (obj) {
        const rObj = {};
        rObj['label'] = obj.floor;
        rObj['value'] = obj._id;
        rObj['sector'] = obj.sector;
        return rObj;
      });
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
    }
  }
  async changeFloor(floor) {

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

    } else {
      const action = { type: 'GET', target: 'floorsector/floorsector_list' };
      const payload = { 'facId': this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']) };
      const result = await this.apiService.apiFn(action, payload);
      const secFac = result['data'];
      const _floors = [];
      this.floorlist = secFac.map(function (obj) {
        const rObj = {};
        rObj['label'] = obj.floor;
        rObj['value'] = obj._id;
        rObj['sector'] = obj.sector;
        return rObj;
      });
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
    }
    this.beacon.area_type = this.beacon.room && this.beacon.room['room'] ? this.beacon.area_type : '';
    this.beacon.sector = this.beacon.sector && this.beacon.room && this.beacon.room['room'] ? this.beacon.sector : '';
    this.beacon.room = this.beacon.room && this.beacon.room['room'] ? this.beacon.room : '';

  }

  async changeSector(sector, value) {
    const action = { type: 'GET', target: 'zones/zone_list' };
    const payload = { 'sectorId': [sector] };
    const result = await this.apiService.apiFn(action, payload);

    if (result['data']) {
      this.zonelist = result['data'].map(function (obj) {
        const rObj = {};
        rObj['label'] = obj.room;
        rObj['value'] = obj._id;
        rObj['type'] = obj.type;
        return rObj;
      });
    }
    this.beacon.room = this.beacon.room && this.beacon.room['room'] ? this.beacon.room : '';
    if (value === 'nochange' || this.count > 1) {
      this.beacon.area_type = '';
      this.beacon.room = '';
    }
  }

  async changeZonetype(zonetype) {
    this.beacon.room = this.beacon.room && this.beacon.room['room'] && this.count <= 1 ? this.beacon.room : '';
  }

  /* Beacon uuid validating */
  public checkUUID(uuid) {
    const result = this._commonService.checkUUID(uuid);
    return result;
  }

  checkAlphanum(key) {
    const result = this._commonService.allwoAlphaAndNum(key);
    return result;
  }

  allwoAlphaNumDash(key) {
    const result = this._commonService.allwoAlphaNumDash(key);
    return result;
  }

}
