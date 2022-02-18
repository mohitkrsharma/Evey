import { LayoutModule } from '@angular/cdk/layout';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgModule,NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PersistenceModule } from 'angular-persistence';
import { ChartsModule } from 'ng2-charts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatInputModule, MatRadioModule, MatExpansionModule, MatSelectModule,
    MatCardModule,MatMenuModule, MatPaginatorModule } from '@angular/material';
import { MatTooltipModule } from '@angular/material/tooltip';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {MatStepperModule} from '@angular/material';
import { ToastrModule } from 'ngx-toastr';
import { AgmCoreModule } from '@agm/core';
import { MatIconRegistry } from '@angular/material/icon';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule, MatRippleModule} from '@angular/material/core';
import 'hammerjs';

// SOCKET
// import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { environment } from './../environments/environment';
// const config: SocketIoConfig = { url: environment.config.socket_url, options: { } };
import { SocketService } from './shared/services/socket/socket.service';
import { CookieService } from 'ngx-cookie-service';

/////////////////////////////////////////////////////////////////////////////

// import Store from './shared/store';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiService } from './shared/services/api/api.service';
import { CommonService } from './shared/services/common.service';
import { ConstantsService } from './shared/services/constants.service';
import { SearchFilterBYPipe } from './shared/services/search-filter-by.pipe';
import { Aes256Service } from './shared/services/aes-256/aes-256.service';
import { ScheduleModalComponent } from './shared/modals/schedule-modal/schedule-modal.component';
import { NgxMaskModule } from 'ngx-mask';
import { AlertComponent } from './shared/modals/alert/alert.component';
import { ConfirmComponent } from './shared/modals/confirm-box/confirm-box.component';
import { RepeatDialogComponent } from './shared/modals/repeatdialog/repeat-dialog.component';
import { CustomWeeklyComponent } from './shared/modals/customweekly/customweekly.component';
import { CustomMonthlyComponent } from './shared/modals/custommonthly/custommonthly.component';
import { CustomYearlyComponent } from './shared/modals/customyearly/customyearly.component';
import { ExcelService } from './shared/services/excel.service';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { SavereportComponent } from './shared/modals/savereport/savereport.component';
import { SetnewpasswordComponent } from './password/setnewpassword/setnewpassword.component';
import { SetpasswordComponent } from './password/setpassword/setpassword.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ForgotpasswordComponent } from './password/forgotpassword/forgotpassword.component';
import { NewtabComponent } from './newtab/newtab.component';
import { MatTableModule, MatSortModule } from '@angular/material';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './shared/store/auth/reducer';
import { shiftRep_Reducer } from './shared/store/shiftReport/reducer';
import { privilegeRep_Reducer } from './shared/store/privilege/reducer';
import { DECLARATIONS, PROVIDERS, IMPORTS } from './shared/exports/exports';
import { EmergencyContactComponent } from './shared/modals/emergency-contact/emergency-contact.component';
import { SupportContactComponent } from './shared/modals/support-contact/support-contact.component';
import { OpenTasksComponent } from './shared/modals/open-tasks/open-tasks.component';
import { EmailnotificationsComponent } from './emailnotifications/emailnotifications.component';
import { SafeHtmlPipe } from './../app/shared/pipes/safe-html.pipe';
import { EditorModule } from 'primeng/editor';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatDialogModule } from '@angular/material/dialog';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { DesignComponent } from './design/design/design.component';
import { RestoreComponent } from './shared/modals/restore/restore.component';
import { NgxMatDrpModule } from 'ngx-mat-daterange-picker';
import { SharedModuleModule } from '../app/shared-module/shared-module.module';
import { AddPharmacyComponent } from './shared/modals/add-pharmacy/add-pharmacy.component';
import { AddPhysicianComponent } from './shared/modals/add-physician/add-physician.component';
import { AddRecipientComponent } from './shared/modals/add-recipient/add-recipient.component';
import { ResidentDialogComponent } from './shared/modals/resident-dialog/resident-dialog.component';
import { DragNDropUploadComponent } from './shared/modals/dragndropupload/dragndropupload.component';
import { DndDirective } from './shared/modals/dragndropupload/dnd.directive';
import { ProgressComponent } from './shared/modals/dragndropupload/progress/progress.component';
import { AddDrugComponent } from './shared/modals/add-drug/add-drug.component';
import { StatusTransferredComponent } from './shared/modals/status-transferred/status-transferred.component';
import { OnFacilityChangeComponent } from './shared/modals/on-facility-change/on-facility-change.component';
import { DisplayGraphDataComponent } from './shared/modals/display-graph-data/display-graph-data.component';
import { ViewVitalsButtonsComponent } from './shared/modals/view-vitals-buttons/view-vitals-buttons.component';
import { ViewOrderComponent } from './shared/modals/view-order/view-order.component';
import { CalendarModule} from 'primeng/primeng';
// import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { LoginComponent } from './layout/login/login.component';
import { AddHospitalComponent } from './shared/modals/add-hospital/add-hospital.component';
import { AddTestingDeviceComponent } from './shared/modals/add-testingdevice/add-testingdevice.component';
import { AddSymptomComponent } from './shared/modals/add-symptom/add-symptom.component';
import { AddLocationComponent } from './shared/modals/add-location/add-location.component';
import { AddDepartmentComponent } from './shared/modals/add-department/add-department.component';

