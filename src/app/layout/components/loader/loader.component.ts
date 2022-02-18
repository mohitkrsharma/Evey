import { Subscription } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})

export class LoaderComponent implements OnInit {

  private subscription: Subscription;
  loader = true;
  constructor(private _commonService: CommonService) { }

  ngOnInit(): void {
    this.subscription = this._commonService.loadercontent.subscribe((contentVal: any) => {
      this.loader = contentVal;
    });
  }



}
