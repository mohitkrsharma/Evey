import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetreportComponent } from './getreport.component';

describe('GetreportComponent', () => {
  let component: GetreportComponent;
  let fixture: ComponentFixture<GetreportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GetreportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
