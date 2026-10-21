// Print candidates for human review; never silently match the first search result.
import fs from 'node:fs';
const key=process.env.GOOGLE_MAPS_API_KEY;if(!key)throw new Error('Set GOOGLE_MAPS_API_KEY in .env.local');
const seed=JSON.parse(fs.readFileSync('data/restaurants.seed.json','utf8')).restaurants;
const overlay=JSON.parse(fs.readFileSync('data/restaurants.pilot.json','utf8'));
for(const row of overlay){const r={...seed.find(x=>x.id===row.id),...row};const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.businessStatus'},body:JSON.stringify({textQuery:`${r.name} ${r.address}`,regionCode:'SG'}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`Places search failed: ${response.status}`);const data=await response.json();console.log(JSON.stringify({restaurantId:r.id,candidates:data.places??[]},null,2));}
console.log('Review each address/business status and copy confirmed IDs into data/restaurants.pilot.json. Photo names are never stored.');
