import { Component, OnInit } from '@angular/core';
import { ApiService } from './../../../shared/services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material';
import { CommonService } from './../../../shared/services/common.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  organization: any;
  facility: any;
  faclist: any;
  assets: any = {
    name: '',
    type: '61643d424076d045e66f6e81',
    serial_no: '',
    org_id: '',
    fac_id: '',
    nfc: '',
    zone: [],
    beacons: [],
  };
  fac: any;
  defaultAlert;
  private subscription: Subscription;
  zoneList: any[] = [];
  deletedZone: any[] = [];
  zones = [];
  zone;
  beacons;
  beaconlist = [];
  beacon;
  beaSearch = '';

  constructor(
    private _apiService: ApiService,
    private _toastr: ToastrService,
    private _socketService: SocketService,
    private _router: Router,
    private _route: ActivatedRoute,
    public _commonService: CommonService,
    public _constantsService: ConstantsService,
    private _aes256Service: Aes256Service
  ) {
    this.defaultAlert = this._constantsService.alertData();
  }

  result: any;
  string = '';
  paramId: Boolean;
  nfclist = [];
  typeList = [];
  searchCtrl = '';
  nfcSearch = '';
  typeSearch = '';
  privilege = 'add';
  selectedNFCData;

  async ngOnInit() {
    if (!this._commonService.checkAllPrivilege('Assets')) {
      // this._toastr.error('You don't have permission to add/edit assets.');
      this._router.navigate(['/assets']);
    }

    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this._commonService.setLoader(true);

          this.organization = contentVal.org;
          this.facility = contentVal.fac;

          const action = { type: 'POST', target: 'nfc/unassigned' };
          const payload = {
            org: this.organization,
            fac: this.facility,
          };
          this.unassignedBeaconsList();
          this.getZoneDataFunction();
          const result = await this._apiService.apiFn(action, payload);
          const action2 = { type: 'GET', target: 'assets/list_types' };
          const payload2 = {};
          const result2 = await this._apiService.apiFn(action2, payload2);
          this.nfclist = result['data'];
          // console.log('this.nfclist----->', this.nfclist);
          this.typeList = result2['data'];
          this._commonService.setLoader(false);
          if (this.selectedNFCData && this.nfclist && this.nfclist.length) {
            this.nfclist.unshift(this.selectedNFCData);
          }
        }
      }
    );

    if (this._route.params['_value']['id']) {
      this.paramId = true;
      this.privilege = 'edit';
      const action = { type: 'POST', target: 'assets/view' };
      const payload = {
        assetId: this._aes256Service.decFnWithsalt(
          this._route.params['_value']['id']
        ),
      };
      const result = await this._apiService.apiFn(action, payload);
      this.assets = result['data'];
      this.zoneList = result['data'].zone;
      this.beaconlist = result['data'].beacons;
      this.selectedNFCData = this.assets.nfc;
      this.assets['nfc'] = this.assets.nfc._id;
    }
  }

  async unassignedBeaconsList() {
    const payload = {
      org: this.organization,
      fac: this.facility,
    };

    await this._apiService
      .apiFn({ type: 'POST', target: 'beacons/unassigned' }, payload)
      .then((result1: any) => {
        this.beacons = result1.data['beacons'];
      });
  }

  async unassignZone(zone) {
    for (let i = 0; i < this.zoneList.length; i++) {
      if (this.zoneList[i]._id === zone._id) {
        this.zoneList.splice(i, 1);
      }
    }
    if (this._toastr.currentlyActive === 0) {
      this._toastr.success('Zone unassigned successfully');
    }
  }

  async assignZone(item) {
    if (this.paramId) {
      if (item) {
        this.zoneList.push(item);
        if (this._toastr.currentlyActive === 0) {
          this._toastr.success('Zone assigned successfully');
        }
      } else {
        if (this._toastr.currentlyActive === 0) {
          this._toastr.error('Please select zone');
        }
      }
    } else {
      if (item) {
        this.zoneList.push(item);
        console.log("Zone list",this.zoneList);
        this._toastr.success('Zone assigned successfully');
      } else {
        this._toastr.error('Please select zone');
      }
    }
  }

  checkDuplicate(item){
    const _found  = this.zoneList.findIndex(z => z._id.toString() === item._id.toString());
    if(_found > -1){
      return true
    }
    else {
      return false
    }
  }

  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  async addAsset(f) {
    const vaild = f.form.status;
    if (vaild === 'INVALID') {
      this._toastr.error('Please fill all fields');
    } else {
      this.assets['org_id'] = this.organization;
      this.assets['fac_id'] = this.facility;
      this.assets['beacons'] = this.beaconlist;
      console.log("Assets",this.assets);

      const action = { type: 'POST', target: 'assets/add' };
      let payload;
      if (this.paramId) {
        payload = {
          _id: this.assets._id,
          fac_id: this.facility,
          name: this.assets.name,
          nfc: this.assets.nfc,
          org_id: this.organization,
          serial_no: this.assets.serial_no,
          type: this.assets.type,
          zone: this.zoneList,
          beacons: this.beaconlist
        };
      } else {
        payload = this.assets;
      }
      const result = await this._apiService.apiFn(action, payload);
      if (result['status']) {
        this._toastr.success(result['message']);
        this._router.navigate(['/assets']);
      } else {
        this._toastr.error(result['message']);
        this._commonService.setLoader(false);
      }
    }
    return;
  }

  public async getZoneDataFunction(sort?) {
    this._commonService.setLoader(true);
    const payload = {
      fac: this.facility,
      org: this.organization,
    };
    await this._apiService
      .apiFn({ type: 'GET', target: 'zones/allZone' }, payload)
      .then((result: any) => {
        this._commonService.setLoader(false);
        this.zones = result['data'];
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this._toastr.error('Something went wrong, Please try again.');
      });
  }

  cancel() {
    this._commonService.setLoader(true);
    this._router.navigate(['/assets']);
  }

  async unassignBeacon(beacon) {
    for (let i = 0; i < this.beaconlist.length; i++) {
      if (this.beaconlist[i]._id === beacon._id) {
        this.beaconlist.splice(i, 1);
      }
    }
    if (this._toastr.currentlyActive === 0) {
      this._toastr.success('Beacon unassigned successfully');
    }
  }

  async assignBeacon(beacon) {
    if (this.paramId) {
      if (beacon) {
        this.beaconlist.push(beacon);
        if (this._toastr.currentlyActive === 0) {
          this._toastr.success('Beacon assigned successfully');
        }
      } else {
        if (this._toastr.currentlyActive === 0) {
          this._toastr.error('Please select beacon');
        }
      }
    } else {
      if (beacon) {
        this.beaconlist.push(beacon);
        this._toastr.success('Beacon assigned successfully');
      } else {
        this._toastr.error('Please select beacon');
      }
    }
  }

  async assignNFC(nfc) {
    this.selectedNFCData = nfc;
    if (nfc) {
      this.assets.nfc = nfc._id;
      if (this._toastr.currentlyActive === 0) {
        this._toastr.success('NFC assigned successfully');
      }
    } else {
      if (this._toastr.currentlyActive === 0) {
        this._toastr.error('Please select nfc');
      }
    }
  }

  async openSelectDropdown(event) {
    console.log('openSelectDropdown event--->', event);
      if (event === true) {
        this.nfclist.shift();
      } else if (event === false) {
        this.nfclist.unshift(this.selectedNFCData);
      }
  }
}
