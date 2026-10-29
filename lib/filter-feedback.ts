import type {Mood} from './types.ts';
import {moodLabels} from './moods.ts';
export function matchCountLabel(count:number):string {
 return `${count} ${count===1?'restaurant':'restaurants'} match`;
}
export function matchGuidance(count:number):string {
 if(count===0) return 'Try another distance tier, mood or price to find lunch options.';
 if(count<3) return 'Show me 3 needs at least 3 matches. You can still pick one.';
 return '';
}
export function moodResetFeedback(previous:Mood,next:Mood):string {
 return previous!==next ? `${moodLabels[previous]} has fewer than 3 matches with your new filters, so the mood changed to Anything.` : '';
}
