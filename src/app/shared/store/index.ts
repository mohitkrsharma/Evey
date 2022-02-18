import { StoreModule } from '@ngrx/store';
import { authReducer } from './auth/reducer';
import { shiftRep_Reducer } from './shiftReport/reducer';
import { privilegeRep_Reducer } from './privilege/reducer';
export default [StoreModule.forRoot({ authState: authReducer, shiftRepState: shiftRep_Reducer ,privilegeRepState: privilegeRep_Reducer })]