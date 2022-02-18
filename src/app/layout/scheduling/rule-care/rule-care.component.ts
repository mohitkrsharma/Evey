import { Component, OnInit, TemplateRef, ViewChild, ElementRef} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { MatTableDataSource, MatSort, PageEvent, MatPaginator } from '@angular/material';
import { CommonService } from './../../../shared/services/common.service';
import { Subscription } from 'rxjs';
import { ApiService } from './../../../shared/services/api/api.service';
import { MatOption } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { AlertComponent } from '../../../shared/modals/alert/alert.component';
import * as asyncfunc from 'async';
import { Router } from '@angular/router';
@Component({
  selector: 'app-rule-care',
  templateUrl: './rule-care.component.html',
  styleUrls: ['./rule-care.component.scss']
})
export class RuleCareComponent implements OnInit {
  subscription: Subscription;
  organization; facility;
  floorData; floorDropdown; sectorDropdown; userslist; carelist;
  zoneDropdown;
  shiftArr; data; dataSource;
  dialogRefs = null;
  displayedColumns = [];
  viewData = [];
  search: String = '';
  scheduleRuleForm: FormGroup;
  count = 0; actualDataCount = 0;
  allsector = false; allfloor = false; alluser = false; allCares = false; allzone = false;
  editId = null;
  @ViewChild('deleteButton', {static: true}) private deleteButton: ElementRef;
  @ViewChild('ruleCareDialog', {static: true}) ruleCareDialog: TemplateRef<any>;
  @ViewChild('ruleCareViewDialog', {static: true}) ruleCareViewDialog: TemplateRef<any>;
  @ViewChild('selectedFloor', {static: true}) private selectedFloor: MatOption;
  @ViewChild('selectedZone', {static: true}) private selectedZone: MatOption;
  @ViewChild('selectedSector', {static: true}) private selectedSector: MatOption;
  @ViewChild('selectedUser', {static: true}) private selectedUser: MatOption;
  @ViewChild('selectedCare', {static: true}) private selectedCare: MatOption;
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  sortActive = 'name';
  sortDirection: 'asc' | 'desc' | '';
  checked = false;
  deleteArr = [];

  scheduleRule: any = {
    rule_name: '',
    floor: '',
    sector: '',
    zone: '',
    user: '',
    care: ''
  };

