import { Choreo } from "../../models/choreo";
import { getAll, getById, upsertItem } from "./DataRepository";

export async function getAllChoreos(): Promise<Choreo[]> {
  return await getAll("choreo");
}

export async function getChoreoById(id: string): Promise<Choreo | null> {
  return await getById("choreo", id);
}

export async function saveChoreo(choreo: Choreo, thenFn: () => void): Promise<void> {
  choreo.lastUpdated = new Date().toISOString();
  console.log(new Date().toISOString())
  await upsertItem("choreo", choreo).then(() => thenFn());
}