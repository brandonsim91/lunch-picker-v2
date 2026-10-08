import seed from '../data/restaurants.seed.json';
import overlays from '../data/restaurants.pilot.json';
import type { Restaurant } from './types.ts';
export function mapsUrl(name: string, address: string, placeId?: string | null) {
  const p = new URLSearchParams({api:'1',query:`${name}, ${address}`});
  if (placeId) p.set('query_place_id',placeId);
  return `https://www.google.com/maps/search/?${p}`;
}
// Keep the original list selectable without claiming it was reverified.
const originals = seed.restaurants.map(r => ({...r, id:r.id || 'chuan-tai-zi-mala-tang-arc'}));
const ids = [...new Set([...originals.map(r=>r.id), ...overlays.map(r=>r.id)])];
export const restaurants: Restaurant[] = ids.map(id => {
  const legacy = originals.find(r => r.id === id);
  const overlay = overlays.find(r => r.id === id);
  const r = {...legacy, ...overlay};
  return {...r, id, importedFromV1:!!legacy && !r.verifiedForV2,
    tags:overlay?.tags ?? r.cuisine ?? [],
    reason:overlay?.reason ?? legacy?.legacyCuisine ?? 'From your original lunch list.',
    sourceUrl:overlay?.sourceUrl ?? 'https://github.com/brandonsim91/Lunch-Picker/blob/main/Scripts/Script.js',
    placeId:overlay?.placeId ?? null,
    mapUrl:mapsUrl(r.name!,r.address!,overlay?.placeId)} as Restaurant;
});
