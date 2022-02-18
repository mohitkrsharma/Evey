// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule } from '@angular/material';
import { MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule,    MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule, MatButtonToggleModule } from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TechnicalsupportRoutingModule } from './technicalsupport-routing.module';
import { FormComponent } from './form/form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import {EditorModule} from 'primeng/editor';
import { FileUploadModule } from 'ng2-file-upload';
import {MatProgressBarModule} from '@angular/material/progress-bar'
@NgModule({
  declarations: [ FormComponent],
  imports: [
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    TechnicalsupportRoutingModule,
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
    MatButtonToggleModule,
    EditorModule,
    FileUploadModule
  ]
})
export class TechnicalsupportModule { }


