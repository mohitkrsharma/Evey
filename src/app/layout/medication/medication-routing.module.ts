import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';

// const routes: Routes = [
//   {
//     path: 'medicationForm',
//     data: { breadcrumb: null },
//     children: [
//       {
//         path: '',
//         data: { breadcrumb: null },
//         component: ViewComponent
//       },
//       {
//         path: 'form',
//         data: { breadcrumb: 'Add Medication' },
//         component: FormComponent
//       },
//       // {
//       //   path: 'list/:id',
//       //   data: { breadcrumb: 'List Medication' },
//       //   component: ListComponent
//       // },
//       {
//         path: 'form/:id',
//         data: { breadcrumb: 'Medication Update' },
//         component: FormComponent
//       }
//     ]
//   }
// ];

const routes: Routes = [
  // {
  //   path: '',
  //   data: { breadcrumb: null },
  //   redirectTo: 'form',
  //   pathMatch: 'full'
  // },
  {
    path: '',
    data: { breadcrumb: null },
    component: FormComponent
  },
  {
    path: ':medication_id',
    data: { breadcrumb: null },
    component: FormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MedicationRoutingModule { }
