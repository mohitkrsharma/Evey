import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ListComponent } from "./list/list.component";

const routes: Routes = [
  {
    path: "",
    data: { breadcrumb: "User Positioning" },
    children: [
      {
        path: "",
        data: { breadcrumb: null },
        component: ListComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserPositioningRoutingModule {}
