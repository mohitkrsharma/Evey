import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatPaginator,
} from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { ToastrService } from 'ngx-toastr';
import { Subscription, fromEvent } from 'rxjs';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from 'rxjs/operators';

type AOA = any[][];

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, AfterViewChecked {
  @ViewChild('deleteButton', { static: true }) private deleteButton: ElementRef;
  @ViewChild('restoreButton', { static: true })
  private restoreButton: ElementRef;
  public btnAction: Function;
  public filtershow = false;
  private subscription: Subscription;
  filesdata: AOA = [];
  uploadOrgFac;
  fac;
  org;
  defaultErr: any;
  errorMsg: any = [];
  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  arr = [];
  dataSource;
  count;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organization;
  facility;
  // ddp list variable
  search: any;
  pagiPayload: PagiElement = {
    moduleName: 'assetsList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: '_id', direction: 'desc' },
    org_id: '',
    fac_id: '',
  };
  actualDataCount;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  isArcheive = false;
  /**
   * Pre-defined columns list for Asset table
   */
  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true,
    },
    {
      id: 'type',
      value: 'Type',
      sort: true,
    },
    {
      id: 'nfc',
      value: 'NFC',
      sort: true,
    },
  ];
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  filedata;

  public show = false;
  public isLoading = false;
  public isClicked = false;
  hasNextPage = false;
  public totalCount: any;
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

  // TODO: Cross browsing
  gotoTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public commonService: CommonService
  ) {}

  async ngOnInit() {
    if (!this.commonService.checkAllPrivilege('Assets')) {
      this.router.navigate(['/']);
    }

    this.commonService.setLoader(true);

    const errValues = this.commonService.errorMessages();
    this.defaultErr = errValues[0].user_errors;

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.assetsList) {
        this.pagiPayload.previousPageIndex =
          pageListing.assetsList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.assetsList.pageIndex;
        this.pagiPayload.pageSize = pageListing.assetsList.pageSize;
        this.pagiPayload.length = pageListing.assetsList.length;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ assetsList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ assetsList: this.pagiPayload })
      );
    }
    this.commonService.payloadSetup('assetsList', this.pagiPayload);
    this.search = this.searchInput.nativeElement.value;
    // searching
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000), // The user can type quite quickly in the input box, and that could trigger a lot of server requests. With this operator, we are limiting the amount of server requests emitted to a maximum of one every 150ms
        distinctUntilChanged(), // This operator will eliminate duplicate values
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.commonService.setLoader(true);

          this.organization = contentVal.org;
          this.facility = contentVal.fac;
          this.getServerData(this.pagiPayload);
          this.commonService.setLoader(false);
        }
      }
    );
    this.commonService.setLoader(false);
  }

  toggle() {
    this.show = !this.show;
    this.filtershow = false;
    this.organization = '';
    this.facility = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
  }
  // Conitional based Data Pass
  achieve() {
    this.filtershow = false;
    this.show = false;
    this.search = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = true;
    this.getServerData(this.pagiPayload);
  }
  // reset default
  defArchieve() {
    this.show = false;
    this.filtershow = false;
    this.search = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = false;
    this.getServerData(this.pagiPayload);
  }
  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select asset to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'restore_user',
          id: this.deleteArr,
          restore_data: 'restore_data',
          API: 'assets/delete',
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
          this.toastr.success('Asset restored successfully');
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

  // Single Restore Button
  restoreAssets(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(RestoreComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: {
        title: 'restore_user',
        id: id,
        restore_data: 'restore_data',
        API: 'assets/delete',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success('Asset restored successfully');
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }
  // End Changes Restore

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
      this.hasNextPage == true
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
      this.hasNextPage == true
        ? document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .removeAttribute('disabled')
        : document
            .getElementsByClassName('mat-paginator-navigation-next')[0]
            .setAttribute('disabled', 'true');
    }
  }

  addForm() {
    this.router.navigate(['/assets/form']);
  }

  typeList() {
    this.router.navigate(['/assets/types']);
  }

  editAsset(id) {
    this.router.navigate([
      '/assets/form',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }

  deleteAsset(id) {
    if (!this.commonService.checkPrivilegeModule('assets', 'delete')) {
      this.toastr.error("You don't have permission to delete assets.");
      this.router.navigate(['/assets']);
      return;
    }
    this.deleteArr = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'user', id: id, API: 'assets/delete' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.checked = false;
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      } else {
        // this.toastr.error(result['message']);
      }
    });
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
    if (!this.commonService.checkPrivilegeModule('assets', 'delete')) {
      this.toastr.error("You don't have permission to delete assets.");
      this.router.navigate(['/assets']);
      return;
    }
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select asset to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'assets', id: this.deleteArr, API: 'assets/delete' },
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

  public async getAssetsDataFunction() {
    const action = {
      type: 'GET',
      target: 'assets/list',
    };
    const payload = this.pagiPayload;
    if (this.isArcheive === true) {
      payload['restore_delete'] = true;
    } else {
      payload['restore_delete'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);

    if (result['status']) {
      if (
        (!result['data'] || result['data'].length === 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['count'];
        this.hasNextPage = result['isNextPage'];
        result = result['data'].map((item) => {
          return {
            ...item,
            name: item.name ? item.name : '-',
            organization: item.org ? item['org']['org_id'] : '-',
            facility: item.fac ? item['fac']['fac_id'] : '-',
            type: item.type ? item.type.displayName : '-',
            nfc: item.nfc ? item.nfc.ntagid : '-',
          };
        });
        this.data = result;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.createTable(result);
        this.checked = false;
        this.deleteArr = [];
      }
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
      JSON.stringify({ assetsList: this.pagiPayload })
    );
    this.getAssetsDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.pagiPayload.org_id = this.organization;
    this.pagiPayload.fac_id = this.facility;
    sessionStorage.setItem(
      'pageListing',
      JSON.stringify({ assetsList: this.pagiPayload })
    );
    this.commonService.updatePayload(event, 'assetsList', this.pagiPayload);
    this.getAssetsDataFunction();
  }

  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'assets/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['count'];
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
  org_id: '';
  fac_id: '';
}
