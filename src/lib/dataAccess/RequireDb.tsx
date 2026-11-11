import { ReactNode } from 'react';
import { useDB } from './DBProvider';
import { Grid } from 'react-loader-spinner';
import { colorPalette } from '../consts/colors';

export const RequireDB = ({ children }: { children: ReactNode }) => {
  const { dbStatus, error } = useDB();

  if (dbStatus === "LOADING") return (
    <div className='flex flex-col items-center justify-center h-[100svh] gap-2'>
      <p>データベースを確認中...</p>
      <Grid
        height={44}
        width={44}
        color={colorPalette.primary}
        ariaLabel="読み込み中"/>
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
