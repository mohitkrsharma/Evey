import { NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule,    MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule, } from '@angular/material';
import { LivedashboardRoutingModule } from './livedashboard-routing.module';
import { LivedashboardComponent } from './livedashboard.component';
import { SafeHtmlPipe } from './../shared/pipes/safe-html.pipe';
import { LoggedinusersModule } from './../layout/loggedinusers/loggedinusers.module';

import { SharedModuleModule } from './../shared-module/shared-module.module';
@NgModule({
  declarations: [
    LivedashboardComponent
  ],
  imports: [
    LoggedinusersModule,
    SafeHtmlPipe,
    CommonModule,
    LivedashboardRoutingModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
    SharedModuleModule
  ],
  exports: []
})
export class LivedashboardModule { }
