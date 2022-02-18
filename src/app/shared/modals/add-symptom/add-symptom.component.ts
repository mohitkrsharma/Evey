import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
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
  selector: 'app-add-symptom',
  templateUrl: './add-symptom.component.html',
  styleUrls: ['./add-symptom.component.scss'],
})
export class AddSymptomComponent implements OnInit {
  
  credentialToggle = false;
  isCredentialeChecked = false;
  isSanctionedChecked = false;

  public facList = [];
  public facList2 = [];
  public facListDone = [];
  userFacilityList = [];
  showNew = true;
  showPop = true;
  isEdit = false;
  duplicateFacility;
  ismultifac: Boolean = false;
  symptomForm: FormGroup;
  org;
  fac;

  facility;

  multiorg: any;
  isOptionField: boolean;

  symptom: any = {
    name: '',
    is_isolation: false,
    isolation_days: '',
  };

  organization;
  organiz;

  orgDisable: Boolean = false;
  facDisable: Boolean = false;

  addSymptomInput: any = {
    name: '',
    isolation_days: '',
    isCovid: false,
  };

  multifacility: any;
  showfaclist: boolean;

  faclist;

  symptoms: any = {
    organization: '',
    fac: '',
    facility: [],
  };
  addSymptomList = [];
  privilege = 'add';
  orgSearch = '';
  facSearch = '';

  private subscription: Subscription;

