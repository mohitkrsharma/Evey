import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleCareComponent } from './rule-care.component';

describe('RuleCareComponent', () => {
  let component: RuleCareComponent;
  let fixture: ComponentFixture<RuleCareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RuleCareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleCareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
