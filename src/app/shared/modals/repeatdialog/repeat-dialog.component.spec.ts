import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepeatDialogComponent } from './repeat-dialog.component';

describe('RepeatDialogComponent', () => {
  let component: RepeatDialogComponent;
  let fixture: ComponentFixture<RepeatDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepeatDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepeatDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
