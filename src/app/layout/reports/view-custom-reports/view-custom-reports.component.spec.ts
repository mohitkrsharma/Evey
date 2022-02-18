import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCustomReportsComponent } from './view-custom-reports.component';

describe('ViewCustomReportsComponent', () => {
  let component: ViewCustomReportsComponent;
  let fixture: ComponentFixture<ViewCustomReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewCustomReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewCustomReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
