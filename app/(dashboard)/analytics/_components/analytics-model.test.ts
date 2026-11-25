import { test } from "node:test";
import assert from "node:assert/strict";
import {
  barPercent,
  dailyTotal,
  formatCount,
  formatRate,
  outcomeCard,
  shortDay,
  valueLabel,
} from "./analytics-model.ts";

test("rates: French decimal comma, whole numbers from 10 %, a dash when there is none", () => {
  assert.equal(formatRate(null), "—");
  assert.equal(formatRate(Number.NaN), "—");
  assert.equal(formatRate(0), "0 %");
  assert.equal(formatRate(1), "100 %");
  assert.equal(formatRate(0.42), "42 %");
  assert.equal(formatRate(0.035), "3,5 %");
  assert.equal(formatRate(0.2), "20 %");
});

test("counts use the French grouping", () => {
  assert.equal(formatCount(0), "0");
  assert.match(formatCount(12345), /^12\s?345$/u);
});

test("bars: relative to the largest, a non-zero value always shows, zero never does", () => {
  assert.equal(barPercent(0, 10), 0);
  assert.equal(barPercent(10, 10), 100);
  assert.equal(barPercent(5, 10), 50);
  assert.equal(barPercent(1, 1000), 2);
  assert.equal(barPercent(5, 0), 0);
});

test("parameter values get French labels, unknown ones are shown as logged", () => {
  assert.equal(valueLabel("sign_up", "method", "google"), "Google");
  assert.equal(valueLabel("role_selected", "role", "seller"), "Vendeur");
  assert.equal(
    valueLabel("paywall_view", "source", "lapsed"),
    "Abonnement expiré",
  );
  assert.equal(valueLabel("tutorial_complete", "skipped", "1"), "Passé");
  assert.equal(
    valueLabel("trial_request", "result", "not_eligible"),
    "Non éligible",
  );
  assert.equal(
    valueLabel("subscription_purchase", "result", "success"),
    "Réussi",
  );
  // "result" means different things per event: the same word is labelled per event
  assert.equal(
    valueLabel("subscription_purchase", "result", "requested"),
    "requested",
  );
  assert.equal(
    valueLabel("signup_step_view", "step", "basicInfo"),
    "basicInfo",
  );
});

test("daily totals and axis labels", () => {
  const daily = [
    { date: "2026-11-24", signUp: 2, trialRequest: 1, subscriptionPurchase: 0 },
    { date: "2026-11-25", signUp: 3, trialRequest: 0, subscriptionPurchase: 4 },
  ];
  assert.equal(dailyTotal(daily, "signUp"), 5);
  assert.equal(dailyTotal(daily, "subscriptionPurchase"), 4);
  assert.equal(shortDay("2026-11-25"), "25/11");
  assert.equal(shortDay("weird"), "weird");
});

const step = (events: number, succeededEvents: number | null) => ({
  event: "subscription_purchase",
  label: "x",
  events,
  succeededEvents,
  users: events,
  conversionFromPrevious: null,
  conversionFromFirst: null,
});
const labels = {
  success: "Abonnements achetés",
  attempts: "Tentatives d’achat",
};

test("outcome card: successes under the success label when Google can tell", () => {
  assert.deepEqual(outcomeCard(step(7, 2), labels), {
    label: "Abonnements achetés",
    value: 2,
    hint: "sur 7 tentatives",
  });
  assert.deepEqual(outcomeCard(step(1, 1), labels), {
    label: "Abonnements achetés",
    value: 1,
    hint: "sur 1 tentative",
  });
  assert.equal(outcomeCard(step(3, 0), labels).value, 0);
});

test("outcome card: never shows attempts under a success label", () => {
  const unknown = outcomeCard(step(7, null), labels);
  assert.equal(unknown.label, "Tentatives d’achat");
  assert.equal(unknown.value, 7);
  assert.equal(outcomeCard(undefined, labels).value, 0);
});
