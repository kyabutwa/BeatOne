# Zalagren Full Vision Interface Baseline — 2026-10-02

## Purpose

This document reconciles the current participant-facing build with the accumulated Zalagren direction rather than treating the latest screen as a standalone app.

Zalagren is an **Intelligent Living Infrastructure for Participating Communities**. The interface is a participant surface over a governed ecosystem, not the definition of the ecosystem itself.

## Canonical information model

Identity → Participant → Community → Place → Relationship → Capability → Authorization → Intent → Proposal → Action → Event → Evidence.

Authentication proves identity through the configured identity provider. It does not grant authorization.

GENESIS can use context and knowledge to generate proposals and explanations. It cannot become the authority, silently authorize a consequential action, or silently execute one.

## Interface shell

The universal shell is:

- left: three-line menu;
- center: owner-provided Zalagren logo;
- right: My Zalagren;
- floating/sticky translucent white shell;
- compact bottom navigation: Home / World / Services / Activity / Account;
- full-screen navigation for deeper ecosystem destinations;
- responsive mobile-first layout;
- controlled type scale and card grammar;
- white/light surfaces with navy authority text, blue interaction, Tsavo orange contextual emphasis, and black where strong contrast is needed.

The visual direction is modern, advanced and calm, taking inspiration from the information density, floating surfaces and spatial discipline of contemporary iPhone-class interfaces without copying proprietary implementation or artwork.

## Home hierarchy

Participant Home presents:

1. current participant and context;
2. what the participant can do now;
3. Identity;
4. Community;
5. Services;
6. GENESIS;
7. Activity;
8. ecosystem domains;
9. live foundation truth.

The home surface must distinguish:

- VERIFIED;
- SUPPORTED;
- PROPOSED;
- FAILED;
- truthful empty state.

No placeholder provider, community, payment, ride, health record, activity or authorization may be represented as real.

## Ecosystem surfaces

The common shell covers:

- TSAVO Community Node 001;
- communities and places;
- access and invitations;
- BeatPay;
- BeatRide;
- BeatFood;
- BeatHealth;
- Genzi;
- Guardian;
- Marketplace;
- utilities;
- GENESIS;
- Team Workspace;
- participant identity and My Zalagren.

These are ecosystem capabilities, not disconnected products with separate identity models.

## Brand asset rule

The current canonical primary logo asset is 1.png. 1.png (canonical asset; historical reference retired) remains a preserved project-owned reference asset.

The interface must use the owner-provided artwork rather than redrawing the logo in HTML/CSS. Assets must be structurally assigned by role and must not be arbitrarily stretched, recolored or made into decorative noise.

## Runtime truth

The current production foundation is real authentication plus canonical identity/participant/account persistence on Neon behind the Cloudflare Worker.

Higher-domain persistence may be structurally ready while still empty. Empty tables are not a failure and must not be populated merely to make the UI look complete.

Payments, external providers, regulated rails, hardware and community-specific operational data remain subject to their explicit contracts and verification gates.

## Safety and governance

The participant/community authority boundary remains explicit.

No UI convenience may bypass:

- authorization;
- provider boundary;
- audit/evidence requirements;
- compliance constraints;
- migration governance;
- GENESIS proposal-only semantics.

## Deployment verification

The Cloudflare deployment workflow must typecheck, deploy, then verify the production /api/health endpoint and verify the deployed HTML contains the canonical Zalagren shell markers and current logo asset reference.

A production URL is only called verified when that post-deployment smoke check succeeds.
