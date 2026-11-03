import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachDietaryEvidence,dietaryPreviewEnabled,matchesDietary,verifiedDietaryEvidence} from '../lib/dietary.ts';
import {availableMoods,changeDistance,changePrice,eligibleForMood,pickForMood,recommendForMood} from '../lib/moods.ts';
import {matchGuidance} from '../lib/filter-feedback.ts';
import type {DietaryEvidence,DietaryRequirements,DietaryVerification,Restaurant} from '../lib/types.ts';
const now=new Date('2026-11-03T04:00:00Z');
// Synthetic certification fixtures exercise policy; they are never deployed as catalogue evidence.
const halal: DietaryEvidence={status:'Verified',authority:'MUIS',sourceUrl:'https://halal.muis.gov.sg/halal/establishments',verifiedAt:'2026-11-03',certificateReference:'EERNTEST123',currentDirectoryListing:true,observedName:'Test outlet',observedAddress:'Test address',limitations:'Synthetic test fixture only'};
const vegetarian:DietaryEvidence={status:'Verified',authority:'Official menu',sourceUrl:'https://www.gyg.com.sg/our-food',outletSourceUrl:'https://www.gyg.com.sg/locations/mapletree-business-city',verifiedAt:'2026-11-03',dish:'Test vegetarian main',limitations:'Synthetic test fixture only'};
function r(id:string,kind:'both'|'halal'|'vegetarian'|'unknown'='both',extra:Partial<Restaurant>={}):Restaurant{
 const result:Restaurant={id,name:id,address:'40 Pasir Panjang Road #02-35',area:'MBC',cuisine:['Test'],mapUrl:'https://www.google.com/maps/search/?api=1&query=test',walkingMinutes:3,distanceTier:'near',priceBand:'$$',active:true,quickLunch:null,healthyOption:null,verifiedForV2:true,lastVerifiedAt:'2026-11-03',tags:[],moodTags:['Healthy','Local / Asian'],reason:'Test',sourceUrl:'https://www.gyg.com.sg',...extra};
 result.dietaryVerification={restaurantId:result.id,outletName:result.name,outletAddress:result.address,...(kind==='both'||kind==='halal'?{halal:{...halal}}:{}),...(kind==='both'||kind==='vegetarian'?{vegetarian:{...vegetarian}}:{})};return result;
}
const pool=[r('both'),r('halal','halal'),r('vegetarian','vegetarian'),r('unknown','unknown')];
for(const [name,requirements,ids] of [['halal',{halal:true},['both','halal']],['vegetarian',{vegetarian:true},['both','vegetarian']],['AND',{halal:true,vegetarian:true},['both']]] as const){
 test(`${name} dietary filter fails closed and combines with existing eligibility`,()=>assert.deepEqual(eligibleForMood(pool,'anything','near','any',requirements,now).map(r=>r.id),ids));
}
test('neither selected preserves Sprint 2 pool',()=>assert.equal(eligibleForMood(pool,'anything','near','any',{},now).length,4));
for(const [label,patch] of Object.entries({unknown:{status:'Unknown'},notCertified:{status:'Not Certified'},expired:{validUntil:'2026-11-02'},futureValidity:{validFrom:'2026-11-04'},invalidExpiry:{validUntil:'2026-02-30'},stale:{verifiedAt:'2026-10-01'},futureCheck:{verifiedAt:'2026-11-04'},invalidDate:{verifiedAt:'yesterday'},missingReference:{certificateReference:''},notCurrent:{currentDirectoryListing:false},wrongAuthority:{authority:'Official menu'},chainClaim:{sourceUrl:'https://www.stuffd.com/sg/food/'},unsafeUrl:{sourceUrl:'javascript:alert(1)'},missingAddress:{observedAddress:''}})){
 test(`halal rejects ${label}`,()=>{const place=r('test');place.dietaryVerification!.halal={...halal,...patch} as DietaryEvidence;assert.equal(matchesDietary(place,{halal:true},now),false);});
}
test('certificate expiry is inclusive, review deadline is separate, and absent expiry is not invented',()=>{
 const place=r('test');place.dietaryVerification!.halal={...halal,validUntil:'2026-11-03'};assert.equal(matchesDietary(place,{halal:true},now),true);
 place.dietaryVerification!.halal={...halal,validUntil:null};assert.equal(matchesDietary(place,{halal:true},now),true);
 assert.equal(matchesDietary(place,{halal:true},new Date('2026-12-04')),false);
});
for(const [label,patch] of Object.entries({unknown:{status:'Unknown'},missingDish:{dish:''},invalidDish:{dish:12},missingSource:{sourceUrl:''},unsafeSource:{sourceUrl:'http://www.gyg.com.sg/our-food'},thirdPartyMenu:{sourceUrl:'https://foodblog.example/menu'},missingOutlet:{outletSourceUrl:''},thirdPartyOutlet:{outletSourceUrl:'https://example.com/outlet'},stale:{verifiedAt:'2026-07-01'},invalidDate:{verifiedAt:'2026-02-30'},missingLimitations:{limitations:''}})){
 test(`vegetarian rejects ${label}`,()=>{const place=r('test');place.dietaryVerification!.vegetarian={...vegetarian,...patch} as DietaryEvidence;assert.equal(matchesDietary(place,{vegetarian:true},now),false);});
}
test('missing evidence and mismatched exact outlet id, name or address are excluded',()=>{
 for(const field of ['restaurantId','outletName','outletAddress'] as const){const place=r('test');place.dietaryVerification![field]+=' other branch';assert.equal(matchesDietary(place,{halal:true},now),false);assert.equal(matchesDietary(place,{vegetarian:true},now),false);}
 const place=r('test');delete place.dietaryVerification;assert.equal(matchesDietary(place,{halal:true},now),false);
});
test('unknown and malformed requirements never silently broaden',()=>{for(const value of [{halal:'true'},{vegan:true},null,[]])assert.equal(matchesDietary(pool[0],value as DietaryRequirements,now),false);});
test('distance, price and mood intersect all dietary constraints',()=>{
 const places=[r('match'),r('wrong-price','both',{priceBand:'$'}),r('wrong-distance','both',{distanceTier:'far'}),r('wrong-mood','both',{moodTags:['Western / Cafe']}),r('unverified','unknown')];
 assert.deepEqual(eligibleForMood(places,'healthy','near','$$',{halal:true,vegetarian:true},now).map(r=>r.id),['match']);
});
for(const size of [0,1,2,3,5])test(`${size} verified matches: single, shortlist and reroll share one constrained pool`,()=>{
 const places=[...Array.from({length:size},(_,i)=>r('verified'+i)),r('unsafe','unknown')],requirements={halal:true,vegetarian:true};
 assert.equal(eligibleForMood(places,'healthy','near','$$',requirements,now).length,size);
 const one=pickForMood(places,'healthy','near',[],()=>0,'$$',requirements,now);
 assert.equal(one===null,size===0);if(one)assert.match(one.id,/^verified/);
 const first=recommendForMood(places,'healthy','near',[],()=>0,'$$',requirements,now);
 assert.equal(first.length,size<3?0:3);
 const reroll=recommendForMood(places,'healthy','near',first.map(r=>r.id),()=>.9,'$$',requirements,now);
 assert.equal(reroll.length,size<3?0:3);assert.ok(reroll.every(r=>r.id.startsWith('verified')));
 assert.equal(new Set(reroll.map(r=>r.id)).size,reroll.length);
 if(size>3)assert.ok(reroll.some(r=>!first.some(p=>p.id===r.id)));
 if(size>1)assert.notEqual(pickForMood(places,'healthy','near',[one!.id],()=>0,'$$',requirements,now)?.id,one!.id);
});
test('distance and price preserve dietary requirements and mood without fallback',()=>{
 const preferences={distance:'near' as const,mood:'healthy' as const,price:'$$' as const,dietary:{halal:true,vegetarian:true}};
 const next=changePrice(changeDistance(preferences,'far',[]),'$',[]);
 assert.deepEqual(next,{...preferences,distance:'far',price:'$'});
 assert.deepEqual(eligibleForMood(pool,next.mood,next.distance,next.price,next.dietary,now),[]);
 assert.ok(availableMoods([],'near','any',{halal:true}).includes('healthy'));
 assert.match(matchGuidance(0,true),/No verified results/);assert.match(matchGuidance(0,true),/stay selected/);
});
test('duplicate verification records fail closed and attachment never changes catalogue identity',()=>{
 const place=r('test'),evidence=place.dietaryVerification!;
 const attached=attachDietaryEvidence([place],[evidence,evidence]);assert.equal(attached[0].dietaryVerification,undefined);assert.equal(place.dietaryVerification,evidence);
});
test('preview gate cannot be enabled in production or by missing environment',()=>{assert.equal(dietaryPreviewEnabled('preview'),true);for(const env of ['production','development','',undefined])assert.equal(dietaryPreviewEnabled(env),false);});
test('curated evidence uses canonical identities, records 12 MUIS matches and 4 vegetarian mains',()=>{
 const seed=JSON.parse(readFileSync(new URL('../data/restaurants.seed.json',import.meta.url),'utf8')).restaurants;
 const overlay=JSON.parse(readFileSync(new URL('../data/restaurants.pilot.json',import.meta.url),'utf8'));
 const places=overlay.map((p:Restaurant)=>({...seed.find((s:Restaurant)=>s.id===p.id),...p}));
 const data=JSON.parse(readFileSync(new URL('../data/dietary.staging.v1.json',import.meta.url),'utf8'));
 const attached=attachDietaryEvidence(places,data.records as DietaryVerification[]);
 assert.equal(data.environment,'preview-only');assert.equal(new Set(data.records.map((r:DietaryVerification)=>r.restaurantId)).size,data.records.length);
 assert.equal(attached.filter(r=>verifiedDietaryEvidence(r,'halal',now)).length,12);
 assert.equal(attached.filter(r=>verifiedDietaryEvidence(r,'vegetarian',now)).length,4);
 assert.equal(attached.filter(r=>matchesDietary(r,{halal:true,vegetarian:true},now)).length,1);
 for(const record of data.records)assert.ok(places.some((r:Restaurant)=>r.id===record.restaurantId&&r.name===record.outletName&&r.address===record.outletAddress));
});
