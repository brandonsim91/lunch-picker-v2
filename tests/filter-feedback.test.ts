import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchCountLabel,matchGuidance,moodResetFeedback} from '../lib/filter-feedback.ts';
import {changeDistance,changePrice,eligibleForMood} from '../lib/moods.ts';
import type {Restaurant} from '../lib/types.ts';
const r=(id:string,distanceTier:'near'|'mid'|'far',priceBand:string|null):Restaurant=>({
 id,name:id,area:'MBC',address:'40 Pasir Panjang Road',cuisine:['Local'],
 mapUrl:'https://www.google.com/maps/search/?api=1&query=lunch',
 walkingMinutes:3,distanceTier,priceBand,active:true,quickLunch:null,healthyOption:null,
 verifiedForV2:true,lastVerifiedAt:'2026-10-20',tags:[],moodTags:['Local / Asian'],reason:'Lunch',sourceUrl:'https://example.com'
});
const pool=[r('n1','near','$'),r('n2','near','$$'),r('n3','near','$$'),r('m1','mid','$'),r('f1','far','$$$')];
test('live match counts reflect exact distance and price selections',()=>{
 for(const [distance,price,expected] of [['near','any',3],['near','$',1],['near','$$',2],['mid','any',1],['mid','$$',0],['far','$$$',1]] as const){
  const count=eligibleForMood(pool,'anything',distance,price).length;
  assert.equal(count,expected);
  assert.equal(matchCountLabel(count),`${expected} ${expected===1?'restaurant':'restaurants'} match`);
 }
});
test('zero, one and two matches have actionable guidance',()=>{
 assert.match(matchGuidance(0),/Try another distance tier/);
 assert.match(matchGuidance(1),/needs at least 3 matches/);
 assert.match(matchGuidance(2),/pick one/);
 assert.equal(matchGuidance(3),'');
 assert.equal(matchCountLabel(12),'12 restaurants match');
});
test('mood reset reason appears for distance and price changes, not preserved moods',()=>{
 const prefs={distance:'near' as const,mood:'local_asian' as const,price:'any' as const};
 const far=changeDistance(prefs,'far',pool);
 assert.equal(far.mood,'anything');
 assert.match(moodResetFeedback(prefs.mood,far.mood),/Local \/ Asian.*mood changed to Anything/);
 const budget=changePrice(prefs,'$',pool);
 assert.equal(budget.mood,'anything');
 assert.match(moodResetFeedback(prefs.mood,budget.mood),/fewer than 3 matches/);
 const same=changePrice(prefs,'any',pool);
 assert.equal(same.mood,'local_asian');
 assert.equal(moodResetFeedback(prefs.mood,same.mood),'');
});
test('UI has neutral tracks, live match status, and disabled impossible actions',()=>{
 const ui=readFileSync(new URL('../components/LunchApp.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
 assert.match(ui,/className="match-summary" aria-live="polite"/);
 assert.match(ui,/disabled=\{count<3\}/);
 assert.match(ui,/disabled=\{count===0\}/);
 assert.match(ui,/moodResetNotice&&.*role="status"/);
 assert.match(css,/::-webkit-slider-runnable-track\{[^}]*background:var\(--line\)/);
 assert.match(css,/::-moz-range-track\{[^}]*background:var\(--line\)/);
 assert.doesNotMatch(css,/--tier-progress|linear-gradient\(to right,var\(--clay\)/);
});
