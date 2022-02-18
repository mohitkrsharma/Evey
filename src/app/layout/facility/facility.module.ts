
// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatDividerModule, MatListModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
} from '@angular/material'
import { MatPaginatorModule } from '@angular/material/paginator';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { FacilityRoutingModule } from './facility-routing.module';
import { ViewComponent } from './view/view.component';
import { NgxMaskModule } from 'ngx-mask';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { AgmCoreModule } from '@agm/core';
@NgModule({
  declarations: [ListComponent, FormComponent, ViewComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    FacilityRoutingModule,
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
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    NgxMaskModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyC2lht-_fRNIFmJ2Lj2RfEPdN9rvCSGpfw",
      libraries: ["places"]
    }),
  ]
})
export class FacilityModule { }


