/**
 * Projects — the single source of truth for every project on the site.
 *
 * Every entry is backed by evidence found in the actual project source
 * (READMEs, build files, code). Nothing here is invented: no fabricated
 * metrics, users, downloads or stars. Where a fact could not be confirmed it
 * is simply left out. Statuses are assigned conservatively — see
 * PROJECT_ANALYSIS.md at the repo root for the evidence behind each claim.
 *
 * Adding a project is a data-only change: add an entry here and it appears in
 * the explorer, filters and (if `featured`) the featured section, plus a
 * detail page at /projects/[id].
 */

export type ProjectCategory =
  | "Web"
  | "AI / ML"
  | "Android"
  | "iOS"
  | "Desktop"
  | "Backend"
  | "Systems"
  | "Experiments"
  | "Developer Tools";

export type ProjectStatus =
  | "Active"
  | "Completed"
  | "Experimental"
  | "In Development"
  | "Archived";

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  /** Where it runs — e.g. "Android · TV", "Windows", "Web". */
  platform?: string;
  /** `null` while the year is unknown — never invented. */
  year: number | null;
  status: ProjectStatus;
  /** One-liner used in the explorer and featured rows. */
  summary: string;
  /** Longer description for the detail page. */
  description?: string;
  technologies: string[];
  /**
   * Path under /public/projects, e.g. "/projects/vortex.webp".
   * `null` renders a clearly-temporary placeholder frame.
   */
  image: string | null;
  github?: string;
  demo?: string;
  featured: boolean;
  placeholder?: boolean;

  /* Detail-page sections — only rendered when present. Never fabricate. */
  /** Confirmed implemented features. */
  features?: string[];
  /** Partially implemented — exists but incomplete. */
  partialFeatures?: string[];
  /** Marked as planned/TODO in the project itself. */
  plannedFeatures?: string[];
  /** Prose description of the architecture. */
  architecture?: string;
  /** ASCII diagram rendered in monospace. */
  architectureDiagram?: string;
  challenges?: { problem: string; solution: string }[];
  learned?: string[];
  screenshots?: string[];
  limitations?: string[];
  futureWork?: string[];
  /** Never suggested as a related project (e.g. third-party working copies). */
  excludeFromRelated?: boolean;
};

