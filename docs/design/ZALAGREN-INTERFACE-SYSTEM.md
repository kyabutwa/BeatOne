# Zalagren Interface System

## Objective
Zalagren should feel native, calm and information-dense without becoming visually crowded. The system draws from current Apple Human Interface Guidelines and Shopify Polaris principles without copying proprietary UI.

## Rules

### Hierarchy before decoration
Every screen has:
1. page context;
2. primary title;
3. short supporting description;
4. primary action;
5. grouped cards/sections;
6. secondary metadata.

Do not use giant headlines where a compact heading is sufficient.

### One type scale
Use a small semantic scale:
- Display: 30–44px only for major page titles.
- Section: 20–26px.
- Card title: 16–18px.
- Body: 14–16px.
- Metadata: 12–13px.
Do not use tiny text for essential information.

### Consistent card grammar
Cards use one radius family, one border family, one spacing family, restrained shadow, clear title, optional category label, short description and explicit interaction state.

Cards must not become containers for unrelated information.

### Color roles
Zalagren:
- Navy: primary text, primary controls and important symbols.
- Green: Zalagren brand identity.
- Tsavo orange: contextual accent/attention, not general body text.
- White/neutral surfaces: content hierarchy.
- Black: strong text where required.

Never rely on color alone for status.

### Accessibility
Interactive elements must remain identifiable, have a visible focus state, maintain contrast, preserve meaning without color, support touch targets and readable text, and avoid motion dependence.

### Responsive behavior
Mobile is first-class:
- compact top bar;
- safe margins;
- one-column cards;
- short labels;
- no edge-to-edge destructive/full-width controls unless justified.

Larger screens may use two-column cards and wider content, but information hierarchy remains identical.

### Truthful empty states
An empty state must say it is empty. Never create fake providers, communities, rides, orders, health records, payments or verification.

### Domain consistency
BeatFood, BeatRide, Genzi, Marketplace and BeatHealth inherit the same Zalagren design tokens rather than becoming separate visual products.

## Required future primitives
- AppShell
- TopBar
- SectionHeader
- Card
- CardGrid
- ListRow
- StatusBadge
- EmptyState
- ErrorState
- ActionButton
- FormField
- Sheet/Modal
- Timeline
- MapSurface
- ParticipantIdentity
- ContextBadge
- AuthorizationSummary
- EvidenceRow

These primitives must be semantic and reusable rather than copied screen by screen.
