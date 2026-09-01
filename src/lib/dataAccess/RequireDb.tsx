import { ReactNode } from 'react';
import { useDB } from './DBProvider';
import { Oval } from 'react-loader-spinner';
import { colorPalette } from '../consts/colors';

export const RequireDB = ({ children }: { children: ReactNode }) => {
  const { dbStatus, error } = useDB();

  if (dbStatus === "LOADING") return (
    <div className='flex flex-col items-center justify-center h-[100svh] gap-2'>
      <p>データベースを確認中...</p>
      <Oval 
        color={colorPalette.primary}
        secondaryColor={colorPalette.rainbow.red[2]}/>
    </div>
  )
  if (dbStatus === "FAILED") return (
    <div className='flex flex-col items-center justify-center h-[100svh] gap-2'>
      <p>データベースの確認に失敗しました。</p>
      <p>ケイティーまで問い合わせてください。</p>
      <samp className='p-2 bg-subtle'>{error}</samp>
    </div>
  )
  return <>{children}</>;
};
