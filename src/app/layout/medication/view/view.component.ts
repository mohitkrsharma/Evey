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

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {

  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;

  org;
  fac;
  public btnAction: Function;
  public filtershow = false;
  search: any;
  residentSearch: any;
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  exportdata;
  dataSource;
  displayedColumns = [];
  arr = [];
  filedata;
  residentlevel;
  isShow: boolean;
  topPosToStartShowing = 100;
  careSearch = '';
  isArcheive = false;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public show = false;
  public buttonName: any = 'Show';
  sortActive = 'medication_name';
  sortDirection: 'asc' | 'desc' | '';
  actualDataCount;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'resident_name',
      value: 'Resident Name',
      sort: true,
    },
    {
      id: 'count',
      value: 'Medication Count',
      sort: true,
    }
  ];
  organization;
  facility;
  floor;
  checked;
  faclist;
  floorvalue;
  floor_filter;
  deleteArr = [];
  deleteItem = [];
  data: any = [];
  organiz;
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'medication_name', direction: 'asc' },
  };
  residentPagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' }
  };
  listType = null;
  count;
  sector;

  eventsubscription: Subscription;
  subscription1: Subscription;
  subscription: Subscription = new Subscription();


  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;

  constructor(
    private _router: Router,
    private apiService: ApiService,
    private dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private socketService: SocketService,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService
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
    this.listType = this._router.url.split('/').pop();
    this.subscription = await this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.residentPagiPayload['fac_id'] = this.facility = contentVal.fac;
        await this.getResidentServerData(this.residentPagiPayload);
      }
    });
    this._commonService.setLoader(true);
    this.eventsubscription = this._router.events.subscribe(async (event) => {
      if (event instanceof NavigationEnd) {
        this.listType = event.url.split('/').pop();
        this.setDisplayColumns();
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
        await this.getResidentServerData(this.residentPagiPayload);
      }
    });

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.medicationList) {
        this.pagiPayload.previousPageIndex =
          pageListing.medicationList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.medicationList.pageIndex;
        this.pagiPayload.pageSize = pageListing.medicationList.pageSize;
        this.pagiPayload.length = pageListing.medicationList.length;
      } else {
        sessionStorage.setItem(
          'pageListing',
          JSON.stringify({ medicationList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'pageListing',
        JSON.stringify({ medicationList: this.pagiPayload })
      );
    }

    // filter resident by name
    this.search = this.searchInput.nativeElement.value;
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getResidentServerData(this.residentPagiPayload);
        })
      )
      .subscribe();

    this.btnAction = this.addForm.bind(this);
    this.setDisplayColumns();
    // this.getResidentServerData(this.residentPagiPayload);
    // this.getServerData(this.pagiPayload);


    // const moreLinks = this._constantsService.medicationMoreOption();
    // this._commonService.setMoreOption(moreLinks);
  }

  setLastCrumb(url) {
    if (this.listType === 'deleted') {
      this._commonService.setLastCrumb({
        label: 'Deleted Medications',
        routerLink: url,
      });
    } else if (this.listType === 'removed') {
      this._commonService.setLastCrumb({
        label: 'Removed Medications',
        routerLink: url,
      });
    }
  }

  setDisplayColumns() {
    this.displayedColumns = [];
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    if (this.listType !== 'deleted') {
    }
  }

  ngOnDestroy() {
    this._commonService.setMoreOption(false);
    this._commonService.setLastCrumb(false);
    this.subscription.unsubscribe();
    // this.subscription1.unsubscribe();
    this.eventsubscription.unsubscribe();
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
      this.toastr.error('Please select medication to be deleted');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: {
          title: 'medications',
          id: this.deleteArr,
          API: 'residents/delete/medication',
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
          this.toastr.success('Medication deleted successfully');
          this.getServerData(this.pagiPayload);
          this.checked = false;
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

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    // this.dataSource.sort = this.sort;
  }

  addForm() {
    // Custom-code!
    this._router.navigate(['/medications/form']);
  }

  veiwMedicationList(id, facId) {
    // Custom-code!
    sessionStorage.setItem('resident_facilityId', this._aes256Service.encFnWithsalt(facId));
    this._router.navigate(['/medications/list',
      this._aes256Service.encFnWithsalt(id)
    ]);
  }

  editMedication(id) {
    this._router.navigate([
      '/medications/form',
      this._aes256Service.encFnWithsalt(id),
    ]);
  }

  filter() {
    this.filtershow = !this.filtershow;
    this.show = false;
    this.residentlevel = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
    delete this.pagiPayload['floor'];
    delete this.pagiPayload['sector'];
    delete this.pagiPayload['org_filter'];
    delete this.pagiPayload['fac_filter'];
    delete this.pagiPayload['floor_filter'];
    delete this.pagiPayload['level'];
    this.getServerData(this.pagiPayload);
  }

  deleteMedication(id) {
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'medication', id: id, API: 'residents/delete/medication' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  public async getMedicationDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'residents/medication_list',
    };
    const payload = this.pagiPayload;
    payload['listType'] = this.listType;
    payload['organization'] = this.organization;
    payload['facility'] = this.facility;
    if (this.isArcheive === true) {
      payload['delete'] = true;
    } else {
      payload['delete'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    if (result['status']) {
      if (
        (!result['data']['_medication'] ||
          result['data']['_medication'].length === 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['data']['_count'];

        result = result['data']['_medication'].map((item) => {
          return {
            ...item,
            resident_name: item.resident.name,
            fac_id: item.resident.facility[0].fac ? item.resident.facility[0].fac : '-',
            facility: item.facility ? item.facility : '-',
            resident_status: item.resident_status ? item.resident_status : '-',
            care_level: item.care_level ? item.care_level : '-',
          };
        });
        this._commonService.setLoader(false);
        this.data = result;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        // this.createTable(result);
        this.checked = false;
        this.deleteArr = [];
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
      JSON.stringify({ medicationList: this.pagiPayload })
    );
    this.getMedicationDataFunction();
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
      JSON.stringify({ medicationList: this.pagiPayload })
    );
    this.getMedicationDataFunction();
  }

  public async getResidentServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.residentPagiPayload.previousPageIndex = event.previousPageIndex;
    this.residentPagiPayload.pageIndex = event.pageIndex;
    this.residentPagiPayload.pageSize = event.pageSize;
    this.residentPagiPayload.length = event.length;
    this.residentPagiPayload.search = this.search;
    this.getResidentUsersDataFunction();
  }

  public async getResidentUsersDataFunction() {
    this._commonService.setLoader(true);
    const action = {
      type: 'GET',
      target: 'residents/list_resident_medication'
    };
    this.residentPagiPayload['fac_id'] = this.facility;
    const payload = this.residentPagiPayload;
    payload['listType'] = 'listView';
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['data']['_count'];
    if (result['status']) {
      if ((!result['data']['_residents'] || result['data']['_residents'].length === 0) && this.residentPagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        this.count = result['data']['_count'];

        result = result['data']['_residents'].map(item => {
          return {
            ...item,
            resident_name: item.last_name + ',' + ' ' + item.first_name,
            // count:
            facId:  item.facility[0].fac,
          };
        });
        this._commonService.setLoader(false);
        this.data = result;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.createTable(result);
      }
    }
    this._commonService.setLoader(false);
  }


  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getResidentServerData(this.residentPagiPayload);
    }, 2000);
  }

  timerCompleted(event) {}

}
