import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CareperdayComponent } from './careperday.component';

describe('CareperdayComponent', () => {
  let component: CareperdayComponent;
  let fixture: ComponentFixture<CareperdayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CareperdayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CareperdayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
