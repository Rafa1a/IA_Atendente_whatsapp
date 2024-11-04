// src/redux/slices/loginSlice.ts
import { createSlice } from '@reduxjs/toolkit';


interface LoginState {
  value: boolean;
}

const initialState: LoginState = {
  value: false,
};

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    on: (state) => {
      state.value = true;
    },
    off: (state) => {
      state.value = false;
    },
   
  },
});

export const { on, off } = loginSlice.actions;

export default loginSlice.reducer;
