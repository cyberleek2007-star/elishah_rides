const TOURS = [
 ["Sri Lanka Highlights","7 Days / 6 Nights","$1,850","A classic private journey through Colombo, Sigiriya, Kandy, Ella and the south.","Sigiriya • Kandy • Ella • Galle"],
 ["Cultural Triangle","5 Days / 4 Nights","$1,450","Ancient cities, temples and UNESCO heritage sites with a private chauffeur.","Sigiriya • Dambulla • Kandy • Anuradhapura"],
 ["Hill Country Escape","4 Days / 3 Nights","$1,250","Cool mountain air, tea country and scenic train-country roads.","Kandy • Nuwara Eliya • Ella"],
 ["Southern Coast Getaway","4 Days / 3 Nights","$1,100","A relaxed private escape across Sri Lanka's beautiful southern coastline.","Galle • Mirissa • Weligama"],
 ["Wildlife Adventure","4 Days / 3 Nights","$1,350","A private wildlife-focused route with time for nature and safari experiences.","Yala • Udawalawe • South Coast"],
 ["Beach Escape","5 Days / 4 Nights","$1,350","Sun, sea and slow days along the tropical coastline.","Bentota • Galle • Mirissa"],
 ["Romantic Sri Lanka","7 Days / 6 Nights","$1,950","A refined private itinerary for couples with scenic stays and memorable moments.","Kandy • Ella • South Coast"],
 ["Family Sri Lanka","7 Days / 6 Nights","$2,050","A comfortable private route designed for families and flexible travel days.","Cultural Triangle • Hill Country • Coast"],
 ["Adventure Sri Lanka","6 Days / 5 Nights","$1,750","A more active journey mixing mountains, wildlife, beaches and adventure.","Kandy • Ella • Yala • South Coast"],
 ["Custom Private Tour","Flexible","Request a Quote","Build your own Sri Lanka journey around your dates, interests and pace.","Fully Custom"]
];
const FLEET = [["Bike","1–2 guests","1 bag"],["Scooter","1–2 guests","1 bag"],["Flex","1–4 guests","3 bags"],["Car","1–4 guests","3 bags"],["Mini Van","1–7 guests","5 bags"],["Van","1–9 guests","7 bags"],["Bus","10–50 guests","10+ bags"]];
const tourGrid=document.getElementById("tourGrid"), fleetGrid=document.getElementById("fleetGrid");
if(tourGrid) {
 tourGrid.innerHTML=TOURS.map((t,i)=>`<article class="tour-card"><div class="tour-number">0${i+1}</div><div><p class="eyebrow">${t[1]}</p><h3>${t[0]}</h3><p>${t[3]}</p><small>${t[4]}</small></div><div class="tour-bottom"><strong>From ${t[2]}</strong><button class="text-btn" onclick="chooseTour('${t[0].replaceAll("'","\\'")}')">Book this tour →</button></div></article>`).join("");
 fleetGrid.innerHTML=FLEET.map((f,i)=>`<article class="fleet-card"><span class="fleet-icon">◆</span><h3>${f[0]}</h3><p>${f[1]} • ${f[2]} • Air Conditioning</p><button class="text-btn" onclick="chooseVehicle('${f[0]}')">Choose vehicle →</button></article>`).join("");
}
function chooseTour(name){document.querySelector('[name="service"]').value=name.includes("Tour")?"Private Day Tour":"Multi-Day Tour";document.querySelector('[name="notes"]').value=`Tour interest: ${name}`;document.getElementById("booking").scrollIntoView({behavior:"smooth"});}
function chooseVehicle(name, unitId="", displayName=""){
 const vehicleEl=document.querySelector('[name="vehicle"]');
 const unitEl=document.querySelector('[name="vehicle_unit_id"]');
 const label=document.getElementById("selectedVehicleLabel");
 const nameEl=document.querySelector('[name="vehicle_unit_name"]');
 if(vehicleEl) vehicleEl.value=name;
 if(unitEl) unitEl.value=unitId||"";
 if(nameEl) nameEl.value=displayName||"";
 if(label) label.textContent=displayName ? `Selected vehicle: ${displayName}` : "No specific vehicle selected";
 document.getElementById("booking")?.scrollIntoView({behavior:"smooth"});
}

