import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenTasksComponent } from './open-tasks.component';

describe('OpenTasksComponent', () => {
  let component: OpenTasksComponent;
  let fixture: ComponentFixture<OpenTasksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenTasksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
