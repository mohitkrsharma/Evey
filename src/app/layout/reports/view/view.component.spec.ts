import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {MatDialogModule,MatPaginatorModule,MatSlideToggleModule,MatSortModule,MatTableModule,MatButtonModule, MatIconModule, MatProgressSpinnerModule,MatCardModule,
  MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,
} from '@angular/material';
import { ViewComponent } from './view.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonService } from '../../../shared/services/common.service';
import { ConstantsService } from '../../../shared/services/constants.service';
import { SanitizeTextPipe } from '../../../shared/pipes/sanitize-text';
import { StoreModule } from '@ngrx/store';
import { authReducer } from '../../../shared/store/auth/reducer';
import { shiftRep_Reducer } from '../../../shared/store/shiftReport/reducer';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { Aes256Service } from './../../../shared/services/aes-256/aes-256.service';
import { ExcelService } from './../../../shared/services/excel.service';
import { ApiService } from './../../../shared/services/api/api.service';


describe('ViewComponent', () => {
  let component: ViewComponent;
  let fixture: ComponentFixture<ViewComponent>;

  beforeEach(async(() => {
        TestBed.configureTestingModule({
      imports:[BrowserAnimationsModule,ReactiveFormsModule,FormsModule,ToastrModule.forRoot({ maxOpened: 1, autoDismiss: true, timeOut: 2000, preventDuplicates: true, }),
HttpClientModule,StoreModule.forRoot({ authState: authReducer, shiftRepState: shiftRep_Reducer }),MatButtonModule, MatIconModule, MatProgressSpinnerModule,MatCardModule,
        MatCheckboxModule,MatDialogModule,MatTableModule,MatSlideToggleModule,MatPaginatorModule,MatSortModule,MatInputModule,MatRadioModule,MatExpansionModule,MatSelectModule,RouterTestingModule],
      declarations: [ ViewComponent,SanitizeTextPipe],
      providers: [CommonService,ConstantsService,Aes256Service,ExcelService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
