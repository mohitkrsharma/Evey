import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderMgmtComponent } from './order-mgmt.component';

describe('OrderMgmtComponent', () => {
  let component: OrderMgmtComponent;
  let fixture: ComponentFixture<OrderMgmtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderMgmtComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderMgmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
