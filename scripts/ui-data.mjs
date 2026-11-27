#!/usr/bin/env node
// Reads Essentials' menu groups and modules from its source into src/data/essentials-modules.json, so the UI copies on
// the site only ever show modules that exist, in the windows and order the client puts them in:
// - groups, in order, from Essentials.java's `ctx.registerGroup("Name", Icons.X)`, with each icon's codepoint from
//   core's Icons.java;
// - each group's modules, in order, from `ctx.registerModules(group, new X(), variable, ...)`;
// - each module's name, tag (its colour) and description from its class's `super(Tags.X, "Name", "Description")`.
// Run it when Essentials changes: `node scripts/ui-data.mjs [../myriad-essentials] [../myriad]`.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const essentials = process.argv[2] ?? "../myriad-essentials";
const core = process.argv[3] ?? "../myriad";
const src = join(essentials, "src/main/java");

const files = new Map();
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".java")) files.set(basename(f, ".java"), p);
  }
})(src);

// A Java string literal's text (its \uXXXX escapes are JSON's too).
const javaString = (lit) => JSON.parse(lit);
// "a" + "b" concatenations, as Java writes long descriptions.
const strings = (s) => [...s.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => javaString(`"${m[1]}"`)).join("");

function moduleOf(cls) {
  const path = files.get(cls);
  if (!path) return null;
  const m = readFileSync(path, "utf8").match(/super\(\s*Tags\.([A-Z]+)\s*,\s*("(?:[^"\\]|\\.)*")\s*,\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)\)/);
  return m && { name: javaString(m[2]), tag: m[1].toLowerCase(), description: strings(m[3]) };
}

const icons = {};
for (const m of readFileSync(join(core, "core/src/main/java/dev/myriadclient/api/ui/Icons.java"), "utf8").matchAll(/static final String (\w+) = add\("((?:[^"\\]|\\.)*)"/g)) {
  icons[m[1]] = javaString(`"${m[2]}"`);
}

const main = readFileSync(files.get("Essentials"), "utf8");
const variables = Object.fromEntries([...main.matchAll(/(\w+) (\w+) = new (\w+)\(/g)].map((m) => [m[2], m[3]]));
const groups = [];
const byVar = {};
for (const m of main.matchAll(/ModuleGroup (\w+) = ctx\.registerGroup\("([^"]+)", Icons\.(\w+)\)/g)) {
  const g = { name: m[2], icon: icons[m[3]] ?? "", modules: [] };
  groups.push(g);
  byVar[m[1]] = g;
}
// Each module's place in registration order: Myriad.modules() order, which the launcher lists them in.
let order = 0;
for (const m of main.matchAll(/ctx\.registerModules\((\w+),([^;]*)\);/g)) {
  const group = byVar[m[1]];
  if (!group) continue;
  for (const arg of m[2].split(",").map((a) => a.trim()).filter(Boolean)) {
    const cls = arg.match(/^new (\w+)\(/)?.[1] ?? variables[arg];
    const mod = cls && moduleOf(cls);
    if (mod) group.modules.push({ ...mod, order: order++ });
  }
}

writeFileSync("src/data/essentials-modules.json", JSON.stringify(groups, null, 1) + "\n");
console.log(`ui-data: ${groups.length} groups, ${groups.reduce((n, g) => n + g.modules.length, 0)} modules`);
