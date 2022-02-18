import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule, MatCheckboxModule,MatIconModule, MatInputModule, MatProgressSpinnerModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// LOGIN
import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';
// DASHBOARD
import { DashboardModule } from './../dashboard/dashboard.module';
// import { DashboardComponent } from './../dashboard/dashboard.component';
@NgModule({
    imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        LoginRoutingModule,
        DashboardModule,
        MatInputModule,
        MatCheckboxModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        FlexLayoutModule.withConfig({addFlexToParent: false})
    ],
    declarations: [ 
        // LoginComponent 
    ]
})
export class LoginModule {}
