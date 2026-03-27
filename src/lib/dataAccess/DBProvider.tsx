import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { IndexedDBManager } from './IndexedDbManager';

type dbStatuses = "LOADING" | "SUCCESS" | "FAILED";
type dbContextType = {
  dbStatus: dbStatuses,
  error?: string
}
const DBContext = createContext({ dbStatus: "LOADING" } as dbContextType);

export const indexedDbManager: IndexedDBManager = new IndexedDBManager();

export const DBProvider = ({ children }: { children: ReactNode }) => {
  const [dbStatus, setDbStatus] = useState<dbStatuses>("LOADING");
  const [error, setError] = useState<string | undefined>();
  const initializedRef = React.useRef(false);
  
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const init = async () => {
      try {
        await indexedDbManager.init();
        console.log("DB is ready");
        setDbStatus("SUCCESS");
      } catch (error) {
        console.error("DB init failed:", error);
        setDbStatus("FAILED");
        setError((error as Error).message);
      }
    };
    init();
  }, []);

  return (
    <DBContext.Provider value={{ dbStatus, error }}>
      {children}
    </DBContext.Provider>
  );
};

export const useDB = () => useContext(DBContext);
