import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Item } from 'angular2-multiselect-dropdown';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { Aes256Service } from '../../services/aes-256/aes-256.service';
@Component({
  selector: 'app-add-recipient',
  templateUrl: './add-recipient.component.html',
  styleUrls: ['./add-recipient.component.scss'],
})
export class AddRecipientComponent implements OnInit {
  isContact: boolean = false;
  isPhysician: boolean = false;
  isPharmacy: boolean = false;

  selectedPharmacies: any;
  selectedPhysicians: any;
  selectedHospitals: any;

  pharmacyList = [];
  physicianList = [];
  hospitalList:any = [];
  pharmacySearch = '';
  hospitalSearch = '';
  pagiPayload = {
    moduleName:'physicianList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
    organization: '',
    facility: '',
  };
  apiPayload: { org_id: any; fac_id: any; care_type: string[]; };

  residentId = '';
  organization = '';
  facility = '';

  private subscription: Subscription;

  dialogConfig = new MatDialogConfig();
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private _aes256Service: Aes256Service,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddRecipientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
  }

  async ngOnInit() {
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
        }
      }
    );
    if(this.data){
      if(this.data.selectedPharmacies){
        this.selectedPharmacies = this.data.selectedPharmacies;
      }
      if(this.data.selectedPhysicians){
        this.selectedPhysicians = this.data.selectedPhysicians;
      }
      if(this.data.selectedHospitals){
        this.selectedHospitals = this.data.selectedHospitals;
      }
    }
    await this.getPharmacy();
    await this.getPhysicianList();
    await this.getHospitalList();

  }

  async getPharmacy(){
    console.log('here')
    const action = {
     type: 'GET', target: 'residents/pharmacy_list' 
    }
    const result = await this.apiService.apiFn(action,{})
 
    console.log('result',result)
    this.pharmacyList = result['data']['_pharmacy'];
  }

  async getHospitalList() {
    this.commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'hospital/list',
    };
    const payload = this.pagiPayload;

    let result = await this.apiService.apiFn(action, payload);
    console.log("Hospital list---", result);

    if (result && result['data']) {
      this.hospitalList = result['data'];
    }
    this.commonService.setLoader(false);
  }

  async getPhysicianList() {
    this.commonService.setLoader(true);
    let action = {
      type: 'GET',
      target: 'physician/list',
    };
    let payload = this.pagiPayload;

    let result = await this.apiService.apiFn(action, payload);

    console.log(result);

    if (result['status']) {
      if (
        (!result['data'] || result['data'].length < 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        //this.paginator.previousPage();
      } else {
        //this.hasNextPage = result['isNextPage'];
        result['data'] = result['data'].map((e) => ({
          _id: e._id,
          name:
            e.first_name && e.last_name
              ? `${e.last_name}, ${e.first_name}`
              : '-',
          practice_name: e.practice_name ? e.practice_name : '-',
          medical_profession_type: e.medical_profession_type
            ? e.medical_profession_type
            : '-',
          state: e.state ? e.state : '-',
          city: e.city ? e.city : '-'
        }));

        this.physicianList = result['data'];
      }
    }
    this.commonService.setLoader(false);
  }

  cancelRecipient(f) {
    this._dialogRef.close();
    f.form.reset();
  }

  async addRecipient(f, recipient) {
    this.commonService.setLoader(true);

    // console.log('physician form value---->', f.form.value);
    // console.log('physician details---->', physician);

    // if (form_status === 'VALID') {

    //   if (this.phoneArr[0].value != '') {
    //     recipient.phone_numbers.unshift(this.phoneArr[0]);
    //   }
    //   if (recipient.credential) {
    //     if (recipient.credential == "Credentialed") {
    //       recipient.isCredentialeChecked = true;
    //     }
    //     else if (recipient.credential == "Sanctioned") {
    //       recipient.isSanctionedChecked = true;
    //     }
    //   }
    //   delete recipient.credential;

     
    //   recipient.fac_id = this.facility;
    //   if (recipient.phone_numbers && recipient.phone_numbers.length) {
    //     recipient.phone_numbers.forEach((e) => delete e.id);
    //   }
    //   const action = {
    //     type: 'POST',
    //     target: 'residents/add_prescriber',
    //   };

    //   const payload = recipient;
    //   // console.log('payload--->', payload);
    //   if (
    //     (this.resident_id && this.resident_id !== '') ||
    //     (recipient._id && recipient._id !== '')
    //   ) {
    //     const result = await this.apiService.apiFn(action, { data: payload });

    //     if (result) {
    //       this.toastr.success(
    //         this.isEdit
    //           ? 'Physician updated successfully'
    //           : 'Physician added successfully'
    //       );
    //     } else {
    //       this.toastr.error('Something went wrong, Please try again.');
    //     }
    //     this._dialogRef.close({ status: true, physician: result });
    //   } else {
    //     let data = JSON.stringify(recipient);
    //     recipient = JSON.parse(data);
    //     this._dialogRef.close({ status: true, recipient: recipient });
    //   }
    //   f.form.reset();
    //   this.contact_type_physician = [
    //     { name: 'Home' },
    //     { name: 'Office' },
    //     { name: 'Fax' },
    //     { name: 'Other' },
    //   ];
    //   this.home_physician = false;
    //   this.office_physician = false;
    //   this.fax_physician = false;
    //   this.other_physician = false;
    //   this.openOtherDeatils = false;
    // } else if (form_status == 'INVALID') {
    //   if (this.toastr.currentlyActive === 0) {
    //     if(this.recipient.first_name && (!this.recipient.last_name && !this.recipient.practice_name)){
    //       this.toastr.error('Please enter Last Name or Practice Name');
    //     }
    //     else {
    //       this.toastr.error('Please enter valid physician details');
    //     }
    //   }
    // }

    this.commonService.setLoader(false);
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  pharmacy(){
    this.isPhysician = false;
    this.isContact = false;
    this.isPharmacy = true;
  }

  physician(){
    this.isContact = false;
    this.isPharmacy = false;
    this.isPhysician = true;
  }

  contact(){
    this.isPharmacy = false;
    this.isPhysician = false;
    this.isContact = true;
  }

  cancelAll(){
    this.isPharmacy = false;
    this.isPhysician = false;
    this.isContact = false;
  }

  add(){
    this._dialogRef.close( { selectedPharmacies: this.selectedPharmacies, selectedPhysicians: this.selectedPhysicians, selectedHospitals: this.selectedHospitals });
  }
}