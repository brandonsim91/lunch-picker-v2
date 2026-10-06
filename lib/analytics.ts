export const events=['home_opened','filter_selected','recommend_3_requested','just_pick_requested','restaurant_selected','reroll_requested','maps_opened','feedback_submitted'] as const;
export type EventName=typeof events[number];
export function track(event: EventName, properties: Record<string,unknown>={}) {
  if(typeof window==='undefined')return;
  const body=JSON.stringify({event,properties,at:new Date().toISOString()});
  void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
}