@NgModule({
    declarations: [
        AppComponent,
        ScheduleModalComponent,
        AlertComponent,
        ConfirmComponent,
        RepeatDialogComponent,
        CustomWeeklyComponent,
        CustomMonthlyComponent,
        CustomYearlyComponent,
        SavereportComponent,
        NotfoundComponent,
        ForgotpasswordComponent,
        NewtabComponent,
        SetnewpasswordComponent,
        SetpasswordComponent,
        DECLARATIONS,
        EmergencyContactComponent,
        SupportContactComponent,
        OpenTasksComponent,
        EmailnotificationsComponent,
        SearchFilterBYPipe,
        DesignComponent,
        RestoreComponent,
        AddPharmacyComponent,
        AddPhysicianComponent,
        AddRecipientComponent,
        AddSymptomComponent,
        ResidentDialogComponent,
        DragNDropUploadComponent,
        AddDrugComponent,
        StatusTransferredComponent,
        OnFacilityChangeComponent,
        
        DisplayGraphDataComponent,
        ViewVitalsButtonsComponent,
        ViewOrderComponent,
        ViewVitalsButtonsComponent,
        LoginComponent,
        AddHospitalComponent,
        AddTestingDeviceComponent,
        DndDirective,
        ProgressComponent,
        AddLocationComponent,
        AddDepartmentComponent
    ],
    imports: [
        StoreModule.forRoot({ authState: authReducer, shiftRepState: shiftRep_Reducer ,privilegeRepState:privilegeRep_Reducer}),
        BrowserModule,
        AppRoutingModule,
        ChartsModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({ maxOpened: 1, autoDismiss: true, timeOut: 2000, preventDuplicates: true, }),
        LayoutModule,
        OverlayModule,
        HttpClientModule,
        NgxMatDrpModule,
        HttpModule,
        PersistenceModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatInputModule,
        MatRadioModule,
        MatExpansionModule,
        MatSelectModule,
        MatMenuModule,
        MatCardModule,
        MatSlideToggleModule,
        NgxMaskModule.forRoot(),
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyC2lht-_fRNIFmJ2Lj2RfEPdN9rvCSGpfw',
            libraries: ['places']
        }),
        AngularMultiSelectModule,
        MatProgressSpinnerModule,
        MatIconModule,
        // SocketIoModule.forRoot(config),
        MatTableModule,
        MatSortModule,
        IMPORTS,
        MatTooltipModule,
        CdkStepperModule,
        MatStepperModule,
        MatDialogModule,
        SafeHtmlPipe,
        EditorModule,
        NgxMatSelectSearchModule,
        SharedModuleModule,
        MatPaginatorModule,
        CalendarModule,
        // PdfViewerModule
        PdfJsViewerModule ,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRippleModule
    ],
    providers: [
        ApiService,
        Aes256Service,
        ExcelService,
        CommonService,
        ConstantsService,
        SocketService,
        CookieService,
        PROVIDERS,
        SearchFilterBYPipe
    ],
    bootstrap: [
        AppComponent
    ],
    entryComponents: [
        ScheduleModalComponent,
        AlertComponent,
        ConfirmComponent,
        RepeatDialogComponent,
        CustomWeeklyComponent,
        CustomMonthlyComponent,
        CustomYearlyComponent,
        SavereportComponent,
        EmergencyContactComponent,
        SupportContactComponent,
        OpenTasksComponent,
        RestoreComponent,
        AddPharmacyComponent,
        AddPhysicianComponent,
        AddRecipientComponent,
        AddSymptomComponent,
        ResidentDialogComponent,
        DragNDropUploadComponent,
        AddDrugComponent,
        AddHospitalComponent,
        AddTestingDeviceComponent,
        AddLocationComponent,
        AddDepartmentComponent,
        StatusTransferredComponent,
        OnFacilityChangeComponent,

        DisplayGraphDataComponent,
        ViewVitalsButtonsComponent,
        ViewOrderComponent
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA,
        NO_ERRORS_SCHEMA
      ]
})

export class AppModule {
    // constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
        // matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('https://edricchan03.github.io/res/mdi.svg'));
    //   }
}
