import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderMgmtComponent } from './order-mgmt/order-mgmt.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Residents' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/residents/list/list.module').then(m => m.ResidentsListModule),
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add Resident' },
        loadChildren: () => import('src/app/layout/residents/form/form.module').then(m => m.ResidentsFormModule),
      },
      // {
      //   path: 'form/:id',
      //   data: { breadcrumb: 'Resident Profile' },
      //   loadChildren: 'src/app/layout/residents/form/form.module#ResidentsFormModule',
      // },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View Resident' },
        loadChildren: () => import('src/app/layout/residents/view/view.module').then(m => m.ResidentsViewModule),
      },    
      {
        path: 'form/:id',
        data: { breadcrumb: 'Resident Profile' },
        //component: FormComponent
        children: [
          {
            path: '',
            data: { breadcrumb: null},
            loadChildren: () => import('src/app/layout/residents/form/form.module').then(m => m.ResidentsFormModule),
          },
          {
            path: 'vitalHistory',
            data: { breadcrumb: 'Vital History'},
            loadChildren: () => import('src/app/layout/residents/vital-history/vital-history.module').then(m => m.ResidentsVitalHistoryModule),
          },
          {
            path: 'medication',
            data: { breadcrumb: 'Medication Update'},
            loadChildren: () => import('src/app/layout/medication/medication.module').then(m => m.MedicationModule),
          },
          {
            path: 'add_order',
            data: { breadcrumb: 'Add Order'},
            loadChildren: () => import('src/app/layout/medication/medication.module').then(m => m.MedicationModule),
          }
        ]
      },
      {
        path: 'order/:id',
        data: { breadcrumb: 'Order Management' },
        component: OrderMgmtComponent
        // loadChildren: 'src/app/layout/residents/order-mgmt/order-mgmt.module#ResidentsOrderMgmtModule',
      },
      {
        path: ':type',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/residents/list/list.module').then(m => m.ResidentsListModule),
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ResidentsRoutingModule { }
