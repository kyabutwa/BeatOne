# Evidence Fresh Bottom-Up Reconciliation

**Status:** 🟢 VERIFIED — REVIEW COMPLETE, IMPLEMENTATION GAP IDENTIFIED
**Date:** 2026-10-01

## Scope

Reviewed Evidence from the canonical BeatCore type through persistence representation, repository validation, existing constructor behavior, Event linkage, verification state, external references, and tests.

## Existing foundation

Already present:
- canonical `Evidence` type;
- `evidences` persistence owner;
- optional Event linkage;
- source and recordedAt;
- explicit verification state;
- external reference fields;
- basic constructor validation;
- repository reference and external-pair validation;
- Evidence/Event separation tests.

## Gaps identified

The existing implementation is too permissive for the canonical Evidence boundary:
- an Evidence record linked to an Event does not currently enforce that the Event exists at construction time through the domain boundary;
- verification state semantics are not yet documented and tested as an explicit lifecycle;
- external reference pairing is enforced only in persistence, not by the canonical constructor;
- timestamp and verification validation need a dedicated invariant boundary;
- there is no dedicated Evidence contract, persistence reconciliation, dedicated test suite, or final reconciliation.

## Canonical Evidence boundary

Evidence is a record supporting, qualifying, or documenting an Event or other canonical claim.

Evidence is not an Event and does not become an Event merely because it references one.

Verification states:
- UNVERIFIED — recorded but not established as verified;
- VERIFIED — explicitly verified by an authorized verification process;
- REJECTED — explicitly rejected by such a process.

Creating Evidence does not automatically mark it VERIFIED.

External references are secondary metadata and never replace the canonical Evidence ID.

## Controlled execution

Fresh Reconciliation → Evidence Contract → Implementation Audit/Repair → Persistence Reconciliation → Dedicated Tests → CI → Final Fresh Reconciliation.

## Explicit non-goals

No GENESIS, external provider, authentication provider, migration, production database, infrastructure, OneApp, Website, or higher-domain implementation.

**Next controlled action: formalize and repair only the Evidence boundary identified above.**
