import { NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule,    MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule, } from '@angular/material';
import { SafeHtmlPipe } from './../shared/pipes/safe-html.pipe';
import { LoggedinusersModule } from './../layout/loggedinusers/loggedinusers.module';

import { SharedModuleModule } from './../shared-module/shared-module.module';

import { TempLivedashboardRoutingModule } from './temp-livedashboard-routing.module';
import { TempLivedashboardComponent } from './temp-livedashboard.component';
import { ConnectionServiceModule } from 'ng-connection-service';

@NgModule({
  declarations: [
    TempLivedashboardComponent
  ],
  imports: [
    LoggedinusersModule,
    TempLivedashboardRoutingModule,
    SafeHtmlPipe,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
    SharedModuleModule,
    ConnectionServiceModule
  ],
  exports: []
})
export class TempLivedashboardModule { }
