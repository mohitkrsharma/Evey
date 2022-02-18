// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule, MatInputModule, MatSlideToggleModule } from '@angular/material';
import { MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule, MatIconModule } from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SharedModuleModule } from '../../shared-module/shared-module.module';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

import { DiagnosisComponent } from './diagnosis/diagnosis.component';
import { OrderMgmtComponent } from './order-mgmt/order-mgmt.component';
import { RouterModule } from '@angular/router';
import {
  MatListModule,
} from '@angular/material';
import {DragDropModule} from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [DiagnosisComponent, OrderMgmtComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModuleModule,
    SafeHtmlPipe,
    MatCheckboxModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatTabsModule,
    MatSlideToggleModule,
    NgxMatSelectSearchModule,
    MatListModule,
    DragDropModule
  ],
  providers:[],
  exports: [DiagnosisComponent, OrderMgmtComponent]
})
export class ResidentsSharedModule {}