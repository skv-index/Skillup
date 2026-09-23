import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { router } from './router';

export function Providers({ children }: { children?: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
