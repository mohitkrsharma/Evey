import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from './../../../shared/services/api/api.service';

@Component({
  selector: 'app-restore',
  templateUrl: './restore.component.html',
  styleUrls: ['./restore.component.scss']
})
export class RestoreComponent implements OnInit {

   constructor(private _apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<RestoreComponent>
  ) { }

 ngOnInit() {
  }
  onNoClick(): void {
    this._dialogRef.close(['result']['status'] = false);
  }

  async restoreData() {
  if(this.data.API){
    const action = { type: 'DELETE', target: this.data.API };
    const payload = { id: this.data.id,restore_data: this.data.restore_data };
    const result = await this._apiService.apiFn(action, payload);
    this._dialogRef.close(result);
  }else{
    this._dialogRef.close(true);
  }
   
  }

}
