# Sprint 3A — dietary filters staging candidate

Baseline: `b926f3fdd559bfdaddc55cf8fb7a6b8f2c14f7f2` on `sprint-3-dietary-filters`.

## Implementation

- Preview-only server gate (`VERCEL_ENV === preview`); no production opt-in variable. Production receives no dietary evidence and renders no dietary controls.
- Two independently selectable, initially off buttons: Halal-certified and Vegetarian options. Both means logical AND.
- Existing mood, distance, price, single-pick, shortlist and reroll functions share dietary eligibility. No parallel recommendation engine.
- While a dietary requirement is active, distance/price changes preserve both diet and mood. No automatic broadening. Users can explicitly choose another mood.
- Immediate live counts, clear zero-result guidance retaining requirements, single recommendations for one/two matches, three-result shortlist only for at least three.
- Verified badges, vegetarian main and expandable source evidence on results. No dietary claims inferred from names, cuisine or legacy flags.
- Community submissions disabled in Preview at UI and API, even if a pre-existing contribution environment flag is enabled.

## Evidence and identity

`data/dietary.staging.v1.json` is the single operational dietary dataset. It uses exact existing catalogue IDs and name/address snapshots. Attachment and validation reject identity mismatch, duplicate evidence, Unknown, missing/invalid evidence, future dates, stale checks and expired certificates.

Catalogue: 80 app records, 78 Places rows. Two app-only identities are left Unknown; none were added, renamed or modified in Places. Chloe's collection is untouched. All Sheets inspection was read-only.

Verified on 3 November 2026:

| Classification | Verified | Unknown |
| --- | ---: | ---: |
| Halal-certified | 12 | 68 |
| Vegetarian options | 4 | 76 |
| Both | 1 | — |

These are separate per-filter coverage counts; Unknown is not a declaration of Not Certified. 65 restaurants have neither verified classification.

MUIS matches: Burger King ARC, Encik Tan ARC, Go-Ang Anchorpoint, Heavenly Wang ARC, KFC Anchorpoint, McDonald's ARC, Mr Bean MBC, Old Chang Kee ARC, Sakana-No-Suppu ARC, Coffee Bean ARC, Soup Spoon ARC and WOK HEY ARC.

Primary halal authority: https://halal.muis.gov.sg/halal/establishments — search Alexandra / Pasir Panjang. The observed rendered directory results and certificate references are preserved in `DIETARY_MUIS_DIRECTORY_2026-11-03.json`. The directory does not display validity/expiry dates. Those fields are null, not invented. A directory check expires under app policy after 30 days, independently of any actual certificate expiry. If a certificate expiry is subsequently entered, it also constrains eligibility. This is a reviewed snapshot, not a live certificate-status API.

