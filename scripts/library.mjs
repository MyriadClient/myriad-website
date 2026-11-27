// Reads the Myriad Library from Myriad's API before each build, for the /library pages:
//   .library/library.json        every listed addon with its releases, checked field by field
//   public/library-icons/<id>.png each addon's icon (PNG only, at most 64 KB)
//
// The API is trusted no more than it has to be: everything shown is checked here again (ids, addresses, hashes, text
// lengths and characters), and anything that doesn't fit is dropped. The pages only describe addons; what a game
// installs is checked by the game itself against Myriad's keys, never against this site.
//
// When the API can't be reached or answers with an error, the build fails, so the last deploy keeps serving the last
// good list rather than an empty one. `--dev` (npm run dev) only warns. An API without the Library yet (404) means the
// Library isn't open: the pages say so.
import { get } from "node:https";
import { get as getHttp } from "node:http";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://api.myriadclient.dev").replace(/\/$/, "");
const DEV = process.argv.includes("--dev");
const OUT = ".library";
const ICONS = "public/library-icons";
const MAX_JSON = 4 * 1024 * 1024;
const MAX_ICON = 64 * 1024;

const ID = /^[a-z][a-z0-9_-]{1,63}$/;
const VERSION = /^[A-Za-z0-9.+_-]{1,64}$/;
const SHA = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const REPO = /^[A-Za-z0-9._-]{1,100}\/[A-Za-z0-9._-]{1,100}$/;
const DOWNLOAD = /^https:\/\/github\.com\/[A-Za-z0-9._-]{1,100}\/[A-Za-z0-9._-]{1,100}\/releases\/download\/[A-Za-z0-9._+-]{1,128}\/[A-Za-z0-9._+-]{1,128}\.jar$/;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class NotOpen extends Error {}
class SlowDown extends Error {
  constructor(url, seconds) {
    super(`HTTP 429 from ${url}`);
    this.seconds = seconds;
  }
}

/** GET a URL into a Buffer, waiting out the API's rate limit (at most a few times). */
async function fetchBytes(url, max) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchOnce(url, max);
    } catch (e) {
      if (!(e instanceof SlowDown) || attempt >= 4) throw e;
      console.log(`library: the API asked to slow down; waiting ${e.seconds} s`);
      await new Promise((r) => setTimeout(r, e.seconds * 1000));
    }
  }
}

/** GET a URL into a Buffer: 200 only, at most `max` bytes, 15 s. A 404 is NotOpen, a 429 SlowDown. */
function fetchOnce(url, max) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith("https:") ? get : getHttp;
    const req = getter(url, { headers: { "User-Agent": "myriad-website-build", Accept: "*/*" }, timeout: 15_000 }, (res) => {
      if (res.statusCode === 404) {
        res.resume();
        return reject(new NotOpen(`HTTP 404 from ${url}`));
      }
      if (res.statusCode === 429) {
        res.resume();
        const after = Number(res.headers["retry-after"]);
        return reject(new SlowDown(url, Number.isFinite(after) && after > 0 ? Math.min(after, 90) : 60));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const chunks = [];
      let size = 0;
      res.on("data", (c) => {
        size += c.length;
        if (size > max) req.destroy(new Error(`${url} is too big`));
        else chunks.push(c);
      });
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("timeout", () => req.destroy(new Error(`${url} timed out`)));
    req.on("error", reject);
  });
}

async function fetchJson(path) {
  return JSON.parse((await fetchBytes(API + path, MAX_JSON)).toString("utf8"));
}

/** Developer text as shown: a string, control and invisible characters and § codes removed, at most `max` characters. */
function text(v, max) {
  if (typeof v !== "string") return "";
  return [...v]
    .filter((ch) => {
      const c = ch.codePointAt(0);
      return !(c < 0x20 || (c >= 0x7f && c < 0xa0) || c === 0xa7 || (c >= 0x200b && c <= 0x200f) || (c >= 0x202a && c <= 0x202e) || (c >= 0x2060 && c <= 0x206f) || c === 0x2028 || c === 0x2029 || c === 0xfeff);
    })
    .slice(0, max)
    .join("")
    .trim();
}

const match = (re, v) => (typeof v === "string" && re.test(v) ? v : null);
const date = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

