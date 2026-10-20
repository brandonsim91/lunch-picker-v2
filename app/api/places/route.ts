import {restaurants} from '../../../lib/restaurants';
export const dynamic='force-dynamic';
export async function GET(req: Request) {
  const restaurant=restaurants.find(r=>r.id===new URL(req.url).searchParams.get('id'));
  if(!restaurant)return Response.json({error:'Unknown restaurant'},{status:404});
  const key=process.env.GOOGLE_MAPS_API_KEY;
  // Categorical diagnostics make intentional fallbacks distinguishable from
  // upstream failures without exposing credentials or raw Google API errors.
  const empty=(state:string)=>Response.json({image:null,attributions:[]},{headers:{'Cache-Control':'no-store','X-Photo-State':state}});
  if(!restaurant.placeId)return empty('missing-place-id');
  if(!key)return empty('not-configured');
  try {
    const details=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(restaurant.placeId)}`,{headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'photos,businessStatus'},cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!details.ok)return empty('details-unavailable');
    const data=await details.json();const photo=data.photos?.[0];
    if(data.businessStatus!=='OPERATIONAL')return empty('not-operational');
    if(!photo?.name)return empty('no-photo');
    if(!photo.name.startsWith(`places/${restaurant.placeId}/photos/`))return empty('invalid-photo-resource');
    const media=await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&skipHttpRedirect=true`,{headers:{'X-Goog-Api-Key':key},cache:'no-store',signal:AbortSignal.timeout(6000)});
    if(!media.ok)return empty('media-unavailable');
    const {photoUri}=await media.json();const uri=new URL(photoUri);
    if(uri.protocol!=='https:' || !(uri.hostname.endsWith('.googleusercontent.com')||uri.hostname==='googleusercontent.com'))return empty('invalid-image-host');
    // Do not follow an image redirect to an unvalidated host.
    const file=await fetch(uri,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(6000)});
    if(!file.ok)return empty('image-unavailable');
    const type=file.headers.get('content-type')??'';if(!type.startsWith('image/'))return empty('invalid-image-type');
    const bytes=await file.arrayBuffer();if(bytes.byteLength>4000000)return empty('image-too-large');
    return Response.json({image:`data:${type};base64,${Buffer.from(bytes).toString('base64')}`,attributions:(photo.authorAttributions??[]).map((a:{displayName?:string;uri?:string})=>({name:a.displayName??'Photo contributor',uri:a.uri??null}))},{headers:{'Cache-Control':'no-store','X-Photo-State':'ready'}});
  }catch{return empty('request-failed');}
}
