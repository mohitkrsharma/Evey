import { Action } from '@ngrx/store';
import { INSERT, RESET } from './constant';
import { ApiService } from './../../services/api/api.service';

const initialAuth = {};

export function authReducer(_user: Object = initialAuth, action: Action) {
  switch (action.type) {

    case INSERT:
                const authObject = {..._user, ...action['payload'] };
                // localStorage.setItem('authReducer', JSON.stringify(authObject));
                console.log(authObject)
                sessionStorage.setItem('authReducer', JSON.stringify(authObject));
                return authObject;
    case RESET:
                sessionStorage.clear();
                localStorage.clear();
                return true;
    default:
    // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
      
    ApiService.checkAuthStatus();

    // sessionStorage.clear();
    // localStorage.clear();
    if (sessionStorage.getItem('authReducer')) {
      return JSON.parse(sessionStorage.getItem('authReducer'));
    }
    return _user;
  }
}
