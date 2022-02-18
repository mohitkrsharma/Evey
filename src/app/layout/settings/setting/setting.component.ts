import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setting',
  template: 'Settings'
})

export class SettingComponent implements OnInit {
  constructor( private router: Router ) {
        this.router.navigate(['./settings/build_restriction']);
  }

  async ngOnInit() {
  }

}
