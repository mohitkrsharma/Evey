import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarebyemployeeComponent } from './carebyemployee.component';

describe('CarebyemployeeComponent', () => {
  let component: CarebyemployeeComponent;
  let fixture: ComponentFixture<CarebyemployeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarebyemployeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarebyemployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
