import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatPaginator,
  MatSort,
  MatTableDataSource,
  PageEvent,
} from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, Subscription } from 'rxjs';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { AlertComponent } from 'src/app/shared/modals/alert/alert.component';
import { SocketService } from 'src/app/shared/services/socket/socket.service';
import { AddHospitalComponent } from '../../../shared/modals/add-hospital/add-hospital.component';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from 'mat-range-datepicker';
import { take } from 'rxjs/operators';
import { ConstantsService } from 'src/app/shared/services/constants.service';
import { AddTestingDeviceComponent } from 'src/app/shared/modals/add-testingdevice/add-testingdevice.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  physician: any = {
    first_name: '',
    last_name: '',
    practice_name: '',
    medical_profession_type: '',
    address1: '',
    address2: '',
    state: '',
    city: '',
    zip: '',
    mobile: '',
    home: '',
    office: '',
    fax: '',
    other: '',
    email: '',
    notes: '',
    phone_numbers: [],
    title: '',
    website_address: '',
    medicare_provider_number: '',
    medicaid_provider_number: '',
    national_provider_id: '',
    group_national_provider_id: '',
    registration_code: '',
    taxonomy_code: '',
    state_license_number: '',
    dea_number: '',
    isCredentialeChecked: false,
    isSanctionedChecked: false,
  };

  isCredentialeChecked = false;
  isSanctionedChecked = false;

  pagiPayload: PagiElement = {
    // moduleName: 'hospitalList',
    //length: 0,
    pageIndex: 0,
    pageSize: 10,
    search: '',
    //sort: { active: '', direction: 'asc' },
    // organization: '',
    fac_id: '',
  };
  displayedColumns = [];
  isShow = true;
  columnNames = [
    {
      id: 'name',
      value: 'Device Name',
      sort: true,
    }
  ];
  search: any = '';
  PhoneNumberTypeSearch = '';
  checked;
  deleteArr = [];
  count;
  actualDataCount;
  data;
  organization;
  facility;
  dataSource;

  // physician phone
  mobile_physician = true;
  home_physician = false;
  office_physician = false;
  fax_physician = false;
  other_physician = false;

  private subscription: Subscription;
  isEdit = false;

  dialogConfig = new MatDialogConfig();
  dialogRefs: any;
  privilege = 'add';
  public isLoading = false;
  public isClicked = false;
  hasNextPage = false;
  public totalCount: any;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('deleteButton', { static: true }) private deleteButton: ElementRef;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  @ViewChild('physicianPopup', { static: true })
  physicianPopup: TemplateRef<any>;

  constructor(
    private apiService: ApiService,
    private router: Router,
    public route: ActivatedRoute,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private _socketService: SocketService,
    private _aes256Service: Aes256Service,
    public commonService: CommonService,
    public _constantsService: ConstantsService
  ) {}

  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.getServerData(this.pagiPayload);
        }
      }
    );

    // if (sessionStorage.getItem('pageListing')) {
    //   const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
    //   if (pageListing.physicianList) {
    //     this.pagiPayload.pageIndex = pageListing.physicianList.pageIndex;
    //     this.pagiPayload.pageSize = pageListing.physicianList.pageSize;
    //     // this.pagiPayload.length = pageListing.physicianList.length;
    //     // this.pagiPayload.sort = pageListing.physicianList.sort;
    //     this.pagiPayload.search = pageListing.physicianList.search;
    //     this.search = pageListing.physicianList.search;
    //   } else {
    //     sessionStorage.setItem(
    //       'pageListing',
    //       JSON.stringify({ physicianList: this.pagiPayload })
    //     );
    //   }
    // } else {
    //   sessionStorage.setItem(
    //     'pageListing',
    //     JSON.stringify({ physicianList: this.pagiPayload })
    //   );
    // }

    // Mat table columns with checkbox and actions
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    //this.commonService.payloadSetup('physicianList', this.pagiPayload);
    // Searching

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    // this.subscription.add(
    //   this._socketService.addPhysicianFn().subscribe(async (res: any) => {
    //     console.log('Add Pharmacy response', res);
    //     console.log('add_prescriber');
    //     this.getHospitalList();
    //   })
    // );
    // this.subscription.add(
    //   this._socketService.updatePhysicianFn().subscribe(async (res: any) => {
    //     console.log('update_doctor response', res);
    //     console.log('update_doctor');
    //     this.getHospitalList();
    //   })
    // );
  }

  // async connectWithSocketFn() {
  //   const roomName = this.facility + '-MASTER';
  //   this._socketService.connectFn(roomName).subscribe((_response) => {
  //     if (_response) {
  //       console.log('Socket Res ===>', _response);
  //     }
  //   });
  // }

  async getServerData(event) {
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.search = this.search;
    this.pagiPayload.fac_id = this.facility;
    console.log("Pagipayload",this.pagiPayload);
   // this.commonService.updatePayload(event, 'hospitalList', this.pagiPayload);
    this.getTestingDeviceList();
  }

  async addTestingDevicePopup() {
    this.dialogConfig.width = '500px';
    this.dialogConfig.autoFocus = false;
    this.dialogConfig.height = '300px !important';
    const dialogRef = this.dialog.open(AddTestingDeviceComponent, this.dialogConfig);
    dialogRef.afterClosed().subscribe((res) => {
      console.log("Result---->",res);
      if (res && res.status) {
        console.log(res);
        this.getTestingDeviceList();
      }
    });
  }

  // edit hospital
  async editDevice(deviceData, deviceId) {
    const config = {
      width: '500px',
      height: '300px',
      autoFocus: false,
      data: { testingDevice: deviceData }
    };
    this.dialogRefs = this.dialog.open(AddTestingDeviceComponent, config);

    this.dialogRefs.afterClosed().subscribe((res) => {
      console.log("Result--->",res);
      if (res && res.status) {
        
      }
    });
  }

  async getTestingDeviceList() {
    this.commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'device/get',
    };
    const payload = this.pagiPayload;

    console.log("Testing device Payload------>>>>", payload, action);

    let result = await this.apiService.apiFn(action, payload);
    console.log("Testing device result ----", result);

    if (result['status']) {
      if (
        (!result['data'] || result['data'].length < 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['data']['_count'];
        this.hasNextPage = result['data']['isNextPage'];
        this.data = result['data']['_devices'];
        this.totalCount = result['data']['_devices'].length;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.createTable(result['data']['_devices']);
        this.checked = false;
        this.deleteArr = [];
      }
    }
    this.commonService.setLoader(false);
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    const arrLen = arr.length;
    if (arrLen < this.pagiPayload.pageSize) {
      const startIndex = this.pagiPayload.pageIndex * this.pagiPayload.pageSize;
      const endIndex = startIndex + arrLen;
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = startIndex + 1 + ' - ' + endIndex;
      this.hasNextPage === true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    } else {
      const tempRange = this.paginator._intl.getRangeLabel(
        this.pagiPayload.pageIndex,
        this.pagiPayload.pageSize,
        arr.length
      );
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = tempRange.substring(0, tempRange.indexOf('o'));
      this.hasNextPage === true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    }
  }
  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this.pagiPayload['sort'] = sort;
    // sessionStorage.setItem(
    //   'pageListing',
    //   JSON.stringify({ hospitalList: this.pagiPayload })
    // );
    //this.commonService.updatePayload(null, 'hospitalList', this.pagiPayload);
    this.getTestingDeviceList();
  }

  selectAll() {
    if (this.checked === true) {
      this.data.forEach((element) => {
        element.checked = false;
        this.deleteArr = [];
      });
    } else {
      this.data.forEach((element) => {
        this.deleteArr.push(element._id);
        element.checked = true;
      });
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
    } else if (
      (this.deleteArr && this.deleteArr.length) === this.actualDataCount
    ) {
      this.checked = true;
    }
  }

  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select hospital to be deleted');
        this.checked = false;
      }
    } else {
      //   console.log('---delete arr--', this.deleteArr);
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'testingdevice',
          deviceIds: this.deleteArr,
          API: 'device/delete',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result && result['status']) {
          this.toastr.success(result['message']);
          this.getServerData(this.pagiPayload);
          this.checked = false;
        } else {
          this.data.forEach((element) => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove(
          'cdk-program-focused'
        );
        this.deleteButton['_elementRef'].nativeElement.classList.remove(
          'cdk-focused'
        );
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  deleteDevice(id) {
    this.deleteArr = [];
    this.deleteArr.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'testingdevice',
        deviceIds: this.deleteArr,
        API: 'device/delete',
        // isUnlinkResident: true,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.deleteArr = [];
      this.checked = false;
      // console.log('result---->', result);
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      } else {
        // this.toastr.error(result['message']);
      }
    });
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  hospital() {
    const hospitalData: any = {
      department_name: '',
      hospital_name: '',
      address1: '',
      address2: '',
      state: '',
      city: '',
      zip: '',
      mobile: '',
      
      email: '',
      phone_numbers: [],
      website_address: '',
    };
    return hospitalData;
  }

  formatPhoneNumberToUS(phone) {
    return this.commonService.formatPhoneNumberToUS(phone);
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'physician/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      //this.totalCount = result['count'];
    }
  }

  async ngAfterViewChecked() {
    this.hasNextPage == true
      ? document
          .getElementsByClassName('mat-paginator-navigation-next')[0]
          .removeAttribute('disabled')
      : document
          .getElementsByClassName('mat-paginator-navigation-next')[0]
          .setAttribute('disabled', 'true');
  }
}

