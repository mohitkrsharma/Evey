import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'angular-calendar';
import { CalendarHeaderComponent } from './calendar-header.component';
import { CalendarHeaderParttwoComponent } from './calendar-header-parttwo.component';

@NgModule({
  imports: [CommonModule, FormsModule, CalendarModule],
  declarations: [CalendarHeaderComponent, CalendarHeaderParttwoComponent],
  exports: [CalendarHeaderComponent, CalendarHeaderParttwoComponent]
})
export class CalendarUtilsModule {}
