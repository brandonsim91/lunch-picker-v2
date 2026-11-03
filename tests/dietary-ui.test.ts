import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileFunction} from 'node:vm';
import ts from 'typescript';
import * as moods from '../lib/moods.ts';
import * as dietary from '../lib/dietary.ts';
import * as distance from '../lib/distance.ts';
import * as price from '../lib/price.ts';
import * as feedback from '../lib/filter-feedback.ts';
import {feedbackTags} from '../lib/feedback.ts';
import type {DietaryVerification,Restaurant} from '../lib/types.ts';
type Element={type:unknown;props:Record<string,any>};
const data=JSON.parse(readFileSync(new URL('../data/dietary.staging.v1.json',import.meta.url),'utf8'));
const base=data.records.find((r:DietaryVerification)=>r.restaurantId==='the-soup-spoon-arc') as DietaryVerification;
function fixture(id:string,verified=true):Restaurant{
 return {id,name:id,address:'test address',area:'MBC',cuisine:['Test'],mapUrl:'https://www.google.com/maps/search/?api=1&query=test',walkingMinutes:3,distanceTier:'near',priceBand:'$$',active:true,quickLunch:null,healthyOption:null,verifiedForV2:true,lastVerifiedAt:'2026-11-03',tags:[],moodTags:['Healthy','Local / Asian'],reason:'Test',sourceUrl:'https://www.gyg.com.sg',dietaryVerification:verified?{...base,restaurantId:id,outletName:id,outletAddress:'test address',halal:{...base.halal!,verifiedAt:new Date().toISOString().slice(0,10)},vegetarian:{...base.vegetarian!,verifiedAt:new Date().toISOString().slice(0,10)}}:undefined};
}
function nodes(node:any):Element[]{if(Array.isArray(node))return node.flatMap(nodes);if(!node||typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
function text(node:any):string{if(Array.isArray(node))return node.map(text).join('');if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return text(node.props?.children);}
function harness(pool:Restaurant[],enabled=true){
 const source=readFileSync(new URL('../components/LunchApp.tsx',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const states:any[]=[];let index=0;const exports:{default?:any}={};const jsx=(type:unknown,props:Record<string,unknown>)=>({type,props});
 compileFunction(compiled,['require','exports'])( (name:string)=>{
  if(name==='react')return {useState:(initial:any)=>{const i=index++;if(!(i in states))states[i]=initial;return [states[i],(value:any)=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useEffect:()=>{},useRef:()=>({current:null})};
  if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
  const modules:Record<string,unknown>={'../lib/moods':moods,'../lib/dietary':dietary,'../lib/distance':distance,'../lib/price':price,'../lib/filter-feedback':feedback,'../lib/feedback':{feedbackTags},'../lib/analytics':{track:()=>{}},'./PlacePhoto':{default:()=>null},'./ContributionForm':{default:()=>null},'./DietaryDetails':{default:()=>null}};
  if(name in modules)return modules[name];throw new Error(name);
 },exports);
 const render=()=>{index=0;return exports.default({restaurants:pool,priceFiltersEnabled:true,dietaryFiltersEnabled:enabled});};
 const find=(type:string,label:string)=>nodes(render()).find(e=>e.type===type&&text(e)===label)!;
 const click=(label:string)=>{const b=find('button',label);assert.ok(b,label);assert.ok(!b.props.disabled,label+' disabled');b.props.onClick();};
 const input=(id:string,value:number)=>nodes(render()).find(e=>e.props.id===id)!.props.onChange({currentTarget:{value:String(value)}});
 return {render,find,click,input};
}
for(const size of [0,1,2,3,5])test(`actual LunchApp handlers: ${size} matches never bypass dietary requirements`,()=>{
 const h=harness([...Array.from({length:size},(_,i)=>fixture('verified'+i)),fixture('unsafe',false)]);
 assert.equal(h.find('button','Halal-certified').props['aria-pressed'],false);assert.equal(h.find('button','Vegetarian options').props['aria-pressed'],false);
 h.click('Halal-certified');h.click('Vegetarian options');
 assert.match(text(h.render()),new RegExp(`${size} restaurants? match`));
 assert.equal(h.find('button','Show me 3').props.disabled,size<3);assert.equal(h.find('button','Just pick something').props.disabled,size===0);
 if(!size){assert.match(text(h.render()),/No verified results/);return;}
 h.click('Just pick something');assert.ok(nodes(h.render()).some(e=>e.type==='h2'&&text(e).startsWith('verified')));
 h.click('Pick another');assert.ok(nodes(h.render()).some(e=>e.type==='h2'&&text(e).startsWith('verified')));
 h.click('Back to lunch');assert.equal(h.find('button','Halal-certified ✓').props['aria-pressed'],true);assert.equal(h.find('button','Vegetarian options ✓').props['aria-pressed'],true);
 if(size>=3){h.click('Show me 3');assert.equal(nodes(h.render()).filter(e=>e.type==='article').length,3);assert.ok(!text(h.render()).includes('unsafe'));h.click('Reroll 3');assert.equal(nodes(h.render()).filter(e=>e.type==='article').length,3);assert.ok(!text(h.render()).includes('unsafe'));}
});
test('actual controls preserve diet and selected mood through price and exclusive distance changes',()=>{
 const h=harness([fixture('verified'),fixture('unsafe',false)]);h.click('Halal-certified');h.click('Vegetarian options');h.click('Healthy');h.input('distance-range',2);h.input('price-range',1);
 assert.equal(h.find('button','Halal-certified ✓').props['aria-pressed'],true);assert.equal(h.find('button','Vegetarian options ✓').props['aria-pressed'],true);assert.equal(h.find('button','Healthy ✓').props['aria-pressed'],true);
 assert.match(text(h.render()),/0 restaurants match/);assert.ok(!text(h.render()).includes('mood changed to Anything'));
 h.input('distance-range',0);h.input('price-range',2);assert.match(text(h.render()),/1 restaurant match/);
});
test('dietary controls absent when preview feature gate is off',()=>{const h=harness([fixture('verified')],false);assert.equal(h.find('button','Halal-certified'),undefined);assert.equal(h.find('button','Vegetarian options'),undefined);});
