import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterEvent, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { SocketService } from './../shared/services/socket/socket.service';
import { AuthGuard } from './../shared/guard/auth.guard';

interface AuthState {
    _authUser: object;
}

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
    authState: Object;
    breadcrumbDisplay = 'display_none';
    loader = false;

    constructor(
        private _router: Router,
        private _authUser: Store<AuthState>,
        private _socketService: SocketService,
        private _authGuard: AuthGuard
    ) { }

    async ngOnInit() {

        this._router.events.subscribe((event : RouterEvent)=>{
            if(event instanceof RouteConfigLoadStart){
                // console.log("loader started")
                this.loader = true
            }else if (event instanceof RouteConfigLoadEnd){
                // console.log("loader end")

                this.loader = false;
            }
        })
        
        this._authUser.select('authState').subscribe(sub => {
            
            this.authState = sub;
        });
        this._socketService.getloggedOutUserFn().subscribe(_response => {
            if (_response) {
                if (_response['user_id'] === this.authState['user_id'] && this.authState['isLoggedin']) {
                    this._authGuard.destroyToken('Session Timeout, Please login again!',"");
                }
            }
        });
        this._router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.breadcrumbDisplay = 'display_none';
                if (event.url !== '/dashboard') {
                    this.breadcrumbDisplay = 'block';
                }
            }
        });
        if (this._router.url !== '/dashboard') {
            this.breadcrumbDisplay = 'block';
        }
    }

}



