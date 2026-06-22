import { Choreo } from "../../models/choreo";
import { strEquals } from "../helpers/globalHelper";
import { getAll, getById, removeItem, removeItems, upsertItem, upsertList } from "./DataRepository";

export async function getAllChoreos(teamId?: string): Promise<Choreo[]> {
  return (await getAll("choreo")).filter(c => strEquals(c.teamId, teamId));
}

export async function getChoreoById(id: string): Promise<Choreo | null> {
  return await getById("choreo", id);
}

export async function saveChoreo(choreo: Choreo, thenFn: () => void, updateDate: boolean = true, isDirty: boolean = true): Promise<void> {
  if (updateDate) {
    choreo.lastUpdated = new Date().toISOString();
  }
  choreo.isDirty = isDirty;
  await upsertItem("choreo", choreo).then(() => thenFn());
}

export async function saveChoreos(choreo: Choreo[], thenFn: () => void): Promise<void> {
  await upsertList("choreo", choreo).then(() => thenFn());
}

export async function deleteChoreo(choreoId: string, thenFn: () => void): Promise<void> {
  await removeItem("choreo", choreoId).then(() => thenFn());
}

export async function deleteChoreos(choreoIds: string[], thenFn: () => void): Promise<void> {
  await removeItems("choreo", choreoIds).then(() => thenFn());
}