import { spawnSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

const importClient = `
  const imported = await import("./lib/api/client.ts");
  const API_BASE_URL = imported.API_BASE_URL ?? imported.default?.API_BASE_URL;
  console.log(API_BASE_URL);
`;

function loadClient(apiOrigin?: string) {
  const env = { ...process.env };
  delete env.NEXT_PUBLIC_API_BASE_URL;
  if (apiOrigin !== undefined) env.NEXT_PUBLIC_API_BASE_URL = apiOrigin;

  return spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", importClient],
    { cwd: process.cwd(), env, encoding: "utf8" },
  );
}

test("API_BASE_URL normalizes a trailing slash and adds the v1 prefix", () => {
  const result = loadClient("https://staging-api.example.run/");

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "https://staging-api.example.run/v1");
});

test("API client fails fast when the API origin is missing", () => {
  const result = loadClient();

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXT_PUBLIC_API_BASE_URL is required/);
});

test("API client rejects an origin that already includes the v1 prefix", () => {
  const result = loadClient("https://staging-api.example.run/v1");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be an HTTPS origin without a path/);
});

test("production build validation rejects localhost origins", () => {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: "https://localhost" },
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be a public HTTPS origin/);
});
