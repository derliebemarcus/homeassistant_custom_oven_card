import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const compatibilityManifest = ".release-please-manifest.json";

await writeFile(compatibilityManifest, `${JSON.stringify({ ".": packageJson.version }, null, 2)}\n`);
try {
  await import(`./validate.mjs?version=${packageJson.version}`);
} finally {
  await rm(compatibilityManifest, { force: true });
}

const source = await readFile("src/homeassistant_custom_oven_card.js", "utf8");
const distribution = await readFile("dist/homeassistant_custom_oven_card.js", "utf8");
const changesetsConfig = JSON.parse(await readFile(".changeset/config.json", "utf8"));
const versionPattern = /const VERSION = "([^"\n]+)";/;

assert.equal(changesetsConfig.baseBranch, "main");
assert.equal(changesetsConfig.privatePackages.version, true);
assert.equal(changesetsConfig.privatePackages.tag, false);
assert.equal(source.match(versionPattern)?.[1], packageJson.version);
assert.equal(distribution.match(versionPattern)?.[1], packageJson.version);
assert.equal(packageJson.engines.node, ">=24");
