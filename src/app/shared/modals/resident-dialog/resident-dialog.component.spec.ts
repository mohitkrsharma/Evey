import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResidentDialogComponent } from './resident-dialog.component';

describe('ResidentDialogComponent', () => {
  let component: ResidentDialogComponent;
  let fixture: ComponentFixture<ResidentDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResidentDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResidentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
