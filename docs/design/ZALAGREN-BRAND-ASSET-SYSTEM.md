# Zalagren Brand Asset System

Date: 2026-10-02

## Canonical uploaded assets

The repository's uploaded assets are authoritative brand inputs:

- 1.png — canonical primary UI logo asset
- 1.png (canonical asset; historical reference retired) — preserved project-owned reference asset

The current interface uses the owner-provided `1.png` Zalagren artwork and does not recreate the primary logo in CSS.

## Interface rule

The UI canvas is white/light by default. The real Zalagren logo is placed on the white interface with its intrinsic artwork preserved.

The interface system uses:
- Navy #071A33 for authority, primary text and primary controls.
- Blue #1554A6 for actions, navigation and interactive symbols.
- Tsavo orange #F27A21 for contextual status/emphasis.
- White for the primary interface canvas and surfaces.
- Black only where strong text/symbol contrast is required.

The logo itself is never recolored by CSS.

## Placement

The canonical logo is centered in the universal top bar. The same asset is used in the full-screen navigation surface and browser identity metadata.

The top bar contract is:
left = three-line navigation,
center = real Zalagren logo,
right = My Zalagren.

The logo is never replaced with the text Zalagren merely because a text wordmark is easier to render.

## Asset provenance

The current primary UI asset is the repository file 1.png, retained by the project owner after the earlier IMG_1382.png asset was removed. Its repository location is the source of truth.

1.png (canonical asset; historical reference retired) remains preserved as a project-owned brand/reference asset and must not be deleted or silently replaced during UI work.

## Prohibited regressions

- no EarthBeat visible branding;
- no SpeedMe visible branding;
- no fabricated replacement logo;
- no green interface theme simply because the logo contains green;
- no white text on white/light surfaces;
- no oversized logo that dominates the page;
- no tiny logo that becomes unreadable;
- no per-screen arbitrary logo treatment.

## Structural rule

Brand is one layer of the design system, not a decoration. Every product surface inherits the same shell, typography, spacing, card grammar and navigation while keeping service-specific content contextual.
