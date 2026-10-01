import test from 'node:test';
import assert from 'node:assert/strict';
import {appleSubscriptionURL} from '../site/subscriptions.js';
test('Apple subscription uses webcal instead of HTTPS import',()=>{
 assert.equal(appleSubscriptionURL('https://calendar.example.com/calendar.ics'),'webcal://calendar.example.com/calendar.ics');
 assert.equal(appleSubscriptionURL('http://192.168.1.10:8080/calendar.ics'),'webcal://192.168.1.10:8080/calendar.ics');
 assert.equal(appleSubscriptionURL('https://example.com/pack/calendar.ics?x=1#ignored'),'webcal://example.com/pack/calendar.ics?x=1');
 assert.throws(()=>appleSubscriptionURL('file:///calendar.ics'));
});
