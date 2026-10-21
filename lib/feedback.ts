export const feedbackTags=['Tasty','Good value','Quick','Good for groups','Healthy option','Worth the walk','Too expensive','Too slow','Too far','Too crowded','Food disappointing'];
export const ratings=['yes','okay','skip'] as const;
export type Feedback={id:string;restaurantId:string;rating:typeof ratings[number];tags:string[];createdAt:string};
export function validFeedback(v: unknown, ids: string[]): v is Feedback {
  if(!v || typeof v!=='object')return false;
  const b=v as Feedback;
  return typeof b.id==='string' && /^[a-zA-Z0-9-]{8,80}$/.test(b.id) && ids.includes(b.restaurantId) && ratings.includes(b.rating) && Array.isArray(b.tags) && b.tags.length<=feedbackTags.length && b.tags.every(t=>feedbackTags.includes(t)) && typeof b.createdAt==='string' && Number.isFinite(Date.parse(b.createdAt));
}
