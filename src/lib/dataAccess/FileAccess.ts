import z from "zod";
import { Choreo, ChoreoSchema } from "../../models/choreo"

export async function loadAllForYear(year: string): Promise<Choreo[]> {
  const manifestRes = await fetch(
    `${process.env.PUBLIC_URL}/data/${year}/manifest.json`
  )

  if (!manifestRes.ok) {
    throw new Error(`Failed to load manifest for ${year}`)
  }

  const manifest: Record<string, string[]> = await manifestRes.json();

  const fetchPromises = Object.entries(manifest).flatMap(
    ([event, files]) =>
      files.map(async (file) => {
        const res = await fetch(
          `${process.env.PUBLIC_URL}/data/${year}/${event}/${file}`
        );

        if (!res.ok) {
          throw new Error(`Failed loading ${file}`);
        }

        return z.parse(ChoreoSchema, await res.json());
      })
  );

  const files = await Promise.all(fetchPromises)

  return files;
}