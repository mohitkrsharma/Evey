import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource, MatSort, PageEvent, MatDialog } from '@angular/material';
import * as moment from 'moment';
import { SocketService } from '../../shared/services/socket/socket.service';
import { ExcelService } from '../../shared/services/excel.service';
import { ApiService } from '../../shared/services/api/api.service';
import { CommonService } from '../../shared/services/common.service';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AlertComponent } from 'src/app/shared/modals/alert/alert.component';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-orders-to-enter',
  templateUrl: './orders-to-enter.component.html',
  styleUrls: ['./orders-to-enter.component.scss']
})
export class OrdersToEnterComponent implements OnInit {

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
      id: 'type',
      value: 'Type',
      sort: false
    }
    , {
      id: 'date',
      value: 'Date',
      sort: false
    }
    , {
      id: 'pause_time',
      value: 'Action',
      sort: false
    }
  ];

  count;
  facility;

  subscription: Subscription = new Subscription();
  constructor(
    private router: Router,
    private apiService: ApiService,
    private excelService: ExcelService,
    private _commonService: CommonService,
    private socketService: SocketService,
    public _aes256Service: Aes256Service,
    private toastr: ToastrService,
    private dialog: MatDialog
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

  async ngOnInit() {
    this.btnAction = this.addForm.bind(this);
    this.displayedColumns = this.columnNames.map(x => x.id);
    this.subscription = await this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.facility = contentVal.fac;
      }
    });
    await this.getServerData();
    // this.socketService.onTrackCareUpdateFn().subscribe(_response => {
    //   if (_response) {
    //     this.getServerData(this.pagiPayload);
    //   }
    // });
  }

  enterToOrder(el){
    if(el){
      console.log("element-----",el);
      const navigateLink = '/residents/form/' + el.resident._id + '/add_order';
      this.router.navigate([navigateLink], {
        queryParams: {
          orderId: this._aes256Service.encFnWithsalt(el.order_id),
          residentId: this._aes256Service.encFnWithsalt(el.resident._id),
          orderType: el.folderName
        },
      });
    }
  }

  async removeOrder(el){
    this._commonService.setLoader(true);
    if(el){
      console.log("element-----",el);
      
      const action = { type: 'PUT', target: 'servicePlan/remove_order/' + el.order_id };
      const payload = {}
      let result: any = await this.apiService.apiFn(action, payload);

      console.log("Result---->",result);
      if(result && result.status){
        this.toastr.success("Order removed successfully");
        this.getServerData();
      }
      else {
        this.toastr.error("Please try again later");
      }
    }
    this._commonService.setLoader(false);
  }

  async deleteOrder(order){
    this._commonService.setLoader(true);
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { 'title': 'delete_order'}
    });
    dialogRef.afterClosed().subscribe(async res => {
      if(res){
        const payload = {
          id: order.order_id,
          restore_data: false
        };
        const action = {
          type: 'POST',
          target: 'residents/delete_res_order',
        };
        const result = await this.apiService.apiFn(action, payload);
        if (result['status']) {
          this.toastr.success("Order Deleted Successfully");
          this._commonService.setLoader(false);
          this.getServerData();
        }
        else {
          this.toastr.error("Please try again later");
        }
      }
    });
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
    this.getServerData();
  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
    this.dataSource.sort = this.sort;
  }

  addForm() { // Custom-code!
    this.router.navigate(['/beacons/form']);
  }

  async exportOrdersToEnterXls() {
    this._commonService.setLoader(true);
    const dataToExport = this.prepareUsersForCSV();
    this._commonService.setLoader(false);
    this.excelService.exportAsExcelFile(dataToExport, 'Orderstoenter_Report');
  }

  // Export PDF
  async onExportAsPDF() {
    let header = ['Resident Name', 'Type', 'Date'];
    let dataArr = [];
    this.exportdata.forEach(el => {
      dataArr.push([
        el.resident_name ? el.resident_name : '',
        el.type,
        el.date ? el.date : '-',
      ]);
    });
    let fontfamily = 'helvetica'
    let fontsize = 10;
    let x = 19.05;
    let y = 19.05;
    let doc = new jsPDF('p', 'mm', 'letter');
    doc.setFont(fontfamily, "normal");
    doc.setFontSize(16).setFont(fontfamily, 'bold');
    doc.text('Orders to Enter', x, y);
    doc.setFontSize(fontsize).setFont(fontfamily, "normal");
    y = y + 3;
      let data = dataArr;
      doc.setFontSize(12).setFont(fontfamily, 'bold')
        await doc.autoTable({
          startY: y + 6,
          margin: { left: 19.05, right: 19.05 },
          head: [header],
          body: data,
          theme: 'plain',
          styles: {
            overflow: 'linebreak',
            lineWidth: 0.1,
            valign: 'middle',
            lineColor: 211
          },
          horizontalPageBreak: true,
          didDrawPage: function () {
            doc.setTextColor('#1164A0');
            doc.setFontSize(8);
            doc.setFont(fontfamily, 'normal');
            doc.text('Reported by Evey®', x, 273.3, null, null, "left")
            doc.setFontSize(8).setFont(fontfamily, 'normal');;
            doc.text('CONFIDENTIAL', 196.95, 273.3, null, null, "right");
            doc.setTextColor('black');
            doc.setFontSize(fontsize);
            doc.setFont(fontfamily, 'normal');
          }
        })
        y = doc.lastAutoTable.finalY + 10;
        doc.save('Orders_to_enter');
  }

  prepareUsersForCSV() {
    const ordersToEnter = [];
    this.exportdata.forEach(item => {
      ordersToEnter.push({
        'Resident Name': item.resident_name ? item.resident_name : '--',
        'Type': item.type ? item.type : '--',
        'Date': item.date ? item.date : '--'
      });
    });
    return ordersToEnter;

  }

  public async getServerData() {
    this._commonService.setLoader(true);
    if(!this.facility){
      const fac = JSON.parse(sessionStorage.getItem('authReducer'));
      this.facility = fac['fac_id'];
    }
    const action = { type: 'GET', target: 'servicePlan/orders_to_enter' };
    const payload = { fac_id: this.facility };

    let result = await this.apiService.apiFn(action, payload);

    console.log("Result---->",result);

    result = result['data'].map(item => {
      return {
        ...item,
        resident_name: item.resident ? item.resident.last_name + ' ' + item.resident.first_name : '--',
        date: item.date ? moment(item.date).format('MMMM Do YYYY') : '--',
        type: item.folderName ? this.checkFolderName(item.folderName) : '--'
      };
    });
    this.exportdata = result;
    console.log("Export data",this.exportdata);
    this._commonService.setLoader(false);

    this.createTable(result);
  }

  checkFolderName(folderName){
    let newFolder;
    if(folderName == 'labs_and_draws'){
      newFolder = "Labs and Order"
    }
    else if(folderName == 'medications'){
      newFolder = "Medications/Treatment"
    }
    else if(folderName == 'misc'){
      newFolder = "Miscellaneous"
    }
    else if(folderName == 'physician_notifications'){
      newFolder = "Physician Notifications"
    }
    else if(folderName == 'therapy'){
      newFolder = "Therapy"
    }
    else {
      newFolder = "--"
    }
    return newFolder
    
  }

}