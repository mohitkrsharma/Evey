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
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
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
import { ExcelService } from './../../../shared/services/excel.service';
import { SocketService } from './../../../shared/services/socket/socket.service';
import { CommonService } from './../../../shared/services/common.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { MatOption } from '@angular/material';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { ViewOrderComponent } from 'src/app/shared/modals/view-order/view-order.component';
import { DragNDropUploadComponent } from 'src/app/shared/modals/dragndropupload/dragndropupload.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {

  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;

  org;
  fac;
  public btnAction: Function;
  public filtershow = false;
  search: any;
  residentSearch = '';
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
  selectedResidentData: any;

  organization;
  facility;
  checked;
  faclist;
  dialogConfig = new MatDialogConfig();
  data: any = [];
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
  };
  residentPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' }
  };
  count;

  eventsubscription: Subscription;
  subscription1: Subscription;
  subscription: Subscription = new Subscription();
  orderArray = [];
  residentData;
  orderForm: FormGroup;
  roomName = '';

  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;

  constructor(
    private fb: FormBuilder,
    private _router: Router,
    private apiService: ApiService,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService,
    private socketService: SocketService,
    private toastr: ToastrService,
    private dialog: MatDialog
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

  openPDFViewer(data) {
    // console.log('data----->', data);
    this.dialogConfig.width = '900px';
    this.dialogConfig.autoFocus = false;
    this.dialogConfig.maxHeight = '900px';
    // this.dialogConfig.panelClass = 'physician_dialog';
    this.dialogConfig.data = data;
    const dialogRef = this.dialog.open(ViewOrderComponent, this.dialogConfig);
  }

  gotoTop() {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }

  async ngOnInit() {
    if (!this._commonService.checkAllPrivilege('Order Management')) {
      this._router.navigate(['/']);
    }
    this.orderForm = this.fb.group({
      resident_id: ['', ],
      resident_name: [''],
      residentSearch: '',
    });

    this.subscription = await this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.residentPagiPayload['fac_id'] = this.facility = contentVal.fac;
        this.pagiPayload['facId'] = this.facility = contentVal.fac;
        await this.getResidentServerData(this.residentPagiPayload);
        this.roomName = this.facility + '-EMAR';
        this.connectWithSocketFn();
        await this.getServerData(this.pagiPayload);
      }
    });
    this._commonService.setLoader(true);
    this.eventsubscription = this._router.events.subscribe(async (event) => {
      if (event instanceof NavigationEnd) {
        this.search = '';
        this.residentPagiPayload = {
          length: 0,
          pageIndex: 0,
          pageSize: 10,
          previousPageIndex: 0,
          search: '',
          sort: { active: 'name', direction: 'asc' }
        };
        this.residentPagiPayload['fac_id'] = this.facility;
        // await this.getResidentServerData(this.residentPagiPayload);
      }
    });

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

    // this.subscription.add(this.socketService.addOrderFn().subscribe(async (_response: any) => {
    //   this.getServerData(this.pagiPayload);
    // }));

    // this.subscription.add(this.socketService.updateOrderFn().subscribe(async (_response: any) => {
    //   this.getServerData(this.pagiPayload);
    // }));

    await this.getResidentServerData(this.residentPagiPayload);
    await this.getServerData(this.pagiPayload);

    this.subscription.add(this.socketService.addOrderFn().subscribe(async (res: any) => {
      console.log('new_order', res);
      this.getOrderDataFunction();
    }));
    this.subscription.add(this.socketService.updateOrderFn().subscribe(async (res: any) => {
      console.log('order_update', res);
      this.getOrderDataFunction();
    }));

  }

  connectWithSocketFn() {
    this.socketService.connectFn(this.roomName).subscribe(_response => {
      if (_response) {
          console.log('order Socket Res --->', _response);
      }
    });
  }

  ngOnDestroy() {
    this._commonService.setMoreOption(false);
    // this._commonService.setLastCrumb(false);
    this.subscription.unsubscribe();
    this.eventsubscription.unsubscribe();
    this.socketService.disConnectFn(this.roomName).subscribe(async (_result: any) => {
      console.log('result after socket disconnection--->', _result);
    });
  }

  public async getOrderDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'residents/list_ether_fax',
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    console.log("Orders to file ------",result);
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
        this.orderArray = this.data;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
          this._commonService.setunlinkOrderCount(this.actualDataCount);
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
    this.getOrderDataFunction();
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
    this.getOrderDataFunction();
  }

  openUploadModal(){
    this.dialogConfig.width = '600px';
    this.dialogConfig.autoFocus = false;
    this.dialogConfig.maxHeight = '500px';
    //this.dialogConfig.data = data;
    let _dialogRef = this.dialog.open(DragNDropUploadComponent, this.dialogConfig);
    _dialogRef.afterClosed().subscribe((result:any) => {
      console.log("Uploaded popup msg----", result);
      if(result){
        this.getServerData(this.pagiPayload);
      }
    });
  }

  public async getResidentServerData(event?: PageEvent) {
    // this._commonService.setLoader(true);
    this.residentPagiPayload.previousPageIndex = event.previousPageIndex;
    this.residentPagiPayload.pageIndex = event.pageIndex;
    this.residentPagiPayload.pageSize = event.pageSize;
    this.residentPagiPayload.length = event.length;
    this.residentPagiPayload.search = this.residentSearch;
    this.getResidentUsersDataFunction();
  }

  public async getResidentUsersDataFunction() {
    // this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'residents/list_resident_medication'
    };
    this.residentPagiPayload['fac_id'] = this.facility;
    this.residentPagiPayload['listType'] = 'dropdownView';
    const payload = this.residentPagiPayload;
    // console.log('getResidentUsersDataFunction payload----->', payload);
    const result = await this.apiService.apiFn(action, payload);
    // console.log('api residentData---->', result['data']['_residents']);

    if (result['status']) {
      this.residentData = await result['data']['_residents'].map(function (item) {
        const obj = {};
        obj['value'] = item.last_name + ', ' + item.first_name;
        obj['key'] = item._id;
        obj['facId'] = item.facility[0].fac;
        obj['room'] = item.room;
        return obj;
      });
      if (this.selectedResidentData) {
        const index = this.residentData.findIndex(item => item.key === this.selectedResidentData.key);
        if (index === -1) {
          this.residentData.push(this.selectedResidentData);
        }
      }
    }
    // console.log('this.residentData---->', this.residentData);
    this._commonService.setLoader(false);
  }

  async filterResident(event) {
    this.residentSearch = event;
    await this.getResidentServerData(this.residentPagiPayload);
  }

  selectResidentName(data, facId) {
    this.selectedResidentData = data;
    // console.log('resident id----->', data.key);
    this.orderForm.controls.resident_id.patchValue(data.key);
  }

  async orderLinkFn(orderId, isValid, formDirective: FormGroupDirective) {
    if (!this.orderForm.value.resident_id) {
      return this.toastr.error('Please select any folder');
    }
    if (isValid) {
        this._commonService.setLoader(true);
        const user_Id = sessionStorage.getItem('user_Id');
        let orderBody = {};
        orderBody = {
          orderId: orderId,
          residentId: this.orderForm.value.resident_id,
          userId: user_Id,
        };
        const action = {
          type: 'POST',
          target: 'residents/link_order_to_resident'
        };
        const payload = orderBody;
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

  // searching
  // onChange(item, event) {
  //   this.search = item;
  //   setTimeout(() => {
  //     this.getResidentServerData(this.residentPagiPayload);
  //   }, 2000);
  // }

  async filterResidentData(event) {
    // console.log('filterPhysicianData event----->', event.target.value);
    console.log('residentSearch--->', this.residentSearch);
    // console.log('this.orderForm.controls.residentSearch.value--->', this.orderForm.controls.residentSearch.value);
    this.residentPagiPayload['search'] = this.residentSearch;
    await this.getResidentServerData(this.residentPagiPayload);
  }

  async openSelectDropdown(event) {
    console.log('openSelectDropdown event--->', event);
    if (event === true) {
      this.residentSearch = '';
      this.orderForm.controls.residentSearch.patchValue('');
      await this.getResidentServerData(this.residentPagiPayload);
    }
  }

}
