import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailnotificationsComponent } from './emailnotifications.component';

describe('EmailnotificationsComponent', () => {
  let component: EmailnotificationsComponent;
  let fixture: ComponentFixture<EmailnotificationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailnotificationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailnotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
