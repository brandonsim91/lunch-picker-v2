import type { Filter, Restaurant } from './types.ts';
export const filters: Filter[] = ['Nearby','Quick','Cheap','Healthy'];
export function usable(r: Restaurant) {
  try {const u=new URL(r.mapUrl);return !!r.id && !!r.name && !!r.address && r.active && ((r.verifiedForV2 && !!r.lastVerifiedAt) || r.importedFromV1===true) && u.protocol==='https:' && ['www.google.com','maps.google.com','maps.app.goo.gl'].includes(u.hostname);}
  catch {return false;}
}
export function eligible(pool: Restaurant[], selected: Filter[]) {
  const seen=new Set<string>();
  return pool.filter(r => usable(r) && !seen.has(r.id) && (seen.add(r.id),true) && selected.every(f =>
    f==='Nearby' ? ['MBC','ARC'].includes(r.area) :
    f==='Quick' ? r.quickLunch===true :
    f==='Cheap' ? r.priceBand==='$' : r.healthyOption===true));
}
export function availableFilters(pool: Restaurant[]) {
  return filters.filter(f=>eligible(pool,[f]).length>0);
}
export function weight(r: Restaurant, previous: string[]) {
  return (r.area==='MBC'?1.3:1)*(previous.includes(r.id)?0.2:1);
}
export function pickOne(pool: Restaurant[], selected: Filter[], previous: string[]=[], rng= Math.random): Restaurant | null {
  let choices=eligible(pool,selected);
  const fresh=choices.filter(r=>!previous.includes(r.id));
  if(fresh.length) choices=fresh;
  const total=choices.reduce((s,r)=>s+weight(r,previous),0);
  let ticket=Math.max(0,Math.min(0.999999999,rng()))*total;
  for (const r of choices) {ticket-=weight(r,previous);if(ticket<0)return r;}
  return choices.at(-1)??null;
}
export function recommendThree(pool: Restaurant[], selected: Filter[], previous: string[]=[], rng=Math.random): Restaurant[] {
  const choices=eligible(pool,selected);
  if(choices.length<3)return [];
  const result: Restaurant[]=[];
  for(let i=0;i<3;i++){
    const r=pickOne(choices.filter(r=>!result.some(p=>p.id===r.id)),[],previous,rng);
    if(r)result.push(r);
  }
  if(choices.length>3 && result.every(r=>previous.includes(r.id))){
    const fresh=choices.find(r=>!previous.includes(r.id));if(fresh)result[2]=fresh;
  }
  return result;
}
