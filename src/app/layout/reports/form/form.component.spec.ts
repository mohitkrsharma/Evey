import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatButtonModule, MatIconModule, MatProgressSpinnerModule,MatCardModule,
  MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,MatTableModule
} from '@angular/material';
import { FormComponent } from './form.component';
import { StoreModule } from '@ngrx/store';
import { authReducer } from '../../../shared/store/auth/reducer';
import { shiftRep_Reducer } from '../../../shared/store/shiftReport/reducer';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { CommonService } from '../../../shared/services/common.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SanitizeTextPipe } from '../../../shared/pipes/sanitize-text';
import { ConstantsService } from '../../../shared/services/constants.service';
// import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { environment } from '../../../../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExcelService } from './../../../shared/services/excel.service';
// const config: SocketIoConfig = { url: environment.config.socket_url, options: {} };


describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async(() => {
        TestBed.configureTestingModule({
      imports:[BrowserAnimationsModule,ReactiveFormsModule,FormsModule,ToastrModule.forRoot({ maxOpened: 1, autoDismiss: true, timeOut: 2000, preventDuplicates: true, }),
HttpClientModule,StoreModule.forRoot({ authState: authReducer, shiftRepState: shiftRep_Reducer }),MatTableModule,MatButtonModule, MatIconModule, MatProgressSpinnerModule,MatCardModule,
        MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,RouterTestingModule], // ,SocketIoModule.forRoot(config)
      declarations: [ FormComponent,SanitizeTextPipe],
      providers: [CommonService,ConstantsService,ExcelService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
