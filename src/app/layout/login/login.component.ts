import { Component, ElementRef, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/app/shared/services/common.service';
import { ApiService } from '../../shared/services/api/api.service';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SupportContactComponent } from './../../shared/modals/support-contact/support-contact.component';
import { PlatformLocation } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
interface AppState {
  _authUser: number;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  dialogConfig = new MatDialogConfig();
  authState: Object;
  loginForm: FormGroup;
  otpControl: FormControl;
  date = new Date();
  loginStage: Number = 1;
  isshowPassword: Boolean;
  sec: any = 0;
  timerValue: any;
  areTenSecsRemainings: boolean = false;
  areOTPexpried: boolean = false;
  id: any;
  otpValue = '';

  constructor(
    private location: PlatformLocation,
    private _router: Router,
    private _toastr: ToastrService,
    private _apiService: ApiService,
    private _authStore: Store<AppState>,
    public _commonService: CommonService,
    private dialog: MatDialog
  ) {
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', Validators.required)
    });
    this.otpControl = new FormControl('', Validators.required);
  }
  @HostListener("document:keypress", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === "Enter") {
      if (this.loginStage == 2) {
        this.onSubmitOTP();
      }
      else if(this.loginStage == 1){
        this.onSubmit()
      }
    }

  }
  ngOnInit() {
    this.location.onPopState(() => this.loginStage = 1);
    this._authStore.select('authState').subscribe(sub => this.authState = sub);
    if (!this.authState['client_key']) this._router.navigate(['/']);
    if (this.authState['isLoggedin']) {
      this._commonService.setLoader(true);
      this._router.navigate(['/dashboard']);
    }
    this._commonService.setLoader(false);
  }

  ngOnDestroy() {
    if (this.id) clearInterval(this.id);
  }

  setTimer(seconds) {
    let mins = Math.floor(seconds / 60);
    if (seconds < 30) this.areTenSecsRemainings = true;
    seconds -= mins * 60;
    if ((mins == 0 && parseInt(seconds) <= 0) || mins == -1) {
      this.areOTPexpried = true;
      return { 'minutes': 0, 'seconds': 0 };
    } else { this.areOTPexpried = false; }
    return { 'minutes': mins, 'seconds': seconds };
  }

  async onSubmit() {
    this._commonService.setLoader(true);
    if (this.loginForm.valid) {
      this.loginForm.patchValue({
        username: this.loginForm.get('username').value.trim(),
        password: this.loginForm.get('password').value.trim()
      });
      let values = this.loginForm.value;
      values['web'] = true;
      await this._apiService.apiFn(
        { type: 'LOGIN', target: 'login' },
        values
      ).then((result: any) => {
        if (result.status) {
          sessionStorage.setItem('enable_livedashboard', result.data.user.enable_livedashboard);
          sessionStorage.setItem('user_Id', result.data.user._id);
          this.loginStage = 2;
          this._toastr.success('Please enter the OTP sent to your registered work email');
        } else {
          if (this._toastr.currentlyActive === 0) {
            this._toastr.error(result.message);
          }
        }
        if (result['lockedUpto'] != undefined) {
          clearInterval(this.id);
          let dif = new Date(result['lockedUpto']).getTime() - new Date().getTime();
          this.sec = Math.abs(dif / 1000);
          this.timerValue = this.setTimer(this.sec);
          this.id = setInterval(() => {
            this.sec--;
            if (this.sec < 0) {
              clearInterval(this.id);
            }
            this.timerValue = this.setTimer(this.sec);
          }, 1000)
        }
      })
        .catch((error: any) => {
          this._toastr.error(error.message);
        });
    }
    this._commonService.setLoader(false);
  }

  otpEntered(event) {
    this.otpValue = event.target.value.toString();
    if (this.otpValue && this.otpValue.length === 6) {
      this.onSubmitOTP();
    }
  }

  async onSubmitOTP() {
    if (this.otpControl.valid) {
      this._commonService.setLoader(true);
      await this._apiService.apiFn(
        { type: 'OTP', target: 'users/otp' },
        { otp: parseInt(this.otpControl.value) }
      ).then((result: any) => {
        if (result.status) {
          this._router.navigate(['./dashboard']);
        } else {
          this.loginStage = 2;
          this._router.navigate(['./']);
          if (this._toastr.currentlyActive === 0) {
            this._toastr.error(result['message']);
          }
        }
      })
        .catch((error: any) => {
          this._toastr.error(error.message);
        });
      this._commonService.setLoader(false);
    }
  }

  async resentOTP() {
    this._commonService.setLoader(true);
    await this._apiService.apiFn(
      { type: 'POST', target: 'users/resendotp' },
      'resendotp'
    ).then((result: any) => {
      if (result.status) {
        this._toastr.success('OTP successfully resent on your work email');
      } else {
        this._toastr.error('Unable to send email. Please try again later.');
      }
    })
      .catch((error) => {
        this._toastr.error('Unable to send email. Please try again later.');
      });
    this._commonService.setLoader(false);
  }

  showPassword() {
    this.isshowPassword = !this.isshowPassword;
    const x = document.getElementById('showpass');
    x['type'] = x['type'] === 'password' ? x['type'] = 'text' : x['type'] = 'password';
  }

  openDialog() {
    const dialogRef = this.dialog.open(SupportContactComponent, {
      width: '670px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      }
    });
  }
}