import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TempLivedashboardComponent } from './temp-livedashboard.component';

describe('TempLivedashboardComponent', () => {
  let component: TempLivedashboardComponent;
  let fixture: ComponentFixture<TempLivedashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TempLivedashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TempLivedashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
