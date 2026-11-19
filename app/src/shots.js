// Vice Cover Studio — shot mode (src/shots.js).
//
// Deterministic scenes for the maker's screenshots, driven by the URL:
//   ?shot=cover&photo=pier&caption=Sunset%20Heist&size=wide&layout=hero3&grade=sunset
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen&size=square
// shot=cover hides the workbench and draws only the cover, at the export
// size for that canvas; shot=editor keeps the workbench with a photo loaded.
// Either way the page sets window.__shotReady once the fonts are in and the
// cover is drawn, so a screenshot script can wait for it.
//
// This is the app's own drawing of its cover at a size within the gate's
// screenshot limits — the rules allow a screenshot to show that, or the PNG
// the app exported scaled down.

import { SIZES } from './cover.js';

const PHOTO_INDEX = { boulevard: 0, pier: 1 };

export function initShotMode(api) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) {
    window.__shotReady = true;
    return;
  }
  const next = { ...api.state };
  const photo = params.get('photo');
  if (photo !== null && PHOTO_INDEX[photo] !== undefined) {
    const i = PHOTO_INDEX[photo];
    next.panels = next.panels.map((p) => ({ ...p, photo: i }));
    next.selected = 0;
  }
  if (params.get('caption') !== null) next.title = params.get('caption');
  if (params.get('subtitle') !== null) next.subtitle = params.get('subtitle');
  if (params.get('layout') !== null) next.layout = params.get('layout');
  if (params.get('grade') !== null) next.grade = params.get('grade');
  if (params.get('size') !== null && SIZES[params.get('size')]) next.size = params.get('size');
  if (params.get('titleStyle') !== null) next.titleStyle = params.get('titleStyle');
  if (params.get('titlePos') !== null) next.titlePos = params.get('titlePos');
  if (params.get('badge') !== null) next.badge = params.get('badge');
  if (params.get('heat') !== null) next.heat = Number(params.get('heat'));
  api.setState(next);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    document.title = `Cover — ${next.title}`;
    // Draw at the full export size; CSS scales it to the viewport.
    const size = SIZES[next.size] || SIZES.square;
    const canvas = document.getElementById('coverCanvas');
    canvas.width = size.w;
    canvas.height = size.h;
  }
  api.syncControls();

  const finish = async () => {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    } catch (_) { /* draw with fallback fonts */ }
    api.render();
    // Let the canvas paint before the screenshot is taken.
    requestAnimationFrame(() => {
      setTimeout(() => { window.__shotReady = true; }, 120);
    });
  };
  finish();
}
