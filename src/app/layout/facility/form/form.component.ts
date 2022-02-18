import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment-timezone'
import { ApiService } from './../../../shared/services/api/api.service';
import { CommonService } from './../../../shared/services/common.service';
import { ConstantsService } from './../../../shared/services/constants.service';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { MapsAPILoader } from '@agm/core';
import { } from 'googlemaps';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {
  statelist = statelist;
  selectCitie;
  selectState;
  Citielist;
  //timezoneList;
  timezoneList = [
    // { key: 'Africa/Abidjan', value: 'Africa/Abidjan' },
    // { key: 'America/Chicago', value: 'America/Chicago' },
    // { key: 'Asia/Kolkata', value: 'Asia/Kolkata' },
    ]
  
  facilityForm: FormGroup;
  organiz;
  loader = false;
  facility: any = {
    fac_org: '',
    fac_name: '',
    fac_phone1: '',
    fac_phone2: '',
    faxno:'',
    fac_address1: '',
    fac_address2: '',
    fac_city: '',
    fac_state: '',
    fac_zip1: '',
    fac_zip2: '',
    timezone: '',
    type:'',
    utc_offset: '',
  };
  pharmacyList = []
  flag = false;
  orgSearch='';
  staSearch='';
  citSearch='';
  timezoneSearch='';
  pharmacySearch='';
  facilitySearch='';
  paramId;
  facilityStatusArr: any[] = [];
  // public latitude: number;
  // public longitude: number;
  // public zoom: number;
  // public iconUrl: string;
  // public zoomControlOptions: any = { position: 5 };
  // public mapOpen = false;
  // @ViewChild('map') mapElement: any;
  // map: google.maps.Map;
  // @ViewChild('search') public searchElementRef: ElementRef;
  constructor(
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private _aes256Service: Aes256Service,
    public _commonService: CommonService,
    public _constantsService: ConstantsService,
    // private mapsAPILoader: MapsAPILoader,
    // private ngZone: NgZone,
  ) { }

  async ngOnInit() {
    if(!this._commonService.checkPrivilegeModule('facility','view')){
      this.router.navigate(['/']);
    }
    // this.zoom = 5;
    // this.latitude = 39.8282;
    // this.longitude = -98.5795;
    // //this.iconUrl = '../assets/map/locationicon.png';
    // this.setCurrentPosition();

    // this.mapsAPILoader.load().then(
    //   () => {
    //     const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, { types: ['address'] });

    //     autocomplete.addListener('place_changed', () => {
    //       this.ngZone.run(() => {
    //         const place: google.maps.places.PlaceResult = autocomplete.getPlace();
    //         if (place.geometry === undefined || place.geometry === null) {
    //           return;
    //         }
    //         this.latitude = place.geometry.location.lat();
    //         this.longitude = place.geometry.location.lng();
    //         this.zoom = 12;

    //         this.facility.fac_name = place.name;
    //       });
    //     });
    //   });

    
    this.getPharmacy();
    //this.getFacilityStatus();
    this.generateTimeZone();
    this.facilityStatusArr = this._constantsService.facilityStatus();
    if (this.route.params['_value']['id'] && (this.route.params['_value']['id'] !== 0 || this.route.params['_value']['id'] !== "0")) {
      this.paramId = this._aes256Service.decFnWithsalt(this.route.params['_value']['id']);
    }
    if (this.route.params['_value']['org'] && (this.route.params['_value']['org'] !== 0 || this.route.params['_value']['id'] !== "0")) {
      this.flag = true;
      this.facility['fac_org'] = this._aes256Service.decFnWithsalt(this.route.params['_value']['org']);
    }
    const action = { type: 'GET', target: 'organization/orglist' };
    const payload = {};
    const result = await this.apiService.apiFn(action, payload);
    this.organiz = result['data'];
    if (!this.route.params['_value']['org'] && this.route.params['_value']['id'] && (this.route.params['_value']['id'] !== 0 ||  this.route.params['_value']['id'] !== "0")) {
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'facility/view' };
      const payload = { facilityId: this._aes256Service.decFnWithsalt(this.route.params['_value']['id']) };
      const result = await this.apiService.apiFn(action, payload);
      console.log('result',result);
      this.facility = result['data'];
      this.facility.pharmacy?this.facility.pharmacy=this.facility.pharmacy._id:undefined
      this.facility
      this.facility['fac_org'] = result['data']['fac_org']['_id'];

      const { fac_city, fac_state } = this.facility;
      // const { fac_lat, fac_long } = this.facility;
      // this.latitude = fac_lat;
      // this.longitude = fac_long;
      // this.zoom = 12;
      const getstate = this.statelist.reduce((obj, item) => {
        if (item.name.toLowerCase().trim() === fac_state.toLowerCase().trim()) {
          obj.push(item);
        } else {

        }
        return obj;
      }, []);
      this.facility.fac_state = getstate[0]['id'];
      this.changeState(getstate[0]['id']).then((res) => {
        const getcitie = this.Citielist.reduce((obj, item) => {
          if (item.name === fac_city) {
            obj.push(item);
          } else {

          }
          return obj;
        }, []);
        this.facility.fac_city = getcitie[0]['id'];
      }).catch((err) => {
        console.log('error in city found');
      });
      this._commonService.setLoader(false);
    }

  }

  generateTimeZone(){
    this.timezoneList= moment.tz.zonesForCountry('US',true)
  }

  cancelForm() {
    this.router.navigate(['/facility']);
  }

  async onSubmit(f, facility, no) {
    let vaild = f.form.status;
    facility.fac_name = facility.fac_name.trim();
    facility.fac_address1 = facility.fac_address1.trim();
    if (facility.fac_name === '' || facility.fac_address1 === '' || facility.fac_city === '' || facility.fac_state === '') {
      vaild = 'INVALID';
    }
    if (vaild === 'VALID') {
      facility['fac_city'] = this.selectCitie;
      facility['fac_state'] = this.selectState;
      facility['utc_offset']=moment.tz(facility.timezone).utcOffset()
      this._commonService.setLoader(true);
      const action = { type: 'POST', target: 'facility/add' };
      facility['user'] = sessionStorage.getItem('user_Id');
      const payload = facility;
      const result = await this.apiService.apiFn(action, payload);
      this._commonService.setLoader(false);
      if (result['status'] === true) {
        let facilityRes = {
          facility: {label: result['data']['fac_name'], value: result['data']['_id']},
          org: result['data']['fac_org']
        }
        this._commonService.facilitycontent.next(facilityRes);
        this.toastr.success(result['message']);
        if (no === 1) {
          if (this.route.params['_value']['org']) {
            // tslint:disable-next-line: max-line-length
            this.router.navigate(['/floorsector/form', 0, this.route.params['_value']['org'], this._aes256Service.encFnWithsalt(result['data']['_id']) ]);
          } else {
            // tslint:disable-next-line: max-line-length
            this.router.navigate(['/floorsector/form', 0, this._aes256Service.encFnWithsalt(facility.fac_org), this._aes256Service.encFnWithsalt(result['data']['_id']) ]);
          }

        } else {
          this.router.navigate(['/facility']);
        }
      } else {
        if (this.toastr.currentlyActive === 0) {
          this.toastr.error(result['message']);
        }
      }

    } else {
      if (this.toastr.currentlyActive === 0) {
        this.toastr.error('Please enter facility details');
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
    this.facility.fac_city = null;
    this._commonService.setLoader(false);
  }

  async changeCity(fac) {
  }

  select(state, city,flag) {
   if(flag === 0){
    if (!state || state === undefined) {
      this.selectCitie = city.source.selected.viewValue;
    } else if (!city || city === undefined) {
      this.selectState = state.source.selected.viewValue;
    }
   }
   else{
      if (!state || state === undefined) {
      this.selectCitie = city;
    } else if (!city || city === undefined) {
      this.selectState = state;
    } 
   }
 }

 async getPharmacy(){
   console.log('here')
   const action = {
    type: 'GET', target: 'residents/pharmacy_list' 
   }

   const result = await this.apiService.apiFn(action,{})

   console.log('result',result)
   this.pharmacyList = result['data']['_pharmacy']
 }

//  async getFacilityStatus(){
//   const action = {
//    type: 'GET', target: 'facility/facilityStatus' 
//   }
//   const result = await this.apiService.apiFn(action,{})
//   this.facilityStatusData = result['data']
// }
  // public setCurrentPosition() {
  //   if ('geolocation' in navigator) {
  //     navigator.geolocation.getCurrentPosition((position) => {
  //       this.latitude = position.coords.latitude;
  //       this.longitude = position.coords.longitude;
  //       this.zoom = 15;
  //     });
  //   }
  // } 

}

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
];

export interface State {
  id: number;
  name: string;
  country_id: number;
}
