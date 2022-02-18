import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarebyresidentComponent } from './carebyresident.component';

describe('CarebyresidentComponent', () => {
  let component: CarebyresidentComponent;
  let fixture: ComponentFixture<CarebyresidentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarebyresidentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarebyresidentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
