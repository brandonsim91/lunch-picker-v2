import type {DietaryRequirements,DistanceTier,Mood,MoodPreferences,MoodTag,PriceSelection,Restaurant} from './types.ts';
import {hasDietaryRequirements,matchesDietary} from './dietary.ts';
import {eligible,pickOne,recommendThree} from './recommend.ts';
import {isPriceSelection,matchesPriceSelection} from './price.ts';
export const moodValues: Mood[]=['anything','healthy','local_asian','western_cafe'];
export const moodTags: MoodTag[]=['Healthy','Local / Asian','Western / Cafe'];
export const moodLabels: Record<Mood,string>={anything:'Anything',healthy:'Healthy',local_asian:'Local / Asian',western_cafe:'Western / Cafe'};
const requiredTag: Record<Exclude<Mood,'anything'>,MoodTag>={healthy:'Healthy',local_asian:'Local / Asian',western_cafe:'Western / Cafe'};
export function isMood(value: unknown): value is Mood {return typeof value==='string' && moodValues.includes(value as Mood);}
export function eligibleForMood(pool: Restaurant[],mood: Mood,distance?: DistanceTier,price: PriceSelection='any',dietary:DietaryRequirements={},now=new Date()) {
 if(!isMood(mood)||!isPriceSelection(price))return [];
 return eligible(pool,[],distance).filter(r=>matchesDietary(r,dietary,now) && matchesPriceSelection(r,price) && (mood==='anything'||(
  r.verifiedForV2 && !!r.lastVerifiedAt && Array.isArray(r.moodTags) && r.moodTags.includes(requiredTag[mood])
 )));
}
export const minimumMoodShortlistSize=3;
export function availableMoods(pool: Restaurant[],distance: DistanceTier,price: PriceSelection='any',dietary:DietaryRequirements={}): Mood[] {
 if(hasDietaryRequirements(dietary))return moodValues;
 return moodValues.filter(m=>m==='anything'||eligibleForMood(pool,m,distance,price).length>=minimumMoodShortlistSize);
}
export function changeDistance(preferences: MoodPreferences,distance: DistanceTier,pool: Restaurant[]): MoodPreferences {
 const price=preferences.price??'any';
 if(hasDietaryRequirements(preferences.dietary))return {...preferences,distance};
 return {...preferences,distance,mood:availableMoods(pool,distance,price).includes(preferences.mood)?preferences.mood:'anything'};
}
export function changePrice(preferences: MoodPreferences,price: PriceSelection,pool: Restaurant[]): MoodPreferences {
 if(hasDietaryRequirements(preferences.dietary))return {...preferences,price};
 return {...preferences,price,mood:availableMoods(pool,preferences.distance,price).includes(preferences.mood)?preferences.mood:'anything'};
}
export function pickForMood(pool: Restaurant[],mood: Mood,distance: DistanceTier,previous: string[]=[],rng=Math.random,price: PriceSelection='any',dietary:DietaryRequirements={},now=new Date()) {
 return pickOne(eligibleForMood(pool,mood,distance,price,dietary,now),[],previous,rng,distance);
}
export function recommendForMood(pool: Restaurant[],mood: Mood,distance: DistanceTier,previous: string[]=[],rng=Math.random,price: PriceSelection='any',dietary:DietaryRequirements={},now=new Date()) {
 return recommendThree(eligibleForMood(pool,mood,distance,price,dietary,now),[],previous,rng,distance);
}
