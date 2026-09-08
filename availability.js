const CATEGORIES=[
 {name:'Premium Sedan',capacity:'1–3 guests',luggage:'2 bags',image:'assets/vehicles/sedan-line.png',description:'Elegant and comfortable for airport transfers, business and everyday travel.'},
 {name:'Luxury Sedan',capacity:'1–3 guests',luggage:'2 bags',image:'assets/vehicles/sedan-premium-line.png',description:'Refined sedan comfort for guests who prefer a more premium journey.'},
 {name:'SUV',capacity:'1–4 guests',luggage:'3 bags',image:'assets/vehicles/sedan-line.png',description:'Flexible space and comfort for longer journeys and mixed road conditions.'},
 {name:'Premium SUV',capacity:'1–4 guests',luggage:'3 bags',image:'assets/vehicles/sedan-premium-line.png',description:'Extra comfort and presence for premium private travel.'},
 {name:'Van',capacity:'1–7 guests',luggage:'5 bags',image:'assets/vehicles/van-line.png',description:'Spacious and practical for families, friends and airport luggage.'},
 {name:'Luxury Van',capacity:'1–8 guests',luggage:'6 bags',image:'assets/vehicles/van-line.png',description:'More room for larger groups who want a relaxed private journey.'}
];
const dateEl=document.getElementById('availabilityDate'),passengersEl=document.getElementById('availabilityPassengers'),grid=document.getElementById('availabilityGrid'),statusEl=document.getElementById('availabilityStatus');
let sb=null;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function categoryInfo(name){return CATEGORIES.find(c=>c.name===name)||CATEGORIES[0];}
function saveVehicleSelection(category,unit){
 sessionStorage.setItem('selectedVehicle',category);
 sessionStorage.setItem('selectedVehicleUnitId',unit.id);
 sessionStorage.setItem('selectedVehicleName',unit.display_name||category);
}
function renderCategories(rows){
 const byCat=Object.fromEntries(CATEGORIES.map(c=>[c.name,[]]));
 rows.forEach(r=>{if(byCat[r.category])byCat[r.category].push(r);});
 grid.innerHTML=CATEGORIES.map((c,i)=>{
   const units=byCat[c.name]||[];
   const passengerLimit=Number(c.capacity.match(/\d+/g)?.pop()||99);
   const filtered=units.filter(u=>u.available && Number(passengersEl.value||1)<=passengerLimit);
   const available=filtered.length;
   const total=units.length;
   return `<article class="customer-availability-card ${available?'is-available':'is-unavailable'}" data-category-card="${esc(c.name)}">
      <button type="button" class="category-toggle" data-category="${esc(c.name)}" aria-expanded="false">
        <div class="line-vehicle"><img src="${c.image}" alt="${esc(c.name)} vehicle illustration" loading="lazy"></div>
        <div class="availability-card-top"><span class="vehicle-type">${esc(c.name)}</span><span class="availability-dot"></span></div>
        <h2>${esc(c.name)}</h2><p>${esc(c.capacity)} • ${esc(c.luggage)} • Air Conditioning</p>
        <div class="availability-count"><strong>${available}</strong><span>${available===1?'vehicle':'vehicles'} available</span></div>
        <div class="availability-line"><span>${total?esc(c.description):'No vehicles added yet'}</span><span>${available?'Available':'Full'}</span></div>
        <span class="category-action">${available?'View vehicles →':'View details →'}</span>
      </button>
      <div class="category-vehicles" hidden>${available?filtered.map(u=>`<div class="availability-vehicle-row"><div class="vehicle-art"><img src="${c.image}" alt="" loading="lazy"></div><div class="vehicle-main"><strong>${esc(u.display_name||c.name)}</strong><span>${esc(c.name)}${u.registration_no?' · '+esc(u.registration_no):''}</span><div class="vehicle-specs"><span>${esc(u.capacity||passengerLimit)} seats</span><span>${esc(u.luggage||c.luggage.replace(/\\D/g,''))} luggage</span><span>AC</span></div></div><a class="btn primary btn-book-vehicle" href="index.html#booking" data-unit-id="${esc(u.id)}" data-category="${esc(c.name)}" data-name="${esc(u.display_name||c.name)}">Book this vehicle</a></div>`).join(''):'<div class="vehicle-empty">No vehicle is currently available for this category on the selected date.</div>'}</div>
    </article>`;
 }).join('');
 grid.querySelectorAll('.category-toggle').forEach(btn=>btn.addEventListener('click',()=>{
   const card=btn.closest('.customer-availability-card');const panel=card.querySelector('.category-vehicles');const open=btn.getAttribute('aria-expanded')==='true';
   btn.setAttribute('aria-expanded',String(!open));panel.hidden=open;card.classList.toggle('expanded',!open);
 }));
 grid.querySelectorAll('.btn-book-vehicle').forEach(btn=>btn.addEventListener('click',()=>saveVehicleSelection(btn.dataset.category,{id:btn.dataset.unitId,display_name:btn.dataset.name})));
}
async function init(){
 try{await (window.supabaseConfigReady||Promise.resolve(false));if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);}catch(e){console.error(e)}
 const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());dateEl.min=today.toISOString().slice(0,10);if(!dateEl.value)dateEl.value=today.toISOString().slice(0,10);await load();
}
async function load(){
 const date=dateEl.value;if(!date)return;if(!sb){statusEl.innerHTML='<b>Availability is temporarily unavailable.</b> Please contact us on WhatsApp.';return;}
 statusEl.textContent='Checking live availability…';
 const {data,error}=await sb.rpc('get_public_vehicle_availability',{p_date:date,p_passengers:Number(passengersEl.value||1)});
 if(error){console.error(error);statusEl.innerHTML='<b>Live availability is not ready yet.</b> Please run the V15 SQL setup once in Supabase.';grid.innerHTML='';return;}
 renderCategories(data||[]);
 statusEl.innerHTML=`<strong>${esc(new Date(date+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))}</strong> · Select a category to view the actual vehicles available for that date.`;
}
document.getElementById('checkAvailability').addEventListener('click',load);dateEl.addEventListener('change',load);passengersEl.addEventListener('change',load);init();
