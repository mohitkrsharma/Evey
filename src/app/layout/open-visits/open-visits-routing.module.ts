import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OpenVisitsComponent } from './open-visits.component'
const routes: Routes = [
  {
    path: '', // beacons
   component: OpenVisitsComponent,
    children: [
      {
        path: '',
        component: OpenVisitsComponent
      }
     
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OpenVisitsRoutingModule { }
