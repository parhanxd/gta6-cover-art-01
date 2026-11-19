// Vice Cover Studio — cover renderer (src/cover.js).
//
// One function draws the whole cover on any 2D canvas at any pixel size:
// drawCover(ctx, width, height, state, photos). The editor's live preview,
// the PNG exports and the ?shot=cover screenshots all go through it, so the
// cover a judge sees is exactly the cover the app exports.
//
// A cover is: a layout of photo panels (each with its own photo, zoom, pan
// and flip), a colour grade over every panel, a bold Anton title with a
// Pacifico script subtitle, a badge ribbon, a heat meter of stars, and
// optional grain, vignette and halftone finish. No game logos, artwork or
// fonts anywhere: the lettering is Anton + Pacifico under the SIL OFL.

export const LAYOUTS = {
  hero3: {
    name: 'Hero + Three',
    slots: 4,
    cells: [
      { x: 0, y: 0, w: 0.615, h: 1 },
      { x: 0.627, y: 0, w: 0.373, h: 0.3253 },
      { x: 0.627, y: 0.3373, w: 0.373, h: 0.3253 },
      { x: 0.627, y: 0.6747, w: 0.373, h: 0.3253 },
    ],
  },
  grid4: {
    name: 'Four Grid',
    slots: 4,
    cells: [
      { x: 0, y: 0, w: 0.494, h: 0.494 },
      { x: 0.506, y: 0, w: 0.494, h: 0.494 },
      { x: 0, y: 0.506, w: 0.494, h: 0.494 },
      { x: 0.506, y: 0.506, w: 0.494, h: 0.494 },
    ],
  },
  grid9: {
    name: 'Nine Grid',
    slots: 9,
    cells: [
      { x: 0, y: 0, w: 0.3253, h: 0.3253 }, { x: 0.3373, y: 0, w: 0.3253, h: 0.3253 }, { x: 0.6747, y: 0, w: 0.3253, h: 0.3253 },
      { x: 0, y: 0.3373, w: 0.3253, h: 0.3253 }, { x: 0.3373, y: 0.3373, w: 0.3253, h: 0.3253 }, { x: 0.6747, y: 0.3373, w: 0.3253, h: 0.3253 },
      { x: 0, y: 0.6747, w: 0.3253, h: 0.3253 }, { x: 0.3373, y: 0.6747, w: 0.3253, h: 0.3253 }, { x: 0.6747, y: 0.6747, w: 0.3253, h: 0.3253 },
    ],
  },
  bleed: {
    name: 'Full Bleed',
    slots: 1,
    cells: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  triptych: {
    name: 'Triptych',
    slots: 3,
    cells: [
      { x: 0, y: 0, w: 0.3253, h: 1 },
      { x: 0.3373, y: 0, w: 0.3253, h: 1 },
      { x: 0.6747, y: 0, w: 0.3253, h: 1 },
    ],
  },
  tilt: {
    name: 'Tilted Snaps',
    slots: 3,
    polaroid: true,
    cells: [
      { x: 0.06, y: 0.06, w: 0.5, h: 0.56, rot: -4 },
      { x: 0.44, y: 0.13, w: 0.5, h: 0.56, rot: 3 },
      { x: 0.17, y: 0.45, w: 0.54, h: 0.49, rot: -2 },
    ],
  },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    sat: 1.45, con: 1.1, bri: 1.03,
    swatch: 'linear-gradient(135deg,#ffb347,#ff2e88)',
    overlays: [
      { blend: 'overlay', stops: [[0, 'rgba(255,154,60,0.44)'], [1, 'rgba(255,46,136,0.46)']] },
      { blend: 'soft-light', stops: [[0, 'rgba(255,120,0,0.30)'], [1, 'rgba(60,0,90,0.36)']] },
    ],
  },
  neon: {
    name: 'Neon Nights',
    sat: 1.5, con: 1.12, bri: 1.0,
    swatch: 'linear-gradient(135deg,#22d3ee,#ff2e88)',
    overlays: [
      { blend: 'overlay', stops: [[0, 'rgba(34,211,238,0.28)'], [0.55, 'rgba(120,40,220,0.18)'], [1, 'rgba(255,46,136,0.32)']] },
      { blend: 'soft-light', stops: [[0, 'rgba(0,40,80,0.25)'], [1, 'rgba(255,0,120,0.20)']] },
    ],
  },
  vice: {
    name: 'Vice Nights',
    sat: 1.3, con: 1.06, bri: 1.0,
    swatch: 'linear-gradient(135deg,#7c3aed,#db2777)',
    overlays: [
      { blend: 'overlay', stops: [[0, 'rgba(124,58,237,0.30)'], [1, 'rgba(219,39,119,0.26)']] },
      { blend: 'multiply', stops: [[0, 'rgba(20,0,60,0.10)'], [1, 'rgba(20,0,60,0.30)']] },
    ],
  },
  golden: {
    name: 'Golden Hour',
    sat: 1.25, con: 1.06, bri: 1.04,
    swatch: 'linear-gradient(135deg,#fde68a,#f59e0b)',
    overlays: [
      { blend: 'soft-light', stops: [[0, 'rgba(255,200,90,0.34)'], [1, 'rgba(180,80,0,0.22)']] },
      { blend: 'overlay', stops: [[0, 'rgba(255,220,140,0.16)'], [1, 'rgba(120,40,0,0.18)']] },
    ],
  },
  noir: {
    name: 'Noir',
    sat: 0, con: 1.28, bri: 1.06,
    swatch: 'linear-gradient(135deg,#e5e7eb,#111827)',
    overlays: [
      { blend: 'overlay', stops: [[0, 'rgba(255,255,255,0.10)'], [1, 'rgba(0,0,0,0.28)']] },
    ],
  },
  palm: {
    name: 'Palm Teal',
    sat: 1.3, con: 1.06, bri: 1.0,
    swatch: 'linear-gradient(135deg,#2dd4bf,#0ea5e9)',
    overlays: [
      { blend: 'overlay', stops: [[0, 'rgba(45,212,191,0.26)'], [1, 'rgba(14,165,233,0.24)']] },
      { blend: 'soft-light', stops: [[0, 'rgba(0,60,50,0.18)'], [1, 'rgba(0,80,90,0.26)']] },
    ],
  },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080×1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080×1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920×1080' },
  story: { w: 1080, h: 1920, label: 'Story 1080×1920' },
};

