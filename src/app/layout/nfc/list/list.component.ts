import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  AfterViewChecked,
} from '@angular/core';
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
  MatPaginator,
} from '@angular/material';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { fromEvent } from 'rxjs';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  addNfcInput: any = {
    ntagid: '',
    nfc_name: '',
  };
  public btnAction: Function;
  public filtershow = false;
  // MATPAGINATOR
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  deleteItem = [];
  addedNfcList = [];
  data;
  arr = [];
  dataSource;
  count;
  displayedColumns = [];
  organization;
  facility;
  dialogRefs = null;
  isEdit = false;
  isRemove: boolean = false;
  // ddp list variable
  organiz;
  fac_list;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  search: any;
  floSearch = '';
  secSearch = '';
  isArcheive: boolean = false;
  showNew = true;
  @ViewChild('deleteButton', { static: true }) private deleteButton: ElementRef;
  @ViewChild('restoreButton', { static: true })
  private restoreButton: ElementRef;
  pagiPayload: PagiElement = {
    moduleName: 'nfcList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'ntagid', direction: 'asc' },
  };

  bulkorg;
  bulkfac;
  actualDataCount;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  @ViewChild('addNfc', { static: true }) addNfc: TemplateRef<any>;

  userIds = [];
  columnNames = [
    {
      id: 'ntagid',
      value: 'Name',
      sort: true,
    },
    // {
    //   id: 'organization',
    //   value: 'Organization',
    //   sort: true
    // },
    // {
    //   id: 'facility',
    //   value: 'Facility',
    //   sort: true
    // },
    {
      id: 'type',
      value: 'Type',
      sort: false
    },
    {
      id: 'zone',
      value: 'Assignment',
      sort: true,
    },
    // {
    //   id: 'resident',
    //   value: 'Resident',
    //   sort: true,
    // },
  ];
  private subscription: Subscription;
  privilege: string = 'add';
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  constructor(
    private router: Router,
    private apiService: ApiService,
    private excelService: ExcelService,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService,
    private fb: FormBuilder
  ) {
    this.createPropertyForm();
  }

  exportdata;
  filedata;
  floor;
  sector;
  org_name;
  faclist;
  floorlist;
  fac_name;
  seclist;
  floor_name;
  public show = false;
  nfcForm: FormGroup;
  public temparray: any = [];
  // nfcEdit:any ='';
  question;
  nfcEdit: any = {
    ntagid: '',
    nfc_name: '',
    _id: '',
  };

  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    if (!this._commonService.checkAllPrivilege('NFC')) {
      this.router.navigate(['/']);
    }
    this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.nfcList) {
        this.pagiPayload = pageListing.nfcList;
        // this.pagiPayload.previousPageIndex = pageListing.nfcList.previousPageIndex;
        // this.pagiPayload.pageIndex = pageListing.nfcList.pageIndex;
        // this.pagiPayload.pageSize = pageListing.nfcList.pageSize;
        // this.pagiPayload.length = pageListing.nfcList.length;
        this.search = pageListing.nfcList.search;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ nfcList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ nfcList: this.pagiPayload })
      );
    }
    this._commonService.payloadSetup('nfcList', this.pagiPayload);

    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        // tslint:disable-next-line:max-line-length
        debounceTime(2000), // The user can type quite quickly in the input box, and that could trigger a lot of server requests. With this operator, we are limiting the amount of server requests emitted to a maximum of one every 150ms
        distinctUntilChanged(), // This operator will eliminate duplicate values
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    this.subscription = this._commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this._commonService.setLoader(true);
          this.floor = null;
          this.sector = null;
          this.seclist = null;

          this.floorlist = contentVal.floorlist;
          this.organization = this.pagiPayload['organization'] = contentVal.org;
          this.facility = this.pagiPayload['facility'] = contentVal.fac;
          // Pagination
          this.getServerData(this.pagiPayload);
        }
      }
    );

    this.subscription = this._commonService.floorcontentdata.subscribe(
      async (data: any) => {
        if (data) {
          this.floorlist = data;
        }
      }
    );
  }

  // Create mat table
  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    let arrLen = arr.length;
    if (arrLen < this.pagiPayload.pageSize) {
      let startIndex = this.pagiPayload.pageIndex * this.pagiPayload.pageSize;
      let endIndex = startIndex + arrLen;
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = startIndex + 1 + ' - ' + endIndex;
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    } else {
      let tempRange = this.paginator._intl.getRangeLabel(
        this.pagiPayload.pageIndex,
        this.pagiPayload.pageSize,
        arr.length
      );
      document.getElementsByClassName(
        'mat-paginator-range-label'
      )[0].innerHTML = tempRange.substring(0, tempRange.indexOf('o'));
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    }
  }

  // Open add NFC form
  addNfcFormFn() {
    this.router.navigate(['/nfc/form']);
  }

  // Open edit NFC form
  editNfcFn(id) {
    this.router.navigate(['/nfc/form', this._aes256Service.encFnWithsalt(id)]);
  }

  // View data for a particluar nfc
  viewNfcFn(id) {
    this.router.navigate(['/nfc/view', this._aes256Service.encFnWithsalt(id)]);
  }

  // Function to delete single nfc
  deleteNfcFn(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'nfc', id: id, API: 'nfc/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.checked = false;
        this.getServerData(this.pagiPayload);
      }
    });
  }

  // function  to delete multiple NFCs
  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select nfc to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'nfc', id: this.deleteArr, API: 'nfc/delete' },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result && result['type'] == 'success') {
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
        this.getServerData(this.pagiPayload);
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  // Select all Checkboxes in a list
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

  // Select single checkbox one by one
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

  // Search element in a list
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  // Fetch list of NFCs added
  public async getNFCDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'nfc',
    };
    const payload = this.pagiPayload;
    if (this.isArcheive === true) {
      payload['restore_delete'] = true;
    } else {
      payload['restore_delete'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    
    this.count = result['data']['_count'];
    this.hasNextPage = result['data']['isNextPage'];
    if (result['status']) {
      const dataNFC = result['data']['_nfc'];
      if (dataNFC && dataNFC.length > 0) {
        this.actualDataCount = dataNFC.length;
      }
      result = result['data']['_nfc'].map((item) => {
        let sec;
        if (item.floor && item.floor.sector) {
          sec = item.floor.sector.filter((it) => it._id === item.sector);
          if (sec.length) {
            sec = sec[0].name ? sec[0].name : '--';
          }
        }
        return {
          ...item,
          ntagid: item.ntagid ? item.ntagid : '--',
          organization: item.org ? item['org']['org_name'] : '--',
          facility: item.fac ? item['fac']['fac_name'] : '--',
          zone: item.room ? item['room']['room'] : '--',
          type: item.type ? item['type'] : '--',
          Floor: item.floor ? item.floor.floor : '--',
          sector: item.floor && item.floor.sector.length ? sec : '--',
          resident: item.resident.name ? item.resident.name : '--',
        };
      });
      this.data = result;
      this.data.forEach(item => {
        if(item.type){
          item.type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
          if(item.type === 'Res'){
            item.type = 'Resident'
          }
          if(item.type === 'Medcart'){
            item.zone = item.asset.name
          }
        }
      });
      this.createTable(result);
      this._commonService.setLoader(false);
      this.deleteArr = [];
    } else {
      this._commonService.setLoader(false);
      // this.toastr.success('No NFC record');
    }
  }

  // Sorting in NFC listing
  sortData(sort?: PageEvent) {
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ nfcList: this.pagiPayload })
    );
    this._commonService.updatePayload(null, 'nfcList', this.pagiPayload);
    this.getNFCDataFunction();
  }

  // Set payload for pagination,searching,sorting
  public async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.pagiPayload['organization'] = this.organization;
    this.pagiPayload['facility'] = this.facility;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ nfcList: this.pagiPayload })
    );
    this._commonService.updatePayload(event, 'nfcList', this.pagiPayload);
    this.getNFCDataFunction();
  }

  // Function to export NFC listin in excel sheet
  async exportNFC() {
    this._commonService.setLoader(true);
    const action = {
      type: 'POST',
      target: 'nfc/export',
    };
    let _selectedUser = { selectedUser: this.deleteArr };
    const payload = { ..._selectedUser, ...this.pagiPayload };
    let result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      const data = result['data'];
      this.exportdata = data;
      const nfc = this.prepareUsersForCSV();
      this.excelService.exportAsExcelFile(nfc, 'NFC_Report');
    }
  }

  // Excel sheet preparation
  prepareUsersForCSV() {
    const users = [];
    this.exportdata.forEach((item) => {
      let sec;
      if (item.floor && item.floor.sector) {
        sec = item.floor.sector.filter((it) => it._id === item.sector);
        if (sec.length) {
          sec = sec[0].name;
        }
      }
      users.push({
        'NFC ID': item.ntagid ? item.ntagid : '-',
        'NFC Name': item.nfc_name ? item.nfc_name : '-',
        Organization: item['org'] ? item['org']['org_name'] : '-',
        facility: item['fac'] ? item['fac']['fac_name'] : '-',
        Floor: item['floor'] ? item['floor']['floor'] : '-',
        Sector: item['floor'] ? sec : '-',
        Zone: item['room'] ? item['room']['room'] : '-',
        Resident: item['resident']
          ? item['resident']['first_name'] + ' ' + item['resident']['last_name']
          : '-',
        'Created Date': item.date
          ? moment(item.date).format('MMMM Do YYYY')
          : '-',
      });
    });
    this._commonService.setLoader(false);
    return users;
  }

  // Show/hide filter fields
  filter() {
    this.show = !this.show;
    this.floor = '';
    this.sector = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
  }

  // Reset filter data fro list
  resetFilter() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    this.getServerData(this.pagiPayload);
  }

  //Start NFC Restored
  achieve() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    this.search = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = true;
    this.getServerData(this.pagiPayload);
  }
  defArchieve() {
    this.show = false;
    this.floor = '';
    this.sector = '';
    this.search = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = false;
    this.getServerData(this.pagiPayload);
  }

  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select nfc to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'restore_user',
          id: this.deleteArr,
          restore_data: 'restore_data',
          API: 'nfc/delete',
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (!result) {
          this.data.forEach((element) => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('NFC restored successfully');
          this.getServerData(this.pagiPayload);
          this.checked = false;
        }

        this.restoreButton['_elementRef'].nativeElement.classList.remove(
          'cdk-program-focused'
        );
        this.restoreButton['_elementRef'].nativeElement.classList.remove(
          'cdk-focused'
        );
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }
  //Single Restore Button
  restoreNFC(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'restore_user',
        id: id,
        restore_data: 'restore_data',
        API: 'nfc/delete',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success('NFC restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  //End NFc Restored

  // Fetch sector for a particular floor
  async changeFloor(floor, type) {
    this.sector = '';
    delete this.pagiPayload['sector'];
    this.pagiPayload = {
      moduleName: 'nfcList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: this.search,
      sort: { active: 'ntagid', direction: 'asc' },
    };
    const _secList = [];
    this.seclist = this.floorlist.map(function (it) {
      if (it.value === floor.value) {
        it['sector'].map(function (item) {
          _secList.push(item);
        });
      }
    });
    this.seclist = _secList.map(function (obj) {
      const rObj = {};
      rObj['label'] = obj.name;
      rObj['value'] = obj._id;
      return rObj;
    });
    this.floor_name = floor.value;
    this.pagiPayload['floor'] = this.floor_name;
    this.pagiPayload['fac_name'] = this.fac_name;
    this.pagiPayload['org_name'] = this.org_name;
    delete this.pagiPayload['sector'];
    if (type === 'filter') {
      this.getServerData(this.pagiPayload);
    }
  }

  // function to change sector in filter
  async changeSector(sector, type) {
    this.pagiPayload['sector'] = sector.value;
    this.getServerData(this.pagiPayload);
  }

  addnfc() {
    this.showNew = true;
    if (this.isEdit === false) {
      this.nfcEdit._id = '';
      this.addNfcInput.nfc_name = '';
      this.addNfcInput.ntagid = '';
      this.privilege = 'add';
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'shiftpopup';
    // dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
    this.dialogRefs = this.dialog.open(this.addNfc, dialogConfig);
  }

  get optionsPoints() {
    return this.nfcForm.get('nfcs') as FormArray;
  }

  addOption(addNfcInput) {
    // this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
    // const lastKey =this.temparray.value.length -1;
    // if(this.temparray.value[lastKey].ntagid === '' || this.temparray.value[lastKey].ntagid == undefined )
    // {
    //    this.toastr.error('Please fill field');
    //    return false;
    // }
    // this.temparray.push(this.setInputType());
    // console.log('Add NFC==', this.temparray);
    // if(this.temparray.length >=2){
    //   this.isRemove=true;
    // }else{
    //   this.isRemove=false;
    // }

    if (!this.showNew) {
      this.showNew = true;
      return;
    } else {
      if (addNfcInput.ntagid === '' || addNfcInput.ntagid === undefined) {
        this.toastr.error('Please enter NFC name.');
      } else {
        if (this.addedNfcList === undefined || this.addedNfcList.length < 1) {
          this.addedNfcList = [
            {
              ntagid: addNfcInput.ntagid,
              nfc_name: addNfcInput.nfc_name,
            },
          ];
        } else {
          this.addedNfcList.unshift({
            ntagid: addNfcInput.ntagid,
            nfc_name: addNfcInput.nfc_name,
          });
        }
        this.addNfcInput['ntagid'] = '';
        this.addNfcInput['nfc_name'] = '';
        document.getElementById('nfcTagInp').focus();
      }
    }
  }
  removeOption(key) {
    if (key !== undefined && key !== null) {
      this.addedNfcList.splice(key, 1);
    } else {
      this.showNew = false;
    }

    // this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
    // this.temparray.removeAt(key);
    // if(this.temparray.length === 1){
    //   this.isRemove=false;
    // }else{
    //   this.isRemove=true;
    // }
  }

  createPropertyForm() {
    this.nfcForm = this.fb.group({
      _id: [null, []],
      nfcs: this.fb.array([this.setInputType()]),
    });
  }
  setInputType() {
    return this.fb.group({
      ntagid: ['', []],
      nfc_name: ['', []],
    });
  }

  closeQuestionDialog(): void {
    this.addedNfcList = [];
    this.dialogRefs.close();
    this.isEdit = false;
    this.isRemove = false;
    this.nfcForm.reset();
    this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
    this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
    for (let i = this.temparray.length - 1; i >= 1; i--) {
      this.temparray.removeAt(i);
    }
  }

  async saveNfcRecords() {
    let nTagIdArray = [];
    for (let i = 0; i < this.addedNfcList.length; i++) {
      if (this.addedNfcList[i].ntagid !== '') {
        let newVar = {
          ntagid: this.addedNfcList[i].ntagid,
          nfc_name: this.addedNfcList[i].nfc_name,
        };
        nTagIdArray.push(newVar);
      }
    }

    if (this.nfcForm.valid) {
      this._commonService.setLoader(true);
      let checkID: any;
      console.log(this.nfcEdit);
      if (this.nfcEdit._id === '' || this.nfcEdit._id === undefined) {
        if (!nTagIdArray.length && !this.addNfcInput.ntagid) {
          this._commonService.setLoader(false);
          this.toastr.error('Please insert NFC tag name.');
          return;
        }
        if (this.addNfcInput.ntagid) {
          let newVar2 = {
            ntagid: this.addNfcInput.ntagid,
            nfc_name: this.addNfcInput.nfc_name,
          };
          nTagIdArray.push(newVar2);
        }
        checkID = {
          ntags: nTagIdArray,
          org: this.organization,
          fac: this.facility,
        };
      } else {
        let newVar = {
          ntagid: this.addNfcInput.ntagid,
          nfc_name: this.addNfcInput.nfc_name,
        };
        nTagIdArray.push(newVar);
        checkID = {
          _id: this.nfcEdit._id,
          ntags: nTagIdArray,
          org: this.organization,
          fac: this.facility,
        };
      }
      const data = checkID;
      let checkData = [];
      let iterator = data.ntags;
      iterator.forEach(function (item) {
        Object.keys(item).forEach(function (key) {
          if (key == 'ntagid') {
            checkData.push(item[key]);
          }
        });
      });

      let duplicate = checkData.filter(
        ((s) => (v) => s.has(v) || !s.add(v))(new Set())
      );
      console.log(duplicate);
      let checkDuplicate = duplicate.filter((x) => x).join(', ');
      if (checkDuplicate.length > 0) {
        this._commonService.setLoader(false);
        this.toastr.error('Please enter unique NFC tags.');
        return false;
      }

      const action = {
        type: 'POST',
        target: 'nfc/add',
      };
      const payload = data;
      console.log('=== Edit==', payload);
      //return;
      const result = await this.apiService.apiFn(action, payload);

      if (result['status']) {
        this.addedNfcList = [];
        this.toastr.success(result['message']);
        this.closeQuestionDialog();
        this.isRemove = false;
        this.getServerData(this.pagiPayload);
        this._commonService.setLoader(true);
      } else {
        this._commonService.setLoader(false);
        this.toastr.error(result['message']);
      }
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
  }

  async editNfc(id) {
    this.showNew = true;
    console.log(id);
    // return false;
    this.isEdit = true;
    this.privilege = 'edit';
    //this._commonService.setLoader(true);
    const action = { type: 'POST', target: 'nfc/view' };
    const payload = { nfcId: id };
    let result = await this.apiService.apiFn(action, payload);
    //let result = await this.apiService.apiFn(action, payload);
    // console.log(result['data'].ntagid);
    // return false;
    this.nfcEdit = result['data'];
    this.nfcEdit.ntagid = result['data'].ntagid;
    this.nfcEdit.nfc_name = result['data'].nfc_name;
    this.nfcEdit._id = result['data']._id;

    this.addNfcInput['ntagid'] = result['data'].ntagid;
    this.addNfcInput['nfc_name'] = result['data'].nfc_name;
    this._commonService.setLoader(false);
    //this.temparray = <FormArray>this.nfcForm.controls['nfcs'];
    this.nfcForm.patchValue(this.nfcEdit);
    console.log(this.nfcForm.patchValue(this.nfcEdit));
    this.addnfc();
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'nfc/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
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

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  moduleName?: string;
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
}
