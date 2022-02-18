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
import { ListComponent } from './list/list.component';
import {MatRadioModule} from '@angular/material/radio';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { LocationRoutingModule } from './location-routing.module';
import { ViewComponent } from './view/view.component';
@NgModule({
  declarations: [ListComponent, ViewComponent ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    LocationRoutingModule,
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
    FileUploadModule,
    MatRadioModule,
    DragDropModule,
    MatSlideToggleModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
  ]
})
export class LocationModule { }
