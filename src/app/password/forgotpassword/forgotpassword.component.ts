import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from './../../shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SupportContactComponent } from 'src/app/shared/modals/support-contact/support-contact.component';
import { Aes256Service } from '../../shared/services/aes-256/aes-256.service';
@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotpasswordComponent implements OnInit {
  dialogConfig = new MatDialogConfig();
  date = new Date();
  username;
  // flag: Boolean;
  constructor(
    private _router: Router,
    private _toastr: ToastrService,
    private _apiService: ApiService,
    private _commonService: CommonService,
    private dialog: MatDialog,
    private _aes256Service:Aes256Service
  ) { }

  ngOnInit() {
    this._commonService.setLoader(false);
  }

  login() {
    this._commonService.setLoader(true);
    this._router.navigate(['/']);
  }

  async onSubmit() {
    this.username = this.username ? this.username.trim() : this.username;
    if (this.username) {
      this._commonService.setLoader(true);
      // this.flag = true;
      const action = { type: 'POST', target: 'users/forgot' };
      const payload = {'username': this.username};
      const result = await this._apiService.apiFn(action, payload);
      // this.flag = false;
      this._commonService.setLoader(false);
      if (!result['status']) {
        this._toastr.error(result['message']);
      } else {
        //this._toastr.success('Reset link  send successfully');
        this._toastr.success(result['message']);
       // this._router.navigate(['/']);
        this._router.navigate(['/setNewPassword', this._aes256Service.encFnWithsalt(this.username),this._aes256Service.encFnWithsalt(result['data']['otp_valid_upto'])]);
      }
    } else {
      if (this._toastr.currentlyActive === 0) {
      this._toastr.error('Please enter username');
      }
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(SupportContactComponent, {
      width: '670px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
       // console.log("result>>>>",result)
        
      }
    });
  }
}
