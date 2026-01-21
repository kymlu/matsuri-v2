import React, { createContext, useContext, useEffect, useState } from 'react';
import { IndexedDBManager } from './IndexedDbManager';
import { CUSTOM_EVENT } from '../consts/consts';

const DBContext = createContext({ dbReady: false });

export const indexedDbManager: IndexedDBManager = new IndexedDBManager();

export const DBProvider = ({ children }: any) => {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await indexedDbManager.init();
    };
    window.addEventListener(CUSTOM_EVENT.dbInitialized, (e) => {
      console.log("DB is ready");
      setDbReady(true);
    })
    init();
  }, []);

  return (
    <DBContext.Provider value={{ dbReady }}>
      {children}
    </DBContext.Provider>
  );
};

export const useDB = () => useContext(DBContext);