async function isVehicleAvailable(vehicleName,date,unitId=""){
 await supabaseClientReady;
 if(!sb) return false;
 if(unitId){
   const {data:unit,error:ue}=await sb.from("vehicle_units").select("id,category,capacity,active").eq("id",unitId).maybeSingle();
   if(ue||!unit||!unit.active||unit.category!==vehicleName) return false;
   const {data:blocks,error:be}=await sb.from("vehicle_unit_blocks").select("vehicle_unit_id").eq("vehicle_unit_id",unitId).eq("block_date",date);
   if(be||blocks?.length) return false;
   const {data:booked,error:ke}=await sb.from("bookings").select("id").eq("travel_date",date).eq("vehicle_unit_id",unitId).in("status",["Pending","Confirmed"]);
   if(ke) return false;
   return !(booked||[]).length;
 }
 const {data:units,error:ue}=await sb.from("vehicle_units").select("id").eq("category",vehicleName).eq("active",true);
 if(ue||!units?.length) return false;
 const ids=units.map(x=>x.id);
 const {data:blocks,error:be}=await sb.from("vehicle_unit_blocks").select("vehicle_unit_id").in("vehicle_unit_id",ids).eq("block_date",date);
 if(be) return false;
 const blocked=new Set((blocks||[]).map(x=>x.vehicle_unit_id));
 const free=Math.max(0,ids.filter(id=>!blocked.has(id)).length);
 const {data:booked,error:ke}=await sb.from("bookings").select("id").eq("travel_date",date).eq("vehicle",vehicleName).in("status",["Pending","Confirmed"]);
 if(ke) return false;
 return free>(booked||[]).length;
}

const form=document.getElementById("bookingForm");
let sb=null;

async function initSupabaseClient(){
  try {
    const ready = await (window.supabaseConfigReady || Promise.resolve(false));
    if(ready && window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY){
      sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    }
  } catch(error){
    console.error("Supabase client initialization failed:", error);
  }
  return sb;
}
const supabaseClientReady = initSupabaseClient();
function makeRef(){return "ER-"+new Date().getFullYear()+"-"+Math.random().toString(36).slice(2,7).toUpperCase();}
if(form) form.addEventListener("submit",async e=>{
 e.preventDefault();
 await supabaseClientReady;
 const result=document.getElementById("bookingResult");
 const data=Object.fromEntries(new FormData(form).entries());
 const ref=makeRef();
 const booking={ref,status:"Pending",name:data.name,phone:data.phone,email:data.email||null,service:data.service,pickup:data.pickup,destination:data.destination,travel_date:data.date,pickup_time:data.time,passengers:Number(data.passengers||2),vehicle:data.vehicle,vehicle_unit_id:data.vehicle_unit_id||null,notes:data.notes||null,payment_method:data.payment_method||null,payment_status:"Pending"};
 if(!sb){result.innerHTML="<b>Supabase is not configured yet.</b> Your form is ready, but connect the project in supabase-config.js first.";return;}
 result.textContent="Checking vehicle availability…";
 const available=await isVehicleAvailable(data.vehicle,data.date,data.vehicle_unit_id||"");
 if(!available){result.innerHTML="<b>Selected vehicle is not available on that date.</b> Please choose another vehicle or date.";return;}
 result.textContent="Submitting booking request…";
 const {error}=await sb.from("bookings").insert(booking);
 if(error){console.error(error);result.innerHTML="<b>Could not submit.</b> Please try again or contact us on WhatsApp.";return;}
 const msg=`Hello Elishah Rides, I submitted a booking request.\n\nReference: ${ref}\nName: ${data.name}\nPhone: ${data.phone}\nService: ${data.service}\nPickup: ${data.pickup}\nDestination: ${data.destination}\nDate: ${data.date}\nTime: ${data.time}\nPassengers: ${data.passengers}\nVehicle: ${data.vehicle}${data.vehicle_unit_id?`\nSpecific vehicle: ${data.vehicle_unit_name||"Selected"}`:""}\nPayment method: ${data.payment_method||"-"}\nNotes: ${data.notes||"-"}`;
 const paymentNote=data.payment_method==="Bank Transfer" ? " Bank transfer details are shown above; send the receipt to WhatsApp after confirmation." : " PayPal payment will be arranged after the booking is confirmed.";
 result.innerHTML=`<b>Booking request received: ${ref}</b> — ${paymentNote} <a target="_blank" href="https://wa.me/94773523762?text=${encodeURIComponent(msg)}">Send details on WhatsApp →</a>`;
 form.reset(); form.querySelector('[name="passengers"]').value=2;
});



