const { execSync } = require("node:child_process");

const isProduction = process.env.CONTEXT === "production";

if (!isProduction) {
  process.exit(1);
}

if (!process.env.COMMIT_REF) {
  process.exit(0);
}

try {
  const commitMessage = execSync(
    `git log -1 --pretty=%B ${process.env.COMMIT_REF}`,
    { encoding: "utf8" },
  );

  process.exit(commitMessage.includes("[deploy]") ? 1 : 0);
} catch {
  process.exit(0);
}
