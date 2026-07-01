import { readFile, writeFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const sourcePath = "src/homeassistant_custom_oven_card.js";
const source = await readFile(sourcePath, "utf8");
const updated = source.replace(/const VERSION = "[^"\n]+";/, `const VERSION = "${pkg.version}";`);
lock.version = pkg.version;
lock.packages[""].version = pkg.version;
await writeFile(sourcePath, updated, "utf8");
await writeFile("dist/homeassistant_custom_oven_card.js", updated, "utf8");
await writeFile("package-lock.json", JSON.stringify(lock, null, 2) + "\n", "utf8");
