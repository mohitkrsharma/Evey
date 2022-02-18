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
import { SharedModuleModule } from '../../shared-module/shared-module.module';
import { NgxMaskModule } from 'ngx-mask';
import { SafeHtmlPipe } from './../../../app/shared/pipes/safe-html.pipe';
import { EditorModule } from 'primeng/editor';
import {
  MatProgressSpinnerModule,
  MatSlideToggleModule,
} from '@angular/material';

import { TestingDeviceRoutingModule } from './testingdevice-routing.module';
import { ListComponent } from './list/list.component';

@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    TestingDeviceRoutingModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
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
export class TestingDeviceModule {}
