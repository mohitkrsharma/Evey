// ANGULAR LIB
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule } from '@angular/material';
import { MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule, MatSlideToggleModule} from '@angular/material';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ViewComponent } from './view.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModuleModule } from '../../../shared-module/shared-module.module';
import { MatRadioModule, MatDividerModule, MatListModule } from '@angular/material';
import { MatGridListModule}  from '@angular/material/grid-list';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [{ path: '', component: ViewComponent }]

@NgModule({
  declarations: [ViewComponent],
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
    MatFormFieldModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    SharedModuleModule,
    MatRadioModule,
    MatDividerModule,
    MatListModule,
    MatGridListModule,
    MatSlideToggleModule,
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    RouterModule.forChild(routes)
  ]
})
export class ZonesViewModule { }


