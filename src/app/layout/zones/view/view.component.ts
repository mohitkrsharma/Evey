import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
    private _commonService: CommonService,
    private toastr: ToastrService) { }
  zone;
  
  async ngOnInit() {
    this._commonService.setLoader(true);
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/view' }, 
      { zoneId: id }
    )
    .then((result: any) => {
      this._commonService.setLoader(false);
      this.zone = result.data;
      // tslint:disable-next-line: max-line-length
      this.zone['total_residents'] = (result.data.residents_id && result.data.residents_id.length) ? result.data.residents_id.length : '0';
      if (result.data['floor'] && result.data['floor']['sector']) {
        this.zone['sector'] = result.data['floor']['sector'].filter(it => it._id === result.data['sector']);
      }

      if (this.zone['sector'] && this.zone['sector'].length) {
        this.zone['sector'] = this.zone['sector'][0]['name'];
      } else {
        this.zone['sector'] = '-';
      }
    })
    .catch((error) => {
      this._commonService.setLoader(false);
      this.toastr.error('Something went wrong, Please try again.');
    });
  }

  editZone(id) {
    this.router.navigate(['/zones/form', this._aes256Service.encFnWithsalt(id) ]);
  }

  cancel() {
    this.router.navigate(['/zones']);
  }

  async onChangeReady(id, event) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/ready_to_move' }, 
      { 'zoneId': id, value: event.checked }
    )
    .then((result: any) => {
      if (result.status) {
        this.toastr.success('Ready to move status updated successfully');
      } else {
        this.toastr.error('Ready to move status cannot be updated');
      }
    });
  }
}
