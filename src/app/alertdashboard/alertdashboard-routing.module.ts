import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AlertdashboardComponent } from './alertdashboard.component';

const routes: Routes = [
 { path: '', component: AlertdashboardComponent  },
  { path: 'alert', component: AlertdashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AlertdashboardRoutingModule { }
