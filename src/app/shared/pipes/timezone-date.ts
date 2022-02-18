import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import * as moment from 'moment-timezone';

@Pipe({
  name: 'timezoneWiseMomentDate'
})
export class timezoneWiseDatePipe implements PipeTransform {
 constructor(private _sanitizer: DomSanitizer) { }
  transform(value:any | Date,timezone:string):SafeHtml {
    const convertedDate = moment.tz(value,timezone).format('L')

    return convertedDate
  }
  
}
