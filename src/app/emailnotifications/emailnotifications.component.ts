import { Component, OnInit } from '@angular/core';
import { ApiService } from './../shared/services/api/api.service';
import * as moment from 'moment';

@Component({
  selector: 'app-emailnotifications',
  templateUrl: './emailnotifications.component.html',
  styleUrls: ['./emailnotifications.component.scss']
})
export class EmailnotificationsComponent implements OnInit {

  constructor(
    private apiService: ApiService,
  ) { }
  notifydata:any;
  async ngOnInit() {
    const action = { type: 'GET', target: 'trackcare/email_notifyCare' };
    const payload = { };
    const result =  await this.apiService.apiFn(action, payload);
   
    console.log("rrrrrrrrrrrrrr",result)
    this.notifydata = result['data']

    let merged = [];

for(let i=0; i<result['data'].length; i++) {
  merged.push({
   ...result['data'][i], 
   ...(result['notify_false'].find((itmInner) =>   
   itmInner.care_id === result['data'][i].care_id_true))}
  );
}
//moment(val.ts_total_time.start_time).tz(val.user.timezone).format('HH:mm');
console.log("iiiiiiiiiiiiiiiiiiiii",merged)
//this.notifydata = merged;
this.notifydata = merged.map(
  item => {
    var d;
//console.log("pppppppp",item.ts_total_time.start_time)
   if(item.ts_total_time && item.ts_total_time.start_time){
    d = item.ts_total_time.start_time;
   }
   
    return {
      ...item,
      time_true: moment(item.time_true).format('HH:mm'),
      time: d ? moment(item['ts_total_time']['start_time']).format('HH:mm') :'-'
    }
  })
  console.log("hghghghjgjjh",this.notifydata)
  }



}
