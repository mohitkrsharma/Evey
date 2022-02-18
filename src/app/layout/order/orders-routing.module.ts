import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LinkResidentComponent } from './link-resident/link-resident.component';
import { ListComponent } from './list/list.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Orders' },
    children: [
      {
        path: '',
        data: { breadcrumb: 'List Order' },
        component: ListComponent
      },
      {
        path: 'list',
        data: { breadcrumb: 'List Order' },
        component: ListComponent
      },
      // {
      //   path: 'linkResident/:id',
      //   data: { breadcrumb: 'Link Order Resident' },
      //   component: LinkResidentComponent
      // },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
