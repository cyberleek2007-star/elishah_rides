const CATEGORIES=[
 {name:'Premium Sedan',capacity:'1–3 guests',luggage:'2 bags',icon:'Sedan'},
 {name:'Luxury Sedan',capacity:'1–3 guests',luggage:'2 bags',icon:'Sedan'},
 {name:'SUV',capacity:'1–4 guests',luggage:'3 bags',icon:'SUV'},
 {name:'Premium SUV',capacity:'1–4 guests',luggage:'3 bags',icon:'SUV'},
 {name:'Van',capacity:'1–7 guests',luggage:'5 bags',icon:'Van'},
 {name:'Luxury Van',capacity:'1–8 guests',luggage:'6 bags',icon:'Van'}
];
const dateEl=document.getElementById('availabilityDate'),passengersEl=document.getElementById('availabilityPassengers'),grid=document.getElementById('availabilityGrid'),statusEl=document.getElementById('availabilityStatus');
let sb=null;
async function init(){
 try{await (window.supabaseConfigReady||Promise.resolve(false));if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);}catch(e){console.error(e)}
 const today=new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
 dateEl.min=today.toISOString().slice(0,10);
 if(!dateEl.value) dateEl.value=today.toISOString().slice(0,10);
 await load();
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
async function load(){
 const date=dateEl.value;if(!date)return;
 if(!sb){statusEl.innerHTML='<b>Availability is temporarily unavailable.</b> Please contact us on WhatsApp.';return;}
 statusEl.textContent='Checking live availability…';
 const [{data:units,error:uerr},{data:blocks,error:berr},{data:bookings,error:kerr}]=await Promise.all([
  sb.from('vehicle_units').select('id,category,active').eq('active',true),
  sb.from('vehicle_unit_blocks').select('vehicle_unit_id,block_date').eq('block_date',date),
  sb.from('bookings').select('vehicle,status,passengers').eq('travel_date',date).in('status',['Pending','Confirmed'])
 ]);
 if(uerr||berr||kerr){console.error(uerr||berr||kerr);statusEl.innerHTML='<b>We could not load live availability.</b> Please contact us directly.';return;}
 const blocked=new Set((blocks||[]).map(x=>x.vehicle_unit_id));
 const cards=CATEGORIES.map(c=>{
   const categoryUnits=(units||[]).filter(x=>x.category===c.name);
   const free=categoryUnits.filter(x=>!blocked.has(x.id)).length;
   const booked=(bookings||[]).filter(x=>x.vehicle===c.name).length;
   const available=Math.max(0,free-booked);
   const enough=available>0 && Number(passengersEl.value||1)<=Number(c.capacity.match(/\d+/g)?.pop()||99);
   const label=available>0?(available===1?'1 vehicle available':`${available} vehicles available`):'Currently unavailable';
   return `<article class="customer-availability-card ${available?'is-available':'is-unavailable'}"><div class="availability-card-top"><span class="vehicle-type">${esc(c.icon)}</span><span class="availability-dot"></span></div><h2>${esc(c.name)}</h2><p>${esc(c.capacity)} • ${esc(c.luggage)} • Air Conditioning</p><div class="availability-count"><strong>${available}</strong><span>${available===1?'vehicle':'vehicles'} available</span></div><div class="availability-line"><span>${esc(label)}</span><span>${available?'Available':'Full'}</span></div><a class="btn ${available?'primary':'ghost'}" ${available?'href="index.html#booking" onclick="sessionStorage.setItem(\'selectedVehicle\',\''+esc(c.name)+'\')"':'aria-disabled="true"'}>${available?'Book this category':'Choose another category'}</a></article>`;
 }).join('');
 grid.innerHTML=cards;
 statusEl.innerHTML=`<strong>${esc(new Date(date+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))}</strong> · Availability is based on current bookings and blocked vehicles.`;
}
document.getElementById('checkAvailability').addEventListener('click',load);dateEl.addEventListener('change',load);passengersEl.addEventListener('change',load);init();
