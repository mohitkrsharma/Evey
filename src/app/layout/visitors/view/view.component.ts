import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  visitor;
  id;
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
    const action = { type: 'POST', target: 'questionnaire/view' };
    const payload = { questionnaireId: this.id };
    const result = await this.apiService.apiFn(action, payload);

   // console.log("result >>>", result)
    this.visitor = result['data'];
     this._commonService.setLoader(false);
  }



  cancel() {
    this.router.navigate(['/visitors']);
  }

  dateFormat(date) {
   return moment(date).format('MMMM Do YYYY, hh:mm A');
  }

 
}
