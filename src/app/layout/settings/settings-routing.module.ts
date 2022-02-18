import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingComponent } from './setting/setting.component';
import { BuildRestrictionComponent } from './build_restriction/build_restriction.component';
import { RolesComponent } from './roles/roles.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Global Settings' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: SettingComponent
      },
      {
        path: 'build_restriction',
        data: { breadcrumb: 'Build Restriction' },
        component: BuildRestrictionComponent
      },
      {
        path: 'roles',
        data: { breadcrumb: 'Roles & Permission' },
        component: RolesComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
