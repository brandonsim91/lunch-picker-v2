# V1 → V2 Restaurant Migration

## Migration completed

The hard-coded restaurant array from `brandonsim91/Lunch-Picker` was migrated into:

`data/restaurants.seed.json`

## Counts

- Legacy records read: **35**
- Unique records migrated: **34**
- Exact duplicate records removed: **1**

Duplicate removed:

- Yuzutei Japanese Restaurant — 100G Pasir Panjang Rd, #01-01 Interlocal Centre, Singapore 118523


## Important status

This is a **seed migration**, not a live verified restaurant database.

The migration intentionally does **not** guess values that were absent from V1.

The following fields remain unverified where appropriate:

- walking time
- price band
- quick-lunch suitability
- indoor / outdoor
- healthier-option suitability
- whether the restaurant is still operating
- whether the legacy Google Maps link is still correct

Every migrated record therefore has:

`verifiedForV2: false`

V2 should not treat a restaurant as production-ready until it has been checked.

## Normalisation performed

The migration:

1. preserved the original restaurant name, address, cuisine text, and Maps URL
2. converted cuisine descriptions into reusable cuisine tags
3. added a stable slug-like ID
4. assigned a broad area based on the stored address
5. removed exact duplicate records
6. flagged malformed or unusual legacy Maps URLs
7. preserved legacy distance notes in `migrationNotes`
8. recorded the original repository and source file

## Known legacy quality issues

At least one V1 Maps URL is visibly malformed and has been flagged in the migrated record.

Some old entries use descriptive cuisine text rather than a controlled cuisine label. The original value is preserved in `legacyCuisine` while V2 uses the normalised `cuisine` array.

## Next migration pass

Before frontend implementation, verify each restaurant against current information and populate:

```text
verifiedForV2
lastVerifiedAt
walkingMinutes
priceBand
quickLunch
indoor
healthyOption
mapUrl
active
```

Only verified records should feed the V2 recommendation engine.
