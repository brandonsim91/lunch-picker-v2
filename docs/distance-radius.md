# Lunch radius from Mapletree Business City

The selector is a maximum radius: Near = near; A bit further = near + mid;
Further = near + mid + far. Food constraints always intersect that radius.
Anything clears food constraints only. Default is Near, with no food constraints.

`lib/distance.ts` classifies the merged production catalogue without changing
restaurant records, Google Place IDs, walking minutes, prices or food flags.
These are conservative area/address categories, not timed walking routes.
Unknown locations default to Further until reviewed.

| Tier | Catalogue addresses and areas |
| --- | --- |
| Near | MBC, including 20/40/50 Pasir Panjang Road; Labrador Tower at 1 Pasir Panjang Road |
| A bit further | ARC at 460 Alexandra Road; SANDO at 438C Alexandra Technopark; Killiney at 456 Alexandra Road; REPLY K1988 at 991B Alexandra Road; street-side Pasir Panjang outlets at 87, 91, 93, 99, 100/100G, 102E, 103 and 130 Pasir Panjang Road; broader Labrador Park |
| Further | Anchorpoint / Ma Maison at 370 Alexandra Road; IKEA at 317; Alexandra Central at 321 (Liu Lang Mian, Master Prata, Otoko Ramen, Nature Cafe); Alexandra Village / Bukit Merah Lane 1; HortPark / Hyderabad Road; Gillman Barracks / Malan Road; Queenstown-side and unmapped locations |

## Conservative exceptions

- The broad Alexandra label does not determine distance by itself. Address
  landmarks take priority. Alexandra Central is beside IKEA, not the ARC cluster.
- All current street-side Pasir Panjang entries are in A bit further. There is
  no verified route evidence to promise that these outlets are in the easiest
  radius. MBC and Labrador Tower remain Near despite sharing the street name.
- REPLY K1988 at 991B is A bit further, consistent with the ARC-side cluster.
- 1-Alfaro on level 34 remains Near geographically. Distance does not promise
  short lift waits or quick service; Quick still requires a verified food flag.
- Inactive entries remain inactive regardless of tier. Original-list exceptions
  stay eligible only under the existing safety policy; positive food preferences
  require verified records with dated verification and explicit matching fields.

Closer places have modest weights (1.3 near, 1.15 mid, 1 far). Selection remains
random, unique within shortlists, and avoids the previous picks where possible.

Geographic cross-check for Alexandra Central's IKEA-side location:
https://neua.com.sg/contact-us.html (321 Alexandra Road, next to IKEA and opposite Anchorpoint).
No live location permission, routing request, or walking-time estimate is used.
