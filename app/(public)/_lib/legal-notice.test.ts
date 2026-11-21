import assert from "node:assert/strict";
import { test } from "node:test";

import { isLegalNoticeComplete, LEGAL_NOTICE, LEGAL_PAGE_LINKS } from "./legal-notice";

test("the legal notice needs both a publication director and a phone number", () => {
  assert.equal(isLegalNoticeComplete({ publicationDirector: "", phone: "" }), false);
  assert.equal(isLegalNoticeComplete({ publicationDirector: "A. Martin", phone: " " }), false);
  assert.equal(isLegalNoticeComplete({ publicationDirector: " ", phone: "+33 1 00 00 00 00" }), false);
  assert.equal(isLegalNoticeComplete({ publicationDirector: "A. Martin", phone: "+33 1 00 00 00 00" }), true);
});

test("no link points to the legal notice while it is incomplete", () => {
  const linked = LEGAL_PAGE_LINKS.some((link) => link.href === "/mentions-legales");
  assert.equal(linked, isLegalNoticeComplete(LEGAL_NOTICE));
});
