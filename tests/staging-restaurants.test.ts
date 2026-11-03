import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withStagingRestaurants} from '../lib/staging-restaurants.ts';
import {attachDietaryEvidence} from '../lib/dietary.ts';
import {eligibleForMood,pickForMood,recommendForMood} from '../lib/moods.ts';
import {tierForWalkingMinutes} from '../lib/distance.ts';
import type {Restaurant} from '../lib/types.ts';
const read=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const additions:Restaurant[]=read('../data/restaurants.staging.v1.json').restaurants;
const evidence=read('../data/dietary.staging.v1.json').records;
const now=new Date('2026-11-03T04:00:00Z');
test('staging outlets are absent outside Preview, including production',()=>{
 for(const environment of ['production','development','',undefined])assert.deepEqual(withStagingRestaurants([],additions,environment),[]);
 assert.equal(withStagingRestaurants([],additions,'preview').length,2);
});
test('staging additions do not duplicate existing catalogue IDs or exact identities',()=>{
 assert.equal(withStagingRestaurants(additions,additions,'preview').length,2);
 assert.equal(withStagingRestaurants(additions,[{...additions[0],id:'other-id'}],'preview').length,2);
});
test('two exact certified Near outlets support single picks and reroll without an unsafe shortlist',()=>{
 const places=attachDietaryEvidence(withStagingRestaurants([],additions,'preview'),evidence);
 assert.deepEqual(eligibleForMood(places,'anything','near','any',{halal:true},now).map(r=>r.id),['fong-seng-nasi-lemak-pasir-panjang','subway-mapletree-business-city']);
 const first=pickForMood(places,'anything','near',[],()=>0,'any',{halal:true},now)!;
 const next=pickForMood(places,'anything','near',[first.id],()=>0,'any',{halal:true},now)!;
 assert.notEqual(first.id,next.id);
 assert.deepEqual(recommendForMood(places,'anything','near',[],()=>0,'any',{halal:true},now),[]);
 for(const place of places){
  assert.equal(tierForWalkingMinutes(place.walkingMinutes), 'near');
  assert.equal(place.distanceVerification?.endpoint,'outlet');
  assert.equal(place.priceBand,null);
 }
 assert.equal(eligibleForMood(places,'local_asian','near','any',{halal:true},now)[0]?.id,additions[0].id);
 assert.equal(eligibleForMood(places,'western_cafe','near','any',{halal:true},now)[0]?.id,additions[1].id);
 for(const price of ['$','$$','$$$'] as const)assert.equal(eligibleForMood(places,'anything','near',price,{halal:true},now).length,0);
 assert.equal(eligibleForMood(places,'anything','near','any',{halal:true,vegetarian:true},now).length,0);
 assert.equal(eligibleForMood(places,'anything','near','any',{halal:true},new Date('2026-12-04')).length,0);
});
