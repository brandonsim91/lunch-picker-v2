import type {DistanceTier, Restaurant} from './types.ts';

export const distanceTiers: DistanceTier[] = ['near', 'mid', 'far'];
export const distanceLabels: Record<DistanceTier,string> = {near:'Near',mid:'Further',far:'Furthest'};
export const distanceOrigin = {
 id:'mbc-block-30', name:'MBC Block 30', address:'30 Pasir Panjang Road, Singapore 117440',
 latitude:1.274851167499432, longitude:103.7979737759009
} as const;
export function isDistanceTier(value: unknown): value is DistanceTier {
 return typeof value==='string' && distanceTiers.includes(value as DistanceTier);
}
export function tierForWalkingMinutes(minutes: unknown): DistanceTier | null {
 if(typeof minutes!=='number'||!Number.isInteger(minutes)||minutes<0)return null;
 return minutes<=8?'near':minutes<=15?'mid':'far';
}
// Explicit audited data is authoritative. Missing/invalid tiers never become
// guessed geography, including for legacy imports.
export function distanceTier<T extends Pick<Restaurant,'distanceTier'>>(r: T): DistanceTier | null {
 return isDistanceTier(r.distanceTier)?r.distanceTier:null;
}
// A slider position selects one exact classification; it is not a maximum radius.
export function matchesDistanceTier(r: Pick<Restaurant,'distanceTier'>, selected: DistanceTier) {
 return isDistanceTier(selected) && distanceTier(r)===selected;
}
export function hasVerifiedWalkingTime(r: Pick<Restaurant,'walkingMinutes'|'distanceTier'|'distanceVerification'>) {
 return r.distanceVerification?.origin===distanceOrigin.id &&
  r.distanceVerification.source==='Google Maps walking directions' &&
  !!r.distanceVerification.verifiedAt && !!r.distanceVerification.sourceUrl &&
  tierForWalkingMinutes(r.walkingMinutes)!==null && tierForWalkingMinutes(r.walkingMinutes)===distanceTier(r);
}
export function locationContext(r: Pick<Restaurant,'area'|'walkingMinutes'|'distanceTier'|'distanceVerification'>) {
 if(hasVerifiedWalkingTime(r))return `${r.area} · ~${r.walkingMinutes} min walk`;
 const tier=distanceTier(r);
 return tier?`${r.area} · ${distanceLabels[tier]}`:r.area;
}
