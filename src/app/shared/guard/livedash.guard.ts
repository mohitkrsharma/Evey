import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApiService } from './../services/api/api.service';

interface AppState {
  _authUser: number;
}

@Injectable({
  providedIn: 'root'
})

export class LivedashGuard implements CanActivate {
  authState: Object;

  constructor(
      private router: Router,
      private authStore: Store<AppState>,
      private apiService: ApiService,
      private route: ActivatedRoute,
  ) {
      this.authStore.select('authState').subscribe(sub => {
          this.authState = sub;
      });
  }

  async canActivate() {
    const action = {
      type: 'LIVE',
      target: 'users/check_active_link'
    };
    const link = window.location.href;
    const payload = {facId: (window.location.pathname).split('/livedashboard/')[1], userId: sessionStorage.getItem('user_Id'), location: window.location.href};
    console.log('ppppppppppppppppp', payload);
    const result = await this.apiService.apiFn(action, payload);
    console.log('rrrrrrrrrrrrrrrrr', result);
     if (result['status'] === false) {
       return false;
    } else {
      return true;
    }


  }


}
