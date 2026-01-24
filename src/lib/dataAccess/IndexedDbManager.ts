import { Choreo } from "../../models/choreo";
import { DB_NAME } from "../consts/consts";
import { isNullOrUndefinedOrBlank } from "../helpers/globalHelper";

export type TableName = "choreo";
export type TableTypeMap = {
  "choreo": Choreo,
}

export class IndexedDBManager {
  db!: IDBDatabase;
  isInitialized: boolean = false;

  async init() {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      const newVersion = event.newVersion;

      console.log(`Upgrading database from ${oldVersion} to ${newVersion}`);
      if (!db.objectStoreNames.contains("choreo")) {
        db.createObjectStore("choreo", { keyPath: "id", autoIncrement: true });
      }
    };

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => {
      console.log("Successfully initialized db")
      this.db = request.result;
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
  }

  _getTransaction(storeName: TableName, mode: IDBTransactionMode = "readwrite") {
    return this.db.transaction(storeName, mode)
  }

  _getStore(storeName: TableName, mode: IDBTransactionMode = "readwrite") {
    try {
      return this.db.transaction(storeName, mode).objectStore(storeName);
    } catch (error) {
      console.error(`Error getting object store ${storeName}: ${error}`);
      throw error;
    }
  }

  async getAll(storeName: TableName) {
    console.log(`getAll ${storeName} called`);
    return new Promise((resolve, reject) => {
      try {
        const request = this._getStore(storeName, "readonly").getAll();
        request.onsuccess = () => {
          console.log(`resolved getAll ${storeName}: ${request.result.length}`);
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.error(`error on getAll ${storeName}: ${request.error}`);
          reject(request.error);
        };
      } catch (error) {
        console.error(`exception on getAll ${storeName}: ${error}`);
        reject(error);
      }
    });
  }

  async getById(storeName: TableName, id: string) {
    console.log(`getByFormationId ${storeName} called on ${id}`);
    return new Promise((resolve, reject) => {
      try {
        const index = this._getStore(storeName, "readonly").index("formationId");
        const request = index.get(id);
        request.onsuccess = () => {
          console.log(`resolved getByFormationId ${storeName}: ${request.result.length}`);
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.error(`error on getByFormationId ${storeName}: ${request.error}`);
          reject(request.error);
        };
      } catch (error) {
        console.error(`exception on getByFormationId ${storeName}: ${error}`);
        reject(error);
      }
    });
  }

  async upsertItem(storeName: TableName, item: any) {
    console.log(`upsertItem ${storeName} called`);
    return new Promise<number>((resolve, reject) => {
      try {
        const request = this._getStore(storeName).put(item);
        request.onsuccess = () => {
          console.log(`resolved upsertItem ${storeName}: ${request.result as number}`);
          resolve(request.result as number);
        };
        request.onerror = () => {
          console.error(`error on upsertItem ${storeName}: ${request.error}`);
          reject(request.error);
        };
      } catch (error) {
        console.error(`exception on upsertItem ${storeName}: ${error}`);
        reject(error);
      }
    });
  }

  async removeItem(storeName: TableName, itemId: string) {
    if (isNullOrUndefinedOrBlank(itemId)) return Promise.resolve(0);
    console.log(`removeItem ${storeName} called`);
    return new Promise<any>((resolve, reject) => {
      try {
        const request = this._getStore(storeName).delete(itemId);
        request.onsuccess = () => {
          console.log(`resolved removeItem ${storeName}: ${request.result}`);
          resolve(request.result);
        };
        request.onerror = () => {
          console.error(`error on removeItem ${storeName}: ${request.error}`);
          reject(request.error);
        };
      } catch (error) {
        console.error(`exception on removeItem ${storeName}: ${error}`);
        reject(error);
      }
    })
  }

  async deleteAll(storeName: TableName) {
    console.log(`deleteAll ${storeName} called`);
    return new Promise<any>((resolve, reject) => {
      try {
        const request = this._getStore(storeName).clear();
        request.onsuccess = () => {
          console.log(`resolved deleteAll ${storeName}`);
          resolve(request.result);
        };
        request.onerror = () => {
          console.error(`error on deleteAll ${storeName}: ${request.error}`);
          reject(request.error);
        };
      } catch (error) {
        console.error(`exception on deleteAll ${storeName}: ${error}`);
        reject(error);
      }
    })
  }
}
