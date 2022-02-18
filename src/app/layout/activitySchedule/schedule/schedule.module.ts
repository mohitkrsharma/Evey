import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatRadioModule } from '@angular/material';
import { MatTableModule,MatSortModule,MatSelectModule,MatFormFieldModule,MatCardModule,MatProgressSpinnerModule,MatMenuModule,MatIconModule,MatToolbarModule, } from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material';
import { MatNativeDateModule } from '@angular/material';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { DndModule } from 'ngx-drag-drop';
import { OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarModule as ngCalendarModule } from 'primeng/calendar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { ScheduleComponent } from './schedule.component';
import { CalendarUtilsModule } from '../calendar-utils/module';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { SharedModuleModule } from '../../../shared-module/shared-module.module';
import { RouterModule, Routes } from '@angular/router';

export const DATE_NATIVE_FORMATS = {
  fullPickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false},
  datePickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour12: false},
  timePickerInput: {hour: 'numeric', minute: 'numeric', hour12: false},
  monthYearLabel: {year: 'numeric', month: 'short'},
  dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
  monthYearA11yLabel: {year: 'numeric', month: 'long'},
};

const routes: Routes = [{ path: '', data: { breadcrumb: 'Calendar' }, component: ScheduleComponent }];

@NgModule({
  declarations: [ScheduleComponent],
  imports: [
    TimePickerModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatRadioModule,
    MatCheckboxModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    MatListModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    MatStepperModule,
    MatDialogModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
    SharedModuleModule,
    CdkStepperModule,
    DndModule,
    CommonModule,
    DragDropModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    }),
    DragAndDropModule,
    CalendarUtilsModule,
    ngCalendarModule,
    SafeHtmlPipe,
    RouterModule.forChild(routes)
  ],
  entryComponents: [],
  providers: [{ provide: OWL_DATE_TIME_FORMATS, useValue: DATE_NATIVE_FORMATS }]
})
export class ActivityScheduleModule { }