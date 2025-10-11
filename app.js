const STORAGE_KEY = 'resource_manager.items'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// Persistence: prefer File System Access API for device storage, fallback to export/import.
function loadItems(){
  // Try to load from in-memory file handle if previously opened in the session
  // Fallback: if localStorage contains legacy data, keep it for a single-run migration.
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  }catch(e){
    console.error('Failed to load items', e)
    return []
  }
}

function saveItems(items){
  // Keep localStorage in sync as a lightweight cache (helps browsers without File System Access API)
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }catch(e){/* ignore */}
}

function createCard(item){
  const el = document.createElement('article')
  el.className = 'card'
  el.dataset.id = item.id
  const linkHtml = item.link ? `<a class="link" href="${escapeAttr(item.link)}" target="_blank" rel="noreferrer noopener">${escapeHtml(item.link)}</a>` : ''
  // support legacy single `type` or new `types` array
  const typesArr = Array.isArray(item.types) ? item.types : (item.type ? [item.type] : [])
  const badgesHtml = typesArr.length ? typesArr.map(t=>`<span class="badge">${escapeHtml(t)}</span>`).join(' ') : ''
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <div class="title">${escapeHtml(item.name)}</div>
      <div class="badges">${badgesHtml}</div>
    </div>
    <div class="desc">${escapeHtml(item.description || '')}</div>
    ${linkHtml}
    <div class="meta">
      <small class="muted">ID: ${item.id}</small>
      <div class="btns">
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    </div>
  `
  return el
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
}
function escapeAttr(str){
  return escapeHtml(str).replace(/\"/g, '%22')
}

// Toast notifications helper (replaces alert)
function showToast(message, type = 'info', ttl = 4500){
  try{
    const container = document.getElementById('toast-container')
    if(!container) throw new Error('no-toast')
    const t = document.createElement('div')
    t.className = `toast ${type}`
    t.setAttribute('role','status')
    const msg = document.createElement('div')
    msg.className = 'msg'
    msg.textContent = message
    const close = document.createElement('button')
    close.className = 'close'
    close.innerHTML = '✕'
    close.addEventListener('click', ()=>{ t.remove() })
    t.appendChild(msg)
    t.appendChild(close)
    container.appendChild(t)
    // auto remove
    setTimeout(()=>{ try{ t.remove() }catch(e){} }, ttl)
  }catch(e){
    // fallback to native alert if something goes wrong
    try{ alert(message) }catch(_){}
  }
}

// UI wiring
const form = document.getElementById('resource-form')
const cardsRoot = document.getElementById('cards')
const nameInput = document.getElementById('name')
const descInput = document.getElementById('description')
const linkInput = document.getElementById('link')
const idInput = document.getElementById('resource-id')
const clearBtn = document.getElementById('clear-btn')
const typeSelect = document.getElementById('type-select')
const manageTypesBtn = document.getElementById('manage-types-btn')
const typeManager = document.getElementById('type-manager')
const newTypeInput = document.getElementById('new-type-input')
const addTypeBtn = document.getElementById('add-type-btn')
const typesList = document.getElementById('types-list')
const typeCustom = document.getElementById('type-custom')
const typeDisplay = document.getElementById('type-display')
const typeOptions = document.getElementById('type-options')

const TYPES_KEY = 'resource_manager.types'

function loadTypes(){ try{ const raw = localStorage.getItem(TYPES_KEY); return raw ? JSON.parse(raw) : ['Article','Video','Tool'] }catch(e){ return ['Article','Video','Tool'] } }
function saveTypes(types){ try{ localStorage.setItem(TYPES_KEY, JSON.stringify(types)) }catch(e){} }

let items = loadItems()
let types = loadTypes()

function render(){
  cardsRoot.innerHTML = ''
  if(!items.length){
    const e = document.createElement('div')
    e.className = 'empty'
    e.textContent = 'No resources yet. Add one using the form above.'
    cardsRoot.appendChild(e)
    return
  }
  const frag = document.createDocumentFragment()
  items.slice().reverse().forEach(it => frag.appendChild(createCard(it)))
  cardsRoot.appendChild(frag)
}

function resetForm(){
  idInput.value = ''
  nameInput.value = ''
  descInput.value = ''
  linkInput.value = ''
  // clear type selections
  if(typeSelect) Array.from(typeSelect.options).forEach(o=>o.selected = false)
  if(typeOptions) Array.from(typeOptions.children).forEach(ch=> ch.classList.remove('selected'))
  if(typeDisplay) typeDisplay.textContent = 'Select types'
  nameInput.focus()
}

form.addEventListener('submit', (e)=>{
  e.preventDefault()
  const name = nameInput.value.trim()
  const desc = descInput.value.trim()
  const type = typeSelect ? (typeSelect.value || '') : ''
  const link = linkInput.value.trim()
  if(!name){
    showToast('Name is required.', 'error')
    return
  }
  // basic url normalization
  const normalized = normalizeUrl(link)
  // collect selected types from hidden select (multiple)
  const selectedTypes = typeSelect ? Array.from(typeSelect.selectedOptions).map(o=>o.value) : []
  const existingId = idInput.value
  if(existingId){
    items = items.map(it => it.id === existingId ? {...it, name, description:desc, link:normalized, types: selectedTypes, type: selectedTypes[0] || ''} : it)
  }else{
    items.push({id: uid(), name, description: desc, link: normalized, types: selectedTypes, type: selectedTypes[0] || '', createdAt: Date.now()})
  }
  saveItems(items)
  resetForm()
  render()
})

// Types management helpers
function populateTypes(){
  if(typeSelect){
    typeSelect.innerHTML = ''
    types.forEach(t=>{
      const opt = document.createElement('option')
      opt.value = t
      opt.textContent = t
      typeSelect.appendChild(opt)
    })
  }
  // custom dropdown populate
  if(typeOptions){
    typeOptions.innerHTML = ''
    types.forEach(t=>{
      const r = document.createElement('div')
      r.className = 'type-option'
      r.tabIndex = 0
      r.textContent = t
      // toggle selection
      r.addEventListener('click', ()=>{ toggleTypeSelection(t, r) })
      r.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggleTypeSelection(t, r) } })
      typeOptions.appendChild(r)
    })
  }
  if(typesList){
    typesList.innerHTML = ''
    types.forEach(t=>{
      const pill = document.createElement('div')
      pill.className = 'type-pill'
      pill.textContent = t
      const del = document.createElement('button')
      del.className = 'type-del'
      del.textContent = '✕'
      del.title = 'Remove type'
      del.addEventListener('click', ()=>{ removeType(t) })
      pill.appendChild(del)
      typesList.appendChild(pill)
    })
  }
  // sync display with select (if any pre-selections)
  updateTypeDisplayFromSelect()
}

function toggleTypeSelection(typeValue, optionEl){
  // update hidden select
  if(typeSelect){
    const opt = Array.from(typeSelect.options).find(o=>o.value===typeValue)
    if(opt) opt.selected = !opt.selected
  }
  // visual toggle
  if(optionEl) optionEl.classList.toggle('selected')
  updateTypeDisplayFromSelect()
}

function updateTypeDisplayFromSelect(){
  if(!typeSelect || !typeDisplay) return
  const selected = Array.from(typeSelect.selectedOptions).map(o=>o.value)
  typeDisplay.textContent = selected.length ? selected.join(', ') : 'Select types'
}

function setSelectedTypesForEdit(typesArr){
  if(!typeSelect) return
  // clear existing
  Array.from(typeSelect.options).forEach(o=>o.selected=false)
  typesArr.forEach(t=>{
    const opt = Array.from(typeSelect.options).find(o=>o.value===t)
    if(opt) opt.selected = true
  })
  // reflect in custom options
  Array.from(typeOptions.children).forEach(ch=>{ ch.classList.toggle('selected', typesArr.includes(ch.textContent)) })
  updateTypeDisplayFromSelect()
}

function addType(value){
  const v = String(value||'').trim()
  if(!v) return
  if(types.includes(v)) return
  types.push(v)
  saveTypes(types)
  populateTypes()
}

function removeType(value){
  types = types.filter(t=>t!==value)
  saveTypes(types)
  populateTypes()
}

if(manageTypesBtn){
  const appFooter = document.getElementById('app-footer')
  function setFooterActive(active){ if(appFooter){ if(active) appFooter.classList.add('active'); else appFooter.classList.remove('active') } }
  manageTypesBtn.addEventListener('click', ()=>{ 
    if(typeManager) typeManager.style.display = typeManager.style.display === 'none' ? 'block' : 'none'
    const open = typeManager && typeManager.style.display !== 'none'
    setFooterActive(open)
  })
}
if(addTypeBtn) addTypeBtn.addEventListener('click', ()=>{ addType(newTypeInput.value); newTypeInput.value = '' })
if(newTypeInput) newTypeInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); addType(newTypeInput.value); newTypeInput.value=''; } })

populateTypes()

// custom dropdown behavior
function openTypeOptions(){ if(typeOptions){ typeOptions.style.display='block'; typeOptions.setAttribute('aria-hidden','false'); typeDisplay.classList.add('open') }}
function closeTypeOptions(){ if(typeOptions){ typeOptions.style.display='none'; typeOptions.setAttribute('aria-hidden','true'); typeDisplay.classList.remove('open') }}
function toggleTypeOptions(){ if(typeOptions && typeOptions.style.display==='block') closeTypeOptions(); else openTypeOptions() }

function selectType(val){
  if(!val) return
  if(typeDisplay) typeDisplay.textContent = val
  if(typeSelect) typeSelect.value = val
  closeTypeOptions()
}

if(typeDisplay){
  typeDisplay.addEventListener('click', ()=> toggleTypeOptions())
  typeDisplay.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowDown'){ e.preventDefault(); openTypeOptions(); const first = typeOptions.querySelector('.type-option'); if(first) first.focus(); }
    if(e.key === 'Enter'){ e.preventDefault(); toggleTypeOptions() }
  })
}

// close on outside click
document.addEventListener('click', (e)=>{ if(typeCustom && !typeCustom.contains(e.target)) closeTypeOptions() })

cardsRoot.addEventListener('click', (e)=>{
  const btn = e.target.closest('button')
  if(!btn) return
  const article = btn.closest('.card')
  if(!article) return
  const id = article.dataset.id
  if(btn.classList.contains('edit')){
    const it = items.find(i=>i.id===id)
    if(!it) return
    idInput.value = it.id
    nameInput.value = it.name
    descInput.value = it.description
    linkInput.value = it.link
    // populate multi-select types
    const typesArr = Array.isArray(it.types) ? it.types : (it.type ? [it.type] : [])
    setSelectedTypesForEdit(typesArr)
    nameInput.focus()
  }
  if(btn.classList.contains('delete')){
    if(!confirm('Delete this resource?')) return
    items = items.filter(i=>i.id!==id)
    saveItems(items)
    render()
  }
})

clearBtn.addEventListener('click', ()=>{
  resetForm()
})

function normalizeUrl(url){
  try{
    if(!url) return ''
    if(!/^https?:\/\//i.test(url)) url = 'https://' + url
    const u = new URL(url)
    return u.toString()
  }catch(e){
    return url
  }
}

// initial render
render()

// File system helpers
async function saveToDeviceFile(){
  try{
    // Use File System Access API if available
    if(window.showSaveFilePicker){
      const handle = await window.showSaveFilePicker({
        suggestedName: 'resources.json',
        types: [{description:'JSON', accept:{'application/json':['.json']}}]
      })
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(items, null, 2))
      await writable.close()
  showToast('Exported JSON file (download started).', 'success')
      return
    }
    // Fallback: trigger a download
    const blob = new Blob([JSON.stringify(items, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resources.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  showToast('Exported JSON file (download started).', 'success')
  }catch(e){
    console.error(e)
    showToast('Failed to export resources: ' + (e && e.message ? e.message : String(e)), 'error')
  }
}

async function loadFromDeviceFile(){
  try{
    if(window.showOpenFilePicker){
      const [handle] = await window.showOpenFilePicker({types:[{description:'JSON',accept:{'application/json':['.json']}}]})
      const file = await handle.getFile()
      const text = await file.text()
      items = JSON.parse(text || '[]')
      await saveItems(items)
      render()
  showToast('Loaded resources from file.', 'success')
      return
    }
    // Else, instruct user to use import file input
    document.getElementById('import-file').click()
  }catch(e){
    console.error(e)
    showToast('Failed to import resources: ' + (e && e.message ? e.message : String(e)), 'error')
  }
}

function exportJson(){
  // download current items as JSON
  const blob = new Blob([JSON.stringify(items, null, 2)], {type: 'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resources.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function handleImportFile(file){
  const reader = new FileReader()
  reader.onload = (ev)=>{
    try{
      const json = JSON.parse(ev.target.result)
      if(Array.isArray(json)){
        items = json
        saveItems(items)
        render()
  showToast('Imported resources successfully.', 'success')
      }else{
  showToast('Imported JSON is not an array of resources.', 'error')
      }
    }catch(e){
  showToast('Failed to parse JSON: ' + e.message, 'error')
    }
  }
  reader.readAsText(file)
}
// Save as PDF: uses window.print() to produce a PDF via the browser print dialog.
function saveAsPdf(){
  // Prepare a print-friendly view: add a class to body so CSS can adapt if needed.
  document.body.classList.add('print-mode')
  // Give the browser a moment to apply print styles, then open print dialog.
  setTimeout(()=>{
    try{
      // attach cleanup handler for afterprint where available
      const cleanup = ()=>{
        document.body.classList.remove('print-mode')
        window.removeEventListener('afterprint', cleanup)
        if(mediaQuery) mediaQuery.removeListener(mediaHandler)
      }
      // Some browsers fire afterprint; others support matchMedia('print') listeners
      window.addEventListener('afterprint', cleanup)
      const mediaQuery = window.matchMedia && window.matchMedia('print')
      const mediaHandler = (m)=>{ if(!m.matches) cleanup() }
      if(mediaQuery && mediaQuery.addListener){ mediaQuery.addListener(mediaHandler) }

      window.print()
    }catch(e){
      console.error('Print failed', e)
  showToast('Unable to open print dialog for PDF export.', 'error')
      // ensure cleanup
      document.body.classList.remove('print-mode')
    }
  }, 80)
}

// wire file action buttons
const savePdfBtn = document.getElementById('save-pdf')
if(savePdfBtn) savePdfBtn.addEventListener('click', saveAsPdf)
document.getElementById('export-json').addEventListener('click', exportJson)
const importFile = document.getElementById('import-file')
importFile.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0]
  if(f) handleImportFile(f)
  importFile.value = ''
})

// make the visible import button trigger the hidden file input for convenience
const importBtn = document.getElementById('import-json')
if(importBtn){
  importBtn.addEventListener('click', ()=> importFile.click())
}

