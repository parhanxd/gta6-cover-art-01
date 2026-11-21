# Vice Cover Studio — GTA-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/parhanxd/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/parhanxd/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your own photos into GTA-style multi-panel cover art, offline in your
browser. Nothing uploads: photos are read on your machine and never leave it.

## What it does

- **Your photos** — add up to 8 photos from your device (two sample photos
  are built in so you can try everything right away). Each panel holds its
  own photo, or one photo can fill every panel — each panel keeps its own
  crop, so one photo becomes several different shots.
- **Crop and position per panel** — click a panel to select it, drag on the
  preview to move its photo, scroll to zoom, or use the Zoom / Position
  sliders and Flip. The photo always keeps covering its panel.
- **6 layouts** — Hero + Three, Four Grid, Nine Grid, Full Bleed, Triptych,
  Tilted Snapshots (polaroids).
- **6 colour grades** — Sunset, Neon Nights, Vice Nights, Golden Hour, Noir,
  Palm Teal (gradient-map overlays + saturation/contrast).
- **Caption** — editable title (Anton) with White / Sunset-gradient /
  Outline styles, top or bottom, size slider; Pacifico script subtitle;
  badge ribbon; 0–5 star heat meter.
- **Finish** — white poster frame, film grain, vignette, halftone title block.
- **4 one-click looks** — Sunset Heist, Neon Nights, Golden Getaway,
  Noir Pier. **Undo/redo** (Ctrl+Z / Ctrl+Y).
- **Export PNG** — 1080×1080, 1080×1350, 1920×1080 and 1080×1920, exact
  pixels, one button per size or all four at once.

## Run it

```
node serve.ts        # http://localhost:8080
```

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored
`vendor/makefun-app.ts` library:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node <kit>/cli/makefun.mjs check --kit <kit> --repo .
```

Screenshots in `screenshots/` are taken by the app itself via
`tests/shots.py` (Playwright + the cached Chromium): the first is the
exported wide cover, the second the editor with a photo loaded, the third
and fourth exported portrait and square covers. `?shot=cover` /
`?shot=editor` in `app/src/shots.js` drive the deterministic scenes.

## Originality

No Rockstar Games logo, wordmark, official artwork, character or font.
Lettering is Anton and Pacifico, shipped as files under `app/fonts/` under
the SIL Open Font License (`app/fonts/OFL.txt`). The two sample photos are
the kit starter's, made with an image model for make.fun and free to use.