Held Unknown despite candidate MUIS records: Stuff'd ARC (#01-11 versus catalogue #01-11/K2), Master Prata (#01-02/29 versus #01-02), McDonald's Anchorpoint (unit sets differ), Yoshinoya Anchorpoint (#01-01A versus #01-01), Toast Junction (MUIS stall 6 versus catalogue without stall). No ambiguous scope automatically accepted.

Vegetarian menu checks expire after 90 days:

- Nature Cafe Alexandra — Herbal Noodle Soup. Official Alexandra PDF describes vegetarian kitchen/menu and the dish's mushrooms/vegetables. https://www.naturecafe.com.sg/wp-content/uploads/2025/01/Menu-Alexandra-new.pdf
- GYG MBC — sautéed vegetables burrito bowl; official Singapore menu and exact MBC outlet page. https://www.gyg.com.sg/our-food ; https://www.gyg.com.sg/locations/mapletree-business-city
- Stuff'd ARC — Vegetarian-Hummus Daily Bowl with vegetarian toppings/sauces; official menu and ARC outlet locator. https://www.stuffd.com/sg/food/ ; https://www.stuffd.com/sg/find-an-outlet/
- Soup Spoon ARC — large Meatless Minestrone with bread roll; official menu V04/26 plus explicit vegetarian designation in official catalogue, current nutrition listing and official mall outlet listing. https://www.thesoupspoon.com/etc/TSS%20Menu%202020_V0720.pdf ; https://www.thesoupspoon.com/etc/TSS%20Xmas%202024%20Catalogue.pdf ; https://www.thesoupspoon.com/nutritional-calculator/ ; https://www.arc4u.com.sg/tenants/the-soup-spoon/

Limitations: Standard chain menus are combined with named outlet evidence; daily stock/menu/preparation can change. No claim of vegan food, exclusively vegetarian kitchen (except where independently described by operator), or guaranteed absence of cross-contact. Soup Spoon's Cloud Browser page encountered a robot/cookie challenge; retrievable official menu evidence was used. No challenge was bypassed.

## Automated verification

- Baseline: 94 tests passed.
- Candidate: 144 tests passed, including 50 added tests (dietary policy, actual LunchApp handler tests and preview submissions guard).
- TypeScript: passed.
- `VERCEL_ENV=preview npm run build`: passed, including full tests, typecheck and optimized Next.js build.
- Actual component handlers tested with 0, 1, 2, 3 and 5 eligible synthetic outlets: default toggles, AND, current counts, action enablement, single pick, shortlist, reroll, back navigation and preserved diet/mood across distance/price.
- Policy fixtures are synthetic and never included in deployed restaurant data.
- Package lock records the installed dependency versions for reproducible deployment; no application dependencies added.

## Acceptance review

Review the exact deployed Preview commit and use iPhone Safari for final device acceptance. Halal in Near may be empty; Further contains the verified ARC choices. Vegetarian in Near has GYG; Further has Stuff'd and Soup Spoon; Furthest has Nature Cafe. Both has only Soup Spoon in Further, so a single pick is available and Show me 3 is disabled.

Remaining data work: reconcile held outlet unit/scope differences with official evidence, add more verified vegetarian mains, and schedule/manual rechecks before evidence ages out. Production release remains unapproved and out of scope. PR #1 remains untouched.

## Browser QA findings

Live Preview walkthrough passed: neither dietary control selected initially; Halal + Near = 0, Halal + Further = 10; certified shortlist and reroll remained constrained. Both + Further = 1 (Soup Spoon); three-result action disabled. Vegetarian-only + Further = 2; changing price to $ yielded 0 and retained the dietary requirement; $$ restored 2. Healthy mood intersected those results. Returning from results preserved selections. The live submissions readiness endpoint returns 404.

At the existing 390 CSS-pixel app width, both dietary controls measured 166 × 52 pixels with no page horizontal overflow. Native iPhone/Safari and full mobile viewport emulation are not available through this browser API, so final iPhone acceptance remains for the owner. Preview photos used the existing unavailable-photo fallback during this walkthrough; no photos or production credentials were changed. Screenshot capture intermittently timed out.

## Near halal expansion — 3 November 2026

Owner approved adding Fong Seng Nasi Lemak (101 Pasir Panjang Road, S118527; MUIS EERN21020012034) and Subway MBC (40 Pasir Panjang Road #02-34, S117383; EERN21110013197) to staging. Exact listings are preserved in DIETARY_MUIS_DIRECTORY_2026-11-03.json, under the Pasir Panjang search. Expiry dates remain unknown because the current official directory does not display them.

Google Maps walking directions from the exact app origin returned Fong Seng 6 minutes / 450 metres and Subway 8 minutes / 600 metres, both via Pasir Panjang Road. Both therefore fit the unchanged Near threshold of eight minutes. Mr Bean was rechecked at 9 minutes / 650 metres and stays Further.

Two provisional outlet IDs live only in restaurants.staging.v1.json, gated server-side to Preview. The canonical restaurant files and live Places sheet are unchanged. These additions must be reconciled into canonical identities before any future production release. The evidence file now has 14 verified halal outlets and 4 vegetarian-option outlets (1 overlap); 68 of the 82 preview outlets have unknown halal evidence. No vegetarian status, Google Place ID or price was invented for the two additions. They match Any price only, never a specific price tier, Healthy, or Vegetarian options. Canonical price readiness remains measured against the unchanged canonical pool, so adding unpriced preview records does not turn off the existing price controls.

Automated validation: 147 tests passed, TypeScript passed, and VERCEL_ENV=preview npm run build passed. Dedicated coverage verifies Preview isolation, duplicate suppression, both real outlets in the exact Near halal pool, single pick/reroll, disabled three-result shortlist with two matches, mood intersections, unknown prices, AND exclusion, and stale-evidence exclusion. Browser verification is performed after deploying this commit.
