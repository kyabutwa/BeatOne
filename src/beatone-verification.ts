export type VerificationChannel = "email" | "phone";
export type VerificationProvider = "neon_auth" | "twilio_verify";

type Sql = any;

export interface VerificationChallenge {
  id: string;
  accountId: string;
  identityId: string;
  channel: VerificationChannel;
  targetHash: string;
  provider: VerificationProvider;
  expiresAt: string;
}

export async function beginVerificationChallenge(
  sql: Sql,
  input: {
    accountId: string;
    identityId: string;
    channel: VerificationChannel;
    targetHash: string;
    provider: VerificationProvider;
    ttlSeconds?: number;
  }
): Promise<VerificationChallenge> {
  const ttlSeconds = Math.max(60, Math.min(input.ttlSeconds ?? 600, 3600));
  const id = "verification-challenge-" + crypto.randomUUID();

  await sql.transaction([
    sql`UPDATE public.verification_challenges
         SET status='SUPERSEDED', superseded_at=now()
         WHERE account_id=${input.accountId}
           AND channel=${input.channel}
           AND target_hash=${input.targetHash}
           AND status='PENDING'`,
    sql`INSERT INTO public.verification_challenges(
           id, account_id, identity_id, channel, target_hash, provider,
           status, requested_at, expires_at, attempt_count
         )
         VALUES(
           ${id}, ${input.accountId}, ${input.identityId}, ${input.channel},
           ${input.targetHash}, ${input.provider}, 'PENDING', now(),
           now() + (${ttlSeconds} * interval '1 second'), 0
         )`
  ]);

  return {
    id,
    accountId: input.accountId,
    identityId: input.identityId,
    channel: input.channel,
    targetHash: input.targetHash,
    provider: input.provider,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString()
  };
}

export async function recordVerificationProviderResult(
  sql: Sql,
  challengeId: string,
  result: { ok: boolean; providerReference?: string | null; errorCode?: string | null }
): Promise<void> {
  if (result.ok) {
    await sql`UPDATE public.verification_challenges
      SET provider_reference=${result.providerReference || null}
      WHERE id=${challengeId} AND status='PENDING'`;
    return;
  }

  await sql`UPDATE public.verification_challenges
    SET status='FAILED', failed_at=now(), provider_reference=${result.providerReference || null},
        last_error_code=${result.errorCode || 'VERIFICATION_PROVIDER_FAILED'}
    WHERE id=${challengeId} AND status='PENDING'`;
}

export async function recordVerificationAttempt(
  sql: Sql,
  challengeId: string,
  result: { ok: boolean; errorCode?: string | null }
): Promise<void> {
  if (result.ok) {
    await sql`UPDATE public.verification_challenges
      SET status='VERIFIED', verified_at=now(), attempt_count=attempt_count+1
      WHERE id=${challengeId} AND status='PENDING' AND expires_at > now()`;
    return;
  }

  await sql`UPDATE public.verification_challenges
    SET attempt_count=attempt_count+1,
        last_error_code=${result.errorCode || 'VERIFICATION_FAILED'},
        status=CASE WHEN expires_at <= now() THEN 'EXPIRED' ELSE status END,
        failed_at=CASE WHEN expires_at <= now() THEN now() ELSE failed_at END
    WHERE id=${challengeId} AND status='PENDING'`;
}
