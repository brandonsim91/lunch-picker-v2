import {test} from 'node:test';import assert from 'node:assert/strict';import {validFeedback} from '../lib/feedback.ts';
const b={id:'12345678-abcd',restaurantId:'a',rating:'yes',tags:['Tasty'],createdAt:'2026-10-06T13:00:00Z'};
test('accepts valid quick feedback',()=>assert.equal(validFeedback(b,['a']),true));
test('rejects unknown restaurant, rating, tags and bad dates',()=>{for(const patch of [{restaurantId:'b'},{rating:'great'},{tags:['private note']},{createdAt:'bad'},{id:'x'}])assert.equal(validFeedback({...b,...patch},['a']),false);});
