import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomMedicationReportComponent } from './custom-medication-report.component';

describe('CustomMedicationReportComponent', () => {
  let component: CustomMedicationReportComponent;
  let fixture: ComponentFixture<CustomMedicationReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomMedicationReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomMedicationReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
