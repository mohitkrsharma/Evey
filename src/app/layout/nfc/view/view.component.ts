import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { CommonService } from './../../../shared/services/common.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})

export class ViewComponent implements OnInit {
  nfcObj;
  id;
  nfc;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) {
  }

  async ngOnInit() {
    this._commonService.setLoader(true);
    this.id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: 'nfc/view' };
    const payload = { nfcId: this.id };
    const result = await this.apiService.apiFn(action, payload);
    this.nfc = result['data'];
    console.log(this.nfc);
    // return false;
    if(this.nfc.resident == null){
      this.nfc.resident = '';
    }
    let sec;
    if (result['data'].floor && result['data'].floor.sector) {
      sec = result['data'].floor.sector.filter(it => it._id === result['data'].sector);
      if (sec.length) {
        sec = sec[0].name ? sec[0].name : '--';
      }
    }
    this.nfc['sector'] = result['data'].floor && result['data'].floor.sector.length ? sec : '--';
    this._commonService.setLoader(false);
  }

 async editNFC(id) {
   await this.router.navigate(['/nfc/form', this._aes256Service.encFnWithsalt(id)]);
  }

  cancel() {
    this.router.navigate(['/nfc']);
  }

}
