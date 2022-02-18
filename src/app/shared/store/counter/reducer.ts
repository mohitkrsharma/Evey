import { Action } from '@ngrx/store';
import { INCREMENT, DECREMENT, RESET } from './constant';

const initialState = 0;

export function counterReducer(state: number = initialState, action: Action) {
  switch (action.type) {
    case INCREMENT:
      return state + 1;

    case DECREMENT:
      return state - 1;

    case RESET:
      return 0;

    default:
      return state;
  }
}