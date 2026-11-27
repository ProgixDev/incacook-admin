import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { trialOfferLabel, trialOfferPhrase } from "./trial-offer";

describe("trial offer wording (same rule as the server and the app)", () => {
  it("reads multiples of 30 days in months", () => {
    assert.equal(trialOfferLabel(60), "2 mois");
    assert.equal(trialOfferLabel(30), "1 mois");
    assert.equal(trialOfferLabel(90), "3 mois");
    assert.equal(trialOfferLabel(360), "12 mois");
  });

  it("reads anything else in days", () => {
    assert.equal(trialOfferLabel(45), "45 jours");
    assert.equal(trialOfferLabel(7), "7 jours");
    assert.equal(trialOfferLabel(365), "365 jours");
  });

  it("agrees the phrase in number", () => {
    assert.equal(trialOfferPhrase(60), "2 mois offerts");
    assert.equal(trialOfferPhrase(30), "1 mois offert");
    assert.equal(trialOfferPhrase(45), "45 jours offerts");
  });
});
