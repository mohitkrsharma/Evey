import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatDividerModule, MatListModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule,
  MatDialogModule,MatSlideToggleModule
} from '@angular/material'
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { VisitorsRoutingModule } from './visitors-routing.module';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';
import {MatRadioModule} from '@angular/material/radio';
@NgModule({
  declarations: [ ListComponent,ViewComponent ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    VisitorsRoutingModule,
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
    MatSlideToggleModule
  ]
})
export class VisitorsModule { }
