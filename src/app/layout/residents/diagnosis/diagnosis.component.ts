import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatDialog,
  MatPaginator,
  MatSort,
  MatTableDataSource,
} from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Aes256Service } from 'src/app/shared/services/aes-256/aes-256.service';
import { ApiService } from 'src/app/shared/services/api/api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import {
  debounceTime,
  distinctUntilChanged,
  tap,
  filter,
} from 'rxjs/operators';
import { AlertComponent } from 'src/app/shared/modals/alert/alert.component';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
@Component({
  selector: 'app-diagnosis',
  templateUrl: './diagnosis.component.html',
  styleUrls: ['./diagnosis.component.scss'],
})
export class DiagnosisComponent implements OnInit, OnChanges {
  private subscription: Subscription;

  pagiPayload: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
    organization: '',
    facility: '',
  };

  pagiPayloadAllergy: PagiElement = {
    length: 0,
    pageIndex: 0,
    pageSize: 10,
    previousPageIndex: 0,
    search: '',
    sort: { active: 'name', direction: 'asc' },
    organization: '',
    facility: '',
  };

  deleteArrDisease = [];
  deleteArrAllergy = [];
  checkedDisease;
  checkedAllergy;
  actualDataCountDisease;
  actualDataCountAllergy;
  isShow = true;

  search: any = '';
  searching = false;
  diseaseSearch = '';
  filteredDiseaseAllergy = [];

  // varible to hold disease list from parent to child
  @Input() diseaseList: any = {};
  // @Input() allergyList = []

  // search field form control to search and fetch record from server
  public bankServerSideCtrl: FormControl = new FormControl();
  public bankServerSideFilteringCtrl: FormControl = new FormControl();

  displayedColumnsDiseases = [];
  columnNamesDiseases = [
    {
      id: 'name',
      value: 'Disease Name',
      sort: false,
    },
    // {
    //   id: 'code',
    //   value: 'ICD-10 Code',
    //   sort: false,
    // },
  ];

  dataSourceDisease = new MatTableDataSource<any>([]);

  filteredDiseases = false;
  filteredAllergy = false;
  noDataDiseases = this.dataSourceDisease
    .connect()
    .pipe(map((data) => data.length === 0));

  displayedColumnsAllergy = [];

  columnNamesAllergy = [
    {
      id: 'name',
      value: 'Allergy Name',
      sort: false,
    },
    {
      id: 'code',
      value: 'ICD-10 Code',
      sort: false,
    },
  ];

  dataSourceAllergy = new MatTableDataSource<any>([]);
  noDataAllergy = this.dataSourceAllergy
    .connect()
    .pipe(map((data) => data.length === 0));

  showSelectOptionDisease = true;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  @ViewChild('matSelectDisease', { static: true }) matSelectDisease: any;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    public _commonService: CommonService,
    private _aes256Service: Aes256Service,
    public dialog: MatDialog,
    public commonService: CommonService,
    private changeDetectorRefs: ChangeDetectorRef
  ) {}

  ngOnInit() {
    //Searching
    // this.search = this.searchInput.nativeElement.value;

    this.bankServerSideFilteringCtrl.valueChanges
      .pipe(
        filter((search) => !!search), // it will only search for different field than previous searched
        debounceTime(1000),
        distinctUntilChanged(),
        tap((search) => {
          this.searching = true;
          this.diseaseSearch = search;
          console.log('---search field---', search);
          this.getDiseasesAndAllergy(search);
        })
      )
      .subscribe();

    // Disease columns and display columns
    this.displayedColumnsDiseases = this.displayedColumnsDiseases.concat([
      'checkbox',
    ]);
    this.displayedColumnsDiseases = this.displayedColumnsDiseases.concat(
      this.columnNamesDiseases.map((x) => x.id)
    );
    // this.displayedColumnsDiseases = this.displayedColumnsDiseases.concat([
    //   'active',
    // ]);
    this.displayedColumnsDiseases = this.displayedColumnsDiseases.concat([
      'code',
    ]);
    this.displayedColumnsDiseases = this.displayedColumnsDiseases.concat([
      'actions',
    ]);

    //Allergy columns and display columns
    this.displayedColumnsAllergy = this.displayedColumnsAllergy.concat([
      'checkbox',
    ]);
    this.displayedColumnsAllergy = this.displayedColumnsAllergy.concat(
      this.columnNamesAllergy.map((x) => x.id)
    );
    this.displayedColumnsAllergy = this.displayedColumnsAllergy.concat([
      'active',
    ]);
    this.displayedColumnsAllergy = this.displayedColumnsAllergy.concat([
      'actions',
    ]);

    //initially create blank table
    this.createTableForDisease([]);
    this.createTableForAllergy([]);
  }

  // While editing resident profile we need to pass diseases already added, ngonchanges will look for a diseasesList varible because initially it will be blank pnce data fetched it will trigger ngonchanges here and take the latest fetched diseasesList
  ngOnChanges(changes) {
    if (changes['diseaseList']) {
      if (
        this.diseaseList &&
        this.diseaseList != {} &&
        Object.keys(this.diseaseList).length > 0
      ) {
        let diseases =
          this.diseaseList.diseases && this.diseaseList.diseases.length
            ? this.diseaseList.diseases.map((e, i) => ({
                // srno: i + 1,
                ...e,
                name: {
                  name: e.name,
                  preCovid: e.preCovid ? e.preCovid : false,
                },
              }))
            : [];
        let allergies =
          this.diseaseList.allergies && this.diseaseList.allergies.length
            ? this.diseaseList.allergies.map((e, i) => ({
                // srno: i + 1,
                ...e,
                name: {
                  name: e.name,
                  preCovid: e.preCovid ? e.preCovid : false,
                },
              }))
            : [];

        if (diseases.length) {
          this.dataSourceDisease = new MatTableDataSource(diseases);
          this.noDataDiseases = this.dataSourceDisease
            .connect()
            .pipe(map((data) => data.length === 0));
        }
        if (allergies.length) {
          this.dataSourceAllergy = new MatTableDataSource(allergies);
          this.noDataAllergy = this.dataSourceAllergy
            .connect()
            .pipe(map((data) => data.length === 0));
        }
      }
    }
  }

  // fetch alll listing diseases and allergy
  async getDiseasesAndAllergy(searchTerm) {
    const action = {
      type: 'POST',
      target: 'residents/get_icd10_all_disease',
    };

    const payload = { searchTerm };

    const result = await this.apiService.apiFn(action, payload);
    this.searching = false;
    if (result && result['data']) {
      this.filteredDiseaseAllergy = result['data'].filter(
        (e) => !this.isAlreadyExists(e)
      );
    }
  }

  // select specific value from mat selection dropdown and push data to the its table
  async selectDiagnosis(event) {
    let obj = JSON.parse(JSON.stringify(event.value));

    obj.name = {
      name: obj.name,
      preCovid: obj.preCovid,
    };

    console.log('event', event.value);
    obj.active = true; // when adding new disease, allergy default it should be active

    // check if type of selected value is disease or allergy

    if (obj.type == 'disease') {
      // obj.srno = this.dataSourceDisease.data.length + 1;
      if (this.dataSourceDisease.data == undefined) {
        this.dataSourceDisease = new MatTableDataSource([obj]);
      } else {
        this.dataSourceDisease.data = [
          ...this.dataSourceDisease.data,
          ...[obj],
        ];
      }
      this.noDataDiseases = this.dataSourceDisease
        .connect()
        .pipe(map((data) => data.length === 0));
    } else if (obj.type == 'allergy') {
      // obj.srno = this.dataSourceAllergy.data.length + 1;
      if (this.dataSourceAllergy.data == undefined) {
        this.dataSourceAllergy = new MatTableDataSource([obj]);
      } else {
        this.dataSourceAllergy.data = [
          ...this.dataSourceAllergy.data,
          ...[obj],
        ];
      }
      this.noDataAllergy = this.dataSourceAllergy
        .connect()
        .pipe(map((data) => data.length === 0));
    }

    this.filteredDiseaseAllergy = this.filteredDiseaseAllergy.filter(
      (e) => e.code != obj.code
    );
    if (this.route) {
      if (this.route.params['_value']) {
        let residentId = this._aes256Service.decFnWithsalt(
          this.route.params['_value']['id']
        );

        let disease_id = this.dataSourceDisease['data'].map((e) => ({
          name: e.name.name,
          code: e.code,
          active: e.active ? e.active : false,
          preCovid: e.name.preCovid ? e.name.preCovid : false,
        }));
        let allergy_id = this.dataSourceAllergy['data'].map((e) => ({
          name: e.name.name,
          code: e.code,
          active: e.active ? e.active : false,
          preCovid: e.name.preCovid ? e.name.preCovid : false,
        }));

        const action = {
          type: 'POST',
          target: 'residents/add_resident_disease',
        };
        const payload = {
          resident_id: residentId,
          diseasesSelected: disease_id,
          allergySelected: allergy_id,
        };

        const result = await this.apiService.apiFn(action, payload);
        if (result) {
          this.toastr.success('Diagnosis added successfully');
        } else {
          this.toastr.error('Error while adding diagnosis');
        }
      }
    }
  }
  searchValue() {
    this.bankServerSideFilteringCtrl.setValue(this.diseaseSearch);
    this.showSelectOptionDisease = false;
  }
  async changeStatus(element, type) {
    console.log(type);
    const action = {
      type: 'POST',
      target: 'residents/resident_diagnosis_status',
    };
    const payload = {
      resident_id: this._aes256Service.decFnWithsalt(
        this.route.params['_value']['id']
      ),
      data: element,
      type: type,
    };
    this._commonService.setLoader(true);
    const result = await this.apiService.apiFn(action, payload);
    if (result && result['status'] == true) {
      this._commonService.setLoader(false);
      this.toastr.success(result['message']);
    }
  }
  // delete specific diseases
  async deleteDisease(element) {
    console.log('delete disease', element);
    let resident_id;

    this.deleteArrDisease = [];

    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'Disease' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      this.checkedDisease = false;
      if (result && result === true) {
        if (this.route.params['_value']['id']) {
          const action = {
            type: 'POST',
            target: 'residents/unlink_disease_to_resident',
          };
          const payload = {
            resident_id: this._aes256Service.decFnWithsalt(
              this.route.params['_value']['id']
            ),
            code: element.code,
          };

          const result = await this.apiService.apiFn(action, payload);
          if (result && result['status'] == true) {
            this.toastr.success(result['message']);

            this.dataSourceDisease.data.splice(
              this.dataSourceDisease.data.findIndex(
                (e) => e.code == element.code
              ),
              1
            );
            this.dataSourceDisease.data = this.dataSourceDisease.data.map(
              (e, i) => ({
                code: e.code,
                name: e.name,
              })
            );
            this.dataSourceDisease.paginator = this.paginator;
          }
        } else {
          this.dataSourceDisease.data.splice(
            this.dataSourceDisease.data.findIndex(
              (e) => e.code == element.code
            ),
            1
          );
          this.dataSourceDisease.data = this.dataSourceDisease.data.map(
            (e, i) => ({
              code: e.code,
              name: e.name,
            })
          );
          this.dataSourceDisease.paginator = this.paginator;
        }
      }
    });
  }

  // delete specific allergy
  deleteAllergy(element) {
    console.log('delete allergy', element);
    let resident_id;

    this.deleteArrAllergy = [];
    const dialogRef = this.dialog.open(AlertComponent, {
      width: '450px',
      panelClass: 'DeleteAlert',
      data: { title: 'Allergy' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      this.checkedDisease = false;
      if (result && result === true) {
        if (this.route.params['_value']['id']) {
          const action = {
            type: 'POST',
            target: 'residents/unlink_allergy_to_resident',
          };
          const payload = {
            resident_id: this._aes256Service.decFnWithsalt(
              this.route.params['_value']['id']
            ),
            code: element.code,
          };

          const result = await this.apiService.apiFn(action, payload);
          if (result && result['status'] == true) {
            this.toastr.success(result['message']);

            this.dataSourceAllergy.data.splice(
              this.dataSourceAllergy.data.findIndex(
                (e) => e.code == element.code
              ),
              1
            );
            this.dataSourceAllergy.data = JSON.parse(
              JSON.stringify(this.dataSourceAllergy.data)
            ).map((e, i) => ({
              code: e.code,
              name: e.name,
            }));
            this.dataSourceAllergy.paginator = this.paginator;
          }
        } else {
          this.dataSourceAllergy.data.splice(
            this.dataSourceAllergy.data.findIndex(
              (e) => e.code == element.code
            ),
            1
          );
          this.dataSourceAllergy.data = JSON.parse(
            JSON.stringify(this.dataSourceAllergy.data)
          ).map((e, i) => ({
            code: e.code,
            name: e.name,
          }));
          this.dataSourceAllergy.paginator = this.paginator;
        }
      }
    });

    //remove from disease datasource, add into search field

    //remove from allergy datasource, add into search field
  }

  // delete all diseases main title bar button event
  deleteAllDisease() {
    if (this.deleteArrDisease.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select disease to be deleted');
        this.checkedDisease = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'Disease' },
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        this.checkedDisease = false;
        if (result && result === true) {
          if (this.route.params['_value']['id']) {
            const action = {
              type: 'POST',
              target: 'residents/unlink_disease_to_resident',
            };
            const payload = {
              resident_id: this._aes256Service.decFnWithsalt(
                this.route.params['_value']['id']
              ),
              code: this.deleteArrDisease,
            };
            const result = await this.apiService.apiFn(action, payload);

            this.toastr.success(result['message']);
            if (result && result['status']) {
              this.deleteArrDisease.forEach((arr) => {
                this.dataSourceDisease.data.splice(
                  this.dataSourceDisease.data.findIndex((e) => e.code == arr),
                  1
                );
              });
              this.dataSourceDisease.data = this.dataSourceDisease.data.map(
                (e, i) => ({
                  code: e.code,
                  name: e.name,
                })
              );
              this.dataSourceDisease.paginator = this.paginator;
            }
            this.deleteArrDisease = [];
            this.dataSourceDisease.data.forEach((element) => {
              element.checked = false;
              this.checkedDisease = false;
            });
          } else {
            this.deleteArrDisease.forEach((arr) => {
              this.dataSourceDisease.data.splice(
                this.dataSourceDisease.data.findIndex((e) => e.code == arr),
                1
              );
            });
            this.dataSourceDisease.data = this.dataSourceDisease.data.map(
              (e, i) => ({
                code: e.code,
                name: e.name,
              })
            );
            this.dataSourceDisease.paginator = this.paginator;
            this.deleteArrDisease = [];
            this.dataSourceDisease.data.forEach((element) => {
              element.checked = false;
              this.checkedDisease = false;
            });
          }
        }
      });
    }
  }

  // delete all allergy main title bar button event
  deleteAllAllergy() {
    if (this.deleteArrAllergy.length === 0) {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please select allergy to be deleted');
        this.checkedAllergy = false;
      }
    } else {
      const dialogRef = this.dialog.open(AlertComponent, {
        width: '450px',
        panelClass: 'DeleteAlert',
        data: { title: 'Disease' },
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        this.checkedAllergy = false;
        if (result && result === true) {
          if (this.route.params['_value']['id']) {
            const action = {
              type: 'POST',
              target: 'residents/unlink_allergy_to_resident',
            };
            const payload = {
              resident_id: this._aes256Service.decFnWithsalt(
                this.route.params['_value']['id']
              ),
              code: this.deleteArrAllergy,
            };
            const result = await this.apiService.apiFn(action, payload);

            this.toastr.success(result['message']);
            if (result && result['status']) {
              this.deleteArrAllergy.forEach((arr) => {
                this.dataSourceAllergy.data.splice(
                  this.dataSourceAllergy.data.findIndex((e) => e.code == arr),
                  1
                );
              });
              this.dataSourceAllergy.data = this.dataSourceAllergy.data.map(
                (e, i) => ({
                  code: e.code,
                  name: e.name,
                })
              );
              this.dataSourceAllergy.paginator = this.paginator;
            }
            this.deleteArrAllergy = [];
            this.dataSourceAllergy.data.forEach((element) => {
              element.checked = false;
              this.checkedAllergy = false;
            });
          } else {
            this.deleteArrAllergy.forEach((arr) => {
              this.dataSourceAllergy.data.splice(
                this.dataSourceAllergy.data.findIndex((e) => e.code == arr),
                1
              );
            });
            this.dataSourceAllergy.data = this.dataSourceAllergy.data.map(
              (e, i) => ({
                code: e.code,
                name: e.name,
              })
            );
            this.dataSourceAllergy.paginator = this.paginator;

            this.deleteArrAllergy = [];
            this.dataSourceAllergy.data.forEach((element) => {
              element.checked = false;
              this.checkedAllergy = false;
            });
          }
        }
      });
    }
  }

  // particular disease selection event
  selectElementDisease(id, check) {
    if (check === true) {
      for (let i = 0; i < this.deleteArrDisease.length; i++) {
        if (this.deleteArrDisease[i] === id) {
          this.deleteArrDisease.splice(i, 1);
        }
      }
    } else if (check === undefined || check === false) {
      this.deleteArrDisease.push(id);
    }
    if (
      (this.deleteArrDisease && this.deleteArrDisease.length) <
      this.actualDataCountDisease
    ) {
      this.checkedDisease = false;
    } else if (
      (this.deleteArrDisease && this.deleteArrDisease.length) ===
      this.actualDataCountDisease
    ) {
      this.checkedDisease = true;
    }
  }

  // particular allergy selection event
  selectElementAllergy(id, check) {
    if (check === true) {
      for (let i = 0; i < this.deleteArrAllergy.length; i++) {
        if (this.deleteArrAllergy[i] === id) {
          this.deleteArrAllergy.splice(i, 1);
        }
      }
    } else if (check === undefined || check === false) {
      this.deleteArrAllergy.push(id);
    }
    if (
      (this.deleteArrAllergy && this.deleteArrAllergy.length) <
      this.actualDataCountAllergy
    ) {
      this.checkedAllergy = false;
    } else if (
      (this.deleteArrAllergy && this.deleteArrAllergy.length) ===
      this.actualDataCountAllergy
    ) {
      this.checkedAllergy = true;
    }
  }

  // all disease selection button
  selectAllDisease() {
    if (this.checkedDisease === true) {
      this.dataSourceDisease.data.forEach((element) => {
        element.checked = false;
        this.deleteArrDisease = [];
      });
    } else {
      this.dataSourceDisease.data.forEach((element) => {
        this.deleteArrDisease.push(element.code);
        element.checked = true;
      });
    }
  }

  // all allergy selection button event
  selectAllAllergy() {
    if (this.checkedAllergy === true) {
      this.dataSourceAllergy.data.forEach((element) => {
        element.checked = false;
        this.deleteArrAllergy = [];
      });
    } else {
      this.dataSourceAllergy.data.forEach((element) => {
        this.deleteArrAllergy.push(element.code);
        element.checked = true;
      });
    }
  }

  // diseases table create
  createTableForDisease(arr) {
    const tableArr: Element[] = arr;
    this.dataSourceDisease = new MatTableDataSource(tableArr);
  }

  // allergy table create
  createTableForAllergy(arr) {
    const tableArr: Element[] = arr;
    this.dataSourceAllergy = new MatTableDataSource(tableArr);
  }

  // to check if disease or allergy already exists or not
  isAlreadyExists(element) {
    let diseaseCheck = this.dataSourceDisease.data.findIndex(
      (e) => e.code == element.code
    );
    let allergyCheck = this.dataSourceAllergy.data.findIndex(
      (e) => e.code == element.code
    );

    if (diseaseCheck >= 0 || allergyCheck >= 0) {
      return true;
    } else {
      return false;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceDisease.filter = filterValue.trim().toLowerCase();
    this.dataSourceAllergy.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceDisease.filteredData.length == 0) {
      this.filteredDiseases = false;
    }

    if (this.dataSourceAllergy.filteredData.length == 0) {
      this.filteredAllergy = false;
    }
    console.log(
      '----datasource disease----',
      this.dataSourceDisease,
      this.dataSourceDisease.data,
      this.filteredDiseases,
      this.filteredAllergy
    );
  }

  openselectDisease(e) {
    this.matSelectDisease.open();
    this.bankServerSideFilteringCtrl.setValue(this.diseaseSearch);
    this.showSelectOptionDisease = false;
  }
}

export interface PagiElement {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
  search: '';
  sort: Object;
  organization: '';
  facility: '';
}