  dialogConfig = new MatDialogConfig();
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<AddSymptomComponent>,
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
    await this.userOrganization();
    await this.userFacility();
  }

  async changeOrg(org) {
    this.org = org;
    //  const action  = { type: 'GET', target: 'facility/faclist' };
    //  const payload = { 'org_id': org };
    //  const result  = await this.apiService.apiFn(action, payload);
    //  this.faclist  = result['data'];
    this.symptoms.fac = '';

    const payload2 = { org: org };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
    this.faclist = await result2['data'].map(function (obj) {
      const fObj = {};
      fObj['fac_name'] = obj._id.fac.fac_name;
      fObj['_id'] = obj._id.fac._id;
      return fObj;
    });
    if (this.userFacilityList && this.userFacilityList.length) {
      this.removeAddedFac();
    }
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName;
  }

  changeCovidToggle(event) {
    this.addSymptomInput.isCovid = event.checked;
    // this.enable_covid_toggle = event.checked;
  }

  addOption(addSymptomInput) {
    if (!this.showPop) {
      this.showPop = true;
      return;
    } else {
      if (addSymptomInput.name === '' || addSymptomInput.name === undefined) {
        this.toastr.error('Please enter Symptom name.');
      } else {
        if (addSymptomInput.isCovid && !addSymptomInput.isolation_days) {
          this.toastr.error('Please enter isolation days.');
          return;
        }
        if (
          this.addSymptomList === undefined ||
          this.addSymptomList.length < 1
        ) {
          this.addSymptomList = [
            {
              name: addSymptomInput.name,
              isolation_days: addSymptomInput.isolation_days,
              isCovid: addSymptomInput.isCovid,
            },
          ];
        } else {
          this.addSymptomList.push({
            name: addSymptomInput.name,
            isolation_days: addSymptomInput.isolation_days,
            isCovid: addSymptomInput.isCovid,
          });
        }
        this.addSymptomInput['name'] = '';
        this.addSymptomInput['isolation_days'] = '';
        this.addSymptomInput['isCovid'] = false;
        console.log(' == End ==', this.addSymptomList);
      }
    }
  }

  removeOption(key) {
    if (key) {
      this.addSymptomList.splice(key, 1);
    } else {
      this.showPop = false;
    }
  }

  async changeFac(fac, e) {
    this.fac = fac;
  }

  closeSymptomDialog(): void {
    this.symptoms.organization = '';
    this.symptoms.fac = [];
    this.symptoms.facility = '';
    delete this.symptoms._id;
    this.userFacilityList = [];
    this.facListDone = [];
    this.isEdit = false;
    this.duplicateFacility = false;
    this.isOptionField = false;
    this.addSymptomList = [];
    this._dialogRef.close();
  }

  async saveSymptomDialog(symptoms) {
    if (!this.addSymptomList.length && !this.addSymptomInput.name) {
      this.commonService.setLoader(false);
      this.toastr.error('Please add symptom name.');
      return;
    }
    // if (this.addSymptomInput.isCovid && !this.addSymptomInput.isolation_days) {
    //   this._commonService.setLoader(false);
    //   this.toastr.error('Please add isolation days.');
    //   return;
    // }
    /* Organization/Facility Validation */
    this.duplicateFacility = '';

    //  io-1181 below commented
    //  if(this.showNew){
    //    if (symptoms.organization !== '' && !symptoms._id) {
    //      if(symptoms.fac === '' || symptoms.fac === undefined){
    //        this.toastr.error('Select facility.');
    //        return;
    //      }
    //    }
    //    if(!this.userFacilityList || !this.userFacilityList.length ){
    //      if( symptoms.organization === '' && !symptoms.facility.length){
    //        this.toastr.error('Select organization.');
    //        return;
    //      }
    //    }
    //  }

    if (symptoms.organization !== '' && symptoms.fac !== '') {
      this.addFacilityList(symptoms, true);
    }
    /* End Organization/Facility Validation */
    if (!this.duplicateFacility) {
      if (!this.ismultifac) {
        this.symptoms['facility'] = [
          {
            org: this.org,
            fac: this.fac,
          },
        ];
      } else {
        this.symptoms['facility'] = this.userFacilityList.map((item) => ({
          org: item.org_id,
          fac: item.fac_id,
          selected: item['selected'],
        }));
      }
    }
    let data: any = [];
    if (this.isEdit) {
      if (
        this.addSymptomInput.name === '' ||
        this.addSymptomInput.name === undefined
      ) {
        this.toastr.error('Please enter Symptom name.');
        return;
      }
      if (this.addSymptomInput.isCovid && !this.addSymptomInput.isolation_days) {
        this.commonService.setLoader(false);
        this.toastr.error('Please add isolation days.');
        return;
      }
      data = {
        _id: this.symptom._id,
        name: this.addSymptomInput.name,
        facility: this.symptoms.facility,
        isCovid: this.addSymptomInput.isCovid,
        is_isolation:
          this.addSymptomInput.isolation_days &&
          this.addSymptomInput.isolation_days != ''
            ? true
            : false,
        isolation_days:
          this.addSymptomInput.isolation_days &&
          this.addSymptomInput.isolation_days != ''
            ? this.addSymptomInput.isolation_days
            : 0,
      };
    } else {
      //  console.log('addd--->');
      const nTagIdArray = [];
      for (let i = 0; i < this.addSymptomList.length; i++) {
        if (this.addSymptomList[i].name !== '') {
          const newVar = {
            name: this.addSymptomList[i].name,
            facility: this.symptoms.facility,
            isCovid: this.addSymptomList[i].isCovid,
            isolation_days:
              this.addSymptomList[i].isolation_days &&
              this.addSymptomList[i].isolation_days != ''
                ? this.addSymptomList[i].isolation_days
                : 0,
            is_isolation:
              this.addSymptomList[i].isolation_days &&
              this.addSymptomList[i].isolation_days != ''
                ? true
                : false,
          };
          nTagIdArray.push(newVar);
        }
      }
      if (!nTagIdArray.length && !this.addSymptomInput.name) {
        this.commonService.setLoader(false);
        this.toastr.error('Please add symptom name.');
        return;
      }
      if (this.addSymptomInput.name) {
        const newVar2 = {
          name: this.addSymptomInput.name,
          facility: this.symptoms.facility,
          isCovid: this.addSymptomInput.isCovid,
          isolation_days:
            this.addSymptomInput.isolation_days &&
            this.addSymptomInput.isolation_days != ''
              ? this.addSymptomInput.isolation_days
              : 0,
          is_isolation:
            this.addSymptomInput.isolation_days &&
            this.addSymptomInput.isolation_days != ''
              ? true
              : false,
        };
        nTagIdArray.push(newVar2);
      }
      //  return;
      let checkID: any;
      checkID = {
        ntags: nTagIdArray,
      };
      data = checkID;
      /*let checkData = [];
        let iterator  = data.ntags;
        iterator.forEach(function(item) {
          Object.keys(item).forEach(function(key) {
          checkData.push(item[key]);
          });
        });
        let duplicate      = checkData.filter((s => v => s.has(v) || !s.add(v))(new Set));
        let checkDuplicate = duplicate.filter(x => x).join(', ');
        if(checkDuplicate.length > 0){
         this._commonService.setLoader(false);
         this.toastr.error('Please enter unique NFC tags.');
         return false;
        }             */
    }
    //  console.log('this.symptoms.facility.length--->', this.symptoms.facility.length);
    //  console.log('this.symptoms.facility--->', this.symptoms.facility);
    if (
      this.symptoms &&
      this.symptoms.facility &&
      this.symptoms.facility.length < 2
    ) {
      if (
        this.symptoms.facility[0].org == undefined ||
        this.symptoms.facility[0].fac == undefined
      ) {
        this.commonService.setLoader(false);
        this.toastr.error('Please select org and facility.');
        return;
      }
    }
    /*if ( this.symptomForm.valid &&  this.symptomForm.controls.name.value.trim()!='') {*/
    this.commonService.setLoader(true);
    //  const data = {
    //    '_id': this.symptomForm.controls._id.value,
    //    'name': this.symptomForm.controls.name.value,
    //    'is_isolation': this.symptomForm.controls.is_isolation.value,
    //    'isolation_days': (this.symptomForm.controls.is_isolation.value && this.symptomForm.controls.isolation_days.value!='')?this.symptomForm.controls.isolation_days.value:0,
    //  };

    const action = {
      type: 'POST',
      target: 'symptoms/add',
    };
    const payload = data;
    console.log(' == save payload ==', JSON.stringify(payload)); //  return;
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message']);
      this.addSymptomList = [];
      this._dialogRef.close({ success: true });
      this.commonService.setLoader(false);
    } else {
      this.commonService.setLoader(false);
      this.toastr.error(result['message']);
    }
    //  } else {
    //    this.toastr.error('Please fill all fields');
    //    this._commonService.setLoader(false);
    //  }
  }

  async addFacilityList(symptoms, isFromDone?) {
    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      this.duplicateFacility = false;
      if (
        (symptoms.organization === '' || symptoms.organization === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Select organization');
        return;
      } else if (
        (symptoms.fac === '' || symptoms.fac === undefined) &&
        !isFromDone
      ) {
        this.toastr.error('Select Building');
        this.duplicateFacility = true;
        return;
      } else {
        this.ismultifac = true;
        if (
          this.userFacilityList === undefined ||
          this.userFacilityList.length < 1
        ) {
          this.userFacilityList = [
            {
              org_id: symptoms.organization,
              org_name: this.multiorg,
              fac_id: symptoms.fac,
              fac_name: this.multifacility,
            },
          ];
        } else {
          if (
            this.userFacilityList.some(
              (item) =>
                item.fac_name.toLowerCase().trim() ===
                  this.multifacility.toLowerCase().trim() &&
                item.org_name.toLowerCase().trim() ===
                  this.multiorg.toLowerCase().trim()
            )
          ) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
              this.duplicateFacility = true;
            }
          } else {
            this.userFacilityList.push({
              org_id: symptoms.organization,
              org_name: this.multiorg,
              fac_id: symptoms.fac,
              fac_name: this.multifacility,
            });
          }
        }
        if (this.userFacilityList.length > 0) {
          this.showfaclist = true;
          this.ismultifac = true;
        } else {
          this.ismultifac = false;
          this.showfaclist = false;
        }

        // io-1181 below code commented
        //  if(this.isEdit == true){
        //      this.symptoms['organization'] = '';
        //      this.faclist = [];
        //  }
        //  this.symptoms['fac']          = '';
        //  await this.userOrganization()
        //  await this.userFacility()
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        // this.dialogRefs.close();
      }
      //  this.symptoms.fac = ''; io-1181
      // this.faclist = [];
    }
    this.removeAddedFac();
  }

  removeAddedFac() {
    console.log('--organiz--', this.organiz, this.faclist);

    this.faclist = this.faclist.filter(
      (e) => this.userFacilityList.findIndex((z) => z.fac_id == e._id) == -1
    );
    this.orgFacSelection(); // io-1181
  }

  select(org, fac, flag) {
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
      console.log(this.multiorg);
      console.log(this.multifacility);
    } else {
      if (!org || org === undefined) {
        this.multifacility = fac;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  orgFacSelection() {
    console.log('----ln-----', this.organiz.length, this.faclist.length);
    if (this.organiz.length == 1 && this.faclist.length == 1) {
      // organization manage
      this.orgDisable = true;
      this.symptoms.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = true;
      this.symptoms.fac = this.faclist[0]['_id'];
      this.multifacility = this.faclist[0]['fac_name'];
    } else if (this.organiz.length == 1 && this.faclist.length > 1) {
      console.log('---here------------', this.faclist);
      // organization manage
      this.orgDisable = true;
      this.symptoms.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
    } else if (this.organiz.length > 1) {
      // organization manage
      this.orgDisable = false;
      //  this.announcement.organization = ''
      //  this.multiorg = this.organiz[0]['org_name']

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
      this.multifacility =
        this.faclist && this.faclist.length && this.faclist[0]['fac_name']
          ? this.faclist[0]['fac_name']
          : '';
    } else if (this.organiz.length == 1 && this.faclist.length == 0) {
      // organization manage
      this.orgDisable = true;
      this.symptoms.organization = this.organization;
      this.multiorg = this.organiz[0]['org_name'];

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
      //   this.multifacility=this.faclist[0]['fac_name']
    } else {
      // organization manage
      this.orgDisable = false;
      this.symptoms.organization = '';

      // facility manage
      this.facDisable = false;
      this.symptoms.fac = '';
    }
  }

  async userOrganization() {
    const action = { type: 'GET', target: 'users/get_org' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = await result['data'].map(function (obj) {
      const rObj = {};
      rObj['org_name'] = obj._id.org.org_name;
      rObj['_id'] = obj._id.org._id;
      return rObj;
    });
    let defaultOrgName;
    for (var i = 0; i < this.organiz.length; i++) {
      if (this.organization == this.organiz[i]._id) {
        defaultOrgName = this.organiz[i].org_name;
      }
    }
    this.multiorg = defaultOrgName;
    console.log("Org------",this.organiz);
    // io-1181 below commented
    /* if(this.isEdit !== true){
      this.symptoms.organization = this.organization;
    }*/
  }

  async userFacility() {
    const payload2 = { org: this.organization };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
    this.faclist = await result2['data'].map(function (obj) {
      const fObj = {};
      fObj['fac_name'] = obj._id.fac.fac_name;
      fObj['_id'] = obj._id.fac._id;
      return fObj;
    });
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName;
    if (this.isEdit !== true) {
      //  this.symptoms.fac = this.facility; // io-1181
    } else {
      this.removeAddedFac(); //  io-1181
      //  this.faclist = []; io-1181
    }

    this.orgFacSelection(); // io-1181
  }

  async editSymptom(symptomId) {
    this.showNew = true;
    this.privilege = 'edit';
    await this.userOrganization(); //  io-1181
    await this.userFacility(); //  io-1181
    this.showPop = true;
    this.isEdit = true;
    this.commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'symptoms/view',
    };
    const payload = { symptomId: symptomId };
    const result = await this.apiService.apiFn(action, payload);
    this.symptom = result['data']['_symptom'];
    if (
      this.symptom.facility &&
      this.symptom.facility.length &&
      this.symptom.facility[0].org
    ) {
      this.userFacilityList = this.symptom.facility.map((item) => ({
        org_id: item.org._id,
        org_name: item.org.org_name,
        fac_id: item.fac._id,
        fac_name: item.fac.fac_name,
        selected: item.selected,
      }));
    }
    this.facListDone = this.userFacilityList;

    // io-1181 below if else and if condition
    if (result['data']['_symptom']['facility'].length > 0) {
      this.removeAddedFac();
      this.ismultifac = true;
    } else {
      this.ismultifac = false;
      this.showfaclist = false;
      this.orgFacSelection();
    }
    if (!this.symptoms.organization) {
      this.symptoms.organization = '';
    }

    this.addSymptomList = [];
    this.addSymptomInput['name'] = this.symptom.name;
    this.addSymptomInput['isolation_days'] = this.symptom.isolation_days;
    this.addSymptomInput['isCovid'] = this.symptom.isCovid;
    this.commonService.setLoader(false);

    this.symptomForm.patchValue(this.symptom);
    //this.addSymptom();
  }

  add(){
    this._dialogRef.close();
  }
}