import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestingreportComponent } from './testingreport.component';

describe('TestingreportComponent', () => {
  let component: TestingreportComponent;
  let fixture: ComponentFixture<TestingreportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestingreportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestingreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
