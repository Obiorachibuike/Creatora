# Creatora — AI Creative Production Platform

**Create Beyond Imagination.** Creatora is an AI-powered creative production SaaS: AI video, image, voice and music tools plus a professional multitrack editor — inspired by ClickUp Creative Studio with a more extensive, functional backend.

This is a **working, production-ready Next.js application**, not a landing page.

## 🚀 Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up PostgreSQL

The app uses **Drizzle ORM + node-postgres** (Part 7) and stores everything in PostgreSQL tables (`users`, `workspaces`, `memberships`, `projects`, `timelines`, `timeline_tracks`, `timeline_clips`, `assets`, `generations`, `generation_events`, `ai_providers`, `ai_models`, `credit_accounts`, `credit_transactions`, `subscriptions`, `exports`, `templates`, `brand_kits`, `comments`, `invitations`, `publishing_accounts`, `publishing_jobs`, `audit_logs`, …).

```bash
# Local PostgreSQL
sudo -u postgres createuser creatora -P
sudo -u postgres createdb creatora
```

Set `DATABASE_URL` in `.env` (copy `.env.example`).

### 3. Auth environment

Generate a secret and add to `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### 4. Start dev + typecheck

```bash
npm run dev
npm run typecheck
npm test      # vitest (brand tokens + provider registry)
npm run lint
npm run build # production build
```

## 🏢 Pages & features

| Route | Description |
| --- | --- |
| `/` | Dashboard: recent projects, generation activity, stats |
| `/projects` | Project list + “New Project” dialog |
| `/projects/[id]` | Project detail: timeline + recent generations |
| `/projects/[id]/editor` | Multitrack editor (tracks, clips, timeline) |
| `/video-studio` | Text-to-video studio (Part 2) |
| `/ai-image` | Generated asset library (Part 3) |
| `/ai-assistant` | Structured creator assistant (Part 12) |
| `/sign-in` / `/sign-up` | Credentials auth (email + password, bcrypt) |

## 🎨 Brand identity

Sunset Orange (`#FF6B35`) is the primary accent everywhere. CSS design tokens live in `src/app/globals.css`; the constants are re-exported from `src/lib/brand.ts`. Typography: Sora (display), DM Sans (interface), monospace for metadata. Neutroada green is gone. Light theme available via the `light` class on `<html>`.

## ⚡ AI architecture (Part 5)

`src/lib/ai/registry.ts` builds provider adapters from the `ai_providers`/`ai_models` tables (provider-independent). `src/lib/ai/providers/base.ts` defines the interface (image, video, audio). Today the mock provider is bundled for development/testing; production adapters for OpenAI-compatible APIs plug in the same interface using the env-var keys. Generation: `POST /api/generations` (status persisted in `generations`; progress streams via `GET /api/generations/stream`).

## 📊 Background jobs & SSE (Part 6)

Generations, renders and exports are persistent records in `generations` / `exports` (Drizzle), so they survive browser refresh — state is polled/SSE-streamed via `/api/generations/stream`.

## 💳 Credits & subscriptions (Part 8)

`src/lib/credits.ts` implements usage-based credits: reserve → settle on success → automatic refund on failure, with `credit_transactions` as the audit trail. Plans are stored in `subscriptions` (Free/Creator/Pro/Business/Agency).

## ⚙️ Commands

```bash
npm run dev          # dev server
npm run start        # production server
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc
npm test             # vitest (brand + provider registry)
```

## 📌 Scope of this delivery

Full 13-milestone build (voice studio, FFmpeg compositor, social-media publishing, full multitrack timeline UX, etc.) is the long tail of the original master prompt. This branch delivers the foundation + core studio flows (auth, dashboard, projects, video studio, asset library, assistant, editor skeleton, API + SSE, credits). Continue on the branch to land the remaining milestones.

## 🚀 Deploy to Vercel

```bash
vercel
```

- Create a PostgreSQL database on [Vercel Storage](https://vercel.com/storage) and copy the connection string to `DATABASE_URL`.
- Run `npx drizzle-kit push` to sync the Drizzle schema to PostgreSQL, or `npx drizzle-kit generate` to create migration SQL files.
