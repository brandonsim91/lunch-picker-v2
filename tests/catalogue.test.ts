import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pilot=JSON.parse(readFileSync(new URL('../data/restaurants.pilot.json',import.meta.url),'utf8'));
const seed=JSON.parse(readFileSync(new URL('../data/restaurants.seed.json',import.meta.url),'utf8')).restaurants;
const audit=JSON.parse(readFileSync(new URL('../data/catalogue-audit.json',import.meta.url),'utf8'));

test('catalogue IDs are valid and unique, including every active restaurant',()=>{
 assert.equal(new Set(pilot.map((r:{id:string})=>r.id)).size,pilot.length);
 for(const r of pilot)assert.match(r.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test('reconciled Sheet has one canonical row per production ID with matching Place IDs',()=>{
 assert.equal(new Set(audit.rows.map((r:{id:string})=>r.id)).size,audit.rows.length);
 assert.deepEqual(audit.rows.map((r:{id:string})=>r.id).sort(),pilot.map((r:{id:string})=>r.id).sort());
 assert.deepEqual(audit.unmatchedRows,[]);
 assert.deepEqual(audit.placeIdMismatches,[]);
 for(const r of pilot){
  const row=audit.rows.find((s:{id:string})=>s.id===r.id);
  assert.equal(row.sheetPlaceId,r.placeId??null,r.id);
  assert.equal(row.sheetStatus==='Live',r.active,r.id);
 }
 assert.equal(audit.rows.filter((r:{sheetStatus:string})=>r.sheetStatus==='Live').length,audit.productionActive);
 assert.equal(audit.rows.filter((r:{id:string})=>r.id==='chuan-tai-zi-mala-tang-arc').length,1);
});

test('Nature Cafe descriptive field uses the correct Vegetarian spelling',()=>{
 const nature=seed.find((r:{id:string})=>r.id==='nature-cafe');
 assert.equal(nature.legacyCuisine,'Vegetarian');
 assert.equal(JSON.stringify(nature).includes('Vegeterian'),false);
});

test('unresolved Place IDs are explicitly recorded without guessing another outlet',()=>{
 const unresolved=pilot.filter((r:{active:boolean;placeId?:string})=>r.active&&!r.placeId);
 assert.deepEqual(unresolved.map((r:{id:string})=>r.id).sort(),audit.unresolvedPlaceIds.map((r:{id:string})=>r.id).sort());
 for(const r of audit.unresolvedPlaceIds)assert.ok(r.reason&&r.sourceUrl);
});
