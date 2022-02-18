import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatRadioModule,
         MatDividerModule, MatListModule, MatSlideToggleModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
  MatNativeDateModule,
  MatButtonToggleModule,
  MatAutocompleteModule
} from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { NgxMaskModule } from 'ngx-mask';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { MedicationRoutingModule } from './medication-routing.module';
// import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';
import { CalendarModule } from 'primeng/calendar';
import { MatSelectInfiniteScrollModule } from 'ng-mat-select-infinite-scroll';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
// import { PdfViewerModule } from 'ng2-pdf-viewer';

export const DATE_NATIVE_FORMATS = {
  fullPickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false},
  datePickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour12: false},
  timePickerInput: {hour: 'numeric', minute: 'numeric', hour12: false},
  monthYearLabel: {year: 'numeric', month: 'short'},
  dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
  monthYearA11yLabel: {year: 'numeric', month: 'long'},
  };

@NgModule({
  declarations: [ FormComponent, ViewComponent],
  imports: [
    CommonModule,
    MedicationRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
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
    SharedModuleModule,
    MatDividerModule,
    MatListModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTooltipModule,
    NgxMaskModule.forRoot(),
    MatDatepickerModule,
    TimePickerModule,
    FileUploadModule,
    MatNativeDateModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    MatButtonToggleModule,
    MatAutocompleteModule,
    CalendarModule,
    MatSelectInfiniteScrollModule,
    // PdfViewerModule,
    PdfJsViewerModule
    
  ],
  providers: [
    { provide: OWL_DATE_TIME_FORMATS, useValue: DATE_NATIVE_FORMATS }
  ],
  // exports:[ListComponent]
})
export class MedicationModule { }
