// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatRadioModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
} from '@angular/material'
import { MatPaginatorModule } from '@angular/material/paginator';
import { OrgRoutingModule } from './org-routing.module';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { ViewComponent } from './view/view.component';
import { MatDividerModule, MatListModule } from '@angular/material';
import { AgmCoreModule } from '@agm/core';
import { NgxMaskModule } from 'ngx-mask';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { FileUploadModule } from 'ng2-file-upload';

@NgModule({
  declarations: [ ListComponent, FormComponent, ViewComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    OrgRoutingModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FileUploadModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    SharedModuleModule,
    MatDividerModule,
    MatListModule,
    NgxMaskModule.forRoot(),
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyC2lht-_fRNIFmJ2Lj2RfEPdN9rvCSGpfw",
      libraries: ["places"]
    }),
  ]
})
export class OrgModule { }

