#!/usr/bin/env node

import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

// Load the same .env* files `next build` will read (process.env still wins),
// so a value configured in .env.production / .env.local passes validation.
const projectRoot = process.cwd();
// `@next/env` is Next's own dependency, so resolve it from next's location.
const nextPackage = createRequire(path.join(projectRoot, "package.json")).resolve(
  "next/package.json",
);
const { loadEnvConfig } = createRequire(nextPackage)("@next/env");
loadEnvConfig(projectRoot, false);

const origin = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!origin) {
  console.error("Build failed: NEXT_PUBLIC_API_BASE_URL is required.");
  process.exit(1);
}

let parsedOrigin;
try {
  parsedOrigin = new URL(origin);
} catch {
  console.error("Build failed: NEXT_PUBLIC_API_BASE_URL must be a valid HTTPS origin.");
  process.exit(1);
}

if (
  parsedOrigin.protocol !== "https:" ||
  parsedOrigin.hostname === "localhost" ||
  parsedOrigin.hostname.endsWith(".localhost") ||
  parsedOrigin.hostname.startsWith("127.") ||
  parsedOrigin.hostname === "[::1]" ||
  parsedOrigin.username !== "" ||
  parsedOrigin.password !== "" ||
  parsedOrigin.pathname !== "/" ||
  parsedOrigin.search !== "" ||
  parsedOrigin.hash !== ""
) {
  console.error("Build failed: NEXT_PUBLIC_API_BASE_URL must be a public HTTPS origin without credentials, path, query, or fragment.");
  process.exit(1);
}

const buildDir = path.join(projectRoot, ".next");
rmSync(buildDir, { recursive: true, force: true });

const build = spawnSync(
  process.execPath,
  [path.join(projectRoot, "node_modules/next/dist/bin/next"), "build"],
  { cwd: projectRoot, stdio: "inherit" },
);
if (build.status !== 0) process.exit(build.status ?? 1);

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  });
}

const staticDir = path.join(buildDir, "static");
const bundleFiles = collectFiles(staticDir).filter((file) => file.endsWith(".js"));
const bundleText = bundleFiles.map((file) => readFileSync(file, "utf8")).join("\n");

if (!bundleText.includes(parsedOrigin.origin)) {
  console.error(
    `Build verification failed: ${parsedOrigin.origin} was not found in the client bundle.`,
  );
  process.exit(1);
}
if (/railway\.app/i.test(bundleText)) {
  console.error("Build verification failed: a Railway hostname was found in the client bundle.");
  process.exit(1);
}

console.log(`Verified client bundle API origin: ${parsedOrigin.origin}`);
