import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentMedicationComponent } from './current-medication.component';

describe('CurrentMedicationComponent', () => {
  let component: CurrentMedicationComponent;
  let fixture: ComponentFixture<CurrentMedicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrentMedicationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrentMedicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
