import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { FormComponent } from "./form/form.component";

const routes: Routes = [
    {
        path: '',
        data: { breadcrumb: 'Goals' },
        //component: FormComponent
        children: [
            {
                path: '',
                data: { breadcrumb: null},
                component: FormComponent
            }
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class GoalsRoutingModule {}