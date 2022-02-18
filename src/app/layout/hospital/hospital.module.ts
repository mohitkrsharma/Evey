import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { NgxMaskModule } from 'ngx-mask';
import { SafeHtmlPipe } from 'src/app/shared/pipes/safe-html.pipe';
import { PipesModule } from 'src/app/shared/pipes/pipes.module';
import { EditorModule } from 'primeng/editor';
import {
  MatDividerModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatSlideToggleModule,
} from '@angular/material';

import { HospitalRoutingModule } from './hospital-routing.module';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';

@NgModule({
  declarations: [ListComponent, ViewComponent],
  imports: [
    CommonModule,
    HospitalRoutingModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatDividerModule,
    MatPaginatorModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatListModule,
    MatButtonModule,
    MatSelectModule,
    MatMenuModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    EditorModule,
    NgxMaskModule.forRoot(),
    SharedModuleModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
})
export class HospitalModule {}
