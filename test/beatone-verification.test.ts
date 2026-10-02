import test from "node:test";
import assert from "node:assert/strict";
import {
  beginVerificationChallenge,
  recordVerificationAttempt,
  recordVerificationProviderResult
} from "../src/beatone-verification.js";

function fakeSql() {
  const calls: string[] = [];
  const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push(strings.join("•"));
    return Promise.resolve([]);
  }) as any;
  sql.transaction = async (statements: unknown[]) => {
    calls.push("TRANSACTION:" + statements.length);
  };
  return { sql, calls };
}

test("resend supersedes the previous pending challenge before creating one current challenge", async () => {
  const { sql, calls } = fakeSql();
  const challenge = await beginVerificationChallenge(sql, {
    accountId: "account-1",
    identityId: "identity-1",
    channel: "email",
    targetHash: "a".repeat(64),
    provider: "neon_auth",
    ttlSeconds: 600
  });

  assert.equal(challenge.accountId, "account-1");
  assert.equal(challenge.identityId, "identity-1");
  assert.equal(challenge.channel, "email");
  assert.equal(challenge.provider, "neon_auth");
  assert.equal(calls[0], "TRANSACTION:2");
});

test("failed verification attempts explicitly expire a pending challenge when its TTL has elapsed", async () => {
  const { sql, calls } = fakeSql();
  await recordVerificationAttempt(sql, "challenge-1", {
    ok: false,
    errorCode: "VERIFICATION_CHALLENGE_EXPIRED"
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0], /status=CASE WHEN expires_at <= now\(\) THEN 'EXPIRED'/);
  assert.match(calls[0], /attempt_count=attempt_count\+1/);
});

test("provider failure makes the exact challenge FAILED without storing an OTP", async () => {
  const { sql, calls } = fakeSql();
  await recordVerificationProviderResult(sql, "challenge-1", {
    ok: false,
    errorCode: "EMAIL_OTP_PROVIDER_FAILED"
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0], /status='FAILED'/);
  assert.doesNotMatch(calls[0], /otp/i);
});
