import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Facility' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Facility' },
        component: FormComponent
      },
      {
        path:'view/:id',
        data: { breadcrumb: 'View Facility' },
        component: ViewComponent
      },
      {
        path:'form/:id',
        data: { breadcrumb: 'Edit Facility' },
        component:FormComponent
      },
      {
        path:'form/:id/:org',
        component:FormComponent
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FacilityRoutingModule { }
