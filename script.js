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
const FLEET = [["Premium Sedan","1–3 guests","2 bags"],["Luxury Sedan","1–3 guests","2 bags"],["SUV","1–4 guests","3 bags"],["Premium SUV","1–4 guests","3 bags"],["Van","1–7 guests","5 bags"],["Luxury Van","1–8 guests","6 bags"]];
const tourGrid=document.getElementById("tourGrid"), fleetGrid=document.getElementById("fleetGrid");
if(tourGrid) {
 tourGrid.innerHTML=TOURS.map((t,i)=>`<article class="tour-card"><div class="tour-number">0${i+1}</div><div><p class="eyebrow">${t[1]}</p><h3>${t[0]}</h3><p>${t[3]}</p><small>${t[4]}</small></div><div class="tour-bottom"><strong>From ${t[2]}</strong><button class="text-btn" onclick="chooseTour('${t[0].replaceAll("'","\\'")}')">Book this tour →</button></div></article>`).join("");
 fleetGrid.innerHTML=FLEET.map((f,i)=>`<article class="fleet-card"><span class="fleet-icon">◆</span><h3>${f[0]}</h3><p>${f[1]} • ${f[2]} • Air Conditioning</p><button class="text-btn" onclick="chooseVehicle('${f[0]}')">Choose vehicle →</button></article>`).join("");
}
function chooseTour(name){document.querySelector('[name="service"]').value=name.includes("Tour")?"Private Day Tour":"Multi-Day Tour";document.querySelector('[name="notes"]').value=`Tour interest: ${name}`;document.getElementById("booking").scrollIntoView({behavior:"smooth"});}
function chooseVehicle(name){document.querySelector('[name="vehicle"]').value=name;document.getElementById("booking").scrollIntoView({behavior:"smooth"});}

async function isVehicleAvailable(vehicleName,date){
 await supabaseClientReady;
 if(!sb) return false;
 const {data:v}=await sb.from("vehicles").select("id,active").eq("name",vehicleName).eq("active",true).maybeSingle();
 if(!v) return false;
 const {data:block}=await sb.from("vehicle_blocks").select("id").eq("vehicle_id",v.id).eq("block_date",date).maybeSingle();
 return !block;
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
 const booking={ref,status:"Pending",name:data.name,phone:data.phone,email:data.email||null,service:data.service,pickup:data.pickup,destination:data.destination,travel_date:data.date,pickup_time:data.time,passengers:Number(data.passengers||2),vehicle:data.vehicle,notes:data.notes||null};
 if(!sb){result.innerHTML="<b>Supabase is not configured yet.</b> Your form is ready, but connect the project in supabase-config.js first.";return;}
 result.textContent="Checking vehicle availability…";
 const available=await isVehicleAvailable(data.vehicle,data.date);
 if(!available){result.innerHTML="<b>Selected vehicle is not available on that date.</b> Please choose another vehicle or date.";return;}
 result.textContent="Submitting booking request…";
 const {error}=await sb.from("bookings").insert(booking);
 if(error){console.error(error);result.innerHTML="<b>Could not submit.</b> Please try again or contact us on WhatsApp.";return;}
 const msg=`Hello Elishah Rides, I submitted a booking request.\n\nReference: ${ref}\nName: ${data.name}\nPhone: ${data.phone}\nService: ${data.service}\nPickup: ${data.pickup}\nDestination: ${data.destination}\nDate: ${data.date}\nTime: ${data.time}\nPassengers: ${data.passengers}\nVehicle: ${data.vehicle}\nNotes: ${data.notes||"-"}`;
 result.innerHTML=`<b>Booking request received: ${ref}</b> — <a target="_blank" href="https://wa.me/94773523762?text=${encodeURIComponent(msg)}">Send details on WhatsApp →</a>`;
 form.reset(); form.querySelector('[name="passengers"]').value=2;
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
  el.innerHTML="<strong>Secure payment:</strong> Payment can be enabled after the business PayHere/WEBXPAY account and secure server callback are configured.";
  form.appendChild(el);
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(v8PaymentNotice,900));
