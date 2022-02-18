import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { SocketService } from './../../shared/services/socket/socket.service';
import { ApiService } from './../../shared/services/api/api.service';
import { MatDialog } from '@angular/material';
import { resetFn } from './../../shared/store/auth/action';
import { ToastrService } from 'ngx-toastr';
import { io } from "socket.io-client";
import { environment } from "src/environments/environment";
import { CommonService } from './../../shared/services/common.service'

interface AppState {
    _authUser: number;
}

interface AuthState {
    _authUser: object;
}

@Injectable()
export class AuthGuard implements CanActivate {
    authState: Object;
    _socket;
    constructor(
        private _router: Router,
        private _authStore: Store<AppState>,
        private _apiService: ApiService,
        private _socketService: SocketService,
        private _dialog: MatDialog,
        private _authUser: Store<AuthState>,
        private _toastr: ToastrService,
        public _commonService: CommonService
    ) {
        this._authStore.select('authState').subscribe(sub => {
            this.authState = sub;
        });
        this._commonService.contentdata.subscribe(async (contentVal: any) => {
            if(contentVal.fac)  this._socket = io(environment.config.socket_url);
        })
       
    }

    canActivate() {
        if (this.authState['isLoggedin']) {
            return true;
        } else {
            this._router.navigate(['']);
            return false;
        }
    }

    destroyToken(message = null, facility) {
        //this._socketService.connectedEvent('logout', { platform: 'web' });
        const action = { type: 'POST', target: 'auth/logout', resType: 1 };
        this._apiService.apiFn(action, { fac_id: facility });
        this._authUser.dispatch(resetFn({})); // INSERT IN authReducer STORE
        this._router.navigate(['']);
        this._dialog.closeAll();
        this._socket.disconnect();
        if (message) {
            if (this._toastr.currentlyActive === 0) {
                this._toastr.success(message, '', { extendedTimeOut: 999999, closeButton: true });
            }
        }
    }

}
