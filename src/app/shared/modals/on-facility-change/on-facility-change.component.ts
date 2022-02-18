import { Component, OnInit,Inject } from '@angular/core';
import { FormComponent } from 'src/app/layout/residents/form/form.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';




@Component({
  selector: 'app-on-facility-change',
  templateUrl: './on-facility-change.component.html',
  styleUrls: ['./on-facility-change.component.scss']
})
export class OnFacilityChangeComponent implements OnInit {
  staSearch='';
  status;
  statusData;
  constructor(
    public dialogRef: MatDialogRef<FormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.statusData = data.filter(item=>{ return item.isOutOfFacility === true})
   }
    

  ngOnInit() {
  }

  changeStatus(event){

  }
  cancelStatusFacility() {
    this.dialogRef.close({ status: false });
  }
 setStatus() {

    this.dialogRef.close({
      status: true,
      updated_status:this.status,
    });
  }
     
    

}
