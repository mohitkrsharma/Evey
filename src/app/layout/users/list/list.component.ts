import {AfterViewChecked, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort, MatTableDataSource, PageEvent} from '@angular/material';
import {Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {AlertComponent} from '../../../shared/modals/alert/alert.component';
import {RestoreComponent} from '../../../shared/modals/restore/restore.component';
import {ToastrService} from 'ngx-toastr';
import {fromEvent, Subscription} from 'rxjs';

import {debounceTime, distinctUntilChanged, tap} from 'rxjs/operators';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import {ApiService} from './../../../shared/services/api/api.service';
import {ExcelService} from './../../../shared/services/excel.service';
import {CommonService} from './../../../shared/services/common.service';
import {Aes256Service} from './../../../shared/services/aes-256/aes-256.service';
import {UserAccess} from 'src/app/shared/models/userAccess';

type AOA = any[][];

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, AfterViewChecked {
  constructor(
    private router: Router,
    private apiService: ApiService,
    private excelService: ExcelService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) { }

  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;
  public btnAction: Function;
  public filtershow = false;
  searchCtrl: '';
  orgSearch: '';
  private subscription: Subscription;
  filesdata: AOA = [];
  uploadOrgFac;
  fac; org;
  defaultErr: any;
  errorMsg: any = [];
  // MATPAGINATOR
  // pageEvent: PageEvent;
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  // deleteItem = [];
  data;
  arr = [];
  dataSource;
  count;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organization; facility;
  // ddp list variable
  organiz;
  search: any;
  fac_list;
  pagiPayload: PagiElement = {
    moduleName: 'userList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
    org_id: '',
    fac_id: ''
  };
  actualDataCount;
  bulkorg; bulkfac;
  viewtype = 'unarchive';
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  positionsz: any;
  isArcheive: boolean = false;
  /**
   * Pre-defined columns list for user table
   */
  userIds = [];
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true
    }
    , {
      id: 'facility',
      value: 'Building',
      sort: false
    },
    // , {
    //   id: "work_email",
    //   value: "Email"
    // }
    {
      id: 'job_title',
      value: 'Position',
      sort: true
    },
    {
      id: 'username',
      value: 'User Name',
      sort: true
    },
    {
      id: 'archive_date',
      value: 'Archive date',
      sort: true
    }
  ];
  // selectedOrganization;
  // selectedFacility;
  suspend_user;

  public userAccess: UserAccess = new UserAccess();

  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;

  exportdata; filedata;
  public show = false;
  searchCtrl1 = '';
  orgSearch1 = '';
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  @HostListener('window:scroll')
  checkScroll() {

    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop
    // returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }

  // TODO: Cross browsing
  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    if (!this._commonService.checkAllPrivilege('Users')) {
      this.router.navigate(['/']);
    }
    this.getUserAccess();
    const errValues = this._commonService.errorMessages();
    this.defaultErr = errValues[0].user_errors;
    //this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.userList) {
        this.pagiPayload = pageListing.userList;
        // this.pagiPayload.previousPageIndex = pageListing.userList.previousPageIndex;
        // this.pagiPayload.pageIndex = pageListing.userList.pageIndex;
        // this.pagiPayload.pageSize = pageListing.userList.pageSize;
        // this.pagiPayload.length = pageListing.userList.length;
        // this.pagiPayload.sort = pageListing.userList.sort;
        this.search = pageListing.userList.search;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ userList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ userList: this.pagiPayload }));
    }
    this._commonService.payloadSetup('userList', this.pagiPayload)

    // searching
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        // tslint:disable-next-line:max-line-length
        debounceTime(1000), // The user can type quite quickly in the input box, and that could trigger a lot of server requests. With this operator, we are limiting the amount of server requests emitted to a maximum of one every 150ms
        distinctUntilChanged(), // This operator will eliminate duplicate values
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this.btnAction = this.addForm.bind(this);
    this.setDisplayColumns();

    this.getOrganizationlist();
    this.getServerData(this.pagiPayload);

    //this._commonService.setLoader(false);

  }

  setDisplayColumns() {
    this.displayedColumns = [];
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    if (this.viewtype != 'archive') {
      for (let index = 0; index < this.columnNames.length; index++) {
        if (this.columnNames[index].id == 'archive_date') {
          this.columnNames[index].value = 'Active Date'
        }
      }
    }
    if (this.viewtype == 'archive') {
      for (let index = 0; index < this.columnNames.length; index++) {
        if (this.columnNames[index].id == 'archive_date') {
          this.columnNames[index].value = 'Archive Date'
        }
      }
    }
    this.displayedColumns = this.displayedColumns.concat(['enable_livedashboard']);
    this.displayedColumns = this.displayedColumns.concat(['suspend_user']);
    this.displayedColumns = this.displayedColumns.concat(['email_access']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);
  }

  download() {
    for (let i = 0; i < 10; i++) {
      this.arr.push({});
    }
    const users = this.prepareForExport();
    this.excelService.exportAsExcelFile(users, 'Add User');
  }

  filter() {
    this.filtershow = !this.filtershow;
    this.show = false;
    this.searchCtrl = '';
    this.orgSearch = '';
  }

  toggle() {
    this.show = !this.show;
    this.filtershow = false;
    this.organization = '';
    this.facility = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
  }

  //Start Restore Changes
  achieve() {
    this.show = false;
    this.filtershow = false;
    this.searchCtrl = '';
    this.orgSearch = '';
    this.viewtype = 'archive';
    this.search = '';
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = true;
    this.setDisplayColumns()
    this.getServerData(this.pagiPayload);
  }
  //reset default
  defArchieve() {
    this.show = false;
    this.filtershow = false;
    this.searchCtrl = '';
    this.orgSearch = '';
    this.viewtype = 'unarchive';
    this.search = '';
    this.setDisplayColumns()
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = false;
    this.getServerData(this.pagiPayload);
  }
  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select users to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr, 'restore_data': 'restore_data', 'API': 'users/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Users restored successfully');
          this.getServerData(this.pagiPayload);
          this.checked = false;
        }

        this.restoreButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.restoreButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  //Single Restore Button
  restoreUser(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'restore_user', 'id': id, 'restore_data': 'restore_data', 'API': 'users/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success('User restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  //End Restore Changes

  uploadFile(evt: any, org, fac) {
    if (org && fac) {
      this.uploadOrgFac = { org, fac };
      console.log('this.uploadOrgFac', this.uploadOrgFac);
      /* wire up file reader */
      const target: DataTransfer = <DataTransfer>(evt.target);
      if (target.files.length !== 1) { throw new Error('Cannot use multiple files'); }
      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        /* read workbook */
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

        /* grab first sheet */
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        /* save data */
        this.filesdata = XLSX.utils.sheet_to_json(ws);
        console.log(this.filesdata);
        this.checkdata();
        // .then((res) => {
        //   // this.uploadFiles(this.filesdata,org,fac);
        // }).catch((err) => {
        //   console.log("Some error",err)
        // })
      };
      reader.readAsBinaryString(target.files[0]);
    } else {
      this.toastr.error('Please select organization and facility');
      this.filedata = '';
    }
  }
  async checkdata() {
    await this.apiService.apiFn({ type: 'GET', target: 'users/positions' }, { type: 'user' })
      .then((resultPosition: any) => {
        this.positionsz = resultPosition.data['_positions'];
        const isSave = true, countError = 0;
        this.errorMsg = [];
        this.filesdata.map((item, j) => {
          if (item['First Name'] !== undefined) {
            if (!item['First Name'].toString().match(/^[a-zA-Z ]*$/)) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.first_name_allow}`);
              // this.toastr.error(msg);
            }
          } else {
            this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.first_name_required}`);
            // this.toastr.error("User first name not found/filled");
          }
          if (item['Last Name'] !== undefined) {
            if (!item['Last Name'].toString().match(/^[a-zA-Z ]*$/)) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.last_name_allow}`);
              // this.toastr.error("User last name must contain only letter and spaces");
            }
          } else {
            this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.last_name_required}`);
            // this.toastr.error("User last name not found/filled");
          }

          if (item['Personal Email'] !== undefined) {
            if (!this.isValidEmail(item['Personal Email'])) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.personal_email}`);
              // this.toastr.error(`Invalid "Personal email" address`);
            }
          }
          if (item['Work Email'] !== undefined) {
            if (!this.isValidEmail(item['Work Email'])) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.work_email}`);
              // this.toastr.error(`Invalid "Work email" address`);
            }
          } else {
            this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.work_email_required}`);
            // this.toastr.error("User work email not found/filled");
          }

          if (item['Secondary Phone'] !== undefined) {
            if (!item['Secondary Phone'].toString().match(/^\d+/)) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.secondary_no}`);
              // this.toastr.error(`Invalid "Secondary Phone"`);
            } else {
              if (item['Secondary Phone'].toString().length === 10) {
              } else {
                this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.secondary_no_len}`);
                // this.toastr.error(`Invalid "Secondary Phone" please enter 10 digit Mob. no.`);
              }
            }
          }

          if (item['Primary Phone'] !== undefined) {
            if (!item['Primary Phone'].toString().match(/^\d+/)) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.primary_no}`);
              // this.toastr.error(`Invalid "Primary Phone"`);
            } else {
              if (item['Primary Phone'].toString().length === 10) {

              } else {
                this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.primary_no_len}`);
                // this.toastr.error(`Invalid "Primary Phone" please enter 10 digit Mob. no.`);
              }
            }
          } else {
            this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.primary_no_requires}`);
          }
          if (item['Employee ID'] === undefined) {
            this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.employee_id}`);
            // this.toastr.error("User Employee ID not found/filled");
          }
          if (item['Position'] !== undefined) {
            if (this.positionsz.find((i) => i.position_name === item['Position']) === undefined) {
              this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.postion}`);
              // this.toastr.error("Please choose User Position not found/filled");
            }
          } else {
            this.errorMsg.push(`Line No. ${j + 1} ${this.defaultErr.postion}`);
            // this.toastr.error("User Position not found/filled");
          }
        });
        console.log(' isSave,countError', this.errorMsg);
        if (!this.errorMsg.length) {
          this.uploadFiles(this.filesdata, this.uploadOrgFac['org'], this.uploadOrgFac['fac']);
        } else {
          this.filedata = '';
          this.filesdata = [];
          return 0;
        }

      })
      .catch((resultPositionError) => {
        this.toastr.error(resultPositionError['message']);
      });
  }

  async isValidEmail(email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  }


  async uploadFiles(data, organization, facility) {
    console.log('finalllll uploadFiles', data, organization, facility);
    if (organization && facility) {
      if (data && !data.length) {
        this.toastr.error('Not found user details in your excel sheet');
        this.filedata = '';
        this.filesdata = [];
      } else {
        this._commonService.setLoader(true);
        await this.apiService.apiFn(
          { type: 'POST', target: 'users/upload' },
          { filedata: data, organization: organization, facility: facility }
        )
          .then((result: any) => {
            this.filedata = '';
            this.filesdata = [];
            this.organization = '';
            this.facility = '';
            this._commonService.setLoader(false);
            if (result['status']) {
              this.toastr.success(result['message']);
            } else {
              this.toastr.error(result['message']);
            }
          })
          .catch((error) => {
            this._commonService.setLoader(false);
            this.toastr.error(error['message']);
          });
      }
    } else {
      this._commonService.setLoader(false);
      this.toastr.error('Please select organization and facility');
      this.filedata = '';
    }
  }

  prepareForExport() {
    const user = [];
    this.arr.forEach(item => {
      user.push({
        'First Name': null,
        'Last Name': null,
        'Work Email': null,
        'Home Phone': null,
        'Mobile Phone': null
      });
    });
    return user;
  }

  getName(first, last) {
    return first.concat(last);
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    // this.dataSource.sort = this.sort;
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

  addForm() { // Custom-code!
    this.router.navigate(['/users/form']);
  }

  editUser(id) {
    this.router.navigate(['/users/form', this._aes256Service.encFnWithsalt(id)]);
  }

  viewUser(id) {
    this.router.navigate(['/users/view', this._aes256Service.encFnWithsalt(id)]);
  }

  deleteUser(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'user', 'id': id, 'API': 'users/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.checked = false;
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      } else {
        //this.toastr.error(result['message']);
      }
    });
  }

  selectAll() {
    if (this.checked === true) {
      this.data.forEach(element => {
        element.checked = false;
        this.deleteArr = [];
      });
    } else {
      this.data.forEach(element => {
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
    } else if ((this.deleteArr && this.deleteArr.length) === this.actualDataCount) {
      this.checked = true;
    }
  }


  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select users to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { 'title': 'users', 'id': this.deleteArr, 'API': 'users/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result['status']) {
          this.toastr.success(result['message']);
          this.getServerData(this.pagiPayload);
          this.checked = false;
        } else {
          this.data.forEach(element => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  async exportUser() {
    this._commonService.setLoader(true);
    let _selectedUser = { selectedUser: this.deleteArr }
    await this.apiService.apiFn(
      { type: 'POST', target: 'users/export' },
      { ..._selectedUser, ...this.pagiPayload }
    )
      .then((result: any) => {
        if (result['status']) {
          this.exportdata = result['data'];
          const users = this.prepareUsersForCSV();
          this.excelService.exportAsExcelFile(users, 'Users_Report');
        }
      })
      .catch((error) => {
        this.toastr.error(error['message']);
      });
  }

  // async sendMail(id) {
  //   this.userIds.push(id)
  //   let action = {
  //     type: 'POST',
  //     target: 'users/email'
  //   }
  //   let payload = { userIds: this.userIds };
  //   var result = await this.apiService.apiFn(action, payload);
  // }

  prepareUsersForCSV() {
    const users = [];
    this.exportdata.forEach(item => {
      const facility = item['facility'].map(itm => itm.fac ? itm.fac.fac_name : '-');
      const org = item['facility'].map(itm => itm.org ? itm.org.org_name : '-');
      const unique = (value, index, self) => {
        return self.indexOf(value) === index;
      };
      const arr = facility.filter(unique);
      const arr1 = org.filter(unique);
      users.push({
        'Name': item.first_name + ' ' + item.last_name,
        // 'Lastname': item.last_name,
        'Username': item.username,
        'Position': item.job_title,
        'Access Level': item.role_id ? item.role_id['role_name'] : '-',
        'Personal Email': item.email,
        'Work Email': item.work_email,
        'Praimary Phone': item.home_phone,
        'Secondary Phone': item.mobile_phone,
        'Employee Id': item.employeeId ? item.employeeId : '-',
        'Organization': item['facility'] ? arr1.toString() : '-',
        'facility': item['facility'] ? arr.toString() : '-',
        'Created Date': item.date ? moment(item.date).format('MMMM Do YYYY') : '-'

      });
    });
    this._commonService.setLoader(false);
    return users;
  }

  public async getUsersDataFunction() {
    const payload = this.pagiPayload;
    if (this.isArcheive === true) {
      payload['restore_delete'] = true;
    } else {
      payload['restore_delete'] = false;
    }
    await this.apiService.apiFn({ type: 'GET', target: 'users' }, payload)
      .then((result: any) => {
        console.log(result)
        if (result['status']) {
          if ((!result['data']['_users'] || result['data']['_users'].length === 0) && this.pagiPayload.pageIndex > 0) {
            this.paginator.previousPage();
          } else {
            this.count = result['data']['_count'];
            this.hasNextPage = result['data']['isNextPage'];
            result = result['data']['_users'].map(item => {
              const facility = item['_facility'].map(itm => itm.fac ? itm.fac.fac_name : '-');
              const unique = (value, index, self) => {
                return self.indexOf(value) === index;
              };
              const arr = facility.filter(unique);
              return {
                ...item,
                name: item.last_name + ',' + ' ' + item.first_name,
                facility: item['_facility'] ? (arr).toString().replace(/,/g, ', ') : '-',
                work_email: item.work_email ? item.work_email : '-',
                role: item.role ? item.role : '-',
                job_title: item.job_title ? item.job_title : '-',
                active: item.active === null ? true : item.active,
                archive_date: item.archive_date != undefined ? moment(item.archive_date).format('MMMM Do YYYY, HH:mm') : '-',
                username: item.username
              };
            });
            this._commonService.setLoader(false);
            this.data = result;
            if (this.data && this.data.length > 0) {
              this.actualDataCount = this.data.length;
            }
            this.createTable(result);
            this.checked = false;
            this.deleteArr = [];
          }
        }
      })
      .catch((error) => {
        this.toastr.error(error['message']);
      });
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
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem('pageListing', JSON.stringify({ userList: this.pagiPayload }));
    this._commonService.updatePayload(null, 'userList', this.pagiPayload);
    this.getUsersDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.pagiPayload.org_id = event['organization'];
    this.pagiPayload.fac_id = event['facility'];
    sessionStorage.setItem('pageListing', JSON.stringify({ userList: this.pagiPayload }));
    this._commonService.updatePayload(event, 'userList', this.pagiPayload)
    this.getUsersDataFunction();
  }

  async sendMail() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) this.toastr.error('Please select users to be invite');
    } else {
      this._commonService.setLoader(true);
      await this.apiService.apiFn(
        { type: 'POST', target: 'users/email' },
        { userIds: this.deleteArr, linkurl: window.location.origin }
      )
        .then((result: any) => {
          if (result['success'] === true) {
            if (this.toastr.currentlyActive === 0) this.toastr.success(result['message']);
            this.deleteArr = [];
          } else {
            if (this.toastr.currentlyActive === 0) this.toastr.success(result['message']);
          }
        })
        .catch((error) => this.toastr.error(error['message']));
      this.getServerData(this.pagiPayload);
      this.deleteArr = [];
      this.checked = false;
    }
  }


  async changeOrg(org, type) {
    this.filedata = '';
    if (type === 'bulk') {
      this.bulkorg = org.value;
      await this.apiService.apiFn(
        { type: 'GET', target: 'facility/faclist' },
        { 'org_id': org }
      )
        .then((result: any) => this.fac_list = result['data'])
        .catch((error) => this.toastr.error(error['message']));
    } else {
      this.facility = '';
      this.pagiPayload = {
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        search: this.search,
        sort: this.pagiPayload.sort,
        org_id: this.pagiPayload.org_id,
        fac_id: this.pagiPayload.fac_id
      };
      this.org = org;
      this.pagiPayload['org_name'] = this.org;
      await this.apiService.apiFn(
        { type: 'GET', target: 'facility/faclist' },
        { 'org_id': org }
      )
        .then((result: any) => this.fac_list = result['data'])
        .catch((error) => this.toastr.error(error['message']));
      this.pagiPayload['fac_name'] = '';
      this.getServerData(this.pagiPayload);
    }

  }

  async changeFac(fac, type) {
    this.filedata = '';
    if (type === 'bulk') {
      this.bulkfac = fac.value;
    } else {
      this.pagiPayload = {
        moduleName: 'userList',
        length: 0,
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0,
        search: this.search,
        sort: this.pagiPayload.sort,
        org_id: this.pagiPayload.org_id,
        fac_id: this.pagiPayload.fac_id
      };
      this.fac = fac;
      this.pagiPayload['org_name'] = this.org;
      this.pagiPayload['fac_name'] = this.fac;
      this.getServerData(this.pagiPayload);
    }

  }


  async getOrganizationlist() {
    await this.apiService.apiFn({ type: 'GET', target: 'organization/orglist' }, {})
      .then((result: any) => this.organiz = result['data'])
      .catch((error) => this.toastr.error(error['message']));
  }

  resetFilter() {
    this.filtershow = false;
    this.organization = '';
    this.facility = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    this.getServerData(this.pagiPayload);
  }

  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  async onChangelivedashboard(event, user_id) {
    sessionStorage.setItem('enable_livedashboard', event.checked);
    const userlist = [];
    userlist.push(user_id);
    await this.apiService.apiFn(
      { type: 'POST', target: 'users/user_enable_live' },
      { 'userList': userlist, value: event.checked }
    )
      .then((result: any) => {
        if (result['status']) {
          this.toastr.success(result['message']);
        } else {
          this.toastr.error(result['message']);
        }
      })
      .catch((error) => this.toastr.error(error['message']));
  }

  async suspendUser(event, user_id) {
    if (event.checked === true) {
      await this.apiService.apiFn(
        { type: 'POST', target: 'users/suspend_user' },
        { 'active': event.checked, 'userId': user_id }
      )
        .then((result: any) => console.log("result of enable disable user", result))
        .catch((error) => this.toastr.error(error['message']));
      this._commonService.setLoader(true);
      this.getUsersDataFunction();
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '350px',
        data: {
          'title': 'suspend_user',
          'id': { 'active': event.checked, 'userId': user_id },
          'API': 'users/suspend_user'
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          const index = this.data.findIndex(item => item._id === user_id);
          if (index > -1) this.data[index]['active'] = !event.checked;
        }
        this._commonService.setLoader(true);
        this.getUsersDataFunction();
      });
    }
  }

  async sendEmailAccessToggle(event, user_id) {
    await this.apiService.apiFn(
      { type: 'POST', target: 'users/change_user_email_access' },
      { 'id': user_id, 'email_access': event.checked }
    )
      .then((result: any) => {
        if (result['status']) {
          this.toastr.success(result['message']);
        } else {
          this.toastr.error(result['message']);
        }
      })
      .catch((error) => this.toastr.error(error['message']));
  }

  getUserAccess(){
    this.userAccess.isAdd = this._commonService.checkPrivilegeModule('users','add');
    this.userAccess.isEdit = this._commonService.checkPrivilegeModule('users','edit');
    this.userAccess.isView = this._commonService.checkPrivilegeModule('users','view');
    this.userAccess.isDelete = this._commonService.checkPrivilegeModule('users','delete');
    this.userAccess.isExport = this._commonService.checkPrivilegeModule('users','export');
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'users/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
    }
  }
  async ngAfterViewChecked(){
    this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled','true');
  }
}


export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  moduleName?: string,
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
  org_id: '';
  fac_id: '';
}
