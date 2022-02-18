import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleemployeeComponent } from './multipleemployee.component';

describe('MultipleemployeeComponent', () => {
  let component: MultipleemployeeComponent;
  let fixture: ComponentFixture<MultipleemployeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultipleemployeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleemployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
