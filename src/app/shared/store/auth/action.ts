import { INSERT, RESET } from './constant';

export const insertFn = (payload) => ({ type: INSERT , payload });
export const resetFn  = (payload) => ({ type: RESET  , payload });