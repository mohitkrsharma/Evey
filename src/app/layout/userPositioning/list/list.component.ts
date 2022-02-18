import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { MatPaginator, MatTableDataSource, PageEvent } from "@angular/material";
import { ApiService } from "../../../shared/services/api/api.service";
import { MatDialog } from "@angular/material/dialog";
import { CommonService } from "../../../shared/services/common.service";
import { fromEvent } from "rxjs";
import { debounceTime, distinctUntilChanged, tap } from "rxjs/operators";
import { MatTable } from "@angular/material/table";
import { Aes256Service } from "../../../shared/services/aes-256/aes-256.service";
// import { Socket } from "ngx-socket-io";
import { io } from "socket.io-client";
import { environment } from "src/environments/environment";
const _socket = io(environment.config.socket_url);

@Component({
  selector: "app-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.scss"],
})
export class ListComponent implements OnInit, AfterViewChecked {
  constructor(
    private apiService: ApiService,
    public dialog: MatDialog,
    public _commonService: CommonService,
    // private _socket: Socket,
    private _aes256Service: Aes256Service
  ) {}
  @ViewChild("table", {static: true}) table: MatTable<any>;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild("searchInput", {static: true}) searchInput: ElementRef;
  public btnAction: Function;

  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  data;
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  count;
  actualDataCount;
  search: any;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: "userName",
      value: "User",
      sort: false,
    },
    {
      id: "beacon_name",
      value: "Beacon Name",
      sort: false,
    },
    {
      id: "beacon_tag",
      value: "Beacon Tag",
      sort: false,
    },
    {
      id: "zoneName",
      value: "zone",
      sort: false,
    },
    {
      id: "dateTime",
      value: "Date Time",
      sort: false,
    },
  ];

  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: "",
  };
  public show = false;
  public isLoading: boolean = false;
  public isClicked: boolean = false;
  hasNextPage: boolean = false;
  public totalCount: any;
  @HostListener("window:scroll")
  checkScroll() {
    // window의 scroll top
    // Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

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
      behavior: "smooth",
    });
  }
  ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    fromEvent(this.searchInput.nativeElement, "keyup")
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();

    this.displayedColumns = this.displayedColumns.concat(
      this.columnNames.map((x) => x.id)
    );

    // Pagination
    this.getServerData(this.pagiPayload);

    _socket.on("updateStaffLocation", (dataSource: any) => {
      let obj = this._aes256Service.decFnWithsalt(dataSource);
      obj.dateTime = this.formateDate(obj.dateTime);
      this.data.unshift(obj);
      this.createTable(this.data);
    });
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

  public async getStaffLocation() {
    const action = {
      type: "GET",
      target: "staffLocation",
    };
    const payload = this.pagiPayload;

    let result = await this.apiService.apiFn(action, payload);
    console.log({ result });
    this.count = result["data"]["_count"];
    this.hasNextPage = result['data']['isNextPage'];
    if (result["status"]) {
      result = result["data"]["_staff_location"].map((item) => {
        return {
          ...item,
          dateTime: this.formateDate(item.timestamp),
          userName: item.user.last_name + ", " + item.user.first_name,
          zoneName: item.zone.room,
        };
      });
      this.data = result;
      if (this.data && this.data.length > 0) {
        this.actualDataCount = this.data.length;
      }
      this.createTable(result);
      this._commonService.setLoader(false);
    }
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.getStaffLocation();
  }

  formateDate(timeStamp) {
    let date = new Date(timeStamp);
    const nth = function (d) {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };
    function formatAMPM(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? "0" + minutes : minutes;
      var strTime = hours + ":" + minutes + " " + ampm;
      return strTime;
    }
    let formatedDate =
      date.toLocaleString("default", { month: "long" }) +
      " " +
      date.getDate() +
      nth(date.getDate()) +
      " " +
      date.getFullYear() +
      ", " +
      formatAMPM(date);

    return formatedDate;
  }
  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'staffLocation/count' };
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
