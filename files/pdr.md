# PDR — Templum Salutis: The Healing Temple

**Product Design Record · v2.0 · 2026-11-03**
**Status:** Built · Verified · **Live in production** — https://templum-salutis.victoryman-kang.workers.dev
**Supersedes:** v1.0 (2026-11-03, pre-build)
**Companion docs:** `../README.md` (run guide) · `../PROCESS.md` (build log & upgrade backlog)

---

## 1. Executive summary

Templum Salutis is a free, public, interactive 3D sanctuary in the spirit of Antoni Gaudí,
published as a dependency-free static site. Anyone with the link can walk in, choose a
pilgrim (a monk, a nun, or a child novice), wander from the gate through the basilica to the
healing pool, light time-of-day to golden hour, and — optionally with an account — leave an
intention on the shared Prayer Wall. It is simultaneously a contemplative artwork, a technical
showcase of fully procedural web 3D (no asset stores, no build pipeline), and a living
prototype of a quiet-social product (accounts + community wall, without feeds or metrics bait).

Delivered end-to-end by an AI-assisted build in a single session; every claim below is marked
**Built** or **Verified** (headless Chrome on SwiftShader; no console/page errors) unless noted.

## 2. Product overview

| | |
|---|---|
| **Live** | https://templum-salutis.victoryman-kang.workers.dev (Cloudflare; `dist/` deploys) |
| **Cost** | $0 to visit; hosting free tier; accounts free tier |
| **Stack** | Three.js 0.160.0 (vendored) · vanilla ES modules · no framework · no build step |
| **Backend** | Supabase (email/password auth, Postgres + RLS, `prayers` table) |
| **Assets** | 100 % procedural (canvas textures, lathe/extrude geometry); vendored libs only |
| **Offline** | Works fully offline from a local server; needs network only for accounts/wall |

## 3. Problem & opportunity

- Web 3D demos are tech-first: geometry dumps, no place, no feeling. Templum Salutis proves
  that a browser can hold a *place* — with silence, light, and invitation.
- Spiritual/healing content online trends toward monetization and noise. A slow, wordless,
  beautiful alternative is rare and shareable — ideal for organic reach and portfolio value.
- The build demonstrates a reusable playbook: procedural art direction + AI-pair-programmer +
  headless verification (SwiftShader) + zero-asset licensing hygiene.

## 4. Audience

| Segment | Need | What they get |
|---|---|---|
| Casual visitors | Awe, calm | Orbit, cinematic views, sound, nameplates |
| Architecture/art lovers | Gaudí language in 3D | Trencadís, tree columns, cruciform plan |
| Contemplative visitors | A place to be still | Kneel-to-pray, pool, candles, birdsong, bells |
| Faith/wellness communities | Shared ritual | Prayer Wall (signed-in), pilgrimage walk |
| Builders/clients | Proof of craft | Clean architecture, docs, RLS'd backend, CI-free deploy |

## 5. Feature scope (as built)

### 5.1 The basilica
Cruciform plan (nave + transepts + apse); barrel vaults (pale plaster inside, ceramic trencadís
outside); **10 trencadís spires + central "Tower of Jesus"** (four-armed gold cross); west facade
with three pointed-arch bronze portals (ring handles, gilded bars), glowing **rose window**, Latin
plaque `TEMPLVM SALVTIS`, candle-cross niches. Interior: 12 branching tree columns
(porphyry/basalt), altar + great golden cross, **healing pool** (animated shader water),
14 flickering candles, drifting dust motes, sunlight pools from stained glass, warm interior light.

### 5.2 The grounds
Stone plaza, ring path (4 trencadís stations), grand entrance steps up a 2 m plinth (walkable),
entrance gate with plaque, **Font de la Vida** (tiered fountain, animated falling water), four
Park Güell-style serpentine trencadís benches, meditation labyrinth (west lawn), cypress avenue,
olive groves, stone pines, lavender beds, grass with generated texture.

