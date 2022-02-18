// ANGULAR LIB
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NgModule,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCheckboxModule,
  MatInputModule,
  MatDividerModule,
  MatListModule,
} from '@angular/material';
import {
  MatTableModule,
  MatSortModule,
  MatSelectModule,
  MatFormFieldModule,
  MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
  MatSlideToggleModule,
} from '@angular/material';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatPaginatorModule } from '@angular/material/paginator';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ReportsRoutingModule } from './reports-routing.module';
import { FormComponent } from './form/form.component';
import {
  MatRangeDatepickerModule,
  MatRangeNativeDateModule,
} from 'mat-range-datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { GetreportComponent } from './getreport/getreport.component';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { SavereportComponent } from '../../shared/modals/savereport/savereport.component';
import { NgxMatDrpModule } from 'ngx-mat-daterange-picker';
import { ViewComponent } from './view/view.component';
import { CarebyuseComponent } from './carebyuse/carebyuse.component';
import { CarebyresidentComponent } from './carebyresident/carebyresident.component';
import { MultipleemployeeComponent } from './multipleemployee/multipleemployee.component';
import { CarebyemployeeComponent } from './carebyemployee/carebyemployee.component';
import { CareperdayComponent } from './careperday/careperday.component';
import { CarebytimeComponent } from './carebytime/carebytime.component';
import { CalendarModule } from 'primeng/calendar';
import { SingleemployeComponent } from './singleemploye/singleemploye.component';
import { ShiftperformancereportComponent } from './shiftperformancereport/shiftperformancereport.component';
import { MatRadioModule } from '@angular/material/radio';
import { ShiftreportComponent } from './shiftperformancereport/shiftreport/shiftreport.component';
import { ExportAsModule } from 'ngx-export-as';
import {
  OwlDateTimeModule,
  OwlNativeDateTimeModule,
  OWL_DATE_TIME_FORMATS,
} from 'ng-pick-datetime';
import { ViewCustomReportsComponent } from './view-custom-reports/view-custom-reports.component';
import { CarechartComponent } from './charts/carechart/carechart.component';
import { MissedcheckinbyshiftComponent } from './missedcheckinbyshift/missedcheckinbyshift.component';
// import {CalendarModule} from 'primeng/calendar';
import { ChartsModule } from 'ng2-charts/ng2-charts';
/* import { MatDaterangepickerModule } from 'mat-daterangepicker'; */

import { ListComponent } from './activity/list.component';

import { RoomCleaningReportComponent } from './roomcleaningreport/roomcleaningreport.component';
import { RoomCleanReportComponent } from './roomcleaningreport/roomcleanreport/roomcleanreport.component';

import { VitalReportComponent } from './vitalreport/vitalreport.component';
import { VitalsReportComponent } from './vitalreport/report/vitalsreport.component';
import { VirusReportComponent } from './virusreport/virusreport.component';
import { AmazingTimePickerModule } from 'amazing-time-picker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { VirusdatareportComponent } from './virusreport/report/virusdatareport.component';
import { FallDataReportComponent } from './fallcarereport/report/fall-data-report.component';
import { ReportComponent } from './refusedcare/report/report.component';
import { TestingreportComponent } from './testingreport/report/testingreport.component';
import { MedicationViewReportComponent } from './medication-view-report/medication-view-report.component';
import { DnrViewReportComponent } from './dnr-view-report/dnr-view-report.component';
import { CustomMedicationReportComponent } from './custom-medication-report/custom-medication-report.component';
import { MatNativeDateModule } from '@angular/material/core';
import { CensusreportComponent } from './census/censusreport/censusreport.component';
import { DNRReportComponent } from './dnr-report/dnr-report.component';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { OpentimeonlevelreportComponent } from './opentimeonlevelreport/opentimeonlevelreport.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { AssessmentReportComponent } from './assessment-report/assessment-report.component';

export const DATE_NATIVE_FORMATS = {
  fullPickerInput: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  },
  datePickerInput: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour12: false,
  },
  timePickerInput: { hour: 'numeric', minute: 'numeric', hour12: false },
  monthYearLabel: { year: 'numeric', month: 'short' },
  dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
  monthYearA11yLabel: { year: 'numeric', month: 'long' },
};
@NgModule({
  declarations: [
    FormComponent,
    GetreportComponent,
    ViewComponent,
    CarebyuseComponent,
    CarebyresidentComponent,
    MultipleemployeeComponent,
    CarebyemployeeComponent,
    CareperdayComponent,
    CarebytimeComponent,
    SingleemployeComponent,
    ShiftperformancereportComponent,
    ShiftreportComponent,
    ViewCustomReportsComponent,
    CarechartComponent,
    MissedcheckinbyshiftComponent,
    ListComponent,
    RoomCleaningReportComponent,
    RoomCleanReportComponent,
    VitalReportComponent,
    VitalsReportComponent,
    VirusReportComponent,
    VirusdatareportComponent,
    FallDataReportComponent,
    ReportComponent,
    TestingreportComponent,
    MedicationViewReportComponent,
    DnrViewReportComponent,
    CustomMedicationReportComponent,
    DNRReportComponent,
    CensusreportComponent,
    OpentimeonlevelreportComponent,
    InventoryReportComponent,
    AssessmentReportComponent,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    ReportsRoutingModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatRangeDatepickerModule,
    MatRangeNativeDateModule,
    MatMenuModule,
    MatNativeDateModule,
    /*     MatDaterangepickerModule, */
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
    AngularMultiSelectModule,
    NgxMatDrpModule,
    MatDividerModule,
    CalendarModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatRadioModule,
    NgxDaterangepickerMd.forRoot(),
    ExportAsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatProgressBarModule,
    ChartsModule,
    MatSlideToggleModule,
    MatListModule,
    AmazingTimePickerModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    TimePickerModule,
    NgxMatDrpModule,
  ],
  providers: [
    { provide: OWL_DATE_TIME_FORMATS, useValue: DATE_NATIVE_FORMATS },
  ],
  entryComponents: [CustomMedicationReportComponent, DNRReportComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ReportsModule {}
