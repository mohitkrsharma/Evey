import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import { BeaconsComponent } from './beacons.component';
// import { ListComponent } from './list/list.component';
// import { FormComponent } from './form/form.component';
// import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '', // beacons
    data: { breadcrumb: 'Beacons' },
    // component: BeaconsComponent,
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/beacons/list/list.module').then(m => m.BeaconsListModule),
        // component: ListComponent
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Beacon' },
        loadChildren: () => import('src/app/layout/beacons/form/form.module').then(m => m.BeaconsFormModule),
        // component: FormComponent
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Beacon' },
        loadChildren: () => import('src/app/layout/beacons/view/view.module').then(m => m.BeaconsViewModule),
        // component: ViewComponent
      },
      {
        path:'edit/:id',
        data: { breadcrumb: 'Edit Beacon' },
        loadChildren: () => import('src/app/layout/beacons/form/form.module').then(m => m.BeaconsFormModule),
        // component:FormComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BeaconsRoutingModule { }
