import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkResidentComponent } from './link-resident.component';

describe('LinkResidentComponent', () => {
  let component: LinkResidentComponent;
  let fixture: ComponentFixture<LinkResidentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinkResidentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkResidentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
