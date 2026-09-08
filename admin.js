let sb=null, bookings=[];
const loginPanel=document.getElementById("loginPanel"), dashboard=document.getElementById("dashboard");
if(window.supabase && window.SUPABASE_URL && !window.SUPABASE_URL.startsWith("YOUR_")) sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
async function boot(){
 if(!sb){document.getElementById("loginMsg").textContent="Connect Supabase in supabase-config.js first.";return;}
 const {data:{session}}=await sb.auth.getSession();
 if(session) showDashboard(session); else loginPanel.hidden=false;
}
function showDashboard(session){loginPanel.hidden=true;dashboard.hidden=false;document.getElementById("userEmail").textContent=session.user.email||"";loadBookings();}
document.getElementById("loginForm").addEventListener("submit",async e=>{
 e.preventDefault(); const msg=document.getElementById("loginMsg");
 const {data,error}=await sb.auth.signInWithPassword({email:email.value,password:password.value});
 if(error){msg.textContent=error.message;return;} msg.textContent=""; showDashboard(data.session);
});
document.getElementById("logout").addEventListener("click",async()=>{await sb.auth.signOut();location.reload();});
async function loadBookings(){const {data,error}=await sb.from("bookings").select("*").order("created_at",{ascending:false});if(error){console.error(error);return;}bookings=data||[];render();}
function render(){
 const q=search.value.toLowerCase(), f=filter.value, shown=bookings.filter(b=>(f==="All"||b.status===f)&&JSON.stringify(b).toLowerCase().includes(q));
 total.textContent=bookings.length;pending.textContent=bookings.filter(b=>b.status==="Pending").length;confirmed.textContent=bookings.filter(b=>b.status==="Confirmed").length;completed.textContent=bookings.filter(b=>b.status==="Completed").length;
 empty.style.display=shown.length?"none":"block";
 bookingList.innerHTML=shown.map(b=>`<article class="admin-card"><div class="admin-card-head"><div><b>${esc(b.ref)}</b><span>${new Date(b.created_at).toLocaleString()}</span></div><select onchange="statusChange('${b.id}',this.value)"><option ${b.status==="Pending"?"selected":""}>Pending</option><option ${b.status==="Confirmed"?"selected":""}>Confirmed</option><option ${b.status==="Completed"?"selected":""}>Completed</option><option ${b.status==="Cancelled"?"selected":""}>Cancelled</option></select></div><div class="admin-details"><div><b>${esc(b.name)}</b><span>${esc(b.phone)}${b.email?" • "+esc(b.email):""}</span></div><div><span>Service</span><b>${esc(b.service)}</b></div><div><span>Route</span><b>${esc(b.pickup)} → ${esc(b.destination)}</b></div><div><span>Travel</span><b>${esc(b.travel_date)} • ${esc(b.pickup_time)}</b></div><div><span>Passengers / Vehicle</span><b>${esc(b.passengers)} • ${esc(b.vehicle)}</b></div><div><span>Requests</span><b>${esc(b.notes||"—")}</b></div></div></article>`).join("");
}
window.statusChange=async(id,status)=>{const {error}=await sb.from("bookings").update({status}).eq("id",id);if(error){alert(error.message);return;}await loadBookings();};
search.addEventListener("input",render);filter.addEventListener("change",render);boot();

async function loadVehicles(){
 const {data,error}=await sb.from("vehicles").select("*").order("name");
 if(error){console.error(error);return;}
 const sel=document.getElementById("vehicleSelect");
 sel.innerHTML=(data||[]).map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join("");
 await loadBlocks();
}
async function loadBlocks(){
 const {data,error}=await sb.from("vehicle_blocks").select("id,vehicle_id,block_date,reason,vehicles(name)").order("block_date");
 if(error){console.error(error);return;}
 const grouped={}; (data||[]).forEach(b=>{const name=b.vehicles?.name||"Vehicle";(grouped[name]??=[]).push(b);});
 document.getElementById("vehicleAvailability").innerHTML=Object.keys(grouped).length
 ? Object.entries(grouped).map(([name,items])=>`<div class="vehicle-block"><h3>${esc(name)}</h3><div class="block-chips">${items.map(b=>`<span class="block-chip">${esc(b.block_date)}${b.reason?" — "+esc(b.reason):""}<button onclick="removeBlock('${b.id}')" title="Remove">×</button></span>`).join("")}</div></div>`).join("")
 : '<p class="muted">No blocked dates.</p>';
}
document.getElementById("blockVehicle").addEventListener("click",async()=>{
 const vehicle_id=document.getElementById("vehicleSelect").value, block_date=document.getElementById("blockDate").value, reason=document.getElementById("blockReason").value;
 const msg=document.getElementById("availabilityMsg");
 if(!vehicle_id||!block_date){msg.textContent="Select a vehicle and date.";return;}
 const {error}=await sb.from("vehicle_blocks").insert({vehicle_id,block_date,reason:reason||null});
 if(error){msg.textContent=error.code==="23505"?"That vehicle is already blocked on this date.":error.message;return;}
 msg.textContent="Vehicle blocked successfully.";document.getElementById("blockReason").value="";await loadBlocks();
});
window.removeBlock=async(id)=>{const {error}=await sb.from("vehicle_blocks").delete().eq("id",id);if(error){alert(error.message);return;}await loadBlocks();};
const oldShowDashboard=showDashboard;
showDashboard=async function(session){oldShowDashboard(session);await loadVehicles();};



