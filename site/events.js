import ICAL from './ical.min.js';
export function parseFeed(text){
 const root=new ICAL.Component(ICAL.parse(text));
 if(root.name!=='vcalendar')throw new Error('Invalid calendar feed');
 ICAL.TimezoneService.reset();
 for(const component of root.getAllSubcomponents('vtimezone')){
  const tzid=component.getFirstPropertyValue('tzid');
  ICAL.TimezoneService.register(tzid,new ICAL.Timezone({component,tzid}));
 }
 const components=root.getAllSubcomponents('vevent');
 const masters=components.filter(c=>!c.hasProperty('recurrence-id')).map(c=>new ICAL.Event(c));
 const overrides=components.filter(c=>c.hasProperty('recurrence-id')).map(c=>new ICAL.Event(c));
 for(const event of masters)for(const exception of overrides)if(event.uid===exception.uid)event.relateException(exception);
 return {masters,overrides};
}
function date(time){return time.isDate?new Date(time.year,time.month-1,time.day):time.toJSDate();}
export function expandFeed(feed,from,to){
 const items=new Map();
 function add(event,start,end,key){
  if(event.component.getFirstPropertyValue('status')==='CANCELLED')return;
  const a=date(start),b=date(end);
  if(a>=to || (b>a?b<=from:a<from))return;
  items.set(key,{id:key,title:event.summary||'Pack event',description:event.description||'',location:event.location||'',start:a,end:b,allDay:start.isDate});
 }
 for(const event of feed.masters){
  if(event.isRecurring()){
   const iterator=event.iterator();let count=0,next;
   while((next=iterator.next())){
    if(++count>50000)throw new Error('A recurring event exceeds the display limit. The subscription feed is still available.');
    if(date(next)>=to)break;
    const occurrence=event.getOccurrenceDetails(next);
    add(occurrence.item,occurrence.startDate,occurrence.endDate,event.uid+'|'+next.toString());
   }
  }else add(event,event.startDate,event.endDate,event.uid);
 }
 // Include moved exceptions even when their original occurrence lies outside the window.
 for(const event of feed.overrides)add(event,event.startDate,event.endDate,event.uid+'|'+event.recurrenceId.toString());
 return [...items.values()].sort((a,b)=>a.start-b.start||a.title.localeCompare(b.title));
}
