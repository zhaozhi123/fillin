import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const entryPoint = process.argv[2];
if (!entryPoint) throw new Error("Missing test entry point");

const outputDirectory = await mkdtemp(join(tmpdir(), "fillin-test-"));
const outputFile = join(
  outputDirectory,
  `${basename(entryPoint).replace(/\.[^.]+$/, "")}.mjs`
);

try {
  await build({
    entryPoints: [resolve(entryPoint)],
    outfile: outputFile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    logLevel: "silent"
  });
  await import(`${pathToFileURL(outputFile).href}?run=${Date.now()}`);
} finally {
  await rm(outputDirectory, { recursive: true, force: true });
}
