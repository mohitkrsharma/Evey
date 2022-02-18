import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Aes256Service } from '../../shared/services/aes-256/aes-256.service';
import { ApiService } from '../../shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-setnewpassword',
  templateUrl: './setnewpassword.component.html',
  styleUrls: ['./setnewpassword.component.scss']
})
export class SetnewpasswordComponent implements OnInit {
  isSubmitted: Boolean;

  setpwdform: Boolean = true;
  setphraseform: Boolean = false;
  setNewPassword = {
    password: '',
    conpassword: '',
    securityphrase: '',
    consecurityphrase: ''
  };
  paramId;
  isshowPassword: Boolean;
  passwordNotMatch: boolean;
  securityphraseNotMatch: boolean;
  constructor(
    private aes256Service: Aes256Service,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private apiService: ApiService,
    public _commonService: CommonService
  ) { }

  ngOnInit() {
    if (this.route.params['_value']['id']) {
      this.paramId = this.aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    }

  }

  async onSubmit(f, setNewPassword) {
    let vaild = f.form.status;
    if (this.setNewPassword.password === this.setNewPassword.conpassword) {
      this.passwordNotMatch = false;
    } else {
      this.passwordNotMatch = true;
      vaild = 'INVALID';
    }

    setNewPassword.password = setNewPassword.password.trim();
    if (setNewPassword.password === '') {
      vaild = 'INVALID';
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please fill details...');
      }
    }
    if (vaild === 'VALID') {
      if (!this.passwordNotMatch) {
        this._commonService.setLoader(true);
        const action = {
          type: 'POST',
          target: 'users/checkpassword'
        };
        const payload = {
          'tmp_password':this.route.params['_value']['id'],
          'password': this.setNewPassword.password
        };
      
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          if (this.toastr.currentlyActive === 0) {
            this.toastr.success(result['message']);
          }
          this.setphraseform = true;
          this.setpwdform = false;
        } else {
          if (this.toastr.currentlyActive === 0) {
            this.toastr.error(result['message']);
          }
        }
        this._commonService.setLoader(false);
      }
    }
  }

  async onSubmitSF(f, setNewPassword) {

    let vaild = f.form.status;
    if (this.setNewPassword.securityphrase === this.setNewPassword.consecurityphrase) {
      this.securityphraseNotMatch = false;
    } else {
      this.securityphraseNotMatch = true;
      vaild = 'INVALID';
    }
    setNewPassword.securityphrase = setNewPassword.securityphrase.trim();
    if (setNewPassword.securityphrase === '') {
      vaild = 'INVALID';
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please fill details...');
      }
    }
    if (vaild === 'VALID') {
      if (!this.securityphraseNotMatch) {
        const action = {
          type: 'POST',
          target: 'users/setpassword'
        };
        const payload = {
          'tmp_password': this.route.params['_value']['id'],
          'password': this.setNewPassword.password,
          'securityphrase': this.setNewPassword.securityphrase
        };
        const result = await this.apiService.apiFn(action, payload);
       
        if (result['status']) {

          if(result['data'] !== 'ios') {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.success(result['message']);
            }
            this.router.navigate(['']);
          } else {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.success('Your login has been reset. You may return to the app.');
            }
          }

        } else {
          if (this.toastr.currentlyActive === 0) {
            this.toastr.error(result['message']);
          }
        }

      }
    }
  }

  async corrCheEmail(e) {
    if (this.setNewPassword.password === e.target.value) {
      this.passwordNotMatch = false;
    } else {
      this.passwordNotMatch = true;
    }
  }

  showPassword() {
    const x = document.getElementById('showpass');
    if (x['type'] === 'password') {
      x['type'] = 'text';
      this.isshowPassword = true;
    } else {
      x['type'] = 'password';
      this.isshowPassword = false;
    }
  }

  checkAlpha(key) {
    const result = this._commonService.notAllwoSpace(key);
    return result;
  }

}