  columnNames = [
    {
      id: 'rule_name',
      value: 'Rule Name',
      sort: true
    },
    {
      id: 'floor_data',
      value: 'Floor',
      sort: false
    },
    {
      id: 'sector_data',
      value: 'Sector',
      sort: false
    },
    {
      id: 'zone_data',
      value: 'Zone',
      sort: false
    },
    {
      id: 'care_data',
      value: 'Care',
      sort: false
    },
    {
      id: 'user_data',
      value: 'Performer',
      sort: false
    }
  ];

  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: ''
  };
  floSearch='';
  secSearch='';
  cSearch='';
  perSearch='';
  zSearch='';

  constructor(
    private _router: Router,
    private dialog: MatDialog,
    private apiService: ApiService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    public _commonService: CommonService
  ) { }

  async ngOnInit() {
    // if(!this._commonService.checkPrivilegeModule('rule_care')){
    //   this._router.navigate(['/']);
    // }
   this._commonService.setLoader(true);
    if (sessionStorage.getItem('pageListing')) {
      const pageListing = JSON.parse(sessionStorage.getItem('pageListing'));
      if (pageListing.srList) {

        this.pagiPayload.previousPageIndex = pageListing.srList.previousPageIndex;
        this.pagiPayload.pageIndex = pageListing.srList.pageIndex;
        this.pagiPayload.pageSize = pageListing.srList.pageSize;
        this.pagiPayload.length = pageListing.srList.length;
      } else {
        sessionStorage.setItem('pageListing', JSON.stringify({ srList: this.pagiPayload }));
      }
    } else {
      sessionStorage.setItem('pageListing', JSON.stringify({ srList: this.pagiPayload }));
    }

    this.displayedColumns = this.displayedColumns.concat(['checkbox']);
    this.displayedColumns = this.displayedColumns.concat(this.columnNames.map(x => x.id));
    this.displayedColumns = this.displayedColumns.concat(['actions']);

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

    this.subscription = this._commonService.contentdata.subscribe(async (contentVal: any) => {
      if (contentVal.org && contentVal.fac) {
        this.pagiPayload['org_id'] = this.organization = contentVal.org;
        this.pagiPayload['fac_id'] = this.facility = contentVal.fac;
        await this.allFloors();
        await this.getAllcares();
        await this.getAllusers();
        await this.getServerData(this.pagiPayload);
      }
    });
    this.shiftArr = this._commonService.shiftTime();
    this.scheduleRuleForm = this.fb.group({ // Login form
      organization: ['', [Validators.required]],
      facility: ['', [Validators.required]],
      rule_name: ['', [Validators.required]],
      floor: ['', [Validators.required]],
      sector: ['', [Validators.required]],
      zone: ['', [Validators.required]],
      //user: ['', [Validators.required]],
      user: '',
      care: ['', [Validators.required]],
      floSearch:'',
      secSearch:'',
      cSearch:'',
      perSearch:'',
      zSearch:'',
    });

  }

  getRuleText(text) {
    return text.substring(0, 45) + '...';
  }

  addRule() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '600px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    this.dialogRefs = this.dialog.open(this.ruleCareDialog, dialogConfig);
  }

  closeRuleDialog(): void {
    this.dialogRefs.close();
    this.scheduleRule =  {
      rule_name: '',
      floor: '',
      sector: '',
      zone: '',
      user: '',
      care: ''
    };
    this.editId = null;
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
    this.pagiPayload['sort'] = sort;
    sessionStorage.setItem('pageListing', JSON.stringify({ srList: this.pagiPayload }));
    this.getScheduleRuleDataFunction();
  }

  public async getServerData(event?: PageEvent) {
    this._commonService.setLoader(true);
    this.pagiPayload.previousPageIndex = event.previousPageIndex;
    this.pagiPayload.pageIndex = event.pageIndex;
    this.pagiPayload.pageSize = event.pageSize;
    this.pagiPayload.length = event.length;
    this.pagiPayload.search = this.search;
    sessionStorage.setItem('pageListing', JSON.stringify({ srList: this.pagiPayload }));
    this.getScheduleRuleDataFunction();
  }

  public async getScheduleRuleDataFunction() {
    const action = {
      type: 'GET',
      target: 'schedule/get_rules'
    };
    const payload = this.pagiPayload;
    let result = await this.apiService.apiFn(action, payload);
    if (result['status']) {
      if ((!result['data']['_rules'] || result['data']['_rules'].length === 0) && this.pagiPayload.pageIndex > 0) {
        this.paginator.previousPage();
      } else {
        this.count = result['data']['_count'];
        result = result['data']['_rules'].map(item => {
          const sectors = [];
          const floors = item['floors'].filter(function (entry) {
            if (entry.sector) {
              return entry.sector.filter(function (sect) {
                if (item.sector.indexOf(sect._id) > -1) {
                  sectors.push(sect.name);
                }
                return item.sector.indexOf(sect._id) > -1; }).length;
            } else {
              return false;
            }
          });

          return {
            ...item,
            // shiftype_data: this.shiftArr.filter(function (entry) { return entry.no === item.shiftype; })[0].name,
            floor_data: floors ? (floors.map(itm => itm.floor).toString()).replace(/,/g, ', ') : '--',
            sector_data: sectors.length ? (sectors.toString()).replace(/,/g, ', ') : '--',
            zone_data: item.zones ? (item['zones'].map(itm => itm.room).toString()).replace(/,/g, ', ') : '--',
            care_data: item.cares ? (item['cares'].map(itm => itm.name).toString()).replace(/,/g, ', ') : '--',
            user_data: item.users ? (item['users'].map(itm => itm.last_name + ' ' + itm.first_name ).toString()).replace(/,/g, ', ') : '--'
          };
        });

        this.data = result;
        if (this.data && this.data.length > 0) {
          this.actualDataCount = this.data.length;
        }
        this.createTable(result);
        this.checked = false;
        this.deleteArr = [];
        this._commonService.setLoader(false);
      }
    } else {
      this._commonService.setLoader(false);
    }

  }

  createTable(arr) {
    const tableArr: Element[] = arr;
    this.dataSource = new MatTableDataSource(tableArr);
  }

  viewRule(ruleId) {
    this.viewData =  this.data.filter(function (entry) { return entry._id === ruleId; })[0];
    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '600px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    this.dialogRefs = this.dialog.open(this.ruleCareViewDialog, dialogConfig);
  }

  async allFloors() {
    const action = {
      type: 'GET',
      target: 'floorsector/floorsectorByMultipleFac'
    };
    const payload = { facId: this.facility };
    const result = await this.apiService.apiFn(action, payload);
    this.floorDropdown = result['data'];
    this.floorData = result['data'];
    // tslint:disable-next-line: no-shadowed-variable
    const output = this.floorDropdown.reduce((output, item) => {
      const index = output.findIndex(o =>
        o.name === item.fac_id.fac_name);
      if (index >= 0) {
        output[index].floor.push({
          key: item._id,
          value: item.floor
        });
      } else {
        output.push({
          name: item.fac_id.fac_name,
          sector: item.sector,
          floor: [{
            key: item._id,
            value: item.floor
          }]
        });
      }
      return output;
    }, []);
    this.floorDropdown = output.sort(function (a, b) {
      const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  }

  selectAllFloor() {
    if (this.selectedFloor.selected) {
      this.scheduleRuleForm.controls.floor.patchValue([...this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat(), 0]);
      this.allSectors();
      this.allfloor = true;
    } else {
      this.allfloor = false;
      this.scheduleRuleForm.controls.floor.patchValue([]);
    }
    this.scheduleRuleForm.controls.sector.patchValue([]);
    this.scheduleRuleForm.controls.zone.patchValue([]);
  }

  selectFloor(id) {
    this.allfloor = false;
    this.allSectors();
    if (this.selectedFloor.selected) {
      this.selectedFloor.deselect();
      return false;
    }
    const data = this.floorDropdown.map(item => item.floor.map(itm => itm.key)).flat();
    if (this.scheduleRuleForm.controls.floor.value.length === data.length) {
      this.selectedFloor.select();
      this.allfloor = true;
    }
    this.scheduleRuleForm.controls.sector.patchValue([]);
    this.scheduleRuleForm.controls.zone.patchValue([]);

  }

  allSectors() {
    let data;
    if (this.floorData && this.scheduleRuleForm.controls.floor.value) {
      data = this.scheduleRuleForm.controls.floor.value.filter(function (item) {
        return item !== 0;
      });
      this.sectorDropdown = this.floorData.filter(
        _ => data.indexOf(_._id) > -1).map(
            ({ fac_id, ...item }) => (
              {
                ...item,
                sector: this.sectorSort(item.sector),
                // name: `${fac_id.fac_name} ( Floor:-${item.floor} )`
                name: `Floor:-${item.floor} `
                }
            )
        );
      this.sectorDropdown.sort(function (a, b) {
        const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
        if (nameA < nameB) { // sort string ascending
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0; // default return value (no sorting)
      });
    }
  }

  sectorSort(sortdata) {
    return sortdata.sort(function (a, b) {
      const nameA = a.name.toUpperCase(), nameB = b.name.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  }

  selectAllSector() {
    if (this.selectedSector.selected) {
      this.scheduleRuleForm.controls.sector.patchValue([...this.sectorDropdown.map(item => item.sector.map(itm => itm._id)).flat(), 0]);
      this.allsector = true;
    } else {
      this.allsector = false;
      this.scheduleRuleForm.controls.sector.patchValue([]);
    }
    this.getZone();
    this.scheduleRuleForm.controls.zone.patchValue([]);
  }

  selectSector(id) {
    this.allsector = false;
    if (this.selectedSector.selected) {
      this.selectedSector.deselect();
      return false;
    }
    const data = this.sectorDropdown.map(item => item.sector.map(itm => itm._id)).flat();
    if (this.scheduleRuleForm.controls.sector.value.length === data.length) {
      this.selectedSector.select();
      this.allsector = true;
    }
    this.getZone();
    this.scheduleRuleForm.controls.zone.patchValue([]);
  }

  async getZone() {
    this._commonService.setLoader(true);
    if (this.scheduleRuleForm.controls.sector.value.length) {
      const that = this;
      asyncfunc.parallel({
          getall: async function(callback) {
            const action = {
              type: 'GET',
              target: 'zones/ZonesByMultipleSec'
            };
            const payload = {
              fac_id: that.facility,
              org_id: that.organization,
              sectorId: that.scheduleRuleForm.controls.sector.value.filter(function (item) {
                return item !== 0;
              })
            };
            const result = await that.apiService.apiFn(action, payload);
            if ( result['status'] && result['data']) {
              callback(null, result['data']);
            } else {
              callback(null, []);
            }
          },
          existing: async function(callback) {
            const action = {
              type: 'GET',
              target: 'schedule/get_rules_existingZoneIds'
            };
            const payload = {
              fac_id: that.facility,
              org_id: that.organization
            };
            const result = await that.apiService.apiFn(action, payload);
            if ( result['status'] && result['data'] ) {
              callback(null, result['data']);
            } else {
              callback(null, []);
            }
          }
        },
        function(err, results) {
          if (!err && results) {
            const result1 = results['getall'].reduce(function (sectors, currentValue) {
                if (sectors.indexOf(currentValue.sector) === -1) {
                  sectors.push(currentValue.sector);
                }
                return sectors;
              }, []).map(sector => {
                const filtered = results['getall'].filter(_el => {
                  return _el.sector === sector;
                  // return (_el.sector === sector &&
                  //    (!results['existing'].length || (results['existing'].length && results['existing'].indexOf(_el._id) < 0 ) ));
                });
                const srch = filtered[0];
                return {
                  sector: sector,
                  name: `Floor-${srch.floor.floor} ,Sector-${srch.floor.sector.filter(el => el._id === sector)[0].name}`,
                  room: filtered.map(_el => ({ _id: _el['_id'], name: _el['room'] }))
                };
            });
            that.zoneDropdown = result1;
          } else {
            that.zoneDropdown = [];
          }
          that._commonService.setLoader(false);
        }
      );
    } else {
      this.zoneDropdown = [];
      this._commonService.setLoader(false);
    }
  }

  selectAllZone() {
    if (this.selectedZone.selected) {
      this.scheduleRuleForm.controls.zone.patchValue([...this.zoneDropdown.map(item => item.room.map(itm => itm._id)).flat(), 0]);
      this.allzone = true;
    } else {
      this.allzone = false;
      this.scheduleRuleForm.controls.zone.patchValue([]);
    }
  }

  selectZone(id) {
    this.allzone = false;
    if (this.selectedZone.selected) {
      this.selectedZone.deselect();
      return false;
    }
    const data = this.zoneDropdown.map(item => item.room.map(itm => itm._id)).flat();
    if (this.scheduleRuleForm.controls.zone.value.length === data.length) {
      this.selectedZone.select();
      this.allzone = true;
    }
  }

  async getAllusers() {
    const action = {
      type: 'GET',
      target: 'users/get_users_org_fac'
    };
    const payload = {
      'organization': [this.organization],
      'facility': [this.facility]
    };
    const result = await this.apiService.apiFn(action, payload);
    this.userslist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['last_name'] + ', ' + obj['first_name'];
      robj['key'] = obj._id;
      return robj;
    });
    this.userslist.sort(function (a, b) {
      const nameA = a.value.toUpperCase(), nameB = b.value.toUpperCase();
      if (nameA < nameB) { // sort string ascending
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });

  }

  selectAllusers() {
    if (this.selectedUser.selected) {
      this.scheduleRuleForm.controls.user.patchValue([...this.userslist.map(item => item.key), 0]);
      this.alluser = true;
    } else {
      this.selectedSector.deselect();
      this.scheduleRuleForm.controls.user.patchValue([]);
      this.alluser = false;
    }
  }

  selectUser(all, id) {
    this.alluser = false;
    if (this.selectedUser.selected) {
      this.selectedUser.deselect();
      return false;
    }
    if (this.scheduleRuleForm.controls.user.value.length === this.userslist.length) {
      this.alluser = true;
      this.selectedUser.select();
    }
  }

  async getAllcares() {
    const action = {
      type: 'GET',
      target: 'cares/getCares'
    };
    const payload = { 'type_not_in' : ['enter', 'exit', 'unassigned', 'fall', 'call_light', 'emergency', 'notes'] };
    const result = await this.apiService.apiFn(action, payload);
    this.carelist = await result['data'].map(function (obj) {
      const robj = {};
      robj['value'] = obj['name'];
      robj['key'] = obj._id;
      return robj;
    });
  }

  selectCare(id, value) {
    this.allCares = false;
    if (this.selectedCare.selected) {
      this.selectedCare.deselect();
      return false;
    }
    if (this.scheduleRuleForm.controls.care.value.length === this.carelist.length) {
      this.selectedCare.select();
      this.allCares = true;
    }
  }

  selectAllcares() {
    if (this.selectedCare.selected) {
      this.allCares = true;
      this.scheduleRuleForm.controls.care.patchValue([...this.carelist.map(item => item.key), 0]);
    } else {
      this.allCares = false;
      this.scheduleRuleForm.controls.care.patchValue([]);
    }
  }

  async saveRuleDialog(report, isValid) {
    this.scheduleRuleForm.controls.organization.patchValue(this.organization);
    this.scheduleRuleForm.controls.facility.patchValue(this.facility);
    // if (this.scheduleRuleForm.dirty && this.scheduleRuleForm.valid) {
    if ( this.scheduleRuleForm.valid) {
      this._commonService.setLoader(true);
      const data = {
        'id': this.editId,
        'org_id': this.scheduleRuleForm.controls.organization.value,
        'fac_id': this.scheduleRuleForm.controls.facility.value,
        'rule_name': this.scheduleRuleForm.controls.rule_name.value,
        // 'shiftype': this.scheduleRuleForm.controls.shiftype.value,
        'floor': this.scheduleRuleForm.controls.floor.value.filter(function (item) {
          return item !== 0;
        }),
        'sector': this.scheduleRuleForm.controls.sector.value.filter(function (item) {
          return item !== 0;
        }),
        'zone': this.scheduleRuleForm.controls.zone.value.filter(function (item) {
          return item !== 0;
        }),
        'user': this.scheduleRuleForm.controls.user.value =='' ? [] : this.scheduleRuleForm.controls.user.value.filter(function (item) {
          return item !== 0;
        }),
        'care': this.scheduleRuleForm.controls.care.value.filter(function (item) {
          return item !== 0;
        })
      };

      const action = {
        type: 'POST',
        target: 'schedule/add_rule'
      };
      const payload = data;
      const result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.toastr.success(result['message']);
        this.search = '';
        // this.editId = null;
        this.closeRuleDialog();
        this.getServerData(this.pagiPayload);
        // this.dialogRefs.close();
      } else {
        this._commonService.setLoader(false);
        this.toastr.error(result['message']);
      }
    } else {
      this.toastr.error('Please fill all fields');
      this._commonService.setLoader(false);
    }
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
        this.toastr.error('Please select floors/sectors to be deleted');
        this.checked = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass:'DeleteAlert',
        data: { 'title': 'Delete Rule', 'id': this.deleteArr, 'API': 'schedule/delete_rules' }
      });
      dialogRef.afterClosed().subscribe(result => {
        this.search = '';
        if (result && result['status']) {
          this.deleteArr = [];
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

  deleteRule(id) {
    this.deleteArr.push(id);
      const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '600px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass:'DeleteAlert',
      data: { 'title': 'Delete Rule', 'id': this.deleteArr, 'API': 'schedule/delete_rules' }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.deleteArr = [];
      if (result && result['status']) {
        this.toastr.success(result['message']);
        this.getServerData(this.pagiPayload);
        this.checked = false;
      }
    });
  }

  async editRule(ruleId) {
    this.viewData =  this.data.filter(function (entry) { return entry._id === ruleId; })[0];
    this.editId = this.viewData['_id'];

    const dialogConfig = new MatDialogConfig();
    dialogConfig.maxWidth = '600px';
    dialogConfig.panelClass = 'repeatDialog';
    //dialogConfig.disableClose = true;
    this.dialogRefs = this.dialog.open(this.ruleCareDialog, dialogConfig);

    this.scheduleRuleForm.controls.floor.patchValue(this.viewData['floor']);
    this.scheduleRuleForm.controls.sector.patchValue(this.viewData['sector']);
    this.scheduleRuleForm.controls.user.patchValue(this.viewData['user']);
    this.scheduleRuleForm.controls.care.patchValue(this.viewData['care']);

    this.allSectors();
    await this.getZone();
    this.scheduleRule =  {
      rule_name: this.viewData['rule_name'],
      floor: this.viewData['floor'],
      sector: this.viewData['sector'],
      zone: this.viewData['zone'],
      // shiftype: this.viewData['shiftype'],
      user: this.viewData['user'],
      care: this.viewData['care'],
    };
    this.scheduleRuleForm.controls.zone.patchValue(this.viewData['zone']);
  }
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: String;
}
