import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';
const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Floors/Sectors' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Floors/Sectors' },
        component: FormComponent
      },
      {
        path:'view/:id',
        data: { breadcrumb: 'View Floors/Sector' },
        component: ViewComponent
      },
      {
        path:'form/:id',
        data: { breadcrumb: 'Edit Floors/Sectors' },
        component: FormComponent
      },
      {
        path: 'form/:id/:org/:fac',
        data: { breadcrumb: 'View Floors/Sectors' },
        component: FormComponent
      },
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FloorsectorRoutingModule { }
