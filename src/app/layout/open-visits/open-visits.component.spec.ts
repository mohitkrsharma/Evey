import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenVisitsComponent } from './open-visits.component';

describe('OpenVisitsComponent', () => {
  let component: OpenVisitsComponent;
  let fixture: ComponentFixture<OpenVisitsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenVisitsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenVisitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
