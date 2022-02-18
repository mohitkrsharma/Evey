import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnFacilityChangeComponent } from './on-facility-change.component';

describe('OnFacilityChangeComponent', () => {
  let component: OnFacilityChangeComponent;
  let fixture: ComponentFixture<OnFacilityChangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnFacilityChangeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnFacilityChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
