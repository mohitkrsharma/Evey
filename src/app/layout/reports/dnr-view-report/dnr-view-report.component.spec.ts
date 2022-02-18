import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationViewReportComponent } from './medication-view-report.component';

describe('MedicationViewReportComponent', () => {
  let component: MedicationViewReportComponent;
  let fixture: ComponentFixture<MedicationViewReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MedicationViewReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicationViewReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
