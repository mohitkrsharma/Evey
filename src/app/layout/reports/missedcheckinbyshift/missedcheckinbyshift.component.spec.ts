import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MissedcheckinbyshiftComponent } from './missedcheckinbyshift.component';

describe('MissedcheckinbyshiftComponent', () => {
  let component: MissedcheckinbyshiftComponent;
  let fixture: ComponentFixture<MissedcheckinbyshiftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MissedcheckinbyshiftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MissedcheckinbyshiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
