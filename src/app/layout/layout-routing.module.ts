import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from './../shared/guard/auth.guard';
import {LayoutComponent} from './layout.component';
import {ListComponent as MedicationListComponent} from './medication/list/list.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // {
      //     path: '',
      //     loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
      // },
      // {
      //     path: 'login',
      //     loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
      // },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'beacons',
        loadChildren: () =>
          import('./beacons/beacons.module').then((m) => m.BeaconsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'org',
        loadChildren: () => import('./org/org.module').then((m) => m.OrgModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./users/users.module').then((m) => m.UsersModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'facility',
        loadChildren: () =>
          import('./facility/facility.module').then((m) => m.FacilityModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'location',
        loadChildren: () =>
          import('./location/location.module').then((m) => m.LocationModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'floorsector',
        loadChildren: () =>
          import('./floorsector/floorsector.module').then(
            (m) => m.FloorsectorModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'zones',
        loadChildren: () =>
          import('./zones/zones.module').then((m) => m.ZonesModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'shifts',
        loadChildren: () =>
          import('./shifts/shifts.module').then((m) => m.ShiftsModule),
        // canActivate: [AuthGuard]
      },
      {
        path: 'residents',
        loadChildren: () =>
          import('./residents/residents.module').then((m) => m.ResidentsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'technicalsupport',
        loadChildren: () =>
          import('./technicalsupport/technicalsupport.module').then(
            (m) => m.TechnicalsupportModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'announcement',
        // loadChildren: './announcement/announcement.module#AnnouncementModule',
        loadChildren: () =>
          import('./announcement/announcement.module').then(
            (m) => m.AnnouncementModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'assets',
        loadChildren: () =>
          import('./assets/assets.module').then((m) => m.AssetsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'reports',
        // loadChildren: './reports/reports.module#ReportsModule',
        loadChildren: () =>
          import('./reports/reports.module').then((m) => m.ReportsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'scheduling',
        loadChildren: () =>
          import('./scheduling/scheduling.module').then(
            (m) => m.SchedulingModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'activity-scheduling',
        loadChildren: () =>
          import('./activitySchedule/scheduling.module').then(
            (m) => m.SchedulingModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'open-visits',
        loadChildren: () =>
          import('./open-visits/open-visits.module').then(
            (m) => m.OpenVisitsModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'orders-to-enter',
        loadChildren: () =>
          import('./orders-to-enter/orders-to-enter.module').then(
            (m) => m.OrdersToEnterModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'cares',
        loadChildren: () =>
          import('./cares/cares.module').then((m) => m.CaresModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'cares_level',
        loadChildren: () =>
          import('./care-level/care-level.module').then(
            (m) => m.CareLevelModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'createAQuestionnaire',
        loadChildren: () =>
          import('./questionnaire/questionnaire.module').then(
            (m) => m.QuestionnaireModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'visitors',
        loadChildren: () =>
          import('./visitors/visitors.module').then((m) => m.VisitorsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'nfc',
        loadChildren: () => import('./nfc/nfc.module').then((m) => m.NfcModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'dashboardlink',
        loadChildren: () =>
          import('./dashboardlink/dashboardlink.module').then(
            (m) => m.DashboardlinkModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.module').then((m) => m.SettingsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'symptoms',
        loadChildren: () =>
          import('./symptoms/symptoms.module').then((m) => m.SymptomsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'diseases',
        loadChildren: () =>
          import('./diseases/diseases.module').then((m) => m.DiseasesModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'userPositioning',
        loadChildren: () =>
          import('./userPositioning/userPositioning.module').then(
            (m) => m.UserPositioningModule
          ),
        canActivate: [AuthGuard],
      },
      // {
      //     path: 'medications',
      //     loadChildren: './medication/medication.module#MedicationModule',
      //     canActivate: [AuthGuard]
      // },
      {
        path: 'medications/list/:id',
        data: { breadcrumb: 'List Medication' },
        component: MedicationListComponent,
      },
      {
        path: 'pharmacy',
        loadChildren: () =>
          import('./pharmacy/pharmacy.module').then((m) => m.PharmacyModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'physician',
        loadChildren: () =>
          import('./physician/physician.module').then((m) => m.PhysicianModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'ordersToFile',
        loadChildren: () =>
          import('./order/orders.module').then((m) => m.OrdersModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'goals',
        loadChildren: () =>
          import('./goals/goals.module').then((m) => m.GoalsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'units',
        loadChildren: () =>
          import('./residents/units/units.module').then((m) => m.UnitsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'hospital',
        loadChildren: () =>
          import('./hospital/hospital.module').then((m) => m.HospitalModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'testingdevice',
        loadChildren: () =>
          import('./testingdevice/testingdevice.module').then((m) => m.TestingDeviceModule),
        canActivate: [AuthGuard],
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class LayoutRoutingModule {
}
