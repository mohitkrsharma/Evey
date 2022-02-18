import { Component, OnInit, ViewChild, ElementRef,TemplateRef } from '@angular/core';
import { MatTableDataSource, MatSort, PageEvent, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig  } from '@angular/material';
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
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-list',
  templateUrl: './types.component.html',
  styleUrls: ['./types.component.scss']
})
export class TypesComponent implements OnInit {

  addInput: any = {   
    name: '',
  };
  public btnAction: Function;
  public filtershow = false;
  // MATPAGINATOR
  pageIndex: number;
  pageSize: number;
  length: number;
  checked;
  deleteArr = [];
  deleteItem = [];
  addedNfcList = [];
  data;
  arr = [];
  dataSource;
  count;
  displayedColumns = [];
  organization; facility;
  dialogRefs = null;
  isEdit = false;
  isRemove:boolean= false;
  // ddp list variable
  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  search: any;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  pagiPayload: PagiElement = {
    moduleName:'typesList',
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: ''
  };
  showNew = true
  actualDataCount;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('searchInput', {static: true}) searchInput!: ElementRef;
  @ViewChild('addNfc', {static: true}) addNfc: TemplateRef<any>;

  columnNames = [
    {
      id: 'name',
      value: 'Name',
      sort: true
    },    
  ];
  private subscription: Subscription;

  constructor(
    private router        : Router,
    private apiService    : ApiService,
    private excelService  : ExcelService,
    private toastr        : ToastrService,
    private _aes256Service: Aes256Service,
    private fb            : FormBuilder,
    public _commonService : CommonService,
    public dialog         : MatDialog,

  ) { }

  public show = false;
  nfcForm: FormGroup;
  public temparray: any = [];
  nfcEdit: any = {
	name : '',
	_id  : '',
  };

