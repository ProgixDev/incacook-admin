import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { todoView, type TodoResponse } from "./todo-model";

const none: TodoResponse = {
  kycPeople: 0,
  trialRequests: 0,
  readyWithoutAccess: 0,
  reports: 0,
  disputes: 0,
  catalogClaims: 0,
};

describe("todoView", () => {
  it("lists nothing when nothing is waiting", () => {
    assert.deepEqual(todoView(none), { items: [], unavailable: [] });
  });

  it("lists only the queues with something to do, people first", () => {
    const v = todoView({ ...none, reports: 2, kycPeople: 3, trialRequests: 1 });
    assert.deepEqual(
      v.items.map((i) => [i.key, i.count]),
      [
        ["kycPeople", 3],
        ["trialRequests", 1],
        ["reports", 2],
      ],
    );
  });

  it("links each queue to the page that handles it", () => {
    const v = todoView({
      ...none,
      kycPeople: 1,
      trialRequests: 1,
      readyWithoutAccess: 1,
      disputes: 1,
      catalogClaims: 1,
      reports: 1,
    });
    assert.deepEqual(
      v.items.map((i) => i.href),
      [
        "/kyc",
        "/seller-activation?view=pending",
        "/seller-activation?view=ready",
        "/disputes",
        "/catalog-claims",
        "/reports",
      ],
    );
  });

  it("reports an unreadable count apart, never as nothing to do", () => {
    const v = todoView({ ...none, kycPeople: null, reports: 4 });
    assert.deepEqual(v.unavailable, ["Identités à vérifier"]);
    assert.deepEqual(
      v.items.map((i) => i.key),
      ["reports"],
    );
  });
});
