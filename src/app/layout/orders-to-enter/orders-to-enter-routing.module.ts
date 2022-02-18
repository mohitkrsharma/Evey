import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrdersToEnterComponent } from './orders-to-enter.component'
const routes: Routes = [
  {
    path: '', // beacons
   component: OrdersToEnterComponent,
    children: [
      {
        path: '',
        component: OrdersToEnterComponent
      }
     
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersToEnterRoutingModule { }
