import { ReactNode } from 'react';
import { useDB } from './DBProvider';
import { Oval } from 'react-loader-spinner';
import { colorPalette } from '../consts/colors';

export const RequireDB = ({ children }: { children: ReactNode }) => {
  const { dbReady } = useDB();

  if (!dbReady) return
  <div className='flex flex-col items-center justify-center h-full gap-2'>
    <p>Initializing database...</p>
    <Oval 
      color={colorPalette.primary}
      secondaryColor={colorPalette.rainbow.red[2]}/>
  </div>
  return <>{children}</>;
};
