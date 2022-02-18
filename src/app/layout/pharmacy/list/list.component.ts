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
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, Subscription } from 'rxjs';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { AlertComponent } from 'src/app/shared/modals/alert/alert.component';
import { SocketService } from 'src/app/shared/services/socket/socket.service';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  // All initial variable declarations
  pharmacy: any = {
    name: '',
    address1: '',
    address2: '',
    state: '',
    city: '',
    zip: '',
    phone: '',
    fax: '',
    other: '',
    notes: '',
    phone_numbers: [],
  };
  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;

  pagiPayload: PagiElement = {
    moduleName: 'pharmacyList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
    organization: '',
    facility: '',
  };
  displayedColumns = [];
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true,
    },
    {
      id: 'state',
      value: 'State',
      sort: true,
    },
    {
      id: 'city',
      value: 'City',
      sort: true,
    },
    // {
    //   id: 'notes',
    //   value: 'Notes',
    //   sort: false,
    // },
  ];
  search: any = '';
  checked;
  deleteArr = [];
  count;
  actualDataCount;
  data;
  organization;
  facility;
  dataSource;

  private subscription: Subscription;
  isEdit = false;
  // search
  staSearch = '';
  isShow = true;
  citSearch = '';
  PhoneNumberTypeSearch = '';
  // pharmacy popup specific details
  show = 'Fax';
  // pharmacy phone
  phone_pharmacy = true;
  fax_pharmacy = false;
  other_pharmacy = false;

  contact_type = [{ name: 'Fax' }, { name: 'Other' }];

  type_of_contact = [{ name: 'Fax' }, { name: 'Phone' }, { name: 'Other' }];

  // phone_numbers = [{index:1,name:'Phone',value:''}]

  dialogConfig = new MatDialogConfig();
  dialogRefs: any;
  privilege: string = 'add';
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  phoneArr: any[] = [{ id: Math.random(), name: 'Fax', value: '' }];

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('pharmacyPopup', {static: true}) pharmacyPopup: TemplateRef<any>;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public commonService: CommonService,
    public _socketService: SocketService
  ) {}

  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.getServerData(this.pagiPayload);
          // this.connectWithSocketFn();
        }
      }
    );
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.pharmacyList) {
        this.pagiPayload.previousPageIndex =
          pageListing.pharmacyList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.pharmacyList.pageIndex;
        this.pagiPayload.pageSize = pageListing.pharmacyList.pageSize;
        this.pagiPayload.length = pageListing.pharmacyList.length;
        this.pagiPayload.sort = pageListing.pharmacyList.sort;
        this.pagiPayload.search = pageListing.pharmacyList.search;
        this.search = pageListing.pharmacyList.search;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ pharmacyList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ pharmacyList: this.pagiPayload })
      );
    }

    // Mat table columns with checkbox and actions
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    this.commonService.payloadSetup('pharmacyList', this.pagiPayload);
    //Searching
    
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this.subscription.add(this._socketService.addPharmacyFn().subscribe(async (res: any) => {
      console.log('Add Pharmacy response', res);
        console.log('add_pharmacy');
        this.getPharmacyList();
    }));
    this.subscription.add(this._socketService.updatePharmacyFn().subscribe(async (res: any) => {
      console.log('Update Pharmacy response', res);
        console.log('update_pharmacy');
        this.getPharmacyList();
    }));
  }

  connectWithSocketFn() {
    const roomName = this.facility + '-MASTER';
    this._socketService.connectFn(roomName).subscribe(_response => {
      if (_response) {
          console.log('Socket Res ===>', _response);
      }
    });
  }

  async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ pharmacyList: this.pagiPayload })
    );
    this.commonService.updatePayload(event, 'pharmacyList', this.pagiPayload);
    this.getPharmacyList();
  }

  async getPharmacyList() {
    this.commonService.setLoader(true);
    let action = {
      type: 'GET',
      target: 'pharmacy/list',
    };
    let payload = this.pagiPayload;

    let result = await this.apiService.apiFn(action, payload);

    // console.log(result);

    if (result['status']) {
      if (
        (!result['data'] || result['data'].length < 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['count'];
        this.hasNextPage = result['isNextPage'];
        result = result['data'].map((e) => ({
          _id: e._id,
          name: e.name ? e.name : '-',
          state: e.state ? e.state : '-',
          city: e.city ? e.city : '-',
          phone: e.phone ? this.formatPhoneNumberToUS(e.phone) : '-',
          notes: e.notes ? e.notes : '-',
        }));

        this.data = result;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.createTable(result);
        this.checked = false;
        this.deleteArr = [];
      }
    }
    this.commonService.setLoader(false);
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    let arrLen = arr.length;
    if (arrLen < this.pagiPayload.pageSize) {
      let startIndex = this.pagiPayload.pageIndex * this.pagiPayload.pageSize;
      let endIndex = startIndex + arrLen;
      document.getElementsByClassName('mat-paginator-range-label')[0].innerHTML = startIndex + 1 + ' - ' + endIndex;
      this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
    } else {
      let tempRange = this.paginator._intl.getRangeLabel(this.pagiPayload.pageIndex, this.pagiPayload.pageSize, arr.length);
      document.getElementsByClassName('mat-paginator-range-label')[0].innerHTML = tempRange.substring(0, tempRange.indexOf('o'));
      this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
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
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ pharmacyList: this.pagiPayload })
    );
    this.commonService.updatePayload(null, 'pharmacyList', this.pagiPayload);
    this.getPharmacyList();
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
    // if(!this.commonService.checkPrivilegeModule('assets','delete')){
    //   this.toastr.error('You don't have permission to delete assets.');
    //   this.router.navigate(['/assets']);
    //   return;
    // }
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select pharmacy to be deleted');
        this.checked = false;
      }
    } else {
      //   console.log('---delete arr--', this.deleteArr);
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'pharmacy', id: this.deleteArr, API: 'pharmacy/delete' },
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

  deletePharmacy(id) {
    // if(!this.commonService.checkPrivilegeModule('assets','delete')){
    //   this.toastr.error('You don't have permission to delete assets.');
    //   this.router.navigate(['/assets']);
    //   return;
    // }
    this.deleteArr = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'user',
        id: id,
        API: 'pharmacy/delete',
        isUnlinkResident: true,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.checked = false;
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      } else {
        //this.toastr.error(result['message']);
      }
    });
  }

  async openAddPharmacy() {
    // this.phoneArr = [{ id: Math.random(), name: 'Fax', value: '' }];
    this.isEdit = false;
    this.privilege = 'add';
    //when we have opened first edit popup and then again opening add new popup we need to falsy _id for considering it as a new form instead of editing
    // if (this.pharmacy._id) {
    //   this.pharmacy._id = undefined;
    // }
    this.pharmacy = this.Pharmacy();

    this.dialogConfig.width = '700px';
    this.dialogConfig.autoFocus = false;
    //this.dialogConfig.disableClose = true;
    this.dialogConfig.maxHeight = '835px';
    this.dialogConfig.panelClass = 'physician_dialog';
    this.dialogRefs = this.dialog.open(this.pharmacyPopup, this.dialogConfig);
  }

  async editPharmacy(id) {
    // console.log(id);

    this.privilege = 'edit';
    const action = {
      type: 'GET',
      target: 'pharmacy/view',
    };

    const payload = { _id: id };

    const result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      //for old records if there is no phone_numbers array than add default phone_numbers field there
      // if (!result['data'].phone_numbers.length) {
      //   result['data'].phone_numbers = this.pharmacy.phone_numbers;
      // } else {
      //   result['data'].phone_numbers = result[
      //     'data'
      //   ].phone_numbers.map((e) => ({ id: Math.random(), ...e }));
      // }
      this.pharmacy = result['data'];
      if (result['data'].phone_numbers && result['data'].phone_numbers.length) {
        this.pharmacy.phone_numbers = result['data'].phone_numbers.map(e => ({ id: Math.random(), ...e }));
      }
      console.log('---editing pharmacy--', this.pharmacy, result['data']);
      if (this.pharmacy.fax) {
        this.fax_pharmacy = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Fax');
      }
      if (this.pharmacy.other) {
        this.other_pharmacy = true;
        this.contact_type = this.contact_type.filter((e) => e.name != 'Other');
      }
      if (this.pharmacy.state) {
        this.changeState(this.pharmacy.state);
      }
      //   console.log(this.pharmacy);
      this.isEdit = true;
      this.dialogConfig.width = '700px';
      this.dialogConfig.autoFocus = false;
      //this.dialogConfig.disableClose = true;;
      this.dialogConfig.maxHeight = '835px';
      this.dialogConfig.panelClass = 'physician_dialog';
      this.dialogRefs = this.dialog.open(this.pharmacyPopup, this.dialogConfig);
    } else {
      this.toastr.error('Can not get pharmacy');
    }
  }

  cancelPharmacy(f) {
    this.dialogRefs.close();
    f.form.reset();
    this.fax_pharmacy = false;
    this.other_pharmacy = false;
    this.isEdit = false;
    this.contact_type = [{ name: 'Fax' }, { name: 'Other' }];
    this.pharmacy = this.Pharmacy();
    this.phoneArr = [{ id: Math.random(), name: 'Fax', value: '' }];
  }

  async addPharmacy(f, pharmacy) {
    // console.log('phone numbers list',pharmacy,pharmacy.phone_numbers,f.value)
    // return
    this.commonService.setLoader(true);
    // console.log('----form----', f, pharmacy);

    let form_status = f.form.status;

    if (form_status == 'VALID') {

      if (this.phoneArr[0].value != ''  ) {
        pharmacy.phone_numbers.unshift(this.phoneArr[0]);
      }

      const faxNumbers = pharmacy.phone_numbers.filter((e) => {
        return e.name.toLowerCase() == 'fax';
      });
      // console.log('faxNumbers--->', faxNumbers);
      // console.log('pharmacy.phone_numbers--->', pharmacy.phone_numbers);
      if (!(faxNumbers.length > 0)) {
        form_status = 'INVALID';
        this.toastr.error('Please add Fax number');
      }

      if (form_status == 'INVALID') {
        this.commonService.setLoader(false);
        return false;
      }
      const action = {
        type: 'POST',
        target: 'residents/add_pharmacy',
      };

      pharmacy.fac_id = this.facility;

      if (pharmacy.phone_numbers && pharmacy.phone_numbers.length) {
        pharmacy.phone_numbers.forEach((e) => delete e.id);
      }

      const payload = pharmacy;

      // console.log('---payload---', payload, f.form.value,this.pharmacy);
      // return
      const result = await this.apiService.apiFn(action, { data: payload });

      //   console.log('---result----', result);

      if (result) {
        this.toastr.success(result['message']);
      } else {
        this.toastr.error('Something went wrong, Please try again.');
      }
      this.dialogRefs.close();
      f.form.reset();
      this.pharmacy = this.Pharmacy();
      this.phoneArr = [{ id: Math.random(), name: 'Fax', value: '' }];
      this.contact_type = [{ name: 'Fax' }, { name: 'Other' }];
      this.fax_pharmacy = false;
      this.other_pharmacy = false;
      this.isEdit = false;
      this.getServerData(this.pagiPayload);
    } else if (form_status == 'INVALID') {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter valid pharmacy details');
      }
    }

    this.commonService.setLoader(false);
  }

  select(state, city, flag) {
    if (flag === 0) {
      if (!state || state === undefined) {
        this.selectCitie = city.source.selected.viewValue;
      } else if (!city || city === undefined) {
        this.selectState = state.source.selected.viewValue;
      }
    } else {
      if (!state || state === undefined) {
        this.selectCitie = city;
      } else if (!city || city === undefined) {
        this.selectState = state;
      }
    }
  }

  async changeState(state) {
    let stateid = this.statelist.filter((s) => s.name === state);
    // this.commonService.setLoader(true);
    const action = { type: 'GET', target: 'organization/citieslist' };
    const payload = { state_Id: stateid[0].id };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result['data']['_cities'];
    this.Citielist.forEach((element) => {
      element['_id'] = element.id;
    });
    // this.commonService.setLoader(false);
  }

  changePharmacyPhone(event) {
    if (event == 'Phone') {
      this.phone_pharmacy = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Phone');
    }
    if (event == 'Fax') {
      this.fax_pharmacy = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Fax');
    }
    if (event == 'Other') {
      this.other_pharmacy = true;
      this.contact_type = this.contact_type.filter((e) => e.name != 'Other');
    }
  }

  removePharmacyPhone(item) {
    // phone:'',
    // fax:'',
    // other:'',
    if (item == 'Phone') {
      this.phone_pharmacy = false;
      this.pharmacy.phone = '';
      this.contact_type.push({ name: 'Phone' });
    }

    if (item == 'Fax') {
      this.fax_pharmacy = false;
      this.pharmacy.fax = '';
      this.contact_type.push({ name: 'Fax' });
    }

    if (item == 'Other') {
      this.other_pharmacy = false;
      this.pharmacy.other = '';
      this.contact_type.push({ name: 'Other' });
    }
  }

  addPharmacyPhone(f, item) {
    // this.pharmacy.phone_numbers.push({
    //   id: this.pharmacy.phone_numbers.length + Math.random(),
    //   name: 'Phone',
    //   value: '',
    // });
    if (item.value == '') {
      this.toastr.error('Please enter the contact number.');
      return;
    }
    this.pharmacy.phone_numbers.unshift(this.phoneArr[0]);
    this.phoneArr = [{ id: this.pharmacy.phone_numbers.length + Math.random(), name: item.name, value: '' }];
  }

  removePharmacyField(index) {
    this.pharmacy.phone_numbers.splice(index, 1);
  }

  checkAlpha(key) {
    const result = this.commonService.allwoOnlyAlpharesi(key);
    return result;
  }

  Pharmacy() {
    let pharmacy: any = {
      name: '',
      address1: '',
      address2: '',
      state: '',
      city: '',
      zip: '',
      phone: '',
      fax: '',
      other: '',
      notes: '',
      phone_numbers: [],
    };
    return pharmacy;
  }

  formatPhoneNumberToUS(phone) {
    phone = phone.replace(/[^\d]/g, '');
    if (phone.length == 10) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return null;
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'pharmacy/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['count'];
    }
  }
  async ngAfterViewChecked(){
    this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled','true');  
  }
}

export interface PagiElement {
  moduleName?: string;
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
  organization: '';
  facility: '';
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
