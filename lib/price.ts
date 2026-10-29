import type {PriceSelection,PriceTier,Restaurant} from './types.ts';
import {distanceTiers} from './distance.ts';
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
// Don't invent a meal price for drink-only, snack-only or weight-priced venues.
// Feature enablement is independently controlled by the production environment.
export const minimumPriceCoverage=0.75;
export const minimumPerPriceBand=3;
export function priceCoverageReady(pool: Restaurant[]) {
 const active=pool.filter(r=>r.active);
 if(!active.length)return false;
 const priced=active.filter(r=>isPriceTier(r.priceBand));
 if(priced.length/active.length<minimumPriceCoverage)return false;
 if(!priceTiers.every(tier=>priced.filter(r=>r.priceBand===tier).length>=minimumPerPriceBand))return false;
 return distanceTiers.every(distance=>priceTiers.every(tier=>
  priced.some(r=>r.distanceTier===distance&&r.priceBand===tier)));
}
