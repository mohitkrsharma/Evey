import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatPaginator,
} from '@angular/material';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { fromEvent } from 'rxjs';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
  startWith,
} from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { CommonService } from './../../../shared/services/common.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { MatOption } from '@angular/material';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';


@Component({
  selector: 'app-link-resident',
  templateUrl: './link-resident.component.html',
  styleUrls: ['./link-resident.component.scss']
})
export class LinkResidentComponent implements OnInit {

  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;

  org;
  fac;
  public btnAction: Function;
  public filtershow = false;
  search: any;
  residentSearch: any;
  pageIndex: number;
  pageSize: number;
  length: number;
  exportdata;
  arr = [];
  isShow: boolean;
  topPosToStartShowing = 100;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public show = false;
  actualDataCount;

  organization;
  facility;
  checked;
  faclist;
  data: any = [];
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };
  count;

  eventsubscription: Subscription;
  subscription1: Subscription;
  subscription: Subscription = new Subscription();
  orderArray = [];
  residentData;
  orderForm: FormGroup;
  folderNameSearch = '';
  folderNameSelect = '';
  residentId = '';
  moveFolderList = [
                      {
                        id: 1, value: 'Labs and draws', key: 'labs_and_draws',
                      },
                      {
                        id: 2, value: 'Medications', key: 'medications',
                      },
                      {
                        id: 3, value: 'Misc', key: 'misc',
                      },
                      {
                        id: 4, value: 'Physician notifications', key: 'physician_notifications',
                      },
                      {
                        id: 5, value: 'Therapy', key: 'therapy',
                      },
                   ];
  folderNameList = [
                      {
                        id: 1, value: 'All', key: 'all',
                      },
                      {
                        id: 2, value: 'Labs and draws', key: 'labs_and_draws',
                      },
                      {
                        id: 3, value: 'Medications', key: 'medications',
                      },
                      {
                        id: 4, value: 'Misc', key: 'misc',
                      },
                      {
                        id: 5, value: 'Physician notifications', key: 'physician_notifications',
                      },
                      {
                        id: 6, value: 'Therapy', key: 'therapy',
                      },
                   ];

  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;

  constructor(
    private fb: FormBuilder,
    private _router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService,
    private socketService: SocketService,
  ) {}

  @HostListener('window:scroll')
  checkScroll() {
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  gotoTop() {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }

  async ngOnInit() {
    // if (!this._commonService.checkPrivilegeModule('medication')) {
    //   this._router.navigate(['/']);
    // }
    this.orderForm = this.fb.group({
      resident_id: ['', ],
      resident_name: [''],
      folderName: [''],
      folder_id: [''],
    });

    this.subscription = await this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.pagiPayload['facId'] = this.facility = contentVal.fac;
      }
    });
    this._commonService.setLoader(true);

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.orderList) {
        this.pagiPayload.previousPageIndex =
          pageListing.orderList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.orderList.pageIndex;
        this.pagiPayload.pageSize = pageListing.orderList.pageSize;
        this.pagiPayload.length = pageListing.orderList.length;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ orderList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ orderList: this.pagiPayload })
      );
    }
    if (this.route.params['_value']['id']) {
      this._commonService.setLoader(true);
      this.residentId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      this.pagiPayload['resident_id'] = this.residentId;
      this.pagiPayload['folderName'] = 'unlink_orders';
      this.getServerData(this.pagiPayload);
    }

    this.subscription.add(this.socketService.updateOrderFn().subscribe(async (_response: any) => {
      this.getServerData(this.pagiPayload);
    }));

  }

  ngOnDestroy() {
    this._commonService.setMoreOption(false);
    this.subscription.unsubscribe();
    // this.eventsubscription.unsubscribe();
  }

  public async getResidentLinkOrderDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'residents/all_orders_of_resident',
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    if (result['status']) {
      if (
        (!result['data'] ||
          result['data'].length === 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['data']['_count'];

        result = await result['data']['_etherfaxes'].map((item) => {
          return {
            ...item,
            user_name: item.user ? item.user.first_name + ' ' + item.user.last_name : '-',
          };
        });
        this._commonService.setLoader(false);
        this.data = result;
        // console.log('this.data---->', this.data);
        this.orderArray = this.data;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.checked = false;
      }
    }
    this._commonService.setLoader(false);
  }

  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload.sort = {
      active: this.sort.active,
      direction: this.sort.direction,
    };
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ orderList: this.pagiPayload })
    );
    this.getResidentLinkOrderDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ orderList: this.pagiPayload })
    );
    this.getResidentLinkOrderDataFunction();
  }

  selectFolderName(key, facId) {
    this.orderForm.controls.resident_id.patchValue(key);
  }

  async moveOrderFn(orderId, isValid, formDirective: FormGroupDirective) {

    if (isValid) {
        this._commonService.setLoader(true);
        const user_Id = sessionStorage.getItem('user_Id');
        let orderBody = {};
        orderBody = {
          id: orderId,
          residentId: this.residentId,
          userId: user_Id,
          facId: this.facility,
          folderName: this.orderForm.value.folder_id,
        };

        const action = {
          type: 'POST',
          target: 'residents/move_ether_fax'
        };
        const payload = [orderBody];
        // console.log('payload--------->', payload);
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          this._commonService.setLoader(false);
          formDirective.resetForm();
          this.orderForm.reset();
          this.getServerData(this.pagiPayload);
        }
    }
  }

  changeFolderName(event) {
    this.pagiPayload['folderName'] = event.value;
    this.getServerData(this.pagiPayload);
  }

  addMedication(data) {
    // console.log('data---->', data);
    this._router.navigate(['/medications/form'], {queryParams: {orderId: this._aes256Service.encFnWithsalt(data._id)}});
  }

}
