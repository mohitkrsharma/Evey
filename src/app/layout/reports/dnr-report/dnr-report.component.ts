import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { CommonService } from './../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-dnr-report',
  templateUrl: './dnr-report.component.html',
  styleUrls: ['./dnr-report.component.scss'],
})
export class DNRReportComponent implements OnInit, AfterViewInit {

  private subscription: Subscription;
  @ViewChild('dnrReport', {static: true}) dnrReport: TemplateRef<any>;
  dnrreport: any = {
    date: new Date(),
  };
  reportForm: FormGroup;
  reportData;
  maxDate = new Date();
  @ViewChild('dateRangePicker', {static: false}) dateRangePicker;
  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private router: Router,
    private _aes256Service: Aes256Service,
    public commonService: CommonService,
    public _dialogRef: MatDialogRef<DNRReportComponent>,
    private cdr: ChangeDetectorRef,
  ) {}



  async ngOnInit() {
    this.reportForm = this.fb.group({
      organization: ['', [Validators.required]],
      facility: ['', [Validators.required]],
      floor: [''],
      sector: [''],
      user: ['', [Validators.required]],
      resident: [''],
      care: [''],
      outcome: [''],
      schedule: [''],
      residentStatus: ['', [Validators.required]],
      residentLevel: ['', [Validators.required]],
      include: ['', [Validators.required]],
      searchCtrl: '',
      facSearch: '',
      floSearch: '',
      secSearch: '',
      usrSearch: '',
      resSearch: '',
      carSearch: '',
      rSearch: '',
      cSearch: '',
      inSearch: '',
      oSearch: '',
      sSearch: '',
    });
    this.subscription = this.commonService.contentdata.subscribe(
      async (contentVal: any) => {
        if (contentVal.org && contentVal.fac) {
          this.reportForm.controls.organization.patchValue([contentVal.org]);;
          this.reportForm.controls.facility.patchValue([contentVal.fac]);
        }
      }
    );
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
 
  async DNRSubmit(p) {
    let date = moment(this.dnrreport.date).subtract(6, 'd').set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).valueOf();
    const data = {
      orgId: this.reportForm.controls.organization.value[0],
      facId: this.reportForm.controls.facility.value[0],
      date: date
    };
    this.reportData = data;
    sessionStorage.setItem('dnrReportData', this._aes256Service.encFnWithsalt(this.reportData));
    this.commonService.setDnrQueryData(JSON.stringify(this.reportData));
    this._dialogRef.close();
    this.router.navigate(['/reports/viewdnrreport']);
  }
  cancelForm() {
    this._dialogRef.close();
  }

  checkAllwoNum(key) {
    const result = this.commonService.allwoNum(key);
    return result;
  }
}
