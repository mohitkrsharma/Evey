// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatRadioModule, MatDividerModule, MatListModule, MatSlideToggleModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
  MatNativeDateModule
} from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
// import { ListComponent } from './list/list.component';
import { CurrentMedicationComponent } from './current-medication.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from '../../../shared-module/shared-module.module';
import { NgxMaskModule } from 'ngx-mask';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import {MatTabsModule} from '@angular/material/tabs';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { MedicationModule } from '../../medication/medication.module';
import { Routes, RouterModule } from '@angular/router';
export const DATE_NATIVE_FORMATS = {
  fullPickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false},
  datePickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour12: false},
  timePickerInput: {hour: 'numeric', minute: 'numeric', hour12: false},
  monthYearLabel: {year: 'numeric', month: 'short'},
  dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
  monthYearA11yLabel: {year: 'numeric', month: 'long'},
  };

const routes: Routes = [{
    path: '',
    component: CurrentMedicationComponent
}];

@NgModule({
  declarations: [CurrentMedicationComponent],
  imports: [
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
    FileUploadModule,
    MatNativeDateModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    MatTabsModule,
    // MedicationModule,
    DragDropModule,
    RouterModule.forChild(routes)
  ],
  providers:[
    { provide: OWL_DATE_TIME_FORMATS, useValue: DATE_NATIVE_FORMATS }
  ],
})
export class ResidentsCurrentMedicationModule { }