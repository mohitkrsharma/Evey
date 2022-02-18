import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        data: { breadcrumb: 'List Hospital' },
        component: ListComponent,
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Hospital'},
        component: ViewComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HospitalRoutingModule { }
