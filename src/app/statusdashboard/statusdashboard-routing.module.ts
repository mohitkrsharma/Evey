import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StatusdashboardComponent } from './statusdashboard.component';

const routes: Routes = [
  { path: '', component: StatusdashboardComponent  },
  { path: ':id', component: StatusdashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StatusdashboardRoutingModule { }
