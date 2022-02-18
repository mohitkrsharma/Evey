import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormComponent } from './form/form.component';
import { GetreportComponent } from './getreport/getreport.component';
import { ViewComponent } from './view/view.component';
import { CarebyuseComponent } from './carebyuse/carebyuse.component';
import { CarebyresidentComponent } from './carebyresident/carebyresident.component';
import { MultipleemployeeComponent } from './multipleemployee/multipleemployee.component';
import { CarebyemployeeComponent } from './carebyemployee/carebyemployee.component';
import { CareperdayComponent } from './careperday/careperday.component';
import { CarebytimeComponent } from './carebytime/carebytime.component';
import { SingleemployeComponent } from './singleemploye/singleemploye.component';
import { ShiftperformancereportComponent } from './shiftperformancereport/shiftperformancereport.component';
import { ShiftreportComponent } from './shiftperformancereport/shiftreport/shiftreport.component';
import { ViewCustomReportsComponent } from './view-custom-reports/view-custom-reports.component';
import { CarechartComponent } from './charts/carechart/carechart.component';
import { MissedcheckinbyshiftComponent } from './missedcheckinbyshift/missedcheckinbyshift.component';
import { ListComponent } from './activity/list.component';

import { RoomCleaningReportComponent } from './roomcleaningreport/roomcleaningreport.component';
import { RoomCleanReportComponent } from './roomcleaningreport/roomcleanreport/roomcleanreport.component';
import { VitalReportComponent } from './vitalreport/vitalreport.component';
import { VitalsReportComponent } from './vitalreport/report/vitalsreport.component';
import { VirusReportComponent } from './virusreport/virusreport.component';
import { VirusdatareportComponent } from './virusreport/report/virusdatareport.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';

// Fallcare imports
import { FallDataReportComponent } from './fallcarereport/report/fall-data-report.component';
import { ReportComponent} from './refusedcare/report/report.component';
import { TestingreportComponent } from './testingreport/report/testingreport.component';
import { MedicationViewReportComponent } from './medication-view-report/medication-view-report.component';
import { DnrViewReportComponent } from './dnr-view-report/dnr-view-report.component';
import { CustomMedicationReportComponent } from './custom-medication-report/custom-medication-report.component';
import { DNRReportComponent } from './dnr-report/dnr-report.component';
import { CensusreportComponent } from './census/censusreport/censusreport.component';
import { OpentimeonlevelreportComponent } from './opentimeonlevelreport/opentimeonlevelreport.component';
import { AssessmentReportComponent } from './assessment-report/assessment-report.component';
const routes: Routes = [
  {
    path: '',
    data: {
      breadcrumb: 'Reports',
    },
    children: [
      {
        path: '',
        data: {
          breadcrumb: null,
        },
        component: FormComponent,
      },
      {
        path: 'report',
        data: { breadcrumb: 'Build Custom Report' },
        // component: GetreportComponent,
        children: [
          {
            path: '',
            data: {
              breadcrumb: null,
            },
            component: GetreportComponent,
          },
          {
            path: 'view/:id',
            data: { breadcrumb: 'View Custom Report' },
            component: ViewComponent,
          },
        ],
      },
      // {
      //   path: 'view/:id',
      //   data: {  breadcrumb: 'View Custom Report' },
      //   component: ViewComponent
      // },
      {
        path: 'careby/use',
        data: { breadcrumb: 'Use' },
        component: CarebyuseComponent,
      },
      {
        path: 'careby/resident',
        data: { breadcrumb: 'Resident' },
        component: CarebyresidentComponent,
      },
      {
        path: 'careby/multiple/employee',
        data: { breadcrumb: 'Employee' },
        component: MultipleemployeeComponent,
      },
      {
        path: 'careby/employee',
        data: { breadcrumb: 'Employeessss' },
        component: CarebyemployeeComponent,
      },
      {
        path: 'careperday',
        data: { breadcrumb: 'Per Day' },
        component: CareperdayComponent,
      },
      {
        path: 'carechart',
        data: { breadcrumb: 'Care Within 24 Hours or Shift' },
        component: CarechartComponent,
      },
      {
        path: 'careby/time',
        data: { breadcrumb: 'Time' },
        component: CarebytimeComponent,
      },
      {
        path: 'careby/single/employee',
        data: { breadcrumb: 'Single Employee' },
        component: SingleemployeComponent,
      },
      {
        path: 'shiftcereport',
        data: { breadcrumb: 'Shift performance Report' },
        component: ShiftperformancereportComponent,
      },
      {
        path: 'shiftperformancereport',
        data: { breadcrumb: 'Shift Performance Report' },
        component: ShiftreportComponent,
      },
      {
        path: 'view/custom/report',
        data: { breadcrumb: 'View Custom Report' },
        component: ViewCustomReportsComponent,
      },
      {
        path: 'missedlevel1checkin',
        data: { breadcrumb: 'Missed level 1 Check In' },
        component: MissedcheckinbyshiftComponent,
      },
      {
        path: 'census',
        data: { breadcrumb: 'Census Report' },
        component: CensusreportComponent,
      },
      {
        path: 'dnr',
        data: { breadcrumb: 'DNR Report' },
        component: DNRReportComponent,
      },
      {
        path: 'activity',
        data: { breadcrumb: 'Activity' },
        component: ListComponent,
      },
      {
        path: 'roomcleaningreport',
        data: { breadcrumb: 'Room Clean Report' },
        component: RoomCleaningReportComponent,
      },
      {
        path: 'roomcleanreport',
        data: { breadcrumb: 'Room Clean Report' },
        component: RoomCleanReportComponent,
      },
      {
        path: 'vitalreport',
        data: { breadcrumb: 'Vital Report' },
        component: VitalReportComponent,
      },
      {
        path: 'vitalsreport',
        data: { breadcrumb: 'Vital Report' },
        component: VitalsReportComponent,
      },
      {
        path: 'virusreport',
        data: { breadcrumb: 'Virus Check Report' },
        component: VirusReportComponent,
      },
      {
        path: 'virussreport',
        data: { breadcrumb: 'Virus Check Report' },
        component: VirusdatareportComponent,
      },
      {
        path: 'falldatareport',
        data: { breadcrumb: 'Fall Care Report' },
        component: FallDataReportComponent,
      },
      {
        path: 'refusedcare',
        data: { breadcrumb: 'Refused Care Report' },
        component: ReportComponent,
      },
      {
        path: 'testingreport',
        data: { breadcrumb: 'Testing History Report' },
        component: TestingreportComponent,
      },
      {
        path: 'viewmedreport',
        data: { breadcrumb: 'View Medication Report' },
        component: MedicationViewReportComponent,
      },
      {
        path: 'viewdnrreport',
        data: { breadcrumb: 'View DNR Report' },
        component: DnrViewReportComponent,
      },
      {
        path: 'timeonLevelsReport',
        data: { breadcrumb: 'Time on Levels Report' },
        component: OpentimeonlevelreportComponent,
      },
      {
        path: 'viewinventoryreport',
        data: { breadcrumb: 'View Inventory Report' },
        component: InventoryReportComponent,
      },
      {
        path: 'viewassessmentreport',
        data: { breadcrumb: 'View Assessment Report' },
        component: AssessmentReportComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
