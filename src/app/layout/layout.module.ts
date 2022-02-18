import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PipesModule } from './../shared/pipes/pipes.module';
import { AgmCoreModule } from '@agm/core';
import { MatButtonModule, MatIconModule, MatListModule, MatMenuModule, MatToolbarModule, MatExpansionModule,
     MatInputModule } from '@angular/material';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { MoreoptionComponent } from './components/moreoption/moreoption.component';
import { LoaderComponent } from './components/loader/loader.component';
import { TopnavComponent } from './components/topnav/topnav.component';
import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSidenavModule,MatBadgeModule,MatCardModule } from '@angular/material';
import { NgxMaskModule } from 'ngx-mask';
import { FormsModule } from '@angular/forms';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SafeHtmlPipe } from './../shared/pipes/safe-html.pipe';
import { ToastrModule } from 'ngx-toastr';
import { LayoutSharedModule } from './layout-shared.module';
@NgModule({
    imports: [
        CommonModule,
        LayoutRoutingModule,
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyC2lht-_fRNIFmJ2Lj2RfEPdN9rvCSGpfw',
            libraries: ['places']
        }),
        LayoutSharedModule,
        ToastrModule.forRoot({ maxOpened: 1, autoDismiss: true, timeOut: 2000, preventDuplicates: true, }),
        FormsModule,
        MatMenuModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatToolbarModule,
        MatExpansionModule,
        MatListModule,
        MatDialogModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatSidenavModule,
        MatBadgeModule,
        MatProgressSpinnerModule,
        BreadcrumbModule,
        NgxMatSelectSearchModule,
        SafeHtmlPipe,
        NgxMaskModule.forRoot()
    ],
    declarations: [
        LayoutComponent,
        TopnavComponent,
        SidebarComponent,
        BreadcrumbComponent,
        LoaderComponent,
        MoreoptionComponent
    ],
    providers: [ PipesModule ],
})

export class LayoutModule {}
