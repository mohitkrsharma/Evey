import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as moment from 'moment';


@Pipe({ name: 'weekNumber' })
export class WeekNumberPipe implements PipeTransform {
    constructor(private _sanitizer: DomSanitizer) { }
    transform(value: string): SafeHtml {
        // console.log('adasdasdasdadasdasdasdasdasdasd', value);
        // console.log(moment(value).week());
        // console.log(moment(value).toLocaleString().substring(0, 3) + " number " + Math.ceil(moment(value).date() / 7) + " of the month");
        return Math.ceil(moment(value).date() / 7) ;
        // return this._sanitizer.bypassSecurityTrustHtml(value);
    }
}