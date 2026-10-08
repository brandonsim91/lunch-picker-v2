import {events} from '../../../lib/analytics';
import {persist} from '../../../lib/storage';
import {restaurants} from '../../../lib/restaurants';
import {filters} from '../../../lib/recommend';
export async function POST(req: Request) {
  try {
    if(req.headers.get('origin') && new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return new Response(null,{status:403});
    const raw=await req.text();if(raw.length>2048)return new Response(null,{status:413});
    const b=JSON.parse(raw);if(!events.includes(b.event))return new Response(null,{status:400});
    const p=b.properties??{};
    const entry={event:b.event,at:new Date().toISOString(),properties:{restaurantId:restaurants.some(r=>r.id===p.restaurantId)?p.restaurantId:undefined,filters:Array.isArray(p.filters)?p.filters.filter((f:unknown)=>filters.includes(f as never)):undefined,filter:filters.includes(p.filter)?p.filter:undefined,mode:['three','one'].includes(p.mode)?p.mode:undefined}};
    if(!await persist('events',entry)) console.info(JSON.stringify({baplahEvent:entry}));
    return new Response(null,{status:204});
  }catch{return new Response(null,{status:503});}
}
