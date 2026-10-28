import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changePrice,eligibleForMood,pickForMood,recommendForMood} from '../lib/moods.ts';
import {matchesPriceSelection,priceCoverageReady,priceOptions} from '../lib/price.ts';
import type {Restaurant} from '../lib/types.ts';
const r=(id:string,priceBand:string|null,extra:Partial<Restaurant>={}):Restaurant=>({
 id,name:id,area:'MBC',address:'40 Pasir Panjang Road',cuisine:['Local'],
 mapUrl:'https://www.google.com/maps/search/?api=1&query=lunch',
 walkingMinutes:4,distanceTier:'near',priceBand,active:true,quickLunch:null,healthyOption:null,
 verifiedForV2:true,lastVerifiedAt:'2026-10-20',tags:[],moodTags:['Local / Asian'],
 reason:'Lunch',sourceUrl:'https://example.com',...extra
});
const pool=[r('budget','$'),r('regular','$$'),r('treat','$$$'),r('unclassified','Unknown'),r('missing',null)];
test('price slider has four positions, not a cumulative ceiling',()=>assert.deepEqual(priceOptions,['any','$','$$','$$$']));
test('only exact price tier matches; Any retains unknowns',()=>{
 for(const [tier,expected] of [['any',['budget','regular','treat','unclassified','missing']],['$',['budget']],['$$',['regular']],['$$$',['treat']]] as const){
  assert.deepEqual(eligibleForMood(pool,'anything','near',tier).map(x=>x.id),expected);
 }
 assert.equal(matchesPriceSelection(pool[3],'$'),false);
 assert.equal(matchesPriceSelection(pool[4],'any'),true);
});
test('price and distance and mood intersect; no silent broadening',()=>{
 const mixed=[...pool,r('far-budget','$',{distanceTier:'far'}),r('far-treat','$$$',{distanceTier:'far'})];
 assert.deepEqual(eligibleForMood(mixed,'local_asian','near','$$$').map(x=>x.id),['treat']);
 assert.deepEqual(eligibleForMood(mixed,'local_asian','far','$$$').map(x=>x.id),['far-treat']);
 assert.deepEqual(eligibleForMood(mixed,'local_asian','far','$$').map(x=>x.id),[]);
 assert.equal(pickForMood(mixed,'anything','far',[],()=>.99,'$$$')?.id,'far-treat');
 assert.deepEqual(recommendForMood(mixed,'anything','far',[],()=>0,'$$$'),[]);
});
test('changing price preserves distance and resets unavailable mood',()=>{
 const prefs={distance:'near' as const,mood:'local_asian' as const,price:'any' as const};
 assert.deepEqual(changePrice(prefs,'$$',pool),{distance:'near',mood:'anything',price:'$$'});
});
test('price filter stays closed until all active records have tiers',()=>{
 assert.equal(priceCoverageReady(pool),false);
 assert.equal(priceCoverageReady(pool.filter(x=>x.priceBand!=='Unknown'&&x.priceBand!==null)),true);
 assert.equal(priceCoverageReady(pool.filter(x=>x.priceBand==='$')),false);
 assert.equal(priceCoverageReady([]),false);
});
test('invalid selections never match silently',()=>{
 assert.deepEqual(eligibleForMood(pool,'anything','near','unknown' as never),[]);
 assert.deepEqual(eligibleForMood(pool,'anything','near','$$$$' as never),[]);
});
