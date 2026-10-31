import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_KINDS,
  documentState,
  isReadOnly,
  kindLabel,
  kindShort,
  newDraftSeed,
  type LegalDocument,
} from "./types.ts";

function doc(overrides: Partial<LegalDocument> = {}): LegalDocument {
  return {
    id: "d1",
    kind: "DRIVER_CONTRACT",
    version: "1.0.0",
    title: "Contrat livreur",
    content: "Texte de test",
    isActive: false,
    publishedAt: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

test("the editor offers the courier contract as a third document kind", () => {
  assert.deepEqual(LEGAL_KINDS, ["CGU", "CGV", "DRIVER_CONTRACT"]);
  assert.equal(kindShort("DRIVER_CONTRACT"), "Contrat livreur");
  assert.match(kindLabel("DRIVER_CONTRACT"), /Contrat/);
});

test("unknown kinds fall back to the raw value instead of crashing", () => {
  assert.equal(kindShort("HYGIENE"), "HYGIENE");
  assert.equal(kindLabel("HYGIENE"), "HYGIENE");
});

test("an unpublished row is an editable draft", () => {
  const d = doc();
  assert.equal(documentState(d), "draft");
  assert.equal(isReadOnly(d), false);
});

test("the active published row is read-only", () => {
  const d = doc({ isActive: true, publishedAt: "2026-10-02T10:00:00.000Z" });
  assert.equal(documentState(d), "active");
  assert.equal(isReadOnly(d), true);
});

test("a superseded published row (published, no longer active) is read-only", () => {
  const d = doc({ isActive: false, publishedAt: "2026-10-02T10:00:00.000Z" });
  assert.equal(documentState(d), "superseded");
  assert.equal(isReadOnly(d), true);
});

test("an active row is read-only even if publishedAt is missing", () => {
  const d = doc({ isActive: true, publishedAt: null });
  assert.equal(documentState(d), "active");
  assert.equal(isReadOnly(d), true);
});

test("a correction starts a new draft seeded from the published version, never reusing its version", () => {
  const published = doc({
    isActive: true,
    publishedAt: "2026-10-02T10:00:00.000Z",
    version: "1.0.0",
    title: "Contrat v1",
    content: "Corps publié",
  });
  const seed = newDraftSeed(published);
  assert.deepEqual(seed, {
    kind: "DRIVER_CONTRACT",
    version: "",
    title: "Contrat v1",
    content: "Corps publié",
  });
  // The published row itself is untouched.
  assert.equal(published.version, "1.0.0");
  assert.equal(published.content, "Corps publié");
});

test("a seed from a row with an unexpected kind is rejected rather than creating an unsupported draft", () => {
  assert.equal(newDraftSeed(doc({ kind: "HYGIENE" })), null);
});
