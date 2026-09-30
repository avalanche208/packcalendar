import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed,expandFeed} from '../site/events.js';
const wrap=body=>'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'+body.replaceAll('\n','\r\n')+'\r\nEND:VCALENDAR';
test('recurrence preserves exclusions, moved occurrences and cancellations',()=>{
const feed=parseFeed(wrap(`BEGIN:VEVENT
UID:weekly
DTSTART:20260901T180000Z
DTEND:20260901T190000Z
RRULE:FREQ=WEEKLY;COUNT=4
EXDATE:20260908T180000Z
SUMMARY:Meeting
END:VEVENT
BEGIN:VEVENT
UID:weekly
RECURRENCE-ID:20260915T180000Z
DTSTART:20260916T180000Z
DTEND:20260916T190000Z
SUMMARY:Moved
END:VEVENT
BEGIN:VEVENT
UID:weekly
RECURRENCE-ID:20260922T180000Z
DTSTART:20260922T180000Z
DTEND:20260922T190000Z
STATUS:CANCELLED
SUMMARY:Cancelled
END:VEVENT`));
const events=expandFeed(feed,new Date('2026-09-01'),new Date('2026-10-01'));
assert.equal(events.length,2);assert.equal(events[1].title,'Moved');assert.equal(events[1].start.toISOString(),'2026-09-16T18:00:00.000Z');
const moved=expandFeed(feed,new Date('2026-09-16'),new Date('2026-09-17'));
assert.equal(moved.length,1);assert.equal(moved[0].title,'Moved');
});
test('all-day dates and exclusive end dates stay intact',()=>{
const feed=parseFeed(wrap(`BEGIN:VEVENT
UID:camp
DTSTART;VALUE=DATE:20260918
DTEND;VALUE=DATE:20260921
SUMMARY:Camp
END:VEVENT`));
const events=expandFeed(feed,new Date(2026,8,20),new Date(2026,8,21));
assert.equal(events.length,1);assert.equal(events[0].allDay,true);assert.equal(events[0].start.getDate(),18);assert.equal(events[0].end.getDate(),21);
assert.equal(expandFeed(feed,new Date(2026,8,21),new Date(2026,8,22)).length,0);
});
