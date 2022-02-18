import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FallDataReportComponent } from './fall-data-report.component';

describe('FallDataReportComponent', () => {
  let component: FallDataReportComponent;
  let fixture: ComponentFixture<FallDataReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FallDataReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FallDataReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
