import { readFile, mkdir, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
let bundle = `/* flex-accordion-card v${version} | MIT | No runtime dependencies */\n`;
for (const name of ["i18n", "core", "card", "badge-editor", "editor"]) {
  bundle += (await readFile(new URL(`src/${name}.js`, root), "utf8")).replace(/^import .*from "\.\/.*";\r?\n/gm, "").replace(/^export /gm, "") + "\n";
}
await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(new URL("dist/flex-accordion-card.js", root), bundle);
console.log("dist/flex-accordion-card.js construit");
