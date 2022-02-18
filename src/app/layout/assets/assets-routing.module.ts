import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';
import { TypesComponent } from './types/types.component';
const routes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: 'Assets'
    },
    children: [
      {
        path: '',
        data: {
          breadcrumb: null
        },
        component: ListComponent
      },
      {
        path: 'types',
        data: {
          breadcrumb: "Settings"
        },
        component: TypesComponent
      },
      {
        path: 'form',
        data: {
          breadcrumb: 'Add Asset'
        },
        component: FormComponent
      },
      {
        path: 'view/:id',
        data: {
          breadcrumb: 'View'
        },
        component: ViewComponent
      },
      {
        path: 'form/:id',
        data: {
          breadcrumb: 'Edit Asset'
        },
        component: FormComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssetsRoutingModule { }
