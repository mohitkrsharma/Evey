import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Users' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/users/list/list.module').then(m => m.UsersListModule),
      },
      {
        path: 'form',
        data: { breadcrumb: 'Add User' },
        loadChildren: () => import('src/app/layout/users/form/form.module').then(m => m.UsersFormModule),
      },
      {
        path: 'view/:id',
        data: { breadcrumb: 'View User' },
        loadChildren: () => import('src/app/layout/users/view/view.module').then(m => m.UsersViewModule),
      },
      {
        path: 'form/:id',
        data: { breadcrumb: 'Edit User' },
        loadChildren: () => import('src/app/layout/users/form/form.module').then(m => m.UsersFormModule),
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
