const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const sourceDir = path.join(
  distRoot,
  "assets",
  "node_modules",
  "expo-sqlite",
  "web",
  "wa-sqlite"
);
const workerRelativeDir = path.join(distRoot, "_expo", "static", "js", "web", "wa-sqlite");

function fail(message) {
  console.error(`[copy-sqlite-wasm] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  fail(`Missing Expo SQLite wasm asset directory: ${path.relative(projectRoot, sourceDir)}`);
}

const wasmFiles = fs.readdirSync(sourceDir).filter((file) => /^wa-sqlite\..+\.wasm$/.test(file));
if (wasmFiles.length !== 1) {
  fail(`Expected one hashed wa-sqlite wasm file, found ${wasmFiles.length}.`);
}

const wasmFile = wasmFiles[0];
const source = path.join(sourceDir, wasmFile);
fs.mkdirSync(workerRelativeDir, { recursive: true });

for (const targetName of [wasmFile, "wa-sqlite.wasm"]) {
  fs.copyFileSync(source, path.join(workerRelativeDir, targetName));
}

console.log(
  `[copy-sqlite-wasm] Copied ${path.relative(projectRoot, source)} to ${path.relative(
    projectRoot,
    workerRelativeDir
  )}/${wasmFile}`
);
