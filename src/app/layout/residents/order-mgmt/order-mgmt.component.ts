import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatPaginator,
  MatSelectionList,
  MatListOption,
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
import { SocketService } from './../../../shared/services/socket/socket.service';
import { CommonService } from './../../../shared/services/common.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { MatOption } from '@angular/material';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { ViewOrderComponent } from 'src/app/shared/modals/view-order/view-order.component';
import { CdkDragDrop, CdkDragStart } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-order-mgmt',
  templateUrl: './order-mgmt.component.html',
  styleUrls: ['./order-mgmt.component.scss'],
})
export class OrderMgmtComponent implements OnInit {
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  @ViewChild('deleteButton', { static: true }) private deleteButton: ElementRef;
  @ViewChild('restoreButton', { static: true })
  private restoreButton: ElementRef;
  // @ViewChild('folderList') private folderList: MatSelectionList;
  @Input() unProcessedMedicationOrderCount: number;
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
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  public show = false;
  actualDataCount;

  organization;
  facility;
  checked;
  faclist;
  data: any = [];
  pagiPayload = {
    // moduleName: 'orderList',
    // length: 0,
    page_index: 0,
    page_size: 10,
    // previousPageIndex: 0,
    search: '',
    // prescriptionCreated: false,
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
      id: 1,
      value: 'Labs and Draws',
      key: 'labs_and_draws',
    },
    {
      id: 2,
      value: 'Medications and Treatments',
      key: 'medications',
    },
    {
      id: 3,
      value: 'Misc',
      key: 'misc',
    },
    {
      id: 4,
      value: 'Physician Notifications',
      key: 'physician_notifications',
    },
    {
      id: 5,
      value: 'Therapy',
      key: 'therapy',
    },
  ];
  folderNameList = [
    {
      id: 1,
      value: 'Linked Orders',
      key: 'all',
    },
    {
      id: 2,
      value: 'Un-linked Orders',
      key: 'unlink_orders',
    },
    {
      id: 3,
      value: 'Labs and Draws',
      key: 'labs_and_draws',
    },
    {
      id: 4,
      value: 'Medications and Treatments',
      key: 'medications',
    },
    {
      id: 5,
      value: 'Misc',
      key: 'misc',
    },
    {
      id: 6,
      value: 'Physician Notifications',
      key: 'physician_notifications',
    },
    {
      id: 7,
      value: 'Therapy',
      key: 'therapy',
    },
  ];
  dialogConfig = new MatDialogConfig();
  prescriptionCreated = false;
  medOrderListing = false;
  activeFolder = 'all';
  prevActiveFolder = 'all';
  displayOpenFolder = true;
  // done = 'done';
  dragged_question: any = '';
  done = 'done';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private socketService: SocketService,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService
  ) {
    
  }

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
    // this.folderList.selectedOptions._multiple = false;

    // if (!this._commonService.checkPrivilegeModule('medication')) {
    //   this._router.navigate(['/']);
    // }
    let bodyElement: HTMLElement = document.body;

  // dragStart(event: CdkDragStart) {
  //   this.bodyElement.classList.add('inheritCursors');
  //   this.bodyElement.style.cursor = 'move'; 
  //   //replace 'move' with what ever type of cursor you want
  // }

  // drop(event: CdkDragDrop<string[]>) {
  //   this.bodyElement.classList.remove('inheritCursors');
  //   this.bodyElement.style.cursor = 'unset';
  //   ...
  //   ...
  // }
    this.orderForm = this.fb.group({
      resident_id: [''],
      resident_name: [''],
      folderName: [''],
      folder_id: [''],
    });

    this.subscription = await this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.pagiPayload['org_id'] = this.organization = contentVal.org;
          this.pagiPayload['fac_id'] = this.facility = contentVal.fac;
        }
      }
    );
    this._commonService.setLoader(true);

    if (sessionStorage.getItem('orderListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('orderListing'));
      if (pageListing.orderList) {
        // this.pagiPayload['previousPageIndex'] =
        //   pageListing.orderList.previousPageIndex;
        this.pagiPayload.page_index = pageListing.orderList.pageIndex;
        this.pagiPayload.page_size = pageListing.orderList.pageSize;
        // this.pagiPayload['length'] = pageListing.orderList.length;
      } else {
        sessionStorage.setItem(
          'orderListing',
          JSON.stringify({ orderList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'orderListing',
        JSON.stringify({ orderList: this.pagiPayload })
      );
    }

    // this._commonService.payloadSetup('orderList', this.pagiPayload);
    if (this.route.params['_value']['id']) {
      this._commonService.setLoader(true);
      console.log("Params", this.route.params['_value']['id']);
      this.residentId = this._aes256Service.decFnWithsalt(
        this.route.params['_value']['id']
      );
      // this.pagiPayload['resident_id'] = this.residentId;
      this.pagiPayload['order_folder'] = 'unlink_orders';
      this.getServerData(this.pagiPayload);
    }

    this.subscription.add(
      this.socketService.updateOrderFn().subscribe(async (_response: any) => {
        this.getServerData(this.pagiPayload);
      })
    );
  }

  ngOnDestroy() {
    this._commonService.setMoreOption(false);
    this.subscription.unsubscribe();
    // this.eventsubscription.unsubscribe();
  }

  public async getResidentLinkOrderDataFunction() {
    this.pagiPayload['care_type'] = ["1", "3"];
    this._commonService.setLoader(true);
    // const action = {
    //   type: 'POST',
    //   target: 'residents/all_orders_of_resident',
    // };
    const payload = this.pagiPayload;
    // console.log(payload)
    // let result = await this.apiService.apiFn(action, payload);
  //   this.residentId = await this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
  //   const payload = {
  //     org_id: "5a859f300b48ce45436f3948",
  //     fac_id: "5a859ff30b48ce45436f3949",
  //     care_type: ["1", "3"],
  //     order_folder: "all",
  //     prescription_created : "",
  //     page_index: 0,
  //     page_size: 10,
  // };
    const action = { type: 'POST', target: `residents/${this.residentId}/orders` };

    let result = await this.apiService.apiFn(action, payload);
    // console.log(JSON.stringify(result));
    this.count = result['count'];
    if (result['status']) {
      if (
        (!result['data'] || result['data'].length === 0) &&
        this.pagiPayload.page_index > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['count'];

        result = await result['data'].map((item) => {
          return {
            ...item
          };
        });
        this._commonService.setLoader(false);
        this.data = result;
        // console.log('this.data---->', this.data);
        this.orderArray = this.data;
        console.log("Order Array",this.orderArray);
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.checked = false;
      }
    }
    this._commonService.setLoader(false);
  }

  async deleteOrder(order){
    this._commonService.setLoader(true);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'delete_order'}
    });
    dialogRef.afterClosed().subscribe(async res => {
      if(res){
        const payload = {
          id: order._id,
          restore_data: false
        };
        const action = {
          type: 'POST',
          target: 'residents/delete_res_order',
        };
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          this.toastr.success("Order Deleted Successfully");
          this._commonService.setLoader(false);
          this.orderForm.reset();
          this.getServerData(this.pagiPayload);
        }
        else {
          this.toastr.error("Please try again later");
        }
      }
    });
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
      'orderListing',
      JSON.stringify({ orderList: this.pagiPayload })
    );
    // this._commonService.updatePayload(null, 'orderList', this.pagiPayload);
    this.getResidentLinkOrderDataFunction();
  }

  public async getServerData(event) {
    this._commonService.setLoader(true);
    // this.pagiPayload['previousPageIndex'] = event.previousPageIndex;
    if(event.pageIndex || event.pageSize){
      
      this.pagiPayload.page_index = event.pageIndex;
      this.pagiPayload.page_size = event.pageSize;
    }if(event.page_index || event.page_size){

      this.pagiPayload.page_index = event.page_index;
      this.pagiPayload.page_size = event.page_size;
    }
    // this.pagiPayload['length'] = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'orderListing',
      JSON.stringify({ orderList: this.pagiPayload })
    );
    // this._commonService.updatePayload(event, 'orderList', this.pagiPayload);
    this.getResidentLinkOrderDataFunction();
  }

  selectFolderName(key, facId) {
    this.orderForm.controls.resident_id.patchValue(key);
  }

  async moveOrderFn(orderId, isValid, formDirective: FormGroupDirective) {
    if (!this.orderForm.value.folder_id) {
      this.toastr.error('Please select any folder');
    } else if (isValid) {
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
        target: 'residents/move_ether_fax',
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

  addOrder(data) {
    const residentId = this.route.params['_value']['id'];
    // console.log('residentId---->', residentId);
    const navigateLink = '/residents/form/' + residentId + '/add_order';
    // console.log('navigateLink---->', navigateLink);
    // console.log('data---->', data);
    this.router.navigate([navigateLink], {
      queryParams: {
        orderId: this._aes256Service.encFnWithsalt(data._id),
        residentId: this._aes256Service.encFnWithsalt(this.residentId),
        orderType: data.folderName
      }
    });

    // this.router.navigate(['/residents/form/' + residentId + '/medication']);
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

  changeMedFolder(value) {
    this.prescriptionCreated = true;
    // console.log('value--->', value);
    this.pagiPayload['prescription_created'] = true;
    // if (value === 'order_prescribed') {
    //   this.prescriptionCreated = true;
    // } else if (value === 'order_not_prescribed') {
    //   this.prescriptionCreated = true;
    //   this.pagiPayload['prescription_created'] = false;
    // }
    // console.log('this.pagiPayload----->', this.pagiPayload);
    this.getServerData(this.pagiPayload);
  }

  selectFolder(folderName) {
    console.log('folderName---->', folderName);
    if (!this.prevActiveFolder) {
      this.prevActiveFolder = folderName;
    } else {
      if (this.prevActiveFolder === folderName) {
        this.displayOpenFolder = !this.displayOpenFolder;
      } else {
        this.displayOpenFolder = true;
      }
    }
    this.activeFolder = folderName;
    if (folderName === 'medications') {
      // this.medOrderListing = true;
      this.prescriptionCreated = false;
      this.pagiPayload['prescription_created'] = false;
    } else {
      this.medOrderListing = false;
    }
    this.pagiPayload['order_folder'] = folderName;
    this.getServerData(this.pagiPayload);
  }

  changeFolderName(event) {
    if (event.value === 'medications') {
      this.medOrderListing = true;
      this.pagiPayload['prescription_created'] = false;
    } else {
      this.medOrderListing = false;
    }
    this.pagiPayload['order_folder'] = event.value;
    this.getServerData(this.pagiPayload);
  }

  async drop(event: CdkDragDrop<string[]>) {
    // console.log('this.dragged_question---->', event);
    // console.log('event---->', event);
    // console.log('event.item.data---->', event.item.data.order_data);
    // console.log('event.previousContainer.id---->', event.previousContainer.id);
    // console.log('event.container.id---->', event.container.id);
    if (
      event.container.id !== 'orderSection' &&
      this.activeFolder !== event.container.id
    ) {
      // this._commonService.setLoader(true);
      const user_Id = sessionStorage.getItem('user_Id');
      let orderBody = {};
      orderBody = {
        id: event.item.data.order_data._id,
        residentId: this.residentId,
        userId: user_Id,
        facId: this.facility,
        folderName: event.container.id,
      };

      const action = {
        type: 'POST',
        target: 'residents/move_ether_fax',
      };
      const payload = [orderBody];
      console.log('payload--------->', payload);
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this._commonService.setLoader(false);
        this.orderForm.reset();
        this.getServerData(this.pagiPayload);
      }
    }
  }

  started(event: CdkDragStart<string[]>) {
    // console.log('started');
    // var dragplaceholder = document.getElementsByClassName('cdk-drag-placeholder');
    // if (dragplaceholder && dragplaceholder.length > 0) {
      //   dragplaceholder['style'].display = 'none';
      // }
  }

  dragStart(event) {
    console.log('event.source.data---->', event.source);
    this.dragged_question = JSON.stringify(event.source);
  }
}
