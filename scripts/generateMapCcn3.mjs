// Regenerates packages/core/src/data/mapCcn3.ts from the offline map topology.
// Run after replacing world-110m.json: node scripts/generateMapCcn3.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const topo = JSON.parse(fs.readFileSync(path.join(root, "packages/core/src/data/world-110m.json"), "utf8"));
const ids = [...new Set(
  (topo.objects.countries.geometries ?? [])
    .map((g) => String(g.id ?? "").padStart(3, "0"))
    .filter((id) => id && id !== "000")
)].sort();

const body =
  "// GENERATED from packages/core/src/data/world-110m.json — ccn3 ids of countries\n" +
  "// drawn in the offline map. Regenerate with: node scripts/generateMapCcn3.mjs\n" +
  "export const MAP_CCN3_IDS: ReadonlySet<string> = new Set([\n" +
  ids.map((id) => JSON.stringify(id)).join(", ") +
  "\n]);\n";

fs.writeFileSync(path.join(root, "packages/core/src/data/mapCcn3.ts"), body);
console.log(`wrote ${ids.length} ids`);
