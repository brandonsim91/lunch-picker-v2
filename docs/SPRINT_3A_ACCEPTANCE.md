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
