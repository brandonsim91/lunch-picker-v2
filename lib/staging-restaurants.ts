import type {Restaurant} from './types.ts';
import {dietaryPreviewEnabled} from './dietary.ts';

// Provisional outlet identities stay isolated from the canonical catalogue.
export function withStagingRestaurants(base:Restaurant[],additions:Restaurant[],environment?:string):Restaurant[]{
 if(!dietaryPreviewEnabled(environment))return base;
 const ids=new Set(base.map(r=>r.id));
 const identities=new Set(base.map(r=>`${r.name}|${r.address}`.toLowerCase()));
 return [...base,...additions.filter(r=>{
  const identity=`${r.name}|${r.address}`.toLowerCase();
  if(ids.has(r.id)||identities.has(identity))return false;
  ids.add(r.id);identities.add(identity);return true;
 })];
}
