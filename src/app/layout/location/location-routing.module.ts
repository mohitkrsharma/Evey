import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Location'},
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent
      },
    //   {
    //     path: 'form',
    //     data: { breadcrumb: 'Add Care'},
    //     component: FormComponent
    //   },
    //   {
    //     path: 'form/subcare/:parentId',
    //     data: { breadcrumb: 'Add Sub Care'},
    //     component: FormComponent
    //   },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Location'},
        component: ViewComponent
      },
    //   {
    //     path: 'form/:id',
    //     data: { breadcrumb: 'Edit Care'},
    //     component: FormComponent
    //   }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocationRoutingModule { }
