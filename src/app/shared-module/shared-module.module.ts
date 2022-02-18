import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModuleComponent } from './shared-module.component';
import { TimerComponent } from './../layout/components/timerComponent/timer.component';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CheckduplicatefieldDirective } from '../shared/directives/checkduplicatefield.directive';
// import { PdfViewerModule } from 'ng2-pdf-viewer';
import { HttpClientModule } from '@angular/common/http';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { MatListModule } from '@angular/material';

@NgModule({
  declarations: [SharedModuleComponent, TimerComponent, CheckduplicatefieldDirective],
  imports: [
    CommonModule,
    MatTooltipModule,
    // PdfViewerModule,
      PdfJsViewerModule ,
    HttpClientModule,
    MatListModule
  ],
  exports: [TimerComponent, CheckduplicatefieldDirective],
})
export class SharedModuleModule { }
