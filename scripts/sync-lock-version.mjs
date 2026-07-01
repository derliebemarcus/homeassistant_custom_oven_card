import { readFile, writeFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const path = "package-lock.json";
const lock = JSON.parse(await readFile(path, "utf8"));

lock.version = pkg.version;
lock.packages[""].version = pkg.version;
await writeFile(path, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