### 5.3 Atmosphere & interaction
- **Time-of-day slider** — morning / midday / **golden hour (default)** / dusk. Fog, sun position,
  sky gradient, exposure, window/rose emissivity, facade uplights, stars and candle boost all lerp.
- **Orbit/zoom/pan** (damped) + **6 cinematic view presets** (veil-flash transitions).
- **Ambient generative audio** — looped filtered-noise wind, random birdsong, 396/528 Hz
  singing-bowl drone, soft bells every ~22–34 s. Respects the Sound toggle everywhere (incl. footsteps).
- **7 golden "story orbs"** → info panel (rose window, spires, tree columns, pool, fountain, bench,
  labyrinth). Click-vs-drag disambiguated; fat invisible hit spheres.
- **UI** — English serif design, gold-on-deep-green, collapsible panel, mobile media queries,
  loading veil, toast notifications.

### 5.4 The pilgrims (walk mode)
- **Brother Martin** (monk · brown habit · tonsure) · **Sister Lucia** (nun · plum habit · kerchief)
  · **Novice Pip** (child monk · mossy hooded habit · 0.74× scale) — choose on arrival
  (inline-SVG portrait cards; blurred sanctuary behind; "simply orbit" escape hatch). Choice persists
  in `localStorage`; synced to the account when signed in.
- Third-person walk (WASD/arrows · drag-look · Shift run · wheel zoom · Esc exit) + touch joystick
  on coarse pointers. **Collision**: basilica shell, apse annulus, fountain, trees, columns, altar
  dais, gate pillars; plinth steps via height ramp. Facade blocks the porch; **only the steps let you in**.
