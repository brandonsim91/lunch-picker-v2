import {test} from 'node:test';
import {GoogleAuth} from 'google-auth-library';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GET,POST} from '../app/api/submissions/route.ts';
import {submissionLimits, submissionsUnavailable, type PendingSubmission} from '../lib/submissions.ts';
import {eligible} from '../lib/recommend.ts';
import type {Restaurant} from '../lib/types.ts';
import {events} from '../lib/analytics.ts';
const valid = {restaurantName: 'OGOG 오곡', mapUrl: 'https://maps.app.goo.gl/example', reason: 'Fast lunch', contributorName: 'Chloe', displayCredit: false};
const request = (body: unknown, origin = 'https://baplah.vercel.app') => new Request('https://baplah.vercel.app/api/submissions', {method:'POST', headers:{origin,'Content-Type':'application/json'}, body:JSON.stringify(body)});

test('submission readiness endpoint is fail-closed and never exposes credentials',async()=>{
 const original={enabled:process.env.ENABLE_CONTRIBUTIONS,id:process.env.GOOGLE_SHEETS_SPREADSHEET_ID,email:process.env.GOOGLE_SHEETS_CLIENT_EMAIL,key:process.env.GOOGLE_SHEETS_PRIVATE_KEY};
 try{
  process.env.ENABLE_CONTRIBUTIONS='false';let response=await GET();assert.equal(response.status,404);assert.deepEqual(await response.json(),{enabled:false});
  process.env.ENABLE_CONTRIBUTIONS='true';delete process.env.GOOGLE_SHEETS_CLIENT_EMAIL;delete process.env.GOOGLE_SHEETS_PRIVATE_KEY;response=await GET();assert.equal(response.status,200);assert.deepEqual(await response.json(),{enabled:true,storageConfigured:false});
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID='test-sheet';process.env.GOOGLE_SHEETS_CLIENT_EMAIL='test@example.invalid';process.env.GOOGLE_SHEETS_PRIVATE_KEY='secret';response=await GET();assert.deepEqual(await response.json(),{enabled:true,storageConfigured:true});
 } finally {
  if(original.enabled===undefined)delete process.env.ENABLE_CONTRIBUTIONS;else process.env.ENABLE_CONTRIBUTIONS=original.enabled;
  if(original.id===undefined)delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;else process.env.GOOGLE_SHEETS_SPREADSHEET_ID=original.id;
  if(original.email===undefined)delete process.env.GOOGLE_SHEETS_CLIENT_EMAIL;else process.env.GOOGLE_SHEETS_CLIENT_EMAIL=original.email;
  if(original.key===undefined)delete process.env.GOOGLE_SHEETS_PRIVATE_KEY;else process.env.GOOGLE_SHEETS_PRIVATE_KEY=original.key;
 }
});

