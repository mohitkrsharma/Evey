import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { isNullOrUndefined } from 'util';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonService } from './../../../shared/services/common.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})

export class BreadcrumbComponent implements OnInit {

  static readonly ROUTE_DATA_BREADCRUMB = 'breadcrumb';
  readonly home = { icon: 'pi pi-desktop', routerLink: '/dashboard' };

  menuItems: MenuItem[];
  lastItem = null;

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    public _commonService: CommonService
  ) {

    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.menuItems = this.createBreadcrumbs(this._activatedRoute.root));
  }

  ngOnInit(): void {

    this._commonService.lastcrumbcontent.subscribe((contentVal: any) => {
      if (contentVal) {
        this.menuItems.push(contentVal);
      }
    });

    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.menuItems = this.createBreadcrumbs(this._activatedRoute.root);
        if (this.lastItem) {
          this.menuItems.push(this.lastItem);
        }
      });
  }

  private createBreadcrumbs(route: ActivatedRoute, routerLink: string = '', breadcrumbs: MenuItem[] = []): MenuItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        routerLink += `/${routeURL}`;
      }

      const label = child.snapshot.data[BreadcrumbComponent.ROUTE_DATA_BREADCRUMB];
      // tslint:disable-next-line: deprecation
      if (!isNullOrUndefined(label)) {
        breadcrumbs.push({ label, routerLink });
      }

      return this.createBreadcrumbs(child, routerLink, breadcrumbs);
    }
  }

}
