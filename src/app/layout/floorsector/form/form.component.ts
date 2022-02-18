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
  floorsectorForm: FormGroup;
  organiz; faclist; inputImage;
  private subscription: Subscription;
  constructor(private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService) { }
  floorlist;
  isEdit = false;
  floorsector = {
    _id: null,
    organization: '',
    fac_id: '',
    floor: '',
    sector: '',
    floorplan: ''
  };
  paramId; facilityId;
  newsector;
  floor_fac;
  sectorArr = [];
  privilege: string = 'add';

  async ngOnInit() {
    if (!this._commonService.checkAllPrivilege('Floors/Sectors')) {
      this.router.navigate(['/']);
    }
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.floorsector.organization = contentVal.org;
        this.floorsector.fac_id = contentVal.fac;
        this.floor_fac = contentVal.fac;
        if (this.route.params['_value']['id'] && this.route.params['_value']['id'] !== '0') {
          this.isEdit = true;
          this.privilege = 'edit';
          this._commonService.setLoader(true);
          this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
          const action1 = { type: 'POST', target: 'floorsector/view' };
          const payload1 = { floorId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
          const result1 = await this.apiService.apiFn(action1, payload1);
          this.floorsector = result1['data'];
          this.newsector = '';
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

  cancel() {
    this.router.navigate(['./floorsector']);
  }

  async submit(f, floorsector, type) {
    let valid = f.form.status;
    if (!floorsector._id) {
      if (floorsector.sector.length === 0 && this.sectorArr && !this.sectorArr.length) {
        valid = 'INVALID';
      }
    }

    if (valid === 'VALID') {
      floorsector.sector = this.sectorArr.length ? this.sectorArr : floorsector['sector'];
      this._commonService.setLoader(true);

      if (this.route.params['_value']['org']) {
        this.floorsector.organization = floorsector.organization = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
        // floorsector.organization = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
      }

      if (this.route.params['_value']['fac']) {
        this.floorsector.fac_id = floorsector.fac_id = this._aes256Service.decFnWithsalt(this.route.params['_value']['fac']);
        floorsector.fac_id = this.floorsector.fac_id;
      }
      floorsector.organization = this.route.params['_value']['org'] ? this._aes256Service.decFnWithsalt(this.route.params['_value']['org']) : this.floorsector.organization
      floorsector.floor_fac = this.floor_fac;
      const action = { type: 'POST', target: 'floorsector/add' };
      const payload = floorsector;

      const result = await this.apiService.apiFn(action, payload);
      this._commonService.setLoader(false);
      if (result['status']) {
        this.toastr.success(result['message']);
        this.floorlist = result['floorlist'].map(function (obj) {
          const rObj = {};
          rObj['label'] = obj.floor;
          rObj['value'] = obj._id;
          rObj['sector'] = obj.sector;
          return rObj;
        });
        this._commonService.setFloor(this.floorlist);

        this.facilityFloorUpdated(floorsector.organization,this.floor_fac)

       

        if (type === 0) {
          this.router.navigate(['/floorsector']);
        } else {
          if (this.route.params['_value']['org']) {
            // tslint:disable-next-line: max-line-length
            this.router.navigate(['/zones/form', 0, this.route.params['_value']['org'], this.route.params['_value']['fac'], this._aes256Service.encFnWithsalt(result['data']['_id']), this._aes256Service.encFnWithsalt(result['data']['sector'][0]['_id'])]);
          } else {
            // tslint:disable-next-line: max-line-length
            this.router.navigate(['/zones/form', 0, this._aes256Service.encFnWithsalt(this.floorsector.organization), this._aes256Service.encFnWithsalt(this.floorsector.fac_id), this._aes256Service.encFnWithsalt(result['data']['_id']), this._aes256Service.encFnWithsalt(result['data']['sector'][0]['_id'])]);
          }
        }
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error(result['message']);
        }
      }
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter floor/sector details');
      }
    }
  }

  async facilityFloorUpdated(org, fac) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'users/set_selected_fac' }, 
      { org: org, fac: fac }
    )
    .then((result: any) => {
     
      this.floorlist = result.data.map(function (obj) {
          const rObj = {};
          rObj['label'] = obj.floor;
          rObj['value'] = obj._id;
          rObj['sector'] = obj.sector;
          return rObj;
      });
      let facilityData = [];
      if(result.facilityData){
          facilityData = result.facilityData
      }
      this._commonService.setOrgFac({ org: org, fac: fac }, this.floorlist, facilityData);
      this._commonService.setFloor(this.floorlist);
     
    });
  }

  async addSector(sector, floor) {
    this.newsector = sector.trim();
    if (this.newsector === '') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter sector to be added');
      }
    } else {
      const compArr = this.floorsector['sector'];
      let arr, newArr;
      arr = JSON.stringify(compArr);
      newArr = JSON.parse(arr);
      if (newArr.some(item => item.name.toLowerCase() === this.newsector.toLowerCase())) {
        this.toastr.error('This sector is already been added');
      } else {
        this.sectorFn(sector, floor);
      }
    }
  }

  async sectorFn(sector, floor) {
    this._commonService.setLoader(true);
    const action = { type: 'POST', target: 'floorsector/add_sector' };
    const payload = { sector: sector, floor: floor };
    const result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      this.loadSector();
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('Sector added successfully');
      }

    } else {
      this.loadSector();
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error((result['message']));
      }
    }
  }

  addSectorNew(sector) {
    this.floorsector['newsector'] = sector.trim();
    if (this.floorsector['newsector'] === '') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter sector');
      }
    } else {
      if (this.sectorArr.length) {
        const op = this.sectorArr.filter(data => (data.name.toLowerCase() === this.floorsector['newsector'].toLowerCase()));

        if (op.length) {
          this.toastr.error('This sector is already been added');
          return false;
        } else {
          this.floorsector['newsector'] !== '' ? this.sectorArr.push({ name: this.floorsector['newsector'] }) : this.sectorArr;
          if (this.toastr.currentlyActive === 0) {
            this.toastr.success('Sector added successfully');
          }
          this.floorsector['newsector'] = '';
          return false;
        }

      } else {
        this.sectorArr.push({ name: this.floorsector['newsector'] });
        if (this.toastr.currentlyActive === 0) {
          this.toastr.success('Sector added successfully');
        }
        this.floorsector['newsector'] = '';
      }
    }
  }

  async removeSectorNew(sector) {
    for (let i = 0; i < this.sectorArr.length; i++) {
      if (this.sectorArr[i].name === sector) {
        this.toastr.success('Sector removed successfully');
        this.sectorArr.splice(i, 1);
      }
    }
    this.floorsector['sector'] = '';
  }

  async removeSector(sector, zone) {
    this._commonService.setLoader(true);
    const action = { type: 'POST', target: 'floorsector/remove_sector' };
    const payload = { sectorId: sector, zoneId: zone };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      await this.loadSector();
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success('Sector removed successfully');
      }
    }
  }

  async loadSector() {
    if (this.route.params['_value']['id']) {
      const action1 = { type: 'POST', target: 'floorsector/view' };
      const payload1 = { floorId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
      const result1 = await this.apiService.apiFn(action1, payload1);
      this.floorsector['sector'] = result1['data']['sector'];
      this.newsector = '';
      this._commonService.setLoader(false);
    }
  }

  allwoAlphaAndNum(key) {
    const result = this._commonService.allwoAlphaAndNum(key);
    return result;
  }

}
