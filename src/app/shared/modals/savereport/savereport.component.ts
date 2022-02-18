import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroupDirective, NgForm, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from './../../../shared/services/api/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AmazingTimePickerService } from 'amazing-time-picker';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

@Component({
  selector: 'app-savereport',
  templateUrl: './savereport.component.html',
  styleUrls: ['./savereport.component.scss']
})
export class SavereportComponent implements OnInit {

  constructor(
    private router: Router,
    private apiService: ApiService,
    private atp: AmazingTimePickerService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private _aes256Service: Aes256Service,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<SavereportComponent>
  ) { }

  reportForm: FormGroup;
  report: any = {
    name: ''
  }

  ngOnInit() {
    this.reportForm = this.fb.group({ // Login form
      name: ['', [Validators.required]],
    })
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  async saveReport(valid) {
    if(valid){
      this.data['report']['name'] = this.report['name']
      let action = {
        type: 'POST',
        target: 'reports/save'
      }
      let payload = this.data;
      var result = await this.apiService.apiFn(action, payload);
      if (result['status']) {
        this.dialogRef.close();
        this.router.navigate(['/reports/view', this._aes256Service.encFnWithsalt(result['data']['_id']) ]);
      }
  
    }

  }




}
