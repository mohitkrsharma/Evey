import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MatDialog, MatDialogConfig } from '@angular/material';
import $ from 'jquery';

import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from '../../../shared/services/common.service';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})

export class RolesComponent implements OnInit {

  dialogRefs;
  editRole = false;
  @ViewChild('roleDialog', {static: true}) roleDialog: TemplateRef<any>;
  roleType = "";
  roleData = [];
  roleEdit = [];
  positionsz = [];
  modules = [];
  rolSearch = '';
  rolesData = [];
  accessData = [];
  role: any = {
    role_name: '',
    role_type: 'users',
    web: true,
    app: true,
  };
  position_name: string;
  /*Report Name 
    Build Custom Report=> build_custom_report
    Shift Performance Report =>shift_performance_report
    Care Within 24 Hours or Shift =>care_within_24_hours_report
    Activity=>activity_report
    Missed Level 1 Check-in Report by Shift=>missed_level_1_checkin_report
    Room clean report=>room_clean_report
    Vital report =>vital_report
    Virus Care report =>virus_care_report
  
    scheduling
  
    Schedule Care=>schedule_care
    Rule care=>	rule_care	
    */

  modulesArr = [
    /**Modules */
    "announcement",
    /**Reports */
    "build_custom_report",
    "build_custom_med_report",
    "shift_performance_report",
    "care_within_24_hours_report",
    "activity_report",
    "missed_level_1_checkin_report",
    "room_clean_report",
    "vital_report",
    "virus_care_report",
    /**Scheduling */
    "schedule_care",
    "rule_care",
    /**People */
    "users",
    "residents",
    "visitors",
    "technical_support",
    /**Modules */
    "beacons",
    "nfc",
    "assets",
    "organization",
    "facility",
    "floors_sectors",
    "zones",
    "cares",
    "create_a_questionnaire",
    "symptoms",
    "diseases"];
  isEdit: boolean = false;
  loggedInUser: any;

  constructor(
    private _dialog: MatDialog,
    private _apiService: ApiService,
    private _router: Router,
    private _toastr: ToastrService,
    public _commonService: CommonService,
    private _aes256Service: Aes256Service) {
  }

  async ngOnInit() {
    this.getModules();
    this.getRoles();
    this.getPositions();
    this.loggedInUser = JSON.parse(sessionStorage.getItem('authReducer'));
    this.isEdit = this._commonService.checkEditPermission(this.loggedInUser.position_id);
  }

  changeRole(event) {
    console.log("event.value", event.value, this.roleType)
    //this.roleEdit = [];
    //this.getPreviledge();
    this.getRoleData();
  }

