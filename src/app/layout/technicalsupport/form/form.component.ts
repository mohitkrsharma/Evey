import { Component, OnInit, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from './../../../shared/services/api/api.service';
import { Router } from '@angular/router';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';

import { CommonService } from './../../../shared/services/common.service';
import { environment } from './../../../../environments/environment';
@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  selected = 'steak-0';
  
  public list_priority: any = [
    { label: 'High', value: 'High', icon: 'arrow_upward' },
    { label: 'Medium', value: 'Medium', icon: 'arrow_upward' },
    { label: 'Low', value: 'Low', icon: 'arrow_downward' }
  ];

  data = {
    priority: '',
    subject: '',
    message: '',
    files: []
  }
  uploader:FileUploader;
  hasBaseDropZoneOver:boolean;
  hasAnotherDropZoneOver:boolean;
  response:string;
  buttonDisabled: boolean=false;
  message: any="";

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private aes256Service: Aes256Service, 
    private router: Router,
    public _commonService: CommonService) { 
    
  }

  public fileOverBase(e:any):void {
    this.hasBaseDropZoneOver = e;
  }
 
  public fileOverAnother(e:any):void {
    this.hasAnotherDropZoneOver = e;
  }
  
  public onFileSelected(event: EventEmitter<File[]>) {
    const file: File = event[0];
  //  console.log(file);

  }

  ngOnInit() {
    if(!this._commonService.checkAllPrivilege('Technical Support')){
      this.router.navigate(['/']);
    }
    sessionStorage.removeItem("pageListing");
    this.data.priority = "Low";

    this.fileUploader();
    this.removeDir();
  }

  async send(f, data) {
    let valid = f.form.status;
    data.message = this.message.trim();
    data.subject = data.subject.trim();
    if (data.subject == "") {
      valid = "INVALID";
      if (this.toastr.currentlyActive === 0)
        this.toastr.error("Please enter subject")
      return;
    } else if (data.message == "") {
      valid = "INVALID";
   //   console.log("this.toastrthis.toastr",this.toastr)
     // if (this.toastr.previousToastMessage === "Please enter message" && this.toastr.currentlyActive === 0)
        this.toastr.error("Please enter message")
      return;
    }
    if (valid == "VALID") {
      this._commonService.setLoader(true);
      ///console.log("vaild")
      // return
      const action = { type: 'POST', target: 'users/support' };
      const payload = data;
      let result = await this.apiService.apiFn(action, payload);
      this._commonService.setLoader(false);
      //console.log("resulrrrrrr", result)
      this.router.navigate(['/technicalsupport']);
      if (result['status'] == true) {
        this.toastr.success(result['message'])
        setTimeout(() => {
            this.resetQueue();
        }, 1000);
        
        f.resetForm();
        this.message="";
        this.data.priority = "Low";
        this.data.files = [];
      } else {
        this.toastr.error(result['message'])
      }

    }
    else {
      if (this.toastr.currentlyActive === 0)
        this.toastr.error("Please enter details")
    }
  }


  resetQueue() {
    if (this.uploader.queue.length > 0) {
        this.uploader.queue = [];
    }
}


async fileUploader(productId = '') {
  let url = environment.config.api_url+'users/attachmentupload';
  const _headers:any = await this.apiService.setHeadersForFileUpload();  
 this.uploader = new FileUploader({
      url: url,
      method: 'POST',
      disableMultipart: false,
      headers: _headers,
      maxFileSize: 10*1024*1024, // 10 MB
      queueLimit : 5,
      allowedMimeType: [
      "application/msword",
      "application/pdf",
      "application/rss+xml",
      "application/vnd.google-earth.kml+xml",
      "application/vnd.google-earth.kmz",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.oasis.opendocument.presentation",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.sun.xml.calc",
      "application/vnd.sun.xml.writer",
      //"application/x-gzip","application/zip",
      "audio/basic",
      "audio/flac",
      "audio/mid",
      "audio/mp4",
      "audio/mp3",
      "audio/mpeg",
      "audio/ogg",
      "audio/x-aiff",
      "audio/x-wav",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/tiff",
      "image/x-ms-bmp",
      "text/calendar",
      "text/comma-separated-values",
      "text/csv",
      "text/css",
      "text/html",
      "text/plain",
      "text/x-vcard",
      "video/mp4",
      "video/mpeg",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo"
    ],
  });
  this.uploader.onBeforeUploadItem = (item) => {
      item.withCredentials = false;
  };
}


uploadQueue(next = null) {
  this.buttonDisabled=true;
  const files = this.uploader.queue;
  //console.log(">>",files.length)

  files.forEach(file => {
    if(file.progress==0){
      file.upload();
      file.onError = (response: string, status: number, headers: any) => {
          console.log(response, status);
      };
      file.onSuccess = (response: any, status: number, headers: any) => {
        const res = JSON.parse(response);
      file['newName']=res.data.data.location
       // console.log("response>>>>",response)
      //   let decResult = this.aes256Service.decFn(response);
      //  // const res = JSON.parse(response);
      //       console.log("decResult>>>>",decResult)
      //     //this.item.images.push(res.imagData);
     //let  decResult = this.aes256Service.decFn(response);
    // console.log("response>>>>",decResult)
      this.data.files.push({path:res.data.data.location})
          if (next) {
              next();
          }
      };
    }
      
  });
  if(files.length>5){
  this.toastr.error("Max 5 file allow to upload.");  
  }
  if (!files || (files && files.length === 0)) {
      if (next) {
          next();
      }
  }
  setTimeout(() => {
    this.buttonDisabled=false;
      //this.resetQueue();
  }, 200);
}


async removeFile(path){
  
    if (path!= undefined && path!="") {
     
      // return
      const action = { type: 'POST', target: 'users/attachmentremove' };
      const payload = {filepath:path};
      let result = await this.apiService.apiFn(action, payload);
      console.log("ee",result)
      if (result['status'] == true) {
        // delete this.uploader.queue[index];
       
        // this.uploader.queue = this.uploader.queue.filter(function (el) {
        //   return el != null;
        // });
        let index = this.data.files.findIndex(x => x.path === path);
       
        if(index>-1){
          this.data.files.splice(index,1)
        }
       // console.log("file>>>",path,this.data.files )
      } else {
        this.toastr.error(result['message'])
      }

    }
}

async removeDir(){
    const action = { type: 'POST', target: 'users/attachmentremove' };
    const payload = {filepath:"dir"};
    let result = await this.apiService.apiFn(action, payload);
}

removeTags(str) {  
  this.message= str.textValue;
}

fileExtention(filename){
  let fileType={
    "fa-file-word-o":[	"doc", "docx"],
    "fa-file-pdf-o":["pdf"],
    "fa-file-text-o":["txt"],
    "fa-file-excel-o":["xls", "xlsx"],
    "fa-file-powerpoint-o":["pps", "ppt", "pptx"],
    "fa-file-audio-o":["au" ,"snd", "flac","mid", "rmi","ogg","aif", "aifc", "aiff","wav","mp3"],
    "fa-file-image-o":["gif","jpeg", "jpg", "jpe","png","tiff", "tif","wbmp","bmp"],
   // "csv":['csv'],
    "fa-file-video-o":["mp4","mpeg", "mpg", "mpe","ogv","qt", "mov","avi"]
  }
  let fileExt= filename.substr(filename.lastIndexOf(".")+1, filename.length);

  for (const property in fileType) {
    if(fileType[property].indexOf(fileExt)>-1){
      return property
    }
  }
  return "fa-file-o";
}

}
