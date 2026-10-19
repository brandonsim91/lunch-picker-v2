import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {distanceTier,locationContext,withinRadius} from '../lib/distance.ts';
import {availableFilters,clearFoodPreferences,eligible,pickOne,recommendThree} from '../lib/recommend.ts';
import type {DistanceTier,Restaurant} from '../lib/types.ts';

const restaurant=(id:string,area:string,address:string,extra:Partial<Restaurant>={}):Restaurant=>({id,name:id,area,address,cuisine:['Local'],mapUrl:'https://www.google.com/maps/search/?api=1&query=lunch',walkingMinutes:null,priceBand:null,active:true,quickLunch:null,healthyOption:null,verifiedForV2:true,lastVerifiedAt:'2026-10-19',tags:[],reason:'Lunch',sourceUrl:'https://example.com',...extra});
const near=restaurant('near','MBC','40 Pasir Panjang Rd',{healthyOption:true,quickLunch:true});
const mid=restaurant('mid','ARC','460 Alexandra Rd',{healthyOption:true});
const far=restaurant('far','Anchorpoint','370 Alexandra Rd',{healthyOption:true,quickLunch:true});
const pool=[near,mid,far];
test('Near only includes the easiest radius',()=>assert.deepEqual(eligible(pool,[],'near').map(r=>r.id),['near']));
test('A bit further includes Near and middle tier',()=>assert.deepEqual(eligible(pool,[],'mid').map(r=>r.id),['near','mid']));
test('Further includes all tiers',()=>assert.deepEqual(eligible(pool,[],'far').map(r=>r.id),['near','mid','far']));
test('distance intersects Healthy without silently broadening',()=>{
 assert.deepEqual(eligible([...pool,restaurant('unhealthy','MBC','20 Pasir Panjang Rd')],['Healthy'],'mid').map(r=>r.id),['near','mid']);
 assert.equal(eligible([far],['Healthy'],'near').length,0);
});
test('distance intersects Quick and Cheap independently and together',()=>{
 assert.deepEqual(eligible(pool,['Quick'],'mid').map(r=>r.id),['near']);
 assert.deepEqual(eligible(pool,['Quick','Healthy'],'far').map(r=>r.id),['near','far']);
 assert.equal(eligible(pool,['Cheap'],'far').length,0);
 assert.deepEqual(eligible([{...near,priceBand:'$'},far],['Cheap','Healthy'],'near').map(r=>r.id),['near']);
});
test('Anything clears only food constraints and preserves each distance',()=>{
 for(const distance of ['near','mid','far'] as DistanceTier[]){
  const prefs=clearFoodPreferences({distance,food:['Quick','Healthy']});
  assert.deepEqual(prefs,{distance,food:[]});
  assert.equal(eligible(pool,prefs.food,prefs.distance).length,{near:1,mid:2,far:3}[distance]);
 }
});
test('shortlist contains three unique eligible restaurants within the chosen radius',()=>{
 const larger=[near,{...near,id:'near2'},{...near,id:'near3'},mid,far];
 const result=recommendThree(larger,['Healthy'],[],()=>0.99,'near');
 assert.equal(result.length,3);assert.equal(new Set(result.map(r=>r.id)).size,3);
 assert.ok(result.every(r=>distanceTier(r)==='near'&&r.healthyOption===true));
 assert.deepEqual(recommendThree(pool,[],[],()=>0,'mid'),[]);
});
test('single pick respects distance across the random range',()=>{
 for(const distance of ['near','mid','far'] as DistanceTier[])for(const rng of [0,.25,.5,.99]){
  const picked=pickOne(pool,[],[],()=>rng,distance);assert.ok(picked&&withinRadius(picked,distance));
 }
 assert.notEqual(pickOne(pool,[],[],()=>0,'far')?.id,pickOne(pool,[],[],()=>.99,'far')?.id);
});
test('reroll preserves radius and food constraints while avoiding the old set',()=>{
 const larger=[near,...[2,3,4,5].map(i=>({...near,id:`near${i}`})),mid,far];
 const old=recommendThree(larger,['Healthy'],[],()=>0,'near').map(r=>r.id);
 const next=recommendThree(larger,['Healthy'],old,()=>0,'near');
 assert.notDeepEqual(next.map(r=>r.id).sort(),old.sort());assert.ok(next.every(r=>withinRadius(r,'near')));
 assert.notEqual(pickOne(larger,[],[near.id],()=>0,'near')?.id,near.id);
});
test('inactive, unverified and unsafe restaurants remain excluded in every radius',()=>{
 const unsafe=[{...near,active:false},{...near,verifiedForV2:false},{...near,lastVerifiedAt:null},{...near,mapUrl:'javascript:alert(1)'}];
 for(const distance of ['near','mid','far'] as DistanceTier[])assert.deepEqual(eligible(unsafe,[],distance),[]);
 const legacy={...near,verifiedForV2:false,lastVerifiedAt:null,importedFromV1:true};
 assert.equal(eligible([legacy],[],'near').length,1);
 assert.deepEqual(eligible([legacy],['Healthy'],'near'),[]);
 assert.deepEqual(availableFilters([legacy],'near'),[]);
});
test('specific addresses take priority over broad Alexandra and Labrador labels',()=>{
 for(const address of ['370 Alexandra Rd','317 Alexandra Road','321 Alexandra Rd'])assert.equal(distanceTier({area:'Alexandra',address}),'far');
 assert.equal(locationContext({...far,area:'Alexandra'}),'Anchorpoint · Further');
 assert.equal(distanceTier({area:'Labrador Park',address:'1 Pasir Panjang Rd, Labrador Tower'}),'near');
 assert.equal(distanceTier({area:'Labrador Park',address:'Broader park location'}),'mid');
 assert.equal(distanceTier({area:'Pasir Panjang',address:'130 Pasir Panjang Rd'}),'mid');
 assert.equal(distanceTier({area:'Alexandra',address:'991B Alexandra Road'}),'mid');
 assert.equal(distanceTier({area:'Unknown',address:'Unmapped outlet'}),'far');
});
test('catalogue exceptions and walking-time integrity are preserved',()=>{
 const seed=JSON.parse(readFileSync(new URL('../data/restaurants.seed.json',import.meta.url),'utf8')).restaurants;
 const overlay=JSON.parse(readFileSync(new URL('../data/restaurants.pilot.json',import.meta.url),'utf8'));
 const merged=new Map<string,Restaurant>();for(const r of [...seed,...overlay]){const id=r.id||'chuan-tai-zi-mala-tang-arc';merged.set(id,{...merged.get(id),...r,id});}
 const records=[...merged.values()];const before=JSON.stringify(records);
 const expected: Record<string,DistanceTier>={'ma-maison':'far','ikea-alexandra-restaurant':'far','sando':'mid','killiney-kopitiam':'mid','reply-k1988-alexandra':'mid','liu-lang-mian-noodle-bar':'far','master-prata':'far','otoko-ramen':'far','nature-cafe':'far','canopy-hortpark':'far','hopscotch-gillman-barracks':'far','grains-co-mapletree-business-city':'near','1-alfaro-labrador-park':'near'};
 for(const [id,tier]of Object.entries(expected)){assert.ok(merged.has(id));assert.equal(distanceTier(merged.get(id)!),tier,id);}
 records.forEach(distanceTier);assert.equal(JSON.stringify(records),before);
});
