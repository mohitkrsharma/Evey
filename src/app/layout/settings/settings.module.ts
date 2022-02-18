import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatRadioModule, MatDividerModule, MatListModule,MatSlideToggleModule } from '@angular/material';
import {
  MatTableModule, MatSortModule, MatSelectModule, MatFormFieldModule, MatCardModule,
  MatProgressSpinnerModule,
  MatMenuModule,
  MatIconModule,
  MatToolbarModule
} from '@angular/material';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';

import { MatPaginatorModule } from '@angular/material/paginator';
import { SettingsRoutingModule } from './settings-routing.module';
import { SharedModuleModule } from './../../shared-module/shared-module.module';
import { BuildRestrictionComponent } from './build_restriction/build_restriction.component';
import { RolesComponent } from './roles/roles.component';
import { SettingComponent } from './setting/setting.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../../shared/pipes/safe-html.pipe';
import { EditorModule } from 'primeng/editor';

@NgModule({
  declarations: [ BuildRestrictionComponent, RolesComponent, SettingComponent ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
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
    MatSlideToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    SharedModuleModule,
    MatRadioModule,
    MatDividerModule,
    MatListModule,
    
    NgxMaskModule.forRoot(),
    NgxMatSelectSearchModule,
    SafeHtmlPipe,
    EditorModule
  ],
  exports: [RouterModule]
})

export class SettingsModule { };