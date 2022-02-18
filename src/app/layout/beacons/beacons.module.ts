// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BeaconsRoutingModule } from './beacons-routing.module';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { NgxMaskModule } from 'ngx-mask';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
@NgModule({
  declarations: [],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    BeaconsRoutingModule,
    SharedModuleModule,
    NgxMaskModule.forRoot(),
    SafeHtmlPipe,
    // InputMaskModule
  ]
})
export class BeaconsModule { }
