import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertdashboardComponent } from './alertdashboard.component';
import { AlertdashboardRoutingModule } from './alertdashboard-routing.module';
import { MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule,    MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule, } from '@angular/material';
import { ChartsModule } from 'ng2-charts';
import { SafeHtmlPipe } from './../shared/pipes/safe-html.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SharedModuleModule } from './../shared-module/shared-module.module';
@NgModule({
  declarations: [AlertdashboardComponent],
  imports: [
    CommonModule,
    AlertdashboardRoutingModule,
    MatTableModule,
    MatSortModule, MatSelectModule, MatFormFieldModule,    MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
    ChartsModule,
    SafeHtmlPipe,
    MatTooltipModule,
    SharedModuleModule
  ]
})
export class AlertdashboardModule { }
