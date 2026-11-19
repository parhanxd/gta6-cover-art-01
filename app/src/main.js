// Vice Cover Studio — editor (src/main.js).
//
// Wires the workbench in index.html to the renderer in cover.js: photo
// uploads, layout and grade pickers, caption editing, per-panel crop and
// position (drag on the preview, sliders, flip), undo/redo, and PNG export
// in 1080×1080, 1080×1350, 1920×1080 and 1080×1920. Everything runs offline:
// photos are read on this machine and never uploaded.

import { LAYOUTS, GRADES, SIZES, defaultState, applyPreset, drawCover, renderCoverToCanvas, panelAt, defaultPanel } from './cover.js';
import { initShotMode } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const ctx = canvas.getContext('2d');

// --- photos ---------------------------------------------------------------
const photos = []; // { name, img, sample }
const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.src);
      photos.push({ name: s.name, img, sample: true });
    } catch (e) {
      console.warn(e.message);
    }
  }
}

// --- state + history -------------------------------------------------------
let state = defaultState();
let history = [];
let historyIndex = -1;

function snapshot() {
  return JSON.stringify(state);
}
function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedo();
}
function restoreSnapshot(json) {
  state = JSON.parse(json);
  syncControls();
  render();
}
function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restoreSnapshot(history[historyIndex]);
  updateUndoRedo();
  setStatus('Undid that change.');
}
function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  restoreSnapshot(history[historyIndex]);
  updateUndoRedo();
  setStatus('Redid that change.');
}
function updateUndoRedo() {
  $('undoBtn').disabled = historyIndex <= 0;
  $('redoBtn').disabled = historyIndex >= history.length - 1;
}
function change(mutator, note) {
  mutator(state);
  pushHistory();
  syncControls();
  render();
  if (note) setStatus(note);
}

// --- rendering -------------------------------------------------------------
let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    const size = SIZES[state.size] || SIZES.square;
    const scale = Math.min(1, 1080 / Math.max(size.w, size.h));
    const w = Math.round(size.w * scale);
    const h = Math.round(size.h * scale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    drawCover(ctx, w, h, state, photos.map((p) => p.img));
    drawSelection();
  });
}

// The selected panel's outline is an editor affordance: it is drawn on the
// preview canvas after the cover, so it never appears in an export — and
// never in a ?shot=cover screenshot, which shows the cover alone.
function drawSelection() {
  if (document.body.classList.contains('shot-cover')) return;
  const layout = LAYOUTS[state.layout];
  if (!layout || state.selected >= layout.cells.length) return;
  const cell = layout.cells[state.selected];
  const framePad = state.frame ? Math.round(Math.min(canvas.width, canvas.height) * 0.028) : 0;
  const x = framePad + cell.x * (canvas.width - framePad * 2);
  const y = framePad + cell.y * (canvas.height - framePad * 2);
  const w = cell.w * (canvas.width - framePad * 2);
  const h = cell.h * (canvas.height - framePad * 2);
  ctx.save();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.fillStyle = '#22d3ee';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(`Panel ${state.selected + 1}`, x + 8, y + h - 10);
  ctx.restore();
}

function setStatus(msg) {
  $('statusLine').textContent = msg;
}

