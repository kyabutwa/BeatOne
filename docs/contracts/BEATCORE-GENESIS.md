# BeatCore GENESIS Contract

**Status:** IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Purpose

GENESIS is the provider-neutral intelligence boundary of BeatOne. It consumes permitted canonical information and context and produces non-authoritative intelligence outputs.

Canonical flow:

`Permitted Canonical Information + Context -> GENESIS -> Intelligence Output -> Proposal -> Authorization -> Action`

## Allowed output kinds

- OBSERVATION
- INSIGHT
- KNOWLEDGE
- RECOMMENDATION
- RISK
- PREDICTION
- PROPOSAL

## Required invariants

- output id is non-empty;
- output kind is canonical;
- summary is non-empty;
- source references, when supplied, are canonical BeatOne IDs;
- context reference, when supplied, is a canonical Context ID;
- GENESIS output is attributable to the GENESIS execution boundary;
- a PROPOSAL output is only a proposed result and does not execute anything;
- GENESIS never creates Authorization, Action, Event, or Evidence as a side effect;
- GENESIS cannot manufacture or escalate authority;
- prediction is not an Event;
- intelligence is not canonical business truth;
- external model/provider identifiers are secondary metadata only.

## Authority boundary

GENESIS has no implicit authority.

A GENESIS output that becomes a Proposal must enter the existing Proposal -> Authorization -> Action chain.

No GENESIS function may directly call consequential Action execution.

## Persistence boundary

GENESIS outputs are not a competing canonical domain store. A future knowledge/trace persistence layer may retain outputs for provenance, learning, audit, or retrieval, but must reference canonical entities and must not replace Identity, Authorization, Action, Event, or Evidence ownership.

This foundation does not require a production database or migration.

## Provider boundary

This contract selects no model, AI provider, prompt framework, cloud service, or external integration.

## Non-goals

No automatic execution, automatic authorization, provider integration, production database, migration, infrastructure, OneApp, Website, or higher-domain implementation.
