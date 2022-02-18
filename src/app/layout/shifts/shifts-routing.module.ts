import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//component imports
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';

//Routes
const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Shifts'},
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Shift'},
        component: FormComponent
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Shift'},
        component: ViewComponent
      },
      {
        path: 'form/:id',
        data: { breadcrumb: 'Edit Shift'},
        component: FormComponent
      },
      /*{
        path: 'form/:id/:org/:fac/:floor/:sector',
        data: { breadcrumb: 'Edit Zone'},
        component: FormComponent
      }*/
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShiftsRoutingModule { }
