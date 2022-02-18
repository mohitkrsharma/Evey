import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Scheduling' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadChildren: () => import('src/app/layout/activitySchedule/schedule/schedule.module').then(m => m.ActivityScheduleModule),
      },
      {
        path: 'create',
        data: { breadcrumb: 'Schedule Activity' },
        loadChildren: () => import('src/app/layout/activitySchedule/form/form.module').then(m => m.SchedulingFormModule),
      },
      {
        path: 'edit/:id',
        data: { breadcrumb: 'Edit Schedule Activity' },
        loadChildren: () => import('src/app/layout/activitySchedule/form/form.module').then(m => m.SchedulingFormModule),
      },
    //   {
    //     path: 'list',
    //     data: { breadcrumb: 'Care List' },
    //     loadChildren: () => import('src/app/layout/scheduling/list/list.module').then(m => m.SchedulingListModule),
    //   },
      {
        path: 'day_list/:timestamp',
        data: { breadcrumb: "Today's Activities" },
        loadChildren: () => import('src/app/layout/activitySchedule/list/list.module').then(m => m.SchedulingListModule),
      },
    //   {
    //     path: 'rulecare',
    //     data: { breadcrumb: 'Rule Care' },
    //     loadChildren: () => import('src/app/layout/scheduling/rule-care/rule-care.module').then(m => m.SchedulingRuleCareModule),
    //   },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SchedulingRoutingModule { }



