import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { FormComponent } from './form/form.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Questionnaire' },
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        component: ListComponent,
      },
      {
        path: 'view/:questionnaire',
        data: { breadcrumb: 'Questions' },
        component: ViewComponent,
      },
      {
        path: 'form/:group',
        data: { breadcrumb: 'Add Question' },
        component: FormComponent,
      },
      {
        path: 'edit/:group/:id',
        data: { breadcrumb: 'Edit Question' },
        component: FormComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuestionnaireRoutingModule {}
