import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileFunction} from 'node:vm';
import ts from 'typescript';
import type {PendingSubmission} from '../lib/submissions.ts';

test('Sheets auth normalizes escaped newlines, bounds auth and quotes the tab safely',async()=>{
 const source=await readFile(new URL('../lib/communitySubmissions.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const env={GOOGLE_SHEETS_SPREADSHEET_ID:'test-sheet',GOOGLE_SHEETS_CLIENT_EMAIL:'test@example.invalid',GOOGLE_SHEETS_PRIVATE_KEY:' test\\nkey ',GOOGLE_SHEETS_TAB_NAME:"Pilot's Submissions"};
 const authOptions:Array<any>=[];let requests=0;
 const exports:{persistCommunitySubmission?:(s:PendingSubmission)=>Promise<boolean>}={};
 const fetchMock=async(input:string,init:RequestInit)=>{
  requests++;
  const url=new URL(input);
  assert.equal(decodeURIComponent(url.pathname),"/v4/spreadsheets/test-sheet/values/'Pilot''s Submissions'!A:L:append");
  assert.equal(url.searchParams.get('valueInputOption'),'RAW');
  assert.equal(url.searchParams.get('insertDataOption'),'INSERT_ROWS');
  assert.equal(init.cache,'no-store');assert.ok(init.signal);
  assert.equal((init.headers as Record<string,string>).Authorization,'Bearer synthetic-token');
  assert.deepEqual(JSON.parse(String(init.body)).values,[['qa-id','2026-10-20T04:00:00.000Z','=QA','https://maps.app.goo.gl/test','','','No','Pending','','','','']]);
  return Response.json({updates:{updatedRows:1}});
 };
 class FakeGoogleAuth {
  constructor(options:unknown){authOptions.push(options);}
  async getClient(){return {getAccessToken:async()=>({token:'synthetic-token'})};}
 }
 compileFunction(compiled,['require','exports','process','fetch'])((name:string)=>{
  assert.equal(name,'google-auth-library');return {GoogleAuth:FakeGoogleAuth};
 },exports,{env},fetchMock);
 const submission:PendingSubmission={id:'qa-id',submittedAt:'2026-10-20T04:00:00.000Z',restaurantName:'=QA',mapUrl:'https://maps.app.goo.gl/test',displayCredit:false,status:'pending'};
 assert.equal(await exports.persistCommunitySubmission!(submission),true);
 assert.equal(authOptions[0].credentials.private_key,'test\nkey');
 assert.deepEqual(authOptions[0].clientOptions,{transporterOptions:{timeout:4000,retry:false}});
 assert.deepEqual(authOptions[0].scopes,['https://www.googleapis.com/auth/spreadsheets']);
 env.GOOGLE_SHEETS_PRIVATE_KEY='test\nkey';
 assert.equal(await exports.persistCommunitySubmission!(submission),true);
 assert.equal(authOptions[1].credentials.private_key,'test\nkey');assert.equal(requests,2);
});
