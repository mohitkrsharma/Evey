import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarebyuseComponent } from './carebyuse.component';

describe('CarebyuseComponent', () => {
  let component: CarebyuseComponent;
  let fixture: ComponentFixture<CarebyuseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarebyuseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarebyuseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