- **Floating nameplate** — gold-rimmed pill above the head showing the signed-in name
  (guests: the character's name); auto-shrinks long names; updates live on sign-in/out.
- **Kneel to pray** — `N` or panel button: kneel pose (crouch, bowed head, lifted forearms, staff
  planted), camera leans in, soft bell, movement locked until rising; a special word at the Healing
  Pool. Button swaps to **✶ Rise** (aria-pressed synced).
- Life: limb-swing walk, idle breathing, random blinking, walking footsteps.

### 5.5 Accounts & the Prayer Wall (optional, Supabase)
- Email/password auth, session persisted; sign-in ↔ create-account modal with friendly error mapping;
  email-confirmation flow handled gracefully when enabled.
- **Prayer Wall** (🕯 bottom-right): everyone reads; signed-in visitors may post ≤ 280-char intentions
  and withdraw their own (RLS). Character counter, relative timestamps, optimistic insert, self-delete.
- Pilgrim choice syncs to the account's auth metadata (cross-device).
- **Fails soft**: without the schema the wall explains how to enable it; without network the rest
  of the sanctuary is untouched. Publishable key + **RLS** = no secrets in the repo; the service
  key is never used client-side.

### 5.6 Publishing & operations
- `dist/` staging (no dev docs shipped) · Cloudflare Pages → **Workers** (workers.dev host) ·
  `_headers`: `nosniff`, `DENY` framing, strict referrer, immutable caching for `/vendor/*` (1 h `/js/*`).
- Deploy: `npx wrangler pages deploy dist --project-name=templum-salutis` (platform now prefers `wrangler deploy`).
- Docs as operations manual: `PROCESS.md` (build log, bugs, verification), this PDR, `README.md`.

## 6. Requirements & verification matrix

| ID | Requirement | Status |
|---|---|---|
| F1 | Loads with zero console/page errors | ✅ headless Chrome (SwiftShader) on load + all UI actions |
| F2 | All 6 camera presets frame their subject | ✅ screenshot-verified; pool reframed, facade dusk uplights added |
| F3 | Time-of-day morphs light/fog/windows/candles/stars | ✅ dusk verified (rose window, uplights, stars, ember sky) |
| F4 | Hotspots open/close story panel | ✅ drag-threshold raycast; keyboard-focusable close ✕ |
| F5 | Sound toggle gates all generative audio | ✅ wind/birds/bells/footsteps/kneel-chime all route via master |
| F6 | Fresh clone runs with `python -m http.server` only | ✅ no build step; vendored libs |
| F7 | Select pilgrim → walk gate → steps → nave | ✅ collision verified (facade/fountain hold); steps ramp 0→2 m |
| F8 | Create account, sign in, post/withdraw prayer | ⏳ UI/auth verified headlessly; live path needs one-time `supabase/schema.sql` (pending user) |
| F9 | Nameplate shows account name (guest → character name) | ✅ verified headlessly (Novice Pip plate visible; guest fallback) |
| F10 | Kneel to pray: enter/exit pose, camera lean-in | ✅ verified headlessly (`kneelTarget` 0→1→0; button syncs; 0 errors) |
| F11 | Production deploy + security headers | ✅ `nosniff` live; all assets 200; walls of docs/tests excluded |

## 7. Non-functional requirements

- **Performance** — < 2 s first paint on broadband (1.3 MB three.js gzip ~360 KB + 0.7 MB rest);
  60 fps target on modern laptops; SwiftShader used for *verification only*. No LOD yet (see L1).
- **Offline / portability** — runs from any static server; internet needed only for auth/prayers.
- **Security** — no secrets in repo; Supabase publishable key is public by design; all data access
  mediated by RLS; CSP-compatible layout (inline styles only; no eval); referrer/nosniff/frame headers.
- **Accessibility** — buttons/labels/aria on all controls; Escape closes overlays; reduced motion not
  yet honored (L6); keyboard camera missing (L6); contrast passes for primary text on dark panels.
- **Maintainability** — procedural factories, no framework, commented sections, docs as code;
  `node --check` syntax gate; headless Chrome harness in scratch dir.
- **Legal** — 100 % procedural art; Three.js MIT; no fonts fetched (system serif stack).

## 8. Design principles

1. **Light is the protagonist** — design the sun before textures; golden hour is the default.
2. **Nature as blueprint** — tree columns, spires as stone wheat, elliptical arcs over straight lines.
3. **Craft shows in imperfection** — random shard polygons beat mechanical tiling (trencadís).
4. **Stillness over stimulation** — no timers, scores, or streaks; the user lingers or leaves.
5. **Every asset earned** — procedural or vendored; never a stock asset.
6. **Fail soft** — the sanctuary survives its backend; the backend never breaks the sanctuary.

## 9. Key decisions (ADR digest)

| # | Decision | Alternative rejected | Why |
|---|---|---|---|
| A1 | Three.js static page | Unity/Blender export | Zero-install, instant, trivially hosted |
| A2 | Procedural textures/geometry | CC0 packs | License-clean, stylistically unified, offline |
| A3 | Vendored `three.module.js` + import map | CDN | Offline, deterministic, auditable |
| A4 | UMD `supabase.umd.js` | `+esm` jsDelivr bundle | `+esm` pulls cross-origin `/npm/*` at runtime — useless offline |
| A5 | Publishable key + RLS | Server-side proxy/secret key | Static host, no secrets, data guarded at the row level |
| A6 | Decal windows (emissive planes) | CSG wall openings | Robustness > literal holes; reads as stained glass at distance & night |
| A7 | Veil-flash camera cuts | Smooth fly-to lerp | Lerp drove camera through walls/spires (PROCESS.md #2) |
| A8 | 2D XZ push-out collision + apse annulus | Physics engine (cannon/rapier) | 1.9 MB site budget; full 3D physics unnecessary |
| A9 | Plinth step height ramp (`baseGroundY`) | Stairs as ramps of meshes only | Players *feel* the climb; consistent with collision gate |
| A10 | Cloudflare Pages → Workers | Vercel/Netlify/GitHub Pages | User's existing account; free; `_headers` support; workers.dev host |
| A11 | Nameplate = canvas sprite, auth-driven text | 3D text (font loading) / HTML overlay | Zero font assets; occludes correctly; trivial updates on auth change |
| A12 | Kneel (not sit) for prayer | Flat sitting pose | Sanctuary posture; simpler, reads better under robes |

## 10. UX flows

**First visit** — veil fades → chooser ("Choose thy pilgrim") → pick Pip/Martin/Lucia or "simply
  orbit" → (walk mode) gate → plaza → fountain right of the axis → steps → porch → portal → nave →
  apse pool → optional prayer → anytime: N to kneel, Esc to orbit, "switch pilgrim" to change.
**Member** — signs in (top-right pill) → nameplate updates everywhere → posts to the Prayer Wall →
  next device: same name, same preferred pilgrim (synced via auth metadata).
**Guest** — reads the wall; prompted to sign in only when attempting to post; never blocked from the art.

## 11. Success metrics

- Median session ≥ 3:00; ≥ 40 % touch the time-of-day slider; ≥ 25 % open ≥ 2 story orbs;
- ≥ 10 % sign up; ≥ 5 % post a prayer; bounce < 45 %.
- Qualitative: "calm / awe" in feedback; screenshots shared without prompting (already observed in
  soft-launch behaviour of sibling projects).

## 12. Known limitations & risks

- **L1** — No LOD/geometry merging; low-end phones may dip below 30 fps (test on real device before
  press/launch; consider `devicePixelRatio` cap 1.5 + shadow map 1024 for a "lite" mode).
- **L2** — Collision covers shells and major props; benches/hedges are walk-through; orbit camera
  can clip walls at min zoom.
- **L3** — Interior at midday reads dark (intended mood) — may add bounce fill or HDR exposure slider.
- **L4** — Nameplate always visible; no per-user toggle yet (screenshot clutter in landscape shots).
- **L5** — Indonesian/Korean UI absent; all copy English; community wall content unmoderated
  (needs report/hide tooling before large-scale promotion).
- **L6** — Accessibility gaps: no keyboard camera, no `prefers-reduced-motion` handling, no ARIA
  live region for toasts (they are `role="status"` — improve), focus trapping in modal/panel.
- **L7** — Single environment; Supabase free tier pauses on inactivity (wall shows setup notice —
  by design); no backups/export of prayers.
- **L8** — Verification is headless SwiftShader; real-device GPU/perf pass pending.

## 13. Roadmap

- **v1.5 (Polish)** — geometry merge + LOD; lite mode; keyboard orbit; nameplate toggle; `prefers-reduced-motion`.
- **v1.6 (Experience)** — WebXR immersive walk; photo mode (UI hidden); dawn/noon/dusk audio themes;
  ES/CA/KO localization; toast ARIA live region + focus trap.
- **v2.0 (Depth)** — day–night cycle with seasonal foliage; denser façade sculpture niches; interior
  light-bounce fill; shareable viewpoint URLs (`#view=pool&tod=dusk`); moderation toolkit for the wall.

## 14. Open questions

- **Q1** — Launch scope: public artwork drop, portfolio piece, or client deliverable? (Drives copy tone & moderation.)
- **Q2** — Dedication/attribution on the wall or entrance (a name, a cause)?
- **Q3** — Real-device QA pass: owner + budget? (L1/L8 block a broad launch.)
- **Q4** — Keep zero-cost operation forever, or sponsor a custom domain + Supabase Pro if it spreads?

## 15. Document control

- **Owner:** builder · **Review:** on each release or monthly, whichever first.
- **Related:** `../README.md`, `../PROCESS.md`, `../supabase/schema.sql`, `../dist/` (deploy artifact).
- **Change log:** v1.0 pre-build → v2.0 reflects shipped v1.1–v1.5 (pilgrims, accounts/wall, kneel,
  nameplates, Cloudflare publish). F8 remains ⏳ pending one-time SQL run by the owner.
