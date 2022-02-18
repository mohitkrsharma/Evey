import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { isNullOrUndefined } from 'util';
import { ActivatedRoute, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-moreoption',
  templateUrl: './moreoption.component.html',
  styleUrls: ['./moreoption.component.scss']
})

export class MoreoptionComponent implements OnInit {

  private subscription: Subscription;
  dropoption = null;

  constructor(
    private _commonService: CommonService,
    private _router: Router) {

  }

  ngOnInit(): void {

    this.subscription = this._commonService.moreoptioncontent.subscribe((contentVal: any) => {
      this.dropoption = contentVal;
    });

  }

  navigateToLinnk(link): void {
    // this._commonService.setLoader(true);
    this._router.navigate(['/' + link]);
  }

}
