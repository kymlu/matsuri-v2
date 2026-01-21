import React from 'react';
import { useDB } from './DBProvider';

export const RequireDB = ({ children }: any) => {
  const { dbReady } = useDB();

  // if (!dbReady) return <p>Initializing database...</p>;
  return children;
};
