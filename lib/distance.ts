import type {DistanceTier, Restaurant} from './types.ts';

export const distanceTiers: DistanceTier[] = ['near', 'mid', 'far'];
export const distanceLabels: Record<DistanceTier,string> = {near:'Near',mid:'A bit further',far:'Further'};
const rank: Record<DistanceTier,number> = {near:0,mid:1,far:2};

// Practical radius from MBC, based on catalogue addresses. These are not route times.
// Address landmarks take priority over broad area labels (notably Alexandra).
export function distanceTier(r: Pick<Restaurant,'address'|'area'>): DistanceTier {
 const address=r.address?.toLowerCase()??'';
 const area=r.area?.toLowerCase()??'';
 const location=`${area} ${address}`;
 if (/anchorpoint|ikea|alexandra village|queenstown|queensway|hortpark|hort park|gillman|bukit merah lane|hyderabad|malan r(?:oa)?d/.test(location) || /\b(?:317|321|370)\s+alexandra\s+r(?:oa)?d\b/.test(address)) return 'far';
 if (/mapletree business city|labrador tower/.test(address) || /\b(?:20|40|50)\s+pasir panjang\s+r(?:oa)?d\b/.test(address) || /^1\s+pasir panjang\s+r(?:oa)?d\b/.test(address)) return 'near';
 if (/\b(?:438[a-z]?|456|460|991[a-z]?)\s+alexandra\s+r(?:oa)?d\b/.test(address) || /alexandra technopark|fragrance empire/.test(address)) return 'mid';
 // No current street-side Pasir Panjang outlet has evidence for the easiest radius.
 if (area==='mbc') return 'near';
 if (['arc','labrador park','alexandra','pasir panjang'].includes(area)) return 'mid';
 // Unknown geography and Alexandra Central's IKEA-side cluster stay conservative.
 return 'far';
}
export function withinRadius(r: Pick<Restaurant,'address'|'area'>, radius: DistanceTier) {
 return rank[distanceTier(r)] <= rank[radius];
}
export function locationContext(r: Pick<Restaurant,'address'|'area'>) {
 const area=/\b370\s+alexandra\s+r(?:oa)?d\b/i.test(r.address)?'Anchorpoint':/\b317\s+alexandra\s+r(?:oa)?d\b/i.test(r.address)?'IKEA Alexandra':r.area;
 return `${area} · ${distanceLabels[distanceTier(r)]}`;
}