export const projects: Project[] = [
  {
    id: "vortex",
    title: "Vortex",
    category: "Android",
    platform: "Android · phones, tablets, TV",
    year: 2026,
    status: "In Development",
    summary:
      "Self-hosted media streaming for Android and Android TV — one library from your own Google Drive, SMB, SFTP, FTP and WebDAV sources.",
    description:
      "Vortex is a client-side, self-hosted media streaming application for Android phones, tablets and Android TV. It aggregates personal media libraries from remote sources — Google Drive, SMB, SFTP, FTP/FTPS and WebDAV — into one unified library, enriches it with TMDB metadata, and plays everything with ExoPlayer/Media3. There is no server and no cloud dependency: the app talks to sources you already own.",
    technologies: [
      "Kotlin",
      "Jetpack Compose",
      "Media3 / ExoPlayer",
      "Room",
      "TMDB API",
      "Google Drive API",
      "OAuth 2.0 (device + web)",
      "SMB",
      "SFTP",
      "FTP",
      "WebDAV",
      "Leanback TV",
      "NewPipe extractor",
      "ProGuard / R8",
    ],
    // The wide TV shot leads the cards (it fits the 16/10 frame); the phone
    // screenshot stays the first gallery image on the detail page.
    image: "/projects/vortex/02-tv.webp",
    // Verified from git remote. Note: the repo is named "Infuse" on GitHub
    // while the project is called Vortex — intentional, do not "fix".
    github: "https://github.com/Cata5/Infuse",
    featured: true,
    screenshots: [
      "/projects/vortex/01-phone.webp",
      "/projects/vortex/02-tv.webp",
    ],
    features: [
      "Unified movie & TV library aggregated from multiple remote sources",
      "TMDB metadata enrichment — posters, backdrops, cast, episode details",
      "Manual metadata re-matching for misidentified titles",
      "Per-title and per-episode playback resume",
      "Subtitle track selection, styling and delay",
      "Multi-track audio selection and playback speeds (0.5× – 2.0×)",
      "Google Drive integration via OAuth (device flow for TV, WebView flow)",
      "Network storage: SMB, SFTP, FTP/FTPS, WebDAV connection setup and scanning",
      "Android TV: Leanback launcher, D-pad navigation, remote controls",
      "Offline downloads managed through a download queue",
      "LAN server discovery for SMB shares",
      "Sidecar subtitle scanning for local media",
      "Profiles with per-profile settings and resume positions",
      "Backup and restore of library state",
      "Equalizer and audio routing management",
      "Ambient / always-on display mode while playing",
    ],
    partialFeatures: [
      "YouTube as a media source via the NewPipe extractor — present in code but not a headline flow",
    ],
    architecture:
      "A single Android app with no backend. A remote-storage provider layer abstracts Google Drive, SMB, SFTP, FTP, WebDAV, NFS and UPnP behind one interface; a repository layer feeds a Room database that drives the Compose UI. TMDB metadata is fetched and cached locally. Playback is ExoPlayer/Media3 with a data-source factory that streams from the selected storage provider. Secrets (connection passwords, SSH keys, OAuth tokens) are kept in an Android Keystore-backed encrypted store, never in Room.",
    architectureDiagram: [
      "UI (Jetpack Compose, Leanback)",
      "        ↓",
      "Repository layer (Room DB)",
      "        ↓",
      "Remote storage providers",
      "Drive · SMB · SFTP · FTP · WebDAV · UPnP · NFS",
      "        ↓",
      "ExoPlayer / Media3 playback",
    ].join("\n"),
    limitations: [
      "Requires TMDB and Google OAuth credentials in local.properties — the app cannot build without them",
      "Google TV OAuth client secrets live in gitignored files (TV SECRET.json / WEB Secret.json) and must not be committed",
      "No iOS build — Kotlin/Compose only",
    ],
    futureWork: [
      "Documented in the repo's docs/plan and docs/code-analysis folders as the project grows",
    ],
  },

  {
    id: "ai-interface",
    title: "AI Interface",
    category: "AI / ML",
    platform: "Web",
    year: 2024,
    status: "Completed",
    summary:
      "A small Flask app that classifies uploaded images with locally loaded TensorFlow models, plus a helper that indexes a folder into a dataset manifest.",
    description:
      "AI Interface is a compact experiment: a Flask web app that loads Keras models registered in models.json, accepts an image upload, runs inference with the selected model and returns the predicted class. A companion tkinter script walks a directory of images and writes top_level_folders.json — a small helper for assembling image datasets for training.",
    technologies: ["Python", "Flask", "TensorFlow / Keras", "tkinter"],
    image: "/projects/ai-interface/01-home.webp",
    screenshots: [
      "/projects/ai-interface/01-home.webp"
    ],
    github: "https://github.com/Cata5/AI-interface",
    featured: false,
    features: [
      "Image upload and classification against a user-selected model",
      "Model registry in models.json mapping keys to .h5 weights and label files",
      "GET /models endpoint listing available models",
      "Folder-indexing helper that writes top_level_folders.json from a directory",
    ],
    architecture:
      "A single Flask process serves the HTML frontend from templates/, accepts uploads into uploads/, and runs tf.keras inference per request. Models are loaded from .h5 files on disk per the models.json registry.",
    architectureDiagram: [
      "Browser (index.html)",
      "    ↓",
      "Flask routes (page.py)",
      "    ↓",
      "tf.keras model (models.json → .h5)",
    ].join("\n"),
    limitations: [
      "One-shot inference only — no batching, no GPU path, no error fallback beyond the Flask defaults",
      "Models must be placed manually under models/",
    ],
  },

  {
    id: "cheltuieli",
    title: "Cheltuieli",
    category: "Desktop",
    platform: "Windows",
    year: 2026,
    status: "Completed",
    summary:
      "A PyQt6 desktop expense tracker that scans IMAP inboxes for invoices, extracts amounts with OCR and PDF parsing, and exports everything to formatted Excel.",
    description:
      "Cheltuieli automates the boring part of expense tracking: it connects to an IMAP mailbox (presets for Gmail, Outlook, Yahoo and iCloud), scans messages and attachments, extracts invoice text from HTML, PDFs and images via Tesseract OCR, matches amounts with configurable keywords, and writes a formatted Excel workbook with automatic backups. Scanning runs in background threads so the UI stays responsive.",
    technologies: [
      "Python",
      "PyQt6",
      "IMAP",
      "Tesseract OCR (pytesseract)",
      "PyMuPDF",
      "openpyxl",
      "Pillow",
      "PyInstaller",
    ],
    image: null,
    featured: false,
    features: [
      "IMAP mailbox scanning with provider presets (Gmail, Outlook/Hotmail, Yahoo, iCloud)",
      "Attachment extraction from HTML, PDF and image formats",
      "Invoice text extraction with configurable sender/subject/keyword filters",
      "OCR via Tesseract with a configurable tesseract path",
      "Excel export with formatting and automatic backups to backup/",
      "Async scan workers (QThread) so the UI never freezes",
      "Settings persisted to settings.json with defaults",
      "Windows build via build.bat (venv + PyInstaller)",
    ],
    architecture:
      "PyQt6 UI drives background QThread workers. EmailScanner handles IMAP connections and mailbox listing; InvoiceExtractor decodes messages and extracts text from HTML/PDF/image attachments (Tesseract for images); ExcelHandler writes the formatted workbook. SettingsManager keeps configuration and provider presets in settings.json.",
    architectureDiagram: [
      "PyQt6 UI (main_window)",
      "    ↓  QThread workers",
      "EmailScanner (IMAP)",
      "    ↓",
      "InvoiceExtractor (HTML · PDF · OCR)",
      "    ↓",
      "ExcelHandler (openpyxl + backups)",
    ].join("\n"),
    limitations: [
      "Requires a local Tesseract installation for image OCR",
      "Matching depends on keyword configuration — accuracy varies by supplier",
    ],
  },

  {
    id: "aplicatie-teka",
    title: "Auto Oferta · Teka",
    category: "Desktop",
    platform: "Windows · Android (Capacitor)",
    year: 2026,
    status: "Completed",
    summary:
      "Offline offer generator for Teka: reads six Excel files (products, clients, promos), applies tiered discounts, and exports client offers — as a Windows app and an Android app.",
    description:
      "Auto Oferta is a local tool built for Teka that centralizes six Excel workbooks (sinks, kitchen taps, appliances, accessories, client commercial conditions, brochures/promos). It matches clients with products, applies commercial discounts, calculates final prices with configurable TVA and promo formulas, and exports the result to Excel. A local Python server serves an offline web interface, wrapped for Android via Capacitor, with a single-file Windows build via PyInstaller.",
    technologies: [
      "Python",
      "Excel (openpyxl · xlrd)",
      "Local web UI (HTML/CSS/JS)",
      "Capacitor",
      "Android",
      "PyInstaller",
      "unittest",
    ],
    image: "/projects/aplicatie-teka/01-home.webp",
    screenshots: [
      "/projects/aplicatie-teka/01-home.webp"
    ],
    github: "https://github.com/Cata5/Aplicatie-Teka",
    featured: false,
    features: [
      "Loads six Excel sources with sheet/header detection and column aliasing (incl. legacy .xls)",
      "Client-to-product matching across commercial conditions",
      "Tiered discount engine — client discount then supplementary discount, applied cascaded (not summed)",
      "Promo modes: brochure 'ADAOS 20%' and percentage discounts",
      "Configurable TVA (default 21%) and promo formulas",
      "Excel export of calculated offers",
      "Mock data generator for local testing",
      "Portable single-file Windows build (PyInstaller) with settings next to the exe",
      "Android wrapper via Capacitor",
      "Unit tests (unittest discover -s tests)",
    ],
    architecture:
      "excel_loader.py normalizes the six workbooks, service.py performs client/product/promo matching, pricing.py owns the tiered-discount formulas, exporter.py writes results, and app.py serves the offline web dashboard on localhost. The Capacitor project wraps the same web UI for Android.",
    architectureDiagram: [
      "6 Excel workbooks",
      "    ↓  excel_loader (aliases, normalization)",
      "service.py (matching)",
      "    ↓",
      "pricing.py (tiered discounts · TVA · promos)",
      "    ↓",
      "exporter.py → Excel offer  ·  app.py → local web UI → Capacitor (Android)",
    ].join("\n"),
    limitations: [
      "Pricing formulas are specific to Teka's commercial conditions — not generic",
      "Local-first: no multi-user or server deployment",
    ],
  },

  {
    id: "apps-manager",
    title: "Apps Manager",
    category: "Desktop",
    platform: "Windows",
    year: 2026,
    status: "In Development",
    summary:
      "An Electron launcher that scans drives for games and apps, installs software through winget, and tracks playtime — all in one SQLite-backed dashboard.",
    description:
      "Apps Manager is an Electron desktop app that turns a machine into a tidy launcher. It scans configured paths to detect installed games, lets you add or rename entries and set custom covers, launches games while recording playtime, and installs applications through winget with a progress UI. Everything is stored locally in SQLite (better-sqlite3).",
    technologies: [
      "Electron",
      "React",
      "TypeScript",
      "Vite",
      "better-sqlite3",
      "Tailwind CSS",
      "winget",
    ],
    image: "/projects/apps-manager/01-home.webp",
    screenshots: [
      "/projects/apps-manager/01-home.webp"
    ],
    featured: false,
    features: [
      "Game detection by scanning configured paths",
      "Manual add/remove/rename of entries with custom covers",
      "Launch games with last-played and playtime tracking",
      "winget-based app installation with progress feedback",
      "Floating scan overlay and install progress bar",
      "SQLite library (games + winget databases) with seed data",
      "Settings persisted in the Electron userData directory",
    ],
    architecture:
      "The Electron main process owns SQLite (better-sqlite3) and exposes a typed API over contextBridge via preload. The React renderer (Vite) consumes it through tabs — DetectGames, InstallApps, StartApp, Settings — with a floating overlay for background scans.",
    architectureDiagram: [
      "React UI (Vite renderer)",
      "    ↑  contextBridge API",
      "Electron main process",
      "    ├─ better-sqlite3 (games, winget)",
      "    └─ winget CLI integration",
    ].join("\n"),
    limitations: [
      "Early-stage — README is still the create-vite template",
      "Windows-specific (winget, exe paths)",
    ],
  },

  {
    id: "dataset-generator",
    title: "Dataset Generator",
    category: "Developer Tools",
    platform: "Windows · desktop",
    year: 2026,
    status: "Completed",
    summary:
      "A desktop tool for building image datasets from multiple sources — Bing, Google, iCrawler — and generating SAM-based masks and annotation files for training.",
    description:
      "Dataset Generator assembles image datasets from several scraping backends with user-agent spoofing and organized temp management, then supports mask generation with Segment Anything and annotation classes defined in JSON. Two CustomTkinter front-ends (app/ and new_ui/) drive the pipeline, and it ships with the CUDA-toolchain requirements for on-machine training.",
    technologies: [
      "Python",
      "CustomTkinter",
      "Selenium",
      "BeautifulSoup",
      "icrawler",
      "bing-image-downloader",
      "Pillow",
      "OpenCV",
      "Ultralytics",
      "Segment Anything (SAM)",
      "PyTorch (CUDA)",
    ],
    image: null,
    featured: false,
    features: [
      "Multi-source image download (Bing, Google Images, iCrawler) with fake-user-agent spoofing",
      "Organized download into per-class folders with temp-directory management",
      "SAM-based mask generation for annotation",
      "Annotation class definitions in annotation_classes.json",
      "Two GUI generations (app/ and new_ui/) plus CLI entry points",
      "run.ps1 launcher scripts for Windows",
    ],
    architecture:
      "MultiSourceDatasetGenerator orchestrates the scraping backends and file organization; mask_generator.py wraps Segment Anything for mask outputs; the CustomTkinter GUIs bind these into a desktop flow. Requirements pin the PyTorch CUDA 12.4 toolchain.",
    architectureDiagram: [
      "CustomTkinter GUI",
      "    ↓",
      "MultiSourceDatasetGenerator (Bing · Google · iCrawler)",
      "    ↓",
      "organized dataset → mask_generator (SAM) → annotations",
    ].join("\n"),
    limitations: [
      "Scraping reliability depends on the upstream image services",
      "SAM mask generation requires the SAM weights and a GPU for practical use",
    ],
  },

  {
    id: "detectie",
    title: "Detectie",
    category: "Systems",
    platform: "ESP32 · Python server · phone",
    year: 2026,
    status: "Experimental",
    summary:
      "An end-to-end license-plate detection system: YOLO + OCR on a Python WebSocket server, an ESP32 firmware client, and a phone-camera capture page.",
    description:
      "Detectie is a complete detection pipeline: a desktop app (PySide6) trains and tests YOLO models for plates, a Python server runs YOLO detection plus EasyOCR recognition and exposes a WebSocket API, an ESP32 client (PlatformIO/Arduino) receives results in real time, and a phone-camera HTML page feeds captures from a browser. It was built as a project with its own documentation (DOCUMENTATIE_PROIECT.md).",
    technologies: [
      "Python",
      "Ultralytics YOLO",
      "EasyOCR",
      "WebSockets",
      "OpenCV",
      "PySide6",
      "PlatformIO",
      "Arduino / ESP32",
      "C++",
      "ArduinoJson",
    ],
    image: "/projects/detectie/01-home.webp",
    screenshots: [
      "/projects/detectie/01-home.webp",
    ],
    featured: false,
    features: [
      "YOLO-based license-plate detection with confidence filtering",
      "OCR of the cropped plate region with EasyOCR",
      "WebSocket server streaming detection results",
      "ESP32 firmware: Wi-Fi with auto-reconnect, JSON messages, role registration",
      "Phone-camera capture page for sending images from a browser",
      "PySide6 training app with train/finetune/test tabs (shared with YOLO-Trainer)",
      "Project documentation in DOCUMENTATIE_PROIECT.md",
    ],
    architecture:
      "server.py runs YOLO inference and EasyOCR over async WebSockets and returns PlateResult objects (index, confidence, bbox, recognized text, crop path). The ESP32 connects as a client and renders results; phone_camera_client.html captures and uploads images. Models are trained offline with the PySide6 Train_APP.",
    architectureDiagram: [
      "Phone camera / camera feed",
      "    ↓",
      "Python server (YOLO → EasyOCR) ── WebSocket API",
      "    ↓",
      "ESP32 client (PlatformIO)  ·  web results",
      "",
      "PySide6 Train_APP trains the YOLO weights offline",
    ].join("\n"),
    limitations: [
      "Wi-Fi SSID, password and server IP are hardcoded in the ESP32 firmware — should move to build-time config",
      "Tied to a local network (single server address)",
      "Detection quality depends on the trained plate model",
    ],
    futureWork: [
      "Move network credentials out of src/main.cpp into PlatformIO build flags",
    ],
  },

  {
    id: "omni-studio",
    title: "OmniStudio",
    category: "AI / ML",
    platform: "Web · local tool · Desktop (Tauri)",
    year: 2026,
    status: "In Development",
    summary:
      "A local workspace for running LLMs: scan GGUF models, manage llama.cpp servers, chat with persistent conversations, and watch GPU stats — as a Tauri desktop app with a React UI.",
    description:
      "OmniStudio is a local AI runtime manager. The Tauri desktop app (Rust core, React UI) scans and registers llama.cpp backends, parses GGUF metadata (architecture, quantization, context length, tokenizer), stores model folders and conversations, streams chat tokens, and polls hardware stats via sysinfo. A companion web build pairs a Vite/React frontend with a FastAPI backend that launches llama-server subprocesses with configurable context, GPU layers and threads, streams chat completions with built-in tools, and polls system/GPU stats. The Image and Video Studio tabs are currently placeholders that return generated preview SVGs — the real generation pipeline is not built yet.",
    technologies: [
      "Tauri 2",
      "Rust",
      "React",
      "Vite",
      "TypeScript",
      "Tailwind CSS",
      "FastAPI",
      "Python",
      "llama.cpp (llama-server)",
      "zustand",
      "sysinfo",
      "libloading",
      "react-markdown",
      "Axios",
      "Radix UI",
      "Three.js",
    ],
    image: "/projects/omni-studio/01-home.webp",
    screenshots: [
      "/projects/omni-studio/01-home.webp",
      "/projects/ai-studio/01-home.webp",
    ],
    github: "https://github.com/Cata5/OmniStudio",
    featured: true,
    features: [
      "Backend registry: scan for llama.cpp executables, add custom backends, remove, poll state",
      "Model management: add model folders, rescan, parse GGUF metadata",
      "GGUF model scanning and profile management (settings persisted to JSON)",
      "llama-server process manager — context size, GPU layers, threads, batch, cache type",
      "Chat with streaming completions and tool-calling (calculator, web search, file parser)",
      "Chat with streaming tokens and persistent conversations",
      "Hugging Face model download UI",
      "Live system stats and GPU VRAM polling",
      "Hardware statistics polling (CPU/GPU via sysinfo) with subscribers",
      "Backend capability inspection and refresh (dynamic loading)",
      "Native file and folder browsing",
      "Settings and UI state persisted via zustand stores",
      "Windows/DXGI integration in the Rust core",
      "Mock llama-server for testing the UI without a model",
    ],
    partialFeatures: [
      "Image Studio / Video Studio — endpoints exist but return placeholder SVGs / sample video, not real generation",
    ],
    architecture:
      "The Rust core (tauri commands + sysinfo + libloading) owns hardware, model metadata and backend lifecycle; React services wrap Tauri invoke() calls and poll state. The web build runs a FastAPI backend whose LlamaProcessManager spawns llama-server as a subprocess with a model config and tracks status, PID, uptime and a log ring buffer — the React app polls status and stats and talks to models over the OpenAI-compatible API. Tool execution runs in the backend tool runner; zustand stores keep settings and UI state.",
    architectureDiagram: [
      "React UI (Tauri desktop · web)",
      "    ↑  Tauri commands / HTTP + polling",
      "Rust core (sysinfo · GGUF parser · libloading) / FastAPI backend",
      "    ├─ backend registry → llama-server / llama.cpp",
      "    ├─ config_manager → profiles/settings (JSON)",
      "    └─ tool_runner → calculator / web_search / file_parser",
    ].join("\n"),
    limitations: [
      "Early stage (v0.1.0, 3 commits) — chat depends on a backend being registered",
      "Image and video generation are mocked — no real diffusion pipeline yet",
      "Requires llama.cpp binaries and GGUF models to be present locally",
      "Rust core requires a Tauri build toolchain",
    ],
  },

  {
    id: "siteauto",
    title: "Siteauto",
    category: "Web",
    platform: "Web",
    year: 2025,
    status: "Completed",
    summary:
      "A car-parts shop with AI detection: upload a photo and a custom YOLOv8 model identifies the part and matches products — plus cart, checkout, appointments and a dashboard.",
    description:
      "Siteauto is a Next.js storefront for car parts with a computer-vision twist: the detect page accepts a photo, runs a custom-trained YOLOv8 model (there are variants trained with and without side mirrors), draws the detected part on a canvas and filters matching products. The store itself has products, a cart (Redis-backed), checkout, JWT auth, service appointments, a dashboard for cars and messages, 3D product models and a floating chat widget. The detection runs through a Python helper spawned by the Next.js API route.",
    technologies: [
      "Next.js 15",
      "React 19",
      "Tailwind CSS",
      "YOLOv8 (Ultralytics)",
      "Python",
      "OpenCV",
      "Redis (ioredis)",
      "JWT / bcryptjs",
      "Three.js (react-three-fiber)",
      "framer-motion",
    ],
    image: "/projects/siteauto/01-home.webp",
    featured: true,
    screenshots: ["/projects/siteauto/01-home.webp"],
    features: [
      "Photo upload with canvas preview and YOLOv8 part detection (custom model, .15 confidence floor)",
      "Detection results matched against store products",
      "Shop with product pages and 3D product models",
      "Cart + checkout flow",
      "Register/login with JWT sessions",
      "Service appointments and dashboard (appointments, cars, messages)",
      "Floating chat widget",
      "Docker deployment with Python/OpenCV system deps",
    ],
    architecture:
      "app/api/detect/route.js spawns utils/detect.py (Ultralytics YOLO + OpenCV) as a child process, parses its JSON output, and matches classes to products. The store layer uses Redis via lib/redis.js for cart state, and JWT middleware guards the dashboard/checkout routes. Custom .pt models live in model/.",
    architectureDiagram: [
      "Browser (upload photo)",
      "    ↓",
      "Next.js /api/detect → python utils/detect.py (YOLOv8)",
      "    ↓  JSON detections",
      "product matching → shop / cart (Redis) / checkout (JWT)",
    ].join("\n"),
    limitations: [
      "Requires Redis running locally for cart functionality",
      "Detection runs a Python subprocess per request — fine for a demo, not for scale",
      "Model files (.pt) are large binaries kept in the repo",
    ],
  },

  {
    id: "coraltech",
    title: "Coral Tech · FTC team site",
    category: "Web",
    platform: "Web",
    year: 2026,
    status: "Completed",
    demo: "https://cata5.github.io/CoralTechWeb/",
    summary:
      "Bilingual (EN/RO) website for an FTC robotics team with a local-LLM RAG chatbot that answers from the site's own content, citing sources.",
    description:
      "Coral Tech is the website of an FTC robotics team (#28260) — \"fusing nature with technology\". It's bilingual (English/Romanian), covers seasons, activities, sponsors, the team and a blog, and includes a RAG chatbot: content is embedded with local Ollama models into a persisted vector store, and the chat endpoint retrieves chunks, answers with a local GGUF model (node-llama-cpp), and returns structured actions (scroll to a section) plus sources. Admin auth uses WebAuthn passkeys.",
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "node-llama-cpp",
      "Ollama (embeddings)",
      "RAG / vector search",
      "WebAuthn (SimpleWebAuthn)",
      "framer-motion",
      "PDF parsing",
    ],
    image: "/projects/coraltech/01-home.webp",
    featured: true,
    screenshots: ["/projects/coraltech/01-home.webp", "/coral-web.png"],
    features: [
      "Bilingual content (EN/RO) with locale files",
      "Content model: activities, seasons, sponsors, team, blog posts",
      "RAG chat over local vectors with structured answers, action buttons and cited sources",
      "Content sync + reindex endpoint with fingerprint caching",
      "File-watcher triggered background refresh on content changes",
      "Admin authentication with WebAuthn passkeys",
      "Local GGUF model configuration (model path, temperature, max tokens, context)",
    ],
    architecture:
      "The RAG pipeline embeds site content with Ollama, stores vectors in data/rag/vectors.json, and loads them in memory for cosine/hybrid retrieval. Chat answers are generated by a local GGUF model via node-llama-cpp, with the response schema returning answer, actions, sources and language. A sync endpoint rebuilds the website snapshot and can reindex vectors.",
    architectureDiagram: [
      "Site content (content/ · app/ · locales/)",
      "    ↓  sync + embed (Ollama)",
      "Vector store (data/rag/vectors.json)",
      "    ↓  retrieve",
      "/api/rag/chat → local GGUF (node-llama-cpp) → answer + sources + actions",
    ].join("\n"),
    limitations: [
      "Chat requires Ollama and the GGUF model to be running locally",
      "Vector store is file-based JSON — fine for a small site",
    ],
  },

  {
    id: "liceul",
    title: "Liceul Teoretic Ion Cantacuzino",
    category: "Web",
    platform: "Web",
    year: 2026,
    status: "Completed",
    demo: "https://cata5.github.io/LiceulTeoreticIonCantacuzino/",
    summary:
      "A complete school website — news, classes, teachers directory, documents, gallery, e-learning and timetable — with a SQLite-backed admin panel.",
    description:
      "A production-style website for Liceul Teoretic Ion Cantacuzino built on Next.js. It publishes news, classes, teachers, documents, results, gallery and a school magazine, plus e-learning and timetable pages. Content is managed through an admin panel (JWT sessions, bcrypt-hashed passwords) and stored in SQLite (better-sqlite3), migrated from a legacy JSON data store by a one-time migration script that refuses to run over existing data.",
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "better-sqlite3",
      "JWT (jose)",
      "bcryptjs",
      "zod",
      "Radix UI",
      "framer-motion",
      "pdf-parse",
    ],
    image: "/projects/liceul/01-home.webp",
    featured: false,
    screenshots: ["/projects/liceul/01-home.webp"],
    features: [
      "Content entities: settings, news, classes, teachers, gallery, documents, results, pages",
      "Admin panel with JWT sessions and bcrypt password hashing",
      "SQLite storage with JSON → SQLite one-time migration (guarded by a migration key)",
      "Public pages: news, classes, teachers directory, documents, gallery, magazine, e-learning, timetable",
      "Server-rendered pages with loading/error boundaries",
      "Theme toggle and animated reveals (framer-motion)",
    ],
    architecture:
      "lib/db.ts wraps better-sqlite3; content-store.ts provides the content layer over all entities. Server actions and API routes read/write SQLite, and the admin flow issues signed JWTs. The migration script (scripts/migrate-json-to-sqlite.ts) imports legacy JSON only when the database is empty and unmarked.",
    architectureDiagram: [
      "Public pages (news · classes · teachers · gallery …)",
      "    ↑  content-store.ts",
      "SQLite (data/db.sqlite)",
      "    ↑  admin panel (JWT + bcrypt) · migration guard",
    ].join("\n"),
    limitations: [
      "School-specific content lives in the database — needs seeding for a fresh deploy",
    ],
  },

  {
    id: "yolo-trainer",
    title: "YOLO Trainer",
    category: "Developer Tools",
    platform: "Windows",
    year: 2026,
    status: "Completed",
    summary:
      "A PySide6 desktop app for training, fine-tuning and testing YOLO models (v8/11/26) with live logs, metric charts, GPU checks and a packaged Windows installer.",
    description:
      "YOLO Trainer is a desktop GUI around Ultralytics training. It splits the workflow into Train, Fine-tune and Test tabs, runs training in a QThread so the UI stays live, plots metrics with pyqtgraph, validates datasets and presets, and supports inference on images, videos or folders. It can be packaged as a Windows installer (PyInstaller + Inno Setup) and supports WebSocket-based remote inference.",
    technologies: [
      "Python",
      "PySide6",
      "Ultralytics YOLO (v8 · 11 · 26)",
      "pyqtgraph",
      "matplotlib",
      "EasyOCR",
      "PyTorch",
      "PyInstaller",
      "Inno Setup",
      "WebSockets",
    ],
    image: "/yolo-train.png",
    featured: false,
    screenshots: ["/yolo-train.png"],
    features: [
      "Train / fine-tune / test tabs with preset configurations",
      "Background training via QThread with live logs and progress",
      "Metric plotting (pyqtgraph / matplotlib)",
      "Inference testing on images, video and folders",
      "Dataset validation before training",
      "GPU detection and configuration",
      "Dark theme UI",
      "Windows installer packaging (PyInstaller spec + Inno Setup script)",
      "WebSocket-based remote inference",
    ],
    architecture:
      "Training runs in a QThread worker (workers/training_worker.py) that reports logs and metrics to the UI; services wrap Ultralytics, GPU discovery, dataset validation and preset loading; widgets render logs and metric plots; inference workers handle test-time detection.",
    architectureDiagram: [
      "PySide6 UI (tabs: train · finetune · test)",
      "    ↓  QThread workers",
      "Ultralytics YOLO (train / finetune / predict)",
      "    ├─ dataset_service (validation)",
      "    ├─ gpu_service (CUDA)",
      "    └─ preset_service (YAML presets)",
    ].join("\n"),
    limitations: [
      "Training requires the PyTorch/CUDA toolchain",
      "WebSocket inference needs a running receiver",
    ],
  },

  {
    id: "jarvis",
    title: "Jarvis · OS Helper",
    category: "AI / ML",
    platform: "Windows · local",
    year: 2026,
    status: "In Development",
    summary:
      "A local-first AI operating assistant: a 9B planner, a 26M executor, 56 tools, and an offline keyword router so everything keeps working without a model server.",
    description:
      "Jarvis is a local-first, extensible AI assistant built on the @earendil-works/pi framework. It uses a three-layer architecture — Ornith (9B) plans but never calls tools, Needle (26M) picks tool + args but never chats, and the runtime validates, checks permissions, executes and logs. There are 56 tools across filesystem, shell, Windows, Excel, browser, memory, media, system, archive, document, image, AI, automation and dev groups. A correction layer routes intents offline — fixing typos, Unix aliases and known failure modes — so all tools stay reachable even when no model is running. The media manager syncs a Google Drive / local library and talks to qBittorrent and rclone.",
    technologies: [
      "TypeScript",
      "Node.js",
      "@earendil-works/pi-ai",
      "better-sqlite3",
      "Docker (CUDA)",
      "rclone",
      "qBittorrent API",
      "ffmpeg",
      "Jest",
    ],
    image: null,
    github: "https://github.com/Cata5/Agetic-OS-Helper",
    featured: false,
    features: [
      "Three-layer agent architecture: planner (9B) → executor (26M) → runtime",
      "56 tools in 14 groups with a permissions system (safe/ask)",
      "Offline correction-layer router: typo tolerance, Unix aliases, multilingual hints, legacy failure fixes",
      "Media manager: filelist (SQLite-cached library), drive (rclone), torrent (qBittorrent WebUI)",
      "Persistence: media index and memory stores in SQLite",
      "GPU Docker workspace (CUDA Jupyter) via docker-compose",
      "Test suite (Jest) covering executor, permissions, media and tools",
      "Documentation for installation, extensions, workflows and model optimization",
    ],
    architecture:
      "Queries flow User → Ornith (planner) → Needle (executor) → Runtime → Tools. The runtime validates and gates tool calls by permission; when Needle is unavailable, correction.ts routes intents via a prioritized keyword scorer so the same tools stay reachable offline. Media tooling caches library state in media_index.db and integrates rclone + qBittorrent.",
    architectureDiagram: [
      "User",
      "  ↓",
      "Ornith (planner, 9B) — plans, never calls tools",
      "  ↓",
      "Needle (executor, 26M) — picks tool + args",
      "  ↓",
      "Runtime (validate · permissions · execute · log)",
      "  ↓",
      "56 tools — filesystem · shell · windows · excel · browser · media · AI …",
      "",
      "correction.ts routes intents offline when Needle is down",
    ].join("\n"),
    limitations: [
      "Relies on the @earendil-works/pi framework as the host platform",
      "Requires bundled binaries (ffmpeg, rclone) and optional qBittorrent for media tools",
    ],
  },

  {
    id: "llm-finetuner",
    title: "LLM Finetuner",
    category: "AI / ML",
    platform: "Web · local tool",
    year: null,
    status: "Completed",
    summary:
      "A Flask web interface for fine-tuning LLMs with Unsloth — LoRA parameters, live GPU monitoring, custom chat templates and training resume.",
    description:
      "LLM Finetuner puts Unsloth-based LoRA fine-tuning behind a web UI. It ships with model presets (Llama 3.2 1B, Mistral 7B 4-bit), configurable LoRA/training parameters, GPU/CPU/system metrics streamed from the backend, custom chat templates, live training logs and a resume flow. Heavy imports (Unsloth, TRL, Transformers) load lazily so the UI stays responsive, and everything runs locally.",
    technologies: [
      "Python",
      "Flask",
      "Unsloth",
      "TRL / SFTTrainer",
      "PyTorch",
      "LoRA",
      "psutil",
      "nvidia-smi / WMI",
    ],
    image: "/projects/llm-finetuner/01-home.webp",
    screenshots: [
      "/projects/llm-finetuner/01-home.webp"
    ],
    featured: true,
    features: [
      "Fine-tune any Unsloth-compatible model from a web form",
      "Model presets in config/models.json (e.g. Llama 3.2 1B Instruct, Mistral 7B v0.3, 4-bit variants)",
      "Configurable LoRA + training parameters (rank, alpha, dropout, batch, grad accumulation, warmup, max steps, learning rate)",
      "Custom chat template support with defaults in config/default_template.json",
      "Live GPU / CPU / system metrics (nvidia-smi, WMI/win32pdh on Windows, psutil)",
      "Live training logs and status tracking",
      "Training resume from a saved state (resume.html)",
      "Lazy loading of heavy ML imports; uploads and cache directories managed by the app",
      "Example training dataset included (data.json — car-diagnostics chat pairs)",
    ],
    architecture:
      "Flask serves the web UI and defers to a lazily-imported finetunerLLM module that drives Unsloth's FastLanguageModel with TRL's SFTTrainer. Training runs on a background thread while a status object tracks progress and messages. Config lives in JSON files under config/ (models, default settings, templates).",
    architectureDiagram: [
      "Browser (index · resume)",
      "    ↓",
      "Flask app.py",
      "    ├─ finetunerLLM (Unsloth + SFTTrainer)",
      "    ├─ utils/system_monitor (GPU/CPU metrics)",
      "    └─ config/*.json (models · settings · templates)",
    ].join("\n"),
    limitations: [
      "Requires a CUDA GPU with enough VRAM and the CUDA toolchain (tested on 12.4)",
      "Requires an Unsloth-compatible model",
      "Training is local-only — no distributed or cloud training",
    ],
  },

  {
    id: "neuroshell",
    title: "NeuroShell",
    category: "Developer Tools",
    platform: "Terminal (Windows/Linux/macOS)",
    year: null,
    status: "Completed",
    summary:
      "A Claude Code-style terminal AI shell: slash commands, tab completion, instant model hot-swapping across Ollama/GGUF/Transformers/HF/OpenAI, and a sandboxed tool loop.",
    description:
      "NeuroShell is an interactive terminal shell and autonomous tool-using AI agent. It brings a Claude Code-like command interface with a slash-command palette, real-time tab autocompletion, instant model swapping across five backends (Ollama, local GGUF, PyTorch Transformers, Hugging Face cloud, OpenAI-compatible endpoints), and a sandboxed tool-execution loop that restricts filesystem and terminal actions to the configured workspace. It includes a GPU device abstraction (CUDA with automatic CPU fallback), Hugging Face model downloads with cache management, dialogue memory, RAG command indexing, and optional voice input/output.",
    technologies: [
      "Python",
      "prompt_toolkit",
      "PyTorch (CUDA)",
      "llama-cpp-python",
      "Ollama",
      "Hugging Face Hub",
      "OpenAI-compatible APIs",
      "PyInstaller",
    ],
    image: "/neuro-shell.png",
    featured: true,
    // Genuine captures of the running CLI (welcome, command menu, tool list
    // with the security panel, CUDA diagnostics, and the model registry),
    // followed by the original boot screen from the packaged build.
    screenshots: [
      "/projects/neuroshell/01-welcome.webp",
      "/projects/neuroshell/02-help.webp",
      "/projects/neuroshell/03-tools.webp",
      "/projects/neuroshell/04-gpu.webp",
      "/projects/neuroshell/05-model.webp",
      "/neuro-shell.png",
    ],
    features: [
      "Interactive REPL with a slash-command palette (/help, /model, /gpu, /download, /clear, /tools, /mode, /history, /exit)",
      "Real-time tab autocompletion for commands, models, Hugging Face repos and workspace paths",
      "Instant model hot-swapping across Ollama, local GGUF, Transformers, HF Cloud and OpenAI-compatible endpoints",
      "Autonomous tool-use loop with planning, intent classification, task state and reflection modules",
      "Sandboxed execution: filesystem/terminal restricted to the workspace; dangerous commands blocked; Safe Mode asks before modifying",
      "GPU device abstraction with /gpu diagnostics (device, name, VRAM) and CPU fallback",
      "Hugging Face model downloading with cache management (HF_HOME isolated)",
      "Dialogue history (JSONL) and execution memory",
      "RAG command indexing and project-aware helpers (project detection, brain, summarizer)",
      "Optional voice: STT/TTS with wake word and auto language detection",
      "PyInstaller-friendly entry point with pip-subprocess support",
    ],
    architecture:
      "A prompt_toolkit REPL (ui/cli.py) drives a turn loop (core/loop.py) that routes intents through a tool router to sandboxed executors. Models are managed by models/manager.py across five providers, with a GPU device layer (gpu/device.py) mapping tensors to cuda:0 or cpu. State (config, registry, history) lives under ~/.neuroshell/, with caches isolated there too.",
    architectureDiagram: [
      "Terminal REPL (prompt_toolkit)",
      "    ↓",
      "core/loop (agent · planner · router)",
      "    ↓",
      "tools (terminal · filesystem · system · web) — sandboxed",
      "    ↑",
      "models/manager → ollama · GGUF · transformers · HF · OpenAI",
    ].join("\n"),
    limitations: [
      "Local model quality depends on the active backend/model",
      "Requires Python 3.10+ and (for GPU) an NVIDIA GPU with the CUDA wheels",
    ],
  },

  {
    id: "ocr-pdf",
    title: "Handwritten PDF → Typed PDF",
    category: "Desktop",
    platform: "Windows/Linux/macOS (GUI + API)",
    year: null,
    status: "Active",
    summary:
      "A local desktop app that converts handwritten PDF pages — including math — into clean typed PDFs, powered by GLM-OCR via Ollama or Transformers.",
    description:
      "This app turns scanned handwritten PDFs (including formulas) into clean typed PDFs entirely on your machine. A Tkinter GUI (the default mode) picks an input PDF, chooses a backend — an Ollama model like glm-ocr:q8_0, a custom GGUF imported into Ollama, or the zai-org/GLM-OCR Transformers model — and produces a typeset PDF via ReportLab with LaTeX-style math rendered through matplotlib mathtext. A FastAPI backend is also available for scripted use, with job tracking, per-page progress and timeouts.",
    technologies: [
      "Python",
      "Tkinter",
      "FastAPI",
      "Ollama (GLM-OCR)",
      "Transformers",
      "PyMuPDF",
      "ReportLab",
      "matplotlib mathtext",
      "PyTorch",
    ],
    image: null,
    featured: false,
    features: [
      "Convert handwritten PDF pages (incl. math) to typed PDF locally",
      "Two OCR backends: Ollama model tag (default glm-ocr:q8_0) or zai-org/GLM-OCR via Transformers",
      "Custom GGUF import into Ollama on convert",
      "Prompt modes for text, formula and table recognition",
      "Math rendering with matplotlib mathtext in the output PDF",
      "Unicode-safe PDF fonts (DejaVu) via ReportLab",
      "Tkinter GUI with progress panel, page/pass progress and heartbeat updates",
      "FastAPI API mode with job tracking, uploads and CORS for local frontends",
      "Configurable DPI, max tokens, page timeout and runtime limits",
      "Large pages resized automatically for reliability",
    ],
    architecture:
      "FastAPI (v1.0) exposes conversion endpoints backed by ocr_service.py (backend selection, Ollama client, GLM-OCR Transformers path) and pdf_processing.py (page rendering with PyMuPDF, typed PDF assembly with ReportLab and matplotlib math). The Tkinter GUI drives the same pipeline. Jobs run with per-page timeouts and a shared inference lock.",
    architectureDiagram: [
      "Tkinter GUI (default)  ·  FastAPI (API mode)",
      "        ↓",
      "ocr_service — ollama | transformers (GLM-OCR)",
      "        ↓",
      "pdf_processing — PyMuPDF → ReportLab (+ matplotlib math)",
      "        ↓",
      "typed PDF",
    ].join("\n"),
    limitations: [
      "Requires Ollama running locally for the Ollama backend, or the GLM-OCR Transformers model for the transformers backend",
      "GPU recommended for speed (CPU works)",
      "Recognition quality varies with handwriting and the chosen model",
    ],
  },

  {
    id: "webstudio",
    title: "Webstudio · working copy",
    category: "Experiments",
    platform: "Web",
    year: null,
    status: "Experimental",
    summary:
      "A local working copy of Webstudio, the open-source visual website builder monorepo. No git history is present in this copy, so personal changes could not be verified.",
    description:
      "A local copy of the Webstudio monorepo (apps/builder plus the sdk, css-engine, design-system and prisma packages). It's kept for studying and experimenting with a production visual-builder codebase. Because this folder has no .git history, I could not verify which parts (if any) were authored or changed locally — treat it as a working copy until that's confirmed.",
    technologies: [
      "pnpm monorepo",
      "React",
      "TypeScript",
      "Prisma",
      "PostgREST",
      "CSS engine",
      "SDK packages",
    ],
    image: null,
    featured: false,
    excludeFromRelated: true,
    features: [
      "Webstudio Builder application (apps/builder)",
      "Extensive package ecosystem: sdk, react-sdk, css-engine, design-system, prisma-client, cli",
      "SDK component libraries for React, Radix, Remix and React Router",
    ],
    architecture:
      "A pnpm-workspace monorepo: apps/builder is the visual editor; packages/ contains the sdk, css-engine, design-system, prisma-client and component libraries consumed by generated sites.",
    limitations: [
      "No git history in the copy — personal contributions could not be verified",
      "Large third-party codebase; not authored from scratch",
    ],
  },
];

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}

/** Projects with a real (non-placeholder) detail page. */
export const realProjects = projects.filter((p) => !p.placeholder);

export const featuredProjects = projects.filter((p) => p.featured);

/** Categories that actually appear in the data — drives the explorer filters. */
export const projectCategories = Array.from(
  new Set(projects.map((p) => p.category)),
);

/**
 * Related projects, chosen by shared category or shared technology.
 * Used on detail pages — never random.
 */
export function getRelatedProjects(id: string, count = 3) {
  const project = getProject(id);
  if (!project) return [];
  const others = projects.filter(
    (p) => p.id !== id && !p.placeholder && !p.excludeFromRelated,
  );
  const scored = others
    .map((p) => {
      let score = 0;
      if (p.category === project.category) score += 2;
      const shared = p.technologies.filter((t) =>
        project.technologies.includes(t),
      ).length;
      score += shared;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
  return scored.map((x) => x.p);
}
