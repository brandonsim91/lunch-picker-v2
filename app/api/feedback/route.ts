import {restaurants} from '../../../lib/restaurants';
import {validFeedback} from '../../../lib/feedback';
import {persist} from '../../../lib/storage';
export async function POST(req: Request) {
  try {
    if(req.headers.get('origin') && new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return Response.json({error:'Origin rejected'},{status:403});
    const raw=await req.text();if(raw.length>4096)return Response.json({error:'Too large'},{status:413});
    const body=JSON.parse(raw);if(!validFeedback(body,restaurants.map(r=>r.id)))return Response.json({error:'Invalid feedback'},{status:400});
    const persisted=await persist('feedback',body);
    return Response.json({persisted},{status:persisted?201:202});
  } catch {return Response.json({persisted:false,error:'Feedback could not be saved remotely'},{status:503});}
}
