let sb=null, bookings=[];

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const pageName=document.body?.dataset?.adminPage||"login";

function showError(message){
  const el=document.getElementById("adminError");
  if(el){el.hidden=false;el.textContent=message;}
  console.error(message);
}
async function initAdminSupabase(){
  try{
    const ready=await (window.supabaseConfigReady||Promise.resolve(false));
    if(!ready||!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY){
      throw new Error("Supabase configuration could not be loaded.");
    }
    sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    return sb;
  }catch(e){ console.error(e); return null; }
}
async function getSession(){
  if(!sb) return null;
  const {data,error}=await sb.auth.getSession();
  if(error){showError(error.message);return null;}
  return data.session;
}
async function boot(){
  await initAdminSupabase();
  if(!sb){
    if(pageName==="login"){
      const m=document.getElementById("loginMsg"); if(m)m.textContent="Supabase connection could not be loaded.";
    }else showError("Supabase connection could not be loaded. Please check Vercel Environment Variables.");
    return;
  }
  if(pageName==="login"){ 
    const session=await getSession();
    if(session) location.href="dashboard.html";
    return;
  }
  const session=await getSession();
  if(!session){location.replace("admin.html");return;}
  const userEmail=document.getElementById("userEmail"); if(userEmail)userEmail.textContent=session.user.email||"Admin";
  const settingsUser=document.getElementById("settingsUser"); if(settingsUser)settingsUser.textContent=session.user.email||"Admin";
  document.querySelectorAll(".admin-menu a").forEach(a=>{if(a.dataset.page===pageName)a.classList.add("active");});
  document.getElementById("logout")?.addEventListener("click",async()=>{await sb.auth.signOut();location.replace("admin.html");});
  document.getElementById("mobileMenu")?.addEventListener("click",()=>document.querySelector(".admin-sidebar")?.classList.toggle("open"));
  if(pageName==="dashboard")await loadDashboard();
  if(pageName==="bookings"){await loadBookings(); const ref=new URLSearchParams(location.search).get("ref"); if(ref)openBooking(ref);}
  if(pageName==="calendar")await initCalendar();
  if(pageName==="vehicles")await initVehicles();
  if(pageName==="pricing")await initPricing();
  if(pageName==="settings")await initSettings();
}

/* Login is intentionally the only thing shown before authentication. */
document.getElementById("loginForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=document.getElementById("loginMsg"),button=e.target.querySelector("button");
  msg.textContent="Signing in…"; if(button)button.disabled=true;
  await initAdminSupabase();
  if(!sb){msg.textContent="Supabase connection could not be loaded.";if(button)button.disabled=false;return;}
  const {data,error}=await sb.auth.signInWithPassword({
    email:document.getElementById("email").value.trim(),
    password:document.getElementById("password").value
  });
  if(error){msg.textContent=error.message;if(button)button.disabled=false;return;}
  location.href="dashboard.html";
});

