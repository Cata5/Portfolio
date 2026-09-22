# Portfolio Audit — Portofolio-V2 (2026-09)

Evidence base: live site (`https://cata5.github.io/Portofolio-V2/` — HTML fetched, headers, `/api/rag/status` response), local static export in `out/`, full component/content/infra source review, `PROJECT_ANALYSIS.md`, `PRODUCT.md`.

Target visitor: recruiters / technical evaluators for internships & junior roles (per PRODUCT.md). Positioning: breadth across web / mobile / desktop / embedded / AI-ML, evidence-first, no fabrication. **The evidence discipline is the site's moat — keep it.**

---

## CRITICAL (live production problems)

### C1. Navigation is empty in production
- Live HTML: `<nav class="hidden items-center gap-1 md:flex" aria-label="Main navigation"></nav>` — **empty**. Mobile drawer builds links the same way → empty menu on phones.
- Cause chain: `site-header.tsx` / `mobile-nav.tsx` filter sections on `s.navLabel`; current `content/sections.json` has **no `navLabel` on any section**. `SECTION_TYPE_META` defines `defaultNavLabel` but the code never falls back to it.
- Root cause: the CMS (`editor-context.tsx` → `/api/content/save`) writes whole stores to `content/*.json`; the section editor doesn't round-trip `navLabel`, so the first save stripped it from every section and the deploy shipped it. (Older local build `out/index.html` still has links — regression is recent.)
- Fix: nav must not depend on CMS-owned fields. Fallback to `SECTION_TYPE_META[s.type].defaultNavLabel` in both navs; re-add explicit `navLabel`s to `sections.json`; add a CI guard in `deploy.yml` that fails if the exported nav has no anchor links.

### C2. Build machine RAG status — incl. an API key — is exported and publicly served
- Verified live: `GET /api/rag/status` → `{..., "models": {..., "apiKey": "sk-unsloth-f4823b69...", "generationBaseUrl": "http://127.0.0.1:8888/v1", "isServerConnected": false}}`.
- `app/api/rag/status/route.ts` is `force-static` → the export bakes build-time JSON (local API key, CI hardware, dead server flag). `rag-context.tsx` also **polls it every 12s from every visitor**.
- Fix: stub the RAG API routes when `isGhPages`; strip `apiKey` from status/config responses unconditionally; stop 12s polling on the static deploy; rotate the leaked key.

### C3. Contact form can show "Message Sent" when nothing was sent
- `contact-form.tsx`: POST to Google Apps Script uses `mode: "no-cors"` (response unreadable), `.catch` only `console.warn`s, then `setStatus("success")` runs **unconditionally** after the animation. Any failure → green success panel.
- Also: the 3-second form-into-black-hole takeover has **no `prefers-reduced-motion` check** (the only animated component in the repo without one), and button copy "Sucking into Black Hole…" is off-register for the hiring audience.
- Fix: readable CORS POST, real success/error branches, reduced-motion skip, shorter animation, professional copy, mailto fallback on error.

---

## HIGH IMPACT

### H1. Body text is `font-extralight` (200) site-wide
- 11 components (`hero`, `about`, `contact`, `journey`, `ml-notebook`, `featured-projects`, `architecture-spec`, `activities`, `stack`, `section-renderer`, project detail pages) use weight-200 for 13–18px body text on pure black. Thin strokes + OLED halation + Windows subpixel rendering = poor readability for the primary audience.
- Fix: `font-extralight` → `font-light` (300) everywhere for body copy; keep 200 only for large display text if desired. Trim Inter weights loaded in `layout.tsx` (currently 6).

### H2. Homepage buries 16 of 17 projects
- Order: Hero → About → **Vortex (~4 screens: carousel + 4-tab ArchitectureSpec HUD)** → 17-row list → … → Contact. The ArchitectureSpec (matrix/diagram/module-trees/search) is a deep-dive artifact that belongs on `/projects/vortex/`, which already has a compressed architecture section.
- Fix: extract spec from homepage Featured section (link "Full engineering breakdown →" to the detail page); keep device stage + verified metrics strip; add a "More work" row (Detectie, Primarie, Jarvis, Siteauto) linking to detail pages.

### H3. Journey & Activities are near-duplicates
- Same 6 events, near-verbatim copy ("Won first place at UniHack on my second participation…"), same photos (journey.json already embeds the activities images). Journey also has jargon drift ("dual-sided neural circuit", "Active Branch Trajectory") and a spacing bug: `{group.items.length} Node{...}` renders "3 Node s".
- Fix: disable/merge Activities into Journey; rewrite Journey copy plain; fix Node(s) bug; drop neural jargon from eyebrows/copy.

