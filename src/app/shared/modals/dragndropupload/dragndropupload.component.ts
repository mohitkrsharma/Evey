import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-dragndrop-upload',
  templateUrl: './dragndropupload.component.html',
  styleUrls: ['./dragndropupload.component.scss'],
})
export class DragNDropUploadComponent implements OnInit {

  private subscription: Subscription;
  files: any[] = [];
  facility;

  dialogConfig = new MatDialogConfig();
  constructor(
    private toastr: ToastrService,
    private _apiService: ApiService,
    private _commonService: CommonService,
    public dialog: MatDialog,
    public _dialogRef: MatDialogRef<DragNDropUploadComponent>
  ) {
   
  }

  /**
   * on file drop handler
   */
  onFileDropped(event) {
    console.log("Event----",event);
    this.prepareFilesList(event);
  }

  getExt(filename)
  {
    var ext = filename.split('.').pop();
    if(ext == filename) return "";
    return ext;
  }

  /**
   * handle file from browsing
   */
  fileBrowseHandler(files) {
    this.prepareFilesList(files);
  }

  /**
   * Delete file from files list
   * @param index (File index)
   */
  deleteFile(index: number) {
    this.files.splice(index, 1);
  }

  /**
   * Simulate the upload process
   */
  uploadFilesSimulator(index: number) {
    setTimeout(() => {
      if (index === this.files.length) {
        return;
      } else {
        const progressInterval = setInterval(() => {
          if (this.files[index].progress === 100) {
            clearInterval(progressInterval);
            this.uploadFilesSimulator(index + 1);
          } else {
            this.files[index].progress += 5;
          }
        }, 200);
      }
    }, 1000);
  }

  /**
   * Convert Files list to normal array list
   * @param files (Files List)
   */
  prepareFilesList(files: Array<any>) {
    for (const item of files) {
      item.progress = 0;
      const _fileExt = this.getExt(item.name);
      if(_fileExt == 'pdf'){
        this.files.push(item);
        this.uploadFilesSimulator(0);
      }
      else {
        this.toastr.error("Please upload pdf only");
      }
    }
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes, decimals) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  ngOnInit() {
  }

  cancel() {
    this._dialogRef.close();
  }

  getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  async done(){
    this._commonService.setLoader(true);
    console.log("Files---->", this.files);
    const auth = JSON.parse(sessionStorage.getItem('authReducer'));
    this.facility = auth['fac_id'];
    console.log(sessionStorage.getItem('authReducer'));
    if(this.files){
      this.files.forEach(async f => {
        let base64;
        await this.getBase64(f).then((b: any)=> {
          base64 = (b ? b.split('data:application/pdf;base64,'): null);
        });
        console.log("Base 64 file",base64);
        const action = { type: 'POST', target: 'residents/upload_order_file' };
        const payload = { 
          mimeType: ".pdf",
          fac_id: this.facility,
          fileName: this.files[0]['name'],
          base64: base64[1],
          tagId: '',
        };
        console.log("payload---->",payload);
        let result : any = await this._apiService.apiFn(action, payload);

        console.log("Result---->",result);
        this._dialogRef.close({ result });
        this._commonService.setLoader(false);
        if(result && result.status){
          this.toastr.success("File Uploaded Successfully");
        }
        else {
          this.toastr.error(result.message);
        }
      });
    }
  }
}