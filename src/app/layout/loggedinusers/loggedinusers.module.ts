import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoggedinusersComponent } from './loggedinusers.component';
import { MatCardModule, MatIconModule } from '@angular/material'

@NgModule({
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule
    ],
    declarations: [
        LoggedinusersComponent
    ],
    exports: [LoggedinusersComponent]
})
export class LoggedinusersModule { }
