// Study Planner - app.js
const STORAGE_KEY = 'studyPlanner.v1'
let state = {
  subjects: [],
  events: {}, // date -> array of events {type,title,subject,completed}
  week: {start:'08:00', end:'20:00', slots:{}} // slots: dayIndex -> [{subject,hours}]
}

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function load(){const raw=localStorage.getItem(STORAGE_KEY);if(raw)state=JSON.parse(raw)}

// helpers
function formatDate(d){return d.toISOString().slice(0,10)}
function parseDate(s){return new Date(s+'T00:00:00')}

// UI refs
const subjectsList = document.getElementById('subjectsList')
const subjectForm = document.getElementById('subjectForm')
const subjectName = document.getElementById('subjectName')
const subjectColor = document.getElementById('subjectColor')
const subjectHours = document.getElementById('subjectHours')
const monthLabel = document.getElementById('monthLabel')
const calendar = document.getElementById('calendar')
const calendarGrid = document.getElementById('calendarGrid')
const weekdayHeaders = document.getElementById('weekdayHeaders')
const prevMonth = document.getElementById('prevMonth')
const nextMonth = document.getElementById('nextMonth')
const todayName = document.getElementById('todayName')
const todayDate = document.getElementById('todayDate')
const selectedDateLabel = document.getElementById('selectedDateLabel')
const eventsList = document.getElementById('eventsList')
const addEventForm = document.getElementById('addEventForm')
const addTitle = document.getElementById('addTitle')
const addType = document.getElementById('addType')
const addSubject = document.getElementById('addSubject')
const eventTitle = document.getElementById('eventTitle')
const eventType = document.getElementById('eventType')
const eventDate = document.getElementById('eventDate')
const quickEventForm = document.getElementById('quickEventForm')
const exportBtn = document.getElementById('exportBtn')
const importFile = document.getElementById('importFile')
const clearBtn = document.getElementById('clearBtn')
const weekStart = document.getElementById('weekStart')
const weekEnd = document.getElementById('weekEnd')
const applyWeekTimes = document.getElementById('applyWeekTimes')
const weekGrid = document.getElementById('weekGrid')

let viewDate = new Date()
let selectedDate = formatDate(new Date())

// basic runtime sanity check: if core DOM nodes are missing, show a visible banner
if(!calendarGrid || !weekdayHeaders || !monthLabel){
  const banner = document.createElement('div')
  banner.style.cssText = 'background:#ffeef6;color:#6b2145;padding:12px;text-align:center;font-weight:600'
  banner.textContent = 'Study Planner: failed to initialize calendar UI — try reloading the page.'
  document.body.insertBefore(banner, document.body.firstChild)
}

function init(){
  load()
  renderSubjects()
  initListeners()
  renderCalendar()
  renderTodayInfo()
  renderWeekGrid()
}

function initListeners(){
  subjectForm.addEventListener('submit',e=>{e.preventDefault();addSubjectObj();})
  quickEventForm.addEventListener('submit',e=>{e.preventDefault();addQuickEvent();})
  prevMonth.addEventListener('click',()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar()})
  nextMonth.addEventListener('click',()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar()})
  addEventForm.addEventListener('submit',e=>{e.preventDefault();addEventToDay()})
  exportBtn.addEventListener('click',exportData)
  importFile.addEventListener('change',handleImport)
  clearBtn.addEventListener('click',()=>{
    if(!confirm('Clear all saved data?')) return
    state = { subjects: [], events: {}, week: { start: '08:00', end: '20:00', slots: {} } }
    save()
    renderSubjects()
    renderCalendar()
    renderWeekGrid()
    renderDayDetails()
  })
  applyWeekTimes.addEventListener('click',()=>{state.week.start=weekStart.value;state.week.end=weekEnd.value;save();renderWeekGrid()})
}

function addSubjectObj(){
  const name = subjectName.value.trim(); if(!name) return;
  const color = subjectColor.value || '#ffb6c1'
  const hours = Number(subjectHours.value)||0
  state.subjects.push({id:Date.now(),name,color,hours})
  subjectName.value=''; subjectHours.value=''
  save(); renderSubjects(); renderDayDetails(); renderWeekGrid()
}