  async ngOnInit() {
    if(!this._commonService.checkAllPrivilege('NFC')){
      this.router.navigate(['/']);
    }
    this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.typesList) {
        this.pagiPayload.previousPageIndex = pageListing.typesList.previousPageIndex;
        this.pagiPayload.pageIndex         = pageListing.typesList.pageIndex;
        this.pagiPayload.pageSize          = pageListing.typesList.pageSize;
        this.pagiPayload.length            = pageListing.typesList.length;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ typesList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ typesList: this.pagiPayload }));
    }

    this._commonService.payloadSetup('typesList',this.pagiPayload)
    this.search = this.searchInput.nativeElement.value;
    fromEvent(this.searchInput.nativeElement, 'keyup')
      .pipe(
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
    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this._commonService.setLoader(true);        
        // Pagination
        this.getServerData(this.pagiPayload);
      }
    });    
  }


  // Create mat table
  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
  }

  // Function to delete single nfc
  deleteNfcFn(id) {
    this.deleteArr = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
        panelClass:'DeleteAlert',
      data: { 'title': 'nfc', 'id': id, 'API': 'assets/delete_type' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.checked = false;
        this.getServerData(this.pagiPayload);
      }
    });
  }


  // function  to delete multiple NFCs
  delete() {
    if (this.deleteArr.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select type to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'nfc', 'id': this.deleteArr, 'API': 'assets/delete_type' }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result['type'] == 'success') {
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
      this.getServerData(this.pagiPayload);
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').blur();
      });
    }
  }

  // Select all Checkboxes in a list
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

  // Select single checkbox one by one
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

  // Search element in a list
  onChange(item, event) {
    this.search = item;
    setTimeout(() => {
      this.getServerData(this.pagiPayload);
    }, 2000);
  }


  // Fetch list of Types added
  public async getTypeDataFunction() {
    const action = {
      type   : 'GET',
      target : 'assets/list_types'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    this.count = result['count'];
    if (result['status']) {
      const dataNFC = result['data'];
      if (dataNFC && dataNFC.length > 0) {
        this.actualDataCount = dataNFC.length;
      }
      result = result['data'].map(item => {        
        return {
          ...item,
          name: item.displayName ? item.displayName : '-'
        };
      });
      this.data = result;
      this.createTable(result);
      this._commonService.setLoader(false);
      this.deleteArr = [];
    }
  }

  // Sorting in NFC listing
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
    sessionStorage.setItem('pageListing', JSON.stringify({ typesList: this.pagiPayload }));
    this.getTypeDataFunction();
  }

  // Set payload for pagination,searching,sorting
  public async getServerData(event?: PageEvent) {
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex         = event.pageIndex;
    this.pagiPayload.pageSize          = event.pageSize;
    this.pagiPayload.length            = event.length;
    this.pagiPayload.search            = this.search;
    
    sessionStorage.setItem('pageListing', JSON.stringify({ typesList: this.pagiPayload }));
    this._commonService.updatePayload(event,'typesList',this.pagiPayload)
    this.getTypeDataFunction();
  }

  addNew() {
    this.showNew=true
    if(this.isEdit == false){
      this.nfcEdit._id      = '';
      this.addInput.name = '';
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '700px';
    dialogConfig.panelClass = 'shiftpopup';
    //dialogConfig.disableClose = true;
    dialogConfig.closeOnNavigation = true;
    this.dialogRefs = this.dialog.open(this.addNfc, dialogConfig);
  }

   addOption(addInput) {
    
    if(!this.showNew){
      this.showNew=true
      return
    }else{
      if (addInput.name === '' || addInput.name === undefined) {
        this.toastr.error('Please enter type name.');
      } 
      else {       
        if (this.addedNfcList === undefined || this.addedNfcList.length < 1) {
          this.addedNfcList = [
            {
              'name'   : addInput.name,
            }
          ];
        } else {        
            this.addedNfcList.push({
              'name'   : addInput.name,
            });
        }      
        this.addInput['name']   = '';
      }
    }


  }
  removeOption(key) {

    if(key!=undefined && key!=null){
      this.addedNfcList.splice(key, 1);    
    }else{
      this.showNew=false
    }

  }

   closeQuestionDialog(): void {
    this.addedNfcList = [];
    this.dialogRefs.close();
    this.isEdit = false;
    this.isRemove=false;
  }

  // function to accept only alpha numeric character
  checkAlphanum(key) {
    const result = this._commonService.allwoAlphaAndNum(key);
    return result;
  }
  checkAlphanumSpace(key) {
    const result = this._commonService.allwoAlphaAndNumAndSpace(key);
    return result;
  }

  convertCamelCaseToReadable(string){
    let newString = string.replace(/([a-z])([A-Z])/g, '$1 $2');
    return newString.split(' ').map(function(wrd){
      return wrd.charAt(0).toUpperCase() + wrd.substr(1).toLowerCase();
    }).join(' ')
  }
   async saveQuestionDialog(report, isValid) {

     let typeArray = [];
     for(let i=0; i < this.addedNfcList.length; i++){
        if(this.addedNfcList[i].name !== ''){
          let newVar = {
            name : this.addedNfcList[i].name,
            displayName : this.convertCamelCaseToReadable(this.addedNfcList[i].name),
          }
          typeArray.push(newVar);          
        }
      }  
      
     this._commonService.setLoader(true);
     let  checkID:any ;
     let  data;
      if(this.nfcEdit._id === '' || this.nfcEdit._id === undefined){
        /* check if no type added */
      if(!typeArray.length && !this.addInput.name){
         this._commonService.setLoader(false);
         this.toastr.error('Please add Type.');
         return;
      } 
      if(this.addInput.name){
        let newVar2 = {
            name : this.addInput.name,
            displayName : this.convertCamelCaseToReadable(this.addInput.name),
          }
        typeArray.push(newVar2);   
      }
      checkID = {
        	'ntags': typeArray,
      	};  
		data      = checkID;
		let checkData = [];
		let iterator  = data.ntags;
		iterator.forEach(function(item) {
      checkData.push(item)
			// Object.keys(item).forEach(function(key) {
      //   console.log(key)
			// 	checkData.push(item[key]);
			// });
		});

		let duplicate = checkData.filter((s => v => s.has(v) || !s.add(v))(new Set));
		let checkDuplicate = duplicate.filter(x => x).join(', ');
		if(checkDuplicate.length > 0){
			this._commonService.setLoader(false);
			this.toastr.error('Please enter unique types.');
			return false;
		}
      }
      else{
      	if(this.addInput.name === '' || this.addInput.name === undefined){
			this._commonService.setLoader(false);
			this.toastr.error('Please enter asset type.');
			return false;
		}
        data = {
         	'_id'   : this.nfcEdit._id,
         	'name'  : this.addInput.name,
          'displayName' : this.convertCamelCaseToReadable(this.addInput.name)
      	}; 
      }

       const action = {
        type: 'POST',
        target: 'assets/add_type'
      };
      const payload = data;
      const result = await this.apiService.apiFn(action, payload);

      if (result['status']) {
        this.addedNfcList = [];
        this.toastr.success(result['message']);
        this.closeQuestionDialog();
        this.isRemove=false;
        this.getServerData(this.pagiPayload);
        this._commonService.setLoader(true);
      } else {
        this._commonService.setLoader(false);
        this.toastr.error(result['message']);
      }
  }

   async editRow(id) {
     this.showNew=true
    this.isEdit   = true;
    const action  = { type: 'POST', target: 'assets/view_type' };
    const payload = { assetTypeId: id };
    let result    = await this.apiService.apiFn(action, payload);

    this.nfcEdit        = result['data'];
    this.nfcEdit.name   = result['data'].name;
    this.nfcEdit._id    = result['data']._id;

    this.addInput["name"] = result['data'].name
    this._commonService.setLoader(false);
    this.addNew();
  }

}

export interface Element {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export interface PagiElement {
  moduleName?:string,
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
}

