import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDispatchRadiusSteps } from "./dispatch-radius.ts";

const validDefault = [{ delay: "00:00", radius: "" }];

test("accepts the single unlimited dispatch schedule", () => {
  assert.deepEqual(parseDispatchRadiusSteps(validDefault, 3600), {
    steps: [{ afterSeconds: 0, radiusMeters: null }],
    error: null,
  });
});

test("converts mm:ss and decimal kilometres into integer API units", () => {
  assert.deepEqual(
    parseDispatchRadiusSteps(
      [
        { delay: "00:00", radius: "2.5" },
        { delay: "01:30", radius: "4" },
      ],
      600,
    ),
    {
      steps: [
        { afterSeconds: 0, radiusMeters: 2500 },
        { afterSeconds: 90, radiusMeters: 4000 },
      ],
      error: null,
    },
  );
});

test("rejects invalid times, non-increasing radii, late final steps and over-limit radii", () => {
  assert.match(parseDispatchRadiusSteps([{ delay: "00:60", radius: "1" }], 3600).error!, /secondes/);
  assert.match(
    parseDispatchRadiusSteps(
      [{ delay: "00:00", radius: "3" }, { delay: "00:10", radius: "2" }],
      3600,
    ).error!,
    /croissant/,
  );
  assert.match(
    parseDispatchRadiusSteps(
      [{ delay: "00:00", radius: "1" }, { delay: "10:00", radius: "" }],
      600,
    ).error!,
    /délai sans livreur/,
  );
  assert.match(parseDispatchRadiusSteps([{ delay: "00:00", radius: "200.01" }], 3600).error!, /200 km/);
});

test("enforces row, delay, and unlimited boundaries", () => {
  assert.equal(parseDispatchRadiusSteps([], 900).steps, null);
  assert.equal(parseDispatchRadiusSteps(Array(9).fill(validDefault[0]), 900).steps, null);
  assert.match(parseDispatchRadiusSteps([{ delay: "00:01", radius: "" }], 900).error!, /premier délai/);
  assert.match(parseDispatchRadiusSteps([{ delay: "00:00", radius: "1" }, { delay: "00:00", radius: "" }], 900).error!, /croissants/);
  assert.match(parseDispatchRadiusSteps([{ delay: "00:00", radius: "" }, { delay: "00:01", radius: "2" }], 900).error!, /dernière étape/);
  assert.equal(parseDispatchRadiusSteps([{ delay: "00:00", radius: "200" }], 900).steps?.[0].radiusMeters, 200000);
  assert.match(parseDispatchRadiusSteps([{ delay: "00:00", radius: "0.0001" }], 900).error!, /rayon/);
  assert.match(parseDispatchRadiusSteps([{ delay: "00:00", radius: "0x10" }], 900).error!, /rayon/);
});
