import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
 import { DashboardComponent } from './dashboard.component';
import { OpenVisitsComponent } from './../open-visits/open-visits.component';

const routes: Routes = [
    {
        path: '',
        data: {
            breadcrumb: 'Dashboard'
          },
        component: DashboardComponent
       // component: OpenVisitsComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardRoutingModule {}
