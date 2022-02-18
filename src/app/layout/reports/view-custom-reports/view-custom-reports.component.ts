import { Component, OnInit, ViewChild, HostListener, ElementRef } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs/Rx';
import { ApiService } from './../../../shared/services/api/api.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-view-custom-reports',
  templateUrl: './view-custom-reports.component.html',
  styleUrls: ['./view-custom-reports.component.scss']
})
export class ViewCustomReportsComponent implements OnInit {

  isShow: Boolean = false;
  // pageEvent: PageEvent;
  constructor(
    private apiService: ApiService,
    private router: Router,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public commonService: CommonService
  ) { }

  public totalPagesExp = '{total_pages_count_string}';
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
  }
  checked; actualDataCount;
  deleteArr = [];
  deleteItem = [];
  displayedColumns = [];
  columnNames = [
    {
      id: "name",
      value: "Name",
      sort: false
    },
    {
      id: "user",
      value: "User",
      sort: false
    }
    , {
      id: "build_date",
      value: "Date",
      sort: false
    }
  ];
  dataSource;
  data;count;
  private subscription: Subscription;
  timezone;
  utc_offset;
  ngOnInit() {
    if(!this.commonService.checkAllPrivilege('Reports')){
      this.router.navigate(['/']);
    }
    this.subscription = this.commonService.contentdata.subscribe((contentVal: any) => {
			if (contentVal.org && contentVal.fac) {
			  // console.log('--facility timezone--',contentVal)
			  this.timezone=contentVal.timezone
			  this.utc_offset=contentVal.utc_offset
			}
		  });
    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['actions']);
    this.getServerData(this.pagiPayload);
  }

  createTable(arr) {
    let tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
  }

  selectAll() {
    if (this.checked == true) {
      this.data.forEach(element => {
        element.checked = false;
        this.deleteArr = [];
      });
    } else {
      this.data.forEach(element => {
        this.deleteArr.push(element._id)
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
    } else if (check == undefined || check === false) {
      this.deleteArr.push(id);
    }
    if ((this.deleteArr && this.deleteArr.length) < this.actualDataCount) {
      this.checked = false;
    } else if ((this.deleteArr && this.deleteArr.length) === this.actualDataCount) {
      this.checked = true;
    }
  }

  deleteReport(id) {
    this.deleteItem.push(id)
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass:'DeleteAlert',
      data: { 'title': 'floor/sector', 'id': this.deleteItem, 'API': 'reports/delete' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.pagiPayload={
          length: 0,
          pageIndex: 0,
          pageSize: 10,
          previousPageIndex: 0,
        }

        this.deleteItem = [];
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
      }
    });
  }

  delete() {
    if (this.deleteArr.length === 0) {
      this.toastr.error("Please select reports to be deleted")
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { "title": "residents", "id": this.deleteArr, "API": 'reports/delete' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result && result["type"] == "success"){
          this.pagiPayload={
            length: 0,
            pageIndex: 0,
            pageSize: 10,
            previousPageIndex: 0,
          }
          this.toastr.success("Reports deleted successfully");
          this.getServerData(this.pagiPayload);
        }else{
          this.data.forEach(element => {
            element.checked = false;
          });  
          this.deleteArr = [];
          // this.toastr.error("Error in Resident deletion")
        }
        this.checked=false
        // if (!result) {
          
        // } else {
         
        // }
       
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-program-focused');
        this.deleteButton['_elementRef'].nativeElement.classList.remove('cdk-focused');
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      })
    }
  }
  
  public async getServerData(event?: PageEvent) {
    this.commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    const action = { type: 'GET', target: 'reports/get_saved_reports' };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
   
    this.count = result['data']['_count'];
    result = result['data']['buildreports'].map(item => {
      return {
        ...item,
        user: (item.user_id) ?item.user_id.last_name +', '+ item.user_id.first_name:'-',
        build_date:moment.tz(item.build_date,this.timezone).format("MMMM Do YYYY, HH:mm")
      }
    });
    this.data = result;
    this.commonService.setLoader(false);
    if (this.data && this.data.length > 0) {
      this.actualDataCount = this.data.length;
    }
    this.createTable(this.data);
  }

  viewReport(id){
    this.router.navigate(['/reports/view', this._aes256Service.encFnWithsalt(id)]);
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


