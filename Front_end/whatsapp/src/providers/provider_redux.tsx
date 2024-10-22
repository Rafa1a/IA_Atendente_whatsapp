// app/components/AppWrapper.tsx
"use client";
import { Provider } from 'react-redux';
import store from '../redux/store';

export default function AppRedux({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
