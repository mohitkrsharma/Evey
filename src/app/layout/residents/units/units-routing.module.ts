import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';


const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Units' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        // component: ListComponent,
        loadChildren: () => import('src/app/layout/residents/units/list/list.module').then(m => m.ListModule),
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Unit'},
        loadChildren: () => import('src/app/layout/residents/units/form/form.module').then(m => m.FormModule),
      },
      {
         path: 'view/:id',
         data: { breadcrumb: 'View Unit'},
         loadChildren: () => import('src/app/layout/residents/units/view/view.module').then(m => m.ViewModule),
       },
       {
         path: 'form/:id',
         data: { breadcrumb: 'Edit Unit'},
         loadChildren: () => import('src/app/layout/residents/units/form/form.module').then(m => m.FormModule),
       },
       {
         path: 'form/:id/:org/:fac/:floor/:sector',
         data: { breadcrumb: 'Edit Unit'},
         loadChildren: () => import('src/app/layout/residents/units/form/form.module').then(m => m.FormModule),
       }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UnitsRoutingModule { }
