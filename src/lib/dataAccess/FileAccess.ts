import z from "zod";
import { BasicChoreoDetails, BasicChoreoDetailsSchema, Choreo, ChoreoSchema } from "../../models/choreo";

export async function loadAllChoreos(): Promise<BasicChoreoDetails[]> {
  const manifestRes = await fetch(
    `${process.env.PUBLIC_URL}/data/manifest.json`
  );

  if (!manifestRes.ok) {
    throw new Error("Failed to load manifest");
  }

  try {
    const manifest: BasicChoreoDetails[] = z.array(BasicChoreoDetailsSchema).parse(await manifestRes.json());
    return manifest;
  } catch {
    throw new Error("Failed to parse manifest");
  }

}

export async function loadChoreoById(id: string): Promise<Choreo> {
  const res = await fetch(
    `${process.env.PUBLIC_URL}/data/${id}.json`
  );

  if (!res.ok) {
    throw new Error(`Failed loading ${id}`);
  }

  return z.parse(ChoreoSchema, await res.json());
}