import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  user;
  id;
  facility;
  islivedashboard;
  sendcount: Number = 0;
  constructor(private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService) { }
  async ngOnInit() {
    // this.user["enable_livedashboard"]= false;
    this._commonService.setLoader(true);
    this.id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    const action = { type: 'POST', target: 'users/view' };
    const payload = { userId: this.id };
    const result = await this.apiService.apiFn(action, payload);
    this.user = result['data'];
    this.islivedashboard = this.user.enable_livedashboard;
    console.log('userrrrr', this.user);
    if (this.user.job_title.position_name.toLowerCase() === 'other') {
      this.user.job_title = this.user.other_job_title;
    } else {
      this.user.job_title = this.user.job_title.position_name;
    }
    this.facility = this.user['facility'].reduce((res, item) => {
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
    this._commonService.setLoader(false);

    this.facility.fac = this.facility.fac.toString();
    this.facility.fac = this.facility.fac.replace(/,/g, ', ');
  }

  editUser(id) {
    this.router.navigate(['/users/form', this._aes256Service.encFnWithsalt(id) ]);
  }

  cancel() {
    this.router.navigate(['/users']);
  }

  async sendMail(id) {
    if (this.sendcount === 0) {
      const userId = [ this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) ];
      if (userId.length > 1) {
        this.toastr.error('Sorry you are not send mail');
      } else {
        this._commonService.setLoader(true);
        const action = {
          type: 'POST',
          target: 'users/email'
        };
        const payload = { userIds: userId };
        const result = await this.apiService.apiFn(action, payload);
        this._commonService.setLoader(false);
        if (result['status'] === true) {
          if (this.toastr.currentlyActive === 0) {
            this.toastr.success(result['message']);
          }
          this.sendcount = 1;
        } else {
          if (this.toastr.currentlyActive === 0) {
            this.toastr.success(result['message']);
          }
        }
      }
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('You already sent the invitation');
      }
    }
  }

  async onChangelivedashboard(e) {
    const userlist = [];
    userlist.push(this.id);
    const action = { type: 'POST', target: 'users/user_enable_live' };
    const payload = { 'userList': userlist, value: e.checked };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message']);
    } else {
      this.toastr.error(result['message']);
    }
  }
}
