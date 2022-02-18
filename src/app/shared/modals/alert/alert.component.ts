import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiService } from './../../../shared/services/api/api.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {
  isUnlinkResident = false;
  constructor(
    private _apiService: ApiService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public _dialogRef: MatDialogRef<AlertComponent>
  ) {
    if (
      (data.title == 'zone' && data.residents != null) ||
      data.isUnlinkResident
    ) {
      this.isUnlinkResident = true;
    } else {
      this.isUnlinkResident = false;
    }
  }

  ngOnInit() {}

  onNoClick(): void {
    this._dialogRef.close((['result']['status'] = false));
  }

  async deleteData() {
    console.log(this.data)
    if (this.data.API) {
      const action = { type: 'DELETE', target: this.data.API };
      let payload
      if(this.data.API == "location/delete"){
        payload = { locationIds: this.data.id };
      } else if(this.data.API == "device/delete"){
        payload = { deviceIds: this.data.deviceIds }
      }
      else{
        payload = { id: this.data.id };
      }

      console.log(payload)
      const result = await this._apiService.apiFn(action, payload);
      console.log(result)
      this._dialogRef.close(result);
    } else if (this.data.unlinkAPI) {
      const action = { type: 'POST', target: this.data.unlinkAPI };
      const payload = this.data.item;
      const result = await this._apiService.apiFn(action, payload);

      this._dialogRef.close(result);
    } else {
      this._dialogRef.close(true);
    }
  }

  async suspendData() {
    const action = { type: 'POST', target: 'users/suspend_user' };
    const payload = {
      active: this.data.id.active,
      userId: this.data.id.userId,
    };
    const result = await this._apiService.apiFn(action, payload);
    this._dialogRef.close(result);
  }
}