export interface PagiElement {
  // moduleName?: string;
  //length: number;
  pageIndex: number;
  pageSize: number;
  search: '';
  // sort: Object;
  // organization: '';
  fac_id: '';
}

const statelist: State[] = [
  {
    id: 3825,
    name: 'Alabama',
    country_id: 233,
  },
  {
    id: 3826,
    name: 'Alaska',
    country_id: 233,
  },
  {
    id: 3827,
    name: 'Arizona',
    country_id: 233,
  },
  // {
  //   'id': 4021,
  //   'name': 'American Samoa',
  //   'country_id': 233
  // },
  {
    id: 3828,
    name: 'Arkansas',
    country_id: 233,
  },
  {
    id: 3830,
    name: 'California',
    country_id: 233,
  },
  // {
  //   'id': 3829,
  //   'name': 'Byram',
  //   'country_id': 233
  // },
  // {
  //   'id': 3831,
  //   'name': 'Cokato',
  //   'country_id': 233
  // },
  {
    id: 3832,
    name: 'Colorado',
    country_id: 233,
  },
  {
    id: 3833,
    name: 'Connecticut',
    country_id: 233,
  },
  {
    id: 3834,
    name: 'Delaware',
    country_id: 233,
  },
  // {
  //   'id': 3835,
  //   'name': 'District of Columbia',
  //   'country_id': 233
  // },
  // {
  //   'id': 4022,
  //   'name': 'Federated States Of Micronesia',
  //   'country_id': 233
  // },
  {
    id: 3836,
    name: 'Florida',
    country_id: 233,
  },
  {
    id: 3838,
    name: 'Hawaii',
    country_id: 233,
  },
  {
    id: 3839,
    name: 'Idaho',
    country_id: 233,
  },
  {
    id: 3840,
    name: 'Illinois',
    country_id: 233,
  },
  // {
  //   'id': 4023,
  //   'name': 'Guam',
  //   'country_id': 233
  // },
  {
    id: 3841,
    name: 'Indiana',
    country_id: 233,
  },
  {
    id: 3842,
    name: 'Iowa',
    country_id: 233,
  },
  {
    id: 3843,
    name: 'Kansas',
    country_id: 233,
  },
  {
    id: 3844,
    name: 'Kentucky',
    country_id: 233,
  },
  {
    id: 3845,
    name: 'Louisiana',
    country_id: 233,
  },
  {
    id: 3837,
    name: 'Georgia',
    country_id: 233,
  },
  // {
  //   'id': 3846,
  //   'name': 'Lowa',
  //   'country_id': 233
  // },
  {
    id: 3848,
    name: 'Maryland',
    country_id: 233,
  },
  {
    id: 3849,
    name: 'Massachusetts',
    country_id: 233,
  },
  // {
  //   'id': 4024,
  //   'name': 'Marshall Islands',
  //   'country_id': 233
  // },
  // {
  //   'id': 3850,
  //   'name': 'Medfield',
  //   'country_id': 233
  // },
  {
    id: 3851,
    name: 'Michigan',
    country_id: 233,
  },
  {
    id: 3852,
    name: 'Minnesota',
    country_id: 233,
  },
  {
    id: 3853,
    name: 'Mississippi',
    country_id: 233,
  },
  {
    id: 3854,
    name: 'Missouri',
    country_id: 233,
  },
  {
    id: 3847,
    name: 'Maine',
    country_id: 233,
  },
  {
    id: 3858,
    name: 'New Hampshire',
    country_id: 233,
  },
  {
    id: 3859,
    name: 'New Jersey',
    country_id: 233,
  },
  {
    id: 3857,
    name: 'Nevada',
    country_id: 233,
  },
  {
    id: 3860,
    name: 'New Jersy',
    country_id: 233,
  },
  {
    id: 3861,
    name: 'New Mexico',
    country_id: 233,
  },
  {
    id: 3862,
    name: 'New York',
    country_id: 233,
  },
  {
    id: 3863,
    name: 'North Carolina',
    country_id: 233,
  },
  {
    id: 3864,
    name: 'North Dakota',
    country_id: 233,
  },
  {
    id: 3855,
    name: 'Montana',
    country_id: 233,
  },
  {
    id: 3856,
    name: 'Nebraska',
    country_id: 233,
  },
  // {
  //   'id': 4025,
  //   'name': 'Northern Mariana Islands',
  //   'country_id': 233
  // },
  {
    id: 3868,
    name: 'Oregon',
    country_id: 233,
  },
  // {
  //   'id': 3867,
  //   'name': 'Ontario',
  //   'country_id': 233
  // },
  // {
  //   'id': 4026,
  //   'name': 'Palau',
  //   'country_id': 233
  // },
  {
    id: 3869,
    name: 'Pennsylvania',
    country_id: 233,
  },
  // {
  //   'id': 4027,
  //   'name': 'Puerto Rico',
  //   'country_id': 233
  // },
  // {
  //   'id': 3870,
  //   'name': 'Ramey',
  //   'country_id': 233
  // },
  {
    id: 3871,
    name: 'Rhode Island',
    country_id: 233,
  },
  {
    id: 3865,
    name: 'Ohio',
    country_id: 233,
  },
  {
    id: 3866,
    name: 'Oklahoma',
    country_id: 233,
  },
  {
    id: 3872,
    name: 'South Carolina',
    country_id: 233,
  },
  {
    id: 3873,
    name: 'South Dakota',
    country_id: 233,
  },
  {
    id: 3875,
    name: 'Tennessee',
    country_id: 233,
  },
  // {
  //   'id': 3874,
  //   'name': 'Sublimity',
  //   'country_id': 233
  // },
  {
    id: 3876,
    name: 'Texas',
    country_id: 233,
  },
  // {
  //   'id': 3877,
  //   'name': 'Trimble',
  //   'country_id': 233
  // },
  {
    id: 3878,
    name: 'Utah',
    country_id: 233,
  },
  {
    id: 3879,
    name: 'Vermont',
    country_id: 233,
  },
  // {
  //   'id': 4028,
  //   'name': 'Virgin Islands',
  //   'country_id': 233
  // },
  {
    id: 3880,
    name: 'Virginia',
    country_id: 233,
  },
  {
    id: 3881,
    name: 'Washington',
    country_id: 233,
  },
  {
    id: 3883,
    name: 'Wisconsin',
    country_id: 233,
  },
  {
    id: 3884,
    name: 'Wyoming',
    country_id: 233,
  },
  // {
  //   'id': 3882,
  //   'name': 'West Virginia',
  //   'country_id': 233
  // }
];

export interface State {
  id: number;
  name: string;
  country_id: number;
}