  async getPreviledge() {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'privileges/get_privileges' };
    const payload = { role_id: this.roleType };
    const result = await this._apiService.apiFn(action, payload);
    console.log("==result==", result)
    if (result['status']) {
      /*       console.log(JSON.stringify(result['data'])) */
      if (result['data'].length > 0) {
        let _self = this;
        result['data'].forEach(function (obj) {

          if (!obj.hasOwnProperty('app_rule')) { obj['app_rule'] = {}; }
          if (obj.hasOwnProperty('app_rule') && !obj['app_rule'].hasOwnProperty('notification')) { obj['app_rule']["notification"] = {}; }

          if (!obj.hasOwnProperty('web_rule')) { obj['web_rule'] = {}; }
          _self.modulesArr.forEach(function (element) {
            if (obj.hasOwnProperty('web_rule') && !obj['web_rule'].hasOwnProperty(element)) {
              obj['web_rule'][element] = {};
            }
          })
          _self.roleEdit.push(obj);
        })
      } else {
        let _self = this;
        this.roleData.forEach(function (obj) {

          _self.positionsz.forEach(function (obj1) {
            const rObj = {};
            rObj['role_id'] = obj['_id'];
            rObj['position_id'] = obj1['_id'];

            if (!rObj.hasOwnProperty('app_rule')) { rObj['app_rule'] = {}; }
            if (rObj.hasOwnProperty('app_rule') && !rObj['app_rule'].hasOwnProperty('notification')) { rObj['app_rule']["notification"] = {}; }

            if (!rObj.hasOwnProperty('web_rule')) { rObj['web_rule'] = {}; }


            _self.modulesArr.forEach(function (element) {
              if (rObj.hasOwnProperty('web_rule') && !rObj['web_rule'].hasOwnProperty(element)) {
                rObj['web_rule'][element] = {};
              }

            })
            _self.roleEdit.push(rObj);
            console.log("Role obj",rObj);
          })


        });
      }


    }
    this._commonService.setLoader(false);

  }

  async getRoles() {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'users/user_type' };
    const payload = { 'role_type': 'users' };
    const result = await this._apiService.apiFn(action, payload);
    if (result['status']) {

      this.roleData = result['data']['_roles'];
      this.roleType = this.roleData[0]._id;
      //this.getPreviledge();
      this.getRoleData();
    }

    this._commonService.setLoader(false);
  }

  async getRoleData() {
    this._commonService.setLoader(true);
    this.accessData = [];
    const action = { type: 'GET', target: 'privileges/get_role_access' };
    const payload = { role_id: this.roleType };
    const result = await this._apiService.apiFn(action, payload);
    console.log('roles-access',result);
    if (result['status']) {
      if (result['data'].length > 0) {

        let _self: any = this;
        /* console.log("self",_self) */
        console.log("vfdf",result['data']);

        result['data'].forEach(function (obj) {
          let positionname;
          for (let index = 0; index < obj.position.length; index++) {
            positionname = _self.positionsz.filter(position => { return position._id == obj.position[index].position_id });
            console.log("Position ",positionname);
            obj.position[index].position_name = positionname[0] ? positionname[0].position_name : "Not available"
            obj.position[index].order = positionname[0] ? positionname[0].order : "Order Not available"
          }

          //return false
          //Add Position Data in array
          /*           for (let index = 0; index < array.length; index++) {
                      const element = array[index];
                      
                    } */
          _self.accessData.push(obj);

          //           if(_self.accessData.length>0){
          //             _self.accessData.filter(positionData=>{
          //               if(positionData._id!=obj.position_id){
          //                 _self.accessData.push(positionname[0]);
          //               }
          //             });

          //             //Get Index Detail Of position
          //             _self.accessData.filter(positionData=>{
          //               if(positionData._id==obj.position_id){
          //                 const index = _self.accessData.findIndex((element, index) => {
          //                   if (element._id === obj.position_id) {
          //                     return true
          //                   }
          //                 });

          //                 //Get Module Details and push to array
          //                 //let moduleName = _self.modules.filter(moduleData=>{return moduleData._id==obj.module_id })
          //                 /* if(_self.accessData[index].module){
          //                   _self.accessData[index].module.push(moduleName[0]);
          //                 }
          //                 else{
          //                   _self.accessData[index].module = [];
          //                   _self.accessData[index].module.push(moduleName[0]); 
          //                 } */

          //                 //Get Module index and push to the module
          //                /*  const moduleindex = _self.accessData[index].module.findIndex((element, index) => {
          //                   if (element._id === obj.module_id) {
          //                     return true
          //                   }
          //                 });

          //                 _self.accessData[index].module[moduleindex].access = obj.access; */
          //               }
          //             });
          //           }
          //           else{
          //             _self.accessData.push(positionname[0]);
          //             const index = _self.accessData.findIndex((element, index) => {
          //               if (element._id === obj.position_id) {
          //                 return true
          //               }
          //             });
          // /*             let moduleName = _self.modules.filter(moduleData=>{return moduleData._id==obj.module_id })
          //             _self.accessData[index].module = [];
          //             _self.accessData[index].module.push(moduleName[0]);
          //             const moduleindex = _self.accessData[index].module.findIndex((element, index) => {
          //               if (element._id === obj.module_id) {
          //                 return true
          //               }
          //             });
          //             _self.accessData[index].module[moduleindex].access = obj.access; */
          //           }
          //this.accessData.positionname.modulename = _self.modules.filter(module=>{return module._id==obj.module_id })
        });
        console.log("Access Data", _self.accessData);
        if(_self.accessData){
          _self.accessData.forEach(pos => {
              const _found = this.positionsz.find(p => p._id === pos)
          })
        }
       
        /*         _self.accessData.sort((a,b) => {return a.order - b.order})
                 */
        for (let i in _self.accessData) {
          _self.accessData[i].position = _self.accessData[i].position.sort(function (a, b) {
            return a.order - b.order;
          });
        }
      }
    }
    this._commonService.setLoader(false);
    /*     console.log("result",result)
        this.rolesData = result['data'];
        console.log(this.rolesData); */
  }

  async datasort(items) {
    items.sort(function (a, b) {
      return a.order - b.order;
    });
    return items;
  }

  async getPositions() {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'users/positions' };
    const payload = { type: 'user' };
    const result = await this._apiService.apiFn(action, payload);

    if (result['status']) {

      this.positionsz = result['data']['_positions'];
      console.log("pppppppp",this.positionsz);
    }
    this._commonService.setLoader(false);

    //   let _self=this;
    // this.roleData.forEach(function (obj) {

    //   _self.positionsz.forEach(function (obj1) {
    //       const rObj = {};
    //       rObj['role_id']=obj['_id'];
    //       rObj['position_id']=obj1['_id'];       

    //       if (!rObj.hasOwnProperty('app_rule')) { rObj['app_rule'] = {}; }
    //       if (rObj.hasOwnProperty('app_rule') && !rObj['app_rule'].hasOwnProperty('notification') ) { rObj['app_rule']["notification"] = {}; }

    //       if (!rObj.hasOwnProperty('web_rule')) { rObj['web_rule'] = {}; }


    //     _self.modulesArr.forEach(function (element) {
    //       if (rObj.hasOwnProperty('web_rule') && !rObj['web_rule'].hasOwnProperty(element) ) { 
    //         rObj['web_rule'][element] = {}; 
    //       }    

    //     })
    //        _self.roleEdit.push(rObj)
    //     })


    // });
  }

  async getModules() {

    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'users/modules' };
    const payload = {};
    const result = await this._apiService.apiFn(action, payload);


    if (result['status']) {

      this.modules = result['data']['_modules'];
    }
    this._commonService.setLoader(false);
  }

  closeRoleDialog() {
    this.dialogRefs.close();
    this.position_name = '';
    this.role = {
      role_name: '',
      role_type: 'users',
      web: true,
      app: true,
    };
  }

  CheckToggle(roleId, ModuleId) {
    console.log("roleId", roleId)
    console.log("ModuleId", ModuleId)
  }

  addRole() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '40%';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    this.dialogRefs = this._dialog.open(this.roleDialog, dialogConfig);
  }

  onChangeApp(id) {
    this.roleEdit = this.roleEdit.map(function (obj) {
      const rObj = obj;
      if (rObj._id === id && !rObj.app_rule) {
        rObj.app_rule = {};
      }
      if (rObj._id === id && !rObj.app_rule.notification) {
        rObj.app_rule.notification = {};
      }
      return rObj;
    });
  }

  async saveRole() {

    this._commonService.setLoader(true);
    const action = { type: 'POST', target: 'privileges/update_privileges' };
    const payload = { 'privilegeData': this.roleEdit };
    //console.log(">>>",payload)
    const result = await this._apiService.apiFn(action, payload);
    if (result['status']) {
      this.editRole = false;
      this._toastr.success(result['message']);

    }
    this._commonService.setLoader(false);
  }

  async saveRoleDialog(form) {
    if (form.valid && this.role.role_name) {
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'roles/save_roles' };
      const payload = this.role;
      const result = await this._apiService.apiFn(action, payload);
      if (result['status']) {
        this.editRole = true;
        await this.getRoles();
        this.closeRoleDialog();
      }
      this._commonService.setLoader(false);
    }
  }

  changeModuleAction(index, module, event) {

    if (!event.checked) {
      this.roleEdit[index].web_rule[module].export = false;
    }

  }

  async onChangeActive(status, position_id, module_id, event) {
    let updateFullAccess = false,payload,action;
    let moduleIndex = this.accessData.findIndex(mdl => mdl._id === module_id);
    let positionIndex = this.accessData[moduleIndex]['position'].findIndex(pos => pos.position_id == position_id);
    if(event === 'view' && !status.checked){
      updateFullAccess = true;
      Object.assign(this.accessData[moduleIndex]['position'][positionIndex]['access'],{'view': false, 'add': false, 'edit': false, 'delete': false, 'export': false});
      payload = { updateFullAccess: updateFullAccess, position_id: position_id, module_id: module_id, event: event, status: this.accessData[moduleIndex]['position'][positionIndex]['access'] }
    } else {
      this.accessData[moduleIndex]['position'][positionIndex]['access'][event] = status.checked;
      payload = { updateFullAccess: updateFullAccess, position_id: position_id, module_id: module_id, event: event, status: status.checked };
    }
    console.log("payload-----",payload);
    action = { type: 'POST', target: 'privileges/update_role_access' };
    const result = await this._apiService.apiFn(action, payload);
    console.log(result);
    if (result['status']) {
      let permission = this._aes256Service.decFn(JSON.parse(sessionStorage.getItem('rolesPermission')));
      let index = permission.findIndex(mdl => mdl._id == module_id);
      if (permission[index].position[0].position_id == position_id) {
        if(event === 'view' && !status.checked){
          permission[index].position[0].access = payload.status;
        } else {
          permission[index].position[0].access[event] = status.checked;
        }
        let encryptPermission = this._aes256Service.encFn(permission);
        sessionStorage.setItem('rolesPermission', JSON.stringify(encryptPermission));
        this.isEdit = this._commonService.checkEditPermission(this.loggedInUser.position_id);
      }
      
    }
  }

  /* Not is use */
  positionName(id) {

    const index = this.positionsz.findIndex(item => item._id === id);
    return this.positionsz[index].position_name;

  }

  /* Not is use */
  selectAllModule(index, module, event) {
    if ((module == "web") && event.checked) {
      let arr = {
        "announcement": { add: true, delete: true },
        /**Reports */
        "build_custom_report": { view: true, export: true },
        "build_custom_med_report": { view: true, export: true },
        "shift_performance_report": { view: true, export: true },
        "care_within_24_hours_report": { view: true, export: true },
        "activity_report": { view: true, export: true },
        "missed_level_1_checkin_report": { view: true, export: true },
        "room_clean_report": { view: true, export: true },
        "vital_report": { view: true, export: true },
        "virus_care_report": { view: true, export: true },
        /**Scheduling */
        "schedule_care": { add: true, delete: true },
        "rule_care": { add: true, delete: true },
        /**People */
        "users": { add: true, delete: true },
        "residents": { add: true, delete: true },
        "visitors": { view: true },
        "technical_support": { add: true },
        /**Modules */
        "beacons": { add: true, delete: true },
        "nfc": { add: true, delete: true },
        "assets": { add: true, delete: true },
        "organization": { add: true, delete: true },
        "facility": { add: true, delete: true },
        "floors_sectors": { add: true, delete: true },
        "zones": { add: true, delete: true },
        "cares": { add: true, delete: true },
        "create_a_questionnaire": { add: true, delete: true },
        "symptoms": { add: true, delete: true },
        "diseases": { add: true, delete: true }
      }
      this.roleEdit[index].web_rule = arr;
    }

    if ((module == "app") && event.checked) {

      let arr = {
        "notification": {
          "open_care": true,
          "notify_care": true,
          "emergency": true,
          "scheduled": true,
          "email_notifications": true
        }
      }
      this.roleEdit[index].app_rule = arr;

    }
  }

  async savePositionDialog(form) {
    if (form.valid && this.position_name) {
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'roles/add' };
      const payload = { position_name: this.position_name };
      console.log("Position payload", payload);
      const result = await this._apiService.apiFn(action, payload);
      if (result['status']) {
        await this.getModules();
        await this.getPositions();
        await this.getRoles();
      }
      this.closeRoleDialog();
      this._commonService.setLoader(false);
    }
  }
}
