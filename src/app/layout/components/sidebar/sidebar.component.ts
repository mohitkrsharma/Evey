import { map } from 'rxjs/operators';
import { Component, OnInit, OnDestroy,   ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { insertRefFn } from '../../../shared/store/shiftReport/action';
import { insertFn } from '../../../shared/store/auth/action';
import { resetFn } from '../../../shared/store/auth/action';
// import { Socket } from 'ngx-socket-io';
import { CommonService } from './../../../shared/services/common.service';
import { AuthGuard } from './../../../shared/guard/auth.guard';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { SocketService } from './../../../shared/services/socket/socket.service';
import * as moment from 'moment';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { startOfDay } from 'date-fns';
interface ShiftRepState {
  _shiftRep: object;
}

interface AuthState {
  _authUser: object;
}
interface PrivilegeRepState {
  _authPrivileges: object;
}
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  panelOpenState = false;
  public showMenu: string;
  username;
  data;
  jobTitle;
  captionName;
  haveData: any = {};
  socket;
  newSocket;
  role_id;
  position_id;
  privileges: any = {};
  previousRoom: string = '';
  isNewRoom: boolean = true;
  isLeaveRoom: boolean = false;

  careXpandStatus: boolean = false;
  activityXpandStatus: boolean = false;
  residentXpandStatus: boolean = false;
  accessXpandStatus: boolean = false;
  custXpandStatus: boolean = false;
  settingXpandStatus: boolean = false;
  globSettingXpandStatus: boolean = false;
  // private subscription: Subscription;
  // private subscription1: Subscription;
  subscription: Subscription = new Subscription();
  organization;
  facility;
  timezone: any;
  unlinkOrderCount: any;
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };

  constructor(
    private _authPrivileges: Store<PrivilegeRepState>,
    private _authUser: Store<AuthState>,
    private _shiftRep: Store<ShiftRepState>,
    private _apiService: ApiService,
    // private _socket: Socket,
    public _commonService: CommonService,
    public _authGuard: AuthGuard,
    private toastr: ToastrService,
    private router: Router,
    private _socketService: SocketService,
    private _aes256Service: Aes256Service,
    private cdr: ChangeDetectorRef
  ) {

    this._socketService.listenRoomFn().subscribe(async (_response: any) => {
      if (_response && _response.data) {
        const res = _response.data;
        const user = sessionStorage.getItem('user_Id');
        if (_response.eventType == 'group-permission-update' || (_response.eventType == 'individual-permission-update' && res.length && res[0].userId == user)) {
          await this.getRolesData();
          this.cdr.detectChanges();
        }
      }
    })
  }

  async ngOnInit() {
    this.subscription.add(this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          await this.joinRoomFn('EMAR');
          this.timezone = contentVal.timezone;
          this.pagiPayload['facId'] = contentVal.fac;
          await this.getOrderDataFunction();
        }
      }
    ));
    this.subscription.add(
      this._authUser.select('authState').subscribe((sub) => {
        this.haveData = sub;
        // console.log('haveData-------->', this.haveData);
        if (
          this.haveData.role_id != undefined &&
          this.haveData.role_id != '' &&
          this.haveData.position_id != undefined &&
          this.haveData.position_id != '' &&
          (this.role_id != this.haveData.role_id ||
            this.position_id != this.haveData.position_id)
        ) {
          this.role_id = this.haveData.role_id;
          this.position_id = this.haveData.position_id;

          //this.getPreviledge(this.haveData.role_id,this.haveData.position_id)
        }
      })
    );
    await this.getRolesData();
    this.subscription.add(
      this._commonService.contentdata.subscribe(async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          let data = JSON.parse(sessionStorage.getItem('authReducer'));
          data.fac_id = this.facility;
          console.log("Facility Id",data,data.fac_id);
          this._authUser.dispatch(insertFn(data));
          await this.joinRoomFn('USER');
          await this.joinRoomFn('URA');
          await this.setUserData();
        }
      })
    );

    this.subscription.add(
      this._commonService.unlinkOrderCountdata.subscribe(
        async (contentVal: any) => {
          if (contentVal) {
            this.unlinkOrderCount = contentVal;
          }
        }
      )
    );

    if (!this.haveData['userName']) {
      this.showMenu = '';
      const action2 = { type: 'GET', target: 'users/user_detail' };
      const payload2 = {};
      const userDetails = await this._apiService.apiFn(action2, payload2);
      if (userDetails['status'] === true) {
        let userFacility = null;
        userDetails['data']['facility'].map((item) => {
          if (item.selected) {
            userFacility = item.fac;
          }
        });

        this.captionName =
          userDetails['data']['first_name'].substring(0, 1) +
          userDetails['data']['last_name'].substring(0, 1);
        const userName =
          userDetails['data']['last_name'] +
          ', ' +
          userDetails['data']['first_name'];
        this._shiftRep.dispatch(insertRefFn({ userName: userName }));
        this._authUser.dispatch(
          insertFn({
            userName: userName,
            first_name: userDetails['data']['first_name'],
            last_name: userDetails['data']['last_name'],
            jobTitle: userDetails['data']['job_title'],
            fac_id: userFacility,
            captionName: this.captionName,
          })
        );
        // this.setUserData();
      } else {
        this._authGuard.destroyToken(null, this.facility);
      }
    } else {
    }
    //this.setUserData();

    this.subscription.add(
      this._socketService
        .onUpdatePrivilegeConnectedFn()
        .subscribe((_response: any) => {
          if (_response) {
            const index = _response.findIndex(
              (item) =>
                item.role_id === this.role_id &&
                item.position_id === this.position_id
            );
            if (index > -1) {
              this.privileges = _response[index];
              let decResult = this._aes256Service.encFn(_response[index]);
              //console.log('>>>>',decResult)
              this._authPrivileges.dispatch(
                insertRefFn({ privileges: decResult })
              );
            }
          }
        })
    );

    this.subscription.add(this._socketService.addOrderFn().subscribe(async (res: any) => {
      console.log('new_order', res);
      await this.getOrderDataFunction();
    }));
    this.subscription.add(this._socketService.updateOrderFn().subscribe(async (res: any) => {
      console.log('order_update', res);
      await this.getOrderDataFunction();
    }));

    this._commonService.sidebarPanel.subscribe((res) => {
      if (res != null) {
        console.log('res------>>', res);
        this.careXpandStatus = false;
        this.activityXpandStatus = false;
        this.residentXpandStatus = false;
        this.accessXpandStatus = false;
        this.custXpandStatus = false;
        this.settingXpandStatus = false;
        this.globSettingXpandStatus = false;
      }
    });
  }
  async ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  async setUserData() {
    this.data = JSON.parse(sessionStorage.getItem('authReducer'));
    this.username = this.data.last_name + ', ' + this.data.first_name;
    this.jobTitle = this.data.jobTitle;
    this.captionName = this.data.captionName;
    console.log(this.data)
    if(!this.facility){
      this.facility = this.data.fac_id
    }
    setTimeout(async () => {
      this._commonService.setLoader(true);
      await this.iAmConnectingFn();
      this._commonService.setLoader(false);
    }, 5000);
  }

  async iAmConnectingFn() {
    const storeObj = await this._apiService.getauthData();
    if (storeObj['userName']) {
      if(!storeObj['fac_id']){
        storeObj['fac_id'] = this.facility;
      }
      const action = { type: 'POST', target: 'socketApi/newConnectedUser' };
      const payload = {
        platform: 'web',
        token: storeObj['token'],
        full_name: storeObj['userName'],
        first_name: storeObj['first_name'],
        last_name: storeObj['last_name'],
        user_id: storeObj['user_id'],
        fac_id: storeObj['fac_id']
      };
      const result = await this._apiService.apiFn(action, payload);
      // console.log('new connected res --->>', result);
    }
  }

  addExpandClass(element: any) {
    if (element === this.showMenu) {
      this.showMenu = '0';
    } else {
      this.showMenu = element;
    }
  }

  async getPreviledge(role_id, position_id) {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'privileges/get_privileges' };
    const payload = { role_id: role_id, position_id: position_id };
    const result = await this._apiService.apiFn(action, payload);
    if (result['status']) {
      //console.log('>>>',result['data'])
      if (
        result['data'].length == 0 ||
        (result['data'].length > 0 && !result['data'][0].web)
      ) {
        // if (this.toastr.currentlyActive === 0) {
        //     this.toastr.error('You are not authorized for web');
        //     this.router.navigate(['']);
        //     // this._authUser.dispatch(resetFn({}));
        //   }
        //   this.router.navigate(['/']);
        this.toastr.error('You are not authorized for web');
        // this._authGuard.destroyToken('You are not authorized for web');
      } else {
        this.privileges = result['data'][0];
        let decResult = this._aes256Service.encFn(this.privileges);
        //console.log('>>>>',decResult)
        this._authPrivileges.dispatch(insertRefFn({ privileges: decResult }));
      }
    }
    this._commonService.setLoader(false);
  }

  checkModule(module) {
    if (
      this.privileges.web_rule != undefined &&
      this.privileges.web_rule.hasOwnProperty(module)
    ) {
      let _arr = Object.values(this.privileges.web_rule[module]);

      return _arr.indexOf(true) > -1 ? true : false;
    } else {
      return false;
    }
  }

  redirectToEditUser() {
    let obj = {
      isDashboard: true,
      id: this.haveData['user_id'],
    };

    let decryptUserId = this._aes256Service.encFnWithsalt(obj);
    this.router.navigate(['/users/form', decryptUserId]);
  }

  async getRolesData() {
    let userObj = JSON.parse(sessionStorage.getItem('authReducer'));
    let user_access = await this._apiService.apiFn(
      { type: 'POST', target: 'users/user_access' },
      { userId: userObj.user_id }
    );
    if (user_access && user_access['data'] && user_access['data'].length > 0) {
      sessionStorage.setItem(
        'userAccess',
        JSON.stringify(
          this._aes256Service.encFn(user_access['data'][0]['module'])
        )
      );
    }
    const action = { type: 'GET', target: 'roles/roles_access' };
    const payload = {
      positionId: userObj.position_id,
    };
    const result = await this._apiService.apiFn(action, payload);
    const encryptedPermission = this._aes256Service.encFn(result['data']);
    sessionStorage.setItem(
      'rolesPermission',
      JSON.stringify(encryptedPermission)
    );
  }

  async onLinkClick(roomName) {
    //console.log('Hello');
    if (roomName) {
      this.joinRoomFn(roomName);
    }
  }

  checkAllModuleAccess(modulename) {
    return this._commonService.checkAllPrivilege(modulename);
  }
  checkPrivilegeModule(modulename, actionName) {
    return this._commonService.checkPrivilegeModule(modulename, actionName);
  }

  async joinRoomFn(roomName) {
    let room = `${this.facility}-${roomName}`;
    if (this.previousRoom === '') {
      this.previousRoom = room;
      this.isNewRoom = true;
    } else if (this.previousRoom === room) {
      this.isNewRoom = false;
      this.isLeaveRoom = false;
    } else {
      this.isNewRoom = true;
      this.isLeaveRoom = true;
    }

    //leave room
    if (this.isLeaveRoom) {
      this._socketService.leaveRoomFn(this.previousRoom).subscribe((res: any) => {
        if (res.connected) {
          console.log('exit');
        }
      });
    }
    //connect to new room
    if (this.isNewRoom) {
      this._socketService.connectFn(room).subscribe((res: any) => {
        if (res.connected) {
          console.log('entry');
        }
      });
    }
  }

  dayClicked(type?): void {
    const startToday = startOfDay(this.getCurrentDateFromTimezone()).valueOf();
    if(type == "activity"){
      this.router.navigate(['/activity-scheduling/day_list', startToday]);
    }else{
      this.router.navigate(['/scheduling/day_list', startToday]);
    }
  }

  getCurrentDateFromTimezone() {
    let newDate = new Date().toLocaleString('en-US', {
      timeZone: this.timezone,
    });
    if (this.timezone) {
      newDate = moment().tz(this.timezone).format('YYYY-MM-DDTHH:mm:ss');
    }
    return moment(newDate)['_d'];
  }

  public async getOrderDataFunction() {
    const action = {
      type: 'POST',
      target: 'residents/list_ether_fax',
    };
    const payload = this.pagiPayload;
    let result = await this._apiService.apiFn(action, payload);
    if (result['status']) {
      this.unlinkOrderCount = result['data']['_etherfaxes'].length;
      this._commonService.setunlinkOrderCount(result['data']['_etherfaxes'].length);
    }
  }
}
