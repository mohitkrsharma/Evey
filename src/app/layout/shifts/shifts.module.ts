import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ShiftsRoutingModule } from "./shifts-routing.module";

import { ListComponent } from "./list/list.component";
import { FormComponent } from "./form/form.component";
import { ViewComponent } from "./view/view.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
	MatButtonModule,
	MatCheckboxModule,
	MatInputModule,
	MatCardModule,
	MatProgressSpinnerModule,
	MatMenuModule,
	MatIconModule,
	MatToolbarModule,
	MatFormFieldModule,
	MatSelectModule,
	MatSortModule,
	MatTableModule,
	MatPaginatorModule,
	MatRadioModule,
	MatDividerModule,
	MatListModule,
} from "@angular/material";
import { SharedModuleModule } from "src/app/shared-module/shared-module.module";
import { NgxMaskModule } from "ngx-mask";
import { CalendarModule } from "primeng/calendar";
import { TimePickerModule } from '@syncfusion/ej2-angular-calendars';
@NgModule({
	imports: [
		CommonModule,
		ShiftsRoutingModule,
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatCheckboxModule,
		MatInputModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatMenuModule,
		MatIconModule,
		MatToolbarModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatSortModule,
		MatTableModule,
		MatPaginatorModule,
		SharedModuleModule,
		MatRadioModule,
		MatDividerModule,
		MatListModule,
		NgxMaskModule.forRoot(),
		CalendarModule,
		TimePickerModule
	],
	declarations: [ListComponent, FormComponent, ViewComponent],
})
export class ShiftsModule {}
