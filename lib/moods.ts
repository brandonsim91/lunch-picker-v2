import type {DistanceTier,Mood,MoodPreferences,MoodTag,Restaurant} from './types.ts';
import {eligible,pickOne,recommendThree} from './recommend.ts';

export const moodValues: Mood[]=['anything','healthy','local_asian','western_cafe'];
export const moodTags: MoodTag[]=['Healthy','Local / Asian','Western / Cafe'];
export const moodLabels: Record<Mood,string>={anything:'Anything',healthy:'Healthy',local_asian:'Local / Asian',western_cafe:'Western / Cafe'};
const requiredTag: Record<Exclude<Mood,'anything'>,MoodTag>={healthy:'Healthy',local_asian:'Local / Asian',western_cafe:'Western / Cafe'};
export function isMood(value: unknown): value is Mood {
 return typeof value==='string' && moodValues.includes(value as Mood);
}
export function eligibleForMood(pool: Restaurant[],mood: Mood,radius: DistanceTier='far') {
 if(!isMood(mood))return [];
 return eligible(pool,[],radius).filter(r=>mood==='anything'||(
  r.verifiedForV2 && !!r.lastVerifiedAt && Array.isArray(r.moodTags) && r.moodTags.includes(requiredTag[mood])
 ));
}
export function availableMoods(pool: Restaurant[],radius: DistanceTier): Mood[] {
 return moodValues.filter(m=>m==='anything'||eligibleForMood(pool,m,radius).length>0);
}
export function changeDistance(preferences: MoodPreferences,distance: DistanceTier,pool: Restaurant[]): MoodPreferences {
 return {distance,mood:availableMoods(pool,distance).includes(preferences.mood)?preferences.mood:'anything'};
}
export function pickForMood(pool: Restaurant[],mood: Mood,radius: DistanceTier,previous: string[]=[],rng=Math.random) {
 return pickOne(eligibleForMood(pool,mood,radius),[],previous,rng,radius);
}
export function recommendForMood(pool: Restaurant[],mood: Mood,radius: DistanceTier,previous: string[]=[],rng=Math.random) {
 return recommendThree(eligibleForMood(pool,mood,radius),[],previous,rng,radius);
}
