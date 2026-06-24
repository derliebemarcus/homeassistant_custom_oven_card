import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("src/homeassistant_custom_oven_card.js", "utf8");
const distribution = await readFile("dist/homeassistant_custom_oven_card.js", "utf8");
const manifest = JSON.parse(await readFile("hacs.json", "utf8"));
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

assert.equal(distribution, source, "dist file must match the source build");
assert.equal(manifest.name, "Home Connect Oven Card");
assert.equal(manifest.filename, "homeassistant_custom_oven_card.js");
assert.equal(packageJson.version, "0.1.0");

for (const expected of [
  'customElements.define("oven-card"',
  'type: "oven-card"',
  'config/entity_registry/list_for_display',
  '_current_oven_cavity_temperature',
  '_setpoint_temperature',
  'select_option',
  'set_value',
  'window.confirm',
  'prefers-reduced-motion',
]) {
  assert.ok(source.includes(expected), `missing required feature: ${expected}`);
}

assert.ok(!source.includes('data-action="start"'), "direct remote start must remain absent");
assert.ok(!source.includes('this._service("switch", "turn_on"'), "direct power-on must remain absent");

console.log("Oven card validation passed");
