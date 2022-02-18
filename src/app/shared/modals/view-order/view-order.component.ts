import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { Aes256Service } from '../../services/aes-256/aes-256.service';

@Component({
  selector: 'app-view-order',
  templateUrl: './view-order.component.html',
  styleUrls: ['./view-order.component.scss'],
})

export class ViewOrderComponent implements OnInit {

  pdfURL = '';
  zoomValue = 1;
  orderData: any;
  dialogConfig = new MatDialogConfig();
  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _dialogRef: MatDialogRef<ViewOrderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      // console.log('data--->', data);
      this.orderData = data;
      this.pdfURL = data.fileUrl;
      // tslint:disable-next-line:max-line-length
      // this.pdfURL = 'https://elasticbeanstalk-us-east-2-798593836064.s3.us-east-2.amazonaws.com/etherFaxes/60a7ac5ec13b7b1dd2ee3036/5dd5cc79956a0c5d44bb9723/medications/etherfax-1623060947163.PDF';
    }
  }

  ngOnInit() {
  }

  zoomOut() {
    if (this.zoomValue > 0) {
      this.zoomValue -= 0.5;
    } else {
      this.toastr.warning('You have zoomed out to max level.', 'Zoom Out');
    }
  }

  zoomIn() {
    if (this.zoomValue < 4) {
      this.zoomValue += 0.5;
    } else {
      this.toastr.warning('You have zoomed in to max level.', 'Zoom In');
    }
  }

  addMedication() {
    this._dialogRef.close();
    const residentId = this._aes256Service.encFnWithsalt(this.orderData.residentId);
    const orderId = this._aes256Service.encFnWithsalt(this.orderData._id);
    const navigateLink = '/residents/form/' + residentId + '/add_order';
    this.router.navigate([navigateLink], { queryParams: {
                                                          orderId: orderId,
                                                          residentId: residentId
                                                        }
                                                }
                        );

  }

  async delete() {
    //const orderId = this._aes256Service.encFnWithsalt(this.orderData._id);
    this._commonService.setLoader(true);
      const payload = {
        id: this.orderData._id,
        restore_data: false
      };
      const action = {
        type: 'POST',
        target: 'residents/delete_res_order',
      };
      const result = await this.apiService.apiFn(action, payload);
      console.log("After Delete Result",result)
      if (result['status']) {
        this._commonService.setLoader(false);
      }
      this._dialogRef.close();
      this._commonService.setLoader(false);
  }

  cancel() {
    this._dialogRef.close();
  }

}
