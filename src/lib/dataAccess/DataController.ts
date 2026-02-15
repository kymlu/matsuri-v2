import { Choreo } from "../../models/choreo";
import { getAll, getById, removeItem, upsertItem, upsertList } from "./DataRepository";

export async function getAllChoreos(): Promise<Choreo[]> {
  return await getAll("choreo");
}

export async function getChoreoById(id: string): Promise<Choreo | null> {
  return await getById("choreo", id);
}

export async function saveChoreo(choreo: Choreo, thenFn: () => void, updateDate: boolean = false): Promise<void> {
  if (updateDate) {
    choreo.lastUpdated = new Date().toISOString();
  }
  await upsertItem("choreo", choreo).then(() => thenFn());
}

export async function saveChoreos(choreo: Choreo[], thenFn: () => void): Promise<void> {
  await upsertList("choreo", choreo).then(() => thenFn());
}

export async function deleteChoreo(choreoId: string, thenFn: () => void): Promise<void> {
  await removeItem("choreo", choreoId).then(() => thenFn());
}