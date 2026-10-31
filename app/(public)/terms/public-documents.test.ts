import { test } from "node:test";
import assert from "node:assert/strict";
import { publicTermsDocuments } from "./public-documents.ts";

const row = (kind: string, id = kind) => ({
  id,
  kind,
  version: "1.0.0",
  title: kind,
  content: "x",
  publishedAt: null,
});

test("/terms keeps CGU and CGV only, in response order", () => {
  const out = publicTermsDocuments([row("CGU"), row("CGV")]);
  assert.deepEqual(out.map((d) => d.kind), ["CGU", "CGV"]);
});

test("/terms ignores the courier contract if it appears in a public response", () => {
  const out = publicTermsDocuments([
    row("DRIVER_CONTRACT"),
    row("CGU"),
    row("HYGIENE"),
  ]);
  assert.deepEqual(out.map((d) => d.kind), ["CGU"]);
});

test("/terms with only the courier contract shows nothing", () => {
  assert.deepEqual(publicTermsDocuments([row("DRIVER_CONTRACT")]), []);
});
