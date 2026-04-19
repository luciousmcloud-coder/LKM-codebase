# OpenManus Learning Prototype

## What this prototype is

This project is a **beginner-friendly OpenManus-inspired interface prototype** built around the idea of a local-only agent workspace. The product direction is called **Mission Control Tutor**, which means the AI is presented as a capable local machine that the user supervises, learns from, and can interrupt instantly.

The prototype currently implements a polished graphical UI and a matching server-side API contract for a future **built-in local model runner**. It is designed so the user can choose a downloaded model from the interface, load it, chat immediately, attach files to the conversation, inspect learning explanations, and retrieve returned exports.

## What is implemented now

| Area | Status | Notes |
| --- | --- | --- |
| **Graphical workspace** | Implemented | left model library, central chat workbench, right learning inspector |
| **Settings / Preferences panel** | Implemented | syntax highlighting, code categories, inline explanations, split view, guided mode all enabled by default |
| **Model library UI** | Implemented | local model cards, active-model badge, runtime telemetry |
| **Runtime control surface** | Implemented | load, refresh, stop, health and startup metadata |
| **Files and exports surfaces** | Implemented | file inventory, export inventory, import/export framing |
| **Server API contract** | Implemented | `/api/models`, `/api/runtime`, `/api/preferences`, `/api/attachments`, `/api/exports`, `/api/chat` |
| **Built-in inference engine** | Not yet connected | the current server returns a structured placeholder response instead of a real model completion |

## Current limitation

The prototype is **not yet loading a real local model inside this sandbox build**. Instead, it already defines the product surface and API contract that a packaged runtime adapter should satisfy. In practice, the next engineering step is to connect the placeholder runtime functions to an embedded inference engine, most likely a packaged **llama.cpp-based adapter** or a similar internal runtime that the user does not have to manage separately.

## Why this still matters

Even without the final runtime bridge, the difficult product-design work is already done in a reusable way:

1. the user flow is defined,
2. the settings model is defined,
3. the file and export surfaces are defined,
4. the stop and supervision controls are defined,
5. the API contract for model discovery and runtime control is defined.

That means the remaining work is primarily **runtime integration**, not interface invention.

## How to run it

### Development mode

```bash
cd /home/ubuntu/openmanus-learning-ui
pnpm dev
```

This starts the Vite frontend development server. The UI will render, but the frontend development server by itself does **not** exercise the production Express API contract unless you add a development proxy or run the production server alongside it.

### Production-like mode

```bash
cd /home/ubuntu/openmanus-learning-ui
pnpm build
PORT=3002 pnpm start
```

This serves the compiled frontend and the Express API together, which is the best way to preview the prototype behaviour implemented here.

## Key files

| File | Purpose |
| --- | --- |
| `client/src/pages/Home.tsx` | main Mission Control Tutor workspace |
| `client/src/App.tsx` | application shell with dark default theme |
| `client/src/index.css` | global dark theme and typography tokens |
| `client/index.html` | font loading for IBM Plex Sans and JetBrains Mono |
| `server/index.ts` | prototype API contract for models, runtime, chat, files, and exports |
| `docs/prototype-architecture.md` | architecture and product decisions |
| `docs/openmanus-integration-notes.md` | integration findings and preview observations |
| `ideas.md` | initial design brainstorming directions |

## Recommended next engineering steps

| Step | Reason |
| --- | --- |
| **Add a development proxy or unified dev server** | so `/api/*` works in development mode as well as production mode |
| **Replace the placeholder runtime adapter** | connect model discovery and loading to an embedded local engine |
| **Add real file upload endpoints** | allow binary upload, indexing, preview generation, and export download |
| **Bridge to the Python OpenManus agent loop** | reuse the existing OpenManus logic behind the new UI |
| **Persist sessions and preferences** | keep model state, chat history, and learning settings between launches |

## Product intent for the final version

The final version should feel simple from the user’s perspective:

> choose a local model, press load, start chatting immediately, attach any file you need, inspect what the AI is doing, and download any returned artifact without touching external runtime software.

That is the direction this prototype is now set up to support.
