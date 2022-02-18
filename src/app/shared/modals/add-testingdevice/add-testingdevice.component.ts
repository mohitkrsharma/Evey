import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-add-testingdevice',
  templateUrl: './add-testingdevice.component.html',
  styleUrls: ['./add-testingdevice.component.scss'],
})
export class AddTestingDeviceComponent implements OnInit {
  testingDevice: any = {
    name: '',
    fac_id: ''
  };
  facility;
  isEdit = false;
  private subscription: Subscription;

  dialogConfig = new MatDialogConfig();
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddTestingDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
  }

  ngOnInit() {
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.facility = contentVal.fac;
        }
      }
    );

    if (this.data) {
      if (this.data.testingDevice) {
        // take id from data
        console.log(this.data);
        const device_id = this.data.testingDevice._id;
        if (device_id) {
          this.isEdit = true;
          // fetch that testing device add populate it
          this.testingDevice = this.data.testingDevice;
          console.log('this.testingdevice', this.testingDevice);
        }
      }
    }
  }


  cancelDevice(f) {
    // this._dialogRef.close();
    console.log("cancel", this.testingDevice);
    this._dialogRef.close();
    // f.form.reset();
    //this.testingDevice = this.TestingDevice();
  }

  TestingDevice() {
    const testingDevice: any = {
      name: '',
      fac_id: ''
    };
    return testingDevice;
  }

  async addTestingDevice(f, device) {
    this.commonService.setLoader(true);
    let form_status;

    if (
      !this.testingDevice.name
    ) {
      f.form.status = 'INVALID';
      form_status = f.form.status;
    } else {
      f.form.status = 'VALID';
      form_status = f.form.status;
    }

    // console.log('hospital form value---->', f.form.value);
    // console.log('hospital details---->', hospital);

    if (form_status === 'VALID') {
      console.log("Facility----",this.facility);
      
      let result;

      device.fac_id = this.facility;

      if(this.data && this.data.testingDevice && this.data.testingDevice._id){
        device['_id'] = this.data.testingDevice._id;
        const action = {
          type: 'POST',
          target: 'device/update',
        };
  
        const payload = device;
        console.log('payload--->', payload);
        result = await this.apiService.apiFn(action, payload);
        console.log("result--->", result);
      }
      else {
        const action = {
          type: 'POST',
          target: 'device/add',
        };
  
        const payload = device;
        // console.log('payload--->', payload);
        result = await this.apiService.apiFn(action, payload);
        console.log("result--->", result);
      }
      

      if (result) {
        this.toastr.success(
          this.isEdit
            ? 'Testing Device updated successfully'
            : 'Testing Device added successfully'
        );
      } else {
        this.toastr.error('Something went wrong, Please try again.');
      }
      this._dialogRef.close({ status: true, testingDevice: result['data'] });
    } else if (form_status === 'INVALID') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid device details');
      }
    }

    this.commonService.setLoader(false);
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

}
