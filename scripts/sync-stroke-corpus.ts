import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { STROKE_CORPUS_EXPECTED_COUNT } from "../moedict.tw/src/utils/stroke-corpus";

const ASSET_BASE = "https://r2-assets.moedict.tw";
const POINTER_URL = `${ASSET_BASE}/stroke-corpus/current.json`;
const OUTPUT_DIR = join(import.meta.dir, "..", "public", "stroke-json");
const CONCURRENCY = 8;
const MAX_ATTEMPTS = 3;

type Pointer = {
  schema: number;
  corpusDigest: string;
  manifestKey: string;
  fileCount: number;
  totalBytes: number;
};

type ManifestFile = { path: string; sha256: string; bytes: number };
type Manifest = Pointer & { files: ManifestFile[] };

async function fetchRequired(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "moedict-app-stroke-corpus-sync/1" },
      });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < MAX_ATTEMPTS) await Bun.sleep(250 * 2 ** (attempt - 1));
  }
  throw new Error(`Failed to fetch ${url}: ${String(lastError)}`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function validatePointer(value: unknown): asserts value is Pointer {
  const pointer = value as Partial<Pointer>;
  if (
    pointer?.schema !== 1 ||
    typeof pointer.corpusDigest !== "string" ||
    !/^[a-f0-9]{64}$/.test(pointer.corpusDigest) ||
    pointer.manifestKey !== `stroke-corpora/${pointer.corpusDigest}/manifest.json` ||
    pointer.fileCount !== STROKE_CORPUS_EXPECTED_COUNT ||
    !Number.isInteger(pointer.totalBytes)
  ) {
    throw new Error("Invalid stroke corpus pointer");
  }
}

function validateManifest(value: unknown, pointer: Pointer): asserts value is Manifest {
  const manifest = value as Partial<Manifest>;
  if (
    manifest?.schema !== 1 ||
    manifest.corpusDigest !== pointer.corpusDigest ||
    manifest.fileCount !== pointer.fileCount ||
    manifest.totalBytes !== pointer.totalBytes ||
    !Array.isArray(manifest.files) ||
    manifest.files.length !== pointer.fileCount
  ) {
    throw new Error("Stroke corpus manifest does not match current pointer");
  }

  const paths = new Set<string>();
  let totalBytes = 0;
  for (const file of manifest.files) {
    if (
      !/^stroke-json\/[0-9a-f]{4,6}\.json$/.test(file.path) ||
      !/^[a-f0-9]{64}$/.test(file.sha256) ||
      !Number.isInteger(file.bytes) ||
      file.bytes <= 0 ||
      paths.has(file.path)
    ) {
      throw new Error(`Invalid manifest entry: ${JSON.stringify(file)}`);
    }
    paths.add(file.path);
    totalBytes += file.bytes;
  }
  if (totalBytes !== manifest.totalBytes) {
    throw new Error(`Manifest byte total mismatch: ${totalBytes} != ${manifest.totalBytes}`);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function downloadFile(file: ManifestFile): Promise<void> {
  const name = basename(file.path);
  const destination = join(OUTPUT_DIR, name);
  const temporary = `${destination}.part`;
  const response = await fetchRequired(`${ASSET_BASE}/stroke-json/${name}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) {
    throw new Error(`Downloaded file failed manifest validation: ${name}`);
  }
  JSON.parse(new TextDecoder().decode(bytes));
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

await mkdir(OUTPUT_DIR, { recursive: true });
const pointer = await (await fetchRequired(POINTER_URL)).json();
validatePointer(pointer);
const manifest = await (await fetchRequired(`${ASSET_BASE}/${pointer.manifestKey}`)).json();
validateManifest(manifest, pointer);

const missing: ManifestFile[] = [];
for (const file of manifest.files) {
  if (!(await fileExists(join(OUTPUT_DIR, basename(file.path))))) missing.push(file);
}

console.log(`Authoritative corpus: ${manifest.fileCount} files, ${manifest.totalBytes} bytes`);
console.log(`Already present: ${manifest.fileCount - missing.length}; missing: ${missing.length}`);

let nextIndex = 0;
let completed = 0;
async function worker(): Promise<void> {
  while (true) {
    const index = nextIndex;
    nextIndex += 1;
    if (index >= missing.length) return;
    await downloadFile(missing[index]);
    completed += 1;
    if (completed % 100 === 0 || completed === missing.length) {
      console.log(`Downloaded ${completed}/${missing.length} missing files`);
    }
  }
}

try {
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, missing.length) }, () => worker()));
} catch (error) {
  const entries = await readdir(OUTPUT_DIR);
  await Promise.all(entries.filter((name) => name.endsWith(".part")).map((name) => rm(join(OUTPUT_DIR, name))));
  throw error;
}

const localNames = (await readdir(OUTPUT_DIR)).filter((name) => /^[0-9a-f]{4,6}\.json$/.test(name));
const expectedNames = new Set(manifest.files.map((file) => basename(file.path)));
if (localNames.length !== manifest.fileCount || localNames.some((name) => !expectedNames.has(name))) {
  throw new Error(`Local corpus membership mismatch: found ${localNames.length}, expected ${manifest.fileCount}`);
}

let localBytes = 0;
for (const file of manifest.files) {
  const bytes = await readFile(join(OUTPUT_DIR, basename(file.path)));
  if (bytes.byteLength === 0) {
    throw new Error(`Local file is empty: ${file.path}`);
  }
  JSON.parse(bytes.toString("utf8"));
  localBytes += bytes.byteLength;
}

console.log(
  `Verified corpus membership and non-empty JSON for ${localNames.length} files (${localBytes} bytes) at ${manifest.corpusDigest}`,
);
