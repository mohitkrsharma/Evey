import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-view-vitals-buttons',
  templateUrl: './view-vitals-buttons.component.html',
  styleUrls: ['./view-vitals-buttons.component.scss']
})
export class ViewVitalsButtonsComponent implements OnInit {
  vital: string = '';
  constructor(
    public dialogRef: MatDialogRef<ViewVitalsButtonsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.vital = this.data.vital;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDone() {
    this.dialogRef.close({ selectedVital: this.vital });
  }

  onVitalBtnClick(e) {    
    const carename = e.currentTarget.getAttribute("Carename");
    this.vital = carename;
  }

}
