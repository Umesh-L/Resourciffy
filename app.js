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
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div class="title">${escapeHtml(item.name)}</div>
      <div class="badge">${escapeHtml(item.type || '')}</div>
    </div>
    <div class="desc">${escapeHtml(item.description || '')}</div>
    <a class="link" href="${escapeAttr(item.link)}" target="_blank" rel="noreferrer noopener">${escapeHtml(item.link)}</a>
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
  nameInput.focus()
}

form.addEventListener('submit', (e)=>{
  e.preventDefault()
  const name = nameInput.value.trim()
  const desc = descInput.value.trim()
  const type = typeSelect ? (typeSelect.value || '') : ''
  const link = linkInput.value.trim()
  if(!name || !link){
    alert('Name and link are required.')
    return
  }
  // basic url normalization
  const normalized = normalizeUrl(link)
  const existingId = idInput.value
  if(existingId){
    items = items.map(it => it.id === existingId ? {...it, name, description:desc, link:normalized, type} : it)
  }else{
    items.push({id: uid(), name, description: desc, link: normalized, type, createdAt: Date.now()})
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

if(manageTypesBtn) manageTypesBtn.addEventListener('click', ()=>{ if(typeManager) typeManager.style.display = typeManager.style.display === 'none' ? 'block' : 'none' })
if(addTypeBtn) addTypeBtn.addEventListener('click', ()=>{ addType(newTypeInput.value); newTypeInput.value = '' })
if(newTypeInput) newTypeInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); addType(newTypeInput.value); newTypeInput.value=''; } })

populateTypes()

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
      alert('Saved to device successfully.')
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
    alert('Exported JSON file (download started).')
  }catch(e){
    console.error(e)
    alert('Failed to save to device: ' + e.message)
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
      alert('Loaded resources from file.')
      return
    }
    // Else, instruct user to use import file input
    document.getElementById('import-file').click()
  }catch(e){
    console.error(e)
    alert('Failed to load from device: ' + e.message)
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
        alert('Imported resources successfully.')
      }else{
        alert('Imported JSON is not an array of resources.')
      }
    }catch(e){
      alert('Failed to parse JSON: ' + e.message)
    }
  }
  reader.readAsText(file)
}

// wire file action buttons
document.getElementById('save-device').addEventListener('click', saveToDeviceFile)
document.getElementById('load-device').addEventListener('click', loadFromDeviceFile)
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

