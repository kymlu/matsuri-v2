import z from "zod";
import { Choreo, ChoreoSchema } from "../../models/choreo";

export async function loadAllChoreos(): Promise<Choreo[]> {
  const manifestRes = await fetch(
    `${process.env.PUBLIC_URL}/data/manifest.json`
  );

  if (!manifestRes.ok) {
    throw new Error("Failed to load manifest");
  }

  const manifest: { id: string; name: string; event: string }[] = await manifestRes.json();

  const fetchPromises = manifest.map(async (entry) => {
    const res = await fetch(
      `${process.env.PUBLIC_URL}/data/${entry.id}.json`
    );

    if (!res.ok) {
      throw new Error(`Failed loading ${entry.id}`);
    }

    return z.parse(ChoreoSchema, await res.json());
  });

  return Promise.all(fetchPromises);
}