/** One release; an invite-only listing's have no address (their jars go only to invited accounts, in game). */
function release(v, invite) {
  const version = match(VERSION, v?.version), sha256 = match(SHA, v?.sha256), url = invite ? null : match(DOWNLOAD, v?.url);
  const size = Number(v?.size);
  if (!version || !sha256 || (!invite && !url) || !Number.isSafeInteger(size) || size <= 0 || size > 64 * 1024 * 1024) return null;
  return {
    version, sha256, url, size,
    minecraft: text(v.minecraft, 100) || null,
    commit: match(COMMIT, v.commit),
    added: date(v.added),
    yanked: v.yanked === true,
  };
}

/** Developer text kept line by line: each line cleaned, blank runs squeezed, at most `maxLines` lines and `max` characters. */
function lines(v, max, maxLines) {
  if (typeof v !== "string") return "";
  const out = [];
  let blank = false;
  for (const line of v.split(/\r\n|\r|\n/)) {
    const c = text(line, max);
    if (!c) {
      if (!blank && out.length) out.push("");
      blank = true;
      continue;
    }
    blank = false;
    out.push(c);
    if (out.length >= maxLines) break;
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return [...out.join("\n")].slice(0, max).join("").trim();
}

function modules(v) {
  return (Array.isArray(v) ? v : [])
    .slice(0, 300)
    .map((m) => ({ name: text(m?.name, 64), description: text(m?.description, 200), tag: text(m?.tag, 32) }))
    .filter((m) => m.name);
}

function changelog(v) {
  const version = match(VERSION, v?.version), body = lines(v?.text, 4000, 80);
  return version && body ? { version, text: body } : null;
}

function addon(a, detail) {
  const id = match(ID, a?.id);
  if (!id || (a.badge !== "verified" && a.badge !== "reviewed")) return null;
  const invite = a.access === "invite";
  const versions = (Array.isArray(detail?.versions) ? detail.versions : []).slice(0, 50).map((v) => release(v, invite)).filter(Boolean);
  return {
    id,
    name: text(a.name, 64) || id,
    description: text(a.description, 300),
    author: text(a.author, 64),
    repo: match(REPO, a.repo),
    badge: a.badge,
    updated: date(a.updated),
    icon: false,
    versions,
    invite,
    modules: modules(detail?.modules),
    changelog: changelog(detail?.changelog),
  };
}

async function main() {
  rmSync(ICONS, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  let library = { open: false, addons: [] };
  try {
    const list = await fetchJson("/v1/library/addons");
    if (!Array.isArray(list)) throw new Error("the addon list isn't a list");
    const addons = [];
    for (const a of list.slice(0, 2000)) {
      const id = match(ID, a?.id);
      if (!id) continue;
      const detail = await fetchJson(`/v1/library/addons/${id}`);
      const entry = addon(a, detail);
      if (!entry || detail.id !== id || entry.versions.length === 0) continue; // listed, but nothing released yet
      if (a.icon) {
        try {
          const png = await fetchBytes(`${API}/v1/library/addons/${id}/icon.png`, MAX_ICON);
          if (png.length > PNG.length && png.subarray(0, PNG.length).equals(PNG)) {
            mkdirSync(ICONS, { recursive: true });
            writeFileSync(join(ICONS, `${id}.png`), png);
            entry.icon = true;
          }
        } catch (e) {
          if (!(e instanceof NotOpen)) throw e;
        }
      }
      addons.push(entry);
    }
    addons.sort((x, y) => x.name.localeCompare(y.name, "en", { sensitivity: "base" }) || x.id.localeCompare(y.id));
    library = { open: true, addons };
  } catch (e) {
    if (e instanceof NotOpen) {
      console.log("library: the Library isn't open yet");
    } else if (DEV) {
      console.warn(`library: couldn't read the Library (${e.message}); showing it empty`);
    } else {
      console.error(`library: couldn't read the Library: ${e.message}`);
      process.exit(1);
    }
  }
  writeFileSync(join(OUT, "library.json"), JSON.stringify(library, null, 2) + "\n");
  if (library.open) console.log(`library: ${library.addons.length} addon${library.addons.length === 1 ? "" : "s"}`);
}

await main();
