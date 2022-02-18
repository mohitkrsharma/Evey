import { Action } from '@ngrx/store';
import { INSERT, GET, RESET, TESTING } from './constant';

const initialShiftRep = {};

export function shiftRep_Reducer(_shiftRep: Object = initialShiftRep, action: Action) {
  switch (action.type) {

    case INSERT:
      const insert_ShiftRepObject = { ..._shiftRep, ...action['data'] };
      sessionStorage.setItem('shiftRep_Reducer', JSON.stringify(insert_ShiftRepObject));
      return insert_ShiftRepObject;

    case RESET:
      sessionStorage.clear();
      localStorage.clear();
      return true;

    case TESTING:
      const insert_testing = {...action['data']}
      sessionStorage.setItem('testingReportData',JSON.stringify(insert_testing))
      return insert_testing
      
    default:

      if (sessionStorage.getItem('shiftRep_Reducer')) {
        return JSON.parse(sessionStorage.getItem('shiftRep_Reducer'));
      }
      return _shiftRep;
  }
}
