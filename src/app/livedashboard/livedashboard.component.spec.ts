import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LivedashboardComponent } from './livedashboard.component';

describe('LivedashboardComponent', () => {
  let component: LivedashboardComponent;
  let fixture: ComponentFixture<LivedashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LivedashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LivedashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
