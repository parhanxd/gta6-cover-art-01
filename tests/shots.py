"""Vice Cover Studio: functional test + screenshot capture.

Serves app/ with the entry's own serve.ts, drives it in the cached Chromium,
checks for console errors and network requests, exercises the editor
(upload-free: the two sample photos), verifies PNG exports at all four sizes
with exact pixel dimensions, and writes the screenshots from shots.json
(JPEG q82, each <= 256 KiB, long side <= 1280, short side >= 480).

Usage: python3 tests/shots.py [--shots-only]
"""
import json
import os
import struct
import subprocess
import sys
import time

sys.path.insert(0, '/home/hatch/workspace/.venvs/gta6-tmp/pylibs')
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'screenshots')
CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'
PORT = int(os.environ.get('SHOTS_PORT', '8902'))
BASE = f'http://localhost:{PORT}'


def jpeg_size(path):
    """Width, height of a JPEG file by parsing its SOF0/SOF2 marker."""
    with open(path, 'rb') as f:
        data = f.read()
    i = 2
    while i < len(data) - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack('>HH', data[i + 5:i + 9])
            return w, h
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        length = struct.unpack('>H', data[i + 2:i + 4])[0]
        i += 2 + length
    raise ValueError(f'no SOF marker in {path}')


def main():
    shots_only = '--shots-only' in sys.argv
    env = dict(os.environ, PORT=str(PORT))
    server = subprocess.Popen(
        ['node', 'serve.ts'], cwd=ROOT, env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(1.5)
    errors, failed, external = [], [], []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            page = browser.new_page(viewport={'width': 1280, 'height': 800})
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('requestfailed', lambda r: failed.append(r.url))
            page.on('request', lambda r: external.append(r.url)
                    if not r.url.startswith(BASE) and not r.url.startswith('data:') else None)

            page.goto(BASE + '/')
            page.wait_for_function("window.__vice && window.__vice.photos.length === 2")
            page.wait_for_timeout(400)
            n_photos = page.evaluate('window.__vice.photos.length')
            n_layouts = page.evaluate("document.querySelectorAll('.layout-btn').length")
            n_grades = page.evaluate("document.querySelectorAll('.grade-btn').length")
            n_sizes = page.evaluate("document.querySelectorAll('.size-btn').length")
            print(f'CHECK photos loaded: {n_photos} (expect 2)')
            print(f'CHECK layout buttons: {n_layouts} (expect 6)')
            print(f'CHECK grade buttons: {n_grades} (expect 6)')
            print(f'CHECK size buttons: {n_sizes} (expect 4)')
            assert page.evaluate("document.fonts.check('400 40px Anton')"), 'Anton did not load'
            assert page.evaluate("document.fonts.check('400 40px Pacifico')"), 'Pacifico did not load'
            print('CHECK fonts: Anton + Pacifico loaded')

            # Switch layout + grade + title, then undo returns to the start.
            before = page.evaluate("JSON.stringify(window.__vice.state)")
            page.click(".layout-btn[data-layout='grid9']")
            page.click(".grade-btn[data-grade='neon']")
            page.fill('#titleInput', 'NEON NIGHTS')
            page.wait_for_timeout(700)
            after = page.evaluate("JSON.stringify(window.__vice.state)")
            assert before != after, 'state did not change'
            st = page.evaluate("window.__vice.state")
            assert st['layout'] == 'grid9' and st['grade'] == 'neon' and st['title'] == 'NEON NIGHTS', st
            print('CHECK layout+grade+title edit: state updated')
            page.click('#undoBtn')
            page.wait_for_timeout(300)
            page.click('#undoBtn')
            page.wait_for_timeout(300)
            page.click('#undoBtn')
            page.wait_for_timeout(300)
            st = page.evaluate("window.__vice.state")
            assert st['layout'] == 'hero3', st['layout']
            print('CHECK undo x3: layout back to hero3')
            page.click('#redoBtn')
            page.wait_for_timeout(300)
            assert page.evaluate("window.__vice.state.layout") == 'grid9'
            print('CHECK redo: layout grid9 again')
            page.click('#resetBtn')
            page.wait_for_timeout(300)

            # Drag on the preview pans the selected panel's photo.
            box = page.evaluate("(() => { const r = document.getElementById('coverCanvas').getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; })()")
            ox0 = page.evaluate("window.__vice.state.panels[0].ox")
            page.mouse.move(box['x'] + box['w'] * 0.3, box['y'] + box['h'] * 0.3)
            page.mouse.down()
            page.mouse.move(box['x'] + box['w'] * 0.38, box['y'] + box['h'] * 0.36, steps=8)
            page.mouse.up()
            page.wait_for_timeout(300)
            ox1 = page.evaluate("window.__vice.state.panels[0].ox")
            assert ox1 != ox0, f'drag did not pan (ox {ox0} -> {ox1})'
            print(f'CHECK drag pans panel photo: ox {ox0} -> {ox1}')
            page.click('#resetBtn')
            page.wait_for_timeout(300)

            # Export: exact pixel dimensions + non-blank PNG bytes, all sizes.
            for key, (w, h) in {'square': (1080, 1080), 'portrait': (1080, 1350),
                                'wide': (1920, 1080), 'story': (1080, 1920)}.items():
                info = page.evaluate(
                    """([w, h]) => {
                        const c = window.__vice.renderCoverToCanvas(w, h);
                        const d = c.getContext('2d').getImageData(0, 0, w, h).data;
                        let sum = 0, n = 0;
                        for (let i = 0; i < d.length; i += 401 * 4) { sum += d[i] + d[i+1] + d[i+2]; n++; }
                        return { w: c.width, h: c.height, mean: sum / n };
                    }""", [w, h])
                assert (info['w'], info['h']) == (w, h), info
                assert info['mean'] > 20, f'{key} export looks blank (mean {info["mean"]})'
                blob_len = page.evaluate(
                    """async ([w, h]) => {
                        const c = window.__vice.renderCoverToCanvas(w, h);
                        const b = await new Promise(r => c.toBlob(r, 'image/png'));
                        return b.size;
                    }""", [w, h])
                assert blob_len > 50000, f'{key} PNG suspiciously small: {blob_len}'
                print(f'CHECK export {key}: {w}x{h} PNG {blob_len} bytes, mean pixel {info["mean"]:.1f}')

            # Mobile viewport sanity.
            mob = browser.new_page(viewport={'width': 390, 'height': 844})
            mob.on('pageerror', lambda e: errors.append('mobile: ' + str(e)))
            mob.goto(BASE + '/')
            mob.wait_for_function("window.__vice && window.__vice.photos.length === 2")
            print('CHECK mobile 390x844: app loads, 2 photos')
            mob.close()

            # ---- screenshots from shots.json ----
            os.makedirs(SHOTS, exist_ok=True)
            with open(os.path.join(ROOT, 'shots.json')) as f:
                shots = json.load(f)
            for shot in shots:
                pg = browser.new_page(viewport={'width': shot['w'], 'height': shot['h']})
                pg.on('pageerror', lambda e: errors.append('shot: ' + str(e)))
                pg.goto(BASE + '/' + shot['query'])
                pg.wait_for_function("window.__shotReady === true", timeout=15000)
                pg.wait_for_timeout(300)
                out = os.path.join(SHOTS, shot['name'])
                pg.screenshot(path=out, type='jpeg', quality=shot.get('q', 82))
                size = os.path.getsize(out)
                w, h = jpeg_size(out)
                print(f'SHOT {shot["name"]}: {w}x{h} {size} bytes (cap 262144)')
                assert size <= 262144, shot['name']
                assert max(w, h) <= 1280 and min(w, h) >= 480, (w, h)
                pg.close()
            browser.close()
    finally:
        server.terminate()
    print(f'CONSOLE ERRORS: {len(errors)} {errors[:5]}')
    print(f'FAILED REQUESTS: {len(failed)} {failed[:5]}')
    print(f'EXTERNAL REQUESTS: {len(external)} {external[:5]}')
    if not shots_only:
        assert not errors, errors
        assert not failed, failed
        assert not external, external
    print('ALL CHECKS PASSED' if not errors and not failed and not external else 'CHECKS DONE WITH ISSUES')


if __name__ == '__main__':
    main()
