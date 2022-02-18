import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
 import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Organization' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Organization' },
        component: FormComponent
      },
      {
        path:'view/:id',
        data: { breadcrumb: 'View Organization' },
        component:ViewComponent
      },
      {
        path:'form/:id',
        data: { breadcrumb: 'Edit Organization' },
        component:FormComponent
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrgRoutingModule { }



// import { BeaconsComponent } from './beacons.component';



@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BeaconsRoutingModule { }

