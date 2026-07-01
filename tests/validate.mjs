import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("src/homeassistant_custom_oven_card.js", "utf8");
const distribution = await readFile("dist/homeassistant_custom_oven_card.js", "utf8");
const manifest = JSON.parse(await readFile("hacs.json", "utf8"));
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const changesetsConfig = JSON.parse(await readFile(".changeset/config.json", "utf8"));

assert.equal(distribution, source, "dist file must match the source build");
assert.equal(manifest.name, "Home Connect Oven Card");
assert.equal(manifest.filename, "homeassistant_custom_oven_card.js");
assert.match(packageJson.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
assert.equal(packageLock.version, packageJson.version);
assert.equal(packageLock.packages[""].version, packageJson.version);
assert.equal(changesetsConfig.baseBranch, "main");
assert.equal(changesetsConfig.privatePackages.version, true);
assert.equal(changesetsConfig.privatePackages.tag, false);

const versionPattern = /const VERSION = "([^"\n]+)";/;
assert.equal(source.match(versionPattern)?.[1], packageJson.version);
assert.equal(distribution.match(versionPattern)?.[1], packageJson.version);

for (const expected of [
  'customElements.define("oven-card"',
  'type: "oven-card"',
  'config/entity_registry/list_for_display',
  '_current_oven_cavity_temperature',
  '_setpoint_temperature',
  'select_option',
  'set_value',
  'globalThis.confirm',
  'prefers-reduced-motion',
  'getEntitySuggestion',
  'globalThis.customCards',
]) {
  assert.ok(source.includes(expected), `missing required feature: ${expected}`);
}

assert.ok(!source.includes('data-action="start"'));
assert.ok(!source.includes('this._service("switch", "turn_on"'));

console.log("Oven card validation passed");
