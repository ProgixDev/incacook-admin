import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { PlatformEarningsView } from "./platform-earnings-view.tsx";
import type { PlatformEarningsReport } from "./types.ts";

const NBSP = /[  ]/g;
const render = (report: PlatformEarningsReport) =>
  renderToStaticMarkup(<PlatformEarningsView report={report} />).replace(NBSP, " ");

const ok: PlatformEarningsReport = {
  from: "2026-10-01",
  to: "2026-10-30",
  currency: "eur",
  commissionCents: 123456,
  platformBuyerFeeCents: 20000,
  stripeFeesCents: 5050,
  ordersWithoutStripeFee: 0,
  netPlatformCents: 138406,
  owedToUsersCents: 98765,
};

test("renders every total in euros for a complete report", () => {
  const html = render(ok);
  assert.match(html, /1 234,56 €/); // commission
  assert.match(html, /200,00 €/); // buyer fee
  assert.match(html, /50,50 €/); // stripe fees
  assert.match(html, /1 384,06 €/); // net
  assert.match(html, /987,65 €/); // owed
  assert.match(html, /du 01\/10\/2026 au 30\/10\/2026 inclus/);
  assert.doesNotMatch(html, /Indisponible/);
  assert.doesNotMatch(html, /orders-without-stripe-fee/);
});

test("Stripe error: net is unavailable, the error text is shown, no net number", () => {
  const html = render({
    ...ok,
    stripeFeesCents: null,
    stripeFeesError: "StripeAPIError: rate_limit",
    netPlatformCents: null,
  });
  assert.match(html, /stripe-fees-unavailable/);
  assert.match(html, /StripeAPIError: rate_limit/);
  assert.equal((html.match(/Indisponible/g) ?? []).length, 2); // fees + net
  assert.doesNotMatch(html, /1 384,06/);
  // commission, buyer fee and owed are still shown
  assert.match(html, /1 234,56 €/);
  assert.match(html, /987,65 €/);
});

test("a null net is never rendered as a number even if fees are present", () => {
  const html = render({ ...ok, netPlatformCents: null });
  assert.match(html, /metric-net/);
  assert.match(html, /Indisponible/);
});

test("orders without Stripe fee are shown only when above zero", () => {
  assert.doesNotMatch(render(ok), /orders-without-stripe-fee/);
  const html = render({ ...ok, ordersWithoutStripeFee: 3 });
  assert.match(html, /orders-without-stripe-fee/);
  assert.match(html, /3 commande\(s\) sans frais Stripe/);
});

test("empty period renders zeros and an empty note", () => {
  const html = render({
    ...ok,
    commissionCents: 0,
    platformBuyerFeeCents: 0,
    stripeFeesCents: 0,
    netPlatformCents: 0,
    owedToUsersCents: 0,
  });
  assert.match(html, /Aucune commande payée sur cette période/);
  assert.match(html, /0,00 €/);
});

test("the view offers no write action", () => {
  const html = render(ok);
  assert.doesNotMatch(html, /<button|<form|<input/);
});
