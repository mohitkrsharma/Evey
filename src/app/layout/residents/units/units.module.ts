import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {UnitsRoutingModule} from './units-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';
import {SafeHtmlPipe} from '../../../shared/pipes/safe-html.pipe';
import {SharedModuleModule} from '../../../shared-module/shared-module.module';


@NgModule({
  declarations: [],
  imports: [
    FormsModule,
    UnitsRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModuleModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
  ]
})
export class UnitsModule { }