/* V6 Calendar + Booking Details */
let v6CalendarDate = new Date();
let v6SelectedDate = new Date().toISOString().slice(0,10);
let v6BookingsCache = [];
let v6VehiclesCache = [];
let v6CurrentDetailBooking = null;

function v6DateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function v6ParseDate(value) {
  if (!value) return null;
  const p = String(value).slice(0,10).split("-").map(Number);
  return p.length === 3 && p.every(Number.isFinite) ? new Date(p[0],p[1]-1,p[2]) : null;
}
function v6Esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function v6StatusClass(status) { return String(status||"Pending").toLowerCase().replace(/\s+/g,"-"); }

async function v6LoadBlocks() {
  try {
    const {data} = await sb.from("vehicle_blocks").select("*");
    window.v6BlocksCache = data || [];
  } catch(e) { window.v6BlocksCache = []; }
}
async function v6LoadData() {
  try {
    const [b,v] = await Promise.all([
      sb.from("bookings").select("*").order("travel_date",{ascending:true}),
      sb.from("vehicles").select("*").order("name",{ascending:true})
    ]);
    v6BookingsCache = b.data || [];
    v6VehiclesCache = v.data || [];
    v6RenderCalendar();
    v6RenderSelectedDay(v6SelectedDate);
  } catch(e) { console.error(e); }
}
function v6RenderCalendar() {
  const grid=document.getElementById("bookingCalendarGrid"), label=document.getElementById("calendarMonthLabel");
  if(!grid||!label)return;
  label.textContent=v6CalendarDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const first=new Date(v6CalendarDate.getFullYear(),v6CalendarDate.getMonth(),1);
  const start=new Date(first); start.setDate(1-first.getDay());
  let html="";
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=v6DateKey(d), inMonth=d.getMonth()===v6CalendarDate.getMonth();
    const bs=v6BookingsCache.filter(b=>String(b.travel_date||"").slice(0,10)===key);
    html+=`<button type="button" class="calendar-day ${inMonth?"":"muted"} ${key===v6SelectedDate?"selected":""} ${key===v6DateKey(new Date())?"today":""}" data-calendar-date="${key}">
      <span class="calendar-day-number">${d.getDate()}</span>
      <span class="calendar-day-events">${bs.slice(0,3).map(b=>`<span class="calendar-event status-${v6StatusClass(b.status)}">${v6Esc(b.ref||"Booking")}</span>`).join("")}${bs.length>3?`<span class="calendar-more">+${bs.length-3} more</span>`:""}</span>
      ${bs.length?`<span class="calendar-badge">${bs.length}</span>`:""}
    </button>`;
  }
  grid.innerHTML=html;
  grid.querySelectorAll("[data-calendar-date]").forEach(x=>x.addEventListener("click",()=>{
    v6SelectedDate=x.dataset.calendarDate; v6RenderCalendar(); v6RenderSelectedDay(v6SelectedDate);
  }));
}
function v6RenderSelectedDay(key) {
  const date=v6ParseDate(key), bookings=v6BookingsCache.filter(b=>String(b.travel_date||"").slice(0,10)===key);
  document.getElementById("selectedDayLabel").textContent=date?date.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}):key;
  document.getElementById("selectedDayCount").textContent=`${bookings.length} booking${bookings.length===1?"":"s"}`;
  const list=document.getElementById("selectedDayBookings");
  list.innerHTML=bookings.length?bookings.map(b=>`<button type="button" class="day-booking" data-detail-ref="${v6Esc(b.ref)}">
    <div class="day-booking-top"><strong>${v6Esc(b.ref||"Booking")}</strong><span class="status-pill status-${v6StatusClass(b.status)}">${v6Esc(b.status||"Pending")}</span></div>
    <div class="day-booking-main">${v6Esc(b.name||"Guest")} · ${v6Esc(b.vehicle||"Vehicle")}</div>
    <div class="day-booking-sub">${v6Esc(b.pickup||"Pickup")} → ${v6Esc(b.destination||"Destination")}</div>
  </button>`).join(""):`<p class="empty-state">No bookings for this date.</p>`;
  list.querySelectorAll("[data-detail-ref]").forEach(x=>x.addEventListener("click",()=>v6OpenBooking(x.dataset.detailRef)));

  const blocked=(window.v6BlocksCache||[]).filter(x=>String(x.block_date||"").slice(0,10)===key);
  const blockedIds=new Set(blocked.map(x=>String(x.vehicle_id)));
  const booked=new Set(bookings.map(b=>String(b.vehicle||"").trim().toLowerCase()));
  const active=v6VehiclesCache.filter(v=>v.active!==false);
  let available=0, unavailable=0;
  document.getElementById("selectedDayVehicles").innerHTML=active.length?active.map(v=>{
    const isBlocked=blockedIds.has(String(v.id)), isBooked=booked.has(String(v.name||"").trim().toLowerCase()), busy=isBlocked||isBooked;
    busy?unavailable++:available++;
    const reason=isBlocked?(blocked.find(x=>String(x.vehicle_id)===String(v.id))?.reason||"Blocked"):(isBooked?"Booked":"Available");
    return `<div class="vehicle-status-row"><div><strong>${v6Esc(v.name)}</strong><small>${v6Esc(reason)}</small></div><span class="availability-dot ${busy?"busy":"free"}">${busy?"Unavailable":"Available"}</span></div>`;
  }).join(""):`<p class="empty-state">No active vehicles.</p>`;
  document.getElementById("selectedVehicleSummary").textContent=`${available} available · ${unavailable} unavailable`;
}
function v6OpenBooking(ref) {
  const b=v6BookingsCache.find(x=>String(x.ref)===String(ref)); if(!b)return;
  v6CurrentDetailBooking=b;
  document.getElementById("detailRef").textContent=b.ref||"Booking";
  document.getElementById("bookingDetailBody").innerHTML=`<div class="detail-grid">
    <div><span>Customer</span><strong>${v6Esc(b.name)}</strong></div><div><span>Phone</span><strong>${v6Esc(b.phone)}</strong></div>
    <div><span>Email</span><strong>${v6Esc(b.email)}</strong></div><div><span>Status</span><strong>${v6Esc(b.status)}</strong></div>
    <div><span>Service</span><strong>${v6Esc(b.service)}</strong></div><div><span>Vehicle</span><strong>${v6Esc(b.vehicle)}</strong></div>
    <div><span>Travel date</span><strong>${v6Esc(b.travel_date)}</strong></div><div><span>Pickup time</span><strong>${v6Esc(b.pickup_time)}</strong></div>
    <div class="wide"><span>Pickup</span><strong>${v6Esc(b.pickup)}</strong></div><div class="wide"><span>Destination</span><strong>${v6Esc(b.destination)}</strong></div>
    <div><span>Passengers</span><strong>${v6Esc(b.passengers)}</strong></div><div><span>Notes</span><strong>${v6Esc(b.notes||"—")}</strong></div>
  </div>`;
  document.getElementById("detailConfirm").textContent=b.status==="Confirmed"?"Mark Pending":"Confirm Booking";
  document.getElementById("bookingDetailModal").classList.add("open");
  document.getElementById("bookingDetailModal").setAttribute("aria-hidden","false");
}
function v6CloseModal(){const m=document.getElementById("bookingDetailModal");m.classList.remove("open");m.setAttribute("aria-hidden","true");}
async function v6ToggleConfirm(){
  if(!v6CurrentDetailBooking)return;
  const status=v6CurrentDetailBooking.status==="Confirmed"?"Pending":"Confirmed";
  const {error}=await sb.from("bookings").update({status}).eq("id",v6CurrentDetailBooking.id);
  if(error){alert(error.message);return;}
  await v6LoadData(); v6OpenBooking(v6CurrentDetailBooking.ref);
}
function v6SendWhatsApp(){
  const b=v6CurrentDetailBooking;if(!b)return;
  const phone=String(b.phone||"").replace(/[^\d]/g,"");
  const msg=`Hello ${b.name||""}, this is Elishah Rides regarding booking ${b.ref||""}. Status: ${b.status||"Pending"}. Date: ${b.travel_date||""}. Pickup: ${b.pickup||""}. Destination: ${b.destination||""}.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank");
}
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("prevMonth")?.addEventListener("click",()=>{v6CalendarDate=new Date(v6CalendarDate.getFullYear(),v6CalendarDate.getMonth()-1,1);v6RenderCalendar();});
  document.getElementById("nextMonth")?.addEventListener("click",()=>{v6CalendarDate=new Date(v6CalendarDate.getFullYear(),v6CalendarDate.getMonth()+1,1);v6RenderCalendar();});
  document.getElementById("todayMonth")?.addEventListener("click",()=>{v6CalendarDate=new Date();v6SelectedDate=v6DateKey(new Date());v6RenderCalendar();v6RenderSelectedDay(v6SelectedDate);});
  document.querySelectorAll("[data-close-booking-modal]").forEach(x=>x.addEventListener("click",v6CloseModal));
  document.getElementById("detailConfirm")?.addEventListener("click",v6ToggleConfirm);
  document.getElementById("detailWhatsApp")?.addEventListener("click",v6SendWhatsApp);
  setTimeout(async()=>{await v6LoadBlocks();await v6LoadData();},700);
});



/* V7 Pricing Management */
async function v7LoadPricing() {
  const tbody = document.getElementById("pricingRows");
  if (!tbody) return;
  const {data, error} = await sb.from("pricing_rules").select("*").order("service").order("vehicle");
  if (error) { tbody.innerHTML = `<tr><td colspan="7">${v6Esc(error.message)}</td></tr>`; return; }
  tbody.innerHTML = data?.length ? data.map(p => `
    <tr>
      <td>${v6Esc(p.service)}</td><td>${v6Esc(p.vehicle||"—")}</td><td>${v6Esc(p.trip_type||"—")}</td>
      <td>$${Number(p.base_price||0).toFixed(2)}</td><td>$${Number(p.per_km||0).toFixed(2)}</td><td>$${Number(p.per_day||0).toFixed(2)}</td>
      <td><button class="btn btn-small btn-danger" type="button" data-delete-price="${p.id}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="7">No pricing rules yet.</td></tr>`;
  tbody.querySelectorAll("[data-delete-price]").forEach(btn => btn.addEventListener("click", async()=>{
    if (!confirm("Delete this pricing rule?")) return;
    const {error} = await sb.from("pricing_rules").delete().eq("id", btn.dataset.deletePrice);
    if (error) alert(error.message); else v7LoadPricing();
  }));
}
async function v7AddPricing(e) {
  e.preventDefault();
  const payload = {
    service: document.getElementById("priceService").value,
    vehicle: document.getElementById("priceVehicle").value.trim() || null,
    trip_type: document.getElementById("priceTripType").value.trim() || null,
    base_price: Number(document.getElementById("priceBase").value||0),
    per_km: Number(document.getElementById("priceKm").value||0),
    per_day: Number(document.getElementById("priceDay").value||0),
    currency: "USD",
    active: true
  };
  const {error} = await sb.from("pricing_rules").insert(payload);
  if (error) { alert(error.message); return; }
  e.target.reset();
  v7LoadPricing();
}
document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("pricingForm")?.addEventListener("submit", v7AddPricing);
  setTimeout(v7LoadPricing, 900);
});



/* V8 production status */
document.addEventListener("DOMContentLoaded", ()=>{
  setTimeout(()=>{
    const provider=document.getElementById("v8ProviderLabel");
    const email=document.getElementById("v8EmailLabel");
    const wa=document.getElementById("v8WhatsappLabel");
    if(provider) provider.textContent = window.ELISHAH_PAYMENT_PROVIDER && window.ELISHAH_PAYMENT_PROVIDER !== "none"
      ? window.ELISHAH_PAYMENT_PROVIDER.toUpperCase() : "Not configured";
    if(email) email.textContent = window.ELISHAH_BUSINESS_EMAIL || "Not configured";
    if(wa) wa.textContent = window.ELISHAH_WHATSAPP ? "Configured" : "Not configured";
  }, 400);
});
