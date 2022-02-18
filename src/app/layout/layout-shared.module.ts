import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatExpansionModule, MatInputModule, MatListModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
  MatButtonToggleModule,
  MatAutocompleteModule
} from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../shared-module/shared-module.module';
import { NgxMaskModule } from 'ngx-mask';
import { OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../shared/pipes/safe-html.pipe';
import { ListComponent as MadicationListComponent } from './medication/list/list.component';
import { CalendarModule } from 'primeng/calendar';

export const DATE_NATIVE_FORMATS = {
  fullPickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false},
  datePickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour12: false},
  timePickerInput: {hour: 'numeric', minute: 'numeric', hour12: false},
  monthYearLabel: {year: 'numeric', month: 'short'},
  dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
  monthYearA11yLabel: {year: 'numeric', month: 'long'},
};

@NgModule({
  declarations: [MadicationListComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatToolbarModule,
    MatExpansionModule,
    MatListModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatAutocompleteModule,
    SharedModuleModule,
    NgxMaskModule.forRoot(),
    FileUploadModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    CalendarModule
  ],
  providers: [
    { provide: OWL_DATE_TIME_FORMATS, useValue: DATE_NATIVE_FORMATS }
  ],
  exports:[MadicationListComponent]
})
export class LayoutSharedModule { }
