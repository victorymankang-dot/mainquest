# Templum Salutis — Build & Upgrade Log

## Goal
Interactive 3D "healing temple" in the spirit of Gaudí (Sagrada Família / Park Güell).
Deliverable: self-contained website (Three.js), full sanctuary — basilica exterior + explorable interior + gardens, fountain, labyrinth, time-of-day lighting.

## Decisions locked in
- **Format**: single-page Three.js app, no external assets (all geometry & textures procedural via canvas).
- **Stack**: `three@0.160.0` vendored locally (`vendor/`) → works offline, no CDN dependency.
- **Serving**: needs a local HTTP server (ES modules are blocked over `file://` in Chrome). `run.bat` starts `python -m http.server 8123` and opens the page.
- **UI language**: English (gothic-elegant serif styling, gold/deep-green palette).
- **Features**: orbit/zoom/pan camera + 6 cinematic preset views, clickable glowing hotspots with story text, time-of-day slider (morning → midday → golden hour → dusk, windows/candles glow at dusk), ambient generative audio (wind, birds, 396/528/639 Hz healing bells), floating dust motes, flying birds.
- **Scene contents**: cruciform basilica (nave + transepts + apse), 10 trencadís spires + central "Tower of Jesus" with four-armed cross, rose window, 3 bronze portals, tree-like interior columns, vaulted ceilings, healing pool in the apse, extruded arch facade frames, grass lawns, stone plaza, cypress avenue, olive trees, stone pines, lavender beds, meditation labyrinth (west lawn), Park Güell-style trencadís serpentine benches + Fountain of Life ("Font de la Vida"), entrance gate with plaque.

## File map
| File | Purpose | Status |
|---|---|---|
| `index.html` | UI shell, import map, pilgrim overlay, auth modal, prayer wall | **done** |
| `js/config.js` | Supabase URL + publishable key (safe client-side) | **done** |
| `js/auth.js` | Auth + session + pilgrim sync + prayer-wall CRUD (fails soft) | **done** |
| `supabase/schema.sql` | `prayers` table + RLS — run once in SQL editor | **done — user action** |
| `vendor/` | three.module.js + OrbitControls.js (0.160.0), supabase.umd.js (2.118.0) | **done** |
| `js/textures.js` | Canvas-generated textures (stone, trencadís, stained glass, rose window, floor mosaic, grass, plaque, glow/flame/bird sprites) | **done** |
| `js/main.js` | Scene build (temple + grounds + effects), animation loop, time-of-day, hotspots, audio, accounts wiring | **done** |
| `run.bat` | One-click local server + browser | **done** |
| `README.md` | How to run | **done** |
| `preview.png` | Golden-hour screenshot for README/sharing | **done** |
| `files/pdr.md` | Product Design Record v2.0 (scope as built, F1–F11 matrix, ADRs, risks, roadmap) | **done** |

## Progress journal
1. ✅ Env check: Windows, Python 3.15.1, Node 24.22.1. No Playwright/Puppeteer initially → verification via headless system Chrome + `puppeteer-core` (installed in scratch `%LOCALAPPDATA%\Temp\opencode\smoke`, **not** in the project).
2. ✅ Downloaded three@0.160.0 (`build/three.module.js`, `examples/jsm/controls/OrbitControls.js`).
3. ✅ `js/textures.js` — 13 texture factories, all seeded canvases, sRGB colorspace, repeat wrapping.
4. ✅ `js/main.js` + `index.html` — full sanctuary (see file map).
5. ✅ Visual verification (Chrome 140 headless, SwiftShader WebGL): **no console/page errors**; all 6 camera presets screenshotted; golden-hour + dusk lighting checked.
6. ✅ **Pilgrim characters** — Brother Martin (monk) / Sister Lucia (nun), selectable on arrival (chooser overlay), third-person walk mode (WASD/arrows + drag-look + Shift run + Esc exit + touch joystick), full collision (walls, apse annulus, fountain, trees, altar dais, columns), plinth steps walkable (height ramp), footsteps/blink/breathing/limb-swing animation, "switch pilgrim" link, touch joystick on coarse-pointer devices.
7. ✅ Walk-through verification: spawn → steps ramp (y climbs 0→2) → porch blocked by facade at x=5.5 (wall holds) → fountain blocks straight line at plaza → Esc returns to orbit with target glued to the pilgrim.
8. ✅ Interior lighting overhaul — point lights moved to decay=1 with boosted intensity (interior was readable only as silhouette).
9. ✅ **Novice Pip (v1.2)** — child monk with hood drawn up (lathe hood + tip), bigger eyes, rosy cheeks, 0.74× scale; third SVG card in the chooser; spawn/scale verified headlessly (state `scale: 0.74`, `mode: walk`), nave walk-through screenshotted.
10. ✅ **Supabase backend (v1.3) — accounts & the Prayer Wall**
   - Vendored `@supabase/supabase-js@2.118.0` UMD (self-contained, offline-capable; the `+esm` build pulls `/npm/…` URLs — rejected for vendoring).
   - `js/config.js` (URL + publishable key — safe client-side, guarded by RLS), `js/auth.js` (email/password signUp/signIn/signOut, session persistence, pilgrim choice synced into `user_metadata`, prayer-wall CRUD with soft-fail everywhere).
   - UI: sign-in modal (sign in ↔ create account toggle, pretty error mapping), top-right auth pill (name · sign out), right slide-in **Prayer Wall** (list + 280-char form + char counter + withdraw-own rows + relative times), toast system.
   - UX constraint: overlay "owns" the screen until entered → floating buttons hidden until `body.ts-entered` (they were unclickable behind the chooser — pointer-events bug found via headless click test).
   - Guests can read the wall; only signed-in visitors may post/delete their own intentions (RLS). Table missing → wall shows setup instructions instead of an error.
   - **Verified headlessly:** no console/page errors on load; wall opens, guest state correct; auth pill visible post-entry; schema-missing notice shown correctly; window.supabase loads offline.
   - **Pending user action:** run `supabase/schema.sql` in the Supabase SQL editor (creates `public.prayers` + RLS); then signup/signin/wall are fully live. (Publishable key cannot create tables — needs dashboard or service key.)