async function safeBookings(){
  const {data,error}=await sb.from("bookings").select("*, vehicle_units(display_name,registration_no)").order("created_at",{ascending:false});
  if(error){showError("Bookings could not be loaded: "+error.message);return [];}
  return data||[];
}
async function loadBookings(){
  bookings=await safeBookings(); renderBookings();
}
function renderBookings(){
  const list=document.getElementById("bookingList"),empty=document.getElementById("empty");if(!list)return;
  const q=(document.getElementById("search")?.value||"").toLowerCase(), f=document.getElementById("filter")?.value||"All";
  const shown=bookings.filter(b=>(f==="All"||b.status===f)&&JSON.stringify(b).toLowerCase().includes(q));
  ["total","pending","confirmed","completed"].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent=id==="total"?bookings.length:bookings.filter(b=>b.status===id[0].toUpperCase()+id.slice(1)).length;
  });
  if(empty)empty.style.display=shown.length?"none":"block";
  list.innerHTML=shown.map(b=>`<article class="booking-row" data-ref="${esc(b.ref)}">
    <button class="booking-row-main" data-open-ref="${esc(b.ref)}" type="button">
      <div class="booking-row-head"><div><strong>${esc(b.ref)}</strong><span>${esc(b.name||"Guest")}</span></div><span class="status-pill status-${String(b.status||"Pending").toLowerCase()}">${esc(b.status||"Pending")}</span></div>
      <div class="booking-row-grid"><span><small>Travel</small><b>${esc(b.travel_date)} · ${esc(b.pickup_time)}</b></span><span><small>Route</small><b>${esc(b.pickup)} → ${esc(b.destination)}</b></span><span><small>Vehicle</small><b>${esc(b.vehicle_units?.display_name || b.vehicle || "—")}</b></span><span><small>Passengers</small><b>${esc(b.passengers)}</b></span></div>
    </button>
    <select class="status-select" data-status-id="${esc(b.id)}"><option ${b.status==="Pending"?"selected":""}>Pending</option><option ${b.status==="Confirmed"?"selected":""}>Confirmed</option><option ${b.status==="Completed"?"selected":""}>Completed</option><option ${b.status==="Cancelled"?"selected":""}>Cancelled</option></select>
  </article>`).join("");
  list.querySelectorAll("[data-open-ref]").forEach(x=>x.addEventListener("click",()=>openBooking(x.dataset.openRef)));
  list.querySelectorAll("[data-status-id]").forEach(x=>x.addEventListener("change",()=>changeStatus(x.dataset.statusId,x.value)));
}
async function changeStatus(id,status){
  const {error}=await sb.from("bookings").update({status}).eq("id",id);
  if(error){alert(error.message);return;}
  await loadBookings();
}
function openBooking(ref){
  const b=bookings.find(x=>String(x.ref)===String(ref));if(!b)return;
  const modal=document.getElementById("bookingDetailModal");if(!modal)return;
  window.currentBooking=b;
  document.getElementById("detailRef").textContent=b.ref||"Booking";
  document.getElementById("bookingDetailBody").innerHTML=`<div class="detail-grid">
  <div><span>Customer</span><strong>${esc(b.name)}</strong></div><div><span>Phone</span><strong>${esc(b.phone)}</strong></div>
  <div><span>Email</span><strong>${esc(b.email||"—")}</strong></div><div><span>Status</span><strong>${esc(b.status)}</strong></div>
  <div><span>Service</span><strong>${esc(b.service)}</strong></div><div><span>Vehicle</span><strong>${esc(b.vehicle||"—")}</strong></div>
  <div><span>Travel date</span><strong>${esc(b.travel_date)}</strong></div><div><span>Pickup time</span><strong>${esc(b.pickup_time)}</strong></div>
  <div class="wide"><span>Pickup</span><strong>${esc(b.pickup)}</strong></div><div class="wide"><span>Destination</span><strong>${esc(b.destination)}</strong></div>
  <div><span>Passengers</span><strong>${esc(b.passengers)}</strong></div><div><span>Payment method</span><strong>${esc(b.payment_method||"—")}</strong></div><div><span>Payment status</span><strong>${esc(b.payment_status||"Unpaid")}</strong></div>
  <div class="wide"><span>Notes</span><strong>${esc(b.notes||"—")}</strong></div></div>`;
  document.getElementById("detailConfirm").textContent=b.status==="Confirmed"?"Mark Pending":"Confirm Booking";
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");
}
function closeModal(){const m=document.getElementById("bookingDetailModal");if(m){m.classList.remove("open");m.setAttribute("aria-hidden","true");}}
async function markPaid(){
  const b=window.currentBooking;if(!b)return;
  const reference=prompt("Optional payment reference / receipt number:",b.payment_reference||"");
  if(reference===null)return;
  const {error}=await sb.from("bookings").update({payment_status:"Paid",payment_reference:reference.trim()||null}).eq("id",b.id);
  if(error){alert(error.message);return;}
  closeModal();await loadBookings();
}

async function toggleConfirm(){
  const b=window.currentBooking;if(!b)return;
  const status=b.status==="Confirmed"?"Pending":"Confirmed";
  const {error}=await sb.from("bookings").update({status}).eq("id",b.id);if(error){alert(error.message);return;}
  closeModal();await loadBookings();
}
function sendWhatsApp(){
  const b=window.currentBooking;if(!b)return;
  const phone=String(b.phone||"").replace(/[^\d]/g,"");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${b.name||""}, this is Elishah Rides regarding booking ${b.ref||""}. Status: ${b.status||"Pending"}. Date: ${b.travel_date||""}. Pickup: ${b.pickup||""}. Destination: ${b.destination||""}.`)}`,"_blank");
}
function bindBookingUI(){
  document.getElementById("search")?.addEventListener("input",renderBookings);
  document.getElementById("filter")?.addEventListener("change",renderBookings);
  document.querySelectorAll("[data-close-booking-modal]").forEach(x=>x.addEventListener("click",closeModal));
  document.getElementById("detailConfirm")?.addEventListener("click",toggleConfirm);
  document.getElementById("detailWhatsApp")?.addEventListener("click",sendWhatsApp);
document.getElementById("detailPaid")?.addEventListener("click",markPaid);
}