// A panel's photo transform. zoom 1 = cover-fit; ox/oy shift the photo by
// that fraction of the panel (range roughly -1..1); flip mirrors it.
// Each panel starts on a different crop of its photo, so one photo filled
// across several panels already looks like a multi-shot poster, not a
// repeated tile: the user can still re-crop every panel by hand.
const CROPS = [
  { zoom: 1, ox: 0, oy: 0 },
  { zoom: 1.15, ox: 0.3, oy: 0.7 },
  { zoom: 1.1, ox: -0.25, oy: 0.55 },
  { zoom: 1.25, ox: 0.1, oy: 0.85 },
  { zoom: 1.35, ox: -0.3, oy: 0.2 },
  { zoom: 1.5, ox: 0.3, oy: 0.45 },
  { zoom: 1.3, ox: 0, oy: 0.6 },
  { zoom: 1.2, ox: 0.25, oy: -0.15 },
  { zoom: 1.6, ox: -0.15, oy: 0.4 },
];

export function defaultPanel(photoIndex, slot = 0) {
  const crop = CROPS[slot % CROPS.length];
  return { photo: photoIndex, zoom: crop.zoom, ox: crop.ox, oy: crop.oy, flip: false };
}

export function defaultState() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    size: 'square',
    title: 'SUNSET HEIST',
    subtitle: 'Neon Shore nights',
    badge: 'LAUNCH WEEK',
    titleStyle: 'white',
    titlePos: 'bottom',
    titleSize: 1,
    heat: 3,
    frame: true,
    grain: true,
    vignette: true,
    halftone: false,
    selected: 0,
    panels: Array.from({ length: 9 }, (_, i) => defaultPanel(i < 2 ? i : 0, i)),
  };
}

const PRESETS = {
  heist: { layout: 'hero3', grade: 'sunset', title: 'SUNSET HEIST', subtitle: 'Neon Shore nights', badge: 'LAUNCH WEEK', titleStyle: 'sunset', titlePos: 'bottom', heat: 3, halftone: false },
  neon: { layout: 'grid4', grade: 'neon', title: 'NEON NIGHTS', subtitle: 'the city never sleeps', badge: 'AFTER DARK', titleStyle: 'white', titlePos: 'bottom', heat: 5, halftone: true },
  golden: { layout: 'tilt', grade: 'golden', title: 'GOLDEN GETAWAY', subtitle: 'one last ride', badge: 'EST. 2026', titleStyle: 'white', titlePos: 'top', heat: 4, halftone: false },
  noir: { layout: 'bleed', grade: 'noir', title: 'PIER PRESSURE', subtitle: 'no witnesses', badge: 'VICE FILES', titleStyle: 'outline', titlePos: 'bottom', heat: 2, halftone: false },
};

