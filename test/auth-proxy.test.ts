import test from "node:test";
import assert from "node:assert/strict";
import { prepareProviderAuthRequest } from "../src/worker.ts";

test("auth proxy forwards Origin and makes relative callbackURL absolute", () => {
  const request = new Request("https://zalagren.kyabutwabis-f.workers.dev/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      origin: "https://zalagren.kyabutwabis-f.workers.dev",
      "content-type": "application/json"
    }
  });

  const prepared = prepareProviderAuthRequest(request, {
    name: "Test Participant",
    email: "test@example.com",
    password: "password1234",
    callbackURL: "/"
  });

  assert.equal(prepared.headers.get("origin"), "https://zalagren.kyabutwabis-f.workers.dev");
  assert.equal(
    (prepared.body as Record<string, unknown>).callbackURL,
    "https://zalagren.kyabutwabis-f.workers.dev/"
  );
});

test("auth proxy supplies an absolute home callback when callbackURL is omitted", () => {
  const request = new Request("https://zalagren.kyabutwabis-f.workers.dev/api/auth/sign-in/email", {
    method: "POST",
    headers: { origin: "https://zalagren.kyabutwabis-f.workers.dev" }
  });

  const prepared = prepareProviderAuthRequest(request, {
    email: "test@example.com",
    password: "password1234"
  });

  assert.equal(prepared.headers.get("origin"), "https://zalagren.kyabutwabis-f.workers.dev");
  assert.equal(
    (prepared.body as Record<string, unknown>).callbackURL,
    "https://zalagren.kyabutwabis-f.workers.dev/"
  );
});
