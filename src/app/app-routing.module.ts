import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared/guard/auth.guard';
import { LivedashGuard } from './shared/guard/livedash.guard';
import { SetnewpasswordComponent } from './password/setnewpassword/setnewpassword.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ForgotpasswordComponent } from './password/forgotpassword/forgotpassword.component';
import { NewtabComponent } from './newtab/newtab.component';
import { EmailnotificationsComponent } from './emailnotifications/emailnotifications.component';
import { SetpasswordComponent } from './password/setpassword/setpassword.component';
import { DesignComponent } from './design/design/design.component';
import { LoginComponent } from './layout/login/login.component';
const routes: Routes = [
    {
        path: '',
        component:LoginComponent
    },
    {
        path: 'login',
        component:LoginComponent
    },
    {
        path: 'forgot',
        component: ForgotpasswordComponent
    },
    {
        path: '',
        loadChildren: () => import('./layout/layout.module').then(m => m.LayoutModule)
    },
    {
        path: 'newtab',
        component: NewtabComponent
    },
    {
        path: 'newPassword/:id',
        component: SetnewpasswordComponent
    },
    {
        path: 'setNewPassword/:id/:valid_upto',
        component: SetpasswordComponent
    },
    // {
    //     path: 'livedashboard/:id',
    //     loadChildren: './livedashboard/livedashboard.module#LivedashboardModule'
    // },
    {
        path: 'livedashboard/:id',
        loadChildren: () => import('./temp-livedashboard/temp-livedashboard.module').then(m => m.TempLivedashboardModule)
    },
    {
        path: 'statusdashboard/:id',
        loadChildren: () => import('./statusdashboard/statusdashboard.module').then(m => m.StatusdashboardModule)
    },
     {
        path: 'alertdashboard/:id',
        loadChildren: () => import('./alertdashboard/alertdashboard.module').then(m => m.AlertdashboardModule)
    },
    {
        path: 'activitydashboard/:id',
        loadChildren: () => import('./activitydashboard/activitydashboard.module').then(m => m.ActivitydashboardModule)
    },
    {
        path: 'email_notifications',
        component: EmailnotificationsComponent
    },
    {
        path: 'design',
        component: DesignComponent
    },
    {
        path: '**',
        redirectTo: 'notfound'
    },
    {
        path: 'notfound',
        component: NotfoundComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
    providers: [AuthGuard, LivedashGuard]
})
export class AppRoutingModule { }
