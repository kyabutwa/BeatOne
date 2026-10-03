# ZALAGREN COMMUNITY + BEATMARKET + BEATBNB ARCHITECTURE
Date: 2026-10-03

## 1. Community spatial model

A community is not a flat label. Its spatial operating hierarchy is:

Community
→ Phase
→ Building
→ Floor
→ Common Area / Unit / Reserved Space
→ Place context

A Place remains the canonical physical context. The community_spatial_nodes table is the community-specific hierarchy and classification layer; it does not replace BeatCore Place semantics.

### Phase
A development phase or operational zone inside a community. It can contain buildings and shared infrastructure.

### Building
A physical building inside a phase.

### Floor
A level inside a building.

### Common Area
A community-controlled shared place such as lobby, corridor, gym, pool, garden, parking, playground, reception, waste area or shared facility.

### Unit
A residence, office, shop, apartment, room or other individually addressable place.

### Reserved Space
A place or resource reserved for a participant, provider, service, vehicle, event or other authorized purpose.

### Place
The canonical spatial context used by Zalagren across services. It can represent the community itself, a spatial node or a service-relevant place.

Every consequential operation can therefore resolve:
Community → Phase → Building → Floor → Common Area/Unit/Reserved Space → Place → Relationship → Authorization.

## 2. BeatMarket is NOT BeatBnB

BeatMarket and BeatBnB are separate products.

### BeatMarket

BeatMarket is Zalagren's participant opportunity, professional, relationship, commerce and business network.

It combines capabilities conceptually found across professional networking, freelance work, business operations, creator/social publishing, storefronts, opportunity discovery and location-aware coordination — but Zalagren uses one participant identity and one authorization spine rather than copying another company's product model.

Core BeatMarket surfaces:

1. Professional identity
- legal/professional profile
- headline
- biography
- skills
- services
- experience
- education
- portfolio
- availability
- verification state

2. Career and opportunity network
- jobs
- projects
- freelance work
- contracts
- partnerships
- volunteering
- career opportunities
- applications and relationship history

3. Business presence
- business profile
- professional/company identity
- services
- products
- storefront
- catalog
- fulfillment
- location
- business relationships

4. Participant relationships
- connection requests
- accepted relationships
- professional messaging
- community relationships
- collaboration proposals

5. Publishing
- updates
- articles
- portfolios
- offers
- announcements
- opportunities
- media

6. Location-aware network
- community/place context
- discover nearby opportunities
- place-linked business profiles
- consented live-location sessions
- coarse/approximate/exact precision
- temporary live sharing
- meeting and delivery contexts

7. Spatial commerce
- businesses mapped to Places
- place-linked storefronts
- future 3D/visual place representation
- location-aware discovery
- no precise location disclosure without participant consent and authorization

8. WhatsApp-like communication architecture
BeatMarket can provide participant-to-participant and participant-to-business conversations, but it is a Zalagren-native messaging layer, not a claim of WhatsApp integration.
Messages must inherit participant identity, conversation authorization, reporting/blocking, retention and evidence rules.

### Kenya operating boundary for BeatMarket

Professional and business profiles must distinguish:
- identity evidence
- professional claims
- business registration evidence
- tax evidence
- sector licence evidence
- platform verification

Verification does not mean Zalagren has issued a government licence.

Where a participant conducts business in Kenya, the platform should support the seller/provider's tax and invoicing obligations. KRA states that persons engaged in business are required to onboard eTIMS and issue electronic tax invoices, with specific solutions for small businesses and system-to-system integration. citeturn1search0turn1search10

Zalagren should therefore expose a tax/commercial compliance state, never display eTIMS verified without actual evidence, and keep seller/provider obligations separate from Zalagren's own platform obligations.

ODPC obligations apply to the platform's processing of participant, business, professional, GPS/location and potentially sensitive data. The ODPC registration portal explicitly asks applicants to classify personal and sensitive data, purposes, transfers and technical/organizational safeguards. citeturn0search0

## 3. BeatBnB

BeatBnB is a separate accommodation + destination + travel coordination product.

Its core model is:

Community
→ Phase
→ Building
→ Floor
→ Unit
→ Unit Provider / Host / Resident
→ BeatBnB Property
→ Guest
→ Stay
→ Authorization
→ Access Credential
→ Check-in
→ Stay Events
→ Check-out
→ Reputation / Evidence.

