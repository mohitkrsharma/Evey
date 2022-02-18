import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarebytimeComponent } from './carebytime.component';

describe('CarebytimeComponent', () => {
  let component: CarebytimeComponent;
  let fixture: ComponentFixture<CarebytimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarebytimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarebytimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
