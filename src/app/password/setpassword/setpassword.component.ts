import { Component, OnInit,OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Aes256Service } from '../../shared/services/aes-256/aes-256.service';
import { ApiService } from '../../shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { Subscription } from 'rxjs/Rx';
@Component({
  selector: 'app-setpassword',
  templateUrl: './setpassword.component.html',
  styleUrls: ['./setpassword.component.scss']
})
export class SetpasswordComponent implements OnInit,OnDestroy {
  subscription: Subscription = new Subscription();
  isSubmitted: Boolean;
  setotpform: Boolean = true;
  setpwdform: Boolean = false;
  setphraseform: Boolean = false;
  setNewPassword = {
    password: '',
    conpassword: '',
    securityphrase: '',
    consecurityphrase: ''
  };
  userId;
  otp;
  validUpTo;
  isshowPassword: Boolean;
  passwordNotMatch: boolean;
  securityphraseNotMatch: boolean;
  sec=0;
  timerValue: any;
  areTenSecsRemainings:boolean=false;
  id: any;
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
      this.userId = this.aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      this.validUpTo = this.aes256Service.decFnWithsalt(this.route.params['_value']['valid_upto']);
    

      let t1 = new Date(this.validUpTo);
      let t2 = new Date();    
      let dif = t1.getTime() - t2.getTime();
      
      let Seconds_from_T1_to_T2 = dif / 1000;
      this.sec = Math.abs(Seconds_from_T1_to_T2);
      this.timerValue =this.setTimer(this.sec);           
      this.id =setInterval(()=>{      
      this.sec--; 

      if(this.sec<0){
        this.toastr.error("Otp has been expired.");
        this.router.navigate(['']);
      }
      this.timerValue =this.setTimer(this.sec);       
     },1000)  
    }

  }
  ngOnDestroy() {
   
    if (this.id) {
      clearInterval(this.id);
    }
  }

  setTimer(seconds){
    let remainingSecs = seconds;   
    let mins = Math.floor(seconds / 60);
    seconds -= mins * 60;
    if (remainingSecs < 120) this.areTenSecsRemainings = true
    let res = {      
      'minutes': mins,
      'seconds': seconds
    }
    return res;
  }



  async onOtpSubmit(f, setNewPassword) {
    let vaild = f.form.status;
    setNewPassword.otp = setNewPassword.otp.trim();



    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'users/checkpassword'
    };
    const payload = {
      'username':this.userId,
      'otp': setNewPassword.otp
    };
  
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.success(result['message']);
      }
      this.otp=setNewPassword.otp;
      this.setotpform = false;
      this.setphraseform = false;
      this.setpwdform = true;
    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error(result['message']);
      }
    }
    this._commonService.setLoader(false);

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
      
       this.setotpform = false;
       this.setphraseform = true;
       this.setpwdform = false;
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
          'username': this.userId,
          'otp': this.otp,
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
