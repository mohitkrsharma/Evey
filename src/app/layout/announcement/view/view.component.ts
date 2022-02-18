import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  announcement;
  id;
  facility;
  sendcount: Number = 0;
  constructor(private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) { }

  async ngOnInit() {
    this._commonService.setLoader(true);
    this.id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: 'announcement/view' };
    const payload = { announceId: this.id };
    const result = await this.apiService.apiFn(action, payload);
    this.announcement = result['data'];

    this.facility = this.announcement['facility'].reduce((res, item) => {
      if (!res.org.includes(item.org.org_name)) {
        res.org.push(
          item.org.org_name
        );
      }
      if (!res.org.includes(item.fac.fac_name)) {
        res.fac.push(
          item.fac.fac_name
        );
      }
      return res;
    }, { fac: [], org: [] });

    this.facility.fac = this.facility.fac.toString();
    this.facility.fac = this.facility.fac.replace(/,/g, ', ');
    this._commonService.setLoader(false);
  }

  editUser(id) {
    this.router.navigate(['/announcement/form', this._aes256Service.encFnWithsalt(id) ]);
  }

  cancel() {
    this.router.navigate(['/announcement']);
  }

  async onChangeActive(event, announce_id) {
    const announceslist = [];
    announceslist.push(announce_id);
    const action = { type: 'POST', target: 'announcement/enable' };
    const payload = { 'announcesList': announceslist, value: event.checked };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message']);
    } else {
      this.toastr.error(result['message']);
    }
  }

}
