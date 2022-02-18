import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CalendarView } from 'angular-calendar';

@Component({
  selector: 'mwl-utils-calendar-header',
  template: `
    <div class="row text-center">
      <div class="col-md-4">
        <div class="btn-group">
          <button class="mat-stroked-button ml-3"
            mwlCalendarPreviousView
            [view]="view"
            [(viewDate)]="viewDate"
            (viewDateChange)="viewDateChange.next(viewDate)"
          >
           <span class="mat-button-wrapper date_btn"> Previous</span>
			<div class="mat-button-ripple mat-ripple"></div>
			<div class="mat-button-focus-overlay"></div>
          </button>
          <button
            class="mat-stroked-button ml-3"
            mwlCalendarToday
            [(viewDate)]="viewDate"
            (viewDateChange)="viewDateChange.next(viewDate)"
          >
            <span class="mat-button-wrapper date_btn"> Today</span>
<div class="mat-button-ripple mat-ripple"></div>
			<div class="mat-button-focus-overlay"></div>
          </button>
          <button
            class="mat-stroked-button ml-3"
            mwlCalendarNextView
            [view]="view"
            [(viewDate)]="viewDate"
            (viewDateChange)="viewDateChange.next(viewDate)"
          >
            <span class="mat-button-wrapper date_btn"> Next</span>
<div class="mat-button-ripple mat-ripple"></div>
			<div class="mat-button-focus-overlay"></div>
          </button>
        </div>
      </div>
      <div class="col-md-4">
        <h3>{{ viewDate | calendarDate: view + 'ViewTitle':locale }}</h3>
      </div>
    </div>
    <br />
  `
})
export class CalendarHeaderComponent {
  @Input() view: CalendarView | 'week' | 'day';

  @Input() viewDate: Date;

  @Input() locale: string = 'en';

  @Output() viewChange: EventEmitter<string> = new EventEmitter();

  @Output() viewDateChange: EventEmitter<Date> = new EventEmitter();
}
