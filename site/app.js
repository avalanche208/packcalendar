import {parseFeed,expandFeed} from './events.js';
const $=id=>document.getElementById(id);
const zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Chicago';
const feedURL=new URL('calendar.ics',location.href);feedURL.search='';feedURL.hash='';
$('feed').value=feedURL.href;
const apple=new URL(feedURL);apple.protocol='webcal:';$('apple').href=apple.href;
$('timezone').textContent=`Times shown in ${zone.replaceAll('_',' ')}`;
let feed=null,month=new Date(),mode=matchMedia('(max-width:700px)').matches?'AGENDA':'MONTH',busy=false;
month=new Date(month.getFullYear(),month.getMonth(),1);
const dayKey=d=>`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
function element(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
function timeLabel(e){return e.allDay?'All day':e.start.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});}
function details(e){$('event-title').textContent=e.title;let end=new Date(e.end);if(e.allDay&&end>e.start)end.setDate(end.getDate()-1);$('event-time').textContent=e.start.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'})+' · '+(e.allDay?'All day':timeLabel(e))+(end>e.start?' – '+end.toLocaleString([],e.allDay?{month:'long',day:'numeric',year:'numeric'}:{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'');$('event-location').textContent=e.location;$('event-description').textContent=e.description;$('event-dialog').showModal();}
function eventButton(e){const button=element('button','event-button');button.append(element('span','event-hour',timeLabel(e)),element('span','event-name',e.title));button.addEventListener('click',()=>details(e));return button;}
function overlaps(e,day){const end=new Date(day);end.setDate(end.getDate()+1);return e.start<end&&(e.end>e.start?e.end>day:dayKey(e.start)===dayKey(day));}
function render(){
 $('period').textContent=month.toLocaleDateString([],{month:'long',year:'numeric'});
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
 if(!feed)return;
 const first=new Date(month),last=new Date(month.getFullYear(),month.getMonth()+1,1);
 if(mode==='MONTH'){first.setDate(first.getDate()-first.getDay());last.setDate(last.getDate()+(7-last.getDay())%7);}
 const content=$('calendar-content');content.replaceChildren();
 try{
 const events=expandFeed(feed,first,last);
 if(mode==='MONTH'){
  const grid=element('div','month-grid');
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>grid.append(element('div','weekday',d)));
  for(let d=new Date(first);d<last;d.setDate(d.getDate()+1)){
   const cell=element('div','day-cell'+(d.getMonth()!==month.getMonth()?' outside':'')+(dayKey(d)===dayKey(new Date())?' current':''));
   cell.append(element('div','day-number',d.getDate()));
   const list=events.filter(e=>overlaps(e,d));list.forEach(e=>cell.append(eventButton(e)));grid.append(cell);
  }
  content.append(grid);
 }else{
  if(!events.length)content.append(element('p','empty','No events scheduled this month.'));
  for(let d=new Date(first);d<last;d.setDate(d.getDate()+1)){
   const list=events.filter(e=>overlaps(e,d));if(!list.length)continue;
   const row=element('section','agenda-day');row.append(element('h3','',d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})));
   const entries=element('div','agenda-events');list.forEach(e=>entries.append(eventButton(e)));row.append(entries);content.append(row);
  }
 }
 }catch(error){$('load-status').textContent='Unable to display events: '+error.message;}
}
async function load(){if(busy)return;busy=true;$('refresh').disabled=true;$('load-status').textContent='Updating events…';try{const response=await fetch(feedURL,{cache:'no-store'});if(!response.ok)throw new Error('Feed unavailable');const text=await response.text();const next=parseFeed(text);feed=next;$('load-status').textContent='';const stale=response.headers.get('X-Calendar-Cache')==='STALE';$('updated').textContent=stale?'Showing cached events; source is temporarily unavailable.':`Checked ${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;render();}catch{ $('load-status').textContent=feed?'Could not refresh. Previously loaded events are still shown.':'Events are temporarily unavailable. Please try Refresh shortly.';}finally{busy=false;$('refresh').disabled=false;}}
$('previous').addEventListener('click',()=>{month.setMonth(month.getMonth()-1);render();});$('next').addEventListener('click',()=>{month.setMonth(month.getMonth()+1);render();});$('today').addEventListener('click',()=>{month=new Date(new Date().getFullYear(),new Date().getMonth(),1);render();});$('refresh').addEventListener('click',load);
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.view;render();}));
$('close-dialog').addEventListener('click',()=>$('event-dialog').close());
$('android').addEventListener('click',()=>{$('android-help').open=true;});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(feedURL.href);$('copy-status').textContent='Subscription link copied.';}catch{$('feed').focus();$('feed').select();$('copy-status').textContent='Link selected. Use your device’s Copy command.';}});
render();load();setInterval(()=>{if(!document.hidden)load();},300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
