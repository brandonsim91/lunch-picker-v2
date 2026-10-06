import {restaurants} from '../../../lib/restaurants';
export const dynamic='force-dynamic';
export async function GET(req: Request) {
  const restaurant=restaurants.find(r=>r.id===new URL(req.url).searchParams.get('id'));
  if(!restaurant)return Response.json({error:'Unknown restaurant'},{status:404});
  const key=process.env.GOOGLE_MAPS_API_KEY;
  const empty=()=>Response.json({image:null,attributions:[]},{headers:{'Cache-Control':'no-store'}});
  if(!key || !restaurant.placeId)return empty();
  try {
    const details=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(restaurant.placeId)}`,{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'photos,businessStatus'},cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!details.ok)return empty();
    const data=await details.json();const photo=data.photos?.[0];
    if(data.businessStatus!=='OPERATIONAL' || !photo?.name || !photo.name.startsWith(`places/${restaurant.placeId}/photos/`))return empty();
    const media=await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,{headers:{'X-Goog-Api-Key':key},cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!media.ok)return empty();
    const {photoUri}=await media.json();const uri=new URL(photoUri);
    if(uri.protocol!=='https:' || !(uri.hostname.endsWith('.googleusercontent.com')||uri.hostname==='googleusercontent.com'))return empty();
    const file=await fetch(uri,{cache:'no-store',signal:AbortSignal.timeout(6000)});
    const type=file.headers.get('content-type')??'';if(!file.ok||!type.startsWith('image/'))return empty();
    const bytes=await file.arrayBuffer();if(bytes.byteLength>4000000)return empty();
    return Response.json({image:`data:${type};base64,${Buffer.from(bytes).toString('base64')}`,attributions:(photo.authorAttributions??[]).map((a:{displayName?:string;uri?:string})=>({name:a.displayName??'Photo contributor',uri:a.uri??null}))},{headers:{'Cache-Control':'no-store'}});
  }catch{return empty();}
}
