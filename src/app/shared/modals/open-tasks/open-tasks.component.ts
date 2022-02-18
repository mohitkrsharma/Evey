import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from './../../services/common.service';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from './../../../shared/services/api/api.service';
import * as moment from 'moment';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-open-tasks',
  templateUrl: './open-tasks.component.html',
  styleUrls: ['./open-tasks.component.scss']
})
export class OpenTasksComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _commonService: CommonService,
    public _dialogRef: MatDialogRef<OpenTasksComponent>,
    private _aes256Service: Aes256Service,
  ) { }
  open_cares;

  async ngOnInit() { 
     const data1 = this.data.map(
        _ => {
          return {
            ..._,
            start_time: moment(_.ts_total_time.start_time).format('MMMM Do, HH:mm'),
          }
        })
        this.open_cares = data1;
  }

  onNoClick(): void {
    this._dialogRef.close(['result']['status'] = false);
  }

}