test('pending submission API', async t => {
 const originalFetch = globalThis.fetch;
 const envKeys=['GOOGLE_SHEETS_SPREADSHEET_ID','GOOGLE_SHEETS_CLIENT_EMAIL','GOOGLE_SHEETS_PRIVATE_KEY','GOOGLE_SHEETS_TAB_NAME','ENABLE_CONTRIBUTIONS'];
 const originalEnv=envKeys.map(key=>process.env[key]);
 const authMock=t.mock.method(GoogleAuth.prototype,'getClient',async()=>({getAccessToken:async()=>({token:'test-only'})}));
 let written: PendingSubmission[] = [];

 const seedBefore = await readFile(new URL('../data/restaurants.seed.json', import.meta.url), 'utf8');
 const pilotBefore = await readFile(new URL('../data/restaurants.pilot.json', import.meta.url), 'utf8');
 process.env.ENABLE_CONTRIBUTIONS='true';
 process.env.GOOGLE_SHEETS_SPREADSHEET_ID='test-sheet';
 process.env.GOOGLE_SHEETS_CLIENT_EMAIL='test@example.invalid';
 process.env.GOOGLE_SHEETS_PRIVATE_KEY='test-only';
 delete process.env.GOOGLE_SHEETS_TAB_NAME;
 const workingStorage: typeof fetch = async (_input, init) => {
  assert.ok(String(_input).startsWith('https://sheets.googleapis.com/v4/spreadsheets/test-sheet/values/'));
  const url=new URL(String(_input));
  assert.equal(url.searchParams.get('valueInputOption'),'RAW');
  assert.equal(url.searchParams.get('insertDataOption'),'INSERT_ROWS');
  assert.equal(decodeURIComponent(url.pathname),"/v4/spreadsheets/test-sheet/values/'Community Submissions'!A:L:append");
  assert.equal(init?.method,'POST');assert.ok(init?.signal);
  const values=JSON.parse(String(init?.body)).values;
  assert.equal(values.length,1);const row=values[0];
  assert.equal(row.length,12);assert.deepEqual(row.slice(8),['','','','']);
  assert.equal(row[7],'Pending');
  written.push({id:row[0],submittedAt:row[1],restaurantName:row[2],mapUrl:row[3],reason:row[4]||undefined,contributorName:row[5]||undefined,displayCredit:row[6]==='Yes',status:'pending'});
  return Response.json({updates:{updatedRows:1}});
 };
 try {
  globalThis.fetch = workingStorage;
  await t.test('feature flag disables contribution API without writing', async () => {
   const before=written.length;process.env.ENABLE_CONTRIBUTIONS='false';
   const response=await POST(request(valid));assert.equal(response.status,404);assert.deepEqual(await response.json(),{persisted:false,message:'Not found.'});assert.equal(written.length,before);
   process.env.ENABLE_CONTRIBUTIONS='true';
  });
  await t.test('valid submission persists pending with server UUID/time and defaults credit off', async () => {
   const response = await POST(request({restaurantName: ' OGOG 오곡 ', mapUrl:valid.mapUrl}));
   assert.equal(response.status,201); assert.deepEqual(await response.json(),{persisted:true});
   assert.equal(written[0].restaurantName,valid.restaurantName); assert.equal(written[0].status,'pending'); assert.equal(written[0].displayCredit,false);
   assert.match(written[0].id,/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
   assert.ok(Number.isFinite(Date.parse(written[0].submittedAt))); assert.equal(written[0].contributorName,undefined);
  });
  await t.test('accepts normal Maps, Singapore Maps and legacy/short share URLs', async () => {
   for (const mapUrl of ['https://www.google.com/maps/place/OGOG','https://maps.google.com/?q=OGOG','https://www.google.com.sg/maps/search/?api=1&query=OGOG','https://goo.gl/maps/example', valid.mapUrl]) assert.equal((await POST(request({...valid,mapUrl}))).status,201);
  });
  await t.test('A:L mapping preserves literal formula-like text and both credit choices', async()=>{
   const writes:unknown[][]=[];
   globalThis.fetch=async(input,init)=>{
    assert.equal(new URL(String(input)).searchParams.get('valueInputOption'),'RAW');
    const values=JSON.parse(String(init?.body)).values;assert.equal(values.length,1);
    writes.push(values[0]);return Response.json({updates:{updatedRows:1}});
   };
   for(const displayCredit of [false,true]){
    for(const prefix of ['=','+','-','@']){
     const value={...valid,restaurantName:`${prefix}QA place`,reason:`${prefix}SUM(1,2)`,contributorName:`${prefix}QA`,displayCredit};
     assert.equal((await POST(request(value))).status,201);
     const row=writes.at(-1)!;
     assert.equal(row.length,12);
     assert.deepEqual(row.slice(2),[value.restaurantName,value.mapUrl,value.reason,value.contributorName,displayCredit?'Yes':'No','Pending','','','','']);
    }
   }
   assert.equal(writes.length,8);globalThis.fetch=workingStorage;
  });
  for (const [name, patch] of [
   ['missing name',{restaurantName:undefined}], ['blank name',{restaurantName:'  '}], ['missing Maps URL',{mapUrl:undefined}], ['invalid URL',{mapUrl:'not a url'}], ['non-Google URL',{mapUrl:'https://example.com/maps'}], ['HTTP link',{mapUrl:'http://maps.google.com/maps'}], ['lookalike Google host',{mapUrl:'https://maps.app.goo.gl.evil.test/place'}], ['credentials in URL',{mapUrl:'https://person@maps.google.com/place'}], ['non-Maps Google link',{mapUrl:'https://www.google.com/search?q=lunch'}], ['unexpected approval fields',{status:'approved',active:true}], ['non-boolean credit',{displayCredit:'yes'}]
  ] as const) await t.test(`rejects ${name} without writing`, async () => {const before=written.length;assert.equal((await POST(request({...valid,...patch}))).status,400);assert.equal(written.length,before);});
  await t.test('rejects overly long values in every field', async () => {for(const [key,limit] of Object.entries(submissionLimits)) assert.equal((await POST(request({...valid,[key]:'x'.repeat(limit+1)}))).status,400);});
  await t.test('rejects malformed JSON and cross-origin submissions', async () => {
   assert.equal((await POST(new Request('https://baplah.vercel.app/api/submissions',{method:'POST',body:'{'}))).status,400);
   assert.equal((await POST(request(valid,'https://evil.test'))).status,403);
  });
  await t.test('missing shared storage returns unavailable, never success', async () => {
   for(const key of envKeys.slice(0,3)){
    const value=process.env[key];delete process.env[key];const before=written.length;
    const response=await POST(request(valid));assert.equal(response.status,503);assert.deepEqual(await response.json(),{persisted:false,message:submissionsUnavailable});
    assert.equal(written.length,before);process.env[key]=value;
   }
  });
  await t.test('auth and missing-token failures return generic 503 without a write',async()=>{
   const before=written.length;
   for(const implementation of [async()=>{throw new Error('private upstream details');},async()=>({getAccessToken:async()=>({token:null})})]){
    authMock.mock.mockImplementation(implementation);
    const response=await POST(request(valid));assert.equal(response.status,503);assert.deepEqual(await response.json(),{persisted:false,message:submissionsUnavailable});
   }
   assert.equal(written.length,before);
   authMock.mock.mockImplementation(async()=>({getAccessToken:async()=>({token:'test-only'})}));
  });
  await t.test('storage errors and invalid acknowledgements never return false success', async () => {
   const failures: Array<typeof fetch> = [async()=>{throw new Error('network');},async()=>new Response('error',{status:500}),async()=>Response.json({error:'failure'}),async()=>Response.json({updates:{updatedRows:0}}),async()=>Response.json({updates:{updatedRows:2}}),async()=>Response.json({}),async()=>new Response('not JSON')];
   for(const failure of failures){globalThis.fetch=failure;const response=await POST(request(valid));assert.equal(response.status,503);assert.equal((await response.json()).persisted,false);}
   globalThis.fetch=workingStorage;
  });
  await t.test('pending suggestions do not become restaurants or modify approved data', async () => {
   assert.deepEqual(eligible(written as unknown as Restaurant[],[]),[]);
   for(const entry of written){assert.equal(entry.status,'pending');assert.equal('active' in entry,false);assert.equal('verifiedForV2' in entry,false);assert.equal('placeId' in entry,false);}
   assert.equal(await readFile(new URL('../data/restaurants.seed.json', import.meta.url),'utf8'),seedBefore);
   assert.equal(await readFile(new URL('../data/restaurants.pilot.json', import.meta.url),'utf8'),pilotBefore);
  });
 } finally {
  globalThis.fetch=originalFetch;
  authMock.mock.restore();
  envKeys.forEach((key,i)=>{if(originalEnv[i]===undefined)delete process.env[key];else process.env[key]=originalEnv[i];});
 }
});
test('contribution analytics are allowlisted',()=>{assert.ok(events.includes('contribution_started'));assert.ok(events.includes('contribution_submitted'));});
