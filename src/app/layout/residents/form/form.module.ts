// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxMaskModule } from 'ngx-mask';
import { OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { FileUploadModule } from 'ng2-file-upload';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Routes, RouterModule } from '@angular/router';
import { MatIconModule, MatCardModule, MatSelectModule, MatSlideToggleModule, MatDatepickerModule, MatTabsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatTableModule, MatCheckboxModule, MatProgressSpinnerModule, MatPaginatorModule, MatSortModule, MatToolbarModule, MatMenuModule, MatDividerModule, MatListModule, MatRadioModule, MatTooltipModule } from '@angular/material';
import { FormComponent } from './form.component';
import { SharedModuleModule } from '../../../shared-module/shared-module.module';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { ResidentsSharedModule } from '../residents-shared.module';
import { LayoutSharedModule } from '../../layout-shared.module';
import { EditorModule } from 'primeng/editor';
export const DATE_NATIVE_FORMATS = {
  fullPickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false},
  datePickerInput: {year: 'numeric', month: 'numeric', day: 'numeric', hour12: false},
  timePickerInput: {hour: 'numeric', minute: 'numeric', hour12: false},
  monthYearLabel: {year: 'numeric', month: 'short'},
  dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
  monthYearA11yLabel: {year: 'numeric', month: 'long'},
};


const routes: Routes = [{ path: '',data: { breadcrumb: null }, component: FormComponent }];

@NgModule({
  declarations: [FormComponent],
  imports: [
    CommonModule,
    ResidentsSharedModule,
    LayoutSharedModule,
    SharedModuleModule,
    SafeHtmlPipe,
    FileUploadModule,
    DragDropModule,
    NgxMaskModule.forRoot(),
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatTabsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    MatDividerModule,
    MatListModule,
    MatRadioModule,
    MatSlideToggleModule,
	  MatTooltipModule,
    EditorModule
  ],
  providers:[{ provide: OWL_DATE_TIME_FORMATS, useValue: DATE_NATIVE_FORMATS }]
})
export class ResidentsFormModule { }