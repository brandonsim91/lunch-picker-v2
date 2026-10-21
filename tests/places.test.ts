import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileFunction} from 'node:vm';
import ts from 'typescript';

// Execute the real route with a small catalogue and mocked external services.
const source=await readFile(new URL('../app/api/places/route.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const route: {GET?: (request:Request)=>Promise<Response>}={};
compileFunction(compiled,['require','exports'])((name:string)=>{
 assert.equal(name,'../../../lib/restaurants');
 return {restaurants:[{id:'resolved',placeId:'ChIJverified'},{id:'preferred',placeId:'ChIJverified',preferredPhotoIndex:1},{id:'override',placeId:'ChIJverified',photoBusinessStatusOverride:'verified-operational'},{id:'unresolved',placeId:null}]};
},route);
const get=(id:string)=>route.GET!(new Request(`https://baplah.vercel.app/api/places?id=${id}`));

test('photo route preserves fallbacks and keeps the API key server-side',async t=>{
 const originalFetch=globalThis.fetch;const originalKey=process.env.GOOGLE_MAPS_API_KEY;
 process.env.GOOGLE_MAPS_API_KEY='test-only-key';
 try{
  let calls=0;
  globalThis.fetch=async()=>{calls++;throw new Error('Unexpected request');};
  assert.equal((await get('unknown')).status,404);
  assert.deepEqual(await (await get('unresolved')).json(),{image:null,attributions:[]});
  delete process.env.GOOGLE_MAPS_API_KEY;
  assert.deepEqual(await (await get('resolved')).json(),{image:null,attributions:[]});
  assert.equal(calls,0);
  process.env.GOOGLE_MAPS_API_KEY='test-only-key';
  await t.test('preferred photo index selects a later Google photo without changing other outlets',async()=>{
   let calls=0;
   globalThis.fetch=async()=>{calls++;return calls===1?Response.json({businessStatus:'OPERATIONAL',photos:[{name:'places/ChIJverified/photos/first'},{name:'places/ChIJverified/photos/second'}]}):calls===2?Response.json({photoUri:'https://lh3.googleusercontent.com/photo'}):new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/jpeg'}});};
   const response=await get('preferred');
   assert.equal(response.headers.get('X-Photo-State'),'ready');
   assert.ok((await response.json()).image);
  });
  await t.test('verified operational place returns photo bytes and attribution',async()=>{
   const requests:string[]=[];
   globalThis.fetch=async(input,init)=>{
    requests.push(String(input));
    if(requests.length<3)assert.equal((init?.headers as Record<string,string>)['X-Goog-Api-Key'],'test-only-key');
    else assert.equal(init?.headers,undefined);
    return requests.length===1?Response.json({businessStatus:'OPERATIONAL',photos:[{name:'places/ChIJverified/photos/photo',authorAttributions:[{displayName:'Photographer',uri:'https://example.com/author'}]}]}):requests.length===2?Response.json({photoUri:'https://lh3.googleusercontent.com/photo'}):new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/jpeg'}});
   };
   const response=await get('resolved');const body=await response.json();
   assert.equal(body.image,'data:image/jpeg;base64,AQID');
   assert.deepEqual(body.attributions,[{name:'Photographer',uri:'https://example.com/author'}]);
   assert.equal(JSON.stringify(body).includes('test-only-key'),false);
   assert.equal(response.headers.get('Cache-Control'),'no-store');
   assert.equal(response.headers.get('X-Photo-State'),'ready');
   assert.equal(JSON.stringify([...response.headers]).includes('test-only-key'),false);
   assert.equal(requests.length,3);
  });
  await t.test('explicit verified-operational override permits photo when Google businessStatus is stale',async()=>{
   let calls=0;
   globalThis.fetch=async()=>{calls++;return calls===1?Response.json({businessStatus:'CLOSED_TEMPORARILY',photos:[{name:'places/ChIJverified/photos/photo'}]}):calls===2?Response.json({photoUri:'https://lh3.googleusercontent.com/photo'}):new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/jpeg'}});};
   const response=await get('override');
   assert.equal(response.headers.get('X-Photo-State'),'ready');
   assert.ok((await response.json()).image);
  });
  await t.test('safe diagnostics distinguish missing photos from upstream failures',async()=>{
   for(const [details,state] of [[{businessStatus:'OPERATIONAL'},'no-photo'],[{businessStatus:'CLOSED_TEMPORARILY'},'not-operational']] as const){
    globalThis.fetch=async()=>Response.json(details);
    const response=await get('resolved');
    assert.equal(response.headers.get('X-Photo-State'),state);
    assert.deepEqual(await response.json(),{image:null,attributions:[]});
   }
   globalThis.fetch=async()=>new Response('sensitive upstream error',{status:403});
   const response=await get('resolved');
   assert.equal(response.headers.get('X-Photo-State'),'details-unavailable');
   assert.equal((await response.text()).includes('sensitive upstream error'),false);
  });
  await t.test('closed, missing-photo, mismatched-photo and upstream failures use fallback',async()=>{
   for(const details of [{businessStatus:'CLOSED_PERMANENTLY',photos:[{name:'places/ChIJverified/photos/photo'}]},{businessStatus:'OPERATIONAL'},{businessStatus:'OPERATIONAL',photos:[{name:'places/another/photos/photo'}]}]){
    let requests=0;globalThis.fetch=async()=>{requests++;return Response.json(details);};
    assert.deepEqual(await (await get('resolved')).json(),{image:null,attributions:[]});assert.equal(requests,1);
   }
   for(const failure of [async()=>new Response('',{status:403}),async()=>{throw new Error('network');}]){
    globalThis.fetch=failure;
    assert.deepEqual(await (await get('resolved')).json(),{image:null,attributions:[]});
   }
  });
  await t.test('rejects non-Google, lookalike and non-HTTPS photo hosts',async()=>{
   for(const photoUri of ['http://lh3.googleusercontent.com/photo','https://example.com/photo','https://googleusercontent.com.evil.example/photo','https://evilgoogleusercontent.com/photo']){
    let calls=0;
    globalThis.fetch=async()=>{calls++;return calls===1?Response.json({businessStatus:'OPERATIONAL',photos:[{name:'places/ChIJverified/photos/photo'}]}):Response.json({photoUri});};
    assert.deepEqual(await (await get('resolved')).json(),{image:null,attributions:[]});
    assert.equal(calls,2);
   }
  });
  await t.test('media failures, non-image bytes, oversized files and redirects use fallback',async()=>{
   for(const failure of ['media','content-type','size','redirect']){
    let calls=0;
    globalThis.fetch=async(_input,init)=>{
     calls++;
     if(calls===1)return Response.json({businessStatus:'OPERATIONAL',photos:[{name:'places/ChIJverified/photos/photo'}]});
     if(calls===2)return failure==='media'?new Response('',{status:502}):Response.json({photoUri:'https://lh3.googleusercontent.com/photo'});
     assert.equal(init?.redirect,'error');
     assert.ok(init?.signal);
     if(failure==='redirect')throw new TypeError('redirect rejected');
     return new Response(new Uint8Array(failure==='size'?4000001:3),{headers:{'Content-Type':failure==='content-type'?'text/html':'image/jpeg'}});
    };
    assert.deepEqual(await (await get('resolved')).json(),{image:null,attributions:[]});
   }
  });
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.GOOGLE_MAPS_API_KEY;else process.env.GOOGLE_MAPS_API_KEY=originalKey;}
});
