import { INSERT, RESET, GET ,TESTING } from './constant';

export const insertRefFn = (data) => ({ type: INSERT, data });
export const getFn = () => ({ type: GET });
export const resetFn = (payload) => ({ type: RESET, payload });
export const insertTestingFn = (data) => ({ type: TESTING, data });