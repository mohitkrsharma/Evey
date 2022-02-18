import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ActivitydashboardComponent } from './activitydashboard.component';

const routes: Routes = [
 { path: '', component: ActivitydashboardComponent  },
  { path: 'activity', component: ActivitydashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActivitydashboardRoutingModule { }
