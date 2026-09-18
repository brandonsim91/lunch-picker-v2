# Lunch Picker V2 — Restaurant Data Model v0.1

This document defines the initial structured data required for each lunch option.

The schema should remain implementation-agnostic until the product logic is stable. It can later be implemented in a headless CMS such as Sanity.

---

## Core restaurant fields

| Field | Type | Required | Purpose |
|---|---|---:|---|
| id | string | Yes | Stable unique identifier |
| name | string | Yes | Restaurant / stall name |
| cuisine | string[] | Yes | One or more cuisine categories |
| address | string | Yes | Human-readable address |
| mapUrl | URL | Yes | Google Maps destination |
| area | enum/string | Yes | MBC, Pasir Panjang, Alexandra, etc. |
| walkingMinutes | number | Yes | Approximate walk time from MBC reference point |
| priceBand | enum | Yes | $, $$, $$$ |
| active | boolean | Yes | Whether the option should currently appear |
| quickLunch | boolean | Yes | Suitable when time is constrained |
| indoor | boolean | No | Primarily indoor / sheltered experience |
| healthyOption | boolean | No | Has reasonably suitable healthier meals |
| notes | string | No | Maintainer notes |

---

## Recommended classification fields

### Cuisine

Use multiple values where appropriate.

Examples:

- Chinese
- Japanese
- Korean
- Thai
- Vietnamese
- Indian
- Indonesian
- Taiwanese
- Mexican
- Western
- Cafe
- Local
- Vegetarian

Avoid overly granular categories until there is a real user need.

### Area

Initial examples:

- MBC
- Pasir Panjang
- ARC
- Alexandra
- Alexandra Central
- Gillman Barracks
- HortPark

### Price band

Keep this deliberately simple:

- `$` — lower-cost everyday lunch
- `$$` — normal casual restaurant / cafe
- `$$$` — comparatively expensive for routine workday lunch

---

## Future operational fields

These are useful but not required for the first dataset pass.

| Field | Type | Purpose |
|---|---|---|
| lastVerifiedAt | datetime | When restaurant information was last checked |
| lastVisitedAt | datetime | Most recent recorded group visit |
| visitCount | number | Number of recorded visits |
| temporarilyUnavailable | boolean | Keep record while excluding it |
| openingHoursNote | string | Lunch-specific opening context |
| typicalWaitMinutes | number | Rough queue / waiting estimate |
| takeawayFriendly | boolean | Useful for time-constrained lunches |
| groupFriendly | boolean | Suitable for several colleagues |
| tags | string[] | Flexible future classification |

---

## Preference data

Do not hard-code individual colleagues into restaurant records for the first public/internal version.

If personalisation is added later, keep preference data separate:

```text
UserPreference
├── userId
├── restaurantId
├── rating
├── avoid
├── favourite
└── note
```

This allows the restaurant dataset to remain reusable for all SDS colleagues.

---

## Decision-engine inputs

The initial recommendation engine should be able to work from fields such as:

```text
active
walkingMinutes
priceBand
cuisine
quickLunch
healthyOption
indoor
lastVisitedAt
visitCount
```

Example:

```text
User selects:
Quick + Nearby

Rules:
active = true
walkingMinutes <= threshold
quickLunch = true

Then:
down-weight very recently visited places
randomise among high-scoring eligible candidates
```

---

## Data-quality rules

1. Every active restaurant must have a valid Maps URL.
2. Duplicate restaurants should use one canonical record.
3. Closed restaurants should be marked inactive rather than immediately deleted.
4. Walking time should use a consistent MBC reference point.
5. Price bands should reflect a normal individual lunch, not the cheapest menu item.
6. Cuisine labels should come from a controlled list wherever possible.
7. Optional fields should remain optional until they meaningfully affect recommendations.

---

## First data migration

The 2025 Lunch Picker dataset should be treated as **seed data, not automatically trusted production data**.

Before importing each restaurant into V2:

1. remove duplicates
2. verify that it still exists
3. verify the Maps link
4. standardise its address
5. classify cuisine
6. assign area
7. estimate walking time
8. assign price band
9. mark quick-lunch suitability

This turns the original hard-coded JavaScript array into a maintainable product dataset.
