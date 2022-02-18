import { NgModule } from "@angular/core";
import { GoalsRoutingModule } from "./goals-routing.module";
import { FormComponent } from './form/form.component';
import { MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTabsModule } from "@angular/material";
import { FormsModule } from "@angular/forms";
import { NgxMatSelectSearchModule } from "ngx-mat-select-search";
import { CommonModule } from "@angular/common";
import { SafeHtmlPipe } from "src/app/shared/pipes/safe-html.pipe";

@NgModule({
    imports: [
        GoalsRoutingModule,
        MatCardModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        NgxMatSelectSearchModule,
        CommonModule,
        MatIconModule,
        MatButtonModule,
        SafeHtmlPipe
    ],
    declarations: [ FormComponent ]
})
export class GoalsModule {}