A community unit can therefore become a BeatBnB unit without losing its canonical place identity.

### Unit understanding

Every BeatBnB unit should be able to describe, where applicable:

- exact/approximate location
- community
- phase
- building
- floor
- unit identity
- unit type
- floor area
- bedrooms
- bathrooms
- furnishing
- parking
- utilities
- safety features
- accessibility
- inventory
- amenities
- house rules
- check-in/check-out
- capacity
- availability
- inspection evidence
- provider/host relationship
- reputation
- pricing
- cancellation rules
- guest policy

The existing BeatBnB property/unit foundations are retained and expanded rather than replaced.

## 4. BeatBnB pricing intelligence

The system should not invent a universal "correct price".

A price recommendation can be calculated from evidence such as:

- location
- unit type
- size
- amenities
- furnishing
- capacity
- season
- demand
- comparable observations
- historical booking outcomes
- provider pricing
- community context
- reputation
- service fees
- taxes/levies where applicable

The result must be presented as an evidence-backed pricing observation or range, not a government-set price.

GENESIS may explain the factors but cannot silently change a host's price.

## 5. BeatBnB booking

Guest:
search → compare → favorite → review unit → request/hold → payment authorization → confirmation → access authorization → check-in → stay → check-out → review.

Host/provider:
publish → verify → configure availability → accept/reject → receive authorized booking → guest access → stay management → payout/reconciliation → reputation.

Resident-to-BnB:
a resident can request a temporary BnB conversion/use of an eligible unit, but the system must validate the owner's/provider's authority and any applicable community, lease, building, tourism and regulatory restrictions.

## 6. Zalagren Access Protocol

BeatBnB does not create a separate permanent access-control authority.

Access is derived from:

Participant
+ Reservation
+ Unit
+ Host/provider authority
+ Community context
+ Time window
+ Route/policy
+ Authorization
→ temporary credential/access event.

Opening a booking does not automatically grant physical access.

Check-in activates the authorized access window.
Check-out closes it.
Cancellation/revocation closes or prevents activation.

## 7. Destination and travel layer

BeatBnB should include:

- favorite destinations
- destination discovery
- upcoming trips
- travel alerts
- destination collections
- discounts
- accommodation
- airport/ground transfer coordination
- flight search
- flight comparison
- private-jet request/search
- international connections
- itinerary
- travel booking request
- reservation history

Flight/private-jet results must distinguish:
- verified live provider result
- external booking result
- request-only option
- stale/unknown availability.

Zalagren must not invent live aircraft, seats, fares or booking confirmations.

Where Zalagren eventually sells or arranges regulated air services itself, the applicable aviation licensing boundary must be assessed. KCAA states that it licenses air services in Kenya under the Civil Aviation Act and Air Service Licensing Regulations. citeturn0search4

Therefore the initial BeatBnB architecture is an aggregation/orchestration boundary:
Zalagren search → authorized provider/booking rail → external confirmation → Zalagren itinerary/evidence.

## 8. Kenya accommodation boundary

Short-term rental/serviced-apartment activity must remain evidence-driven. TRA's current licensing information specifically lists serviced apartments/short-term rentals and provides registration requirements for tourism enterprises. citeturn0search7

BeatBnB therefore stores:
- provider/host relationship
- property/unit relationship
- verification state
- compliance state
- evidence
- applicable jurisdiction
- terms
- complaint path
- tax state

The platform must never turn an unverified listing into "licensed" merely because a host filled a form.

## 9. Product separation

BeatMarket = people, careers, opportunities, professional identity, business, commerce, relationships, publishing and location-aware network.

BeatBnB = accommodation, community units, hosts/providers, guests/residents, stays, access, destinations, travel and booking.

BeatMarket can discover a BeatBnB property.
BeatBnB can use a BeatMarket professional/business profile for provider identity.
But their business lifecycles remain separate.

## 10. Non-negotiable lifecycle

BeatMarket:
Participant → professional/business context → capability → authorization → opportunity/offer/post → relationship/action → event → evidence.

BeatBnB:
Participant → community/place/unit → host/provider authority → listing → availability → booking intent → authorization → reservation → payment → access → stay → check-out → evidence → reconciliation → reputation.

Neither product may bypass Zalagren's canonical authorization and evidence spine.
