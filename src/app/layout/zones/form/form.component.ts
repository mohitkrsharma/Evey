import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  @ViewChild('addBeaconEle', {static: true}) addBeaconEle: TemplateRef<any>;
  zoneForm: FormGroup;
  beacon; residents; resident;
  nfc;
  organiz; seclist; floorlist; zonelist;
  beaconlist = [];
  facility; organization;
  residentlist = [];
  deletedbeacon = []; deletedresident = [];
  nfclist = [];
  deletednfc = [];
  assignNFClist = [];
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
  }
  constructor(private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    public dialog: MatDialog,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService) {

  }
  dialogRefs = null;
  beaconForm: FormGroup;
  beacons;
  flag = false;
  count = 0;
  zone = {
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
  privilege: string = 'add';
  public roomtypes = [{ label: 'Room', value: 'room' },
  { label: 'Hallway', value: 'hallway' },
  { label: 'Other', value: 'other' },
  { label: 'Exit', value: 'exit' },
  { label: 'Dining', value: 'dining' },
  { label: 'Spa', value: 'spa' },
  { label: 'Laundry', value: 'laundry' },
  // { label: 'Medcart', value: 'medcart' },
  { label: 'Weight', value: 'weight' },
  { label: 'Restroom', value: 'restroom' }
  ];

  //   medcart
  // weight
  // restroom
  async ngOnInit() {
    if (!this._commonService.checkAllPrivilege('Zones')) {
      this.router.navigate(['/']);
    }
    this.createPropertyForm();
    if (this.route.params['_value']['id'] && (this.route.params['_value']['id'] !== 0 || this.route.params['_value']['id'] !== "0")) {
      this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      this.privilege = 'edit';
    }
    this._commonService.setLoader(true);
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {

      if (contentVal.org && contentVal.fac && contentVal.floorlist) {
        this.zone['org'] = this.organization = contentVal.org;
        this.zone['fac'] = this.facility = contentVal.fac;

        this.floorlist = contentVal.floorlist;
        this.seclist = null;
        this.zone.floor = '';
        this.zone.sector = '';

        this._commonService.setLoader(false);
        if (this.route.params['_value']['floor']) {
          this.flag = true;
          this.paramId = null;
          await this.apiService.apiFn(
            { type: 'GET', target: 'floorsector/floorsector_list' },
            { facId: this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']) }
          )
            .then((result: any) => {
              this.floorlist = result.data.map((obj) => {
                return {
                  'label': obj.floor,
                  'value': obj._id,
                  'sector': obj.sector
                };
              });
            });

          this.zone['org'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
          this.zone['fac'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
          this.zone['floor'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['floor']);
          this.changeFloor(this._aes256Service.decFnWithsalt(this.route.params['_value']['floor']));
          this.zone['sector'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['sector']);
        }

        if (this.route.params['_value']['id'] && this.route.params['_value']['id'] !== '0') {

          this._commonService.setLoader(true);
          this.beaconlist = []; this.residentlist = [];
          this.assignNFClist = [];
          await this.apiService.apiFn(
            { type: 'POST', target: 'zones/view' },
            { zoneId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) }
          )
            .then(async (result: any) => {
              this.zone = result.data;
              this.zone['ready_to_move'] = true;
              const a_nfc = result.data.nfc;
              this.assignNFClist = a_nfc;

              // tslint:disable-next-line: max-line-length
              this.zone['org'] = this.zone['org']['_id'] ? this.zone['org']['_id'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
              // tslint:disable-next-line: max-line-length
              this.zone['fac'] = this.zone['fac']['_id'] ? this.zone['org']['_id'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
              this.beaconlist = result.beacons;
              this.residentlist = result.residents;
              // tslint:disable-next-line: max-line-length
              this.zone['floor'] = result.data['floor']['_id'] ? result.data['floor']['_id'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['floor']);
              await this.changeFloor(this.zone['floor']);
              // tslint:disable-next-line: max-line-length
              this.zone['sector'] = result.data['sector'] ? result.data['sector'] : this._aes256Service.decFnWithsalt(this.route.params['_value']['sector']);
              this._commonService.setLoader(false);
            });
        }

        this.unassignedbeacons();
        this.unassignenfcs();
      }
    });
    // this.subscription = this._commonService.floorcontentdata.subscribe(async (data: any) => {
    //   if (data) {
    //     this.floorlist = data;

    //   }
    // });
  }


  async unassignedbeacons() {
    const payload1 = {
      // zoneId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
      org: typeof (this.zone['org']) === 'object' ? this.zone['org']['_id'] : this.zone['org'] ? this.zone['org'] : this.organization
      ,
      fac: typeof (this.zone['fac']) === 'object' ? this.zone['fac']['_id'] : this.zone['fac'] ? this.zone['fac'] : this.facility
    };

    await this.apiService.apiFn({ type: 'POST', target: 'beacons/unassigned' }, payload1)
      .then((result1: any) => {
        this.beacons = result1.data['beacons'];
        this.residents = result1.data['residents'];
      });
  }

  async changeFloor(floor) {
    if (!this.route.params['_value']['id']) {
      this.zone['sector'] = '';
    }

    if (this.floorlist) {
      const _secList = [];
      this.seclist = this.floorlist.map((it) => {
        if (it.value === floor) {
          it['sector'].map((item) => _secList.push(item));
        }
      });
      this.seclist = _secList.map((obj) => {
        return { 'label': obj.name, 'value': obj._id }
      });
      this.seclist.sort((a, b) =>
        (a.label).localeCompare((b.label), navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    } else {
      const _secList = [];
      this.seclist = this.floorlist.map((it) => {
        if (it.value === floor) {
          it['sector'].map((item) => _secList.push(item));
        }
      });
      this.seclist = _secList.map((obj) => {
        return { 'label': obj.name, 'value': obj._id }
      });
      this.seclist.sort((a, b) =>
        (a.label).localeCompare((b.label), navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }));
    }

  }

  // }).sort((a, b) => a.localeCompare(b, navigator.languages[0] || navigator.language, {numeric: true, ignorePunctuation: true}))



  async changeSector(sector) {
    await this.apiService.apiFn(
      { type: 'GET', target: 'zones/zone_list' },
      { 'sectorId': [sector] }
    )
      .then((result: any) => {
        this.zonelist = result.data.map((obj) => {
          return { 'label': obj.room, 'value': obj._id }
        });
      });
  }

  cancel() {
    this.router.navigate(['./zones']);
  }

  async unassignBeacon(beacon) {
    this.deletedbeacon.push(beacon._id);
    this.beacons.push(beacon);
    for (let i = 0; i < this.beaconlist.length; i++) {
      if (this.beaconlist[i]._id === beacon._id) {
        this.beaconlist.splice(i, 1);
      }
    }
    this.toastr.success('Beacon unassigned successfully');

  }

  async unassignResident(resident) {
    this.deletedresident.push(resident._id);
    this.residents.push(resident);
    for (let i = 0; i < this.residentlist.length; i++) {
      if (this.residentlist[i]._id === resident._id) {
        this.residentlist.splice(i, 1);
      }
    }
    if (this.toastr.currentlyActive === 0) {
      this.toastr.success('Resident unassigned successfully');
    }
  }

  async assignBeacon(beacon) {

    this.beacon = '';
    if (beacon) {
      this.beaconlist.push(beacon);

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
    if (this.deletedbeacon.length > 0) {
      this.deletedbeacon = this.deletedbeacon.filter(elem => elem !== beacon._id) || [];
    }
  }

  async assignResident(item) {
    //this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    if (this.paramId) {
      //if (this.zone.ready_to_move == true) {
      if (item) {
        this.resident = '';
        this.residentlist.push(item);
        //this.zone.ready_to_move = false;
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
      // } else {
      //   this.resident = '';
      //   this.toastr.warning('Please make zone ready to move-in');
      // }
    } else {
      if (item) {
        this.resident = '';
        this.residentlist.push(item);
        //this.zone.ready_to_move = false;
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
    if (this.deletedresident.length > 0) {
      this.deletedresident = this.deletedresident.filter(elem => elem !== item._id) || [];
    }
  }

  async loadBeacons() {
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/view' },
      { zoneId: id }
    )
      .then((result: any) => this.beaconlist = result.data['beacons']);
  }

  async loadResidents() {
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/view' },
      { zoneId: id }
    )
      .then((result: any) => this.residentlist = result.data['residents']);
  }

  checkAlphanum(key) {
    const result = this._commonService.allwoAlphaAndNumAndSpace(key);
    return result;
  }

  async onSubmit(f, zone) {
    let valid = f.form.status;
    zone.room = zone.room.trim();
    if (zone.org === '' || zone.fac === '' || zone.floor === '' || zone.sector === '' || zone.room === '') {
      valid = 'INVALID';
    }

    if (valid === 'VALID') {
      zone['beacons'] = this.beaconlist;
      zone['residents'] = this.residentlist;
      zone['deletedbeacon'] = this.deletedbeacon;
      zone['deletedresident'] = this.deletedresident;
      zone['ready_to_move'] = false;
      if (this.route.params['_value']['floor']) {
        zone['org'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
        zone['fac'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
      } else {
        zone['org'] = this.organization;
        zone['fac'] = this.facility;
      }
      // console.log(payload);
      // return false;
      this._commonService.setLoader(true);
      await this.apiService.apiFn({ type: 'POST', target: 'zones/add' }, zone)
        .then((result: any) => {
          if (result.status) {
            this.toastr.success(result.message);
            this._commonService.setLoader(false);
            this.router.navigate(['/zones']);
          } else {
            this._commonService.setLoader(false);
            if (this.toastr.currentlyActive === 0) this.toastr.error(result.message);
          }
        });
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter zone details');
      }
    }
  }

  onChangeReady(event) {
    this.zone.ready_to_move = event.checked;
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
    //dialogConfig.disableClose = true;
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
            const index = this.beaconlist.findIndex(item => item._id == beacon._id);
            const index1 = this.beacons.findIndex(item => item._id == beacon._id);
            if (index > -1) {
              this.beaconlist[index]['name'] = beacon.name;
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
        .catch((error) => this._commonService.setLoader(false));
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
      .catch((error) => this._commonService.setLoader(false));
  }

  prependZeros(num) {
    const str = ('' + num);
    return str.padStart(6, '0');
  }

  async unassignenfcs() {
    const payload1 = {
      // zoneId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']),
      org: typeof (this.zone['org']) === 'object' ? this.zone['org']['_id'] : this.zone['org'] ? this.zone['org'] : this.organization
      ,
      fac: typeof (this.zone['fac']) === 'object' ? this.zone['fac']['_id'] : this.zone['fac'] ? this.zone['fac'] : this.facility
    };
    await this.apiService.apiFn({ type: 'POST', target: 'nfc/unassigned' }, payload1)
      .then((result1: any) => this.nfclist = result1.data);
  }

  async assignNFC(nfc) {
    this.nfc = '';
    if (nfc) {
      this.assignNFClist.push(nfc);
      this.zone.nfc = this.assignNFClist;

      for (let i = 0; i < this.nfclist.length; i++) {
        if (this.nfclist[i]._id === nfc._id) {
          this.nfclist.splice(i, 1);
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
        if (result.status == true && result.type == "Success") {
          this.deletednfc.push(nfc._id);
          this.nfclist.push(nfc);
          for (let i = 0; i < this.assignNFClist.length; i++) {
            if (this.assignNFClist[i]._id === nfc._id) {
              this.assignNFClist.splice(i, 1);
            }
          }
          for (let i = 0; i < this.zone.nfc.length; i++) {
            if (this.zone.nfc[i]._id === nfc._id) {
              this.zone.nfc.splice(i, 1);
            }
          }
          this.toastr.success('NFC unassigned successfully');
        } else {
          this.toastr.error(result.message);
        }
      });
  }
}

