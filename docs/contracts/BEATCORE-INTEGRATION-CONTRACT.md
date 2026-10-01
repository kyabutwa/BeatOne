# BeatOne — Integration Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT

## Purpose

This contract defines the provider-neutral boundary between the canonical BeatOne core and external systems.

The boundary is:

`BeatOne Canonical Core → Integration Adapter → External System`

The integration layer transports and translates; it does not become a second source of BeatOne business truth.

## 1. Canonical authority

BeatOne remains authoritative for:

- Identity and Participant;
- Context and Relationship;
- Capability and Authorization;
- Intent and Proposal;
- Action, Event, and Evidence;
- lifecycle semantics;
- canonical identifiers.

External identifiers are secondary references only.

An adapter MUST NOT manufacture authorization, identity, Action completion, Event occurrence, or Evidence.

## 2. Adapter boundary

An adapter represents one external-system capability without exposing provider-specific semantics to the canonical domain.

The canonical side supplies:

- canonical request identifier;
- Action identifier;
- operation;
- authorized actor/context where applicable;
- correlation/causation metadata;
- idempotency key when required;
- mapped external payload.

The adapter returns an explicit external outcome:

- `ACCEPTED` — external system accepted the request, but completion is not established;
- `REJECTED` — external system explicitly rejected it;
- `UNKNOWN` — outcome cannot be established safely.

A successful transport response alone MUST NOT be interpreted as real-world completion.

## 3. External references

External references are:

`provider + reference`

They are stored/returned as secondary correlation data.

They MUST NOT replace canonical BeatOne IDs.

## 4. Correlation and causation

Every integration attempt MUST be traceable to the originating canonical request.

The boundary supports:

- requestId;
- correlationId;
- causationId;
- actionId;
- external reference.

These fields provide traceability and do not grant authority.

## 5. Idempotency

When an operation is idempotent, the canonical idempotency key MUST be forwarded unchanged to the adapter.

Repeated delivery MUST NOT silently create duplicate canonical actions.

An adapter may receive the same request more than once. The boundary must preserve the key so provider-side deduplication can occur where supported.

## 6. Callback/webhook boundary

Callbacks are untrusted input until authenticated and validated.

The integration boundary may accept a normalized callback only after an adapter-specific verification step establishes:

- authenticity;
- provider identity;
- event/reference identity;
- payload integrity;
- replay/duplicate handling information.

A callback does not itself grant authorization.

## 7. Failure and timeout semantics

The boundary distinguishes:

- explicit rejection;
- transport/dependency failure;
- timeout;
- unknown external outcome.

A timeout MUST NOT be converted to success.

When the external result cannot be safely determined, the canonical outcome remains unknown and may require reconciliation.

## 8. Reconciliation

Reconciliation is the mechanism for resolving unknown external outcomes.

A reconciliation result MUST identify:

- canonical action;
- external reference when known;
- observed external state;
- observation time;
- evidence/source where applicable.

Reconciliation may establish a later canonical lifecycle transition only through the appropriate domain operation and evidence rules.

## 9. Duplicate delivery and ordering

Duplicate callbacks are expected integration conditions.

The boundary must support deterministic duplicate detection using provider/event references and correlation data.

Out-of-order external messages MUST NOT overwrite newer canonical truth without validation against the canonical lifecycle.

## 10. Partial failure

External success and local persistence are not one atomic transaction.

If an external operation succeeds but local recording fails, BeatOne MUST NOT fabricate local completion. The state becomes reconciliation-required/unknown until canonical evidence is recovered.

If local recording succeeds but the external operation later fails, the canonical lifecycle must use the appropriate failure/compensation semantics rather than rewriting history.

## 11. Evidence

Evidence is distinct from Event.

External responses may provide evidence, but the integration layer MUST preserve:

- source/provider;
- external reference;
- verification state;
- recorded time.

Unverified external input remains unverified.

## 12. Authorization

Integration execution occurs only after the canonical application/domain boundary has established the required authority.

An external provider's credentials or acceptance response do not constitute BeatOne authorization.

## 13. Provider isolation

Provider-specific SDKs, credentials, transport protocols, retries, and payload formats belong behind the adapter.

The canonical core must remain provider-neutral.

No provider is selected by this contract.

## 14. Explicit non-goals

This contract does not introduce:

- payment providers;
- M-PESA or bank rails;
- authentication vendors;
- cloud-specific services;
- hardware;
- production webhooks;
- production databases;
- infrastructure deployment;
- provider SDKs.

## 15. Implementation gate

The controlled implementation is intentionally narrow:

1. define provider-neutral integration types;
2. define an adapter interface;
3. normalize external outcomes;
4. preserve canonical correlation/idempotency/reference data;
5. keep unknown outcomes explicit;
6. test duplicate/timeout/unknown/rejection/acceptance semantics;
7. verify CI;
8. perform fresh bottom-up reconciliation.

## Completion condition

**Integration Contract → Boundary Implementation → Tests → CI Verification → Fresh Reconciliation**

No external provider is required to complete this foundation layer.
