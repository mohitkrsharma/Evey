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
} from "@angular/core";
import {
  MatTableDataSource,
  MatSort,
  PageEvent,
  MatPaginator,
} from "@angular/material";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";
import { fromEvent } from "rxjs";
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap,
} from "rxjs/operators";
import { Subscription } from "rxjs";
import { ApiService } from "./../../../shared/services/api/api.service";
import { AlertComponent } from "../../../shared/modals/alert/alert.component";
import { RestoreComponent } from "../../../shared/modals/restore/restore.component";
import { ExcelService } from "./../../../shared/services/excel.service";
import { SocketService } from "./../../../shared/services/socket/socket.service";
import { CommonService } from "./../../../shared/services/common.service";
import { ConstantsService } from "./../../../shared/services/constants.service";
import { Aes256Service } from "./../../../shared/services/aes-256/aes-256.service";
import { MatOption } from "@angular/material";

@Component({
  selector: "app-current-medication",
  templateUrl: "./current-medication.component.html",
  styleUrls: ["./current-medication.component.scss"],
})
export class CurrentMedicationComponent implements OnInit {
  @Input() isFromResident = false;

  @ViewChild("searchInput", {static: true}) searchInput: ElementRef;
  @ViewChild("deleteButton", {static: true}) private deleteButton: ElementRef;
  @ViewChild("restoreButton", {static: true}) private restoreButton: ElementRef;

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
      id: 'medication_schedule',
      value: 'Medication Schedule',
      sort: true,
    },
    {
      id: 'ndc',
      value: 'NDC',
      sort: true,
    },
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
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'medication_name', direction: 'asc' },
  };
  listType = null;
  count;
  sector;
  residentId = '';

  eventsubscription: Subscription;
  subscription1: Subscription;
  subscription: Subscription = new Subscription();

  constructor(
    private _router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private socketService: SocketService,
    public _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService
  ) {}

  async ngOnInit() {
    // if (!this._commonService.checkPrivilegeModule('medication')) {
    //   this._router.navigate(['/']);
    // }
    this.listType = this._router.url.split("/").pop();

    this._commonService.setLoader(true);
    this.eventsubscription = this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.listType = event.url.split("/").pop();
        this.setDisplayColumns();
        this.search = "";
        this.pagiPayload = {
          length: 0,
          pageIndex: 0,
          pageSize: 10,
          previousPageIndex: 0,
          search: "",
          sort: { active: "medication_name", direction: "asc" },
        };
        // this.setLastCrumb(event.url);
        this.getServerData(this.pagiPayload);
      }
    });

    if (sessionStorage.getItem("pageListing")) {
      const pageListing = JSON.parse(sessionStorage.getItem("pageListing"));
      if (pageListing.medicationList) {
        this.pagiPayload.previousPageIndex =
          pageListing.medicationList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.medicationList.pageIndex;
        this.pagiPayload.pageSize = pageListing.medicationList.pageSize;
        this.pagiPayload.length = pageListing.medicationList.length;
      } else {
        sessionStorage.setItem(
          "pageListing",
          JSON.stringify({ medicationList: this.pagiPayload })
        );
      }
    } else {
      sessionStorage.setItem(
        "pageListing",
        JSON.stringify({ medicationList: this.pagiPayload })
      );
    }

    // this.search = this.searchInput.nativeElement.value;
    // fromEvent(this.searchInput.nativeElement, "keyup")
    //   .pipe(
    //     debounceTime(2000),
    //     distinctUntilChanged(),
    //     tap(() => {
    //       this.getServerData(this.pagiPayload);
    //     })
    //   )
    //   .subscribe();

    // this.btnAction = this.addForm.bind(this);
    this.setDisplayColumns();
    if (this.route.params["_value"]["id"]) {
      this.residentId = this._aes256Service.decFnWithsalt(
        this.route.params["_value"]["id"]
      );
      this.pagiPayload["resident_id"] = this.residentId;
    } else {
      console.log(
        "----from resident-----",
        this.route.snapshot.queryParamMap.get("residentId")
      );
      const resident_id = this.route.snapshot.queryParamMap.get("residentId");
      if (resident_id) {
        this.residentId = this._aes256Service.decFnWithsalt(resident_id);
        this.pagiPayload["resident_id"] = this.residentId;
      }
    }
    this.getServerData(this.pagiPayload);
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
    // payload['resident_id'] = this.residentId
    if (this.isArcheive === true) {
      payload['delete'] = true;
    } else {
      payload['delete'] = false;
    }
    console.log('---payload---',payload);

    let result = await this.apiService.apiFn(action, payload);
    // this.count = result['data']['_count'];
    if (result['status']) {
      if (
        (!result['data']['_medication'] ||
          result['data']['_medication'].length === 0) &&
        this.pagiPayload.pageIndex > 0
      ) {
        this.paginator.previousPage();
      } else {
        // this.count = result['data']['_count'];
        console.log('---result----',result)
        result = result['data']['_medication'].filter(
          (e) =>
          (!e.expire_date || new Date(e.expire_date) > new Date()) &&
          !(e.is_prn && e.is_prn == true)
        ).map((item) => {
          return {
            ...item,
            ndc: item.drug.ndc,
            route: item.drug.route,
            medication_name: item.drug.name + item.drug.suffix_name + ' ' + '( ' + item.drug.non_suffix_name + ' )' + ' ' +
            item.drug.strength + item.drug.unit.split('/')[0] + ' ' + item.drug.dosage_form,
            resident_name: item.resident.name,
            medication_schedule: item.medicationSchedule ? item.medicationSchedule.name : '-',
            medication_duration: item.medicationDuration ? item.medicationDuration.name : '-',
            fac_id: item.resident.facility[0].fac
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
    this._commonService.setLoader(false);
  }
  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    this.noMedicationData =  this.dataSource.connect().pipe(map(data => data.length === 0));
    // this.dataSource.sort = this.sort;
  }
  setDisplayColumns() {
    this.displayedColumns = [];
    // this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );
    if (this.listType !== 'deleted') {
    }
    // this.displayedColumns = this.displayedColumns.concat(['actions']);
  }
}
