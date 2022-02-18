import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersToEnterComponent } from './orders-to-enter.component';

describe('OrdersToEnterComponent', () => {
  let component: OrdersToEnterComponent;
  let fixture: ComponentFixture<OrdersToEnterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdersToEnterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersToEnterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
