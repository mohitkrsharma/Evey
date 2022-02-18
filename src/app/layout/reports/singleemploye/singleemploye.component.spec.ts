import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleemployeComponent } from './singleemploye.component';

describe('SingleemployeComponent', () => {
  let component: SingleemployeComponent;
  let fixture: ComponentFixture<SingleemployeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SingleemployeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleemployeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
