# Verified walking radius from MBC Block 30

Canonical origin: Mapletree Business City Block 30, 30 Pasir Panjang Road,
Singapore 117440. SLA OneMap resolved exactly BLK_NO 30 / POSTAL 117440 to
1.274851167499432, 103.7979737759009. Google Maps was pinned to this coordinate
for every route. Its reverse label may say SAP Asia, a Block 30 tenant; the
origin is the building coordinate, not an office unit or the MBC 10 centroid.
Address-only searches that resolved to Fargona or generic MBC 10 were rejected.

## Bands and selection

| Base tier | Source-displayed walking minutes |
| --- | --- |
| Near / near | 0–8 |
| Further / mid | 9–15 |
| Furthest / far | 16 and above, no 25-minute cap |

The home-screen control is a three-position range slider (Near / Further / Furthest), with keyboard and touch support. The selector is exclusive: Near includes only near; Further includes only mid;
Furthest includes only far. Mood intersects the selected tier. Anything
removes only the mood constraint. Default is Near + Anything. Visible positive
moods require at least three eligible places; changing tier resets a mood
that cannot support a shortlist. No disabled preferences or silent relaxation.

## Audit dated 20 October 2026

All 81 live production outlets have explicit route evidence: 80 exact-outlet
Google Maps walking routes and one ARC building-entrance fallback. Source links,
resolved destination addresses, minutes, metres, date and caveats are stored in
data/distance-audit.json and the new fields in data/restaurants.pilot.json.
No straight-line distance, postal-code, area or address regex determines tiers.

| Tier | Live outlets |
| --- | ---: |
| Near | 14 |
| Further | 51 |
| Furthest | 16 |

Shortest: 3 minutes (Grains & Co., Hitoyoshi, Harry's).
Longest: 35 minutes (several Anchorpoint outlets). Distances and minutes are
source-displayed estimates, not measurements of personal pace or live travel
conditions. Metres converted from displayed kilometres preserve source precision.

Reconciliation: 88 Sheet data rows, 82 marked Live, 87 distinct production
records, 81 active. All 87 Internal IDs match and status agrees. Row 39,
川太子麻辣烫, lacks an Internal ID and appears to duplicate row 4 at ARC #02-19.
It was not guessed into production or deleted. Its distance fields remain blank
with an unresolved note. Existing non-distance verification metadata is intact.

## Investigated exceptions

- Labrador Tower outlets return 11–12 minutes: mid, replacing the old Near rule.
- Street-side Pasir Panjang differs by exact outlet: Super Thai / Paradise /
  Hoho 6 minutes; Knots and Eat 3 Bowls 7; Italian Coffee Lab 5; Esarn 9;
  Yuzutei 10. Do not apply one area-wide time.
- SANDO / Alexandra Technopark is 20 minutes: far. Killiney / Fragrance Empire
  is 15: mid. REPLY K1988 is 14: mid.
- HortPark / Canopy is 11 minutes: mid. Gillman / Hopscotch is 16: far.
- Alexandra Central is 31 minutes; IKEA 33; Anchorpoint 33–35; Alexandra Village
  / KEK 27. These are walking routes, not the old assumed 15–25 minute radius.
- MBC 40 outlets are 3–5 minutes. MBC 20 food-court listings return 8 minutes;
  Mr Bean returns 9 / 650 m. Mr Bean details were inspected: Alexandra Ter then
  Pasir Panjang Road, not an invented campus shortcut. No live outlet is at MBC
  50; the inactive Food Master at 50 remains unclassified and inactive.
- OGOG returns 5 / 350 m, with Google's restricted-usage/private-road warning.
  No unrestricted alternative was offered. Treat campus access as a caveat.
- Vintage Nanyang Kopi's query incorrectly resolved to YES Nanyang Kopi House
  #02-26. That candidate was rejected. The permitted ARC entrance fallback is
  9 / 700 m; it excludes travel inside the building. Current outlet identity
  still needs separate general-verification review.
- Herbal Soup resolves as Pepper Soup 補汤王肉骨茶 at the exact #02-24 address.
- Beard Papa's Google postal text says 110963; street/building/#01-15 match ARC.
- 1-Alfaro resolves to #34-01A (catalogue #34-00), McDonald's Anchorpoint to
  #01-32/33/34 (catalogue #01-31/32/33), Yoshinoya to #01-01A (catalogue #01-01).
  The outlet/building match was checked; general unit metadata was not changed.
  Walking routes do not measure lift waits or restaurant service time.

## Production behavior and maintenance

distanceTier reads the explicit constrained field. Missing or unknown tiers
are excluded at every tier, including legacy records; there is no geographic
fallback. Result cards display area + approximate verified walk minutes. A
number without matching Block 30 verification metadata is never displayed.

The Places tab has T:Y distance fields after Mood Tags: walking minutes, tier,
verified date, distance notes, metres and a dedicated route link. The separate
link preserves the general Source URL / Verification Notes. Distance Tier is a
strict dropdown: Near, Further, Furthest. General A:S values are preserved.

For a future update, verify the exact outlet and pinned origin in pedestrian
directions. Copy source-displayed minutes/metres and the resolved route link;
retain access or entrance caveats. Update the corresponding Internal ID in the
Sheet, production data and audit snapshot together. Tests reject a missing or
unknown tier, minutes/tier contradiction, missing route evidence or an unmatched
live ID. New data must be verified before making it eligible.

Closer-place weights remain modest (1.3 / 1.15 / 1). Recommendations stay random,
unique within shortlists and prefer alternatives on reroll. Inactive records
remain excluded. The app requests neither device location nor live routing.

## Sprint 2: optional price tiers

The price slider has four stops: Any / $ / $$ / $$$. Choosing a dollar tier
matches only that exact band, not all cheaper restaurants. Any imposes no
price limit (including currently unclassified outlets). The standard individual
lunch price bands are $ under about S$10, $$ about S$10–15, $$$ above S$15.

Specific price tiers exclude restaurants with Unknown prices; Any includes them.
Do not invent prices for drink-only, snack-only, or weight-priced venues.
The release gate requires 75% of active records classified, at least 3 active
restaurants per price tier, and one active option in each distance × price
combination. Values should be periodically reconfirmed at the outlet.

The manual Lunch Filters Curation tab stores menu evidence; the versioned
data/prices.curated.json is the application snapshot, currently 60/80 active
(18 $, 18 $$, 24 $$$) as of 2026-10-29. Preview uses the snapshot automatically.
Production never uses that snapshot or displays the slider unless
ENABLE_PRICE_FILTERS=true is explicitly set in the production environment.
Do not enable the production flag without separate approval.
Community submissions remain disabled independently.
