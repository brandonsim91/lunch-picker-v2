import seed from '../data/restaurants.seed.json';
import overlays from '../data/restaurants.pilot.json';
import type { Restaurant } from './types.ts';
export function mapsUrl(name: string, address: string, placeId?: string | null) {
  const p = new URLSearchParams({api:'1',query:`${name}, ${address}`});
  if (placeId) p.set('query_place_id',placeId);
  return `https://www.google.com/maps/search/?${p}`;
}
export const restaurants: Restaurant[] = overlays.map(overlay => {
  const legacy = seed.restaurants.find(r => r.id === overlay.id);
  const r = {...legacy, ...overlay};
  return {...r, mapUrl:mapsUrl(r.name!,r.address!,r.placeId)} as Restaurant;
});
