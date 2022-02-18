import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusTransferredComponent } from './status-transferred.component';

describe('StatusTransferredComponent', () => {
  let component: StatusTransferredComponent;
  let fixture: ComponentFixture<StatusTransferredComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatusTransferredComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusTransferredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
