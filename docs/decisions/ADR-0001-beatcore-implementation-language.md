# ADR-0001: BeatCore Implementation Language

**Status:** Accepted for BeatCore foundation implementation

## Decision

Implement the first BeatCore foundation as **TypeScript with Node.js**, using only the language/runtime standard library for the initial domain core and Node's built-in test runner.

This decision is intentionally narrow:

- no web framework
- no ORM
- no database vendor
- no authentication provider
- no AI provider
- no payment provider
- no frontend framework
- no cloud-specific dependency

The first implementation is therefore a framework-independent domain foundation.

## Rationale

BeatCore requires explicit types, discriminated lifecycle states, stable identifiers, validation, and executable invariant tests. TypeScript provides these without forcing a broader application architecture.

Node's built-in test runner keeps the foundation small and avoids adding dependency or framework architecture before the domain contract is proven.

## Consequence

This ADR authorizes implementation of the BeatCore foundation only. It does not freeze the eventual application stack.

Any later replacement of the implementation language/runtime requires a migration decision while preserving the canonical BeatCore semantics.
