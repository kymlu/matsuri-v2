import z from "zod";
import { Choreo, ChoreoManifest, ChoreoManifestSchema, ChoreoSchema } from "../../models/choreo";

export async function loadChoreoManifest(): Promise<ChoreoManifest[]> {
  const manifestRes = await fetch(
    `${process.env.PUBLIC_URL}/data/manifest.json`
  );

  if (!manifestRes.ok) {
    throw new Error("Failed to load manifest");
  }

  const manifest = z.parse(ChoreoManifestSchema.array(), await manifestRes.json());
  return manifest;
}

export async function loadAllChoreos(excludeHidden?: boolean): Promise<Choreo[]> {
  const manifestRes = await fetch(
    `${process.env.PUBLIC_URL}/data/manifest.json`
  );

  if (!manifestRes.ok) {
    throw new Error("Failed to load manifest");
  }

  const manifest = z.parse(ChoreoManifestSchema.array(), await manifestRes.json());
  const choreosToFetch = excludeHidden === true ? manifest.filter(x => x.isHidden !== true) : manifest;

  const fetchPromises = choreosToFetch.map(async (entry) => {
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