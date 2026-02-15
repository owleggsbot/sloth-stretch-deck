const $ = (id) => document.getElementById(id);

const STORAGE = 'sloth-stretch-deck:v1';

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function pad2(n){ return String(n).padStart(2,'0'); }
function fmt(sec){
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${pad2(m)}:${pad2(s)}`;
}
function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function ydayKey(){
  const d = new Date(); d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function defaultState(){
  return {
    len: 4,
    voice: 'off',
    chime: 'soft',
    visuals: 'on',
    autoStart: false,
    sound: true,
    lastDone: null,
    streak: { count: 0, lastDate: null },
    lastRoutine: null
  };
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE);
    if(!raw) return defaultState();
    const j = JSON.parse(raw);
    return { ...defaultState(), ...j, streak: { ...defaultState().streak, ...(j.streak||{}) } };
  } catch { return defaultState(); }
}

let state = load();
function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }

// Audio: soft chime + optional speech
let audio = { ctx:null, chimeReady:false };
function ensureAudio(){
  if(!state.sound) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;
  if(audio.ctx) return;
  audio.ctx = new Ctx();
}
function chime(){
  if(state.chime === 'none') return;
  ensureAudio();
  if(!audio.ctx) return;
  const ctx = audio.ctx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(ctx.destination);
  const t0 = ctx.currentTime;
  g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
  o.frequency.exponentialRampToValueAtTime(660, t0 + 0.16);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.30);
  o.start(t0); o.stop(t0 + 0.32);
}

function speak(text){
  if(state.voice !== 'on') return;
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

const cardsById = new Map(window.SLOTH_ROUTINES.cards.map(c => [c.id, c]));

function buildRoutine(){
  const targetMin = clamp(parseInt($('len').value,10), 3, 5);
  state.len = targetMin;

  // choose a base preset close to length
  const presets = window.SLOTH_ROUTINES.presets;
  let preset = presets.find(p => p.minutes === targetMin) || presets[0];

  // if shuffle, pick random preset first
  if(state._shuffle){
    preset = presets[Math.floor(Math.random()*presets.length)];
  }

  // build steps; if under target time, add random cards
  let ids = preset.cards.slice();
  let sec = ids.reduce((a,id)=>a+(cardsById.get(id)?.seconds||0),0);

  const pool = window.SLOTH_ROUTINES.cards.map(c=>c.id).filter(id => !ids.includes(id));
  while(sec < targetMin*60 - 20 && pool.length){
    const pick = pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    ids.push(pick);
    sec += cardsById.get(pick)?.seconds||0;
  }

  // trim if too long
  while(sec > targetMin*60 + 25 && ids.length > 3){
    const drop = ids.pop();
    sec -= cardsById.get(drop)?.seconds||0;
  }

  state.lastRoutine = { presetId: preset.id, ids, sec, startedAt: new Date().toISOString() };
  state._shuffle = false;
  save();
  return state.lastRoutine;
}

function renderPresets(){
  const row = $('presetRow');
  row.innerHTML = '';
  for(const p of window.SLOTH_ROUTINES.presets){
    const el = document.createElement('div');
    el.className = 'preset';
    el.textContent = p.name;
    el.addEventListener('click', () => {
      state.lastRoutine = { presetId: p.id, ids: p.cards.slice(), sec: p.cards.reduce((a,id)=>a+(cardsById.get(id)?.seconds||0),0), startedAt: null };
      save();
      renderDeck();
    });
    row.appendChild(el);
  }
}

function renderDeck(){
  const host = $('deck');
  host.innerHTML = '';
  const routine = state.lastRoutine || buildRoutine();

  for(const id of routine.ids){
    const c = cardsById.get(id);
    if(!c) continue;
    const el = document.createElement('div');
    el.className = 'dcard';
    el.innerHTML = `
      <div class="dtitle">${escapeHtml(c.title)}</div>
      <div class="dmeta">${escapeHtml(c.area)} • ${c.seconds}s</div>
      <div class="dbody">${escapeHtml(c.body)}</div>
    `;
    host.appendChild(el);
  }
}

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// Player
let play = { running:false, idx:0, remaining:0, tick:null, paused:false };

function showPlayer(show){
  $('player').hidden = !show;
  $('deck').style.display = show ? 'none' : 'grid';
}

function setIllustration(area){
  const icon = $('icon');
  const blob = $('blob');
  if(state.visuals === 'off'){
    icon.style.display = 'none';
    blob.style.display = 'none';
    return;
  }
  icon.style.display = 'block';
  blob.style.display = 'block';

  const map = {
    'Eyes':'👀',
    'Jaw':'😮',
    'Neck':'🫶',
    'Shoulders':'🧥',
    'Upper back':'🪵',
    'Chest':'🫁',
    'Wrists':'✋',
    'Arms':'💧',
    'Breath':'🌿',
    'Spine':'🌀',
    'Hips':'🪑',
    'Lower legs':'🦶',
    'Mind':'🫧'
  };
  icon.textContent = map[area] || '🦥';

  if(state.visuals === 'reduced'){
    blob.style.opacity = '0.55';
  } else {
    blob.style.opacity = '1';
  }
}

function renderStep(){
  const routine = state.lastRoutine || buildRoutine();
  const id = routine.ids[play.idx];
  const c = cardsById.get(id);
  if(!c) return;

  $('stepTitle').textContent = c.title;
  $('stepMeta').textContent = `${c.area} • Step ${play.idx+1}/${routine.ids.length}`;
  $('stepBody').textContent = c.body;
  $('timer').textContent = fmt(play.remaining);
  setIllustration(c.area);

  $('btnPrev').disabled = play.idx === 0;
  $('btnNext').textContent = (play.idx === routine.ids.length-1) ? 'Finish' : 'Next';
}

function startRoutine(){
  ensureAudio();
  const routine = buildRoutine();
  play = { running:true, idx:0, remaining: cardsById.get(routine.ids[0]).seconds, tick:null, paused:false };
  showPlayer(true);
  renderStep();
  speak('Starting routine. Go slow.');
  runTick();
}

function pauseToggle(){
  if(!play.running) return;
  play.paused = !play.paused;
  $('btnPause').textContent = play.paused ? 'Resume' : 'Pause';
  if(!play.paused) speak('Resume.');
}

function nextStep(){
  const routine = state.lastRoutine;
  if(!routine) return;

  if(play.idx >= routine.ids.length-1){
    finishRoutine();
    return;
  }

  play.idx += 1;
  play.remaining = cardsById.get(routine.ids[play.idx]).seconds;
  renderStep();
  chime();
}

function prevStep(){
  const routine = state.lastRoutine;
  if(!routine) return;
  if(play.idx <= 0) return;
  play.idx -= 1;
  play.remaining = cardsById.get(routine.ids[play.idx]).seconds;
  renderStep();
}

function runTick(){
  if(play.tick) clearInterval(play.tick);
  play.tick = setInterval(() => {
    if(!play.running || play.paused) return;
    play.remaining = Math.max(0, play.remaining - 1);
    $('timer').textContent = fmt(play.remaining);
    if(play.remaining <= 0){
      // auto-advance
      nextStep();
    }
  }, 1000);
}

function finishRoutine(){
  if(play.tick) clearInterval(play.tick);
  play.running = false;
  showPlayer(false);

  const now = new Date();
  state.lastDone = now.toISOString();

  const today = todayKey();
  if(state.streak.lastDate === today){
    // already counted today
  } else if(state.streak.lastDate === ydayKey()){
    state.streak.count += 1;
    state.streak.lastDate = today;
  } else {
    state.streak.count = 1;
    state.streak.lastDate = today;
  }

  save();
  renderStats();
  $('btnShare').disabled = false;
  chime();
  speak('Routine complete. Proud of you.');
}

function renderStats(){
  $('streak').textContent = String(state.streak.count||0);
  $('len').value = String(state.len||4);
  $('voice').value = state.voice;
  $('chime').value = state.chime;
  $('visuals').value = state.visuals;
  $('autoStart').checked = !!state.autoStart;
  $('sound').checked = !!state.sound;

  $('lastDone').textContent = state.lastDone ? new Date(state.lastDone).toLocaleString() : '—';
  $('btnShare').disabled = !state.lastDone;
}

// Share card
function drawShare(){
  const canvas = $('shareCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  // bg
  const g1 = ctx.createRadialGradient(w*0.18,h*0.25, 50, w*0.18,h*0.25, w*0.95);
  g1.addColorStop(0, 'rgba(123,211,137,0.30)');
  g1.addColorStop(1, 'rgba(11,15,20,1)');
  ctx.fillStyle = g1;
  ctx.fillRect(0,0,w,h);

  const g2 = ctx.createRadialGradient(w*0.86,h*0.1, 50, w*0.86,h*0.1, w*0.85);
  g2.addColorStop(0, 'rgba(106,167,255,0.24)');
  g2.addColorStop(1, 'rgba(11,15,20,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0,0,w,h);

  // card
  ctx.fillStyle = 'rgba(17,25,38,0.88)';
  roundRect(ctx, 70, 70, w-140, h-140, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f2f7ff';
  ctx.font = '900 62px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText('Sloth Stretch Deck', 120, 160);

  ctx.fillStyle = 'rgba(242,247,255,0.78)';
  ctx.font = '650 28px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  ctx.fillText(`Micro-break complete`, 120, 218);

  const done = state.lastDone ? new Date(state.lastDone) : new Date();
  ctx.fillStyle = 'rgba(123,211,137,0.98)';
  ctx.font = '900 48px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(`${state.len || 4} min routine`, 120, 300);

  ctx.fillStyle = 'rgba(242,247,255,0.82)';
  ctx.font = '500 30px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText(`Streak: ${state.streak.count||0} day(s)`, 120, 360);
  ctx.fillText(`Completed: ${done.toLocaleDateString()} ${done.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`, 120, 410);

  ctx.fillStyle = 'rgba(106,167,255,0.94)';
  ctx.font = '600 24px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
  ctx.fillText('owleggsbot.github.io/sloth-stretch-deck', 120, h-120);

  ctx.save();
  ctx.translate(w-210, 130);
  ctx.scale(2.4, 2.4);
  drawSlothMark(ctx);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function drawSlothMark(ctx){
  ctx.fillStyle = 'rgba(123,211,137,0.95)';
  ctx.beginPath();
  ctx.ellipse(30, 30, 24, 22, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = 'rgba(11,15,20,0.9)';
  ctx.beginPath();
  ctx.ellipse(22, 28, 6, 7, 0, 0, Math.PI*2);
  ctx.ellipse(38, 28, 6, 7, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(11,15,20,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(30, 36, 9, 0.1*Math.PI, 0.9*Math.PI);
  ctx.stroke();
}

async function openShare(){
  drawShare();
  const canvas = $('shareCanvas');
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const url = URL.createObjectURL(blob);
  $('shareImg').src = url;

  const d = $('shareDialog');
  if(typeof d.showModal === 'function') d.showModal();
}

async function copyImage(){
  const canvas = $('shareCanvas');
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  try{
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    $('btnCopy').textContent = 'Copied';
    setTimeout(()=> $('btnCopy').textContent = 'Copy image', 1200);
  } catch {
    $('btnCopy').textContent = 'Unsupported';
    setTimeout(()=> $('btnCopy').textContent = 'Copy image', 1400);
  }
}

async function downloadImage(){
  const canvas = $('shareCanvas');
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sloth-stretch-${Date.now()}.png`;
  a.click();
}

function openPrint(){
  window.open('./print.html', '_blank', 'noopener');
}

// Wiring
renderPresets();
renderDeck();
renderStats();

$('btnStart').addEventListener('click', startRoutine);
$('btnShuffle').addEventListener('click', () => { state._shuffle = true; save(); state.lastRoutine = null; renderDeck(); });
$('btnPrev').addEventListener('click', prevStep);
$('btnNext').addEventListener('click', nextStep);
$('btnPause').addEventListener('click', pauseToggle);

$('len').addEventListener('change', () => { state.len = clamp(parseInt($('len').value,10), 3, 5); save(); state.lastRoutine = null; renderDeck(); renderStats(); });
$('voice').addEventListener('change', () => { state.voice = $('voice').value; save(); renderStats(); });
$('chime').addEventListener('change', () => { state.chime = $('chime').value; save(); });
$('visuals').addEventListener('change', () => { state.visuals = $('visuals').value; save(); });
$('autoStart').addEventListener('change', () => { state.autoStart = $('autoStart').checked; save(); });
$('sound').addEventListener('change', () => { state.sound = $('sound').checked; save(); if(!state.sound) { try{audio.ctx?.close?.();}catch{} audio.ctx=null; } });

$('btnPrint').addEventListener('click', () => {
  const d = $('printDialog');
  if(typeof d.showModal === 'function') d.showModal();
});
$('btnOpenPrint').addEventListener('click', openPrint);

$('btnShare').addEventListener('click', openShare);
$('btnCopy').addEventListener('click', copyImage);
$('btnDownload').addEventListener('click', downloadImage);

// Auto-start after first gesture
window.addEventListener('pointerdown', () => {
  if(state.autoStart){
    ensureAudio();
  }
}, { once: true });

// Reduced motion
if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  state.visuals = 'reduced';
  save();
}

// Keyboard: space pause/resume, n next, b back

document.addEventListener('keydown', (e) => {
  if(e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  const k = (e.key||'').toLowerCase();
  if(k === ' '){
    if(play.running) pauseToggle();
  }
  if(k === 'n') nextStep();
  if(k === 'b') prevStep();
});
