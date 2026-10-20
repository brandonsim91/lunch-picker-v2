import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileFunction} from 'node:vm';
import ts from 'typescript';
import * as validation from '../lib/submissions.ts';

// Execute the actual component handler with hook/JSX adapters and controlled
// transport. This tests simultaneous submissions, acknowledgements and analytics
// without a browser or production credentials.
type Element={type:unknown;props:Record<string,any>};
function find(node:Element,type:unknown):Element|undefined{
 if(node?.type===type)return node;
 const children=node?.props?.children;
 for(const child of Array.isArray(children)?children:[children]){
  if(child&&typeof child==='object'){const found=find(child,type);if(found)return found;}
 }
}
test('form prevents in-flight duplicates and only acknowledges confirmed persistence',async()=>{
 const source=await readFile(new URL('../components/ContributionForm.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const states:unknown[]=[];const refs:Array<{current:unknown}>=[];let stateIndex=0,refIndex=0;
 const events:string[]=[];let calls=0;let response:Promise<Response>;
 const fields=new Map<string,string>([['restaurantName','QA place'],['mapUrl','https://maps.app.goo.gl/qa'],['reason','QA reason'],['contributorName','QA Test']]);
 const exports:{default?:(props:{onBack:()=>void})=>Element}={};
 const jsx=(type:unknown,props:Record<string,unknown>)=>({type,props});
 compileFunction(compiled,['require','exports','fetch','FormData'])((name:string)=>{
  if(name==='react')return {
   useState:(initial:unknown)=>{const index=stateIndex++;if(!(index in states))states[index]=initial;return [states[index],(value:unknown)=>{states[index]=value;}];},
   useRef:(initial:unknown)=>{const index=refIndex++;return refs[index]??(refs[index]={current:initial});},useEffect:()=>{}
  };
  if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
  if(name==='../lib/analytics')return {track:(event:string)=>events.push(event)};
  if(name==='../lib/submissions')return validation;
  throw new Error(`Unexpected import ${name}`);
 },exports,async()=>{calls++;return response;},class {get(key:string){return fields.get(key)??null;}});
 const render=()=>{stateIndex=0;refIndex=0;return exports.default!({onBack(){}});};
 const submit=()=>find(render(),'form')!.props.onSubmit({preventDefault(){},currentTarget:{}});
 let resolve!:(value:Response)=>void;
 response=new Promise(r=>{resolve=r;});
 const first=submit();const duplicate=submit();await duplicate;
 assert.equal(calls,1);assert.equal(find(render(),'button')!.props.disabled,true);assert.deepEqual(events,[]);
 resolve(Response.json({persisted:false,message:validation.submissionsUnavailable},{status:503}));await first;
 assert.ok(find(render(),'form'));assert.equal(find(render(),'button')!.props.disabled,false);assert.deepEqual(events,[]);
 assert.deepEqual([...fields.values()],['QA place','https://maps.app.goo.gl/qa','QA reason','QA Test']);
 assert.match(JSON.stringify(render()),/Submissions are temporarily unavailable/);
 // A 2xx response without a positive persistence acknowledgement is not success.
 response=Promise.resolve(Response.json({persisted:false}));await submit();assert.deepEqual(events,[]);assert.ok(find(render(),'form'));
 fields.set('mapUrl','https://example.com/not-maps');const before=calls;await submit();assert.equal(calls,before);assert.deepEqual(events,[]);
 fields.set('mapUrl','https://maps.app.goo.gl/qa');
 response=Promise.resolve(Response.json({persisted:true},{status:201}));await submit();
 assert.deepEqual(events,['contribution_submitted']);assert.equal(find(render(),'form'),undefined);
 assert.equal(find(render(),'h1')!.props.children,'Thanks — we’ll check it out.');
});
