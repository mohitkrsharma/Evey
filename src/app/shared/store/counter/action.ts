import { INCREMENT, DECREMENT, RESET } from './constant';

export const increament = () => ({type:INCREMENT});

export const decreament = () => ({type:DECREMENT});

export const reset = () => ({type:RESET});