import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../../../../shared/services/api/api.service';
import {Aes256Service} from '../../../../shared/services/aes-256/aes-256.service';
import {CommonService} from '../../../../shared/services/common.service';
import {ToastrService} from 'ngx-toastr';

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
  unit;

  async ngOnInit() {
    this._commonService.setLoader(true);
    const id = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    await this.apiService.apiFn(
      { type: 'POST', target: 'zones/view' },
      { zoneId: id }
    )
      .then((result: any) => {
        this._commonService.setLoader(false);
        this.unit = result.data;
        // tslint:disable-next-line: max-line-length
        this.unit['total_residents'] = (result.data.residents_id && result.data.residents_id.length) ? result.data.residents_id.length : '0';
        if (result.data['floor'] && result.data['floor']['sector']) {
          this.unit['sector'] = result.data['floor']['sector'].filter(it => it._id === result.data['sector']);
        }

        if (this.unit['sector'] && this.unit['sector'].length) {
          this.unit['sector'] = this.unit['sector'][0]['name'];
        } else {
          this.unit['sector'] = '-';
        }
      })
      .catch((error) => {
        this._commonService.setLoader(false);
        this.toastr.error('Something went wrong, Please try again.');
      });
  }

  editUnit(id) {
    this.router.navigate(['/units/form', this._aes256Service.encFnWithsalt(id) ]).then();
  }

  cancel() {
    this.router.navigate(['/units']).then();
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
