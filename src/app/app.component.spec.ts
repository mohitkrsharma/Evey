import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,
  } from '@angular/material';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './shared/store/auth/reducer';
import { shiftRep_Reducer } from './shared/store/shiftReport/reducer';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { CommonService } from './shared/services/common.service';


describe('AppComponent', () => {
    beforeEach(async(() => {
            TestBed.configureTestingModule({
      imports:[ToastrModule.forRoot({ maxOpened: 1, autoDismiss: true, timeOut: 2000, preventDuplicates: true, }),
HttpClientModule,StoreModule.forRoot({ authState: authReducer, shiftRepState: shiftRep_Reducer }),MatButtonModule, MatIconModule, MatProgressSpinnerModule,
        MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,RouterTestingModule],
            declarations: [AppComponent],
            providers: [CommonService],
        }).compileComponents();
    }));
    it('should create the app', async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    }));
    // it(`should have as title 'app'`, async(() => {
    //     const fixture = TestBed.createComponent(AppComponent);
    //     const app = fixture.debugElement.componentInstance;
    //     expect(app.title).toEqual('app');
    // }));
    // it('should render title in a h1 tag', async(() => {
    //     const fixture = TestBed.createComponent(AppComponent);
    //     fixture.detectChanges();
    //     const compiled = fixture.debugElement.nativeElement;
    //     expect(compiled.querySelector('h1').textContent).toContain(
    //         'Welcome to app!'
    //     );
    // }));
});
