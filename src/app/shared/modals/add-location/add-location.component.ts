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
  selector: 'app-add-location',
  templateUrl: './add-location.component.html',
  styleUrls: ['./add-location.component.scss'],
})
export class AddLocationComponent implements OnInit {
  location: any = {
    name : '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip:null,
    room: [],
    onGround: false
  }
  roomName = '';
  isAddRoom: boolean = false;
  isEdit: boolean = false;
  organization;
  facility;
  private subscription: Subscription;

  dialogConfig = new MatDialogConfig();
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddLocationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      if (data.location) {
        // take id from data
        const location_id = data.location._id;
        if (location_id) {
          this.isEdit = true;
          // fetch that hospital add populate it
          this.location = data.location;
          this.location.room = data.location.room;
          console.log('this.location', this.location);
        }
      }
    }
  }

  ngOnInit() {
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
      }
    );
  }

  removeRoom(room){
    if(room){
      const _foundIndex = this.location.room.findIndex(r => r == room);
      if(_foundIndex > -1){
        this.location.room.splice(_foundIndex, 1);
        this.toastr.success("Room deleted successfully");
      }
    }
  }

  addRoom(){
    this.isAddRoom = true
  }

  addMoreRoom(){
    if(!this.roomName){
      this.toastr.error("Please enter room name");
    }
    else {
      this.location.room.push(this.roomName);
      this.roomName = '';
    }
  }


  cancelForm() {
    // this._dialogRef.close();
    console.log("cancel", this.location);
    this._dialogRef.close({ status: true, location: this.location });
  }

  Location() {
    const location: any = {
    name : '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip:null,
    room: [],
    onGround: false
    };
    return location;
  }

  async onSubmit(location) {
    if (this.location.name == '' ) {
      this.toastr.error(`Location name can't be empty `);
      return;
    }
    if (this.location.phone == '' ) {
      this.toastr.error(`Phone can't be empty `);
      return;
    }
    if (this.location.line1 == '' ) {
      this.toastr.error(`Address 1 can't be empty `);
      return;
    }
    if (this.location.line2 == '' ) {
      this.toastr.error(`Address 2 can't be empty `);
      return;
    }
    if (this.location.city == '' ) {
      this.toastr.error(`City can't be empty `);
      return;
    }
    if (this.location.state == '' ) {
      this.toastr.error(`State can't be empty `);
      return;
    }
    if (this.location.zip == '' || this.location.zip == null ) {
      this.toastr.error(`Zip code can't be empty `);
      return;
    }
    this.commonService.setLoader(true);
    let vaild = location.form.status;
    if (location.name) {
      location.name = location.name.trim();
    }
    if (location.name === '') {
      vaild = 'INVALID';
    }
    // // console.log('vaild---->', vaild);
    // // console.log('cares.form.value---->', cares.form.value);
    if (vaild === 'VALID') {
      let action, payload;
      if(this.isEdit){
        this.isEdit = false;
        action = { type: 'POST', target: 'location/update' };
        payload= {
                _id: this.location._id,
                phone: this.location.phone,
                fac_id: this.facility,
                name: this.location.name,
                line1: this.location.line1,
                line2: this.location.line2,
                city: this.location.city,
                state: this.location.state,
                zip: `${this.location.zip}`,
                room: this.location.room,
                onGround: this.location.onGround
        }
        console.log("Payload----->", payload);
        this._dialogRef.close();
        this.commonService.setLoader(false);
      }
      else{
      action = { type: 'POST', target: 'location/add' };
      
      payload = this.location;
      console.log("Payload----->", payload);
      payload.zip = `${this.location.zip}`
      payload.fac_id = this.facility;
      // console.log(payload)
      }
      
      // console.log('---location---', this.location);
      

      const result = await this.apiService.apiFn(action, payload);
      // console.log(JSON.stringify(result))
      if (result['status'] && result['data']) {
        // console.log(result)
        this.commonService.setLoader(false);
        this.toastr.success(result['message']);
      } else {
        this.commonService.setLoader(false);
        this.toastr.success(result['message']);
      }
      this.location = {
        name : '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        zip:null,
        room: [],
        onGround: false
      }
      this._dialogRef.close();
      this.commonService.setLoader(false);
      // this.toastr.show('Care added successfully')
    } else {
      this.commonService.setLoader(false);
      this.toastr.error('Please enter Location details');
    }

  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

}
