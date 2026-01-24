import { ReactNode } from 'react';
import { useDB } from './DBProvider';

export const RequireDB = ({ children }: { children: ReactNode }) => {
  const { dbReady } = useDB();

  if (!dbReady) return <p>Initializing database...</p>;
  return <>{children}</>;
};
