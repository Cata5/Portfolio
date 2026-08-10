# Catalin — Portfolio

A personal developer portfolio. Dark-first, editorial, data-driven.

## Stack

- Next.js 16 (App Router, Server Components by default)
- React 19, TypeScript, Tailwind CSS v4
- shadcn/ui (Base UI primitives) — heavily customized
- Motion for restrained animation
- next-themes (dark / light / system)
- cmdk command palette (⌘K / Ctrl+K)

## Getting started

```bash
npm install
npm run dev
```

## Structure

```
app/                  routes, layout, metadata, SEO
components/           section components + ui primitives
data/                 ALL content lives here — the only file you should edit
public/projects/      project screenshots (drop files here)
```

## Content

Everything on the page is driven by `data/`:

- `data/site.ts` — name, email, GitHub, hero tagline, "currently building" panel
- `data/projects.ts` — projects (featured + explorer + detail pages)
- `data/skills.ts` — stack groups and the "I work with" list
- `data/journey.ts` — timeline
- `data/ml.ts` — ML notebook runs

Entries flagged `placeholder: true` render with a clearly temporary treatment.
Replace them with real content and remove the flag. **Never invent metrics,
stats, clients or experience — leave fields out instead.**

To add a project: add an entry to `data/projects.ts`, drop a screenshot in
`public/projects/`, and point `image` at it. The site updates everywhere.

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run lint` — eslint
