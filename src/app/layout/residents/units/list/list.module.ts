import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ListComponent} from './list.component';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatIconModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatSortModule,
  MatTableModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';
import {SafeHtmlPipe} from '../../../../shared/pipes/safe-html.pipe';
import {ListRoutingModule} from './list-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    MatTableModule,
    MatCheckboxModule,
    MatSortModule,
    MatSlideToggleModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    ListRoutingModule
  ]
})
export class ListModule { }
