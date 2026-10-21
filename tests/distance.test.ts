import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {distanceTier,distanceTiers,distanceLabels,locationContext,withinRadius,tierForWalkingMinutes,hasVerifiedWalkingTime} from '../lib/distance.ts';
import {availableFilters,clearFoodPreferences,eligible,pickOne,recommendThree} from '../lib/recommend.ts';
import type {DistanceTier,Restaurant} from '../lib/types.ts';

const restaurant=(id:string,area:string,address:string,extra:Partial<Restaurant>={}):Restaurant=>({id,name:id,area,address,cuisine:['Local'],mapUrl:'https://www.google.com/maps/search/?api=1&query=lunch',walkingMinutes:null,distanceTier:'near',priceBand:null,active:true,quickLunch:null,healthyOption:null,verifiedForV2:true,lastVerifiedAt:'2026-10-19',tags:[],moodTags:[],reason:'Lunch',sourceUrl:'https://example.com',...extra});
const near=restaurant('near','MBC','40 Pasir Panjang Rd',{healthyOption:true,quickLunch:true});
const mid=restaurant('mid','ARC','460 Alexandra Rd',{distanceTier:'mid',healthyOption:true});
const far=restaurant('far','Anchorpoint','370 Alexandra Rd',{distanceTier:'far',healthyOption:true,quickLunch:true});
const pool=[near,mid,far];
test('slider labels have three ordered snap positions',()=>assert.deepEqual(distanceTiers.map(tier=>distanceLabels[tier]),['Near','Further','Furthest']));
test('Near only includes the easiest radius',()=>assert.deepEqual(eligible(pool,[],'near').map(r=>r.id),['near']));
test('Further includes Near and middle tier',()=>assert.deepEqual(eligible(pool,[],'mid').map(r=>r.id),['near','mid']));
test('Furthest includes all tiers',()=>assert.deepEqual(eligible(pool,[],'far').map(r=>r.id),['near','mid','far']));
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
test('explicit tiers override area, name and address; missing tiers never infer geography',()=>{
 assert.equal(distanceTier({...near,area:'Anchorpoint',address:'370 Alexandra Rd'}),'near');
 assert.equal(distanceTier({...far,area:'MBC',address:'30 Pasir Panjang Rd'}),'far');
 for(const value of [null,undefined,'Near','unknown'])for(const radius of ['near','mid','far'] as DistanceTier[]){
  const record={...near,distanceTier:value as DistanceTier};
  assert.equal(distanceTier(record),null);assert.equal(withinRadius(record,radius),false);
 }
 assert.equal(locationContext({...far,area:'Anchorpoint'}),'Anchorpoint · Furthest');
});
for(const [minutes,tier] of [[0,'near'],[8,'near'],[9,'mid'],[15,'mid'],[16,'far'],[35,'far']] as const){
 test(`${minutes} walking minutes maps to ${tier}`,()=>assert.equal(tierForWalkingMinutes(minutes),tier));
}
test('invalid or unverified minutes are never displayed',()=>{
 for(const value of [-1,8.5,NaN,Infinity,null,'8'])assert.equal(tierForWalkingMinutes(value),null);
 assert.equal(locationContext({...near,walkingMinutes:7}),'MBC · Near');
 const verified={...near,walkingMinutes:7,distanceVerification:{origin:'mbc-block-30',source:'Google Maps walking directions',verifiedAt:'2026-10-20',sourceUrl:'https://www.google.com/maps/dir/test',destination:'MBC outlet',endpoint:'outlet',notes:''}} as Restaurant;
 assert.equal(hasVerifiedWalkingTime(verified),true);assert.equal(locationContext(verified),'MBC · ~7 min walk');
 assert.equal(hasVerifiedWalkingTime({...verified,distanceTier:'mid'}),false);
});
test('every live production record has consistent explicit route evidence and matches the Sheet audit',()=>{
 const seed=JSON.parse(readFileSync(new URL('../data/restaurants.seed.json',import.meta.url),'utf8')).restaurants;
 const overlay=JSON.parse(readFileSync(new URL('../data/restaurants.pilot.json',import.meta.url),'utf8'));
 const audit=JSON.parse(readFileSync(new URL('../data/distance-audit.json',import.meta.url),'utf8'));
 const merged=new Map<string,Restaurant>();for(const r of [...seed,...overlay]){const id=r.id||'chuan-tai-zi-mala-tang-arc';merged.set(id,{...merged.get(id),...r,id});}
 const live=[...merged.values()].filter(r=>r.active);assert.equal(live.length,audit.reconciliation.liveProductionRecords);
 assert.deepEqual([...audit.reconciliation.liveMatchedIds].sort(),live.map(r=>r.id).sort());
 assert.equal(new Set(audit.records.map((r:Restaurant)=>r.id)).size,live.length);
 for(const r of live){
  assert.ok(['near','mid','far'].includes(r.distanceTier!),r.id);
  assert.equal(r.distanceTier,tierForWalkingMinutes(r.walkingMinutes),r.id);
  assert.ok(hasVerifiedWalkingTime(r),r.id);
  assert.ok(Number.isInteger(r.walkingDistanceMetres)&&r.walkingDistanceMetres!>=0,r.id);
  const evidence=audit.records.find((e:Restaurant)=>e.id===r.id);assert.ok(evidence,r.id);
  for(const field of ['walkingMinutes','distanceTier','walkingDistanceMetres','distanceVerification'] as const)assert.deepEqual(r[field],evidence[field],r.id);
  assert.ok(r.distanceVerification!.sourceUrl.startsWith('https://www.google.com/maps/dir/1.274851167499432,+103.7979737759009/'),r.id);
  assert.equal(distanceTier({...r,address:'unrelated address',area:'unrelated area'}),r.distanceTier,r.id);
 }
 const counts=Object.fromEntries(['near','mid','far'].map(tier=>[tier,live.filter(r=>r.distanceTier===tier).length]));
 assert.deepEqual(counts,{near:14,mid:50,far:16});
 assert.equal(Math.min(...live.map(r=>r.walkingMinutes!)),3);assert.equal(Math.max(...live.map(r=>r.walkingMinutes!)),35);
});
