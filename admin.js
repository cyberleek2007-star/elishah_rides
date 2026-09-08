(function(){
'use strict';
let sb=null, bookings=[], units=[], blocks=[], tables={}, communityPhotos=[], communityComments=[];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2600)};
const tableMap={tours:'tour_packages',destinations:'destinations',pricing:'pricing_rules',testimonials:'testimonials',gallery:'gallery_items',messages:'contact_messages'};
const titles={overview:['OPERATIONS','Good evening, Admin.'],bookings:['JOURNEY MANAGEMENT','Bookings'],fleet:['VEHICLE OPERATIONS','Fleet'],availability:['SCHEDULING','Availability'],customers:['RELATIONSHIPS','Customers'],tours:['CONTENT STUDIO','Tour Packages'],destinations:['SRI LANKA','Destinations'],pricing:['COMMERCIAL CONTROL','Pricing'],testimonials:['SOCIAL PROOF','Testimonials'],gallery:['VISUAL STORY','Gallery'],community:['TRAVELLER MODERATION','Community'],messages:['CONTACT DESK','Messages']};
async function init(){
 try{
  await window.supabaseConfigReady;
  const cfg=window.supabaseConfig||{};
  const url=cfg.url||window.SUPABASE_URL;
  const anonKey=cfg.anonKey||window.SUPABASE_ANON_KEY;
  if(!url||!anonKey) throw new Error('Supabase configuration is missing.');
  sb=window.supabase.createClient(url,anonKey);
  const {data:{session}}=await sb.auth.getSession();
  if(session) await handleSession(session); else showLogin();
  sb.auth.onAuthStateChange(async (event,nextSession)=>{ await handleSession(nextSession); });
 }
 catch(e){console.error(e); showLogin(); $('#loginResult').textContent='Admin configuration could not be loaded.'}
 bind();
}
async function handleSession(session){
 if(!session){ showLogin(); return; }
 const {data:adminRow,error}=await sb.from('admin_users').select('user_id,role').eq('user_id',session.user.id).maybeSingle();
 if(error){
  console.error('Admin access check:',error);
  await sb.auth.signOut();
  showLogin();
  $('#loginResult').textContent='Admin access could not be verified.';
  return;
 }
 if(!adminRow || adminRow.role!=='admin'){
  await sb.auth.signOut();
  showLogin();
  $('#loginResult').textContent='This account is not authorized for the Admin Command Center.';
  return;
 }
 showApp(session.user);
}
function bind(){
 $('#loginForm').addEventListener('submit',login); $('#logoutBtn').addEventListener('click',()=>sb?.auth.signOut()); $('#refreshBtn').addEventListener('click',loadAll);
 $('#sideNav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)go(b.dataset.page)});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});
 $('#bookingSearch').addEventListener('input',renderBookings);$('#bookingStatus').addEventListener('change',renderBookings);$('#clearBookingFilters').addEventListener('click',()=>{$('#bookingSearch').value='';$('#bookingStatus').value='';renderBookings()});
 $('#exportBookings').addEventListener('click',exportCSV);$('#blockForm').addEventListener('submit',addBlock);
 $('#refreshCommunityBtn')?.addEventListener('click',loadCommunity);$('#fleetCategoryFilter')?.addEventListener('change',renderFleet);$('#addVehicleBtn').addEventListener('click',()=>vehicleModal());$('#addTourBtn').addEventListener('click',()=>contentModal('tours'));$('#addDestinationBtn').addEventListener('click',()=>contentModal('destinations'));$('#addPricingBtn').addEventListener('click',()=>contentModal('pricing'));$('#addTestimonialBtn').addEventListener('click',()=>contentModal('testimonials'));$('#addGalleryBtn').addEventListener('click',()=>contentModal('gallery'));
 document.addEventListener('click',handleActions);
 setInterval(clock,1000);clock();
}
function showLogin(){ $('#loginView').classList.remove('hidden');$('#appView').classList.add('hidden') }
function showApp(user){ $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');$('#adminEmail').textContent=user?.email||'Admin';loadAll(); }
async function login(e){e.preventDefault();const r=$('#loginResult');r.textContent='';if(!sb){r.textContent='Admin service is not connected.';return}const {error}=await sb.auth.signInWithPassword({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value});if(error)r.textContent=error.message}
function go(page){$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===page));$$('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));$('#pageKicker').textContent=titles[page][0];$('#pageTitle').textContent=titles[page][1];window.scrollTo({top:0,behavior:'smooth'})}
function clock(){const d=new Date();try{$('#liveClock').textContent=new Intl.DateTimeFormat('en-LK',{timeZone:'Asia/Colombo',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(d)}catch{}} 
async function loadAll(){if(!sb)return;toast('Refreshing command center…');await Promise.all([loadBookings(),loadUnits(),loadBlocks(),loadContent(),loadMessages(),loadCommunity()]);renderAll();toast('Dashboard refreshed')}
async function safeSelect(table,columns='*',order='created_at',limit=300){const q=sb.from(table).select(columns);const r=order?q.order(order,{ascending:false}).limit(limit):await q.limit(limit);return r}
async function loadBookings(){const r=await safeSelect('bookings');if(r.error){console.error(r.error);bookings=[];return}bookings=r.data||[]}
async function loadUnits(){const r=await safeSelect('vehicle_units');if(r.error){console.warn('vehicle_units',r.error.message);units=[];return}units=r.data||[]}
async function loadBlocks(){const r=await safeSelect('vehicle_unit_blocks');if(r.error){blocks=[];return}blocks=r.data||[]}
async function loadContent(){for(const [key,table] of Object.entries(tableMap)){const r=await safeSelect(table);tables[key]=r.error?[]:(r.data||[])} }
async function loadMessages(){const r=await safeSelect('contact_messages');tables.messages=r.error?[]:(r.data||[])}
function renderAll(){renderStats();renderLatest();renderBookings();renderFleet();renderBlocks();renderCustomers();renderContent('tours');renderContent('destinations');renderContent('pricing');renderContent('testimonials');renderGallery();renderMessages();renderCommunity();fillBlockVehicles()}
function renderStats(){const p=bookings.filter(b=>b.status==='Pending').length,c=bookings.filter(b=>b.status==='Confirmed').length,paid=bookings.filter(b=>b.status==='Paid'||b.payment_status==='Paid').length;$('#statPending').textContent=p;$('#statConfirmed').textContent=c;$('#statPaid').textContent=paid;$('#statVehicles').textContent=units.filter(v=>v.active!==false).length;$('#pendingBadge').textContent=p;$('#messageBadge').textContent=(tables.messages||[]).filter(m=>!m.read_at).length;$('#communityBadge').textContent=communityPhotos.filter(x=>x.status==='pending').length+communityComments.filter(x=>x.status==='pending').length}
function renderLatest(){const el=$('#latestBookings');if(!bookings.length){el.className='booking-list empty';el.innerHTML='No bookings yet.';return}el.className='booking-list';el.innerHTML=bookings.slice(0,6).map(b=>`<div class="booking-row"><div><strong>${esc(b.ref||'—')}</strong><small>${esc(b.service||'Journey')}</small></div><div><strong>${esc(b.name||'Traveller')}</strong><small>${esc(b.pickup||'')} → ${esc(b.destination||'')}</small></div><span class="status ${String(b.status||'Pending').toLowerCase()}">${esc(b.status||'Pending')}</span></div>`).join('')}
function renderBookings(){const q=($('#bookingSearch')?.value||'').toLowerCase();const st=$('#bookingStatus')?.value||'';const rows=bookings.filter(b=>{const hay=[b.ref,b.name,b.phone,b.pickup,b.destination,b.vehicle,b.service].join(' ').toLowerCase();return (!q||hay.includes(q))&&(!st||b.status===st)});$('#bookingsTable').innerHTML=rows.length?rows.map(b=>`<tr><td><strong>${esc(b.ref||'—')}</strong><small>${esc(b.created_at?new Date(b.created_at).toLocaleString(): '')}</small></td><td><strong>${esc(b.name||'—')}</strong><small>${esc(b.phone||'')}</small></td><td class="route-cell"><strong>${esc(b.service||'—')}</strong><span>${esc(b.pickup||'')} → ${esc(b.destination||'')}</span></td><td>${esc(b.travel_date||'—')}<br><small>${esc(b.pickup_time||'')}</small></td><td>${esc(b.vehicle_unit_name||b.vehicle||'—')}</td><td>${esc(b.payment_method||'—')}<br><small>${esc(b.payment_status||'Unpaid')}</small></td><td><span class="status ${String(b.status||'Pending').toLowerCase()}">${esc(b.status||'Pending')}</span></td><td><div class="row-actions"><button class="small-btn" data-action="view-booking" data-id="${esc(b.id)}">View</button><button class="small-btn" data-action="status" data-id="${esc(b.id)}">Status</button></div></td></tr>`).join(''):'<tr><td colspan="8"><div class="empty-state">No bookings match your filters.</div></td></tr>'}
function renderFleet(){
 const el=$('#fleetGrid'),filter=$('#fleetCategoryFilter')?.value||'';
 const visible=units.filter(v=>!filter||String(v.category||'')===filter);
 const active=units.filter(v=>v.active!==false).length,inactive=units.length-active;
 const capacity=units.reduce((n,v)=>n+(Number(v.capacity)||0),0);
 if($('#fleetActiveCount'))$('#fleetActiveCount').textContent=active;
 if($('#fleetInactiveCount'))$('#fleetInactiveCount').textContent=inactive;
 if($('#fleetCapacityTotal'))$('#fleetCapacityTotal').textContent=capacity;
 if(!visible.length){el.innerHTML='<div class="empty-state">No vehicles match this category. Add a vehicle or choose another category.</div>';return}
 el.innerHTML=visible.map(v=>`<article class="fleet-card"><div class="fleet-top"><div class="fleet-icon">◇</div><span class="${v.active!==false?'active-pill':'inactive-pill'}">● ${v.active!==false?'Active':'Inactive'}</span></div><div class="fleet-category">${esc(v.category||'Fleet unit')}</div><h3>${esc(v.name||v.vehicle_name||v.category||'Vehicle')}</h3><p>Passenger capacity · ${esc(v.capacity??'—')}</p><div class="fleet-meta"><span>Capacity <b>${esc(v.capacity??'—')}</b></span><span>ID <b>${esc(String(v.id||'').slice(0,8))}</b></span></div><div class="fleet-actions"><button class="small-btn" data-action="edit-vehicle" data-id="${esc(v.id)}">Edit</button><button class="small-btn" data-action="toggle-vehicle" data-id="${esc(v.id)}">${v.active!==false?'Deactivate':'Activate'}</button></div></article>`).join('')
}
function fillBlockVehicles(){$('#blockVehicle').innerHTML=units.length?units.map(v=>`<option value="${esc(v.id)}">${esc(v.name||v.category||'Vehicle')} — ${esc(v.category||'')}</option>`).join(''):'<option value="">No vehicles</option>'}
function renderBlocks(){const el=$('#blocksList');if(!blocks.length){el.innerHTML='<div class="empty-state">No blackout dates scheduled.</div>';return}el.innerHTML=blocks.slice().sort((a,b)=>String(a.block_date).localeCompare(String(b.block_date))).map(x=>{const v=units.find(u=>u.id===x.vehicle_unit_id);return `<div class="block-row"><div><strong>${esc(v?.name||v?.category||'Vehicle')}</strong><small>${esc(x.block_date||'')} · ${esc(x.reason||'Unavailable')}</small></div><button class="small-btn" data-action="delete-block" data-id="${esc(x.id)}">Remove</button></div>`}).join('')}
function renderCustomers(){const map=new Map();bookings.forEach(b=>{const key=(b.phone||b.email||b.name||'').toLowerCase();if(!key)return;const x=map.get(key)||{name:b.name||'Traveller',phone:b.phone||'',email:b.email||'',count:0,last:b.travel_date||''};x.count++;if((b.travel_date||'')>(x.last||''))x.last=b.travel_date;map.set(key,x)});$('#customersTable').innerHTML=[...map.values()].sort((a,b)=>b.count-a.count).map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.phone)}</td><td>${esc(x.email)}</td><td>${x.count}</td><td>${esc(x.last||'—')}</td></tr>`).join('')||'<tr><td colspan="5"><div class="empty-state">Customer profiles will appear as bookings arrive.</div></td></tr>'}
function renderContent(key){const el=$('#'+({tours:'tourGrid',destinations:'destinationGrid',pricing:'pricingGrid',testimonials:'testimonialGrid'}[key]));const arr=tables[key]||[];if(!arr.length){el.innerHTML='<div class="empty-state">No records yet. Use the button above to add the first one.</div>';return}el.innerHTML=arr.map(x=>{let title=x.title||x.name||x.package_name||x.destination_name||x.rule_name||'Untitled';let desc=x.short_description||x.description||x.tagline||x.review||'';let price=x.starting_price??x.price??x.amount;return `<article class="content-card"><span class="eyebrow">${esc(key.replace(/s$/,'').toUpperCase())}</span><h3>${esc(title)}</h3><p>${esc(desc).slice(0,180)}</p><div class="content-bottom"><span class="price">${price!=null?'$'+esc(price):''}</span><div><button class="small-btn" data-action="edit-content" data-type="${key}" data-id="${esc(x.id)}">Edit</button> <button class="small-btn" data-action="delete-content" data-type="${key}" data-id="${esc(x.id)}">Delete</button></div></div></article>`}).join('')}
function renderGallery(){const el=$('#galleryGrid'),arr=tables.gallery||[];if(!arr.length){el.innerHTML='<div class="empty-state">No gallery images yet.</div>';return}el.innerHTML=arr.map(x=>`<div class="gallery-item">${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.title||'Elishah Rides')}">`:''}<div class="gallery-overlay">${esc(x.title||x.caption||'Travel experience')} <button class="small-btn" data-action="delete-content" data-type="gallery" data-id="${esc(x.id)}">Delete</button></div></div>`).join('')}

async function loadCommunity(){
  if(!sb)return;
  const [photosRes,commentsRes]=await Promise.all([
    sb.from('community_photos').select('id,name,caption,storage_path,status,created_at').order('created_at',{ascending:false}).limit(100),
    sb.from('community_comments').select('id,name,comment,status,created_at').order('created_at',{ascending:false}).limit(100)
  ]);
  if(photosRes.error) console.error('community_photos',photosRes.error);
  if(commentsRes.error) console.error('community_comments',commentsRes.error);
  communityPhotos=photosRes.error?[]:(photosRes.data||[]);
  communityComments=commentsRes.error?[]:(commentsRes.data||[]);
  renderCommunity();
}
function communityPhotoUrl(path){
  if(!path)return '';
  const {data}=sb.storage.from('community-gallery').getPublicUrl(path);
  return data?.publicUrl||'';
}
function renderCommunity(){
  const pg=$('#communityPhotosAdmin'), cg=$('#communityCommentsAdmin');
  const pendingPhotos=communityPhotos.filter(x=>x.status==='pending');
  const pendingComments=communityComments.filter(x=>x.status==='pending');
  if($('#communityPhotoCount'))$('#communityPhotoCount').textContent=`${pendingPhotos.length} pending`;
  if($('#communityCommentCount'))$('#communityCommentCount').textContent=`${pendingComments.length} pending`;
  if(pg)pg.innerHTML=communityPhotos.length?communityPhotos.map(x=>{
    const url=communityPhotoUrl(x.storage_path);
    return `<article class="content-card community-admin-card">${url?`<img src="${esc(url)}" alt="${esc(x.name||'Traveller photo')}" style="width:100%;height:180px;object-fit:cover;border-radius:14px;margin-bottom:14px;">`:''}<span class="eyebrow">${esc(x.status||'pending')}</span><h3>${esc(x.name||'Traveller')}</h3><p>${esc(x.caption||'No caption')}</p><small>${esc(x.created_at?new Date(x.created_at).toLocaleString():'')}</small><div class="content-bottom"><div>${x.status!=='approved'?`<button class="small-btn" data-action="community-approve-photo" data-id="${esc(x.id)}">Approve</button>`:''}${x.status!=='rejected'?`<button class="small-btn" data-action="community-reject-photo" data-id="${esc(x.id)}">Reject</button>`:''}<button class="small-btn" data-action="community-delete-photo" data-id="${esc(x.id)}">Delete</button></div></div></article>`;
  }).join(''):'<div class="empty-state">No traveller photo submissions.</div>';
  if(cg)cg.innerHTML=communityComments.length?communityComments.map(x=>`<article class="content-card community-admin-card"><span class="eyebrow">${esc(x.status||'pending')}</span><h3>${esc(x.name||'Traveller')}</h3><p>“${esc(x.comment||'')}”</p><small>${esc(x.created_at?new Date(x.created_at).toLocaleString():'')}</small><div class="content-bottom"><div>${x.status!=='approved'?`<button class="small-btn" data-action="community-approve-comment" data-id="${esc(x.id)}">Approve</button>`:''}${x.status!=='rejected'?`<button class="small-btn" data-action="community-reject-comment" data-id="${esc(x.id)}">Reject</button>`:''}<button class="small-btn" data-action="community-delete-comment" data-id="${esc(x.id)}">Delete</button></div></div></article>`).join(''):'<div class="empty-state">No traveller comments.</div>';
}
async function communityStatus(table,id,status){
  const {error}=await sb.from(table).update({status}).eq('id',id);
  if(error){toast(error.message);return}
  toast(`Community item ${status}`); await loadCommunity(); renderAll();
}
async function deleteCommunityPhoto(id){
  const item=communityPhotos.find(x=>x.id===id); if(!item||!confirm('Delete this traveller photo?'))return;
  const {error}=await sb.from('community_photos').delete().eq('id',id);
  if(error){toast(error.message);return}
  if(item.storage_path)await sb.storage.from('community-gallery').remove([item.storage_path]);
  toast('Traveller photo deleted'); await loadCommunity(); renderAll();
}
async function deleteCommunityComment(id){
  if(!confirm('Delete this traveller comment?'))return;
  const {error}=await sb.from('community_comments').delete().eq('id',id);
  if(error){toast(error.message);return}
  toast('Traveller comment deleted'); await loadCommunity(); renderAll();
}

function renderMessages(){const el=$('#messagesList'),arr=tables.messages||[];if(!arr.length){el.innerHTML='<div class="empty-state">No contact messages yet.</div>';return}el.innerHTML=arr.map(m=>`<article class="message-card"><header><div><h3>${esc(m.subject||'New enquiry')}</h3><small>${esc(m.name||'Traveller')} · ${esc(m.email||m.phone||'')}</small></div><small>${esc(m.created_at?new Date(m.created_at).toLocaleString():'')}</small></header><p>${esc(m.message||'')}</p></article>`).join('')}
async function updateBooking(id){const b=bookings.find(x=>x.id===id);if(!b)return;const current=b.status||'Pending';const opts=['Pending','Confirmed','Paid','Cancelled','Completed'];const next=prompt('Set booking status:\n\n'+opts.join(' / '),current);if(!next||!opts.includes(next))return;const patch={status:next};if(next==='Paid')patch.payment_status='Paid';const {error}=await sb.from('bookings').update(patch).eq('id',id);if(error){toast(error.message);return}toast('Booking status updated');await loadBookings();renderAll()}
function bookingModal(id){const b=bookings.find(x=>x.id===id);if(!b)return;openModal(`<h3>${esc(b.ref||'Booking')}</h3><div class="modal-grid"><label>Traveller<input value="${esc(b.name)}" disabled></label><label>Phone<input value="${esc(b.phone)}" disabled></label><label>Service<input value="${esc(b.service)}" disabled></label><label>Date<input value="${esc(b.travel_date)} ${esc(b.pickup_time)}" disabled></label><label class="full">Route<input value="${esc(b.pickup)} → ${esc(b.destination)}" disabled></label><label>Vehicle<input value="${esc(b.vehicle_unit_name||b.vehicle||'—')}" disabled></label><label>Payment<input value="${esc(b.payment_method||'—')} · ${esc(b.payment_status||'Unpaid')}" disabled></label><label class="full">Requests<textarea disabled>${esc(b.notes||'No additional requests')}</textarea></label></div><div class="modal-actions"><button class="outline-btn" data-close-modal>Close</button><button class="lux-btn compact" data-modal-status="${esc(id)}">Change status</button></div>`)}
function vehicleModal(id){const v=id?units.find(x=>x.id===id):{};openModal(`<h3>${id?'Edit vehicle':'Add vehicle'}</h3><form id="vehicleForm"><div class="modal-grid"><label>Name<input name="name" value="${esc(v?.name||'')}" required></label><label>Category<select name="category" required><option value="">Select category</option>${['Bike','Scooter','Flex','Car','Mini Van','Van','Bus'].map(x=>`<option value="${esc(x)}" ${v?.category===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Capacity<input name="capacity" type="number" min="1" value="${esc(v?.capacity??2)}"></label><label>Active<select name="active"><option value="true" ${v?.active!==false?'selected':''}>Active</option><option value="false" ${v?.active===false?'selected':''}>Inactive</option></select></label></div><div class="modal-actions"><button type="button" class="outline-btn" data-close-modal>Cancel</button><button class="lux-btn compact">Save vehicle</button></div></form>`);$('#vehicleForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const payload={name:f.get('name'),category:f.get('category'),capacity:Number(f.get('capacity')||2),active:f.get('active')==='true'};const q=id?sb.from('vehicle_units').update(payload).eq('id',id):sb.from('vehicle_units').insert(payload);const {error}=await q;if(error){toast(error.message);return}closeModal();toast('Vehicle saved');await loadUnits();renderAll()})}
async function addBlock(e){e.preventDefault();const vehicle_unit_id=$('#blockVehicle').value,block_date=$('#blockDate').value,reason=$('#blockReason').value.trim();if(!vehicle_unit_id||!block_date)return;const {error}=await sb.from('vehicle_unit_blocks').insert({vehicle_unit_id,block_date,reason:reason||null});if(error){$('#blockResult').textContent=error.message;return}$('#blockResult').textContent='';e.currentTarget.reset();toast('Vehicle date blocked');await loadBlocks();renderAll()}
async function deleteBlock(id){if(!confirm('Remove this blackout date?'))return;const {error}=await sb.from('vehicle_unit_blocks').delete().eq('id',id);if(error){toast(error.message);return}toast('Blackout removed');await loadBlocks();renderAll()}
async function toggleVehicle(id){const v=units.find(x=>x.id===id);if(!v)return;const {error}=await sb.from('vehicle_units').update({active:!v.active}).eq('id',id);if(error){toast(error.message);return}await loadUnits();renderAll();toast(v.active?'Vehicle deactivated':'Vehicle activated')}
function contentModal(key,id){const arr=tables[key]||[],v=id?arr.find(x=>x.id===id):{};const labels={tours:['title','short_description','description','starting_price'],destinations:['name','tagline','description','duration'],pricing:['rule_name','service','amount','currency'],testimonials:['name','country','rating','review'],gallery:['title','image_url','caption','category']};const fields=labels[key];openModal(`<h3>${id?'Edit':'Add'} ${key.replace(/s$/,'')}</h3><form id="contentForm"><div class="modal-grid">${fields.map((f,i)=>{const multi=['description','review','caption'].includes(f);return `<label class="${multi?'full':''}">${esc(f.replace(/_/g,' '))}${multi?`<textarea name="${f}">${esc(v?.[f]||'')}</textarea>`:`<input name="${f}" value="${esc(v?.[f]??'')}" ${f==='title'||f==='name'?'required':''}>`}</label>`}).join('')}</div><div class="modal-actions"><button type="button" class="outline-btn" data-close-modal>Cancel</button><button class="lux-btn compact">Save</button></div></form></div>`);$('#contentForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),payload={};fields.forEach(x=>{let val=f.get(x);if(['starting_price','amount','rating'].includes(x)&&val!=='')val=Number(val);payload[x]=val||null});const table=tableMap[key];const q=id?sb.from(table).update(payload).eq('id',id):sb.from(table).insert(payload);const {error}=await q;if(error){toast(error.message);return}closeModal();toast('Content saved');await loadContent();renderAll()})}
async function deleteContent(key,id){if(!confirm('Delete this content item?'))return;const {error}=await sb.from(tableMap[key]).delete().eq('id',id);if(error){toast(error.message);return}toast('Item deleted');await loadContent();renderAll()}
function handleActions(e){const b=e.target.closest('[data-action]');if(b){const id=b.dataset.id;switch(b.dataset.action){case'view-booking':bookingModal(id);break;case'status':updateBooking(id);break;case'edit-vehicle':vehicleModal(id);break;case'toggle-vehicle':toggleVehicle(id);break;case'delete-block':deleteBlock(id);break;case'edit-content':contentModal(b.dataset.type,id);break;case'delete-content':deleteContent(b.dataset.type,id);break;
case'community-approve-photo':communityStatus('community_photos',id,'approved');break;
case'community-reject-photo':communityStatus('community_photos',id,'rejected');break;
case'community-delete-photo':deleteCommunityPhoto(id);break;
case'community-approve-comment':communityStatus('community_comments',id,'approved');break;
case'community-reject-comment':communityStatus('community_comments',id,'rejected');break;
case'community-delete-comment':deleteCommunityComment(id);break}}if(e.target.matches('[data-close-modal]'))closeModal();if(e.target.matches('[data-modal-status]')){closeModal();updateBooking(e.target.dataset.modalStatus)}}
function openModal(html){$('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal">${html}</div></div>`;$('#modalRoot').querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()})}
function closeModal(){$('#modalRoot').innerHTML=''}
function exportCSV(){const head=['Reference','Name','Phone','Service','Pickup','Destination','Date','Time','Vehicle','Payment Method','Payment Status','Status'];const rows=bookings.map(b=>[b.ref,b.name,b.phone,b.service,b.pickup,b.destination,b.travel_date,b.pickup_time,b.vehicle_unit_name||b.vehicle,b.payment_method,b.payment_status,b.status]);const csv=[head,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='elishah-rides-bookings.csv';a.click();URL.revokeObjectURL(a.href)}
init();
})();
