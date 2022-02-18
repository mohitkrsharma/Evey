import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ViewComponent} from './view.component';
import {MatButtonModule, MatCardModule, MatListModule, MatSlideToggleModule} from '@angular/material';
import {ViewRoutingModule} from './view-routing.module';

@NgModule({
  declarations: [ViewComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatListModule,
    ViewRoutingModule
  ]
})
export class ViewModule { }
