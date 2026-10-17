// Writes the docs as plain Markdown for language models (https://llmstxt.org), from src/content, before each build:
//   public/llms.txt       an index of every page with its summary
//   public/llms-full.txt  every page in one file
//   public/docs/**.md     each page on its own, at its address plus .md (/docs/develop/hooks.md)
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const CONTENT = "src/content";
const PUBLIC = "public";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://myriadclient.dev").replace(/\/$/, "");

/** The order a folder's _meta.ts gives its pages (keys in order), else alphabetical. */
function order(dir) {
  const meta = join(dir, "_meta.ts");
  if (!existsSync(meta)) return null;
  return [...readFileSync(meta, "utf8").matchAll(/^\s*"?([\w-]+)"?\s*:/gm)].map((m) => m[1]);
}

/** Pages under dir, in menu order: {route, file}. */
function pages(dir, route) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const names = new Set(entries.map((e) => e.name.replace(/\.mdx$/, "")));
  const keys = order(dir) ?? [...names].sort();
  const out = [];
  for (const key of keys) {
    if (!names.has(key)) continue;
    const isDir = entries.some((e) => e.isDirectory() && e.name === key);
    if (isDir) out.push(...pages(join(dir, key), `${route}/${key}`));
    else out.push({ route: key === "index" ? route : `${route}/${key}`, file: join(dir, `${key}.mdx`) });
  }
  return out;
}

/** Frontmatter and body of an MDX file. */
function parse(file) {
  const text = readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  const front = {};
  if (m) for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) front[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"');
  }
  return { front, body: m ? text.slice(m[0].length) : text };
}

/** MDX to plain Markdown: imports dropped, components turned into what they say. */
function markdown(body) {
  const lines = [];
  let inCode = false;
  for (let line of body.split("\n")) {
    if (line.startsWith("```")) inCode = !inCode;
    if (inCode || line.startsWith("```")) {
      lines.push(line.replace(/^(```\w*)\s+filename="([^"]+)"/, "$1 $2"));
      continue;
    }
    if (/^import .* from ".*";?$/.test(line)) continue;
    line = line
      .replace(/<Callout type="(\w+)">/, (_, t) => `> **${t === "warning" ? "Warning" : "Note"}:**`)
      .replace(/<\/Callout>/, "")
      .replace(/<Cards\.Card title="([^"]+)" href="([^"]+)"[^>]*\/>/, (_, t, h) => `- [${t}](${SITE}${h})`)
      .replace(/<Cards\.Card title="([^"]+)" href="([^"]+)"[^>]*>/, (_, t, h) => `- [${t}](${SITE}${h}):`)
      .replace(/<\/?(Cards|Cards\.Card|Steps|Tabs|Tabs\.Tab)(\s[^>]*)?>/g, "")
      .replace(/<kbd>([^<]*)<\/kbd>/g, "`$1`")
      .replace(/\{"([^"]*)"\}/g, "$1")
      .replace(/\]\((\/docs[^)]*)\)/g, (_, p) => `](${SITE}${p})`);
    lines.push(line);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const all = pages(CONTENT, "/docs");
rmSync(join(PUBLIC, "docs"), { recursive: true, force: true });
rmSync(join(PUBLIC, "docs.md"), { force: true });

const sections = new Map([["/docs", "Myriad docs"], ["/docs/use", "Using Myriad"], ["/docs/develop", "Developers"]]);
let index = `# Myriad

> Myriad is a free, open-source, addon-first utility client for Minecraft 26.2 on Fabric. Its menu is a tiling window
> manager; every module comes from an addon built on its public Java API (dev.myriadclient.api). These docs cover using
> Myriad and writing addons: modules, settings, events, services, the menu, rendering, hooks, shared configs.

Each page below is plain Markdown. ${SITE}/llms-full.txt has every page in one file. For writing an addon, read
"For AI agents" first: it has the rules an addon must follow.
`;
let full = `# Myriad documentation (every page)\n\nSource: ${SITE}/docs\n`;
let section = "";

for (const { route, file } of all) {
  const { front, body } = parse(file);
  const md = `# ${front.title ?? route}\n\n${front.description ? `> ${front.description}\n\n` : ""}${markdown(body).replace(/^# .*\n+/, "")}`;
  const target = join(PUBLIC, `${route}.md`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, md);

  const top = route.split("/").slice(0, 3).join("/");
  const name = sections.get(top) ?? "Docs";
  if (name !== section) {
    section = name;
    index += `\n## ${name}\n\n`;
  }
  index += `- [${front.title ?? route}](${SITE}${route}.md)${front.description ? `: ${front.description}` : ""}\n`;
  full += `\n\n---\n\nPage: ${SITE}${route}\n\n${md}`;
}

writeFileSync(join(PUBLIC, "llms.txt"), index);
writeFileSync(join(PUBLIC, "llms-full.txt"), full);
console.log(`llms: ${all.length} pages`);
