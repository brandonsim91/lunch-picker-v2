# Restaurant catalogue and photo QA

The production catalogue is the seed data merged with the pilot overlays by
Internal ID. Google Sheets is the human-facing review copy. Reconcile by ID,
preserve nonblank conflicting Place IDs for manual review, and never assign an
outlet based on a similar name alone.

The 2026-10-20 reconciliation is recorded in `data/catalogue-audit.json`:
80 Live rows match 80 active production restaurants. The duplicate ARC #02-19
row was confirmed through its original Maps share link and removed, retaining
`chuan-tai-zi-mala-tang-arc`. Twenty-seven verified production Place IDs were
backfilled into previously blank Sheet cells.

Google's official Place ID finder returned exact name and unit matches for:

| Internal ID | Exact Google outlet |
| --- | --- |
| green-elephant-thai-dynasty-mbc | Green Elephant by Thai Dynasty (Thai Salad), 20 Pasir Panjang Road #02-21 |
| ogog-mapletree-business-city | OGOG 오곡 — Mapletree Business City, 40 Pasir Panjang Road #02-39 |
| herbal-soup-arc | Pepper Soup 補汤王肉骨茶, 460 Alexandra Road #02-24 |

The ARC directory confirms Herbal Soup at #02-24. Vintage Nanyang Kopi was
removed from active recommendations on 2026-10-20 by catalogue-owner decision;
its historical record is retained as Inactive. No Place ID was guessed.

The API normally requires Google Places to report `OPERATIONAL` before serving a photo.
A narrowly scoped `verified-operational` override is permitted only when the exact outlet
has been independently reverified and Google's business status is stale/inconsistent.
A per-restaurant preferred Google photo index is also supported for documented QA exceptions
such as KFC Anchorpoint. Adding a Place ID alone does not prove photo coverage. After deployment,
inspect the actual returned image and its 88 × 88 centre crop and attribution.

Run the read-only audit with an absolute temporary output directory:

```sh
node scripts/audit-production-photos.mjs /absolute/temporary/photo-qa
```

The script requests each active ID once, with three concurrent requests, and
writes temporary image bytes plus attribution and SHA-256 metadata for visual
review. Do not commit those images or ephemeral Google photo URLs/references.
Mark each result Good, Acceptable, Fallback, Poor or Wrong in the Places tab.
An empty response does not by itself establish that Google has no photos: it can
also mean a failed upstream request or a rejected response.

The application uses Google's first photo by default and preserves author attribution.
A restaurant may opt into a later Google photo only through an explicit, reviewed
`preferredPhotoIndex` override. Photo credentials stay server-side, image hosts and
content types are checked, oversized responses are rejected, and image redirects are refused.
