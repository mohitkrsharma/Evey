import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from './../../services/common.service';
import { ToastrService } from 'ngx-toastr';

import { ApiService } from './../../../shared/services/api/api.service';
@Component({
  selector: 'app-support-contact',
  templateUrl: './support-contact.component.html',
  styleUrls: ['./support-contact.component.scss']
})
export class SupportContactComponent implements OnInit {
 flag;
 disable=false;
  constructor( 
    private _apiService: ApiService,
    public _commonService: CommonService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<SupportContactComponent>
  ) { 
    
   
    
  }
  support = {
    subject: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    priority: '',    
    message: '',
  };


 public list_priority: any = [
    { label: 'High', value: 'High', icon: 'arrow_upward' },
    { label: 'Medium', value: 'Medium', icon: 'arrow_upward' },
    { label: 'Low', value: 'Low', icon: 'arrow_downward' }
  ];

  
 checkedValue = null;
  ngOnInit() {
   
  }

  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  onNoClick(): void {
    this._dialogRef.close(['result']['status'] = false);
  }

  async onSubmit(f,support){
    let vaild = f.form.status;
    support.message = support.message.trim();
    support.subject = support.subject.trim();
    if (support.first_name === '' || support.last_name === '' || support.message === '' || support.subject === '') {
      console.log("hhehehh")
      vaild = 'INVALID';
    }

    if (vaild === 'VALID') {
      this._commonService.setLoader(true);
    const action = { type: 'POST', target: 'users/contact_support' };
    const payload =this.support;
    const result = await this._apiService.apiFn(action, payload);
    this._commonService.setLoader(false);
    if (result['status']) {
      this.toastr.success(result['message']);
      
    }
    this._dialogRef.close(result);

    }else{
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter  details');
      }
    }
  }

  

}
