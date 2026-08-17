# Project Analysis

Internal source of truth for the portfolio. Every claim below was verified
against the actual project source on 2026-08-10 — READMEs, build files,
configuration, git history and code. Nothing was invented.

Folder scanned: `F:\Cata\Proiecte\`

Legend:

- **Implemented** — confirmed in code/config.
- **Partial** — exists in code but incomplete or mocked.
- **Planned** — documented as TODO/planned inside the project.

---

## Vortex

- **Type:** Media streaming application (Android app + Kotlin Multiplatform desktop app)
- **Platform:** Android (phones, tablets, Android TV) · Windows desktop (Compose Multiplatform)
- **Technologies:** Kotlin, Jetpack Compose, Compose TV, Compose Multiplatform, Media3/ExoPlayer, mpv/mediamp, Room (KMP), TMDB API, Google Drive API (OAuth device + web + loopback), SMB, SFTP, FTP/FTPS, WebDAV, UPnP, NFS, Leanback, WorkManager, yt-dlp, NewPipe extractor, Android Keystore, R8/ProGuard
- **Status:** In Development (last commit 2026-08-15; 100 unit tests, lint clean, release build green)
- **GitHub:** https://github.com/Cata5/Infuse (repo name on GitHub; project name is Vortex)

### Confirmed Features (re-verified 2026-08-17 against the source)

- Unified movie/TV library aggregated from Google Drive, SMB, SFTP, FTP/FTPS, WebDAV, NFS and UPnP
- TMDB metadata (posters, backdrops, cast, episode details) + manual re-matching; 24 h in-memory metadata cache
- Per-title/per-episode playback resume, scoped per profile
- Subtitle selection, styling, offset (real parser shift) and per-show language memory; sidecar subtitle scanning
- Multi-track audio; playback speed 0.5×–2.0×; equalizer; audio routing; RAM-only stream buffering
- Google Drive OAuth: embedded WebView flow on TV (device-flow fallback for Workspace accounts), Google Sign-In SDK on phone, browser loopback on desktop
- Offline downloads for every provider (WorkManager queue, pause/resume/retry, storage location picker, Wi-Fi-only mode, free-space guard, quota-based auto cleanup)
- Android TV: Leanback launcher, D-pad navigation, ambient poster-slideshow screensaver (DreamService)
- LAN server discovery (NSD/mDNS) pre-filling connection forms for SMB/SFTP/FTP/WebDAV
- User profiles (per-profile favorites/watchlist/watched/resume/subtitle memory, kids profiles); custom collections & watchlists
- Music: on-device YouTube search + streaming, real offline audio downloads, playlists with M3U import/export
- Actor/director pages, clickable cast, "You May Also Like" similar titles
- Per-episode watched state (auto at 95%+), season progress, playback diagnostics overlay
- Backup & restore as versioned JSON (merge-only, secrets never exported)
- Desktop (Windows): Netflix-style Compose Multiplatform UI, in-app mpv player (mediamp) with external-mpv fallback, loopback DriveStreamProxy for authenticated streaming, real 4K/HDR/Dolby Vision/Atmos quality probing, yt-dlp trailers, sidecar subtitles
- Secrets stored in Android Keystore-backed encrypted store (never Room)

### Partial Features

- YouTube as a video media source via NewPipe extractor — code exists, experimental, not a headline flow
- Music screens are phone-only — TV music/equalizer is a documented follow-up

### How It Works

Single Kotlin codebase, no backend. Remote-storage provider abstraction → repository → Room → Compose UI on phones, TV and the desktop app (which shares the MediaRepository/TmdbService/models via a Kotlin Multiplatform module). ExoPlayer streams through a per-provider data source on mobile/TV; the desktop app plays via mpv (mediamp) with a loopback DriveStreamProxy for auth. TMDB metadata cached locally.

### Documentation Status

Excellent README (features, sources, build config). Docs folder has plan/code-analysis artifacts.

### Security Notes

- `local.properties` holds `TMDB_API_KEY`, `TMDB_ACCESS_TOKEN`, `GOOGLE_DEVICE_CLIENT_ID/SECRET`, `GOOGLE_WEB_CLIENT_ID/SECRET` — **gitignored, never commit**
- `TV SECRET.json` + `WEB Secret.json` contain Google OAuth client data — **gitignored, must never be published** (confirmed listed in `.gitignore`)

### Portfolio Recommendation

**Featured.** The flagship Android project.

---

## AI Interface

- **Type:** Image classification demo (web)
- **Platform:** Web (Flask)
- **Technologies:** Python, Flask, TensorFlow/Keras, tkinter
- **Status:** Completed (2 commits, 2024)
- **GitHub:** https://github.com/Cata5/AI-interface

### Confirmed Features

- Upload image → classify with a model selected from `models.json` registry
- `GET /models` lists available models
- `get.py` writes `top_level_folders.json` (dataset-folder indexer)

### How It Works

Single Flask process; tf.keras inference per request; models loaded from `.h5` files.

### Documentation Status

No README. Small experiment.

### Portfolio Recommendation

Normal — honest small experiment.

---

## AI Studio

- **Type:** Local LLM runtime workspace (web UI + FastAPI backend)
- **Platform:** Web (local tool)
- **Technologies:** React, Vite, TypeScript, Tailwind, FastAPI, llama.cpp (llama-server), Three.js, react-markdown, Axios
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- GGUF model scanning + profiles (persisted JSON), custom llama binary tracking
- llama-server process manager: context, GPU layers, threads, batch, cache type
- Chat with streaming + built-in tools (calculator, web_search, file_parser)
- Hugging Face download UI; live GPU/VRAM stats; file/folder browsing; mock server

### Partial Features

- Image/Video Studio — endpoints return **placeholder SVGs** / sample video (verified in `backend/media/media_router.py`); no real generation

### Documentation Status

No README (Vite template only). `backend/` is versioned as v1.3.

### Portfolio Recommendation

Normal. Present honestly: runtime management works; media generation is mocked.

---

## Aplicatie Cheltuieli

- **Type:** Desktop expense tracker with OCR
- **Platform:** Windows
- **Technologies:** Python, PyQt6, IMAP, pytesseract (Tesseract), PyMuPDF, openpyxl, Pillow, PyInstaller
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- IMAP scanning with provider presets (Gmail, Outlook, Yahoo, iCloud)
- Attachment extraction (HTML/PDF/image) + Tesseract OCR
- Keyword/sender/subject filters for invoice matching
- Excel export with formatting + automatic backups; async QThread workers; settings.json persistence; build.bat (venv + PyInstaller)

### How It Works

PyQt6 UI → QThread workers → EmailScanner (IMAP) → InvoiceExtractor (HTML/PDF/OCR) → ExcelHandler.

### Documentation Status

No README.

### Security Notes

`settings.json` stores an `email`/`password` pair for IMAP — check whether values are populated; consider OS keychain.

### Portfolio Recommendation

Normal.

---

## Aplicatie-Teka (Auto Oferta)

- **Type:** Offline offer generator for Teka
- **Platform:** Windows (local web + PyInstaller exe) · Android (Capacitor)
- **Technologies:** Python, openpyxl, xlrd, local web UI, Capacitor, Android, PyInstaller, unittest
- **Status:** Active (9 commits, last 2026-07-21)
- **GitHub:** https://github.com/Cata5/Aplicatie-Teka

### Confirmed Features

- Loads six Excel sources with header detection + column aliases (incl. .xls)
- Client/product matching; tiered cascaded discounts (client → supplementary, not summed)
- Promo modes (ADAOS 20%, percentage); configurable TVA (default 21%) and formulas
- Excel export; mock data generator; unit tests; PyInstaller single-file build; Android wrapper

### Documentation Status

Good README with formulas, run steps, build instructions and app URL (127.0.0.1:8765).

### Portfolio Recommendation

Normal (client tool; possibly under NDA — confirm before public showcase).

---

## Apps Manager

- **Type:** Desktop game/app launcher + winget installer
- **Platform:** Windows (Electron)
- **Technologies:** Electron, React, TypeScript, Vite, better-sqlite3, Tailwind, winget
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- Game scanning from configured paths; manual add/remove/rename + custom covers
- Launch with lastPlayed/playtime tracking; winget app install with progress; floating scan overlay; SQLite library with seed data

### Documentation Status

README is the create-vite template — needs writing.

### Portfolio Recommendation

Normal.

---

## Dataset Generator

- **Type:** Image dataset + mask generation tool
- **Platform:** Windows (desktop, CustomTkinter)
- **Technologies:** Python, CustomTkinter, Selenium, BeautifulSoup, icrawler, bing-image-downloader, Pillow, OpenCV, Ultralytics, Segment Anything (SAM), PyTorch (CUDA)
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- Multi-source image download (Bing, Google, iCrawler) with user-agent spoofing
- Organized per-class output; SAM mask generation; annotation classes JSON; two GUI generations; run.ps1 launchers

### Documentation Status

No README.

### Portfolio Recommendation

Normal (developer tool).

---

## Detectie

- **Type:** License-plate detection system
- **Platform:** ESP32 (PlatformIO) + Python server + phone browser client
- **Technologies:** Python, Ultralytics YOLO, EasyOCR, WebSockets, OpenCV, PySide6, PlatformIO, Arduino/ESP32, C++, ArduinoJson
- **Status:** Experimental (no git repo)
- **GitHub:** none

### Confirmed Features

- YOLO plate detection + EasyOCR recognition on a WebSocket server
- ESP32 firmware (Wi-Fi auto-reconnect, JSON, role registration)
- phone_camera_client.html capture page; PySide6 Train_APP (train/finetune/test)

### How It Works

`server.py` returns PlateResult (index, confidence, bbox, OCR text, crop). ESP32 renders results; phone page sends captures. DOCUMENTATIE_PROIECT.md documents the workflow.

### Security Notes

- **Wi-Fi SSID and password are hardcoded in `src/main.cpp`** (lines 9–10) — move to build-time config; do not commit real credentials.

### Portfolio Recommendation

**Featured** (embedded + CV full-stack story).

---

## OmniStudio / vortex-ai-studio

- **Type:** Desktop AI runtime manager
- **Platform:** Desktop (Tauri 2)
- **Technologies:** Tauri 2, Rust, React, TypeScript, Vite, zustand, sysinfo, libloading, react-markdown, Radix, Tailwind
- **Status:** In Development (3 commits, last 2026-07-27)
- **GitHub:** https://github.com/Cata5/OmniStudio

### Confirmed Features

- Backend registry (scan/add/remove llama.cpp executables) + state polling
- Model folder management + GGUF metadata parsing (architecture, quantization, context, tokenizer)
- Chat with token streaming + persisted conversations; hardware stats polling; capability inspection via libloading

### Documentation Status

README is the Vite template — needs writing.

### Portfolio Recommendation

Normal.

---

## siteauto

- **Type:** Car-parts shop with AI part detection
- **Platform:** Web
- **Technologies:** Next.js 15, React 19, Tailwind, YOLOv8 (Ultralytics), Python, OpenCV, Redis (ioredis), JWT/bcryptjs, Three.js (react-three-fiber), framer-motion
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- Photo upload → `python utils/detect.py` (YOLOv8, custom `.pt` with/without side-mirror variants, conf ≥ 0.15) → canvas annotation → product matching
- Shop, cart (Redis), checkout, JWT auth, appointments, dashboard (cars/messages), 3D product models, floating chat

### Documentation Status

README is the create-next-app template. Has `prezentari/` (PPTX + DOCX presentation of the project).

### Security Notes

- `.env.local` exists with `NEXTAUTH_SECRET` — value is the default placeholder; still, don't publish the file.

### Portfolio Recommendation

**Featured** (AI + commerce integration).

---

## CoralTechWeb

- **Type:** FTC robotics team website with RAG chatbot
- **Platform:** Web
- **Technologies:** Next.js 16, React 19, TypeScript, Tailwind, node-llama-cpp, Ollama, RAG, WebAuthn (SimpleWebAuthn), framer-motion, PDF parsing
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- Bilingual EN/RO; content (activities, seasons, sponsors, team, blog)
- RAG chat: Ollama embeddings → `data/rag/vectors.json`, local GGUF answer, structured response (answer/actions/sources/language)
- Sync + reindex endpoint with fingerprint cache; file-watcher refresh; WebAuthn passkey admin auth; config.json LLM settings

### Documentation Status

README documents the RAG architecture well (endpoints, schema, sync flow).

### Portfolio Recommendation

Normal.

---

## Liceul Teoretic Ion Cantacuzino

- **Type:** School website with admin panel
- **Platform:** Web
- **Technologies:** Next.js 16, React 19, TypeScript, better-sqlite3, JWT (jose), bcryptjs, zod, Radix, framer-motion, pdf-parse
- **Status:** Active (no git repo)
- **GitHub:** none

### Confirmed Features

- Content entities: settings, news, classes, teachers, gallery, documents, results, pages
- Admin panel (JWT + bcrypt); SQLite storage; JSON→SQLite migration guarded by migration key
- Public pages: noutati, clase, profesori directory, documente, galerie, revista, elearning, orar, istoric, oferta educationala, orientare, contact

### Documentation Status

Good README (setup, SQLite layout, admin security setup).

### Portfolio Recommendation

Normal (client project).

---

## YOLO-Trainer

- **Type:** Desktop YOLO training GUI
- **Platform:** Windows
- **Technologies:** Python, PySide6, Ultralytics YOLO (v8/11/26), pyqtgraph, matplotlib, EasyOCR, PyTorch, PyInstaller, Inno Setup, WebSockets
- **Status:** In Development (no git repo)
- **GitHub:** none

### Confirmed Features

- Train/fine-tune/test tabs; QThread training with live logs + metric plots; dataset validation; presets; GPU detection; dark theme; installer packaging; WebSocket remote inference

### Documentation Status

Good README.

### Portfolio Recommendation

Normal.

---

## Agetic OS Helper / jarvis

- **Type:** Local-first AI operating assistant
- **Platform:** Windows (local)
- **Technologies:** TypeScript, Node.js, @earendil-works/pi-ai, better-sqlite3, Docker (CUDA), rclone, qBittorrent API, ffmpeg, Jest
- **Status:** In Development (2 commits, last 2026-08-10)
- **GitHub:** https://github.com/Cata5/Agetic-OS-Helper

### Confirmed Features

- Three-layer agent: Ornith (9B planner) → Needle (26M executor) → Runtime (validate/permissions/execute/log)
- 56 tools in 14 groups (filesystem, shell, windows, excel, browser, memory, media, system, archive, document, image, AI, automation, dev)
- Offline correction layer (`correction.ts`): typo tolerance, Unix aliases, multilingual triggers, legacy failure fixes
- Media manager: filelist (SQLite cache), drive (rclone), torrent (qBittorrent); SQLite media index; permissions; GPU Docker (CUDA Jupyter); Jest tests; thorough docs

### Documentation Status

Excellent (PROJECT_SUMMARY.md + docs/ with installation, extensions, workflows, model optimization).

### Portfolio Recommendation

**Featured** (deepest systems/AI work).

---

## LLM Finetuner

- **Type:** Web UI for local LLM fine-tuning
- **Platform:** Web (Flask, local)
- **Technologies:** Python, Flask, Unsloth, TRL/SFTTrainer, PyTorch, LoRA, psutil, nvidia-smi/WMI
- **Status:** In Development
- **GitHub:** none

### Confirmed Features

- Model presets (`config/models.json`): Llama 3.2 1B Instruct, Mistral 7B v0.3, 4-bit variants
- Configurable LoRA + training params (rank 8, alpha 16, dropout 0.05, lr 2e-4 defaults)
- Custom chat templates; live GPU/CPU/system metrics (nvidia-smi, WMI/win32pdh, psutil)
- Live training logs, status tracking, resume flow (templates/resume.html)
- Lazy loading of heavy ML imports; example dataset `data.json` (car-diagnostics chat pairs)

### How It Works

Flask serves the UI; `finetunerLLM.py` drives Unsloth `FastLanguageModel` + TRL `SFTTrainer` on a background thread. Config is JSON under `config/`.

### Documentation Status

README rewritten (was present).

### Portfolio Recommendation

Normal (AI / ML).

---

## NeuroShell (V1)

- **Type:** Terminal AI shell / agent
- **Platform:** Terminal (Windows/Linux/macOS)
- **Technologies:** Python, prompt_toolkit, PyTorch (CUDA), llama-cpp-python, Ollama, Hugging Face Hub, OpenAI-compatible APIs, PyInstaller
- **Status:** In Development
- **GitHub:** none

### Confirmed Features

- REPL with slash commands (/help, /model, /gpu, /download, /clear, /tools, /mode, /history, /exit) + tab autocompletion
- Instant model hot-swapping: Ollama, GGUF, Transformers, HF Cloud, OpenAI-compatible
- Sandboxed tools: workspace-restricted filesystem/terminal, dangerous-command blocking, Safe Mode
- Autonomous tool loop (core/: agent, planner, intent_classifier, shell_router, world_model, reflector, replanner, skill_registry, project_detector)
- GPU device abstraction with CPU fallback + /gpu diagnostics
- HF downloads with isolated cache; dialogue history (JSONL); RAG command index; optional voice (STT/TTS, wake word)

### How It Works

prompt_toolkit REPL → core/loop → tool router → sandboxed executors. models/manager routes across five providers. State under `~/.neuroshell/`.

### Documentation Status

README rewritten (was present, emoji-heavy).

### Portfolio Recommendation

Normal (Developer Tools).

---

## OCR — Handwritten PDF to Typed PDF

- **Type:** Local document-conversion app
- **Platform:** Desktop GUI (Tkinter) + FastAPI API mode
- **Technologies:** Python, Tkinter, FastAPI, Ollama (glm-ocr), Transformers (GLM-OCR), PyMuPDF, ReportLab, matplotlib mathtext, PyTorch
- **Status:** Active (v1.0.0 API, GUI is default mode)
- **GitHub:** none

### Confirmed Features

- Converts handwritten PDF pages (incl. math) to typed PDF, fully local
- Backends: Ollama model tag (`glm-ocr:q8_0`) or `zai-org/GLM-OCR` via Transformers; custom GGUF import into Ollama
- Prompt modes: text / formula / table; math rendered via matplotlib mathtext; Unicode-safe fonts (DejaVu)
- GUI with progress panel + page/pass progress; API mode with job tracking, timeouts, CORS
- Configurable DPI, max tokens, page timeout; large-page auto-resize

### How It Works

ocr_service.py selects/runs the backend; pdf_processing.py renders pages (PyMuPDF) and assembles the typed PDF (ReportLab + matplotlib). GUI and API share the pipeline.

### Documentation Status

Good README (kept and expanded).

### Portfolio Recommendation

Normal (Desktop / AI).

---

## webstudio-main

- **Type:** Working copy of the Webstudio open-source monorepo
- **Platform:** Web
- **Technologies:** pnpm monorepo, React, TypeScript, Prisma, PostgREST, CSS engine, SDK packages
- **Status:** Experimental — **no `.git` in the folder; personal changes could not be verified**
- **GitHub:** none (no remote)

### Confirmed Features

- Webstudio Builder (apps/builder) + sdk, css-engine, design-system, prisma-client, cli packages

### Documentation Status

Upstream open-source project.

### Portfolio Recommendation

**Archive / exclude from public portfolio** until personal work is confirmed. Included in the portfolio data with an explicit "working copy — unverified" label.

---

# Notes

- Project sources were analyzed both at `F:\Cata\Proiecte\` and the curated
  `Worthy-projects\` copies inside this portfolio. The three projects above
  (LLM Finetuner, NeuroShell, OCR) exist only in `Worthy-projects\`.
- Vortex real screenshots (`Vortex-phone.png`, `Vortex-TV.png`) were found in
  `Worthy-projects\` and are now served from `/public/projects/vortex/`.

# Security Summary (verified 2026-08-10)

| Project | Finding | Risk |
|---|---|---|
| Vortex | `TV SECRET.json`, `WEB Secret.json`, `local.properties` contain OAuth/TMDB credentials — gitignored | ⚠️ Never commit or publish; rotate if ever leaked |
| Detectie | Wi-Fi credentials previously hardcoded in `src/main.cpp` | ✅ Fixed 2026-08-10 — moved to gitignored `include/secrets.h`; both-macro guard fails loudly with `#error` on missing/partial config; live `secrets.h` removed from the `Worthy-projects/` showcase copy |
| Cheltuieli | IMAP `password` field in `settings.json` | Info — check if populated; use keychain |
| siteauto | `.env.local` (value is default placeholder) | Info — don't publish the file |

No private keys, no high-entropy tokens, and no customer data were found in any
source tree. No secrets were copied into this portfolio or its data files.
