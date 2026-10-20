// Copies the Draco glTF decoder from the installed `three` package into
// `public/draco/` so the Practice Studio can decode compressed .glb models
// fully offline (no runtime dependency on the gstatic CDN that drei uses by default).
import { copyFile, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf");
const targetDir = path.join(rootDir, "public", "draco");
const decoderFiles = ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"];

async function main() {
  try {
    await access(sourceDir, constants.R_OK);
  } catch {
    // `three` is not installed yet (e.g. partial install). Skip without failing the install.
    console.warn(`[copy-draco-decoder] Skipped: source not found at ${sourceDir}`);
    return;
  }

  await mkdir(targetDir, { recursive: true });
  await Promise.all(
    decoderFiles.map((file) => copyFile(path.join(sourceDir, file), path.join(targetDir, file))),
  );
  console.log(`[copy-draco-decoder] Copied ${decoderFiles.length} files to public/draco/`);
}

main().catch((error) => {
  console.error("[copy-draco-decoder] Failed to copy Draco decoder:", error);
  process.exit(1);
});
