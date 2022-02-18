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
  beacon;
  loader = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private _aes256Service: Aes256Service,
    private _commonService: CommonService
  ) { }

  async ngOnInit() {
    this._commonService.setLoader(true);
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: 'beacons/view' };
    const payload = { beaconId: id };
    const result = await this.apiService.apiFn(action, payload);

    this.beacon = result['data'];
    if (result['data']['floor'] && result['data']['floor']['sector'] && result['data']['floor']['sector'].length) {
      this.beacon['sector'] = result['data']['floor']['sector'].filter(itm =>
        (itm._id === result['data']['sector']));

    }
    if (this.beacon['sector'] && this.beacon['sector'].length) {
      this.beacon['sector'] = this.beacon['sector'][0].name;
    }
    this._commonService.setLoader(false);
  }

  editBeacon(id) {
    this.router.navigate(['./beacons/edit', this._aes256Service.encFnWithsalt(id) ]);
  }

  cancel() {
    this.router.navigate(['./beacons']);
  }


}
