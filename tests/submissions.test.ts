import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {POST} from '../app/api/submissions/route.ts';
import {submissionLimits, submissionsUnavailable, type PendingSubmission} from '../lib/submissions.ts';
import {eligible} from '../lib/recommend.ts';
import type {Restaurant} from '../lib/types.ts';
import {events} from '../lib/analytics.ts';
const valid = {restaurantName: 'OGOG 오곡', mapUrl: 'https://maps.app.goo.gl/example', reason: 'Fast lunch', contributorName: 'Chloe', displayCredit: false};
const request = (body: unknown, origin = 'https://baplah.vercel.app') => new Request('https://baplah.vercel.app/api/submissions', {method:'POST', headers:{origin,'Content-Type':'application/json'}, body:JSON.stringify(body)});

test('pending submission API', async t => {
 const originalFetch = globalThis.fetch;
 const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
 const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
 let written: PendingSubmission[] = [];
 let command: unknown[] = [];
 const seedBefore = await readFile(new URL('../data/restaurants.seed.json', import.meta.url), 'utf8');
 const pilotBefore = await readFile(new URL('../data/restaurants.pilot.json', import.meta.url), 'utf8');
 process.env.UPSTASH_REDIS_REST_URL = 'https://test-storage.invalid';
 process.env.UPSTASH_REDIS_REST_TOKEN = 'test-only';
 const workingStorage: typeof fetch = async (_input, init) => {
  command = JSON.parse(String(init?.body));
  assert.equal(command[0], 'LPUSH'); assert.equal(command[1], 'baplah:submissions');
  written.push(JSON.parse(String(command[2])));
  return Response.json({result: written.length});
 };
 try {
  globalThis.fetch = workingStorage;
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
  for (const [name, patch] of [
   ['missing name',{restaurantName:undefined}], ['blank name',{restaurantName:'  '}], ['missing Maps URL',{mapUrl:undefined}], ['invalid URL',{mapUrl:'not a url'}], ['non-Google URL',{mapUrl:'https://example.com/maps'}], ['HTTP link',{mapUrl:'http://maps.google.com/maps'}], ['lookalike Google host',{mapUrl:'https://maps.app.goo.gl.evil.test/place'}], ['credentials in URL',{mapUrl:'https://person@maps.google.com/place'}], ['non-Maps Google link',{mapUrl:'https://www.google.com/search?q=lunch'}], ['unexpected approval fields',{status:'approved',active:true}], ['non-boolean credit',{displayCredit:'yes'}]
  ] as const) await t.test(`rejects ${name} without writing`, async () => {const before=written.length;assert.equal((await POST(request({...valid,...patch}))).status,400);assert.equal(written.length,before);});
  await t.test('rejects overly long values in every field', async () => {for(const [key,limit] of Object.entries(submissionLimits)) assert.equal((await POST(request({...valid,[key]:'x'.repeat(limit+1)}))).status,400);});
  await t.test('rejects malformed JSON and cross-origin submissions', async () => {
   assert.equal((await POST(new Request('https://baplah.vercel.app/api/submissions',{method:'POST',body:'{'}))).status,400);
   assert.equal((await POST(request(valid,'https://evil.test'))).status,403);
  });
  await t.test('missing shared storage returns unavailable, never success', async () => {
   delete process.env.UPSTASH_REDIS_REST_URL;
   const response=await POST(request(valid));assert.equal(response.status,503);assert.deepEqual(await response.json(),{persisted:false,message:submissionsUnavailable});
   process.env.UPSTASH_REDIS_REST_URL='https://test-storage.invalid';
  });
  await t.test('storage errors and invalid acknowledgements never return false success', async () => {
   const failures: Array<typeof fetch> = [async()=>{throw new Error('network');},async()=>new Response('error',{status:500}),async()=>Response.json({error:'failure'}),async()=>Response.json({result:0}),async()=>Response.json({}),async()=>new Response('not JSON')];
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
  if(originalUrl===undefined)delete process.env.UPSTASH_REDIS_REST_URL;else process.env.UPSTASH_REDIS_REST_URL=originalUrl;
  if(originalToken===undefined)delete process.env.UPSTASH_REDIS_REST_TOKEN;else process.env.UPSTASH_REDIS_REST_TOKEN=originalToken;
 }
});
test('contribution analytics are allowlisted',()=>{assert.ok(events.includes('contribution_started'));assert.ok(events.includes('contribution_submitted'));});
