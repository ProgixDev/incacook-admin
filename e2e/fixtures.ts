import { test as base } from "@playwright/test";

/**
 * `test` with a CORS bridge for live-backend runs.
 *
 * The browser talks to the real API (E2E_API_BASE_URL) but the API's
 * ALLOWED_ORIGINS only lists its own app origins, not the Playwright dev
 * server (http://127.0.0.1:3100). Every request to the API origin is forwarded
 * from Node (no CORS there) to the real backend and the response is returned
 * with permissive CORS headers. Nothing is mocked: status, body and auth all
 * come from the live backend.
 */
const API_ORIGIN = process.env.E2E_API_BASE_URL
  ? new URL(process.env.E2E_API_BASE_URL).origin
  : null;

export const test = base.extend({
  context: async ({ context }, provide) => {
    if (API_ORIGIN) {
      await context.route(`${API_ORIGIN}/**`, async (route) => {
        const request = route.request();
        const origin = request.headers()["origin"] ?? "*";
        const cors = {
          "access-control-allow-origin": origin,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
          "access-control-allow-headers":
            request.headers()["access-control-request-headers"] ?? "*",
        };
        if (request.method() === "OPTIONS") {
          await route.fulfill({ status: 204, headers: cors });
          return;
        }
        try {
          const response = await route.fetch();
          await route.fulfill({ response, headers: { ...response.headers(), ...cors } });
        } catch {
          // Test ended with this request still in flight; nothing to deliver.
        }
      });
    }
    await provide(context);
    await context.unrouteAll({ behavior: "ignoreErrors" });
  },
});

export { expect } from "@playwright/test";
