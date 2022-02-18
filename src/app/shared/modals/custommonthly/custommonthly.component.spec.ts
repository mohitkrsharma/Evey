import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomMonthlyComponent } from './custommonthly.component';

describe('CustomMonthlyComponent', () => {
  let component: CustomMonthlyComponent;
  let fixture: ComponentFixture<CustomMonthlyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomMonthlyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomMonthlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
