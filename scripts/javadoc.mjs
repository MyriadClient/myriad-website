// Puts the javadoc of Myriad's latest release at /api, before each build: reads the newest version from Myriad's maven,
// downloads its -javadoc jar and unpacks it into public/api. Core's release workflow rebuilds the site after
// publishing, so /api follows each release. Without the maven (offline), the site still builds, without /api.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { inflateRawSync } from "node:zlib";

const MAVEN = "https://maven.myriadclient.dev/releases/dev/myriadclient/myriad";
const OUT = "public/api";

/** Every file in a zip, from its central directory: {name, data}. Stored and deflated entries, as jars have. */
function unzip(zip) {
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("not a zip");
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const files = [];
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(at) !== 0x02014b50) throw new Error("bad central directory");
    const method = zip.readUInt16LE(at + 10);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28), extraLength = zip.readUInt16LE(at + 30), commentLength = zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    const name = zip.toString("utf8", at + 46, at + 46 + nameLength);
    at += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;
    // The local header's own name and extra lengths can differ from the central directory's.
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const raw = zip.subarray(start, start + size);
    if (method === 0) files.push({ name, data: raw });
    else if (method === 8) files.push({ name, data: inflateRawSync(raw) });
    else throw new Error(`${name}: compression method ${method}`);
  }
  return files;
}

async function main() {
  const metadata = await (await fetch(`${MAVEN}/maven-metadata.xml`)).text();
  const version = metadata.match(/<release>([^<]+)<\/release>/)?.[1];
  if (!version) throw new Error("no release in the maven's metadata");
  const response = await fetch(`${MAVEN}/${version}/myriad-${version}-javadoc.jar`);
  if (!response.ok) throw new Error(`javadoc jar: HTTP ${response.status}`);
  const files = unzip(Buffer.from(await response.arrayBuffer()));
  rmSync(OUT, { recursive: true, force: true });
  for (const { name, data } of files) {
    if (name.startsWith("META-INF/")) continue;
    const path = normalize(join(OUT, name));
    if (!path.startsWith(OUT)) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, data);
  }
  console.log(`javadoc: Myriad ${version} at /api (${files.length} files)`);
}

main().catch((e) => console.warn(`javadoc: not published this build (${e.message})`));
