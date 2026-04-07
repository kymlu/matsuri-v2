const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = ["id", "name", "event", "stageType", "stageGeometry", "sections", "dancers"];

function validate(data: any, filename: string) {
  if (typeof data !== "object" || data === null) {
    throw new Error(`${filename}: not a valid object`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in data) || !data[field]) {
      throw new Error(`${filename}: missing required field "${field}"`);
    }
  }

  return data;
}

// Directories and file paths
const intakeDir = "intake";
const dataDir = "public/data";
const manifestPath = "public/data/manifest.json";

// Load existing manifest or start fresh
type Manifest = {
  id: string,
  name: string,
  event: string,
  isHidden?: boolean,
  version: number,
  lastUpdated?: string
}
const manifest: Manifest[] = [];

// Remove manifest entries whose data file no longer exists
const dataFiles = fs.readdirSync(dataDir).filter((f: any) => f.endsWith(".json") && f !== "manifest.json").map((f: any) => path.basename(f, ".json"));
for (const id of dataFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`)));
  manifest.push({
    id: data.id,
    name: data.name,
    event: data.event,
    version: data.version,
    lastUpdated: data.lastUpdated,
    isHidden: data.isHidden,
  });
  console.log(`Added file to manifest: ${id}`);
}

// Process incoming files from intake folder
const intakeFiles = fs.readdirSync(intakeDir).filter((f: any) => f.endsWith(".mtr"));
console.log(`Found ${intakeFiles.length} file(s) in intake`);

for (const filename of intakeFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(intakeDir, filename), "utf-8"));
    const { isDirty, status, ...incoming } = validate(raw, filename);

    const existingFilePath = path.join(dataDir, `${incoming.id}.json`);
    const existingInManifest = manifest.find(m => m.id === incoming.id);
    var version = 1;

    if (fs.existsSync(existingFilePath)) {
      const existing = JSON.parse(fs.readFileSync(existingFilePath, "utf-8"));
      version = existing.version + 1;
      fs.writeFileSync(existingFilePath, JSON.stringify({ ...incoming, version: version }));
      console.log(`Updated: ${incoming.id} (version ${version})`);
    } else {
      fs.writeFileSync(path.join(dataDir, `${incoming.id}.json`), JSON.stringify({ ...incoming, version: version }));
      console.log(`Created: ${incoming.id}`);
    }

    if (existingInManifest) {
      existingInManifest.name = incoming.name;
      existingInManifest.event = incoming.event;
      existingInManifest.version = version;
      existingInManifest.lastUpdated = incoming.lastUpdated;
      console.log(`Manifest updated: ${incoming.id}`);
    } else {
      manifest.push({
        id: incoming.id,
        name: incoming.name,
        event: incoming.event,
        version: version,
        lastUpdated: incoming.lastUpdated,
      });
      console.log(`Manifest added: ${incoming.id}`);
    }

    fs.unlinkSync(path.join(intakeDir, filename));
    console.log(`Deleted from intake: ${filename}`);

  } catch (err: any) {
    console.error(`Skipped ${filename}: ${err.message}`);
  }
}

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Manifest sorted and written with ${manifest.length} entries`);