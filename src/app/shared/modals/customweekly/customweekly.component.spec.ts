import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomWeeklyComponent } from './customweekly.component';

describe('CustomWeeklyComponent', () => {
  let component: CustomWeeklyComponent;
  let fixture: ComponentFixture<CustomWeeklyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomWeeklyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomWeeklyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
