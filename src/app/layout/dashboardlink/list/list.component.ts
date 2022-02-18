import { Component, ViewChild, OnInit, HostListener, ElementRef } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
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
  tap
} from 'rxjs/operators';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  public btnAction: Function;
  exportdata;
  deleteItem = [];
  checked;
  deleteArr = [];
  // MATPAGINATOR
  search: any;
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  platform;
  user;
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];

  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'user',
      value: 'User',
      sort: true
    }
    , {
      id: 'organization',
      value: 'Organization',
      sort: true
    }
    , {
      id: 'facility',
      value: 'Facility',
      sort: true
    }
    , {
      id: 'date',
      value: 'Created Date',
      sort: true
    }];
  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: '', direction: 'asc' },
  };
  actualDataCount;
  count;
  data;
  public show = false;
  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _commonService: CommonService
  ) { }

  @HostListener('window:scroll')
  checkScroll() {

    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases.
    // window.pageYOffset is not supported below IE 9.

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
    // searching
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
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    this.getServerData(this.pagiPayload);
  }


  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
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


  public async getLinksFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'users/dashboard_links'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    this.data = result = result['data']['_links'].map(item => {
      return {
        ...item,
        date: moment(item.date).format('MMMM Do YYYY, HH:mm')
      };
    });
    if (this.data && this.data.length > 0) {
      this.actualDataCount = this.data.length;
    }
    this.createTable(result);
    this._commonService.setLoader(false);
  }

  // sort data
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
    this.getLinksFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.getLinksFunction();
  }

  terminateLink(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '350px',
      data: { 'title': 'Dashboard link', 'id': this.deleteItem, 'API': 'users/dashboard_links/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      }
    });
  }

  deleteLinks() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select data to be deleted');
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '350px',
        data: { 'title': 'Dashboard link', 'id': this.deleteArr, 'API': 'users/dashboard_links/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result['status']) {
          this.toastr.success(result['message']);
          this.getServerData(this.pagiPayload);
        } else {
          this.data.forEach(element => {
            element.checked = false;
          });
        }
        this.deleteArr = [];
        this.checked = false;
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
}

