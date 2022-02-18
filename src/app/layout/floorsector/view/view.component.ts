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

  constructor(private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private _aes256Service: Aes256Service,
    private _commonService: CommonService
  ) { }

  floorsector;
  loader = false;
  async ngOnInit() {
    this._commonService.setLoader(true);
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: 'floorsector/view' };
    const payload = { floorId: id };
    const result = await this.apiService.apiFn(action, payload);

    this.floorsector = result['data'];
    this.floorsector['sector'] = this.floorsector['sector'].map(itm => itm.name).toString();
    this.floorsector['totalzones'] = result['data']['totalzones'];
    this._commonService.setLoader(false);
  }

  editFloorsector(id) {
    this.router.navigate(['./floorsector/form', this._aes256Service.encFnWithsalt(id)]);
  }

  cancel() {
    this.router.navigate(['/floorsector']);
  }

}
