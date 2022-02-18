import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewVitalsButtonsComponent } from './view-vitals-buttons.component';

describe('ViewVitalsButtonsComponent', () => {
  let component: ViewVitalsButtonsComponent;
  let fixture: ComponentFixture<ViewVitalsButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewVitalsButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewVitalsButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
