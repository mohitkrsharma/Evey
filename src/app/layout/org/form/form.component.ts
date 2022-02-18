import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormBuilder, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { MapsAPILoader } from '@agm/core';
import { } from 'googlemaps';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from '../../../shared/services/common.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { FileUploader } from 'ng2-file-upload';
import { environment } from './../../../../environments/environment';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {
  organizationForm: FormGroup;
  dataSource;

  public latitude: number;
  public longitude: number;
  public searchControl: FormControl;
  public zoom: number;

  public submit_btn: boolean;
  public iconUrl: string;
  public zoomControlOptions: any = { position: 5 };
  public mapOpen = false;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('map', {static: true}) mapElement: any;
  @ViewChild('search', {static: true}) public searchElementRef: ElementRef;
  map: google.maps.Map;
  public addL: number;
  statelist = statelist;
  Citielist;
  selectCitie;
  selectState;
  privilege: string = 'add';
  constructor(private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService) {
  }

  organization: any = {
    org_name: '',
    org_website: '',
    org_phone1: '',
    org_phone2: '',
    org_address1: '',
    org_address2: '',
    org_city: '',
    org_state: '',
    org_zip1: '',
    org_zip2: '',
    org_lat: 0,
    org_long: 0,
    uuid: ''
  };
  paramId;
  citSearch = '';
  staSearch = '';
  uploader: FileUploader;
  logoError = '';
  logoSelected = '';
  dimensionValid: boolean = false;
  async ngOnInit() {
    if(!this._commonService.checkPrivilegeModule('organization','view')){
      this.router.navigate(['/']);
    }
    if (this.route.params['_value']['id']) {
      this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
      this.privilege = 'edit';
    }
    this.zoom = 5;
    this.latitude = 39.8282;
    this.longitude = -98.5795;
    this.iconUrl = '../assets/map/locationicon.png';

    // create search FormControl
    this.searchControl = new FormControl();

    // set current position
    this.setCurrentPosition();
    const reg = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,50})\\..([a-z.]{2,5})[/\\w .-]*/?';
    this.mapsAPILoader.load().then(
      () => {
        const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, { types: ['address'] });

        autocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => {
            const place: google.maps.places.PlaceResult = autocomplete.getPlace();
            if (place.geometry === undefined || place.geometry === null) {
              return;
            }
            this.latitude = place.geometry.location.lat();
            this.longitude = place.geometry.location.lng();
            this.zoom = 12;

            this.organization.org_name = place.name;
          });
        });
      });

    if (this.route.params['_value']['id']) {
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'organization/view' };
      const payload = { organizationId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
      const result = await this.apiService.apiFn(action, payload);
      this.organization = result['data'];
      const { org_lat, org_long } = this.organization;
      this.latitude = org_lat;
      this.longitude = org_long;
      this.zoom = 12;
      const { org_state, org_city } = this.organization;

      const getstate = this.statelist.reduce((obj, item) => {
        if (item.name.toLowerCase().trim() === org_state.toLowerCase().trim()) {
          //
          obj.push(item);
        } else {

        }
        return obj;
      }, []);
      this._commonService.setLoader(false);
      this.organization.org_state = getstate[0]['id'];

      this.changeState(getstate[0]['id']).then((res) => {
        const getcitie = this.Citielist.reduce((obj, item) => {
          if (item.name === org_city) {
            obj.push(item);
          } else {

          }
          return obj;
        }, []);
        this.organization.org_city = getcitie[0]['id'];
      }).catch((err) => {
        console.log('error in city found');
      });


    }
    this.fileUploader();
  }

  onFocus() {
    if (this.organization.org_website !== 'www.' && this.organization.org_website !== '') {
      this.organization.org_website = this.organization.org_website;
    } else {
      this.organization.org_website = 'www.';
    }
  }

  /* Setting up map location */
  public setCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 15;
      });
    }
  }

  cancel() {
    this.router.navigate(['/org']);
  }

  public async onSubmit(f, org, no) {
    let vaild = f.form.status;
    org.org_name = org.org_name.trim();
    org.org_address1 = org.org_address1.trim();

    if (org.org_name === '' || org.org_address1 === '' || org.org_city === '' || org.org_state === '' || this.logoError != '') {
      vaild = 'INVALID';
    }
    if (vaild === 'VALID') {
      this._commonService.setLoader(true);
      org = { ...org, ...{ org_lat: this.latitude }, ...{ org_long: this.longitude } };
      org['org_city'] = this.selectCitie;
      org['org_state'] = this.selectState;
      const action = {
        type: 'POST',
        target: 'organization/add'
      };
      const payload = org;
      const result = await this.apiService.apiFn(action, payload);

      if (result['status'] === true) {
        let orgID = payload._id;
        if (result["data"]["_id"]) {
          orgID = result["data"]["_id"];
        }
        if (this.logoSelected != '' && this.logoError == '') {
          this.uploader.options.url = this.uploader.options.url.replace('}', '') + '/' + orgID;
          if (this.uploader.queue && this.uploader.queue.length > 0) {
            this.uploader.queue.filter((x) => {
              x.url = x.url.replace('}', '') + '/' + orgID;
            });
          }
          setTimeout(() => {
            this.uploadQueue(() => {
              setTimeout(() => {
                this._commonService.setLoader(false);
                if (result['status']) {
                  if (this.toastr.currentlyActive === 0) {
                    this.toastr.success(result['message']);
                  }
                  if (orgID) {
                    this.router.navigate(['/facility/form', 0, this._aes256Service.encFnWithsalt(orgID)]);
                  } else {
                    this.router.navigate(['/org']);
                  }
                } else {
                  if (this.toastr.currentlyActive === 0) {
                    this.toastr.error(result['message']);
                  }
                }
              }, 100);
            });

          }, 100);
        }
        else {
          this._commonService.setLoader(false);
          if (this.toastr.currentlyActive === 0) {
            this.toastr.success(result['message']);
          }
          if (orgID) {
            this.router.navigate(['/facility/form', 0, this._aes256Service.encFnWithsalt(orgID)]);
          } else {
            this.router.navigate(['/org']);
          }
        }
        // this.toastr.success(result['message']);
        // this._commonService.setLoader(false);
        // if (no === 1) {
        //   this.router.navigate(['/facility/form', 0, this._aes256Service.encFnWithsalt(result['data']['_id'])]);
        // } else {
        //   this.router.navigate(['/org']);
        // }
      } else {
        this._commonService.setLoader(false);
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error(result['message']);
        }
      }

    } else {
      if (this.toastr.currentlyActive === 0) {
        if (this.logoError != '') {
          this.toastr.error('Please upload valid logo');
        }
        else {
          this.toastr.error('Please enter organization details');
        }
      }

    }
  }

  checkAlpha(key) {
    const result = this._commonService.allwoOnlyAlpha(key);
    return result;
  }
  async changeState(state) {
    this._commonService.setLoader(true);
    const action = { type: 'GET', target: 'organization/citieslist' };
    const payload = { state_Id: state };
    const result = await this.apiService.apiFn(action, payload);
    this.Citielist = result['data']['_cities'];
    this.Citielist.forEach(element => {
      element["_id"] = element.id;
    });
    this.organization.org_city = null;
    this._commonService.setLoader(false);
  }


  async changeCity(fac) {
  }
  select(state, city,flag) {
    if (flag === 0){
      if (!state || state === undefined) {
        this.selectCitie = city.source.selected.viewValue;
      } else if (!city || city === undefined) {
        this.selectState = state.source.selected.viewValue;
      }
    }
    else {
      if (!state || state === undefined) {
        this.selectCitie = city;
      } else if (!city || city === undefined) {
        this.selectState = state;
      }
    }
  }

  async fileUploader(organizationId = '') {
    let url = '';
    if (organizationId !== '') {
      url = environment.config.api_url + 'organization/uploadlogo/' + organizationId;
    } else {
      url = environment.config.api_url + 'organization/uploadlogo';
    }
    const _headers: any = await this.apiService.setHeadersForFileUpload();
    if (this.organization.logo && this.organization.logo.location) {
      _headers.push({ 'name': 'oldimagename', 'value': this.organization.logo.imageName });
    }
    this.uploader = new FileUploader({
      url: url,
      method: 'POST',
      disableMultipart: false,
      headers: _headers,
      maxFileSize: 1024 * 1024, // 1 MB
      queueLimit: 1,
      allowedMimeType: [
        'image/jpeg',
        'image/png',
        'image/tiff',
      ],
    });
    this.uploader.onBeforeUploadItem = (item) => {
      item.withCredentials = false;
    };
  }

  async onFileChanged(event) {
    this.logoError = '';
    this.logoSelected = '';
    this.dimensionValid = false;
    let logoHeight = 0;
    let logoWidth = 0;
    const _validFileExtensions = ['.jpg', '.jpeg', '.bmp', '.gif', '.png'];
    const _validDimention = {
      height: 400,
      width: 400
    }
    const _validFileMaxSize = 1024 * 1024 // 1 MB
    const oInput = event.target.files[0];

    if (oInput) {
      const sFileName = oInput.name;
      if (sFileName.length > 0) {
        this.logoSelected = sFileName;
        let blnValid = false;
        for (let j = 0; j < _validFileExtensions.length; j++) {
          const sCurExtension = _validFileExtensions[j];
          if (sFileName.substr(sFileName.length - sCurExtension.length, sCurExtension.length).toLowerCase() === sCurExtension.toLowerCase()) {
            blnValid = true;
            break;
          }
        }
        let sizeValid = false;
        if (oInput.size <= _validFileMaxSize) {
          sizeValid = true;
        }

        if (!blnValid) {
          this.logoError = 'Only image allow to upload.';
          this.logoSelected = '';
          
          return false;
        }
        else if (!sizeValid) {
          this.logoError = 'File size must be less than 1 MB';
          this.logoSelected = '';
          return false;
        }
        else {
          // check for file dimiention
          const reader = new FileReader();
          reader.readAsDataURL(oInput);
          reader.onload = () => {
            const img = new Image();
            img.src = reader.result as string;
            img.onload = () => {
              logoHeight = img.naturalHeight;
              logoWidth = img.naturalWidth;

              if (Number(logoHeight) <= _validDimention.height && Number(logoWidth) <= _validDimention.width) {
                this.dimensionValid = true;
              }
              if (!this.dimensionValid) {
                this.logoError = 'Logo  dimention should be less than ' + _validDimention.width + ' x ' + _validDimention.height;
                this.logoSelected = '';
                return false;
              }
              else {
                this.logoError = '';
                this.logoSelected = sFileName;
                return true;
              }
            };
          };
        }

      }
    }

  }

  uploadQueue(next = null) {
    const files = this.uploader.queue;
    files.forEach(file => {
      if (file.progress === 0) {
        file.upload();
        file.onError = (response: string, status: number, headers: any) => {
        };
        file.onSuccess = (response: any, status: number, headers: any) => {
          const res = JSON.parse(response);
          if (next) {
            next();
          }
        };
      }

    });

    if (!files || (files && files.length === 0)) {
      if (next) {
        next();
      }
    }
    
  }

}
// State list
const statelist: State[] = [

  {
    'id': 3825,
    'name': 'Alabama',
    'country_id': 233
  },
  {
    'id': 3826,
    'name': 'Alaska',
    'country_id': 233
  },
  {
    'id': 3827,
    'name': 'Arizona',
    'country_id': 233
  },
  // {
  //   'id': 4021,
  //   'name': 'American Samoa',
  //   'country_id': 233
  // },
  {
    'id': 3828,
    'name': 'Arkansas',
    'country_id': 233
  },
  {
    'id': 3830,
    'name': 'California',
    'country_id': 233
  },
  // {
  //   'id': 3829,
  //   'name': 'Byram',
  //   'country_id': 233
  // },
  // {
  //   'id': 3831,
  //   'name': 'Cokato',
  //   'country_id': 233
  // },
  {
    'id': 3832,
    'name': 'Colorado',
    'country_id': 233
  },
  {
    'id': 3833,
    'name': 'Connecticut',
    'country_id': 233
  },
  {
    'id': 3834,
    'name': 'Delaware',
    'country_id': 233
  },
  // {
  //   'id': 3835,
  //   'name': 'District of Columbia',
  //   'country_id': 233
  // },
  // {
  //   'id': 4022,
  //   'name': 'Federated States Of Micronesia',
  //   'country_id': 233
  // },
  {
    'id': 3836,
    'name': 'Florida',
    'country_id': 233
  },
  {
    'id': 3838,
    'name': 'Hawaii',
    'country_id': 233
  },
  {
    'id': 3839,
    'name': 'Idaho',
    'country_id': 233
  },
  {
    'id': 3840,
    'name': 'Illinois',
    'country_id': 233
  },
  // {
  //   'id': 4023,
  //   'name': 'Guam',
  //   'country_id': 233
  // },
  {
    'id': 3841,
    'name': 'Indiana',
    'country_id': 233
  },
  {
    'id': 3842,
    'name': 'Iowa',
    'country_id': 233
  },
  {
    'id': 3843,
    'name': 'Kansas',
    'country_id': 233
  },
  {
    'id': 3844,
    'name': 'Kentucky',
    'country_id': 233
  },
  {
    'id': 3845,
    'name': 'Louisiana',
    'country_id': 233
  },
  {
    'id': 3837,
    'name': 'Georgia',
    'country_id': 233
  },
  // {
  //   'id': 3846,
  //   'name': 'Lowa',
  //   'country_id': 233
  // },
  {
    'id': 3848,
    'name': 'Maryland',
    'country_id': 233
  },
  {
    'id': 3849,
    'name': 'Massachusetts',
    'country_id': 233
  },
  // {
  //   'id': 4024,
  //   'name': 'Marshall Islands',
  //   'country_id': 233
  // },
  // {
  //   'id': 3850,
  //   'name': 'Medfield',
  //   'country_id': 233
  // },
  {
    'id': 3851,
    'name': 'Michigan',
    'country_id': 233
  },
  {
    'id': 3852,
    'name': 'Minnesota',
    'country_id': 233
  },
  {
    'id': 3853,
    'name': 'Mississippi',
    'country_id': 233
  },
  {
    'id': 3854,
    'name': 'Missouri',
    'country_id': 233
  },
  {
    'id': 3847,
    'name': 'Maine',
    'country_id': 233
  },
  {
    'id': 3858,
    'name': 'New Hampshire',
    'country_id': 233
  },
  {
    'id': 3859,
    'name': 'New Jersey',
    'country_id': 233
  },
  {
    'id': 3857,
    'name': 'Nevada',
    'country_id': 233
  },
  {
    'id': 3860,
    'name': 'New Jersy',
    'country_id': 233
  },
  {
    'id': 3861,
    'name': 'New Mexico',
    'country_id': 233
  },
  {
    'id': 3862,
    'name': 'New York',
    'country_id': 233
  },
  {
    'id': 3863,
    'name': 'North Carolina',
    'country_id': 233
  },
  {
    'id': 3864,
    'name': 'North Dakota',
    'country_id': 233
  },
  {
    'id': 3855,
    'name': 'Montana',
    'country_id': 233
  },
  {
    'id': 3856,
    'name': 'Nebraska',
    'country_id': 233
  },
  // {
  //   'id': 4025,
  //   'name': 'Northern Mariana Islands',
  //   'country_id': 233
  // },
  {
    'id': 3868,
    'name': 'Oregon',
    'country_id': 233
  },
  // {
  //   'id': 3867,
  //   'name': 'Ontario',
  //   'country_id': 233
  // },
  // {
  //   'id': 4026,
  //   'name': 'Palau',
  //   'country_id': 233
  // },
  {
    'id': 3869,
    'name': 'Pennsylvania',
    'country_id': 233
  },
  // {
  //   'id': 4027,
  //   'name': 'Puerto Rico',
  //   'country_id': 233
  // },
  // {
  //   'id': 3870,
  //   'name': 'Ramey',
  //   'country_id': 233
  // },
  {
    'id': 3871,
    'name': 'Rhode Island',
    'country_id': 233
  },
  {
    'id': 3865,
    'name': 'Ohio',
    'country_id': 233
  },
  {
    'id': 3866,
    'name': 'Oklahoma',
    'country_id': 233
  },
  {
    'id': 3872,
    'name': 'South Carolina',
    'country_id': 233
  },
  {
    'id': 3873,
    'name': 'South Dakota',
    'country_id': 233
  },
  {
    'id': 3875,
    'name': 'Tennessee',
    'country_id': 233
  },
  // {
  //   'id': 3874,
  //   'name': 'Sublimity',
  //   'country_id': 233
  // },
  {
    'id': 3876,
    'name': 'Texas',
    'country_id': 233
  },
  // {
  //   'id': 3877,
  //   'name': 'Trimble',
  //   'country_id': 233
  // },
  {
    'id': 3878,
    'name': 'Utah',
    'country_id': 233
  },
  {
    'id': 3879,
    'name': 'Vermont',
    'country_id': 233
  },
  // {
  //   'id': 4028,
  //   'name': 'Virgin Islands',
  //   'country_id': 233
  // },
  {
    'id': 3880,
    'name': 'Virginia',
    'country_id': 233
  },
  {
    'id': 3881,
    'name': 'Washington',
    'country_id': 233
  },
  {
    'id': 3883,
    'name': 'Wisconsin',
    'country_id': 233
  },
  {
    'id': 3884,
    'name': 'Wyoming',
    'country_id': 233
  },
  // {
  //   'id': 3882,
  //   'name': 'West Virginia',
  //   'country_id': 233
  // }
].sort(function (a, b) {
    const nameA = a.name, nameB = b.name;
    if (nameA < nameB) { // sort string ascending
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0; // default return value (no sorting)
  });

export interface State {
  id: number;
  name: string;
  country_id: number;
}
