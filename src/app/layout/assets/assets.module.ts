
// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule,
  MatButtonToggleModule, MatRadioModule, MatDividerModule, MatListModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule, MatSlideToggleModule
} from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';

import { AssetsRoutingModule } from './assets-routing.module';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { EditorModule } from 'primeng/editor';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { NgxMaskModule } from 'ngx-mask';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { TypesComponent } from './types/types.component';


@NgModule({
  declarations: [FormComponent, ListComponent, ViewComponent, TypesComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    AssetsRoutingModule,
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
    MatRadioModule,
    MatDividerModule,
    MatListModule,
    SharedModuleModule, MatButtonToggleModule, MatSlideToggleModule,
    EditorModule, SafeHtmlPipe,
    NgxMaskModule.forRoot(),
    MatDatepickerModule,
    NgxMatSelectSearchModule,
  ]
})
export class AssetsModule { }



