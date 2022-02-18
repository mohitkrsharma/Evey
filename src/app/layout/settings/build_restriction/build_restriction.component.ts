import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ApiService } from './../../../shared/services/api/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../../shared/services/common.service';
import { MatTableDataSource,  MatDialogConfig } from '@angular/material';
import { MatDialog } from "@angular/material/dialog";
import { AlertComponent } from 'src/app/shared/modals/alert/alert.component';
@Component({
  selector: 'app-build-restriction',
  templateUrl: './build_restriction.component.html',
  styleUrls: ['./build_restriction.component.scss']
})

export class BuildRestrictionComponent implements OnInit {
  checked;
  deleteArr = [];
  deleteItem=[];
  isEdit=false
  buildForm: FormGroup;
  showBuildTable = false;
  dialogRefs=null
  actualDataCount;
  _id;
  appForm = FormGroup
  @ViewChild("addNewDialog", {static: true}) addNewDialog: TemplateRef < any > ;
  privilege: string = 'add';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    public dialog: MatDialog,
    public _commonService: CommonService) {

  }
  versionList=[];
  _form:any = {
    app_id: '',
    version_id: '',
    notes:''
  };
  displayedColumns = ['checkbox','app_id', 'version_id','status','notes', 'action'];
  dataSource = new MatTableDataSource(this.versionList);

  async ngOnInit() {
    this.getBuildVersions();
  }

  async getBuildVersions() {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'build_restricted/get' };
    const payload = { };
    const result = await this.apiService.apiFn(action, payload);
    if (result['data']) {
      // this.versionList = result['data']['build_versions'];
      this.versionList = result['data'].map(item=>{
        return(
          {
            _id:item._id,
            app_id:item['build_versions'][0].app_id,
            version_id:item['build_versions'][0].version_id,
            status:item.status?item.status:false,
            notes:item.notes?item.notes:''
          }
        )
      })
      this.actualDataCount=result['data'].length
      
      this.dataSource = new MatTableDataSource(this.versionList);
      this.showBuildTable = true;
    }
    this._commonService.setLoader(false);
    this.deleteArr = [];
  }

  // function to accept only alpha numeric character
  checkAllwoNum(key) {
    const result = this._commonService.allwoNumDecimal(key);
    return result;
  }

  allwoNumDecimal(key) {
    const result = this._commonService.allwoNumDecimal(key);
    return result;
  }
  
  checkField(data){
    if(((+data.app_id)<0||isNaN(+data.app_id)) && ((+data.version_id)<0||isNaN(+data.version_id))){
      this.toastr.error('Please enter valid details');
      return false
    }else if(((+data.app_id)<0||isNaN(+data.app_id)) && ((+data.version_id)>0||!isNaN(+data.version_id))){
      this.toastr.error('Please enter valid version id');
      return false
    }else if(((+data.app_id)>0||!isNaN(+data.app_id)) && ((+data.version_id)<0||isNaN(+data.version_id))){
      this.toastr.error('Please enter valid build id');
      return false
    }else{
      return true
    }
  }

  async addBuildVersion() {
    this.privilege = 'add';
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = "700px";
    dialogConfig.panelClass = "repeatDialog";
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    dialogConfig.autoFocus = false;
    // this.temparray = < FormArray > this.shiftForm.controls["shifts"];
    this.dialogRefs = this.dialog.open(this.addNewDialog, dialogConfig);

    return;
    // if (form.app_id === '' || form.app_id === undefined) {
    //   this.toastr.error('Please enter a valid build ID');
    // } else if (form.version_id === '' || form.version_id === undefined) {
    //   this.toastr.error('Please enter a valid version ID');
    // } else {
    //   if (this.versionList === undefined || this.versionList.length < 1) {
    //     this.versionList = [
    //       {
    //         'app_id': form.app_id,
    //         'version_id': form.version_id
    //       }
    //     ];
    //     this._form = { app_id: '', version_id: '',notes:'' };
    //     this.saveBuild();
    //   } else {
    //     if (this.versionList.some(item => item.app_id.trim() === form.app_id.trim() && item.version_id.trim() === form.version_id.trim())) {
    //       if (this.toastr.currentlyActive === 0) {
    //         this.toastr.error('Build version already added');
    //       }
    //     } else {
    //       this.versionList.push({
    //         'app_id': form.app_id,
    //         'version_id': form.version_id
    //       });
    //       this._form = { app_id: '', version_id: '',notes:'' };
    //       this.saveBuild();
    //     }
    //   }
    //   this.dataSource = new MatTableDataSource(this.versionList);
    //   this.showBuildTable = true;
    // }
  }

  // async onRemoveBuildVersion(i) {
  //   this.versionList.splice(i, 1);
  //   if (this.versionList.length > 0) {
  //     this.showBuildTable = true;
  //     this.dataSource = new MatTableDataSource(this.versionList);
  //   } else if (this.versionList.length === 0) {
  //     this.showBuildTable = false;
  //   }
  //   this.saveBuild();
  // }