11. ✅ **Nameplates & Kneel-to-Pray (v1.5)** — floating gold-rimmed nameplate sprite above the pilgrim (signed-in display name via auth metadata; guest fallback to the character's name; auto-shrinks long names; rebuilt on auth change, old textures disposed). **Kneel to pray**: `N` key or panel button toggles a kneel pose (crouch compression, head bowed, forearms lifted, staff planted, camera dolly-in, breathing continues), blocked movement while kneeling, aria-pressed state swaps button to **✶ Rise**, soft bell on kneel (respects Sound off), special quiet toast within 5 m of the Healing Pool. Verified headlessly: kneel target toggles 0→1→0, button state syncs, zero console errors.
12. ✅ **Published (v1.4)** — Cloudflare Pages (now part of Cloudflare Workers), project `templum-salutis`, account Victoryman.kang@gmail.com's Account (id 71b3d637…). Live URL: **https://templum-salutis.victoryman-kang.workers.dev** (Pages moved to workers.dev hosts; not templum-salutis.pages.dev).
    - Deploy artifacts staged in `dist/` (index.html, js/, vendor/, `_headers`: nosniff, DENY framing, referrer policy, immutable caching for `/vendor/*`, 1 h for `/js/*`) — no dev docs shipped.
    - Auth quirk: `wrangler login` (OAuth) succeeded but non-interactive shell rejected the token for Pages→Workers delegation → fix = `CLOUDFLARE_API_TOKEN` read from `default.toml` + `CLOUDFLARE_ACCOUNT_ID` env for the command. whoami confirmed account access. Project + deploy both succeeded (v1: 14d35993… / v2: 41b8cc63…).
    - Verified live: `GET /` 200 (28,769 bytes), title OK, `x-content-type-options: nosniff`, all JS/vendor assets 200.
    - Notice for future deploys: platform says use `wrangler deploy` going forward (do **not** pass `--force`).
13. ✅ **Bugs fixed (v1.1):** entrance steps were embedded inside the plinth (invisible) → moved to plinth front edge + apse undercroft sealed; plinth push-out teleported interior pilgrims 6 m south (smallest-penetration rule) → push-out now only below y=1.5, interior walk free; character spawn (0,0,37) sat inside the fountain collider → moved to plaza SE arc (5.5, 0, 43); headless-1fps movement too slow → dt clamp 0.05→0.09 (tunneling still impossible, 0.46 m/step < wall thickness).

## Bugs found via screenshot review & fixed
| # | Bug | Fix |
|---|---|---|
| 1 | **Transept N/S walls spanned the full 34 m width, sealing the nave** — every interior/preset view stared at a blank stone wall | Walls split into two 9 m segments at x = ±12.5; crossing kept open; transept decal windows moved to the arms |
| 2 | Camera fly-to lerped straight through walls/spires (nave & dusk shots were black/inside-geometry) | Replaced lerp with **0.2 s veil flash** transition |
| 3 | Dust motes rendered as hard squares | `PointsMaterial` now uses radial glow sprite |
| 4 | Serpentine bench `TubeGeometry` mesh scaled → seat/backrest displaced | Removed scaling; authored explicit heights |
| 5 | Candles spawned inside the healing-pool water arc | Repositioned on an arc behind the pool (radius 4.5 m) |
| 6 | "Healing Pool" preset view blocked by the altar | Raised camera to y=10.5 looking over the altar; pool + candle arc revealed |
| 7 | maxPolarAngle clamp auto-lifted camera y by ~2.8 | Relaxed to π/2 (horizon) |
| 8 | Dusk facade too dark to read | Warm facade uplights (fade in with dusk), hemisphere 0.5→0.7, exposure 0.92→0.97, fog lifted, sun intensity up |
| 9 | Transept interior rose decals placed inside the wall | Interior decals moved to inner faces (x = ±16.42) |
| 10 | "Healing Pool" hotspot/pool `CircleGeometry` half-disc orientation | Verified correct via top-down shot (arc faces apse) |
| 11 | Entrance steps embedded inside plinth → invisible & unclimbable | Steps moved to plinth front edge (z 29.5→33.8), height ramp in `baseGroundY()` |
| 12 | Any pilgrim standing inside the plinth footprint got teleported to the nearest face (6 m jump) | Plinth push-out only below y=1.5; interior/porch walk free; wall AABBs still hold |
| 13 | Walk spawn inside fountain collider (push-out on first step) | Spawn moved to (5.5, 0, 43) on plaza SE arc |
| 14 | Interior point lights decay=2, too dim to read | decay=1, intensities ~2×, warm interior restored |
| 15 | Headless SwiftShader (~1 fps) made walking glacial | dt clamp 0.09; production 60 fps unaffected |

## Design notes / gotchas
- Vaults built from open-ended half-cylinders rotated to axis: nave vault `rotateX(PI/2)` with `thetaStart=PI/2, length=PI` and BackSide; transept vault `rotateZ(PI/2)` with `thetaStart=0, length=PI`. Outer shell uses a second mesh with FrontSide + trencadís "roof" palette so the exterior silhouette reads like Park Güell ceramic roofing.
- `ColorManagement`/lights follow r160 physical lighting: sun intensity ~2.6, hemisphere ~1.1, indoor points ~15–25 (decay 2). Renderer: ACESFilmic + sRGB output, shadows PCFSoft 2048.
- Staggered ground decal heights (ring path y=0.015, plaza y=0.03, path y=0.025) to avoid z-fighting.
- Apse semi-dome is a squashed full hemisphere (scale y 0.55) centered on the apse — reads as a semi-dome from the nave.
- Hotspot hit-meshes use opacity-0 spheres for easy clicking; raycaster → info panel.

## Verification record (smoke tests)
- Tooling: `puppeteer-core` + system Chrome (`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`), flags `--use-angle=swiftshader --enable-unsafe-swiftshader` for headless WebGL.
- Result: **NO CONSOLE/PAGE ERRORS** on load and on all UI interactions tested (view buttons, time-of-day slider to dusk).
- Screenshots confirm: overview (golden hour), nave interior (tree columns + golden cross + candles), healing pool (candle arc + oculus + tiered apse spires), facade at dusk (rose window blazing, uplight-warmed stone, stars).
- Raycast-from-camera diagnostic (diag2.cjs) was used to locate the nave-blocking wall bug — bounding-box vs ray test from inside the nave.
- Debug handle left in place for future tests: `window.__T = { camera, controls, flyTo, scene }` (console-tunable, removable before any public deploy).
- Server log confirmed all assets 200 (index, main.js, textures.js, vendored three + OrbitControls).
- Test harness lives **outside** the project: `%LOCALAPPDATA%\Temp\opencode\smoke\` (`smoke.cjs`, `diag.cjs`, `diag2.cjs`). Re-run: `python -m http.server 8123` (from project root) + `node smoke.cjs`.

## How to resume / upgrade
1. `cd C:\Users\quant\healing-temple && python -m http.server 8123` → open <http://localhost:8123>
2. Read this file top-to-bottom; `README.md` for user-facing docs.
3. Pick from the backlog below; keep changes merged screenshot-verified (headless Chrome workflow above beats blind coding).
4. Syntax gate: `copy js\main.js %TEMP%\main.mjs && node --check %TEMP%\main.mjs`.

## Upgrade backlog (future)
- Photo/screenshot mode with free camera + UI hidden.
- VR (WebXR immersive mode) for the prayer/healing loop.
- Day–night cycle animation + seasonal foliage (cypress → blossom).
- Deeper audio: layered choir swell at the apse, water trickle at the fountain (HRTF).
- Higher density geometry pass: façade sculpture niches with figures, pinnacles on every buttress, finial crosses.
- Performance: merge static geometry (BufferGeometryUtils), LOD for spires, baked AO into vertex colors.
- Accessibility: keyboard-only navigation, screen-reader labels for hotspots, reduced-motion mode.
- Localization (CA/ES/KO) toggle — bench/fountain names are Catalan ("Font de la Vida").
- Save/restore viewpoint via URL hash (`#view=pool&tod=dusk`).
