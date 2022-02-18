import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../shared/guard';
import { LivedashGuard } from '../shared/guard/livedash.guard';
import { TempLivedashboardComponent } from './temp-livedashboard.component';

const routes: Routes = [
  { path: '', component: TempLivedashboardComponent  },
  { path: ':fac', component: TempLivedashboardComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard, LivedashGuard]
})
export class TempLivedashboardRoutingModule { }
