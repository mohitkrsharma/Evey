import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import { ListComponent } from './list/list.component';
// import { FormComponent } from './form/form.component';
// import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'NFC' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/nfc/list/list.module').then(m => m.NfcListModule),
        // component: ListComponent
      },
      // {
      //   path: 'form',
      //   data: { breadcrumb: 'Add NFC' },
      //   component: FormComponent
      // },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View NFC' },
        loadChildren: () => import('src/app/layout/nfc/view/view.module').then(m => m.NfcViewModule),
        // component: ViewComponent
      },
      // {
      //   path: 'form/:id',
      //   data: { breadcrumb: 'Edit NFC' },
      //   component: FormComponent
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NfcRoutingModule { }
