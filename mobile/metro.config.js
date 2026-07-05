const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);
const corePath = path.resolve(__dirname, "..", "packages", "core");
const coreSrc = path.resolve(corePath, "src");

// Drizzle ships .sql migration files; allow Metro to bundle them if referenced.
config.resolver.sourceExts.push("sql");
config.resolver.assetExts.push("wasm");

// --- @flaggo/core (shared game logic in ../packages/core) -------------------
// 1) Watch the package so Metro's file map indexes it (required for SHA-1).
//    NOTE: Expo's on-demand filesystem must stay disabled for this to work
//    during `expo export` (app.json → experiments.onDemandFilesystem: false);
//    when it is on, the CLI truncates watchFolders to the project root and
//    core files fail with "Failed to get the SHA-1".
config.watchFolders = [...(config.watchFolders ?? []), corePath];

// 2) Resolve "@flaggo/core" and its subpaths straight to files in src/.
//    Metro can't follow the repo-root workspace symlink from this app, so we
//    hand it concrete file paths.
const priorResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@flaggo/core" || moduleName.startsWith("@flaggo/core/")) {
    const sub = moduleName === "@flaggo/core" ? "index" : moduleName.slice("@flaggo/core/".length);
    const base = path.join(coreSrc, sub);
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { type: "sourceFile", filePath: candidate };
      }
    }
    throw new Error(`@flaggo/core subpath not found: ${moduleName}`);
  }
  if (priorResolveRequest) return priorResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
