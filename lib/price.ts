import type {PriceSelection,PriceTier,Restaurant} from './types.ts';
export const priceTiers: PriceTier[]=['$','$$','$$$'];
export const priceOptions: PriceSelection[]=['any',...priceTiers];
export const priceLabels: Record<PriceSelection,string>={any:'Any','$':'$','$$':'$$','$$$':'$$$'};
export function isPriceTier(value: unknown): value is PriceTier {
 return typeof value==='string' && priceTiers.includes(value as PriceTier);
}
export function isPriceSelection(value: unknown): value is PriceSelection {
 return value==='any'||isPriceTier(value);
}
// Unknown price means no verified match for any specific price tier.
export function matchesPriceSelection(r: Pick<Restaurant,'priceBand'>,price: PriceSelection) {
 return isPriceSelection(price) && (price==='any'||r.priceBand===price);
}
// Explicit, complete catalogue coverage is required before any price slider
// becomes visible to users. A separate environment flag provides release control.
export function priceCoverageReady(pool: Restaurant[]) {
 const active=pool.filter(r=>r.active);
 return active.length>0 && active.every(r=>isPriceTier(r.priceBand)) &&
 priceTiers.every(tier=>active.some(r=>r.priceBand===tier));
}
