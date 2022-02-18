import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource, MatSort, PageEvent } from '@angular/material';
import * as moment from 'moment';
import { SocketService } from './../../shared/services/socket/socket.service';
import { ExcelService } from './../../shared/services/excel.service';
import { ApiService } from './../../shared/services/api/api.service';
import { CommonService } from './../../shared/services/common.service';

@Component({
  selector: 'app-open-visits',
  templateUrl: './open-visits.component.html',
  styleUrls: ['./open-visits.component.scss']
})
export class OpenVisitsComponent implements OnInit {

  exportdata;
  public btnAction: Function;

  // MATPAGINATOR
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [

    {
      id: 'resident_name',
      value: 'Resident',
      sort: false
    }
    , {
      id: 'care',
      value: 'Care',
      sort: false
    }
    , {
      id: 'start_time',
      value: 'Start Time',
      sort: false
    }
    , {
      id: 'pause_time',
      value: 'Pause Time',
      sort: false
    }
    , {
      id: 'user',
      value: 'User',
      sort: false
    }
  ];

  // Pagination
  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0

  };
  count;
  constructor(
    private router: Router,
    private apiService: ApiService,
    private excelService: ExcelService,
    private _commonService: CommonService,
    private socketService: SocketService,
  ) { }

  @HostListener('window:scroll')
  checkScroll() {
    // window의 scroll top
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
    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.columnNames.map(x => x.id);
    this.getServerData(this.pagiPayload);
    this.socketService.onTrackCareUpdateFn().subscribe(_response => {
      if (_response) {
        this.getServerData(this.pagiPayload);
      }
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
    this.getServerData(this.pagiPayload);
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    this.dataSource.sort = this.sort;
  }

  addForm() { // Custom-code!
    this.router.navigate(['/beacons/form']);
  }

  async exportOpenvisits() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'dashboard/exportOpenvisits'
    };
    const payload = {};
    let result = await this.apiService.apiFn(action, payload);
    result = result['data'];
    if (result['status']) {
      const data = result['data'];
      this.exportdata = data;
      const facility = this.prepareUsersForCSV();
      this._commonService.setLoader(false);
      this.excelService.exportAsExcelFile(facility, 'Openvists_Report');

    }
  }

  prepareUsersForCSV() {
    const openvisits = [];
    this.exportdata.forEach(item => {
      openvisits.push({
        'Name': item.user_name ? item.user_name : '--',
        'Resident Name': item.resident_name ? item.resident_name : '--',
        'Care Name': item.care ? item.care.name : '--',
        'Start Time': item.ts_total_time ? moment(item.ts_total_time.start_time).format('MMMM Do YYYY, HH:mm') : '--',
        'Pause Time': item.ts_total_time ? moment(item.ts_total_time.end_time).format('MMMM Do YYYY, HH:mm') : '--',
      });
    });
    return openvisits;

  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload['flag'] = 'all';
    const action = { type: 'GET', target: 'dashboard/openvisits' };
    const payload = this.pagiPayload;

    let result = await this.apiService.apiFn(action, payload);

    this.count = result['data']['_count'];

    result = result['data']['_openvisits'].map(item => {
      return {
        ...item,
        resident_name: item.resident_name ? item.resident_name : '--',
        care: item.care ? item.care.name : '--',
        start_time: item.ts_total_time ? moment(item.ts_total_time.start_time).format('MMMM Do YYYY, HH:mm') : '--',
        pause_time: item.ts_total_time ? moment(item.ts_total_time.end_time).format('MMMM Do YYYY, HH:mm') : '--',
        user: item.user_name
      };
    });
    this._commonService.setLoader(false);

    this.createTable(result);
  }

  onPipe(key, value) { // Custom-code!
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
}