// --- controls ---------------------------------------------------------------
function buildLayoutButtons() {
  const grid = $('layoutGrid');
  grid.innerHTML = '';
  for (const [key, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.className = 'layout-btn';
    btn.dataset.layout = key;
    btn.title = layout.name;
    const mini = document.createElement('span');
    mini.className = 'mini';
    for (const c of layout.cells) {
      const i = document.createElement('i');
      i.style.left = `${c.x * 100}%`;
      i.style.top = `${c.y * 100}%`;
      i.style.width = `${c.w * 100}%`;
      i.style.height = `${c.h * 100}%`;
      if (c.rot) i.style.transform = `rotate(${c.rot}deg)`;
      mini.appendChild(i);
    }
    btn.appendChild(mini);
    btn.appendChild(document.createTextNode(layout.name));
    btn.addEventListener('click', () => {
      change((s) => {
        s.layout = key;
        s.selected = Math.min(s.selected, layout.slots - 1);
      }, `Layout: ${layout.name}.`);
    });
    grid.appendChild(btn);
  }
}

function buildGradeButtons() {
  const grid = $('gradeGrid');
  grid.innerHTML = '';
  for (const [key, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.className = 'grade-btn';
    btn.dataset.grade = key;
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = grade.swatch;
    btn.appendChild(sw);
    btn.appendChild(document.createTextNode(grade.name));
    btn.addEventListener('click', () => change((s) => { s.grade = key; }, `Grade: ${grade.name}.`));
    grid.appendChild(btn);
  }
}

function syncThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'thumb' + (state.panels[state.selected]?.photo === i ? ' on' : '');
    b.title = p.name;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    b.appendChild(img);
    if (!p.sample || photos.length > 1) {
      const x = document.createElement('span');
      x.className = 'x';
      x.textContent = '×';
      x.title = 'Remove photo';
      x.addEventListener('click', (ev) => {
        ev.stopPropagation();
        removePhoto(i);
      });
      b.appendChild(x);
    }
    b.addEventListener('click', () => {
      change((s) => { s.panels[s.selected].photo = i; }, `Panel ${state.selected + 1} uses “${p.name}”.`);
    });
    box.appendChild(b);
  });
  const sel = $('panelPhoto');
  sel.innerHTML = '';
  photos.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = String(state.panels[state.selected]?.photo ?? 0);
}

function removePhoto(i) {
  if (photos.length <= 1) {
    setStatus('Keep at least one photo.');
    return;
  }
  change((s) => {
    photos.splice(i, 1);
    for (const p of s.panels) {
      if (p.photo === i) p.photo = 0;
      else if (p.photo > i) p.photo -= 1;
    }
  }, `Removed “${photos[i]?.name ?? 'photo'}”.`);
}

function syncControls() {
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('#titleStyleSeg button').forEach((b) => b.classList.toggle('on', b.dataset.style === state.titleStyle));
  document.querySelectorAll('#titlePosSeg button').forEach((b) => b.classList.toggle('on', b.dataset.pos === state.titlePos));
  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('on'));
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('badgeInput').value = state.badge;
  $('titleSize').value = String(Math.round(state.titleSize * 100));
  $('titleSizeVal').textContent = `${Math.round(state.titleSize * 100)}%`;
  $('heatRange').value = String(state.heat);
  $('heatVal').innerHTML = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  $('frameChk').checked = state.frame;
  $('grainChk').checked = state.grain;
  $('vignetteChk').checked = state.vignette;
  $('halftoneChk').checked = state.halftone;
  const panel = state.panels[state.selected] || defaultPanel(0);
  $('zoomRange').value = String(Math.round(panel.zoom * 100));
  $('zoomVal').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panX').value = String(Math.round(panel.ox * 100));
  $('panXVal').textContent = String(Math.round(panel.ox * 100));
  $('panY').value = String(Math.round(panel.oy * 100));
  $('panYVal').textContent = String(Math.round(panel.oy * 100));
  syncThumbs();
}