### H4. Accent-color drift (design-system leftovers)
- Palette is violet (#8052ff) + saffron, but code ships older blue-accent leftovers: cyan `rgba(56,189,248,…)` shadows in `featured-projects.tsx` (selected runtime card) and `section.tsx` (editing ring), rose-400/sky-400 in `journey.tsx` CATEGORY_META, emerald/purple mixes in `architecture-spec.tsx`, rose in `journey` community category. Journey alone uses 5 accent hues.
- Fix: violet = interactive, saffron = emphasis, one green for "verified"/success only. Replace cyan with `var(--signal)`.

### H5. Project list is flat; featured logic is dead; presentation mismatches
- `featuredProjects` + `FEATURED_ORDER` exist in `data/projects.ts` but nothing on the homepage uses them — only a "· featured" tag in the explorer. 17 rows, year-sorted only.
- Cheltuieli (Windows PyQt6 app) renders in a **phone frame** (`deviceFrame: "phone"`). Vortex `03-desktop.png` is a 474 KB PNG in an otherwise-WebP site.
- 5 projects have **no GitHub link** (cheltuieli, dataset-generator, detectie, llm-finetuner, ocr-pdf) — for a hiring audience, silence reads worse than "private/client work".
- Fix: tier ordering (flagships → strong → rest), fix deviceFrame, add "source available on request" or repo links, convert PNG.

### H6. Three animation systems + always-on rAF
- GSAP (+ScrollTrigger+SplitText) AND `motion` (framer) AND Lenis all ship. `world.tsx` renders 560 particles + ~360 ambient motes every frame at DPR≤2 with per-piece trig/lensing, paused only when tab hidden. Result: 2.1 MB raw JS in export (~600–700 KB gz), constant CPU/battery tax.
- Fix (incremental): cap DPR 1.5, throttle frames when scroll idle, migrate ~6 framer call sites to GSAP and drop one lib, lazy-load RAG/lightbox chunks.

### H7. Conversion path gaps
- No CV/résumé download anywhere. No proof strip near the top (UniHack 1st · 2× InfoEducatie silver · FTC Nationals · 100 unit tests · 40+ repos — all facts already on the page, buried in section 8). Hero headline "SYSTEMS & APPLICATIONS" is the least-informative possible phrase (user has since edited local copy to "STUDENT DEVELOPER" — still generic; recommend a concrete value line).
- Fix: add CV button (needs a PDF from the user), add 3–4 chip proof strip under hero tagline, sharpen headline.

---

## MEDIUM IMPACT

### M1. CMS drift / three sources of truth
- Component-hardcoded strings ("Featured System", "Machine learning", sr-only "All Projects") ignore `sections.json` settings; `copy.json` vs `sections.json` journey titles disagree ("Personal Circuit Timeline…" vs "Circuit Timeline…"); README.md says content lives in `data/` (it moved to `content/`); PRODUCT.md featured set ≠ data.
- Recommendation: for a one-author site, drop the visual CMS from the *deployed* site (keep in dev) and edit `content/*.json` in git. At minimum, never let the editor own fields it doesn't render.

### M2. Dead weight shipped to production
- Export contains `/admin` (client-only auth that can't work — publicly reachable dead end), editor bar/inspector/auth chunks, save/upload API routes, 6-tab RAG modal + glitch/cyberdeck/holographic offline personas showing simulated `ERROR 0x503` banners by default on Pages (`use-glitch-mode.ts` forces glitch mode when `isGhPages`).
- Fix: exclude admin/editor/RAG-admin from the gh-pages export (build restructure) or at minimum keep the RAG fallback chat minimal; remove the 503-theater default.

### M3. Interaction details
- Runtime carousel auto-advances every 8s (fights reading; manual default recommended). Runtime tabs: `role="tablist"` without arrow-key handling/`aria-controls`. Custom cursor hides the I-beam over inputs (`cursor: none` on `*`). Ctrl+J hijack (Chrome Downloads) + Ctrl+E. Contact copy ("sucked through the event horizon"). Certifications: "Google Introduction to AI" (no proof file) next to CCNA 1 (module 1 of 3, invites over-reading) — trim to CCNA1 + IC3 (both have PDFs). Command palette lacks project search.

### M4. ML Notebook sells one run
- Only the latest run renders; "training —" fields empty; no outcome metrics. Fix: keep single-run display but fill training details, link runs to their projects (Detectie, Siteauto, LLM Finetuner detail pages).

---

## LOW IMPACT / POLISH
- 6 Inter weights loaded (200–700) → 3–4.
- SW-unregister inline script in `layout.tsx` (old cleanup) — remove after a season.
- `allowedDevOrigins` hardcodes LAN IP.
- "Featured System" eyebrow → "Featured Work" (consistency with sections.json/nav).
- Per-project OG images (currently all share og.png).
- `hero-fade`/grid: fine. 404 page: good. Sitemap/robots/canonical/OG/JSON-LD: correct as-is.

## VERIFIED WORKING — DO NOT CHANGE
- Project detail pages (features / partial ◐ / limitations / future work / verified notes) — the moat.
- Dark-first palette, GlassCard recipe, SplitText headings, TriangleWorld concept (one persistent material morphing across sections).
- GH Pages export pipeline + CI verification step (`deploy.yml`) — extend, don't rebuild.
- Lenis, command palette, screenshot lightbox (keyboard-accessible), reduced-motion discipline in most components.
- Honest limitations sections across projects; real screenshots in device frames.

---

## FIX PLAN (execution order)

1. [x] **C1 Nav**: fallback navLabel in `site-header.tsx` + `mobile-nav.tsx`; restore `navLabel` in `sections.json`; CI guard in `deploy.yml`.
2. [x] **C2 RAG leak**: stub status/config/documents/eval/models routes when `isGhPages`; strip `apiKey` server-side; stop 12s polling on static deploys.
3. [x] **C3 Contact form**: real fetch result handling, reduced-motion check, shorter animation, copy, error state w/ mailto fallback.
4. [x] **H1 Typography**: `font-extralight` → `font-light` in 11 files.
5. [x] **H2 Featured restructure**: ArchitectureSpec out of homepage (link to detail page), "More work" row (Detectie, Primarie, Jarvis, Siteauto), manual carousel, "Vortex ·" label repetition removed, cyan→signal.
6. [x] **H3 Journey/Activities merge**: Activities disabled; Journey copy de-duplicated/de-jargoned; Node(s) bug fixed.
7. [x] **H4 Accent drift**: cyan/rose/sky/emerald/purple leftovers normalized (violet interactive, saffron emphasis, green = verified only).
8. [x] **H5 Project data**: Cheltuieli deviceFrame fixed; "source available on request" for repo-less projects; explorer keeps year order (tiering noted as follow-up).
9. [x] **M3 details**: cursor:none excluded over form fields; Ctrl+J hijack removed (palette/button still open the guide); polling stopped on static.
10. [ ] **H7 CV + proof strip**: needs a CV PDF from the user; proof strip deferred to content pass with user input.
11. [ ] **H6/M2 slimming**: one animation library, idle rAF throttle, DPR cap, admin/editor exclusion from export — follow-up (build-level restructure).

---

## VERIFICATION RESULTS (2026-09-21, post-fix build)

`npx tsc --noEmit` → clean. `NEXT_PUBLIC_DEPLOY_TARGET=gh-pages npm run build` → 36 static pages, 17 project pages, no errors.

Checked against the fresh `out/` export (the real gh-pages build, env flag set — note a plain `npm run build` does NOT set the flag and therefore does not stub the API routes; the deploy workflow sets it):

- **C1 nav**: `out/index.html` header renders all 8 links (About / Work / Projects / Stack / Certs / ML / Journey / Contact). CI guard in `deploy.yml` fails the deploy if `href="#about"` is missing from the export.
- **C2 leak**: `out/api/rag/status` now contains only the offline stub — no `apiKey`, no hardware, `isServerConnected: false`. Repo-wide grep of `out/` for `sk-unsloth…` → zero hits. (The one remaining `apiKey` string in a JS chunk is the admin panel's own form handler, not a secret. Rotate the old key anyway — it lives in git history and was live.)
- **12s polling**: stopped on static deploys in `rag-context.tsx`.
- **C3 contact form**: readable POST, real success/error branches, reduced-motion path, mailto fallback.
- **H1/H2/H3/H4**: weight-300 body text everywhere; ArchitectureSpec off the homepage (linked from the Vortex card to its detail page); manual runtime selection; Activities merged into Journey; accent drift normalized (violet = interactive, saffron = emphasis, green = verified only).
- **H5 data**: screenshot checker (`node scripts/check-screenshots.js`) reports all referenced assets exist (found + removed a dead `aplicatie-teka/01-home.webp` reference); repo-less projects disclose "Source is not public — happy to show it privately" in Known limitations; Cheltuieli phone-frame bug already fixed via content.
- **M3**: custom cursor keeps the native I-beam over inputs/textareas/selects; RAG shortcut moved to Ctrl/⌘+Shift+J (plain Ctrl+J was hijacking Chrome Downloads) and every tooltip/label now shows the new chord.

**Remaining, in ROI order**: ① rotate the leaked key + decide repo visibility for the 10 private projects, ② CV PDF + proof strip (content, needs owner input), ③ export slimming — exclude `/admin`, editor chunks and the RAG modal's offline-theater personas from the gh-pages build (biggest remaining bundle win), ④ consolidate GSAP vs framer-motion and throttle the TriangleWorld rAF when scroll-idle, ⑤ content pass on Journey/ML copy.

## Open questions for the owner
- CV PDF — provide a file to link in hero CTAs + contact.
- GitHub links for cheltuieli / dataset-generator / detectie / llm-finetuner / ocr-pdf — publish repos or mark "private/client work".
- Hero headline words — current "SYSTEMS & APPLICATIONS" (deployed) / "STUDENT DEVELOPER" (local). Recommend something concrete, e.g. "BUILDS / EVERYTHING" is worse; suggest "SOFTWARE / SYSTEMS" + value line in tagline already present. Decide.
- Certifications: keep CCNA1 + IC3 only? (recommended)
- Rotate the `sk-unsloth-…` key (it's in git history + was public).