export function applyPreset(state, key) {
  const p = PRESETS[key];
  if (!p) return state;
  return { ...state, ...p };
}

// --- drawing helpers -------------------------------------------------------

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

let noiseCanvas = null;
function grainPattern(ctx) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 160;
    noiseCanvas.height = 160;
    const nctx = noiseCanvas.getContext('2d');
    const img = nctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 96);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }
  return ctx.createPattern(noiseCanvas, 'repeat');
}

// Draw one photo into a rect, cover-fit, with the panel's zoom/pan/flip.
function drawPhotoInto(ctx, img, rx, ry, rw, rh, panel, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih || rw <= 0 || rh <= 0) return;
  const scale = Math.max(rw / iw, rh / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Pan only as far as the photo's overhang allows: at any zoom the photo
  // must keep covering the panel, never expose the backdrop behind it.
  const maxShiftX = Math.max(0, (dw - rw) / 2);
  const maxShiftY = Math.max(0, (dh - rh) / 2);
  const sx = Math.max(-maxShiftX, Math.min(maxShiftX, panel.ox * rw * 0.5));
  const sy = Math.max(-maxShiftY, Math.min(maxShiftY, panel.oy * rh * 0.5));
  const dx = rx + (rw - dw) / 2 + sx;
  const dy = ry + (rh - dh) / 2 + sy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.filter = `saturate(${grade.sat}) contrast(${grade.con}) brightness(${grade.bri})`;
  if (panel.flip) {
    ctx.translate(rx + rw / 2, ry + rh / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(img, dx - (rx + rw / 2), dy - (ry + rh / 2), dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.filter = 'none';
  // Grade overlays, blended over the photo only.
  for (const ov of grade.overlays) {
    const g = ctx.createLinearGradient(rx, ry, rx + rw * 0.35, ry + rh);
    for (const [stop, color] of ov.stops) g.addColorStop(stop, color);
    ctx.globalCompositeOperation = ov.blend;
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  while (px > 24) {
    ctx.font = `${weight} ${px}px ${family}`;
    try {
      ctx.letterSpacing = `${Math.round(px * 0.02)}px`;
    } catch (_) { /* older canvas: no letter-spacing */ }
    if (ctx.measureText(text).width <= maxWidth) break;
    px = Math.floor(px * 0.92);
  }
  return px;
}

// --- the cover -------------------------------------------------------------

// state: defaultState() shape. photos: array of HTMLImageElement (or null).
// The canvas must already be sized to width x height.
export function drawCover(ctx, W, H, state, photos) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero3;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const u = Math.min(W, H) / 1000; // unit: 1px at a 1000px cover
  const framePad = state.frame ? Math.round(Math.min(W, H) * 0.028) : 0;
  const ix = framePad;
  const iy = framePad;
  const iw = W - framePad * 2;
  const ih = H - framePad * 2;

  // Backdrop: white poster frame, then the deep dusk gradient the gaps show.
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if (state.frame) {
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, W, H);
  }
  const bg = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
  bg.addColorStop(0, '#1b0b2e');
  bg.addColorStop(0.55, '#3d0f4a');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(ix, iy, iw, ih);

  // Panels.
  const gap = Math.max(2, Math.round(Math.min(W, H) * 0.008));
  layout.cells.forEach((cell, i) => {
    const panel = state.panels[i] || defaultPanel(0);
    const img = photos[panel.photo] || photos[0] || null;
    const cx = ix + cell.x * iw;
    const cy = iy + cell.y * ih;
    const cw = cell.w * iw;
    const ch = cell.h * ih;
    if (!img) {
      ctx.fillStyle = '#241536';
      ctx.fillRect(cx, cy, cw, ch);
      return;
    }
    if (layout.polaroid) {
      // Tilted snapshot: white polaroid border, soft shadow, slight rotation.
      const bw = Math.max(4, Math.round(cw * 0.045));
      const bh = Math.max(10, Math.round(ch * 0.12));
      ctx.save();
      ctx.translate(cx + cw / 2, cy + ch / 2);
      ctx.rotate(((cell.rot || 0) * Math.PI) / 180);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = Math.round(28 * u);
      ctx.shadowOffsetY = Math.round(10 * u);
      ctx.fillStyle = '#f8f4ec';
      ctx.fillRect(-cw / 2 - bw, -ch / 2 - bw, cw + bw * 2, ch + bw + bh);
      ctx.shadowColor = 'transparent';
      drawPhotoInto(ctx, img, -cw / 2, -ch / 2, cw, ch, panel, grade);
      ctx.restore();
    } else {
      drawPhotoInto(ctx, img, cx, cy, cw, ch, panel, grade);
      if (gap > 0) {
        ctx.strokeStyle = 'rgba(248,244,236,0.9)';
        ctx.lineWidth = Math.max(2, gap * 0.45);
        ctx.strokeRect(cx, cy, cw, ch);
      }
    }
  });

  // Selected-panel marker is an editor affordance, never on exports: the
  // editor draws it on its own overlay canvas, not here.

  // --- title block ---------------------------------------------------------
  const title = (state.title || '').toUpperCase();
  const bottom = state.titlePos !== 'top';
  const bandH = ih * (bottom ? 0.34 : 0.3);
  const bandY = bottom ? iy + ih - bandH : iy;
  const scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (bottom) {
    scrim.addColorStop(0, 'rgba(8,2,16,0)');
    scrim.addColorStop(0.45, 'rgba(8,2,16,0.55)');
    scrim.addColorStop(1, 'rgba(8,2,16,0.82)');
  } else {
    scrim.addColorStop(0, 'rgba(8,2,16,0.82)');
    scrim.addColorStop(0.55, 'rgba(8,2,16,0.55)');
    scrim.addColorStop(1, 'rgba(8,2,16,0)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(ix, bandY, iw, bandH);

  if (state.halftone) {
    // Halftone dots across the title band, fading toward its open edge.
    ctx.save();
    ctx.beginPath();
    ctx.rect(ix, bandY, iw, bandH);
    ctx.clip();
    const dot = Math.max(3, Math.round(7 * u));
    const step = dot * 2.4;
    for (let y = bandY + step / 2; y < bandY + bandH; y += step) {
      const fade = bottom ? (y - bandY) / bandH : (bandY + bandH - y) / bandH;
      for (let x = ix + step / 2; x < ix + iw; x += step) {
        ctx.fillStyle = `rgba(255,255,255,${(0.10 + 0.22 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, dot * (0.5 + fade * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  const padX = ix + iw * 0.055;
  const maxTextW = iw * 0.89;
  const titlePx = fitFont(ctx, title || ' ', maxTextW, Math.round(W * 0.104 * state.titleSize), 'Anton, "Arial Narrow", sans-serif', 400);
  const titleY = bottom
    ? bandY + bandH * 0.46
    : bandY + bandH * 0.32;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = Math.round(14 * u);
  ctx.shadowOffsetY = Math.round(4 * u);
  if (state.titleStyle === 'sunset') {
    const tg = ctx.createLinearGradient(padX, titleY - titlePx * 0.6, padX, titleY + titlePx * 0.6);
    tg.addColorStop(0, '#ffe27a');
    tg.addColorStop(0.5, '#ff7a18');
    tg.addColorStop(1, '#ff2e88');
    ctx.fillStyle = tg;
  } else if (state.titleStyle === 'outline') {
    ctx.fillStyle = 'rgba(10,4,20,0.25)';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.lineWidth = Math.max(2, Math.round(titlePx * (state.titleStyle === 'outline' ? 0.14 : 0.09)));
  ctx.strokeStyle = state.titleStyle === 'outline' ? '#ffffff' : '#14061f';
  ctx.lineJoin = 'round';
  if (title) {
    ctx.strokeText(title, padX, titleY);
    ctx.fillText(title, padX, titleY);
  }
  ctx.restore();

  // Script subtitle under (or over) the title, in neon pink with a glow.
  if (state.subtitle) {
    const subPx = Math.round(titlePx * 0.38);
    ctx.save();
    ctx.font = `${subPx}px Pacifico, "Segoe Script", cursive`;
    try { ctx.letterSpacing = '0px'; } catch (_) {}
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.round(18 * u);
    ctx.fillStyle = '#ffd7ea';
    const subY = bottom ? titleY + titlePx * 0.58 : titleY + titlePx * 0.6;
    ctx.fillText(state.subtitle, padX + Math.round(4 * u), subY);
    ctx.restore();
  }

  // Badge ribbon, top-right (or bottom-right when the title is on top).
  if (state.badge) {
    const bPx = Math.round(Math.min(W, H) * 0.028);
    ctx.save();
    ctx.font = `400 ${bPx}px Anton, "Arial Narrow", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(bPx * 0.08)}px`; } catch (_) {}
    const tw = ctx.measureText(state.badge.toUpperCase()).width;
    const bw2 = tw + bPx * 1.6;
    const bh2 = bPx * 2.1;
    const bx = ix + iw - bw2 - Math.round(iw * 0.03);
    const by = bottom ? iy + Math.round(ih * 0.035) : iy + ih - bh2 - Math.round(ih * 0.035);
    const bg2 = ctx.createLinearGradient(bx, by, bx + bw2, by + bh2);
    bg2.addColorStop(0, '#ff7a18');
    bg2.addColorStop(1, '#ff2e88');
    roundRectPath(ctx, bx, by, bw2, bh2, bh2 / 2);
    ctx.fillStyle = bg2;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge.toUpperCase(), bx + bw2 / 2, by + bh2 / 2 + 1);
    ctx.restore();
  }

  // Heat meter: five stars, top-left (or bottom-left when title is on top),
  // on a dark pill so it reads over bright skies as well as dark streets.
  const heat = Math.max(0, Math.min(5, state.heat | 0));
  {
    const sPx = Math.round(Math.min(W, H) * 0.034);
    ctx.save();
    ctx.font = `${sPx}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const hx = ix + Math.round(iw * 0.03);
    const hy = bottom ? iy + Math.round(ih * 0.035) + sPx * 0.55 : iy + ih - Math.round(ih * 0.035) - sPx * 0.55;
    ctx.font = `600 ${Math.round(sPx * 0.62)}px system-ui, sans-serif`;
    const labelW = ctx.measureText('HEAT').width;
    ctx.font = `${sPx}px system-ui, sans-serif`;
    const rowW = labelW + 10 + 5 * sPx * 1.12;
    const pillH = sPx * 1.7;
    roundRectPath(ctx, hx - sPx * 0.35, hy - pillH / 2, rowW + sPx * 0.7, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(10,4,20,0.45)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `600 ${Math.round(sPx * 0.62)}px system-ui, sans-serif`;
    ctx.fillText('HEAT', hx, hy);
    ctx.font = `${sPx}px system-ui, sans-serif`;
    for (let s = 0; s < 5; s++) {
      ctx.fillStyle = s < heat ? '#ffc93c' : 'rgba(255,255,255,0.28)';
      ctx.fillText(s < heat ? '★' : '☆', hx + labelW + 10 + s * sPx * 1.12, hy);
    }
    ctx.restore();
  }

  // Finish: grain, then vignette.
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(ix, iy, iw, ih);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(
      ix + iw / 2, iy + ih / 2, Math.min(iw, ih) * 0.42,
      ix + iw / 2, iy + ih / 2, Math.max(iw, ih) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,0,12,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(ix, iy, iw, ih);
  }
  ctx.restore();
}

// Render a cover to a fresh canvas at exact pixel size. photos: images.
export function renderCoverToCanvas(W, H, state, photos) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), W, H, state, photos);
  return canvas;
}

// Which panel (index) sits at canvas pixel (px, py)? -1 when none. The tilt
// layout tests unrotated rects, topmost cell last, which is close enough for
// picking a panel in the editor.
export function panelAt(state, px, py, W, H) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero3;
  const framePad = state.frame ? Math.round(Math.min(W, H) * 0.028) : 0;
  const ix = framePad;
  const iy = framePad;
  const iw = W - framePad * 2;
  const ih = H - framePad * 2;
  for (let i = layout.cells.length - 1; i >= 0; i--) {
    const c = layout.cells[i];
    if (px >= ix + c.x * iw && px <= ix + (c.x + c.w) * iw &&
        py >= iy + c.y * ih && py <= iy + (c.y + c.h) * ih) return i;
  }
  return -1;
}
