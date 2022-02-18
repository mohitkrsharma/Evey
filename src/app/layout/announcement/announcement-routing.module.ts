import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';
const routes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: 'Annoucement'
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
        path: 'form',
        data: {
          breadcrumb: 'Add New'
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
        component: FormComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnnouncementRoutingModule { }
