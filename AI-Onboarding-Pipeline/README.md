# APEX Onboarding Avatar (Tavus)

A voice-first onboarding assistant powered by Tavus CVI (Conversational Video Interface). New clients open a link, click Start, and have a real-time voice conversation with an AI avatar that walks them through onboarding — no forms, no friction.

## Quick Start

```bash
npm install

# Copy env template and fill in values (see "Environment Variables" below)
cp .env.example .env

# Local dev (HMR on port 8080, API proxy on port 3000)
node server.js          # Terminal 1 — Express API proxy
npm run dev             # Terminal 2 — Vite dev server

# Or: production build + local preview
npm run build && node server.js   # Serves on http://localhost:3000
```

## Environment Variables

Set in `.env` at the project root:

| Variable | Where | Description |
|----------|-------|-------------|
| `TAVUS_API_KEY` | Server-side only | Tavus API key — get from [platform.tavus.io](https://platform.tavus.io) > Settings > API Keys |
| `VITE_TAVUS_PERSONA_ID` | Build-time (frontend) | Persona ID — current: `p7dd9e227dc7` |
| `VITE_TAVUS_REPLICA_ID` | Build-time (frontend) | Replica ID — current: `r5dc7c7d0bcb` |
| `VITE_TAVUS_PROXY_URL` | Build-time (frontend) | Leave empty for same-origin (combined server) |

> **WARNING — API Key IP Allowlisting**: Tavus API keys support per-key IP allowlists on the dashboard. **Local dev and Railway MUST use separate keys.** The local key can be IP-restricted to your machine. Railway's key must have **NO IP restriction** — Railway's outgoing IPs are dynamic and unpredictable. Using an IP-restricted key on Railway causes `401 "Invalid access token"` even though the same key works locally. This was diagnosed the hard way.

> **WARNING — VITE_ prefix**: Vite only exposes env vars with the `VITE_` prefix to the frontend bundle. `TAVUS_API_KEY` deliberately has no prefix — it's server-side only, read by `server.js` via `process.env`. Never add `VITE_` to the API key. On Railway, `VITE_*` vars are injected at **build time** — after changing them, you must redeploy (`railway up`), not just restart.

If `VITE_TAVUS_PERSONA_ID` or `VITE_TAVUS_REPLICA_ID` are missing (or set to `"REPLACE_ME"`), the app shows a setup message instead of the Start button.

## Deploy to Railway

```bash
# Install Railway CLI: https://docs.railway.com/guides/cli
railway login
railway link          # Link to the existing project
railway up            # Deploy
```

Build command (`npm run build`) and start command (`node server.js`) are configured in `railway.toml`.

## Commands

```bash
npm run dev            # Vite dev server (port 8080, HMR)
npm run build          # Production build (strips console.log)
npm run build:dev      # Dev build (keeps console.log — use for local debugging)
npm run preview        # Serve production build locally
npm start              # Production server (Express on port 3000)
npm test               # Run tests (Vitest)
npm run lint           # ESLint
```

> **NOTE — Debug builds**: `npm run build` strips ALL `console.*` and `debugger` statements for production. Use `npm run build:dev` when you need to see logs locally. Never debug against a production build — you'll get zero console output.

## Architecture

```
Browser  -->  Railway (single service)  -->  tavusapi.com
              |
              |- Express (server.js)
              |  |- /health              Health check
              |  |- /api/conversations   Create Tavus session (proxies to Tavus API)
              |  |- /api/conversations/:id/end   End session
              |  |- /* (static)          Serves Vite build (dist/)
              |
              |- TAVUS_API_KEY lives here (never sent to browser)
```

Same-origin setup — no CORS needed. The Express server serves both the frontend and the API proxy.

> **WARNING — Backend proxy is mandatory.** All Tavus API calls MUST route through `server.js`. The `TAVUS_API_KEY` lives server-side only. Never import it in frontend code, never pass it in browser `fetch` headers, never expose it via `VITE_` env vars. This is a security boundary.

## Codebase Map

```
.
├── server.js                       Express server: static files + Tavus API proxy
├── index.html                      SPA entry point
├── railway.toml                    Railway build/deploy config
├── .railwayignore                  Excludes dev-only files from deploy uploads
├── package.json
│
├── src/
│   ├── main.tsx                    React entry point
│   ├── App.tsx                     Orchestrator — creates videoRef, calls hooks, composes UI
│   ├── config.ts                   Reads env vars (persona ID, replica ID, proxy URL)
│   ├── index.css                   Tailwind + custom CSS variables + animations
│   │
│   ├── hooks/
│   │   ├── useTavusAgent.ts        Core: Tavus conversation lifecycle + Daily.js WebRTC
│   │   │                           State machine: idle → connecting → connected → ended
│   │   │                           Handles: session create/end, video/audio tracks,
│   │   │                           captions, mute, restart, auto-reconnect, end_session tool
│   │   ├── useMediaDevices.ts      Mic/speaker enumeration + permission tracking
│   │   └── useMicLevel.ts          Real-time mic audio level meter
│   │
│   ├── components/
│   │   ├── AvatarStage.tsx         Video display area (loading state, video element)
│   │   ├── WelcomeBriefing.tsx     Pre-session welcome screen with "Begin" button
│   │   ├── SessionControls.tsx     Active session controls container
│   │   ├── MicrophoneButton.tsx    Mute/unmute toggle
│   │   ├── MicLevelMeter.tsx       Visual mic level indicator
│   │   ├── CaptionBar.tsx          Real-time caption display
│   │   ├── DeviceSelector.tsx      Mic/speaker picker (dialog, hidden on mobile by design)
│   │   ├── DeviceSelectRow.tsx     Single device row in selector
│   │   ├── EndScreen.tsx           Post-session "Thank you" screen
│   │   ├── StatusPill.tsx          Connection status indicator
│   │   ├── ErrorToast.tsx          Error notification
│   │   ├── ErrorBoundary.tsx       React error boundary
│   │   ├── CountdownTimer.tsx      Restart cooldown countdown
│   │   ├── SessionCredits.tsx      "Powered by" footer
│   │   ├── TopBar.tsx              Top navigation bar
│   │   ├── Footer.tsx              Bottom bar
│   │   └── ui/                     ~13 shadcn/ui primitives (don't hand-edit — use shadcn CLI)
│   │
│   ├── lib/
│   │   ├── utils.ts                cn() utility (class merging)
│   │   └── error-reporter.ts       Centralized error handling
│   │
│   └── types/
│       ├── connection.ts           Connection state types
│       └── media.d.ts              Media device type declarations
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   └── robots.txt
│
├── Tavus Avatar/                   Persona config + management scripts (see below)
│
├── vite.config.ts                  Vite build config
├── tailwind.config.ts              Tailwind theme (Outfit + Inter fonts, custom animations)
├── tsconfig.json                   TypeScript config
└── components.json                 shadcn/ui CLI config
```

---

## Tavus CVI — Critical Warnings and Learnings

These are hard-won lessons from building and debugging this integration. Read them before making changes.

### Latency — Every Token Counts

Tavus CVI runs a 7-layer pipeline: Transport → Perception → STT → Conversational Flow → LLM → TTS → Realtime Replica. Latency compounds across layers.

- **System prompt is loaded every LLM turn.** Keep it under ~1,000 characters. The current prompt is 998 chars (optimized down from 2,143). Every extra token = slower time-to-first-token on every single reply.
- **Total token budget**: ~1,870 tokens across all layers (optimized from ~3,284). Tavus documentation states: 5K tokens is optimal, 15-20K causes performance degradation, 32K is the hard maximum.
- **Use concrete speech examples** ("love that", "oh nice") instead of abstract adjectives ("warm, friendly"). Shorter, more effective.
- **Don't duplicate content across layers.** Each layer has one job (see Content Architecture below). Cross-layer duplication wastes tokens for zero benefit.

> **WARNING — `document_retrieval_strategy` BREAKS STT**: As of March 2026, adding `document_retrieval_strategy` to the conversation creation body (even with valid values like `"speed"`) **silently breaks the STT pipeline**. The session connects, the avatar speaks its greeting, but it never processes user voice input. Audio is sent (network confirms 28kbps upload) but speech-to-text never fires. This was diagnosed via binary search — stripping all optional fields and adding them back one by one. **Do not use this field until Tavus fixes it.**

### Daily.js WebRTC — Things That Will Bite You

- **`receiveSettings` in `join()` must use `"base"` key, NOT `"*"`.** The `"*"` wildcard is only valid in `updateReceiveSettings()` after joining. Using `"*"` in `join()` throws: `"receiveSettings must be of the form { [<remote participant id> | base]: ... }"`. The code uses `{ base: { video: { layer: 2 } } }` to request the highest simulcast layer for sharp avatar video.
- **Audio is NOT on the `<video>` element.** Daily.js manages audio routing internally. The remote audio track is attached to a separate `<audio>` element. If you try to get audio from the video element's `srcObject`, you'll get nothing.
- **`setSinkId` is unsupported on Firefox and iOS Safari.** The speaker selector is hidden on these browsers by design (`supportsSpeakerSelection` flag). This is expected, not a bug.
- **Noise cancellation**: Currently disabled (removed during STT debugging, was not the culprit but not re-enabled). Was `daily.updateInputSettings({ audio: { processor: { type: "noise-cancellation" } } })`. Can be re-enabled if needed — requires `@daily-co/daily-js` v0.87+.

### Session Lifecycle — How end_session Actually Works

The avatar ends sessions via a tool call (`end_session`), not a REST API call from the frontend. Here's the actual flow:

1. Avatar completes its objectives and calls the `end_session` tool
2. Tavus delivers `conversation.tool_call` events — **but it re-delivers the same tool call with every speech chunk while the avatar speaks its closing message** (a single LLM call produces ~13 events)
3. The code debounces this with `clearEndSessionTimer()` before each new timer
4. If the avatar is still speaking when `end_session` arrives, teardown is deferred (waits for `stopped_speaking`)

> **WARNING — `stopped_speaking` is unreliable after tool calls.** The `conversation.replica.stopped_speaking` event does NOT reliably fire once tool calls begin. The 5-second safety timeout (`END_SESSION_TIMEOUT_MS = 5000`) is the **actual** end mechanism, not a fallback. Do not increase this timeout expecting `stopped_speaking` to eventually fire — it won't.

### Conversation Creation — What Gets Sent to Tavus

The conversation creation body (`useTavusAgent.ts` line 391-403) sends:

```json
{
  "replica_id": "<from env>",
  "persona_id": "<from env>",
  "conversational_context": "<LLM-level directive — speak first, don't wait>",
  "custom_greeting": "<platform-level — spoken immediately, zero LLM latency>",
  "properties": {
    "participant_left_timeout": 120,
    "participant_absent_timeout": 120
  }
}
```

- **`custom_greeting`** is the primary greeting mechanism. Tavus speaks this text immediately when the user joins — no LLM round-trip. This is what makes the first response feel instant.
- **`conversational_context`** is a reinforcing LLM-level directive ("Speak first. Do not wait."). It's a backup — `custom_greeting` does the heavy lifting.
- **Do NOT add `document_retrieval_strategy`** to this body. See the STT warning above.
- **Do NOT add fields you don't understand** — optional Tavus fields can have undocumented side effects on the CVI pipeline.

### Reconnection and Restart Logic

- **Auto-reconnect**: On connection failure, the code retries up to 3 times automatically. After 3 failures, the user sees a "Refresh Page" prompt.
- **Silent retry on first connect**: If conversation creation fails on the first attempt, it retries once after 3 seconds (user doesn't see an error). Only shows an error if both attempts fail.
- **Restart flow**: `connected → restarting` (10-second cooldown with visible countdown) → `connecting → connected`. Daily call object is pre-created at the 3-second mark during the cooldown for faster reconnection.
- **Each restart burns a new Tavus session** (API credits). The 10-second cooldown prevents accidental rapid restarts.

### Tavus API Sessions Burn Credits

Every `POST /v2/conversations` call creates a session and consumes API credits. There is no "free" test mode. Minimize test runs and reuse sessions where possible.

### Microphone Handling

- Mic permission is requested **before** connecting to Tavus — if denied, the user gets a clear error and the connection never starts (no wasted credits).
- Daily.js publishes the mic track automatically when joining with audio enabled. There is no manual `publishMicrophoneStream` concept.
- WebRTC requires HTTPS (or localhost). If `navigator.mediaDevices` is undefined, the page is being served over plain HTTP.

### Browser Compatibility

| Browser | Min Version | Known Issues |
|---------|------------|--------------|
| Chrome | 90+ | None — primary development target |
| Safari | 15+ | No `setSinkId` (speaker selector hidden). WebRTC may require user gesture twice on first visit. |
| Firefox | 100+ | No `setSinkId`. Device labels may be empty until first `getUserMedia`. |
| Edge | 90+ | Same engine as Chrome — works identically |
| iOS Safari | 15+ | No `setSinkId`. `playsInline` required for video (already set). |

### Mobile Behavior (by design)

- **DeviceSelector is hidden below 768px.** This is intentional — voice-first UX means mobile users speak using system defaults. No device picker needed.
- **Touch targets are 48px minimum.** All interactive elements meet mobile tap targets.
- **Safe-area insets** are handled for notched devices (iPhone X+). The viewport has `viewport-fit=cover` and fixed elements use `env(safe-area-inset-*)`.

---

## Tavus Persona Management

The `Tavus Avatar/` folder contains everything needed to view and update the avatar's personality, conversation flow, and knowledge base.

### Current Persona: Shettyana

| Resource | ID | Config File |
|----------|----|-------------|
| Persona | `p7dd9e227dc7` | `system_prompt.txt` |
| Objectives | `o967ab63de14b` | `objectives.json` |
| Guardrails | `g8e91c995eb24` | `guardrails.json` |
| Knowledge Base | `d9-f72b97684e26` | `knowledge_base.txt` |
| Replica | `r5dc7c7d0bcb` | (managed on Tavus dashboard) |
| end_session tool | (registered on dashboard) | `end_session_tool.json` (local reference) |

### Pipeline Configuration (current)

| Setting | Value | Notes |
|---------|-------|-------|
| Pipeline mode | `full` | 7-layer CVI pipeline |
| LLM | `tavus-gpt-oss` | Tavus-hosted, lowest latency option |
| TTS | Cartesia `sonic-3` | Tavus default — no change needed |
| Turn detection | `sparrow-1` | Default model, 55ms p50 latency |
| Turn taking patience | `low` | Avatar responds quickly |
| Replica interruptibility | `medium` | User can interrupt mid-sentence |
| Perception | `off` | Not needed for voice-only onboarding |
| Speculative inference | `true` | Reduces latency |
| Noise cancellation | Disabled | Removed during STT debugging — not the culprit, just not re-enabled |

> **WARNING — Don't change pipeline settings without testing.** These were optimized for lowest latency. Changing `turn_taking_patience` to `high` or `replica_interruptibility` to `low` will make the conversation feel sluggish. Changing the LLM model affects latency, token limits, and behavior. Test thoroughly after any pipeline change.

### What Each File Controls

| File | What It Does |
|------|-------------|
| `system_prompt.txt` | Avatar personality, tone, turn format, greeting. Loaded every LLM turn — keep under ~1,000 chars. |
| `objectives.json` | 9-objective conversation flow with conditional branching. Controls what questions the avatar asks and in what order. |
| `guardrails.json` | 8 hard behavioral rules (e.g., stay on topic, don't give legal advice). |
| `knowledge_base.txt` | RAG reference data — APEX company info, tone examples. The avatar can retrieve this during conversation. |
| `end_session_tool.json` | Schema for the `end_session` tool (registered on Tavus dashboard, NOT in system prompt). |

### Content Architecture

Each layer has one job — no duplication across layers:

| Layer | Owns | Does NOT Contain |
|-------|------|-----------------|
| System prompt | Personality, tone, turn format, greeting | Behavioral rules, question content, reference data |
| Objectives | Conversation flow, branching, questions, tool sequencing | Personality, behavioral constraints |
| Guardrails | Hard behavioral boundaries | Personality, question flow |
| Knowledge Base | Reference data (company info, tone examples) | Instructions, question lists, rules |
| `conversational_context` (in code) | Per-session directive (normal vs restart) | Personality (system prompt owns that) |

> **WARNING — Do NOT mention tools in `system_prompt.txt`.** Tool schemas are auto-injected by Tavus at runtime. Putting tool instructions in the system prompt wastes tokens and can confuse the LLM. The closing objective in `objectives.json` tells the LLM when to call `end_session`.

> **WARNING — Do NOT duplicate content between layers.** If guardrails already say "don't give legal advice", don't repeat it in the system prompt. Duplication wastes tokens (which directly increases latency) and can cause conflicting instructions.

### How to Update the Persona

**Prerequisites**: Node.js 18+, `TAVUS_API_KEY` set in `Tavus Avatar/.env` (copy from `.env.example`), `gh` CLI authenticated (for KB uploads only).

```bash
cd "Tavus Avatar"
cp .env.example .env
# Edit .env with your Tavus API key

# 1. Edit the config files you want to change
#    - system_prompt.txt    → personality, tone
#    - objectives.json      → conversation flow
#    - guardrails.json      → behavioral rules

# 2. Deploy changes to Tavus
node update_persona.mjs

# 3. If knowledge base changed:
node upload_kb.mjs

# 4. Verify the update took effect
node check_persona.mjs
```

The update script POSTs new objectives/guardrails, then PATCHes the persona to attach them. Old resources are detached but remain in the account. `persona_ids.txt` is auto-updated with new IDs.

### Persona API Gotchas

> **WARNING — Field names are SINGULAR.** Guardrails use `guardrail_name` and `guardrail_prompt` — NOT `guardrails_name` / `guardrails_prompt`. Using the plural form returns `400 "Unknown field"` with no helpful error message. Same applies to objectives: `objective_name`, `objective_prompt`.

- **PATCH format**: RFC 6902 JSON Patch with `Content-Type: application/json-patch+json`. Example: `[{ "op": "replace", "path": "/system_prompt", "value": "..." }]`
- **304 on PATCH**: Means "no actual change" — the value already matches what's on the server. This is success, not an error. Response body is empty.
- **Intermittent 401s**: Tavus has occasional server-side 401 blips. Retry usually works. Not an API key problem (if the key worked a minute ago, it's still valid).
- **`objectives_id: null` after deploy**: Means objectives were never successfully attached. Always run `node check_persona.mjs` after deploy and verify `objectives_id` and `guardrails_id` are not null.
- **KB upload requires a URL**: The Tavus documents API accepts `document_url`, not inline content. `upload_kb.mjs` works around this by creating a temporary GitHub Gist, POSTing the raw URL to Tavus, then deleting the gist. This requires `gh` CLI to be authenticated (`gh auth status`).
- **KB processing delay**: After upload, document status goes `started → ready` (takes a few minutes). The avatar may not reflect KB changes immediately.

### Where to Change the Greeting

The avatar's first-contact greeting has three layers:

| Layer | Where | What It Does |
|-------|-------|-------------|
| `custom_greeting` | `useTavusAgent.ts` line 379 | **Primary.** Tavus speaks this text immediately when user joins — zero LLM latency. This is what the user hears first. |
| `conversational_context` | `useTavusAgent.ts` line 374-376 | **Reinforcement.** LLM-level directive telling the avatar to speak first and not wait. Backup in case `custom_greeting` doesn't fire. |
| System prompt greeting | `system_prompt.txt` (first instruction) | **Fallback.** Tells the LLM to greet on arrival. Least reliable for timing. |

To change what the avatar says when a user joins: edit `custom_greeting` in `useTavusAgent.ts` line 379. Rebuild and redeploy the app.

---

## Debugging Checklist

If something isn't working, check in this order:

1. **Console logs** — Open browser DevTools. Look for `[Tavus]` prefixed logs. The connection should progress: `Creating conversation...` → `Conversation created` → `Joining Daily room...` → `Joined Daily room` → `Remote video track attached` → `Remote audio track attached`.
2. **Env vars** — In dev, type `import.meta.env` in browser console. Verify persona and replica IDs are set. API key should NOT appear (it's server-side only).
3. **Network tab** — Look for failed requests to `/api/conversations`. A 401 means bad API key (or IP allowlist issue on Railway). A 429 means quota exceeded.
4. **Mic permission** — Chrome DevTools → Application → Permissions. Must be "allowed". If "blocked", user must reset in browser settings.
5. **Video element** — In Elements tab, find `<video>`. Check `srcObject` is non-null. If null, the `track-started` event didn't fire (Daily.js connection issue).

> **WARNING — Production build has no console output.** If you're debugging and seeing zero logs, you're running the production build. Use `npm run build:dev` instead.

## Tavus API Documentation

- **API Reference**: https://docs.tavus.io/api-reference
- **Personas**: https://docs.tavus.io/api-reference/personas
- **Conversations**: https://docs.tavus.io/api-reference/conversations
- **CVI Pipeline**: https://docs.tavus.io/sections/conversational-video-interface
- **Dashboard**: https://platform.tavus.io

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **WebRTC**: `@daily-co/daily-js` (Tavus uses Daily as managed provider)
- **Server**: Express 4 (combined frontend + API proxy)
- **Avatar**: Tavus CVI (7-layer pipeline: Transport, Perception, STT, Conversational Flow, LLM, TTS, Realtime Replica)
- **LLM**: `tavus-gpt-oss` (Tavus-hosted)
- **TTS**: Cartesia `sonic-3`
- **Deploy**: Railway (single service)

## Browser Support

Chrome 90+, Safari 15+, Firefox 100+, Edge 90+
