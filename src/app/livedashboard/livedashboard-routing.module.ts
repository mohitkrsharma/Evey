import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LivedashboardComponent } from './livedashboard.component';
import { AuthGuard } from './../shared/guard/auth.guard';
import { LivedashGuard } from './../shared/guard/livedash.guard';

const routes: Routes = [
    { path: '', component: LivedashboardComponent  },
    { path: ':fac', component: LivedashboardComponent},
    // { path: 'edit-create', component: AddComponent },
    // { path: 'validation-engine', component: ValidationComponent },
    // { path: 'print', component: PrintComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard, LivedashGuard]
})
export class LivedashboardRoutingModule { }