/* Dashboard */
async function loadDashboard(){
  const data=await safeBookings();
  const counts={total:data.length,Pending:0,Confirmed:0,Completed:0,Cancelled:0,Paid:0};
  data.forEach(b=>{if(counts[b.status]!=null)counts[b.status]++;if(b.payment_status==="Paid")counts.Paid++;});
  ["total","pending","confirmed","completed","cancelled","paid"].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=counts[id[0].toUpperCase()+id.slice(1)]??0;});
  const recent=document.getElementById("recentBookings");if(!recent)return;
  recent.innerHTML=data.slice(0,8).map(b=>`<a class="simple-list-row" href="bookings.html"><div><strong>${esc(b.ref)}</strong><span>${esc(b.name)} · ${esc(b.pickup)} → ${esc(b.destination)}</span></div><b>${esc(b.status)}</b></a>`).join("")||'<p class="empty-state">No booking requests yet.</p>';
}

/* Calendar */
let calDate=new Date(),selectedDate=new Date().toISOString().slice(0,10),calBookings=[],calVehicles=[],calBlocks=[];
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseDate=s=>{const p=String(s||"").slice(0,10).split("-").map(Number);return p.length===3?new Date(p[0],p[1]-1,p[2]):null;};
async function initCalendar(){
  const [br,vr,bl]=await Promise.all([sb.from("bookings").select("*").order("travel_date"),sb.from("vehicles").select("*").order("name"),sb.from("vehicle_blocks").select("*")]);
  if(br.error)showError("Bookings could not be loaded: "+br.error.message); if(vr.error)showError("Vehicles could not be loaded: "+vr.error.message);
  calBookings=br.data||[];calVehicles=vr.data||[];calBlocks=bl.data||[];renderCalendar();renderSelectedDay();
  document.getElementById("prevMonth")?.addEventListener("click",()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCalendar();});
  document.getElementById("nextMonth")?.addEventListener("click",()=>{calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCalendar();});
  document.getElementById("todayMonth")?.addEventListener("click",()=>{calDate=new Date();selectedDate=dateKey(new Date());renderCalendar();renderSelectedDay();});
}
function renderCalendar(){
  const grid=document.getElementById("bookingCalendarGrid"),label=document.getElementById("calendarMonthLabel");if(!grid)return;
  label.textContent=calDate.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const first=new Date(calDate.getFullYear(),calDate.getMonth(),1),start=new Date(first);start.setDate(1-first.getDay());let html="";
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=dateKey(d),bs=calBookings.filter(b=>String(b.travel_date).slice(0,10)===k);
    html+=`<button type="button" class="calendar-day ${d.getMonth()===calDate.getMonth()?"":"muted"} ${k===selectedDate?"selected":""}" data-date="${k}"><span class="calendar-day-number">${d.getDate()}</span>${bs.length?`<span class="calendar-badge">${bs.length}</span><span class="calendar-event-list">${bs.slice(0,2).map(b=>`<span>${esc(b.ref)}</span>`).join("")}</span>`:""}</button>`;
  }
  grid.innerHTML=html;grid.querySelectorAll("[data-date]").forEach(x=>x.addEventListener("click",()=>{selectedDate=x.dataset.date;renderCalendar();renderSelectedDay();}));
}
function renderSelectedDay(){
  const bs=calBookings.filter(b=>String(b.travel_date).slice(0,10)===selectedDate),date=parseDate(selectedDate);
  document.getElementById("selectedDayLabel").textContent=date?.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})||selectedDate;
  document.getElementById("selectedDayCount").textContent=`${bs.length} booking${bs.length===1?"":"s"}`;
  const list=document.getElementById("selectedDayBookings");list.innerHTML=bs.map(b=>`<button class="day-booking" data-open-cal-ref="${esc(b.ref)}"><div class="day-booking-top"><strong>${esc(b.ref)}</strong><span class="status-pill status-${String(b.status).toLowerCase()}">${esc(b.status)}</span></div><div class="day-booking-main">${esc(b.name)} · ${esc(b.vehicle||"Vehicle")}</div><div class="day-booking-sub">${esc(b.pickup)} → ${esc(b.destination)}</div></button>`).join("")||'<p class="empty-state">No bookings for this date.</p>';
  list.querySelectorAll("[data-open-cal-ref]").forEach(x=>x.addEventListener("click",()=>location.href=`bookings.html?ref=${encodeURIComponent(x.dataset.openCalRef)}`));
  const blockedIds=new Set(calBlocks.filter(x=>String(x.block_date).slice(0,10)===selectedDate).map(x=>String(x.vehicle_id)));
  const bookedNames=new Set(bs.map(b=>String(b.vehicle||"").trim().toLowerCase()));let free=0,busy=0;
  document.getElementById("selectedDayVehicles").innerHTML=calVehicles.filter(v=>v.active!==false).map(v=>{const b=blockedIds.has(String(v.id)),booked=bookedNames.has(String(v.name).trim().toLowerCase()),isBusy=b||booked;if(isBusy)busy++;else free++;return `<div class="vehicle-status-row"><div><strong>${esc(v.name)}</strong><small>${b?"Blocked":booked?"Booked":"Available"}</small></div><span class="availability-dot ${isBusy?"busy":"free"}">${isBusy?"Unavailable":"Available"}</span></div>`}).join("");
  document.getElementById("selectedVehicleSummary").textContent=`${free} available · ${busy} unavailable`;
}

