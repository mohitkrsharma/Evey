import { Action } from '@ngrx/store';
import { INSERT, GET, RESET } from './constant';

const initialPrivilegesRep = {};

export function privilegeRep_Reducer(_privilegeRep: Object = initialPrivilegesRep, action: Action) {
  switch (action.type) {

    case INSERT:
      const insert_PrivilegeRepObject = { ..._privilegeRep, ...action['data'] };
      sessionStorage.setItem('privilegeRep_Reducer', JSON.stringify(insert_PrivilegeRepObject));
      return insert_PrivilegeRepObject;

    case RESET:
      sessionStorage.clear();
      localStorage.clear();
      return true;

    default:

      if (sessionStorage.getItem('privilegeRep_Reducer')) {
        return JSON.parse(sessionStorage.getItem('privilegeRep_Reducer'));
      }
      return _privilegeRep;
  }
}
