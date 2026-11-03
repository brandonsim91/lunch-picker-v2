import type {DietaryEvidence,DietaryRequirements,DietaryVerification,Restaurant} from './types.ts';

// Policy windows are review deadlines, never inferred certificate expiry dates.
export const dietaryReviewDays={halal:30,vegetarian:90} as const;
export const dietaryLabels={halal:'Halal-certified',vegetarian:'Vegetarian options'} as const;
const menuHosts=['www.naturecafe.com.sg','www.stuffd.com','www.gyg.com.sg','www.thesoupspoon.com'];
function date(value:unknown):number {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;
 const result=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(result)&&new Date(result).toISOString().slice(0,10)===value?result:NaN;
}
function httpsUrl(value:unknown,hosts?:string[]):boolean {
 try{if(typeof value!=='string')return false;const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!hosts||hosts.includes(u.hostname));}catch{return false;}
}
export function hasDietaryRequirements(requirements:DietaryRequirements={}):boolean {
 return requirements.halal===true||requirements.vegetarian===true;
}
// Production release explicitly approved by the owner on 3 November 2026.
export function dietaryReleaseEnabled(environment:string|undefined):boolean{return environment==='preview'||environment==='production';}
export function verifiedDietaryEvidence(r:Restaurant,kind:'halal'|'vegetarian',now=new Date()):DietaryEvidence|null {
 const v=r.dietaryVerification,e=v?.[kind];
 if(!v||v.restaurantId!==r.id||v.outletName!==r.name||v.outletAddress!==r.address||!e||e.status!=='Verified')return null;
 const today=date(now.toISOString().slice(0,10)),checked=date(e.verifiedAt);
 if(!Number.isFinite(checked)||checked>today||today-checked>dietaryReviewDays[kind]*86400000)return null;
 if(typeof e.limitations!=='string'||!e.limitations.trim())return null;
 if(kind==='halal'){
  if(e.authority!=='MUIS'||!httpsUrl(e.sourceUrl,['halal.muis.gov.sg'])||!new URL(e.sourceUrl).pathname.startsWith('/halal/establishments')||e.currentDirectoryListing!==true||!/^EE[A-Z0-9]+$/.test(e.certificateReference??'')||typeof e.observedName!=='string'||!e.observedName.trim()||typeof e.observedAddress!=='string'||!e.observedAddress.trim())return null;
  if(e.validFrom!=null&&(!Number.isFinite(date(e.validFrom))||date(e.validFrom)>today))return null;
  if(e.validUntil!=null&&(!Number.isFinite(date(e.validUntil))||date(e.validUntil)<today))return null;
 }else if(e.authority!=='Official menu'||!httpsUrl(e.sourceUrl,menuHosts)||!httpsUrl(e.outletSourceUrl,[...menuHosts,'www.arc4u.com.sg'])||typeof e.dish!=='string'||!e.dish.trim())return null;
 return e;
}
export function matchesDietary(r:Restaurant,requirements:DietaryRequirements={},now=new Date()):boolean {
 // Reject malformed persisted/API requirements instead of broadening them.
 if(!requirements||typeof requirements!=='object'||Array.isArray(requirements)||Object.keys(requirements).some(k=>!['halal','vegetarian'].includes(k))||Object.values(requirements).some(v=>typeof v!=='boolean'))return false;
 return (!requirements.halal||!!verifiedDietaryEvidence(r,'halal',now))&&(!requirements.vegetarian||!!verifiedDietaryEvidence(r,'vegetarian',now));
}
export function attachDietaryEvidence(pool:Restaurant[],records:DietaryVerification[]):Restaurant[]{
 return pool.map(r=>{
  const matches=records.filter(v=>v.restaurantId===r.id);
  // Conflicting/duplicate records are not resolved by array order.
  return {...r,dietaryVerification:matches.length===1?matches[0]:undefined};
 });
}
