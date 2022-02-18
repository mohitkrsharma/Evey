import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login.component';

const routes: Routes = [
    {
        path: '',
        component: LoginComponent
        // outlet: "mainapp", 
        // children: [
        //     { 
        //         path: 'dashboard',
        //         loadChildren: './../dashboard/dashboard.module#DashboardModule'
        //     }
        // ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LoginRoutingModule {}