/* V15 Vehicles — actual vehicle units */
async function initVehicles(){
  await loadVehicleUnits();
  await loadVehicleUnitBlocks();
  document.getElementById("vehicleUnitForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const msg=document.getElementById("vehicleUnitMsg");
    const payload={category:document.getElementById("unitCategory").value,display_name:document.getElementById("unitName").value.trim(),registration_no:document.getElementById("unitRegistration").value.trim()||null,capacity:Number(document.getElementById("unitCapacity").value||1),luggage:Number(document.getElementById("unitLuggage").value||0),notes:document.getElementById("unitNotes").value.trim()||null,active:true};
    const {error}=await sb.from("vehicle_units").insert(payload);
    if(error){msg.textContent=error.message;return;}
    msg.textContent="Vehicle added successfully.";e.target.reset();document.getElementById("unitCapacity").value=3;document.getElementById("unitLuggage").value=2;await loadVehicleUnits();await loadVehicleUnitBlocks();
  });
  document.getElementById("blockUnit")?.addEventListener("click",async()=>{
    const vehicle_unit_id=document.getElementById("unitSelect").value,block_date=document.getElementById("unitBlockDate").value,reason=document.getElementById("unitBlockReason").value.trim(),msg=document.getElementById("unitBlockMsg");
    if(!vehicle_unit_id||!block_date){msg.textContent="Select a vehicle and date.";return;}
    const {error}=await sb.from("vehicle_unit_blocks").insert({vehicle_unit_id,block_date,reason:reason||null});
    if(error){msg.textContent=error.code==="23505"?"That vehicle is already blocked on this date.":error.message;return;}
    msg.textContent="Vehicle blocked successfully.";document.getElementById("unitBlockReason").value="";await loadVehicleUnitBlocks();
  });
}
async function loadVehicleUnits(){
  const {data,error}=await sb.from("vehicle_units").select("*").order("category").order("display_name");
  if(error){showError(error.message);return;}
  const list=document.getElementById("vehicleUnitsList"),select=document.getElementById("unitSelect");
  if(select)select.innerHTML=(data||[]).map(v=>`<option value="${v.id}">${esc(v.display_name)} — ${esc(v.category)}</option>`).join("");
  if(!list)return;
  list.innerHTML=(data||[]).map(v=>`<article class="admin-card"><div class="admin-card-head"><div><b>${esc(v.display_name)}</b><span>${esc(v.category)}${v.registration_no?" · "+esc(v.registration_no):""}</span></div><button class="btn btn-small ${v.active===false?"danger":"primary"}" data-toggle-unit="${v.id}" data-active="${v.active!==false}">${v.active===false?"Activate":"Active"}</button></div><div class="admin-details"><div><span>Seats</span><b>${esc(v.capacity)}</b></div><div><span>Luggage</span><b>${esc(v.luggage)}</b></div><div><span>Notes</span><b>${esc(v.notes||"—")}</b></div></div></article>`).join("")||'<p class="empty-state">No actual vehicles added yet.</p>';
  list.querySelectorAll("[data-toggle-unit]").forEach(btn=>btn.addEventListener("click",async()=>{const next=btn.dataset.active!=="true";const {error}=await sb.from("vehicle_units").update({active:next}).eq("id",btn.dataset.toggleUnit);if(error)alert(error.message);else loadVehicleUnits();}));
}
async function loadVehicleUnitBlocks(){
  const {data,error}=await sb.from("vehicle_unit_blocks").select("id,vehicle_unit_id,block_date,reason,vehicle_units(display_name,category)").order("block_date");
  if(error){showError(error.message);return;}
  const box=document.getElementById("vehicleUnitBlocks");if(!box)return;
  box.innerHTML=(data||[]).map(b=>`<div class="vehicle-block"><h3>${esc(b.vehicle_units?.display_name||"Vehicle")} <small>· ${esc(b.vehicle_units?.category||"")}</small></h3><div class="block-chips"><span class="block-chip">${esc(b.block_date)}${b.reason?" — "+esc(b.reason):""}<button type="button" data-remove-unit-block="${b.id}">×</button></span></div></div>`).join("")||'<p class="empty-state">No blocked dates.</p>';
  box.querySelectorAll("[data-remove-unit-block]").forEach(x=>x.addEventListener("click",async()=>{const {error}=await sb.from("vehicle_unit_blocks").delete().eq("id",x.dataset.removeUnitBlock);if(error)alert(error.message);else loadVehicleUnitBlocks();}));
}

