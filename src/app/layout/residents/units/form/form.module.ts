import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormComponent} from './form.component';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatRadioModule,
  MatSelectModule,
  MatSlideToggleModule
} from '@angular/material';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';
import {FormsModule} from '@angular/forms';
import {SafeHtmlPipe} from '../../../../shared/pipes/safe-html.pipe';
import {NgxMaskModule} from 'ngx-mask';
import {FormRoutingModule} from './form-routing.module';

@NgModule({
  declarations: [FormComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    FormsModule,
    SafeHtmlPipe,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    NgxMaskModule,
    MatRadioModule,
    FormRoutingModule
  ]
})
export class FormModule { }
