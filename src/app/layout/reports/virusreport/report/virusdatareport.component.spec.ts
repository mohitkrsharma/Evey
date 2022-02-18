/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { VirusdatareportComponent } from './virusdatareport.component';

describe('VirusdatareportComponent', () => {
  let component: VirusdatareportComponent;
  let fixture: ComponentFixture<VirusdatareportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VirusdatareportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VirusdatareportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


