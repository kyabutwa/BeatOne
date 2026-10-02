# BeatOne Canonical Logo System — 2026-10-02

## Source
The canonical visual reference is the owner-provided `IMG_1489.jpeg` supplied in the build session.

## Construction
The repository implementation does not substitute a third-party or generated brand image. It reconstructs the reference as deterministic SVG geometry:
- concentric navy rings;
- mathematically positioned circular dot bands using polar coordinates;
- white inner field;
- faceted blue gemstone constructed from regular-hex geometry and facet polygons;
- BeatOne navy wordmark;
- responsive SVG data URI output.

This keeps the visual identity reproducible from equations/geometry rather than an opaque generated bitmap.

## Primary logo
**BeatOne** uses the canonical emblem with the `BeatOne` wordmark and no service overlay.

## Service logo family
Each service preserves the exact same emblem and wordmark structure, changing only:
1. the service name;
2. a deterministic service-specific symbol placed over the gemstone.

Current family:
- BeatPay — payment card/transaction mark
- BeatRide — vehicle mark
- BeatFood — fork/knife mark
- BeatHealth — medical cross
- BeatMarket — commerce bag
- BeatGenzi — intelligence/spark mark
- BeatGuardian — shield/protection mark
- BeatUtilities — utility/energy mark

## Architecture boundary
These logos are visual identity only. They do not imply that a service is verified, licensed, provider-connected or operational. Existing truth states and authorization/provider/compliance boundaries remain unchanged.

## Implementation
Canonical source:
`src/beatone-brand.ts`

Participant UI:
`src/home-ui.ts`

The main BeatOne logo is used for the shell, favicon and preload. Service logos are surfaced in the ecosystem domain cards.

No Vercel runtime dependency is introduced.
