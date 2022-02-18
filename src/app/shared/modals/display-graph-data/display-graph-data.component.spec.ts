import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayGraphDataComponent } from './display-graph-data.component';

describe('DisplayGraphDataComponent', () => {
  let component: DisplayGraphDataComponent;
  let fixture: ComponentFixture<DisplayGraphDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayGraphDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayGraphDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
