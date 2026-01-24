import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { IndexedDBManager } from './IndexedDbManager';

const DBContext = createContext({ dbReady: false });

export const indexedDbManager: IndexedDBManager = new IndexedDBManager();

export const DBProvider = ({ children }: { children: ReactNode }) => {
  const [dbReady, setDbReady] = useState(false);
  const initializedRef = React.useRef(false);
  
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const init = async () => {
      await indexedDbManager.init();
      console.log("DB is ready");
      setDbReady(true);
    };
    init();
  }, []);

  return (
    <DBContext.Provider value={{ dbReady }}>
      {children}
    </DBContext.Provider>
  );
};

export const useDB = () => useContext(DBContext);
