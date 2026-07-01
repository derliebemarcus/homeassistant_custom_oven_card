import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const sourcePath = "src/homeassistant_custom_oven_card.js";
const source = await readFile(sourcePath, "utf8");
const versionPattern = /const VERSION = "[^"\n]+";/;
const updated = source.replace(versionPattern, `const VERSION = "${packageJson.version}";`);
await writeFile(sourcePath, updated, "utf8");
await writeFile("dist/homeassistant_custom_oven_card.js", updated, "utf8");
