import type {DistanceTier,Mood,MoodPreferences,MoodTag,PriceSelection,Restaurant} from './types.ts';
import {eligible,pickOne,recommendThree} from './recommend.ts';
import {isPriceSelection,matchesPriceSelection} from './price.ts';
export const moodValues: Mood[]=['anything','healthy','local_asian','western_cafe'];
export const moodTags: MoodTag[]=['Healthy','Local / Asian','Western / Cafe'];
export const moodLabels: Record<Mood,string>={anything:'Anything',healthy:'Healthy',local_asian:'Local / Asian',western_cafe:'Western / Cafe'};
const requiredTag: Record<Exclude<Mood,'anything'>,MoodTag>={healthy:'Healthy',local_asian:'Local / Asian',western_cafe:'Western / Cafe'};
export function isMood(value: unknown): value is Mood {return typeof value==='string' && moodValues.includes(value as Mood);}
export function eligibleForMood(pool: Restaurant[],mood: Mood,distance?: DistanceTier,price: PriceSelection='any') {
 if(!isMood(mood)||!isPriceSelection(price))return [];
 return eligible(pool,[],distance).filter(r=>matchesPriceSelection(r,price) && (mood==='anything'||(
  r.verifiedForV2 && !!r.lastVerifiedAt && Array.isArray(r.moodTags) && r.moodTags.includes(requiredTag[mood])
 )));
}
export const minimumMoodShortlistSize=3;
export function availableMoods(pool: Restaurant[],distance: DistanceTier,price: PriceSelection='any'): Mood[] {
 return moodValues.filter(m=>m==='anything'||eligibleForMood(pool,m,distance,price).length>=minimumMoodShortlistSize);
}
export function changeDistance(preferences: MoodPreferences,distance: DistanceTier,pool: Restaurant[]): MoodPreferences {
 const price=preferences.price??'any';
 return {...preferences,distance,mood:availableMoods(pool,distance,price).includes(preferences.mood)?preferences.mood:'anything'};
}
export function changePrice(preferences: MoodPreferences,price: PriceSelection,pool: Restaurant[]): MoodPreferences {
 return {...preferences,price,mood:availableMoods(pool,preferences.distance,price).includes(preferences.mood)?preferences.mood:'anything'};
}
export function pickForMood(pool: Restaurant[],mood: Mood,distance: DistanceTier,previous: string[]=[],rng=Math.random,price: PriceSelection='any') {
 return pickOne(eligibleForMood(pool,mood,distance,price),[],previous,rng,distance);
}
export function recommendForMood(pool: Restaurant[],mood: Mood,distance: DistanceTier,previous: string[]=[],rng=Math.random,price: PriceSelection='any') {
 return recommendThree(eligibleForMood(pool,mood,distance,price),[],previous,rng,distance);
}
