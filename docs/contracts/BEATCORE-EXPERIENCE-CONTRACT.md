# BeatOne — Experience Contract

**Date:** 2026-10-01  
**Repository:** kyabutwa/BeatOne  
**Branch:** main  
**Scope:** OneApp + Platform Website experience boundary  
**Status:** 🔵 PROPOSED FOR IMPLEMENTATION

## 1. Purpose

This contract defines the framework-neutral boundary between BeatOne Experience surfaces and the canonical Application/API layer.

Experience means:
- OneApp
- Platform Website

Both consume the same canonical application semantics.

## 2. Dependency direction

`Experience → Application/API → Domain Operations → Repository Boundary → Persistence Representation`

Experience is a consumer of canonical meaning. It is never a second domain authority.

## 3. Experience client boundary

The Experience layer communicates with Application/API through a narrow client interface.

The client boundary must:
- accept typed application requests;
- return canonical application responses;
- preserve canonical error categories;
- distinguish transport/client failure from domain outcomes;
- never manufacture authorization;
- never mutate persistence directly.

A concrete HTTP, RPC, framework, browser, or mobile transport is outside this contract.

## 4. Request handling

An Experience command may carry:
- request identity;
- action identity;
- event identity;
- actor identity as supplied to the Application/API boundary;
- operation;
- authorization context only when supplied by a trusted Application/API mechanism.

Experience must not treat client-visible authorization data as authoritative permission.

The Experience layer may collect user intent and interaction input, but the Application/API and domain layers decide whether consequential action is authorized.

## 5. Canonical response handling

A successful authorized operation returns:
- requestId;
- canonical Action;
- canonical Event.

Experience must preserve:
- Action identity;
- Event identity;
- Action/Event distinction;
- canonical lifecycle state;
- event linkage;
- canonical correlation/causation information when present.

Experience must not reinterpret an `AUTHORIZED` Action as `COMPLETED`.

## 6. UI state mapping

Experience may map application results into presentation states:

`LOADING | AVAILABLE | STALE | PENDING | CONFIRMED | FAILED | UNAUTHORIZED | UNAVAILABLE`

Minimum rules:
- request in flight → `LOADING`;
- canonical Action accepted but not completed → `PENDING`;
- authoritative completion state, when later provided by the domain → `CONFIRMED`;
- domain rejection/failure → `FAILED`;
- authorization denial → `UNAUTHORIZED`;
- transport/service inability to obtain a usable response → `UNAVAILABLE`;
- cached data known to be older than current canonical data → `STALE`;
- successful read of current canonical data → `AVAILABLE`.

No UI state may silently strengthen a domain claim.

## 7. Error preservation

The Experience boundary must preserve canonical application error categories:

`INVALID_INPUT | UNAUTHORIZED | EXPIRED | NOT_FOUND | CONFLICT | VALIDATION_FAILURE`

Transport or client failures are separate presentation failures and must not be converted into successful domain outcomes.

An unknown/failed transport result must never be presented as confirmed completion.

## 8. Action/Event presentation

Experience may display:
- Action state;
- Action identity;
- Event identity;
- Event type/source/time;
- Action/Event relationship.

Experience must not:
- create an Event;
- synthesize Evidence;
- advance lifecycle state;
- infer real-world completion from request acceptance;
- use absence of an error as evidence of completion.

## 9. Stale data

Stale data is presentation metadata, not a new domain state.

If canonical data is known to be stale, Experience may mark it `STALE`.

It must not:
- silently overwrite newer canonical state;
- present stale data as confirmed current truth;
- resolve conflicts locally by inventing domain authority.

## 10. OneApp + Platform Website shared semantics

OneApp and Platform Website must share:
- request meaning;
- response meaning;
- canonical error meaning;
- identity semantics;
- participant semantics;
- authorization semantics;
- Action/Event/Evidence semantics;
- lifecycle semantics.

They may differ in:
- layout;
- navigation;
- interaction patterns;
- device capabilities;
- accessibility presentation;
- responsive behavior.

## 11. Authentication boundary

Experience may initiate authentication and maintain presentation/session interaction state.

Authentication does not grant business authorization.

Business authorization remains owned by the canonical Application/API and domain boundary.

## 12. No client authority

Client state, hidden fields, route visibility, disabled buttons, local permissions, or UI conventions are never authoritative security controls.

A malicious or modified client must not be able to manufacture:
- identity authority;
- participant authority;
- authorization;
- Action completion;
- Event occurrence;
- Evidence.

## 13. Testability

The first Experience implementation must be testable without selecting:
- React/Next.js;
- a mobile framework;
- a browser server;
- an authentication vendor;
- a database;
- an external integration.

Tests must prove:
1. requests are passed through the client boundary;
2. successful Action/Event responses preserve canonical semantics;
3. domain errors remain distinguishable;
4. transport/client failures do not become successful domain states;
5. UI state mapping does not claim completion where the domain has only authorized/accepted an action;
6. OneApp and Website can consume the same semantic boundary.

## 14. Implementation gate

The first implementation is intentionally narrow:

`Experience request → Application/API client → canonical response/error → UI state`

No external service, production database, payment integration, hardware integration, GENESIS implementation, or deployment-specific frontend stack is part of this gate.

## 15. Completion criteria

The Experience contract implementation is complete only when:

`Contract → Boundary Implementation → Tests → CI Verification → Fresh Reconciliation`

has been completed successfully.

Until then, the Experience layer is not considered production-ready or framework-selected.

## 16. Stop conditions

Stop and reconcile before introducing:
- frontend frameworks;
- mobile frameworks;
- browser/server runtime;
- authentication providers;
- databases;
- payment providers;
- external integrations;
- hardware;
- GENESIS.

## 17. Canonical principle

**Experience presents and collects interaction. Application/API and BeatCore decide canonical meaning. Persistence records canonical truth. OneApp and Platform Website remain two surfaces over one ecosystem.**
