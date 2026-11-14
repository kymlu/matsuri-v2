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
    request.onupgradeneeded = (event) => {
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
        console.debug("Database opened");
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
      console.error(`Could not open object store ${storeName}:`, error);
      throw error;
    }
  }

  async getAll(storeName: TableName) {
    return new Promise((resolve, reject) => {
      try {
        const request = this._getStore(storeName, "readonly").getAll();
        request.onsuccess = () => {
          console.debug(`getAll ${storeName} done: ${request.result.length}`);
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.error(`getAll on ${storeName} failed:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`getAll on ${storeName} threw:`, error);
        reject(error);
      }
    });
  }

  async getById(storeName: TableName, id: string) {
    return new Promise((resolve, reject) => {
      try {
        const index = this._getStore(storeName, "readonly").index("formationId");
        const request = index.get(id);
        request.onsuccess = () => {
          console.debug(`getByFormationId ${storeName} done: ${request.result.length}`);
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.error(`getByFormationId on ${storeName} failed:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`getByFormationId on ${storeName} threw:`, error);
        reject(error);
      }
    });
  }

  async upsertItem(storeName: TableName, item: any) {
    return new Promise<number>((resolve, reject) => {
      try {
        const request = this._getStore(storeName).put(item);
        request.onsuccess = () => {
          console.debug(`upsertItem ${storeName} done: ${request.result as number}`);
          resolve(request.result as number);
        };
        request.onerror = () => {
          console.error(`upsertItem on ${storeName} failed:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`upsertItem on ${storeName} threw:`, error);
        reject(error);
      }
    });
  }
  
  async upsertList(storeName: TableName, list: Array<any>) {
    return new Promise<number>((resolve, reject) => {
      try {
        const tx = this._getTransaction(storeName);
        const store = tx.objectStore(storeName);
        list.forEach(item => store.put(item));
        tx.oncomplete = () => {
          console.debug(`upsertList ${storeName} done: ${list.length}`);
          resolve(list.length);
        };
        tx.onerror = () => {
          console.error(`upsertList on ${storeName} failed:`, tx.error);
          reject(tx.error);
        };
      } catch (error) {
        console.error(`upsertList on ${storeName} threw:`, error);
        reject(error);
      }
    });
  }

  async removeItem(storeName: TableName, itemId: string) {
    if (isNullOrUndefinedOrBlank(itemId)) return Promise.resolve(0);
        return new Promise<any>((resolve, reject) => {
      try {
        const request = this._getStore(storeName).delete(itemId);
        request.onsuccess = () => {
          console.debug(`removeItem ${storeName} done: ${itemId}`);
          resolve(request.result);
        };
        request.onerror = () => {
          console.error(`removeItem on ${storeName} failed:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`removeItem on ${storeName} threw:`, error);
        reject(error);
      }
    })
  }

  async removeItems(storeName: TableName, itemIds: string[]) {
    const removed: string[] = [];

    for (const id of itemIds) {
      try {
        await this.removeItem(storeName, id);
        removed.push(id);
      } catch (error) {
        console.error(`Failed to remove ${id} from ${storeName}:`, error);
      }
    }

    return removed;
  }

  async deleteAll(storeName: TableName) {
    return new Promise<any>((resolve, reject) => {
      try {
        const request = this._getStore(storeName).clear();
        request.onsuccess = () => {
          console.debug(`deleteAll ${storeName} done`);
          resolve(request.result);
        };
        request.onerror = () => {
          console.error(`deleteAll on ${storeName} failed:`, request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error(`deleteAll on ${storeName} threw:`, error);
        reject(error);
      }
    })
  }
}
