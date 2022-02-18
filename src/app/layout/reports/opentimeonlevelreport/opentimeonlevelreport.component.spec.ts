import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpentimeonlevelreportComponent } from './opentimeonlevelreport.component';

describe('OpentimeonlevelreportComponent', () => {
  let component: OpentimeonlevelreportComponent;
  let fixture: ComponentFixture<OpentimeonlevelreportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpentimeonlevelreportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpentimeonlevelreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
