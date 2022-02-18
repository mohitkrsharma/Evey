import { NgModule } from '@angular/core';
import { SanitizeTextPipe } from './sanitize-text';
import { WeekNumberPipe } from './week-number';
import { AlphaNumberPipe } from './alpha-number';
import { StringFilterByPipe } from './string-filterdata';
import { FilterSearchByPipe } from './filter-filterdata';
import {timezoneWiseDatePipe} from './timezone-date'
@NgModule({
    declarations: [SanitizeTextPipe, WeekNumberPipe, AlphaNumberPipe,StringFilterByPipe,FilterSearchByPipe,timezoneWiseDatePipe],
    exports: [SanitizeTextPipe, WeekNumberPipe, AlphaNumberPipe,StringFilterByPipe,FilterSearchByPipe,timezoneWiseDatePipe]
})
export class SafeHtmlPipe { }