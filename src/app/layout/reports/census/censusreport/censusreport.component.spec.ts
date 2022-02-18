import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CensusreportComponent } from './censusreport.component';

describe('CensusreportComponent', () => {
  let component: CensusreportComponent;
  let fixture: ComponentFixture<CensusreportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CensusreportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CensusreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
