import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  OnDestroy,
  Input,
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
  selector: 'app-list-med',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit, OnDestroy {

  @Input() isFromResident = false
  @Input() encResidentId = '';

  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('restoreButton', {static: true}) private restoreButton: ElementRef;

  org;
  fac;
  public btnAction: Function;
  public filtershow = false;
  search: any;
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  exportdata;
  dataSource=new MatTableDataSource<any>([]);
  noMedicationData =  this.dataSource.connect().pipe(map(data => data.length === 0));
  displayedColumns = [];
  arr = [];
  filedata;
  residentlevel;
  isShow: boolean;
  topPosToStartShowing = 100;
  careSearch = '';
  isArcheive: boolean = false;
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
    // {
    //   id: 'resident_name',
    //   value: 'Resident Name',
    //   sort: true,
    // },
    {
      id: 'medication_name',
      value: 'Medication Name',
      sort: true,
    },
    {
      id: 'frequency',
      value: 'Frequency',
      sort: true,
    },
    // {
    //   id: 'ndc',
    //   value: 'NDC',
    //   sort: true,
    // },
    {
      id: 'route',
      value: 'Route',
      sort: true,
    },
    {
      id: 'dosage',
      value: 'Dosage',
      sort: true,
    },
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
    page_index: 0,
    page_size: 10,
    search: '',
    sort: { active: 'medication_name', direction: 'asc' },
  };
  listType = null;
  count;
  sector;
  residentId = '';
  activeMedication = true;

  eventsubscription: Subscription;
  subscription1: Subscription;
  subscription: Subscription = new Subscription();
  facId = '';
  roomName = '';


  @ViewChild('allSelected', {static: true}) private allSelected: MatOption;
  constructor(
    private _router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _socketService: SocketService,
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
    this.search = this.searchInput.nativeElement.value;
    // console.log('encResidentId--->', this.encResidentId);
    // if (!this._commonService.checkPrivilegeModule('medication')) {
    //   this._router.navigate(['/']);
    // }
    this.subscription = this._commonService.contentdata.subscribe((contentVal: any) => {
      this._commonService.setLoader(true);
      if (contentVal.org && contentVal.fac) {
        console.log('contentVal.fac', contentVal.fac);
        this.pagiPayload['org_id'] = this.organization = contentVal.org;
        this.pagiPayload['fac_id'] = this.facility = contentVal.fac;
        this.facId = contentVal.fac;
        this.roomName = this.facId + '-EMAR';
        this.connectWithSocketFn();
      }
    });

    this.listType = this._router.url.split('/').pop();

    this._commonService.setLoader(true);
    this.eventsubscription = this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.listType = event.url.split('/').pop();
        this.setDisplayColumns();
        this.search = '';
        // this.pagiPayload = {
        //   length: 0,
        //   pageIndex: 0,
        //   pageSize: 10,
        //   previousPageIndex: 0,
        //   search: '',
        //   activeMed: true,
        //   sort: { active: 'medication_name', direction: 'asc' },
        // };
        this.setLastCrumb(event.url);
        // this.getServerData(this.pagiPayload);
      }
    });

    if (sessionStorage.getItem('medicationListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('medicationListing'));
      if (pageListing.medicationList) {
        // this.pagiPayload = pageListing.medicationList;
        // this.pagiPayload.previousPageIndex =
        //   pageListing.medicationList.previousPageIndex;
        // this.pagiPayload.pageIndex = pageListing.medicationList.pageIndex;
        // this.pagiPayload.pageSize = pageListing.medicationList.pageSize;
        // this.pagiPayload.length = pageListing.medicationList.length;
        this.search = pageListing.medicationList.search;
      } else {
        sessionStorage.setItem(
          'medicationListing',
          JSON.stringify({ medicationList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        'medicationListing',
        JSON.stringify({ medicationList: this.pagiPayload })
      );
    }

    
    // this._commonService.payloadSetup('medicationList', this.pagiPayload);
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this.btnAction = this.addForm.bind(this);
    this.setDisplayColumns();
    if (this.route.params['_value']['id']) {
      this.residentId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      // this.pagiPayload['resident_id'] = this.residentId;
      this.getServerData(this.pagiPayload);
    } else {
      console.log('----from resident-----',this.route.snapshot.queryParamMap.get('residentId'))
      const resident_id = this.route.snapshot.queryParamMap.get('residentId');
      if(resident_id){
        this.residentId = this._aes256Service.decFnWithsalt(resident_id);
        // this.pagiPayload['resident_id'] = this.residentId;
        this.getServerData(this.pagiPayload);
      }
    }

    this.subscription.add(this._socketService.addMedicationFn().subscribe(async (res: any) => {
      console.log('add_medication', res);
        this.getMedicationDataFunction();
    }));
    this.subscription.add(this._socketService.updateMedicationFn().subscribe(async (res: any) => {
      console.log('update_medication', res);
        this.getMedicationDataFunction();
    }));

    // const moreLinks = this._constantsService.medicationMoreOption();
    // this._commonService.setMoreOption(moreLinks);
  }

  connectWithSocketFn() {
    this._socketService.connectFn(this.roomName).subscribe(_response => {
      if (_response) {
          console.log('medication Socket Res --->', _response);
      }
    });
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
    this.displayedColumns = this.displayedColumns.concat(['actions']);
  }

  ngOnDestroy() {
    this._commonService.setMoreOption(false);
    this._commonService.setLastCrumb(false);
    this.subscription.unsubscribe();
    this.eventsubscription.unsubscribe();
    this._socketService.disConnectFn(this.roomName).subscribe(async (_result: any) => {
      console.log('result after socket disconnection--->', _result);
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
          this._router.navigate(['/residents/form', this._aes256Service.encFnWithsalt(this.residentId)]);
          // this._router.navigate(['/medications']);
          this.pagiPayload = {
            page_index: 0,
            page_size: 10,
            search: '',
            sort: { active: 'medication_name', direction: 'asc' },
          };
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

  stoppedMedication() {
    this.activeMedication = !this.activeMedication;
    // console.log('stoppedMedication');
    if (this.activeMedication === true) {
      this.displayedColumns = this.displayedColumns.concat(['actions']);
      this.pagiPayload['active_med'] = true;
    } else if (this.activeMedication === false) {
      this.pagiPayload['active_med'] = false;
      this.displayedColumns = this.displayedColumns.filter(element => {
        return element !== 'actions';
      });
    }
    this.getServerData(this.pagiPayload);
    // this.getMedicationDataFunction();
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    this.noMedicationData =  this.dataSource.connect().pipe(map(data => data.length === 0));
    // this.dataSource.sort = this.sort;
  }

  addForm() {
    // Custom-code!
    this._router.navigate(['/medications/form'], {queryParams: {residentId: this._aes256Service.encFnWithsalt(this.residentId)}});
  }

  veiwMedicationList() {
    // Custom-code!
    // this._router.navigate(['/medications/form']);
  }

  editMedication(id) {
    // this._router.navigate([
    //   'residents/form/${}/medicationForm/form',
    //   this._aes256Service.encFnWithsalt(id),
    // ]);
    let residentId = this.route.params['_value']['id'];
    // console.log('residentId---->', residentId);
    // console.log('medication id---->', id);
    this._router.navigate(['residents/form/' + this.encResidentId + '/medication/', this._aes256Service.encFnWithsalt(id)]);
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
        this._router.navigate(['/residents/form', this._aes256Service.encFnWithsalt(this.residentId)]);
        // this._router.navigate(['/medications']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  public async getMedicationDataFunction() {
    this.pagiPayload['care_type'] = ["1", "3"];
    

    this._commonService.setLoader(true);
    // const action = {
    //   type: 'GET',
    //   target: 'residents/medication_list',
    // };

    const payload = this.pagiPayload;
    // console.log(payload)
  //   const payload = {
  //     org_id: "5a859f300b48ce45436f3948",
  //     fac_id: "5a859ff30b48ce45436f3949",
  //     page_index: 0,
  //     care_type: ["1", "3"],
  //     page_size: 10,
  //     search: "",
  //     active_med: false,
  //     medication_id: "",
  //     sort: { active: "medication_name", direction: "asc"}
  // };
    const action = { type: 'POST', target: `residents/${this.residentId}/medandtreat` };

    // payload['listType'] = this.listType;
    // payload['organization'] = this.organization;
    // payload['facility'] = this.facility;
    // if (this.isArcheive === true) {
    //   payload['delete'] = true;
    // } else {
    //   payload['delete'] = false;
    // }
    let result = await this.apiService.apiFn(action, payload);
    // console.log(JSON.stringify(result));
    this.count = result['count'];
    if (result['status']) {
      if (
        (!result['data'] ||
          result['data'].length === 0) &&
        this.pagiPayload.page_index > 0
      ) {
        this.paginator.previousPage();
      } else {
        this.count = result['count'];
        // console.log('result data _medication---->', result['data']['_medication']);
        result = result['data'].map((item) => {
          return {
            ...item,
            ndc: item.drug && item.drug.ndc ? item.drug.ndc : '',
            route: item.drug && item.drug.ndc ? item.drug.route : '',
            medication_name: item.drug.name +
                             item.drug.suffix_name + ' ' + '( '
                             + item.drug.non_suffix_name + ' )' + ' ' +
                             item.drug.strength.toFixed(2) +
                             item.drug.unit.split('/')[0],
            resident_name: item.resident.name,
            medication_schedule: item.medicationSchedule ? item.medicationSchedule.name : '-',
            medication_duration: item.medicationDuration ? item.medicationDuration.name : '-',
            frequency: item.medicationDurations && item.medicationDurations.length ? item.medicationDurations.map(element => {
              return  ' ' + element.name;
            }) : '-',
            fac_id: item.resident.facility[0].fac
          };
        });
        // console.log('result---->', result);
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
    this._commonService.setLoader(false);
  }

  sortData(sort?: PageEvent) {
    // console.log(sort)
    if (sort['direction'] === '') {
      sort['direction'] = "asc"
      // this.sort.active = sort['active'];
      // this.sort.direction = 'asc';
      // this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      // this.sort._stateChanges.next();
      // return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload.sort = {
      active: sort['active'],
      direction: sort['direction'],
    };
    sessionStorage.setItem(
      'medicationListing',
      JSON.stringify({ medicationList: this.pagiPayload })
    );
    // this._commonService.updatePayload(null, 'medicationList', this.pagiPayload);
    this.getMedicationDataFunction();
  }

  public async getServerData(event) {
    // console.log(event)
    this._commonService.setLoader(true);
    // this.pagiPayload.previousPageIndex = event.previousPageIndex;
    if(event.pageIndex || event.pageSize){
      
      this.pagiPayload.page_index = event.pageIndex;
      this.pagiPayload.page_size = event.pageSize;
    }if(event.page_index || event.page_size){

      this.pagiPayload.page_index = event.page_index;
      this.pagiPayload.page_size = event.page_size;
    }

    // this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem(
      'medicationListing',
      JSON.stringify({ medicationList: this.pagiPayload })
    );
    // this._commonService.updatePayload(event, 'medicationList', this.pagiPayload);
    this.getMedicationDataFunction();
  }

  // searching
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }

  timerCompleted(event) {}

}
