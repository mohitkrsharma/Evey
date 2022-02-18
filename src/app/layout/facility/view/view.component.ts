import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from './../../../shared/services/api/api.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { CommonService } from './../../../shared/services/common.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  facility;
  loader = false;
  constructor(private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private _aes256Service: Aes256Service,
    private _commonService: CommonService,
    private _location: Location) { }

  async ngOnInit() {
    this._commonService.setLoader(true);
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: 'facility/view' };
    const payload = { facilityId: id };
    const result = await this.apiService.apiFn(action, payload);
    this.facility = result['data'];
    this._commonService.setLoader(false);
  }

  editFacility(id) {
    this.router.navigate(['/facility/form', this._aes256Service.encFnWithsalt(id) ]);
  }

  cancel() {
    this._location.back();
  }


}
