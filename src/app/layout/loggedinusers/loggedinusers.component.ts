import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef, AfterViewInit, NgZone } from '@angular/core';
import { ApiService } from './../../shared/services/api/api.service';
import { SocketService } from '../../shared/services/socket/socket.service';
import { Subscription } from 'rxjs';
import { CommonService } from './../../shared/services/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { ChangeDetectionStrategy } from '@angular/compiler/src/compiler_facade_interface';

@Component({
  selector: 'app-loggedinusers',
  templateUrl: './loggedinusers.component.html',
  styleUrls: ['./loggedinusers.component.scss'],
})
export class LoggedinusersComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() public myInputVariable: string;

  loggedinArr;
  _clientArr: any = [];
  user_id: any;
  organization;
  facility;
  totalcall = 0;
  private isLogdInUsrApiCalled: boolean = false;
  private subscription: Subscription = new Subscription();
  zone: NgZone;

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    public commonService: CommonService,
    public router: Router,
    public aes256Service: Aes256Service,
    public route: ActivatedRoute,
    public cdr: ChangeDetectorRef,
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  async ngOnInit() {
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.socketService.joinRoomWithfac(contentVal.fac, 'USER');
          this.getConnectedUserDetailFn();
        }

      }
    );

    const storeObj = await this.apiService.getauthData();
    this.user_id = storeObj['user_id'];
    if (!this.user_id) {
      let payload = this.route.params['_value']['id']
      const hashingPayload = (this.aes256Service.decFnWithsalt(payload));
      this.user_id = hashingPayload.userId;
    }
    this.subscription = this.socketService.onLoginUpdateFn().subscribe((_response) => {
      if (
        this.router.url.includes('dashboard') ||
        this.router.url.includes('livedashboard')
      ) {
        if (this.facility) {
          // setTimeout(() => {
          this.getConnectedUserDetailFn();
          // }, 5000);
        }
        // this.isLogdInUsrApiCalled = true;
      }
      // if(this.isLogdInUsrApiCalled == true){
      //   setTimeout(()=>{
      //     this.isLogdInUsrApiCalled = false;
      //   },300000) // set isLogdInUsrApiCalled false after 5 minutes.
      // }
    });
  }

  async getConnectedUserDetailFn() {
    const action = { type: 'POST', target: 'reports/get_loggedin_user' };
    const payload = { fac_id: this.facility };
    const result = await this.apiService.apiFn(action, payload);
    this._clientArr = [];
    console.log('resultresultresult ----', result);
    if (result['data'] && result['status']) {      
      this._clientArr = result['data'];
      const output = [];
      this._clientArr.forEach((item) => {
        const existing = output.filter((v, i) => {
          return v.user_id === item.user_id;
        });
        if (existing.length) {
          const existingIndex = output.indexOf(existing[0]);
          output[existingIndex].platform = output[
            existingIndex
          ].platform.concat(item.platform);
        } else {
          if (typeof item.platform === 'string') {
            item.platform = [item.platform];
          }
          // let currentfacility = item.user[0].facility.filter(x => x.fac == this.facility && x.selected == true) || []
          // if (currentfacility.length > 0)
            output.push(item);
        }
      });


      this._clientArr = output;
      const currentUser =
        this._clientArr.find((x) => x.user_id == this.user_id) || null;
      if (currentUser) {
        this._clientArr = this._clientArr.filter((x) => x.user_id != this.user_id) || [];
        this._clientArr.unshift(currentUser);
      } else {
        // if (this.totalcall <= 5) {
        //   this.totalcall++;
        //   this.getConnectedUserDetailFn();
        // }
      }
    }
    this.zone.run(() => {
      // console.log('this._clientArr ===>>',this._clientArr)
    })
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    // this.joinRoomFn('USER', true);
    this.subscription.unsubscribe();
  }


}