function renderSubjects(){
  subjectsList.innerHTML=''
  addSubject.innerHTML = '<option value="">(none)</option>'
  state.subjects.forEach(s=>{
    const li = document.createElement('li')
    li.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><span style="width:14px;height:14px;background:${s.color};border-radius:50%"></span><strong>${s.name}</strong></div><div><small>${s.hours}h/w</small> <button data-id="${s.id}" class="del">✕</button></div>`
    subjectsList.appendChild(li)
    const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; addSubject.appendChild(opt)
  })
  // delete handlers
  subjectsList.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click',e=>{const id=Number(e.target.dataset.id);state.subjects=state.subjects.filter(s=>s.id!==id); // also remove references
    for(const d in state.events){state.events[d]=state.events[d].filter(ev=>ev.subject!=id)}
    save();renderSubjects();renderCalendar();renderDayDetails();renderWeekGrid() }))
}

function renderTodayInfo(){
  const d = new Date(); todayName.textContent = d.toLocaleDateString(undefined,{weekday:'long'})
  todayDate.textContent = d.toLocaleDateString()
}

function renderCalendar(){
  // render weekday headers (phone-like row)
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  weekdayHeaders.innerHTML = ''
  weekdays.forEach(w=>{ const hd = document.createElement('div'); hd.textContent = w; weekdayHeaders.appendChild(hd) })

  calendarGrid.innerHTML = ''
  const year = viewDate.getFullYear(); const month=viewDate.getMonth()
  monthLabel.textContent = viewDate.toLocaleString(undefined,{month:'long',year:'numeric'})
  const first = new Date(year,month,1); const startDay = first.getDay()
  const days = new Date(year,month+1,0).getDate()
  // previous month fill
  const prevDays = startDay
  const prevMonthLast = new Date(year,month,0).getDate()
  for(let i=prevMonthLast-prevDays+1;i<=prevMonthLast;i++){ const d = new Date(year,month-1,i); appendDay(d,true) }
  for(let i=1;i<=days;i++){ appendDay(new Date(year,month,i),false) }
  // next month fill until 7*x
  const total = calendarGrid.children.length
  const need = (7 - (total%7))%7
  for(let i=1;i<=need;i++){ appendDay(new Date(year,month+1,i),true) }

  function appendDay(d,isOther){
    const iso = formatDate(d)
    const el = document.createElement('div'); el.className='day'+(isOther? ' other':'')
    if(iso===formatDate(new Date())) el.classList.add('today')
    // build content: date, preview items, markers
    const dateHtml = document.createElement('div'); dateHtml.className='date'; dateHtml.textContent = d.getDate()
    const preview = document.createElement('div'); preview.className='preview'
    const evs = (state.events[iso]||[])
    evs.slice(0,2).forEach(ev=>{
      const it = document.createElement('div'); it.className = 'item ' + ev.type
      it.textContent = (ev.type==='exam'? '📝 ': ev.type==='holiday'? '🏖️ ': ev.type==='task'? '✅ ': '') + ev.title
      // subject color as left accent if provided
      if(ev.subject){ const s = state.subjects.find(x=>x.id==ev.subject); if(s) it.style.borderLeft = `6px solid ${s.color}` }
      preview.appendChild(it)
    })
    if(evs.length>2){ const more = document.createElement('div'); more.className='item more'; more.textContent = `+${evs.length-2} more`; preview.appendChild(more) }
    const markers = document.createElement('div'); markers.className='markers'
    evs.forEach(ev=>{ const dot = document.createElement('div'); dot.className='dot'; if(ev.type==='exam') dot.style.background = '#ff4d94'; else if(ev.type==='holiday') dot.style.background = '#ffd3e6'; else dot.style.background = '#c484b8'; markers.appendChild(dot) })
    el.appendChild(dateHtml); el.appendChild(preview); el.appendChild(markers)
    el.addEventListener('click',()=>{ openDayModal(iso) })
    calendarGrid.appendChild(el)
  }
}

// Modal interactions
const dayModal = document.getElementById('dayModal')
const modalBackdrop = document.getElementById('modalBackdrop')
const closeModal = document.getElementById('closeModal')
const modalDateLabel = document.getElementById('modalDateLabel')
const modalEventsList = document.getElementById('modalEventsList')
const modalAddForm = document.getElementById('modalAddForm')
const modalTitle = document.getElementById('modalTitle')
const modalType = document.getElementById('modalType')
const modalSubject = document.getElementById('modalSubject')

function openDayModal(iso){
  selectedDate = iso
  modalDateLabel.textContent = new Date(iso).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'})
  renderModalEvents()
  // populate subjects
  modalSubject.innerHTML = '<option value="">(none)</option>'
  state.subjects.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name;modalSubject.appendChild(o)})
  dayModal.className = ''
}

function closeDayModal(){ dayModal.className='modal-hidden' }

function renderModalEvents(){
  modalEventsList.innerHTML = ''
  const evs = state.events[selectedDate]||[]
  evs.forEach((ev,i)=>{
    const el = document.createElement('div'); el.className='event'
    const subj = state.subjects.find(s=>s.id==ev.subject)
    el.innerHTML = `<div><strong>${ev.title}</strong> <small>${ev.type}${subj? ' • '+subj.name:''}</small></div><div>${ev.type==='task'? `<input type="checkbox" ${ev.completed? 'checked':''} data-i="${i}">` : ''} <button data-i="${i}" class="del">✕</button></div>`
    modalEventsList.appendChild(el)
    if(ev.type==='task') el.querySelector('input').addEventListener('change',e=>{ev.completed=e.target.checked;save();renderModalEvents()})
    el.querySelector('.del').addEventListener('click',()=>{state.events[selectedDate].splice(i,1); if(state.events[selectedDate].length===0) delete state.events[selectedDate]; save(); renderCalendar(); renderModalEvents(); renderWeekGrid()})
  })
}

modalBackdrop.addEventListener('click',closeDayModal)
closeModal.addEventListener('click',closeDayModal)
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDayModal() })

modalAddForm.addEventListener('submit',e=>{ e.preventDefault(); const title = modalTitle.value.trim(); if(!title) return; const t = modalType.value; const subj = modalSubject.value? Number(modalSubject.value): null; if(!state.events[selectedDate]) state.events[selectedDate]=[]; state.events[selectedDate].push({type:t,title,subject:subj,completed:false}); modalTitle.value=''; save(); renderCalendar(); renderModalEvents(); renderWeekGrid() })

function renderDayDetails(){
  selectedDateLabel.textContent = new Date(selectedDate).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'})
  eventsList.innerHTML=''
  const evs = state.events[selectedDate]||[]
  evs.forEach((ev,i)=>{
    const div = document.createElement('div'); div.className='event'
    const subj = state.subjects.find(s=>s.id==ev.subject)
    div.innerHTML = `<div><strong>${ev.title}</strong> <small style="color:#6b3b4b">${ev.type}${subj? ' • '+subj.name : ''}</small></div><div>${ev.type==='task'? `<input type="checkbox" ${ev.completed? 'checked':''} data-i="${i}">` : ''}<button data-i="${i}" class="del">✕</button></div>`
    eventsList.appendChild(div)
    if(ev.type==='task') div.querySelector('input').addEventListener('change',e=>{ev.completed=e.target.checked;save();renderDayDetails()})
    div.querySelector('.del').addEventListener('click',()=>{state.events[selectedDate].splice(i,1); if(state.events[selectedDate].length===0)delete state.events[selectedDate]; save(); renderCalendar(); renderDayDetails(); renderWeekGrid()})
  })
  // populate subjects select
  addSubject.innerHTML = '<option value="">(none)</option>'
  state.subjects.forEach(s=>{const opt=document.createElement('option');opt.value=s.id;opt.textContent=s.name;addSubject.appendChild(opt)})
}

function addEventToDay(){
  const title = addTitle.value.trim(); if(!title) return;
  const type = addType.value
  const subject = addSubject.value || null
  const ev = {type,title,subject:subject?Number(subject):null,completed:false}
  if(!state.events[selectedDate]) state.events[selectedDate]=[]
  state.events[selectedDate].push(ev)
  addTitle.value=''
  save(); renderCalendar(); renderDayDetails(); renderWeekGrid()
}

function addQuickEvent(){
  const t = eventTitle.value.trim(); if(!t) return; const ty=eventType.value; const d=eventDate.value
  if(!state.events[d]) state.events[d]=[]
  state.events[d].push({type:ty,title:t,subject:null,completed:false})
  eventTitle.value=''; eventDate.value=''
  save(); renderCalendar(); renderWeekGrid()
}

function exportData(){
  const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download='study-planner-data.json'; a.click(); URL.revokeObjectURL(url)
}

function handleImport(e){
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader(); r.onload = ()=>{ try{ const j = JSON.parse(r.result); state=j; save(); renderSubjects(); renderCalendar(); renderDayDetails(); renderWeekGrid(); alert('Imported successfully') }catch(err){alert('Invalid file')}}; r.readAsText(f)
}

function renderWeekGrid(){
  weekGrid.innerHTML=''
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  for(let i=0;i<7;i++){
    const col = document.createElement('div'); col.className='week-day'
    const heading = document.createElement('div'); heading.innerHTML=`<strong>${days[i]}</strong>`
    col.appendChild(heading)
    const list = document.createElement('div')
    const dateKey = getDateKeyForWeek(i)
    const evs = state.events[dateKey]||[]
    evs.filter(e=>e.type!=='holiday').forEach(ev=>{
      const el = document.createElement('div'); el.style.padding='6px'; el.style.margin='6px 0'; el.style.borderRadius='6px'; el.style.background='#fff4f9'; el.textContent = `${ev.type==='exam'? '📝 ': ev.type==='task'? '✅ ': ''}${ev.title}`
      if(ev.subject){ const subj = state.subjects.find(s=>s.id==ev.subject); if(subj){el.style.borderLeft=`6px solid ${subj.color}`}}
      list.appendChild(el)
    })
    col.appendChild(list)
    weekGrid.appendChild(col)
  }
}

function getDateKeyForWeek(dayIndex){
  // find start of this week (Sunday) relative to selectedDate
  const d = new Date(selectedDate)
  const diff = d.getDay() - 0
  const sunday = new Date(d); sunday.setDate(d.getDate()-diff)
  sunday.setDate(sunday.getDate()+dayIndex)
  return formatDate(sunday)
}

// initialize when DOM is ready (safer if script loads before full DOM)
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    init()
    renderDayDetails()
  }catch(err){
    console.error('Initialization error',err)
    alert('Study Planner failed to initialize. Check the console for details.')
  }
})
