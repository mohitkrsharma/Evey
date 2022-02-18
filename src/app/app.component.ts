/* Importing all the Modules,component,services we need */
import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from './shared/services/api/api.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

    constructor(private apiService: ApiService ) {
    }

    async ngOnInit() {
        await this.apiService.checkAuthenticationStatus();
    }
}