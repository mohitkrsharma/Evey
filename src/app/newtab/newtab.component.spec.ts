import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatIconModule, MatProgressSpinnerModule,MatCardModule,
  MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,
} from '@angular/material';

import { NewtabComponent } from './newtab.component';

describe('NewtabComponent', () => {
  let component: NewtabComponent;
  let fixture: ComponentFixture<NewtabComponent>;

  beforeEach(async(() => {
        TestBed.configureTestingModule({
      imports:[MatButtonModule, MatIconModule, MatProgressSpinnerModule,MatCardModule,
        MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule],
      declarations: [ NewtabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewtabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
