import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusdashboardComponent } from './statusdashboard.component';

describe('StatusdashboardComponent', () => {
  let component: StatusdashboardComponent;
  let fixture: ComponentFixture<StatusdashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatusdashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
