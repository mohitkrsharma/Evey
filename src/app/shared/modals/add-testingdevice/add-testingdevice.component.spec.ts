import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTestingDeviceComponent } from './add-testingdevice.component';

describe('AddTestingDeviceComponent', () => {
  let component: AddTestingDeviceComponent;
  let fixture: ComponentFixture<AddTestingDeviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTestingDeviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTestingDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
