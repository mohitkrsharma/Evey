import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormComponent } from 'src/app/layout/residents/form/form.component';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-status-transferred',
  templateUrl: './status-transferred.component.html',
  styleUrls: ['./status-transferred.component.scss'],
})
export class StatusTransferredComponent implements OnInit {
  facilityList = [];
  selectedOrg;
  selectedfac;
  facSearch = '';
  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<FormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.facilityList = data.faclist.filter(e => String(e._id) != String(data.currentFacId))
    this.selectedOrg = data.orgId
  }

  ngOnInit() {
    // this.facilityList;
  }
  cancelStatusFacility() {
    this.dialogRef.close({ status: false });
  }
  setStatusFacility() {
    if (this.selectedfac) {
      const selectedData = {
        current_org: this.selectedOrg,
        current_fac: this.selectedfac,
      }
      this.dialogRef.close({
        status: true,
        updated_data: [selectedData],
      });
    } else {
      this.toastr.error('Please select any facility');
    }
  }

}
