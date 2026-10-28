import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableMoods,changeDistance,eligibleForMood,isMood,moodTags,moodValues,pickForMood,recommendForMood} from '../lib/moods.ts';
import type {Mood,MoodTag,Restaurant} from '../lib/types.ts';
const r=(id:string,moods:MoodTag[],extra:Partial<Restaurant>={}):Restaurant=>({id,name:id,cuisine:['Healthy'],address:'40 Pasir Panjang Rd',area:'MBC',mapUrl:'https://www.google.com/maps/search/?api=1&query=lunch',active:true,verifiedForV2:true,lastVerifiedAt:'2026-10-19',walkingMinutes:null,distanceTier:'near',priceBand:null,quickLunch:null,healthyOption:null,tags:['Healthy'],moodTags:moods,reason:'Healthy Western local salad lunch',sourceUrl:'https://example.com',...extra});
const pool=[r('healthy',['Healthy','Local / Asian']),r('local',['Local / Asian']),r('western',['Western / Cafe']),r('multi',['Local / Asian','Western / Cafe']),r('no-tags',[])];
test('Anything imposes no mood constraint, including untagged safe places',()=>assert.equal(eligibleForMood(pool,'anything','near').length,5));
for(const [mood,ids] of [['healthy',['healthy']],['local_asian',['healthy','local','multi']],['western_cafe',['western','multi']]] as const){
 test(`${mood} uses explicit exact Mood Tags only`,()=>assert.deepEqual(eligibleForMood(pool,mood,'near').map(r=>r.id),ids));
}
test('multi-tag places qualify independently for every selected matching mood',()=>{
 const multi=pool.find(r=>r.id==='multi')!;
 assert.deepEqual(eligibleForMood([multi],'local_asian'),[multi]);assert.deepEqual(eligibleForMood([multi],'western_cafe'),[multi]);
 assert.deepEqual(eligibleForMood([multi],'healthy'),[]);
});
test('cuisine, name, reason, legacy food flags and general Tags never imply a mood',()=>{
 const inferred=r('Healthy Western Cafe Local Asian',[],{healthyOption:true,quickLunch:true,cuisine:['Healthy','Western','Asian']});
 for(const mood of ['healthy','local_asian','western_cafe'] as Mood[])assert.deepEqual(eligibleForMood([inferred],mood),[]);
 const malformed=r('malformed',['healthy','Healthy, Local / Asian'] as unknown as MoodTag[]);
 assert.deepEqual(eligibleForMood([malformed],'healthy'),[]);
});
test('mood and exclusive distance intersect',()=>{
 const locations=[r('near',['Healthy']),r('mid',['Healthy'],{distanceTier:'mid',area:'ARC',address:'460 Alexandra Rd'}),r('far',['Healthy'],{distanceTier:'far',area:'Anchorpoint',address:'370 Alexandra Rd'}),r('wrong-mood',['Local / Asian'])];
 assert.deepEqual(eligibleForMood(locations,'healthy','near').map(r=>r.id),['near']);
 assert.deepEqual(eligibleForMood(locations,'healthy','mid').map(r=>r.id),['mid']);
 assert.deepEqual(eligibleForMood(locations,'healthy','far').map(r=>r.id),['far']);
});
test('changing distance resets a mood that cannot support a shortlist, but keeps one with at least three matches',()=>{
 const places=[r('local1',['Local / Asian']),r('local2',['Local / Asian']),r('local3',['Local / Asian']),r('far',['Healthy'],{distanceTier:'far',area:'Anchorpoint',address:'370 Alexandra Rd'})];
 assert.deepEqual(changeDistance({distance:'far',mood:'healthy'},'near',places),{distance:'near',mood:'anything'});
 assert.deepEqual(changeDistance({distance:'near',mood:'local_asian'},'far',places),{distance:'far',mood:'anything'});
 const farLocals=places.concat(['a','b','c'].map(id=>r('far-'+id,['Local / Asian'],{distanceTier:'far'})));
 assert.deepEqual(changeDistance({distance:'near',mood:'local_asian'},'far',farLocals),{distance:'far',mood:'local_asian'});
});
test('mood choices require at least three eligible places; Anything always remains',()=>{
 const two=[r('local1',['Local / Asian']),r('local2',['Local / Asian'])];
 const three=[...two,r('local3',['Local / Asian'])];
 assert.deepEqual(availableMoods(two,'near'),['anything']);
 assert.deepEqual(availableMoods(three,'near'),['anything','local_asian']);
 assert.deepEqual(availableMoods([],'near'),['anything']);
});
test('shortlist uses three unique eligible places and explicitly refuses fewer than three',()=>{
 const places=[...Array.from({length:5},(_,i)=>r(`local${i}`,['Local / Asian'])),r('wrong',['Western / Cafe'])];
 const result=recommendForMood(places,'local_asian','near',[],()=>.5);
 assert.equal(result.length,3);assert.equal(new Set(result.map(r=>r.id)).size,3);
 assert.ok(result.every(r=>r.moodTags.includes('Local / Asian')));
 assert.deepEqual(recommendForMood(pool,'healthy','near'),[]);
});
test('single pick and reroll respect the same mood and radius pool',()=>{
 const places=[...Array.from({length:5},(_,i)=>r(`local${i}`,['Local / Asian'])),r('far',['Local / Asian'],{distanceTier:'far',area:'Anchorpoint',address:'370 Alexandra Rd'}),r('wrong',['Western / Cafe'])];
 const old=recommendForMood(places,'local_asian','near',[],()=>0).map(r=>r.id);
 const next=recommendForMood(places,'local_asian','near',old,()=>0).map(r=>r.id);
 assert.notDeepEqual(next.sort(),old.sort());
 assert.ok(next.every(id=>id.startsWith('local')));
 for(const rng of [0,.3,.9,.999])assert.ok(pickForMood(places,'local_asian','near',[],()=>rng)?.id.startsWith('local'));
 assert.notEqual(pickForMood(places,'local_asian','near',['local0'],()=>0)?.id,'local0');
 assert.equal(pickForMood([], 'healthy','near'),null);
});
test('inactive, unverified, undated and unsafe places never enter mood recommendations',()=>{
 const base=r('bad',['Healthy']);const unsafe=[{...base,active:false},{...base,verifiedForV2:false},{...base,lastVerifiedAt:null},{...base,mapUrl:'javascript:alert(1)'}];
 for(const mood of moodValues)assert.deepEqual(eligibleForMood(unsafe,mood,'far'),[]);
 const legacy={...base,verifiedForV2:false,lastVerifiedAt:null,importedFromV1:true};
 assert.equal(eligibleForMood([legacy],'anything','near').length,1);
 assert.deepEqual(eligibleForMood([legacy],'healthy','near'),[]);
});
test('unknown front-end mood values cannot silently broaden or match',()=>{
 for(const value of ['Healthy','local','anything else','Western / Cafe',null,{},'']){
  assert.equal(isMood(value),false);assert.deepEqual(eligibleForMood(pool,value as Mood,'far'),[]);
 }
});
test('production data has valid explicit tags with no Anything or duplicate tags',()=>{
 const records=JSON.parse(readFileSync(new URL('../data/restaurants.pilot.json',import.meta.url),'utf8'));
 assert.equal(new Set(records.map((r:Restaurant)=>r.id)).size,records.length);
 for(const record of records){assert.ok(Array.isArray(record.moodTags),record.id);assert.ok(record.moodTags.length>0,record.id);assert.equal(new Set(record.moodTags).size,record.moodTags.length);assert.ok(record.moodTags.every((t:MoodTag)=>moodTags.includes(t)),record.id);assert.ok(!record.moodTags.includes('Anything'));}
 assert.equal(records.length,80);
 const counts=Object.fromEntries(moodTags.map(t=>[t,records.filter((r:Restaurant)=>r.moodTags.includes(t)).length]));
 assert.deepEqual(counts,{'Healthy':8,'Local / Asian':53,'Western / Cafe':33});
 assert.deepEqual(records.find((r:Restaurant)=>r.id==='green-elephant-thai-dynasty-mbc').moodTags,['Healthy','Local / Asian','Western / Cafe']);
 assert.deepEqual(records.find((r:Restaurant)=>r.id==='sando').moodTags,['Local / Asian','Western / Cafe']);
 assert.deepEqual(records.find((r:Restaurant)=>r.id==='canopy-hortpark').moodTags,['Healthy','Western / Cafe']);
 for(const id of ['nature-cafe','stuff-d-arc','the-soup-spoon-arc','hundred-grains-arc','mr-bean'])assert.ok(records.find((r:Restaurant)=>r.id===id).moodTags.includes('Healthy'));
 assert.ok(!records.find((r:Restaurant)=>r.id==='boost-juice-bar-arc').moodTags.includes('Healthy'));
});