document.addEventListener("DOMContentLoaded",()=>{
  const method=document.getElementById("paymentMethod");
  const bank=document.getElementById("bankTransferInfo");
  const paypal=document.getElementById("paypalInfo");
  const update=()=>{ const v=method?.value||""; if(bank) bank.hidden=v!=="Bank Transfer"; if(paypal) paypal.hidden=v!=="PayPal"; };
  method?.addEventListener("change",update); update();
});

/* V15 selected actual vehicle from availability page */
document.addEventListener("DOMContentLoaded",()=>{
  const category=sessionStorage.getItem("selectedVehicle");
  const unitId=sessionStorage.getItem("selectedVehicleUnitId");
  const unitName=sessionStorage.getItem("selectedVehicleName");
  if(category){
    const vehicleEl=document.querySelector('[name="vehicle"]');
    const unitEl=document.querySelector('[name="vehicle_unit_id"]');
    const label=document.getElementById("selectedVehicleLabel");
    const nameEl=document.querySelector('[name="vehicle_unit_name"]');
    if(vehicleEl) vehicleEl.value=category;
    if(unitEl) unitEl.value=unitId||"";
    if(nameEl) nameEl.value=unitName||"";
    if(label) label.textContent=unitName?`Selected vehicle: ${unitName}`:"No specific vehicle selected";
    sessionStorage.removeItem("selectedVehicle");sessionStorage.removeItem("selectedVehicleUnitId");sessionStorage.removeItem("selectedVehicleName");
  }
});

/* V7 Pricing Estimate */
let v7PricingCache = [];
async function v7LoadPublicPricing() {
  await supabaseClientReady;
  if (!sb) return;
  const {data} = await sb.from("pricing_rules").select("*").eq("active", true);
  v7PricingCache = data || [];
  v7UpdateEstimate();
}
function v7UpdateEstimate() {
  const form = document.querySelector("form");
  if (!form || !v7PricingCache.length) return;
  const vehicleEl = form.querySelector('[name="vehicle"]');
  const serviceEl = form.querySelector('[name="service"]');
  const tripEl = form.querySelector('[name="trip_type"]');
  const estimate = document.getElementById("priceEstimate");
  if (!estimate) return;
  const vehicle = vehicleEl?.value || "";
  const service = serviceEl?.value || "";
  const trip = tripEl?.value || "";
  let rule = v7PricingCache.find(p => p.service===service && p.vehicle===vehicle && (!p.trip_type || p.trip_type===trip))
          || v7PricingCache.find(p => p.service===service && (!p.vehicle || p.vehicle===vehicle));
  if (!rule) { estimate.textContent = "Price: Request a quote"; return; }
  estimate.textContent = `Estimated from $${Number(rule.base_price||0).toFixed(2)} USD`;
}
document.addEventListener("DOMContentLoaded", ()=>{
  const form=document.querySelector("form");
  if(form){
    ["service","vehicle","trip_type"].forEach(n=>form.querySelector(`[name="${n}"]`)?.addEventListener("change",v7UpdateEstimate));
    if(!document.getElementById("priceEstimate")){
      const el=document.createElement("div"); el.id="priceEstimate"; el.className="price-estimate"; el.textContent="Price: Request a quote";
      form.appendChild(el);
    }
  }
  setTimeout(v7LoadPublicPricing, 800);
});



/* V8 payment-ready notice */
function v8PaymentNotice() {
  const form=document.querySelector("form");
  if(!form || document.getElementById("paymentReadyNotice")) return;
  const el=document.createElement("div");
  el.id="paymentReadyNotice";
  el.className="payment-ready-notice";
  el.innerHTML="<strong>Secure payment:</strong> Bank Transfer and PayPal payment options are available. Payment instructions are shown after you submit your booking.";
  form.appendChild(el);
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(v8PaymentNotice,900));
