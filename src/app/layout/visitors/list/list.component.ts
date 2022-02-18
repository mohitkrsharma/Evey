import { Component, OnInit, ViewChild, HostListener, ElementRef,TemplateRef } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent } from '@angular/material';
import { Router } from '@angular/router';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA,MatDialogConfig } from '@angular/material/dialog';
import { ExcelService } from './../../../shared/services/excel.service';
import { CommonService } from './../../../shared/services/common.service';
import { ToastrService } from 'ngx-toastr';
import { fromEvent } from 'rxjs';
import * as moment from 'moment';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  filter,
  tap
} from 'rxjs/operators';
// import { bypassSanitizationTrustResourceUrl } from '@angular/core/src/sanitization/bypass';
import {MatTable} from '@angular/material/table';
import {CdkDragDrop, moveItemInArray, transferArrayItem, CdkDragHandle} from '@angular/cdk/drag-drop';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  constructor(
    private router: Router,
    private apiService: ApiService,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService
  ) {}
  @ViewChild('table', {static: true}) table: MatTable<any>;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  public btnAction: Function;

  // MATPAGINATOR
  // pageEvent: PageEvent;
  datasource: null;
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  deleteItem = [];
  data;
  dataSource;
  isShow: boolean;
  topPosToStartShowing = 100;
  displayedColumns = [];
  organiz; floorlist; faclist;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  sortActive = 'ts_created';
  sortDirection: 'asc' | 'desc' | '';
  count;
  actualDataCount;
  search: any;
  /**
   * Pre-defined columns list for user table
   */
  columnNames = [
    
    {
      id: 'name',
      value: 'Name',
      sort: true
    }
    , {
      id: 'phone',
      value: 'Phone No.',
      sort: true
    },
    {
      id: 'resident',
      value: 'Resident',
      sort: false
    },
    {
      id: 'relation',
      value: 'Relation',
      sort: false
    },
    {
      id: 'ts_created',
      value: 'Visit Date',
      sort: true
    }
  ];
  pagiPayload = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
  };
  public show = false;
  @HostListener('window:scroll') 
 checkScroll() {

 // window의 scroll top
 // Both window.pageYOffset and document.documentElement.scrollTop returns the same result in all the cases. window.pageYOffset is not supported below IE 9.

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

    if(!this._commonService.checkAllPrivilege('Visitors')){
      this.router.navigate(['/']);
    }

    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.questionList) {
        this.pagiPayload = pageListing.questionList;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({questionList: this.pagiPayload}));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({questionList: this.pagiPayload}));
    }
    this.search = this.searchInput.nativeElement.value;
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
        debounceTime(2000),
        distinctUntilChanged(),
        tap(() => {
          this.getServerData(this.pagiPayload);
        })
      )
      .subscribe();
    
   // this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    // Pagination
    this.getServerData(this.pagiPayload);
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
      this.toastr.error('Please select Question to be deleted');
      this.checked = false;
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'questions', 'id': this.deleteArr, 'API': 'questions/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          this.data.forEach(element => {
            element.checked = false;
            this.checked = false;
          });
          this.deleteArr = [];
        } else {
          this.checked = false;
          this.getServerData(this.pagiPayload);
        }
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
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

  

 


  deleteQuestion(id) {
    this.deleteItem.push(id);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'questions', 'id': this.deleteItem, 'API': 'questions/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.getServerData(this.pagiPayload);
      this.checked = false;
    });
  }

 

 
  public async getVisitorsDataFunction() {
    const action = {
      type: 'GET',
      target: 'questionnaire'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    //result = result['data'];
    this.count = result['data']['_count'];
    if (result['status']) {
      result = result['data']['_questionnaires'].map(item => {
        return {
          ...item,
          name: item.visitor.name,         
          phone: item.visitor.phone,
          resident:  item.resident.first_name + ' ' + item.resident.last_name,
          relation:item.visitor.relation,
          ts_created:moment(item.ts_created).format('MMMM Do YYYY, hh:mm A')
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

  sortData(sort?: PageEvent) {
    // console.log('sortsortsortsortsort',sort);
    if (sort['direction'] === '') {
      this.sort.active = sort['active'];
      this.sort.direction = 'asc';
      this.sort.sortChange.emit({active: sort['active'], direction: 'asc'});
      this.sort._stateChanges.next();
      return;
    }
    this._commonService.setLoader(true);
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem('pageListing', JSON.stringify({questionList: this.pagiPayload}));
    this.getVisitorsDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({questionList: this.pagiPayload}));
    this.getVisitorsDataFunction();

  }

  viewVisitor(id) {
    this.router.navigate(['/visitors/view', this._aes256Service.encFnWithsalt(id) ]);
  }
}