// --- canvas interaction: click to select, drag to pan, wheel to zoom -------
function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) / r.width) * canvas.width,
    y: ((ev.clientY - r.top) / r.height) * canvas.height,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (ev) => {
  const p = canvasPoint(ev);
  const hit = panelAt(state, p.x, p.y, canvas.width, canvas.height);
  if (hit < 0) return;
  if (hit !== state.selected) {
    state.selected = hit;
    syncControls();
    render();
  }
  drag = { x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(ev.pointerId);
});
canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const p = canvasPoint(ev);
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  if (!drag.moved) return;
  const panel = state.panels[state.selected];
  const layout = LAYOUTS[state.layout];
  const cell = layout.cells[state.selected];
  const framePad = state.frame ? Math.round(Math.min(canvas.width, canvas.height) * 0.028) : 0;
  const cw = cell.w * (canvas.width - framePad * 2);
  const ch = cell.h * (canvas.height - framePad * 2);
  panel.ox = Math.max(-1, Math.min(1, panel.ox + (dx / cw) * 2));
  panel.oy = Math.max(-1, Math.min(1, panel.oy + (dy / ch) * 2));
  drag.x = p.x;
  drag.y = p.y;
  render();
});
canvas.addEventListener('pointerup', () => {
  if (drag?.moved) pushHistory();
  drag = null;
  syncControls();
});
canvas.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const panel = state.panels[state.selected];
  const next = Math.max(0.5, Math.min(3, panel.zoom * (ev.deltaY < 0 ? 1.08 : 0.93)));
  panel.zoom = Math.round(next * 100) / 100;
  pushHistory();
  syncControls();
  render();
}, { passive: false });

// --- export -----------------------------------------------------------------
function downloadCanvas(c, filename) {
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed in this browser.');
        resolve(false);
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(true);
    }, 'image/png');
  });
}

function slugify(text) {
  return (text || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

async function exportSize(key) {
  const size = SIZES[key];
  const c = renderCoverToCanvas(size.w, size.h, state, photos.map((p) => p.img));
  const ok = await downloadCanvas(c, `vice-cover-${slugify(state.title)}-${size.w}x${size.h}.png`);
  if (ok) setStatus(`Exported ${size.label} PNG.`);
  return ok;
}

$('exportBtn').addEventListener('click', () => exportSize(state.size));
$('exportAllBtn').addEventListener('click', async () => {
  setStatus('Exporting all 4 sizes…');
  for (const key of Object.keys(SIZES)) {
    // eslint-disable-next-line no-await-in-loop
    await exportSize(key);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 350));
  }
  setStatus('Exported all 4 sizes.');
});

// --- control wiring ----------------------------------------------------------
document.querySelectorAll('.size-btn').forEach((b) => {
  b.addEventListener('click', () => change((s) => { s.size = b.dataset.size; }, `Canvas: ${SIZES[b.dataset.size].label}.`));
});
document.querySelectorAll('.preset-btn').forEach((b) => {
  b.addEventListener('click', () => {
    const next = applyPreset({ ...state }, b.dataset.preset);
    state = next;
    pushHistory();
    syncControls();
    render();
    setStatus(`Look applied: ${b.textContent}.`);
  });
});

$('fileInput').addEventListener('change', async (ev) => {
  const files = [...ev.target.files];
  ev.target.value = '';
  if (!files.length) return;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (photos.length >= 8) {
      setStatus('Eight photos at most — remove one first.');
      break;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      photos.push({ name: file.name.replace(/\.[^.]+$/, ''), img, sample: false });
    } catch {
      setStatus(`Could not read “${file.name}”.`);
    }
  }
  change((s) => {
    s.panels[s.selected].photo = photos.length - 1;
  }, `Added ${files.length} photo${files.length > 1 ? 's' : ''}.`);
});

$('panelPhoto').addEventListener('change', (ev) => {
  const i = Number(ev.target.value);
  change((s) => { s.panels[s.selected].photo = i; }, `Panel ${state.selected + 1} uses “${photos[i]?.name ?? ''}”.`);
});
$('fillAllBtn').addEventListener('click', () => {
  const i = state.panels[state.selected].photo;
  change((s) => {
    for (const p of s.panels) p.photo = i;
  }, `Every panel now uses “${photos[i]?.name ?? ''}” — crop each one differently.`);
});
$('flipBtn').addEventListener('click', () => {
  change((s) => { s.panels[s.selected].flip = !s.panels[s.selected].flip; }, 'Flipped the selected photo.');
});

