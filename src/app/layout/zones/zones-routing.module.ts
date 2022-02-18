import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Zones'},
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/zones/list/list.module').then(m => m.ZonesListModule),
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Zone'},
        loadChildren: () => import('src/app/layout/zones/form/form.module').then(m => m.ZonesFormModule),
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Zone'},
        loadChildren: () => import('src/app/layout/zones/view/view.module').then(m => m.ZonesViewModule),
      },
      {
        path: 'form/:id',
        data: { breadcrumb: 'Edit Zone'},
        loadChildren: () => import('src/app/layout/zones/form/form.module').then(m => m.ZonesFormModule),
      },
      {
        path: 'form/:id/:org/:fac/:floor/:sector',
        data: { breadcrumb: 'Edit Zone'},
        loadChildren: () => import('src/app/layout/zones/form/form.module').then(m => m.ZonesFormModule),
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ZonesRoutingModule { }