// async saveBuild(){}
  // Add/Edit NFC form
  async saveDialog(f) {
    const valid = f.form.status;

    if(valid === 'VALID'){

      if(!this.checkField(this._form)){
        return
      }
      this._commonService.setLoader(true);
      const action = {
        type: 'POST',
        target: 'build_restricted/add'
      };
      if(this.isEdit===true && this._id!=undefined){
        this._form._id=this._id
      }
   

      // return
      const result = await this.apiService.apiFn(action, this._form);
      
      if (result['status']) {
        this.toastr.success(result['message']);
        
        this.getBuildVersions();
        this._commonService.setLoader(false);
        this.router.navigate(['settings/build_restriction']);
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error(result['message']);
        }
        this._commonService.setLoader(false);
      }
      this._form = { app_id: '', version_id: '',notes:'' };
      // this.dialogRefs.close()
      this.closeDialog()
    }else {
      if (this.toastr.currentlyActive === 0) {

        if(!this._form.app_id && !this._form.version_id){
          this.toastr.error('Please fill all fields');
          return;
        }else if(!this._form.app_id && this._form.version_id){
          this.toastr.error('Please enter version id');
          return;
        }
        else if(this._form.app_id && !this._form.version_id){
          this.toastr.error('Please enter build id');
          return;
        }

        
      }
    }
    

  }

  selectElement(id, check) {
    
    if (check === true) {
      for (let i = 0; i < this.deleteArr.length; i++) {
        if (this.deleteArr[i] === id) {
          this.deleteArr.splice(i, 1);
        }
      }
    } else if (check === undefined || check === false) {
      this.deleteArr.push(id);
    }
    if ((this.deleteArr && this.deleteArr.length) < this.actualDataCount) {
      this.checked = false;
    } else if ((this.deleteArr && this.deleteArr.length) === this.actualDataCount) {
      this.checked = true;
    }
   
  }

  async deleteApp(id) {
    this.deleteItem.push(id);
   
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'App Version', 'id': this.deleteItem, 'API': 'build_restricted/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.deleteItem = [];
        this.toastr.success(result['message']);
        this.checked = false;
        this.getBuildVersions()
        this.router.navigate(['settings/build_restriction']);
      }
    });
  }

  async delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select app to be deleted');
        this.checked = false;
      }
    } else {
   
      const dialogRef = this.dialog.open(AlertComponent, {
       width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'App Version', 'id': this.deleteArr, 'API': 'build_restricted/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result['status']) {
          this.deleteArr = [];
          this.toastr.success(result['message']);
          this.checked = false;
          this.getBuildVersions()
        } else {
          this.versionList.forEach(element => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        }

      });
    }
  }

  async editApp(id){
    this.privilege = 'edit';
    this.isEdit=true
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = "700px";
    dialogConfig.panelClass = "repeatDialog";
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    dialogConfig.autoFocus = false;
    this.dialogRefs = this.dialog.open(this.addNewDialog, dialogConfig);

    const action = { type: 'POST', target: 'build_restricted/view' };
    const payload ={_id:id};
    const result = await this.apiService.apiFn(action, payload);
 
    if (result['data']) {
    

      this._id=result['data']._id
      this._form.app_id=result['data']['build_versions'][0].app_id
      this._form.version_id=result['data']['build_versions'][0].version_id
      this._form.notes=result['data'].notes?result['data'].notes:''
      this._form.status=result['data'].status
    }
  
  }

  selectAll() {
    if (this.checked === true) {
        this.versionList.forEach((element) => {
            element.checked = false;
            this.deleteArr = [];
        });
    } else {
        this.versionList.forEach((element) => {
            this.deleteArr.push(element._id);
            element.checked = true;
        });
    }
  
}

async toggle(e,ee){


  let status;
  if(e.checked){
    status=true
  }else{
    status=false
  }
  const action = { type: 'POST', target: 'build_restricted/status' };
  const payload ={_id:ee,status:status};
  const result = await this.apiService.apiFn(action, payload);

  if (result) {
    if (result['status']) {
      this.toastr.success(result['message'])
    } else {
      this.toastr.error(result['message'])
    }
  } else {
    this.toastr.error(`Something went wrong.`)
 }
}

closeDialog() {
  this.dialogRefs.close();
  this.isEdit = false;
  this._form = { app_id: '', version_id: '',notes:'' };
  this._id=undefined
}

  // async onSubmit(f, form) {
  //   let valid = f.form.status;
  //   if (this.versionList === undefined || this.versionList.length < 1) {
  //     if (form.app_id === '' || form.version_id === '') {
  //       valid = 'INVALID';
  //     }
  //     if (valid === 'VALID') {
  //       this.versionList = [
  //         {
  //           'app_id': form.app_id,
  //           'version_id': form.version_id
  //         }
  //       ];
  //     } else {
  //       if (this.toastr.currentlyActive === 0) {
  //         this.toastr.error('Please enter app id and version id.');
  //       }
  //     }
  //   } else {
  //     valid = 'VALID';
  //   }
  //   if (valid === 'VALID') {
  //     const action = {
  //       type: 'POST',
  //       target: 'build_restricted/add'
  //     };
  //     const result = await this.apiService.apiFn(action, this.versionList);
  //     if (result['status']) {
  //       this.toastr.success(result['message']);
  //       this._form = { app_id: '', version_id: '' };
  //       this.getBuildVersions();
  //       this.router.navigate(['settings/build_restriction']);
  //     } else {
  //       if (this.toastr.currentlyActive === 0) {
  //         this.toastr.error(result['message']);
  //       }
  //     }
  //   }
  // }

}
