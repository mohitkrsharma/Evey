import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Visitors'},
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Visitor' },
        component: ViewComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VisitorsRoutingModule { }
