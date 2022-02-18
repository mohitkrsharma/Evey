import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalHistoryComponent } from './vital-history.component';

describe('VitalHistoryComponent', () => {
  let component: VitalHistoryComponent;
  let fixture: ComponentFixture<VitalHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VitalHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VitalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
