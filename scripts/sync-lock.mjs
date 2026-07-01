import { readFile, writeFile } from "node:fs/promises";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
lock.version = pkg.version;
lock.packages[""].version = pkg.version;
await writeFile("package-lock.json", JSON.stringify(lock, null, 2) + "\n");