function bindSlider(id, valId, format, apply) {
  const el = $(id);
  el.addEventListener('input', () => {
    apply(Number(el.value));
    $(valId).textContent = format(Number(el.value));
    render();
  });
  el.addEventListener('change', () => pushHistory());
}
bindSlider('zoomRange', 'zoomVal', (v) => `${v}%`, (v) => { state.panels[state.selected].zoom = v / 100; });
bindSlider('panX', 'panXVal', (v) => String(v), (v) => { state.panels[state.selected].ox = v / 100; });
bindSlider('panY', 'panYVal', (v) => String(v), (v) => { state.panels[state.selected].oy = v / 100; });
bindSlider('titleSize', 'titleSizeVal', (v) => `${v}%`, (v) => { state.titleSize = v / 100; });
bindSlider('heatRange', 'heatVal', (v) => '★'.repeat(v) + '☆'.repeat(5 - v), (v) => { state.heat = v; });

let titleTimer = null;
function bindText(id, apply) {
  $(id).addEventListener('input', (ev) => {
    apply(ev.target.value);
    render();
    clearTimeout(titleTimer);
    titleTimer = setTimeout(pushHistory, 600);
  });
}
bindText('titleInput', (v) => { state.title = v; });
bindText('subtitleInput', (v) => { state.subtitle = v; });
bindText('badgeInput', (v) => { state.badge = v; });

document.querySelectorAll('#titleStyleSeg button').forEach((b) => {
  b.addEventListener('click', () => change((s) => { s.titleStyle = b.dataset.style; }, `Title style: ${b.textContent}.`));
});
document.querySelectorAll('#titlePosSeg button').forEach((b) => {
  b.addEventListener('click', () => change((s) => { s.titlePos = b.dataset.pos; }, `Title at the ${b.dataset.pos}.`));
});
$('frameChk').addEventListener('change', (ev) => change((s) => { s.frame = ev.target.checked; }));
$('grainChk').addEventListener('change', (ev) => change((s) => { s.grain = ev.target.checked; }));
$('vignetteChk').addEventListener('change', (ev) => change((s) => { s.vignette = ev.target.checked; }));
$('halftoneChk').addEventListener('change', (ev) => change((s) => { s.halftone = ev.target.checked; }));

$('undoBtn').addEventListener('click', undo);
$('redoBtn').addEventListener('click', redo);
$('resetBtn').addEventListener('click', () => {
  state = defaultState();
  state.panels.forEach((p, i) => { p.photo = i < photos.length ? i : 0; });
  pushHistory();
  syncControls();
  render();
  setStatus('Reset to the sample cover.');
});
document.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
    ev.preventDefault();
    undo();
  } else if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === 'y' || (ev.key.toLowerCase() === 'z' && ev.shiftKey))) {
    ev.preventDefault();
    redo();
  }
});

// --- boot --------------------------------------------------------------------
buildLayoutButtons();
buildGradeButtons();
syncControls();

try {
  await Promise.all([
    document.fonts.load('400 100px Anton'),
    document.fonts.load('400 40px Pacifico'),
  ]);
} catch (_) { /* fall back to system fonts; the cover still draws */ }

await loadSamples();
state.panels.forEach((p, i) => { p.photo = i < photos.length ? i : 0; });
pushHistory();
syncControls();
render();
setStatus(photos.length ? 'Sample photos loaded — pick a layout and export.' : 'Add a photo to start.');

// Shot mode (?shot=cover / ?shot=editor) for deterministic screenshots.
initShotMode({ state, setState: (s) => { state = s; }, photos, render, syncControls });

// Test hook for the maker's own verification (not part of the UI).
window.__vice = {
  get state() { return state; },
  get photos() { return photos; },
  render,
  exportSize,
  renderCoverToCanvas: (w, h) => renderCoverToCanvas(w, h, state, photos.map((p) => p.img)),
};
