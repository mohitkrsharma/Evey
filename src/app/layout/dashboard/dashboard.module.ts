// ANGULAR LIB

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
    MatButtonModule,
    MatCheckboxModule, MatInputModule,
    MatTableModule, MatSortModule,
    MatSelectModule, MatFormFieldModule, MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
} from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';

import { StatModule } from '../../shared/modules/stat/stat.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { LoggedinusersModule } from './../loggedinusers/loggedinusers.module';
import {  MatDividerModule, MatListModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
// import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
// import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
// import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
 

// const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
//     suppressScrollX: true
//   };


@NgModule({
    imports: [
        // PerfectScrollbarModule,
        MatDividerModule, MatListModule,
        FormsModule, ReactiveFormsModule,
        CommonModule,
        DashboardRoutingModule,
        MatGridListModule,
        StatModule,
        MatCardModule,
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        FlexLayoutModule.withConfig({ addFlexToParent: false }),
        MatButtonModule,
        MatCheckboxModule,
        MatInputModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatIconModule,
        MatToolbarModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSortModule,
        MatTableModule,
        MatPaginatorModule,
        SafeHtmlPipe,
        LoggedinusersModule,
        ChartsModule,
        NgxMatSelectSearchModule,
    ],
    declarations: [
        DashboardComponent
    ],
    exports: [
        // LoggedinusersComponent
    ],
    providers: [
        // {
        //   provide: PERFECT_SCROLLBAR_CONFIG,
        //   useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
        // }
      ]
})
export class DashboardModule { }
