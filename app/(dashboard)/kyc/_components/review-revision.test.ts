import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { revisionToSend } from "./review-revision";

describe("revisionToSend", () => {
  it("returns the revision of the document on screen", () => {
    assert.equal(revisionToSend({ id: "doc-1", revision: 3 }, "doc-1"), 3);
  });

  it("returns null while the next document loads (the previous detail is still held)", () => {
    assert.equal(revisionToSend({ id: "doc-1", revision: 3 }, "doc-2"), null);
  });

  it("returns null with no detail or no document", () => {
    assert.equal(revisionToSend(null, "doc-1"), null);
    assert.equal(revisionToSend(undefined, "doc-1"), null);
    assert.equal(revisionToSend({ id: "doc-1", revision: 3 }, null), null);
  });
});