/* Pricing */
async function initPricing(){
  await loadPricing();
  document.getElementById("pricingForm")?.addEventListener("submit",async e=>{e.preventDefault();const payload={service:priceService.value,vehicle:priceVehicle.value.trim()||null,trip_type:priceTripType.value.trim()||null,base_price:Number(priceBase.value||0),per_km:Number(priceKm.value||0),per_day:Number(priceDay.value||0),currency:"USD",active:true};const {error}=await sb.from("pricing_rules").insert(payload);if(error){alert(error.message);return;}e.target.reset();loadPricing();});
}
async function loadPricing(){
  const tbody=document.getElementById("pricingRows");if(!tbody)return;const {data,error}=await sb.from("pricing_rules").select("*").order("service").order("vehicle");
  if(error){tbody.innerHTML=`<tr><td colspan="7">${esc(error.message)}</td></tr>`;return;}
  tbody.innerHTML=(data||[]).map(p=>`<tr><td>${esc(p.service)}</td><td>${esc(p.vehicle||"—")}</td><td>${esc(p.trip_type||"—")}</td><td>$${Number(p.base_price||0).toFixed(2)}</td><td>$${Number(p.per_km||0).toFixed(2)}</td><td>$${Number(p.per_day||0).toFixed(2)}</td><td><button class="btn btn-small danger" data-delete-price="${p.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="7">No pricing rules yet.</td></tr>';
  tbody.querySelectorAll("[data-delete-price]").forEach(x=>x.addEventListener("click",async()=>{if(!confirm("Delete this pricing rule?"))return;const {error}=await sb.from("pricing_rules").delete().eq("id",x.dataset.deletePrice);if(error)alert(error.message);else loadPricing();}));
}

/* Settings */
async function initSettings(){
  const provider=document.getElementById("v8ProviderLabel");if(provider)provider.textContent=window.ELISHAH_PAYMENT_PROVIDER&&window.ELISHAH_PAYMENT_PROVIDER!=="none"?window.ELISHAH_PAYMENT_PROVIDER.toUpperCase():"Not configured";
  const status=document.getElementById("supabaseStatus");if(status)status.textContent=sb?"Connected":"Not connected";
}

document.addEventListener("DOMContentLoaded",async()=>{bindBookingUI();await boot();});
