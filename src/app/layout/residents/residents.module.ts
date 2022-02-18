// ANGULAR LIB
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResidentsRoutingModule } from './residents-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { EditorModule } from 'primeng/editor';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { MedicationModule } from '../medication/medication.module';
import { ResidentsSharedModule } from './residents-shared.module';
import { CalendarModule, SharedModule } from 'primeng/primeng';
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
import {
  MatListModule,
} from '@angular/material';
import {DragDropModule} from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ResidentsRoutingModule,
    SharedModuleModule,
    NgxMatSelectSearchModule,
    EditorModule,
    SafeHtmlPipe,
    ResidentsSharedModule,
    MedicationModule,
    MatListModule,
    DragDropModule,
    TimePickerModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA ]
})
export class ResidentsModule {}
