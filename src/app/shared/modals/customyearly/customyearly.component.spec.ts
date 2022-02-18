import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomYearlyComponent } from './customyearly.component';

describe('CustomYearlyComponent', () => {
  let component: CustomYearlyComponent;
  let fixture: ComponentFixture<CustomYearlyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomYearlyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomYearlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
