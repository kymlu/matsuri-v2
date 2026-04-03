const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = ["id", "name", "event", "stageType", "stageGeometry", "sections", "dancers"];

function validate(data, filename) {
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
const manifest = [];

// Remove manifest entries whose data file no longer exists
const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith(".json") && f !== "manifest.json").map(f => path.basename(f, ".json"));
for (const id of dataFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`)));
  manifest.push({ id: data.id, name: data.name, event: data.event });
  console.log(`Added file to manifest: ${id}`);
}

// Process incoming files from intake folder
const intakeFiles = fs.readdirSync(intakeDir).filter(f => f.endsWith(".mtr"));
console.log(`Found ${intakeFiles.length} file(s) in intake`);

for (const filename of intakeFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(intakeDir, filename), "utf-8"));
    const { isDirty, status, ...incoming } = validate(raw, filename);

    const existingFilePath = path.join(dataDir, `${incoming.id}.json`);
    const existingInManifest = manifest.find(m => m.id === incoming.id);

    if (fs.existsSync(existingFilePath)) {
      const existing = JSON.parse(fs.readFileSync(existingFilePath, "utf-8"));
      fs.writeFileSync(existingFilePath, JSON.stringify({ ...incoming, version: existing.version + 1 }));
      console.log(`Updated: ${incoming.id} (version ${existing.version + 1})`);
    } else {
      fs.writeFileSync(path.join(dataDir, `${incoming.id}.json`), JSON.stringify({ ...incoming, version: 1 }));
      console.log(`Created: ${incoming.id}`);
    }

    if (existingInManifest) {
      existingInManifest.name = incoming.name;
      existingInManifest.event = incoming.event;
      console.log(`Manifest updated: ${incoming.id}`);
    } else {
      manifest.push({ id: incoming.id, name: incoming.name, event: incoming.event });
      console.log(`Manifest added: ${incoming.id}`);
    }

    fs.unlinkSync(path.join(intakeDir, filename));
    console.log(`Deleted from intake: ${filename}`);

  } catch (err) {
    console.error(`Skipped ${filename}: ${err.message}`);
  }
}

// Sort manifest by category then name
manifest.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.name.localeCompare(b.name);
});

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Manifest sorted and written with ${manifest.length} entries`);