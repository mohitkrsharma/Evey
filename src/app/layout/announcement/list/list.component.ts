import { Component, OnInit, ViewChild, HostListener, ElementRef, TemplateRef, AfterViewChecked } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator, ProgressSpinnerMode } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { RestoreComponent } from '../../../shared/modals/restore/restore.component';
import { ToastrService } from 'ngx-toastr';
import { Subscription, fromEvent } from 'rxjs';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { debounceTime, map, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { MatDialogConfig } from '@angular/material';
import { ConstantsService } from './../../../shared/services/constants.service';
import { UserAccess } from 'src/app/shared/models/userAccess';
import { SocketService } from 'src/app/shared/services/socket/socket.service';
type AOA = any[][];
export interface PeriodicElement {
  org_name: string;
  org_id: string;
  fac_name: string;
  fac_id: string;
  fac_address1: string;
  fac_address2: string;
  fac_city: string;
  fac_state: string;
  fac_zip1: string;
  fac_zip2: string;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, AfterViewChecked {

  @ViewChild('deleteButton', { static: false }) private deleteButton: ElementRef;
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;
  @ViewChild('restoreButton', { static: false }) private restoreButton: ElementRef;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('addModal', { static: false }) addModal: TemplateRef<any>;
  dialogRefs = null;
  isEdit = false;
  announcement: any = {
    message: '',
    isactive: true,
    organization: '',
    fac: '',
    facility: [],
    border_color: '#0063AB',
    font_color: '#0063AB',
    background_color: '#FFFFFF',
    font_size: 17,
    isdefault: true,
    theme: 'Primary',
    priority: ''
  };
  messagerequired = false;
  orgSearch = '';
  facSearch = '';
  theSearch = '';
  defaultAlert;
  userFacilityList: PeriodicElement[];
  singleUserFacilityselected;
  ismultifac: Boolean = false;
  paramId: Boolean;
  faclist;
  showfaclist: boolean;
  multifacility: any;
  fac_address1: any;
  fac_address2: any;
  fac_city: any;
  fac_state: any;
  fac_zip1: any;
  fac_zip2: any;
  multiorg: any;
  duplicateFacility;
  string;
  orgDisable: Boolean = false
  facDisable: Boolean = false
  public facList = [];
  public facListDone = [];

  announce: any;
  public btnAction: Function;
  public filtershow = false;
  private subscription: Subscription;
  fac = '';
  org = '';
  defaultErr: any;
  // MATPAGINATOR
  // datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
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
    moduleName: 'announcementList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: '_id', direction: 'desc' },
    organization: '',
    facility: ''
  };
  actualDataCount;
  bulkorg; bulkfac;
  isArcheive: boolean = false;
  showCon = true
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    {
      id: 'message',
      value: 'Message',
      sort: true
    }
    , {
      id: 'facility',
      value: 'Building',
      sort: false
    }

  ];
  filedata;
  privilege: string = 'add';
  prevLastIndex: number;
  prevFirstIndex: number;
  isClicked: boolean = false;
  totalCount: number = 0;
  isLoading: boolean = false;
  hasNextPage: boolean = false;
  public show = false;
  public userAccess: UserAccess = new UserAccess();
  isLevelChangeAnnounce: boolean = false;
  position_name: any;
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

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public commonService: CommonService,
    private _constantsService: ConstantsService,
    private socketService: SocketService,
  ) { this.defaultAlert = this._constantsService.alertData(); }

  async ngOnInit() {
    this.search = this.searchInput.nativeElement.value;
    if (!this.commonService.checkAllPrivilege('Announcement')) {
      this.router.navigate(['/']);
    }
    this.getUserAccess();
    const userInfo = JSON.parse(sessionStorage.getItem('authReducer'));
    console.log("Job title",userInfo.jobTitle.position_name);
    this.position_name = userInfo.jobTitle.position_name;
    this.search = '';

    this.commonService.setLoader(true);
    await this.apiService.apiFn({ type: 'GET', target: 'announcement/getlist' }, {})
      .then((el: any) => this.announce = el.data);
    // this.announce['message'] = this.announce['message'];

    const errValues = this.commonService.errorMessages();
    this.defaultErr = errValues[0].user_errors;

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.announcementList) {
        this.pagiPayload = pageListing.announcementList;
        // this.pagiPayload.previousPageIndex = pageListing.announcementList.previousPageIndex;
        // this.pagiPayload.pageIndex = pageListing.announcementList.pageIndex;
        // this.pagiPayload.pageSize = pageListing.announcementList.pageSize;
        // this.pagiPayload.length = pageListing.announcementList.length;
        this.search = pageListing.announcementList.search;

      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ announcementList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ announcementList: this.pagiPayload }));
    }
    this.commonService.payloadSetup('announcementList', this.pagiPayload)

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

    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    // this.displayedColumns = this.displayedColumns.concat(['theme']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['enable']);
    this.displayedColumns = this.displayedColumns.concat(['actions']);

    this.getOrganizationlist();
    // Pagination
    this.pagiPayload = {
      moduleName: 'announcementList',
      length: 0,
      pageIndex: 0,
      pageSize: 10,
      previousPageIndex: 0,
      search: '',
      sort: { active: '_id', direction: 'desc' },
      organization: '',
      facility: ''
    };
    this.getServerData(this.pagiPayload);


    this.showfaclist = false;

    // get organization list:
    // const action2 = { type: 'GET', target: 'organization/orglist' };
    // const payload2 = {};
    // const result2 = await this.apiService.apiFn(action2, payload2);
    // this.organiz = result2['data'];
    this.subscription = this.commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.organization = contentVal.org;
        this.facility = contentVal.fac;
        await this.socketService.joinRoomWithfac(contentVal.fac, "ANNOUNCE")
      }
    });

    if(this.position_name == 'Activity Coordinator' || this.position_name == 'Activity Assistant'){
      this.defaultAlert = this.defaultAlert.filter(d => d.name == 'Dark Green' || d.name == 'White / Dark Green Boarder' || d.name == 'Alert');
      console.log("Activity Cordinator", this.defaultAlert);
    }
    else {
      this.defaultAlert = this.defaultAlert.filter(d => d.name !== 'Dark Green' && d.name !== 'White / Dark Green Boarder');
      console.log("No Activity Cordinator", this.defaultAlert);
    }

    this.commonService.setLoader(false);

  }

  async ngAfterViewChecked() {
    this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
  }

  filter() {
    this.filtershow = !this.filtershow;
    this.show = false;
  }

  toggle() {
    this.show = !this.show;
    this.filtershow = false;
    this.organization = '';
    this.facility = '';
    delete this.pagiPayload['org_name'];
    delete this.pagiPayload['fac_name'];
  }

  achieve() {
    this.filtershow = false;
    this.show = false;
    this.search = '';
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = true;
    this.getServerData(this.pagiPayload);
  }
  //reset default
  defArchieve() {
    this.show = false;
    this.filtershow = false;
    this.search = '';
    this.pagiPayload.pageIndex = 0;
    this.pagiPayload.previousPageIndex = 0;
    this.isArcheive = false;
    this.getServerData(this.pagiPayload);
  }
  deleteRestore() {
    if (this.deleteArr.length === 0) {
      this.toastr.error('Please select announcement to be restored');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(RestoreComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { 'title': 'restore_user', 'id': this.deleteArr, 'restore_data': 'restore_data', 'API': 'announcement/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
          });
          this.deleteArr = [];
          this.checked = false;
        } else {
          this.toastr.success('Announce restored successfully');
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
  // restoreAnnounce(id) {
  //   this.deleteArr = [];
  //   const dialogRef = this.dialog.open(RestoreComponent, {
  //     width: '450px',
  //     panelClass: 'DeleteAlert',
  //     data: { 'title': 'restore_user', 'id': id, 'restore_data': 'restore_data', 'API': 'announcement/delete' }
  //   });
  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result && result['status']) {
  //       this.toastr.success('Announce restored successfully');
  //       this.getServerData(this.pagiPayload);
  //       this.checked = false;
  //     }
  //   });
  // }
  //End Restore changes

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
      //setTimeout(() => {
      this.hasNextPage == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled', 'true');
      //      }, 1000);
    }
    // let tempRange = this.paginator._intl.getRangeLabel(this.pagiPayload.pageIndex,arr.length,arr.length);
    // console.log('hasNextPage---->>',this.paginator.hasNextPage());


  }

  async userOrganization() {
    await this.apiService.apiFn({ type: 'GET', target: 'users/get_org' }, {})
      .then((el: any) => {
        if (el.data) {
          this.organiz = el.data.map(obj => {
            let rObj = {};
            rObj['org_name'] = obj._id.org.org_name;
            rObj['_id'] = obj._id.org._id;
            return rObj;
          });
        }
      });
    let defaultOrgName;
    for (var i = 0; i < this.organiz.length; i++) {
      if (this.organization == this.organiz[i]._id) {
        defaultOrgName = this.organiz[i].org_name;
      }
    }
    this.multiorg = defaultOrgName
    /*if(this.isEdit !== true){
      this.announcement.organization = this.organization;
    }*/

  }
  async userFacility() {
    const payload2 = { org: this.organization };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
    this.faclist = await result2['data'].map(function (obj) {
      const fObj = {};
      fObj['fac_name'] = obj._id.fac.fac_name;
      fObj['_id'] = obj._id.fac._id;
      return fObj;
    });
    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName
    if (this.isEdit !== true) {
      // this.announcement.fac = this.facility;
    } else {
      this.removeAddedFac()
      // this.faclist = [];
    }

    // this.faclist = this.facList.filter(e=>this.userFacilityList.findIndex(f=>f.fac_id==e._id)==-1)

    console.log('---filtered fac--', this.faclist)

    //1336
    this.orgFacSelection()
    /* if(this.organiz.length==1){
       this.orgDisable=true
       this.announcement.organization = this.organization
       this.multiorg = this.organiz[0]['org_name']
       await this.changeOrg(this.announcement.organization)
     }*/

    /*if(this.faclist.length==1){
      console.log('---facllis--',this.faclist,this.facility)
      if(this.userFacilityList && this.userFacilityList.length && this.userFacilityList.findIndex(e=>e.fac_id==this.facility)==-1){
        console.log('-eeeeerrrrr')
        this.announcement.fac = this.faclist[0]._id
        this.multifacility = this.faclist[0]['fac_name']
        this.facDisable=true
      }
    }*/
  }

  async addForm() {
    // debugger
    this.commonService.setLoader(true);
    this.showCon = true
    if (this.isEdit !== true) {
      //this.isEdit === false;
      this.privilege = 'add';
      await this.userOrganization()
      await this.userFacility()
    }
    this.commonService.setLoader(false);
    //this.faclist  = [];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '1130px';
    //dialogConfig.height = '528px';
    //dialogConfig.width = '70% !important';
    dialogConfig.panelClass = 'shiftpopup_announcement';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addModal, dialogConfig);
    //this.router.navigate(['/announcement/form']);
  }

  async editAnnounce(id) {
    this.commonService.setLoader(true);
    this.showCon = true
    await this.userOrganization()
    await this.userFacility()
    this.paramId = true;
    this.isEdit = true;
    this.privilege = 'edit';
    const action = { type: 'POST', target: 'announcement/view' };
    const payload = { announceId: id };
    const result = await this.apiService.apiFn(action, payload);
    this.announcement = result['data'];

    this.userFacilityList = result['data']['facility'].map(item => ({
      org_id: item.org._id, org_name: item.org.org_name,
      fac_id: item.fac._id, fac_name: item.fac.fac_name, selected: item.selected,
    })
    );
    this.facListDone = this.userFacilityList;
    this.string = this.announcement['message'];
    this.announcement['isdefault'] = (this.announcement['isdefault'] === undefined) ? false : this.announcement['isdefault'];
    console.log('----result---', result['data']['facility']);
    this.announcement['message'].includes('changed from') ? this.isLevelChangeAnnounce = true : this.isLevelChangeAnnounce = false;
    if (result['data']['facility'].length > 0) {
      // console.log('before',this.faclist)
      this.removeAddedFac()
      // console.log('after')
      // this.multiorg = result['data']['facility'][0]['org'] ? result['data']['facility'][0]['org']['org_name'] : '';
      // console.log('---qqqqq---',this.announcement.organization)
      // this.changeOrg(this.announcement.organization);
      this.ismultifac = true;
      // this.showfaclist = true;
      // this.multifacility = result['data']['facility'][0]['fac']['fac_name'];
    }
    else {
      this.ismultifac = false;
      this.showfaclist = false;
      this.orgFacSelection()
    }
    if (!this.announcement.organization) {
      this.announcement.organization = '';
    }
    this.commonService.setLoader(false);
    this.addForm();
    //this.dataSource = new MatTableDataSource(this.userFacilityList);
    //this.router.navigate(['/announcement/form', this._aes256Service.encFnWithsalt(id) ]);
  }

  viewAnnounce(id) {
    this.router.navigate(['/announcement/view', this._aes256Service.encFnWithsalt(id)]);
  }

  deleteAnnounce(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'user', 'id': id, 'API': 'announcement/delete' }
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
        this.toastr.error('Please select announcement to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { 'title': 'announcements', 'id': this.deleteArr, 'API': 'announcement/delete' }
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

  public async getAnnouncementDataFunction() {
    const action = {
      type: 'GET',
      target: 'announcement/list'
    };
    const payload = this.pagiPayload;
    if (this.isArcheive === true) {
      payload['restore_delete'] = true;
    } else {
      payload['restore_delete'] = false;
    }
    let result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      if ((!result['data']['_announces'] || result['data']['_announces'].length === 0) && this.pagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        this.count = result['data']['_count'];
        //document.getElementsByClassName('mat-paginator-range-label')[0].innerHTML = this.prevFirstIndex + ' - ' + this.prevLastIndex;
        //result['data']['isNextPage'] == true ? document.getElementsByClassName('mat-paginator-navigation-next')[0].removeAttribute('disabled') : document.getElementsByClassName('mat-paginator-navigation-next')[0].setAttribute('disabled','true');
        this.hasNextPage = result['data']['isNextPage'];
        result = result['data']['_announces'].map(item => {
          const facility = item['_facility'].map(itm => itm.fac ? itm.fac.fac_name : '-');
          const unique = (value, index, self) => {
            return self.indexOf(value) === index;
          };
          const arr = facility.filter(unique);
          return {
            ...item,
            // message:{
            //   message:item.message,
            //   isAlert:item.theme=='Alert'?true:false
            // },
            facility: item['_facility'] ? (arr).toString().replace(/,/g, ', ') : '-',
          };
        });
        this.data = result;
        console.log('----data----', this.data)
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

  sortData(sort?: PageEvent) {
    this.commonService.setLoader(true);
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({ active: sort['active'], direction: 'asc' });
      this.sort._stateChanges.next();
      return;
    }
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem('pageListing', JSON.stringify({ announcementList: this.pagiPayload }));
    this.commonService.updatePayload(null, 'announcementList', this.pagiPayload);
    this.getAnnouncementDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this.commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    this.pagiPayload.organization = event['organization'];
    this.pagiPayload.facility = event['facility'];
    sessionStorage.setItem('pageListing', JSON.stringify({ announcementList: this.pagiPayload }));
    this.commonService.updatePayload(event, 'announcementList', this.pagiPayload)
    this.getAnnouncementDataFunction();
  }

  // async changeOrg(org, type) {
  //   this.filedata = '';
  //   if (type === 'bulk') {
  //     this.bulkorg = org.value;
  //     const action = { type: 'GET', target: 'facility/faclist' };
  //     const payload = { 'org_id': org };
  //     const result = await this.apiService.apiFn(action, payload);
  //     this.fac_list = result['data'];

  //   } else {
  //     this.facility = '';
  //     this.pagiPayload = {
  //       length: 0,
  //       pageIndex: 0,
  //       pageSize: 10,
  //       previousPageIndex: 0,
  //       search: this.search,
  //       sort: this.pagiPayload.sort,
  //       organization: this.pagiPayload.organization,
  //       facility: this.pagiPayload.facility
  //     };
  //     this.org = org;
  //     this.pagiPayload['org_name'] = this.org;
  //     const action = { type: 'GET', target: 'facility/faclist' };
  //     const payload = { 'org_id': org };
  //     const result = await this.apiService.apiFn(action, payload);
  //     this.fac_list = result['data'];
  //     this.pagiPayload['fac_name'] = '';
  //     this.getServerData(this.pagiPayload);
  //   }

  // }

  // async changeFac(fac, type) {
  //   this.filedata = '';
  //   if (type === 'bulk') {
  //     this.bulkfac = fac.value;
  //   } else {
  //     this.pagiPayload = {
  //       length: 0,
  //       pageIndex: 0,
  //       pageSize: 10,
  //       previousPageIndex: 0,
  //       search: this.search,
  //       sort: this.pagiPayload.sort,
  //       organization: this.pagiPayload.organization,
  //       facility: this.pagiPayload.facility
  //     };
  //     this.fac = fac;
  //     this.pagiPayload['org_name'] = this.org;
  //     this.pagiPayload['fac_name'] = this.fac;
  //     this.getServerData(this.pagiPayload);
  //   }
  // }


  async getOrganizationlist() {
    const action = { type: 'GET', target: 'organization/orglist' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = result['data'];
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

  async onChangeActive(event, announce_id) {
    const announceslist = [];
    announceslist.push(announce_id);
    const action = { type: 'POST', target: 'announcement/enable' };
    const payload = { 'announcesList': announceslist, value: event.checked };
    const result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      this.toastr.success(result['message']);
    } else {
      this.toastr.error(result['message']);
    }
  }

  /* Start Pop up code*/
  async saveDialog(announcement) {
    // debugger
    // console.log('this.userFacilityList--->', this.userFacilityList);
    // console.log('--data--', { added: this.userFacilityList, orgDropdown: this.organiz, facDropdown: this.faclist });
    // return;

    if (!announcement.message || announcement.message === '') {
      this.toastr.error('Please enter message.');
      return;
    }
    if ((!this.userFacilityList || (this.userFacilityList && this.userFacilityList.length < 1)) && (announcement.organization == '' || announcement.fac == '')) {
      this.toastr.error('Please select Organization and Facility.');
      return;
    }
    this.duplicateFacility = '';

    // if(this.showCon && this.faclist.length>0){
    //   if (announcement.organization !== '' && this.organiz.length>1 ) {
    //     if(announcement.fac === '' || announcement.fac === undefined){
    //       this.toastr.error('Select Building.');
    //       return;
    //     }
    //   }
    //   if(!this.userFacilityList || !this.userFacilityList.length ){      
    //     if( announcement.organization === '' && !announcement.facility.length){
    //       this.toastr.error("Select organization.");
    //       return;
    //     }
    //   }
    // }


    if (announcement.organization !== '' && announcement.fac !== '') {
      this.addFacilityList(announcement, true)
    }
    if (!this.duplicateFacility) {
      let newMessage = announcement.message

      this.facListDone = this.userFacilityList;

      const div = document.createElement('div');
      this.announcement.message = this.announcement.message.replace(/<\/?(?!u)(?!em)(?!strong)\w*\b[^>]*>/ig, '');
      div.innerHTML = this.announcement.message;
      const allElements = div.getElementsByTagName('*');
      for (let i = 0, len = allElements.length; i < len; i++) {
        const element = allElements[i];
        element.removeAttribute('style');
      }
      const text = (div.textContent || div.innerText || '').replace(/ /g, '');
      if (announcement.message !== '' && this.facListDone.length && text.length) {
        this.commonService.setLoader(true);
        if (!this.ismultifac) {
          this.announcement['facility'] = [{
            org: this.org,
            fac: this.fac
          }];

        } else {
          this.announcement['facility'] = this.userFacilityList.map(item => (
            { org: item.org_id, fac: item.fac_id, selected: item['selected'] }));
        }
        const payload = this.announcement;
        //this.announcement.message = newMessage;   // store message Without Removing white spaces
        console.log('---payload- after ---', payload, this.ismultifac, this.org, this.fac);
        const action = { type: 'POST', target: 'announcement/add' };
        // return;
        const result = await this.apiService.apiFn(action, payload);
        // this.commonService.setLoader(false);
        if (result['status']) {
          this.toastr.success(result['message']);
          this.closeDialog(this.announcement);
          this.getServerData(this.pagiPayload);
          this.commonService.setLoader(false);
        } else {
          this.toastr.error(result['message']);
          this.commonService.setLoader(false);
        }
      }
    }
  }

  closeDialog(announcement) {
    this.announcement.organization = '';
    this.announcement.fac = [];
    this.announcement.message = ''
    this.announcement.isactive = true
    this.announcement.facility = ''
    this.announcement.border_color = '#0063AB'
    this.announcement.font_color = '#0063AB'
    this.announcement.background_color = '#FFFFFF'
    this.announcement.font_size = 17
    this.announcement.isdefault = true
    this.announcement.theme = 'Primary'
    this.announcement.priority = ''
    delete this.announcement._id
    this.messagerequired = false;
    this.userFacilityList = [];
    this.facListDone = [];
    this.isEdit = false;
    this.duplicateFacility = false;
    this.isLevelChangeAnnounce = false;
    this.dialogRefs.close();
  }

  onchangemessage(event) {
    if (!this.announcement['message']) {
      this.messagerequired = true;
    } else {
      const div = document.createElement('div');
      div.innerHTML = this.announcement.message;
      const allElements = div.getElementsByTagName('*');
      for (let i = 0, len = allElements.length; i < len; i++) {
        const element = allElements[i];
        element.removeAttribute('style');
      }
      const text = (div.textContent || div.innerText || '').replace(/ /g, '');
      if (text.length) {
        this.announcement.message = div.innerHTML;
        this.messagerequired = false;
      } else {
        this.messagerequired = true;
      }
    }
  }

  changeTheme(theme) {

    const _ind = this.defaultAlert.findIndex((item) => item.name === theme.value);
    if (_ind > -1) {
      this.announcement['border_color'] = this.defaultAlert[_ind]['property']['border_color'];
      this.announcement['font_color'] = this.defaultAlert[_ind]['property']['font_color'];
      this.announcement['background_color'] = this.defaultAlert[_ind]['property']['background_color'];
      this.announcement['font_size'] = this.defaultAlert[_ind]['property']['font_size'];
      this.announcement['priority'] = this.defaultAlert[_ind]['priority'];
    }

  }

  addFaclities() {

  }

  async changeOrg(org) {
    this.org = org;
    // const action  = { type: 'GET', target: 'facility/faclist' };
    // const payload = { 'org_id': org };
    // const result  = await this.apiService.apiFn(action, payload);
    // this.faclist  = result['data'];
    this.announcement.fac = '';

    const payload2 = { org: org };
    const action2 = { type: 'GET', target: 'users/get_user_fac' };
    const result2 = await this.apiService.apiFn(action2, payload2);
    this.faclist = await result2['data'].map(function (obj) {
      const fObj = {};
      fObj['fac_name'] = obj._id.fac.fac_name;
      fObj['_id'] = obj._id.fac._id;
      return fObj;
    })

    if (this.userFacilityList && this.userFacilityList.length) {
      this.removeAddedFac()
    }

    let defaultFacName;
    for (var i = 0; i < this.faclist.length; i++) {
      if (this.facility == this.faclist[i]._id) {
        defaultFacName = this.faclist[i].fac_name;
      }
    }
    this.multifacility = defaultFacName

    //1336
    // this.orgFacSelection()
    if (this.faclist.length == 1) {
      this.announcement.fac = this.faclist[0]['_id']
      this.multifacility = this.faclist[0]['fac_name']
      this.facDisable = true
    } else {
      this.facDisable = false
    }
  }

  async changeFac(fac, announcement) {
    // debugger
    this.fac = fac;
  }

  select(org, fac, flag, announcement) {
    // debugger
    if (flag === 0) {
      if (!org || org === undefined) {
        this.multifacility = fac.source.selected.viewValue;
      } else if (!fac || fac === undefined) {
        this.multiorg = org.source.selected.viewValue;
      }
    }
    else {
      if (!org || org === undefined) {
        this.multifacility = fac;
        this.fac_address1 = fac.fac_address1;
        this.fac_address2 = fac.fac_address2;
        this.fac_city = fac.fac_city;
        this.fac_state = fac.fac_state;
        this.fac_zip1 = fac.fac_zip1;
        this.fac_zip2 = fac.fac_zip2;
      } else if (!fac || fac === undefined) {
        this.multiorg = org;
      }
    }
  }

  async onRemoveFac(i) {
    if (i != undefined && i != null) {
      console.log('---this changed facility---', this.userFacilityList[i])
      this.addfacIn(i)
      this.userFacilityList.splice(i, 1);
      this.announcement.facility.splice(i, 1);
      this.facListDone = this.userFacilityList;
      if (this.userFacilityList.length > 0) {
        this.showfaclist = true;
        this.ismultifac = true;
      } else if (this.userFacilityList.length === 0) {
        this.showfaclist = false;
        this.ismultifac = false;
      }

    } else {
      this.showCon = false
    }
  }

  async addFacilityList(announcement, isFromDone?) {
    // debugger
    console.log('---check multi adddd---', this.multiorg, this.multifacility)
    console.log('---anonuce record---', announcement)
    if (!this.showCon) {
      this.showCon = true
      return
    }
    else {
      this.duplicateFacility = false;
      if ((announcement.organization === '' || announcement.organization === undefined) && !isFromDone) {
        this.toastr.error('Select organization');
        return;
      } else if ((announcement.fac === '' || announcement.fac === undefined) && !isFromDone) {
        this.toastr.error('Select Building');
        this.duplicateFacility = true;
        return;
      } else {
        this.ismultifac = true;
        if (this.userFacilityList === undefined || this.userFacilityList.length < 1) {
          this.userFacilityList = [
            {
              'org_id': announcement.organization,
              'org_name': this.multiorg,
              'fac_id': announcement.fac,
              'fac_name': this.multifacility,
              "fac_address1": this.fac_address1,
              "fac_address2": this.fac_address2,
              "fac_city": this.fac_city,
              "fac_state": this.fac_state,
              "fac_zip1": this.fac_zip1,
              "fac_zip2": this.fac_zip2,
            }
          ];
        } else {
          console.log('----here---', this.userFacilityList, this.multifacility)
          if (this.userFacilityList.some(item => item.fac_name.toLowerCase().trim() === this.multifacility.toLowerCase().trim() &&
            item.org_name.toLowerCase().trim() === this.multiorg.toLowerCase().trim())) {
            if (this.toastr.currentlyActive === 0) {
              this.toastr.error('Facility already added');
              this.duplicateFacility = true;
            }
          } else {
            this.userFacilityList.push({
              org_id: announcement.organization,
              org_name: this.multiorg,
              fac_id: announcement.fac,
              fac_name: this.multifacility,
              "fac_address1": this.fac_address1,
              "fac_address2": this.fac_address2,
              "fac_city": this.fac_city,
              "fac_state": this.fac_state,
              "fac_zip1": this.fac_zip1,
              "fac_zip2": this.fac_zip2,
            });
          }
        }
        if (this.userFacilityList.length > 0) {
          this.showfaclist = true;
          this.ismultifac = true;
        } else {
          this.ismultifac = false;
          this.showfaclist = false;
        }
        //  if(this.isEdit == true){
        //1336
        //  this.announcement['organization'] = '';
        //  this.announcement.fac = "";
        //  this.faclist = [];
        //  }
        // this.announcement['fac']          = '';
        // await this.userOrganization()
        // await this.userFacility()    
      }
      if (isFromDone === true && this.duplicateFacility != true) {
        this.dialogRefs.close();
      }

      //this.faclist = [];
    }
    console.log('--added--', this.userFacilityList)
    this.removeAddedFac()
  }

  removeAddedFac() {
    console.log('--organiz--', this.organiz, this.faclist)

    this.faclist = this.faclist.filter(e => this.userFacilityList.findIndex(z => z.fac_id == e._id) == -1)
    console.log('-----fac new---', this.faclist)
    //1336
    this.orgFacSelection()
  }

  async addfacIn(i) {
    if (this.announcement.organization) {
      await this.changeOrg(this.announcement.organization)
    }

    // this.faclist.push({fac_name:this.userFacilityList[i].fac_name,_id:this.userFacilityList[i].fac_id})

    this.facDisable = false
    this.announcement.fac = ''
    //check if org and fac is only one field left than make it selected default and disable selection

    //1336
    /*we should avoid calling orgFacSelection function here on removing, because it will add the defaulr org and fac to list which will be added than even if user don't want to save.*/
    // this.orgFacSelection()
    /*if(this.organiz.length==1 && this.faclist.length==1){
      console.log('--org fac---',this.organiz,this.faclist,this.announcement['org_name'],this.announcement['fac_name'])
      this.announcement.organization = this.organiz[0]._id
      this.multiorg = this.organiz[0]['org_name']
  
      this.announcement.fac = this.faclist[0]._id
      this.multifacility = this.faclist[0]['fac_name']
      this.facDisable=true
    }
    if(this.faclist.length>1){
      console.log('---in-----')
      this.facDisable=false
    }*/
    console.log('---check multi---', this.multiorg, this.multifacility)
  }

  orgFacSelection() {
    console.log({
      org_ln: this.organiz.length,
      fac_ln: this.faclist.length,
      orglist: this.organiz,
      faclist: this.faclist
    })
    console.log('----ln-----', this.organiz.length, this.faclist.length)
    if (this.organiz.length == 1 && this.faclist.length == 1) {

      //organization manage
      this.orgDisable = true
      this.announcement.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = true
      this.announcement.fac = this.faclist[0]['_id']
      this.multifacility = this.faclist[0]['fac_name']
    }
    else if (this.organiz.length == 1 && this.faclist.length > 1) {
      console.log('---here------------', this.faclist)
      //organization manage
      this.orgDisable = true
      this.announcement.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.announcement.fac = ''

    } else if (this.organiz.length > 1) {
      //organization manage
      this.orgDisable = false
      // this.announcement.organization = ''
      // this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.announcement.fac = ''
      this.multifacility = (this.faclist && this.faclist.length && this.faclist[0]['fac_name']) ? this.faclist[0]['fac_name'] : ''
    } else if (this.organiz.length == 1 && this.faclist.length == 0) {
      //organization manage
      this.orgDisable = true
      this.announcement.organization = this.organization
      this.multiorg = this.organiz[0]['org_name']

      //facility manage
      this.facDisable = false
      this.announcement.fac = ''
      //  this.multifacility=this.faclist[0]['fac_name']
    }
    else {
      //organization manage
      this.orgDisable = false
      this.announcement.organization = ''

      //facility manage
      this.facDisable = false
      this.announcement.fac = ''
    }
  }

  getUniqueFac() {

    if (this.userFacilityList && this.userFacilityList.length) {
      return this.faclist.filter(e => this.userFacilityList.findIndex(z => z.fac_id == e._id) == -1)
    } else {
      return this.faclist
    }

  }
  /* End Pop up code*/
  getUserAccess() {
    this.userAccess.isView = this.commonService.checkPrivilegeModule('announcement', 'view');
    this.userAccess.isAdd = this.commonService.checkPrivilegeModule('announcement', 'add');
    this.userAccess.isEdit = this.commonService.checkPrivilegeModule('announcement', 'edit');
    this.userAccess.isDelete = this.commonService.checkPrivilegeModule('announcement', 'delete');
    this.userAccess.isExport = this.commonService.checkPrivilegeModule('announcement', 'export');
  }

  async getTotalCount() {
    this.isClicked = false;
    this.isLoading = true;
    const action = { type: 'GET', target: 'announcement/count' };
    const payload = this.pagiPayload;
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status']) {
      this.isLoading = false;
      this.isClicked = true;
      this.totalCount = result['data']['_count'];
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
  moduleName?: string,
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
  organization: '';
  facility: '';
}
