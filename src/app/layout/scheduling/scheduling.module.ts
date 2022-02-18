
// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { DndModule } from 'ngx-drag-drop';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { CalendarUtilsModule } from './calendar-utils/module';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarModule as ngCalendarModule } from 'primeng/calendar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { SchedulingRoutingModule } from './scheduling-routing.module';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { SharedModuleModule } from './../../shared-module/shared-module.module';

@NgModule({
  declarations: [],
  imports: [
    TimePickerModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    SchedulingRoutingModule,
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
  ],
  entryComponents: []
})
export class SchedulingModule { }
