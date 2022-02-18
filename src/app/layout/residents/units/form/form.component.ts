import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ApiService} from '../../../../shared/services/api/api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Aes256Service} from '../../../../shared/services/aes-256/aes-256.service';
import {CommonService} from '../../../../shared/services/common.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  @ViewChild('addBeaconEle', {static: true}) addBeaconEle: TemplateRef<any>;
  unitForm: FormGroup;
  beacon; residents; resident;
  nfc;
  organize; secList; floorList; unitList;
  beaconList = [];
  facility; organization;
  residentList = [];
  deletedBeacon = []; deletedResident = [];
  nfcList = [];
  deletedNfc = [];
  assignNFCList = [];
  private subscription: Subscription;
  beacon_value: any = {
    name: '',
    major: '',
    minor: '',
    organization: '',
    facility: '',
    protocol: 'ibeacon',
    beacon_type: '',
    acceptable_range: '',
    tag: ''
  };
  dialogRefs = null;
  beaconForm: FormGroup;
  beacons;
  flag = false;
  count = 0;
  unit = {
    org: '',
    fac: '',
    floor: '',
    sector: '',
    type: '',
    room: '',
    nfc: [],
    ready_to_move: true
  };
  paramId;
  floSearch = '';
  secSearch = '';
  typeSearch = '';
  beaSearch = '';
  resSearch = '';
  nfcSearch = '';
  privilege = 'add';
  public roomTypes = [{ label: 'Room', value: 'room' },
    { label: 'Hallway', value: 'hallway' },
    { label: 'Other', value: 'other' },
    { label: 'Exit', value: 'exit' },
    { label: 'Dining', value: 'dining' },
    { label: 'Spa', value: 'spa' },
    { label: 'Laundry', value: 'laundry' },
    { label: 'Medcart', value: 'medcart' },
    { label: 'Weight', value: 'weight' },
    { label: 'Restroom', value: 'restroom' }
  ];

  constructor(private fb: FormBuilder,
              private apiService: ApiService,
              private router: Router,
              private route: ActivatedRoute,
              private toastr: ToastrService,
              public dialog: MatDialog,
              private _aes256Service: Aes256Service,
              public _commonService: CommonService) {

  }

  async ngOnInit() {
    if (!this._commonService.checkAllPrivilege('Zones')) {
      this.router.navigate(['/']).then();
    }
    this.createPropertyForm();
    if (this.route.params['_value']['id'] && (this.route.params['_value']['id'] !== 0 || this.route.params['_value']['id'] !== '0')) {
      this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      this.privilege = 'edit';
    }
    this._commonService.setLoader(true);
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {

      if (contentVal.org && contentVal.fac && contentVal.floorlist) {
        this.unit['org'] = this.organization = contentVal.org;
        this.unit['fac'] = this.facility = contentVal.fac;

        this.floorList = contentVal.floorlist;
        this.secList = null;
        this.unit.floor = '';
        this.unit.sector = '';

        this._commonService.setLoader(false);
        if (this.route.params['_value']['floor']) {
          this.flag = true;
          this.paramId = null;
          await this.apiService.apiFn(
            { type: 'GET', target: 'floorsector/floorsector_list' },
            { facId: this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']) }
          )
            .then((result: any) => {
              this.floorList = result.data.map((obj) => {
                return {
                  'label': obj.floor,
                  'value': obj._id,
                  'sector': obj.sector
                };
              });
            });

          this.unit['org'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
          this.unit['fac'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
          this.unit['floor'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['floor']);
          this.changeFloor(this._aes256Service.decFnWithsalt(this.route.params['_value']['floor']));
          this.unit['sector'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['sector']);
        }

        if (this.route.params['_value']['id'] && this.route.params['_value']['id'] !== '0') {
          console.log('In Form Comp: ', this.route.params['_value']['id'])
          this._commonService.setLoader(true);
          this.beaconList = []; this.residentList = [];
          this.assignNFCList = [];
          await this.apiService.apiFn(
            { type: 'POST', target: 'zones/view' },
            { zoneId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) }
          )
            .then(async (result: any) => {
              this.unit = result.data;
              this.unit['ready_to_move'] = true;
              this.assignNFCList = result.data.nfc;

              // tslint:disable-next-line: max-line-length
              this.unit['org'] = this.unit['org']['_id'] ? this.unit['org']['_id'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
              // tslint:disable-next-line: max-line-length
              this.unit['fac'] = this.unit['fac']['_id'] ? this.unit['org']['_id'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
              this.beaconList = result.beacons;
              this.residentList = result.residents;
              // tslint:disable-next-line: max-line-length
              this.unit['floor'] = result.data['floor']['_id'] ? result.data['floor']['_id'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['floor']);
              await this.changeFloor(this.unit['floor']);
              // tslint:disable-next-line: max-line-length
              this.unit['sector'] = result.data['sector'] ? result.data['sector'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['sector']);
              this._commonService.setLoader(false);
            });
        }

        this.unassignedbeacons();
        this.unassignenfcs();
      }
    });
  }


  async unassignedbeacons() {
    const payload1 = {
      org: typeof (this.unit['org']) === 'object' ? this.unit['org']['_id'] : this.unit['org'] ? this.unit['org'] : this.organization,
      fac: typeof (this.unit['fac']) === 'object' ? this.unit['fac']['_id'] : this.unit['fac'] ? this.unit['fac'] : this.facility
    };

    await this.apiService.apiFn({ type: 'POST', target: 'beacons/unassigned' }, payload1)
      .then((result1: any) => {
        this.beacons = result1.data['beacons'];
        this.residents = result1.data['residents'];
      });
  }

  async changeFloor(floor) {
    if (!this.route.params['_value']['id']) {
      this.unit['sector'] = '';
    }

    if (this.floorList) {
      const _secList = [];
      this.secList = this.floorList.map((it) => {
        if (it.value === floor) {
          it['sector'].map((item) => _secList.push(item));
        }
      });
      this.secList = _secList.map((obj) => {
        return { 'label': obj.name, 'value': obj._id };
      });
      this.secList.sort((a, b) =>
        (a.label).localeCompare((b.label), navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    } else {
      const _secList = [];
      this.secList = this.floorList.map((it) => {
        if (it.value === floor) {
          it['sector'].map((item) => _secList.push(item));
        }
      });
      this.secList = _secList.map((obj) => {
        return { 'label': obj.name, 'value': obj._id };
      });
      this.secList.sort((a, b) =>
        (a.label).localeCompare((b.label), navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    }

  }

  // }).sort((a, b) => a.localeCompare(b, navigator.languages[0] || navigator.language, {numeric: true, ignorePunctuation: true}))



  async changeSector(sector) {
    await this.apiService.apiFn(
      { type: 'GET', target: 'zones/unit_list' },
      { 'sectorId': [sector] }
    )
      .then((result: any) => {
        this.unitList = result.data.map((obj) => {
          return { 'label': obj.room, 'value': obj._id };
        });
      });
  }

  cancel() {
    this.router.navigate(['./units']).then();
  }

  async unassignBeacon(beacon) {
    this.deletedBeacon.push(beacon._id);
    this.beacons.push(beacon);
    for (let i = 0; i < this.beaconList.length; i++) {
      if (this.beaconList[i]._id === beacon._id) {
        this.beaconList.splice(i, 1);
      }
    }
    this.toastr.success('Beacon unassigned successfully');

  }

  async unassignResident(resident) {
    this.deletedResident.push(resident._id);
    this.residents.push(resident);
    for (let i = 0; i < this.residentList.length; i++) {
      if (this.residentList[i]._id === resident._id) {
        this.residentList.splice(i, 1);
      }
    }
    if (this.toastr.currentlyActive === 0) {
      this.toastr.success('Resident unassigned successfully');
    }
  }

  async assignBeacon(beacon) {

    this.beacon = '';
    if (beacon) {
      this.beaconList.push(beacon);

      for (let i = 0; i < this.beacons.length; i++) {
        if (this.beacons[i]._id === beacon._id) {
          this.beacons.splice(i, 1);
        }
      }
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('Beacon assigned successfully');
      }
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select beacon');
      }
    }
    if (this.deletedBeacon.length > 0) {
      this.deletedBeacon = this.deletedBeacon.filter(elem => elem !== beacon._id) || [];
    }
  }

  async assignResident(item) {
    if (this.paramId) {
      if (item) {
        this.resident = '';
        this.residentList.push(item);
        for (let i = 0; i < this.residents.length; i++) {
          if (this.residents[i]._id === item._id) {
            this.residents.splice(i, 1);
          }
        }
        if (this.toastr.currentlyActive === 0) {
          this.toastr.success('Resident assigned successfully');
        }
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error('Please select resident');
        }
      }
    } else {
      if (item) {
        this.resident = '';
        this.residentList.push(item);
        for (let i = 0; i < this.residents.length; i++) {
          if (this.residents[i]._id === item._id) {
            this.residents.splice(i, 1);
          }
        }
        if (this.toastr.currentlyActive === 0) {
          this.toastr.success('Resident assigned successfully');
        }
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error('Please select resident');
        }
      }

    }
    if (this.deletedResident.length > 0) {
      this.deletedResident = this.deletedResident.filter(elem => elem !== item._id) || [];
    }
  }

  async loadBeacons() {
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/view' },
      { zoneId: id }
    )
      .then((result: any) => this.beaconList = result.data['beacons']);
  }

  async loadResidents() {
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/view' },
      { zoneId: id }
    )
      .then((result: any) => this.residentList = result.data['residents']);
  }

  checkAlphanum(key) {
    return this._commonService.allwoAlphaAndNumAndSpace(key);
  }

  async onSubmit(f, unit) {
    let valid = f.form.status;
    unit.room = unit.room.trim();
    if (unit.org === '' || unit.fac === '' || unit.floor === '' || unit.sector === '' || unit.room === '') {
      valid = 'INVALID';
    }

    if (valid === 'VALID') {
      unit['beacons'] = this.beaconList;
      unit['residents'] = this.residentList;
      unit['deletedbeacon'] = this.deletedBeacon;
      unit['deletedresident'] = this.deletedResident;
      unit['ready_to_move'] = false;
      if (this.route.params['_value']['floor']) {
        unit['org'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
        unit['fac'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
      } else {
        unit['org'] = this.organization;
        unit['fac'] = this.facility;
      }
      // console.log(payload);
      // return false;
      this._commonService.setLoader(true);
      await this.apiService.apiFn({ type: 'POST', target: 'zones/add' }, unit)
        .then((result: any) => {
          if (result.status) {
            this.toastr.success(result.message);
            this._commonService.setLoader(false);
            this.router.navigate(['/units']);
          } else {
            this._commonService.setLoader(false);
            if (this.toastr.currentlyActive === 0) { this.toastr.error(result.message); }
          }
        });
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter unit details');
      }
    }
  }

  onChangeReady(event) {
    this.unit.ready_to_move = event.checked;
  }

  createPropertyForm() {
    this.beaconForm = this.fb.group({
      _id: [null, []],
      name: ['', [Validators.required]],
      major: ['', [Validators.required]],
      minor: ['', [Validators.required]],
      organization: ['', []],
      facility: ['', []],
      protocol: ['', []],
      tag: ['', []],
      beacon_type: ['', [Validators.required]],
      acceptable_range: ['', [Validators.required]]
    });
  }
  addBeacon() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '900px';
    dialogConfig.panelClass = 'repeatDialog';
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addBeaconEle, dialogConfig);
  }

  closeBeaconDialog(): void {
    this.dialogRefs.close();
    this.beaconForm.reset();
  }

  async saveBeaconDialog(f, beacon: any) {
    beacon.name = beacon.name.trim();
    const valid = f.form.status;
    if (valid === 'VALID') {
      this._commonService.setLoader(true);
      await this.apiService.apiFn(
        { type: 'POST', target: 'beacons/add' },
        { 'beacon': beacon }
      )
        .then((result: any) => {
          this._commonService.setLoader(false);
          if (result.status) {
            this.toastr.success(result.message);
            const index = this.beaconList.findIndex(item => item._id === beacon._id);
            const index1 = this.beacons.findIndex(item => item._id === beacon._id);
            if (index > -1) {
              this.beaconList[index]['name'] = beacon.name;
            }
            if (index1 > -1) {
              this.beacons[index]['name'] = beacon.name;
            }
            this.closeBeaconDialog();
          } else {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Beacon already exist');
            }
          }
        })
        .catch(() => this._commonService.setLoader(false));
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter beacon details');
      }
    }
  }

  async editBeacon(beaconId) {
    this._commonService.setLoader(true);
    await this.apiService.apiFn(
      { type: 'POST', target: 'beacons/view' },
      { beaconId: beaconId }
    ).then((result: any) => {
      this.beacon_value = result.data;
      if (!this.beacon_value.hasOwnProperty('tag')) {
        this.beacon_value['tag'] = '';
      }
      this._commonService.setLoader(false);

      this.beaconForm.patchValue(this.beacon_value);
      this.addBeacon();
    })
      .catch(() => this._commonService.setLoader(false));
  }

  prependZeros(num) {
    const str = ('' + num);
    return str.padStart(6, '0');
  }

  async unassignenfcs() {
    const payload1 = {
      org: typeof (this.unit['org']) === 'object' ? this.unit['org']['_id'] : this.unit['org'] ? this.unit['org'] : this.organization,
      fac: typeof (this.unit['fac']) === 'object' ? this.unit['fac']['_id'] : this.unit['fac'] ? this.unit['fac'] : this.facility
    };
    await this.apiService.apiFn({ type: 'POST', target: 'nfc/unassigned' }, payload1)
      .then((result1: any) => this.nfcList = result1.data);
  }

  async assignNFC(nfc) {
    this.nfc = '';
    if (nfc) {
      this.assignNFCList.push(nfc);
      this.unit.nfc = this.assignNFCList;

      for (let i = 0; i < this.nfcList.length; i++) {
        if (this.nfcList[i]._id === nfc._id) {
          this.nfcList.splice(i, 1);
        }
      }
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('NFC assigned successfully');
      }
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select NFC');
      }
    }
  }

  async unassignNFC(nfc) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'nfc/unassign' },
      { nfc: nfc._id }
    )
      .then((result: any) => {
        if (result.status === true && result.type === 'Success') {
          this.deletedNfc.push(nfc._id);
          this.nfcList.push(nfc);
          for (let i = 0; i < this.assignNFCList.length; i++) {
            if (this.assignNFCList[i]._id === nfc._id) {
              this.assignNFCList.splice(i, 1);
            }
          }
          for (let i = 0; i < this.unit.nfc.length; i++) {
            if (this.unit.nfc[i]._id === nfc._id) {
              this.unit.nfc.splice(i, 1);
            }
          }
          this.toastr.success('NFC unassigned successfully');
        } else {
          this.toastr.error(result.message);
        }
      });
  }

}
