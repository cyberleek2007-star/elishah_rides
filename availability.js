const CATEGORIES=[
 {name:'Bike',capacity:'1–2 guests',luggage:'1 bag',image:'assets/vehicles/bike.png',description:'Quick, flexible and ideal for solo or short-distance travel.'},
 {name:'Scooter',capacity:'1–2 guests',luggage:'1 bag',image:'assets/vehicles/scooter.png',description:'Easy city travel for guests who want a simple and agile ride.'},
 {name:'Flex',capacity:'1–4 guests',luggage:'3 bags',image:'assets/vehicles/flex.png',description:'Versatile hatchback travel for couples and everyday journeys.'},
 {name:'Car',capacity:'1–4 guests',luggage:'3 bags',image:'assets/vehicles/car.png',description:'Comfortable sedan travel for airport transfers, tours and road journeys.'},
 {name:'Mini Van',capacity:'1–7 guests',luggage:'5 bags',image:'assets/vehicles/minivan.png',description:'Spacious minivan comfort for families and small groups.'},
 {name:'Van',capacity:'1–9 guests',luggage:'7 bags',image:'assets/vehicles/van.png',description:'Practical van space for families, groups and longer journeys.'},
 {name:'Bus',capacity:'10–50 guests',luggage:'10+ bags',image:'assets/vehicles/bus.png',description:'Comfortable group transportation for tours, events and larger parties.'}
];
const dateEl=document.getElementById('availabilityDate'),passengersEl=document.getElementById('availabilityPassengers'),grid=document.getElementById('availabilityGrid'),statusEl=document.getElementById('availabilityStatus');
let sb=null;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function maxCapacity(c){return Number(c.capacity.match(/\d+/g)?.pop()||99);}
function saveVehicleSelection(category,unit){sessionStorage.setItem('selectedVehicle',category);sessionStorage.setItem('selectedVehicleUnitId',unit.id);sessionStorage.setItem('selectedVehicleName',unit.display_name||category);}
function renderCategories(rows){
 const byCat=Object.fromEntries(CATEGORIES.map(c=>[c.name,[]])); rows.forEach(r=>{if(byCat[r.category])byCat[r.category].push(r);});
 grid.innerHTML=CATEGORIES.map(c=>{
   const units=byCat[c.name]||[]; const filtered=units.filter(u=>u.available && Number(passengersEl.value||1)<=maxCapacity(c)); const available=filtered.length;
   return `<article class="customer-availability-card ${available?'is-available':'is-unavailable'}" data-category-card="${esc(c.name)}">
      <button type="button" class="category-toggle" data-category="${esc(c.name)}" aria-expanded="false">
        <div class="line-vehicle"><img src="${c.image}" alt="${esc(c.name)} vehicle illustration" loading="lazy"></div>
        <div class="availability-card-top"><span class="vehicle-type">${esc(c.name)}</span><span class="availability-dot"></span></div>
        <h2>${esc(c.name)}</h2><p>${esc(c.capacity)} <i>•</i> ${esc(c.luggage)} <i>•</i> Air Conditioning</p>
        <div class="availability-count"><strong>${available}</strong><span>${available===1?'vehicle':'vehicles'} available</span></div>
        <div class="availability-line"><span>${esc(c.description)}</span><span>${available?'Available':'Full'}</span></div>
        <span class="category-action">${available?'View available vehicles →':'View details →'}</span>
      </button>
      <div class="category-vehicles" hidden>${available?filtered.map(u=>`<div class="availability-vehicle-row"><div class="vehicle-art"><img src="${c.image}" alt="" loading="lazy"></div><div class="vehicle-main"><strong>${esc(u.display_name||c.name)}</strong><span>${esc(c.name)}${u.registration_no?' · '+esc(u.registration_no):''}</span><div class="vehicle-specs"><span>${esc(u.capacity||maxCapacity(c))} seats</span><span>${esc(u.luggage||c.luggage)} luggage</span><span>AC</span></div></div><a class="btn primary btn-book-vehicle" href="index.html#booking" data-unit-id="${esc(u.id)}" data-category="${esc(c.name)}" data-name="${esc(u.display_name||c.name)}">Book this vehicle</a></div>`).join(''):'<div class="vehicle-empty">No vehicle is currently available for this category on the selected date.</div>'}</div>
    </article>`;
 }).join('');
 grid.querySelectorAll('.category-toggle').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('.customer-availability-card'),panel=card.querySelector('.category-vehicles'),open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));panel.hidden=open;card.classList.toggle('expanded',!open);}));
 grid.querySelectorAll('.btn-book-vehicle').forEach(btn=>btn.addEventListener('click',()=>saveVehicleSelection(btn.dataset.category,{id:btn.dataset.unitId,display_name:btn.dataset.name})));
}
async function init(){try{await (window.supabaseConfigReady||Promise.resolve(false));if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);}catch(e){console.error(e)}const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());dateEl.min=today.toISOString().slice(0,10);if(!dateEl.value)dateEl.value=today.toISOString().slice(0,10);await load();}
async function load(){const date=dateEl.value;if(!date)return;if(!sb){statusEl.innerHTML='<b>Availability is temporarily unavailable.</b> Please contact us on WhatsApp.';return;}statusEl.textContent='Checking live availability…';const {data,error}=await sb.rpc('get_public_vehicle_availability',{p_date:date,p_passengers:Number(passengersEl.value||1)});if(error){console.error(error);statusEl.innerHTML='<b>Live availability is not ready yet.</b> Please run the latest vehicle setup SQL in Supabase.';grid.innerHTML='';return;}renderCategories(data||[]);statusEl.innerHTML=`<strong>${esc(new Date(date+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))}</strong> · Choose a category to view the vehicles available for your date.`;}
document.getElementById('checkAvailability').addEventListener('click',load);dateEl.addEventListener('change',load);passengersEl.addEventListener('change',load);init();
