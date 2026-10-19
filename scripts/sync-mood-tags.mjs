import fs from 'node:fs';
// Input is a connector-exported JSON array of {row,id,tags}. No API credentials.
const source=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const file='data/restaurants.pilot.json';
const original=JSON.parse(fs.readFileSync(file,'utf8'));
const seed=JSON.parse(fs.readFileSync('data/restaurants.seed.json','utf8')).restaurants;
const ids=new Set([...seed.map(r=>r.id||'chuan-tai-zi-mala-tang-arc'),...original.map(r=>r.id)]);
const approved=new Set(['Healthy','Local / Asian','Western / Cafe']);
const mapped=new Map(),unmatched=[];
for(const row of source){
 if(!row.id||!ids.has(row.id)){unmatched.push({row:row.row,id:row.id||null,name:row.name});continue;}
 if(mapped.has(row.id))throw new Error(`Duplicate Internal ID: ${row.id}`);
 if(!Array.isArray(row.tags)||!row.tags.length||row.tags.some(t=>!approved.has(t))||new Set(row.tags).size!==row.tags.length)throw new Error(`Invalid Mood Tags: ${row.id}`);
 mapped.set(row.id,row.tags);
}
const missing=[...ids].filter(id=>!mapped.has(id));
if(missing.length)throw new Error(`Unmapped production IDs: ${missing.join(', ')}`);
const updated=original.map(r=>({...r,moodTags:mapped.get(r.id)}));
for(const id of mapped.keys())if(!updated.some(r=>r.id===id))updated.push({id,moodTags:mapped.get(id)});
for(let i=0;i<original.length;i++){
 const {moodTags:oldTags,...before}=original[i];const {moodTags:newTags,...after}=updated[i];
 if(JSON.stringify(before)!==JSON.stringify(after))throw new Error('Unrelated metadata changed');
}
const counts=Object.fromEntries([...approved].map(tag=>[tag,[...mapped.values()].filter(tags=>tags.includes(tag)).length]));
console.log(JSON.stringify({mapped:mapped.size,unmatched,counts},null,2));
if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(updated,null,2)+'\n');
