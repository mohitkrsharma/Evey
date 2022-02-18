import { Component,Input, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from './../../../shared/services/api/api.service';

@Component({
  selector: 'app-confirm-box',
  templateUrl: './confirm-box.component.html',
  styleUrls: ['./confirm-box.component.scss']
})
export class ConfirmComponent implements OnInit {
   successBtn:string='Yes';
   cancelBtn:string='No';
   title:string='Are you sure?';
  constructor(private _apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<ConfirmComponent>
  ) { }

  ngOnInit() {

   
    this.successBtn= (this.data.successBtn)?this.data.successBtn:this.successBtn;
    this.cancelBtn= (this.data.cancelBtn)?this.data.cancelBtn:this.cancelBtn;
    this.title= (this.data.title)?this.data.title:this.title;


  }
  onNoClick(): void {
    this._dialogRef.close(['result']['status'] = false);
  }

  async onYesClick() {
    this._dialogRef.close(['result']['status'] = true);   
  }

 

}


