// Read-only QA against the public application API. Photos stay in a temporary
// output directory for this review; no Google image URLs or bytes enter Git.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const output=process.argv[2];
if(!output||!path.isAbsolute(output))throw new Error('Pass an absolute temporary output directory');
const seed=JSON.parse(await fs.readFile(new URL('../data/restaurants.seed.json',import.meta.url),'utf8')).restaurants;
const pilot=JSON.parse(await fs.readFile(new URL('../data/restaurants.pilot.json',import.meta.url),'utf8'));
const restaurants=pilot.filter(r=>r.active).map(r=>({...seed.find(s=>(s.id||'chuan-tai-zi-mala-tang-arc')===r.id),...r}));
await fs.mkdir(output,{recursive:true});
let index=0;
const results=[];
async function worker(){
 while(index<restaurants.length){
  const r=restaurants[index++];
  const record={id:r.id,name:r.name,placeId:r.placeId??null,checkedAt:new Date().toISOString()};
  try{
   const response=await fetch(`https://baplah.vercel.app/api/places?id=${encodeURIComponent(r.id)}`,{signal:AbortSignal.timeout(30000)});
   record.httpStatus=response.status;
   if(!response.ok)throw new Error('HTTP failure');
   const data=await response.json();
   record.attributions=data.attributions;
   if(data.image){
    const match=/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(data.image);
    if(!match)throw new Error('Invalid image response');
    const bytes=Buffer.from(match[2],'base64');
    record.imageFile=`${r.id}.image`;
    record.mimeType=match[1];
    record.bytes=bytes.length;
    record.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
    await fs.writeFile(path.join(output,record.imageFile),bytes);
    record.photoState='REAL_PHOTO';
   }else record.photoState='FALLBACK';
  }catch{record.photoState='REQUEST_FAILED';}
  results.push(record);
  console.log(`${results.length}/${restaurants.length} ${record.id}: ${record.photoState}`);
 }
}
await Promise.all([worker(),worker(),worker()]);
results.sort((a,b)=>a.id.localeCompare(b.id));
await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({total:results.length,real:results.filter(r=>r.photoState==='REAL_PHOTO').length,fallback:results.filter(r=>r.photoState==='FALLBACK').length,failed:results.filter(r=>r.photoState==='REQUEST_FAILED').length}));
