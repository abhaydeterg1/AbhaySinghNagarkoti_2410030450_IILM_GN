import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// ─── Config ───────────────────────────────────────────────────────────────────
const TAVUS_API_KEY   = process.env.TAVUS_API_KEY;
const TAVUS_API       = "https://tavusapi.com/v2";
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";
const PERSONA_ID      = process.env.VITE_TAVUS_PERSONA_ID || "";
const REPLICA_ID      = process.env.VITE_TAVUS_REPLICA_ID || "";

// conversation_id → { conversation_url, created_at, shutdown_reason }
const conversationCache = new Map();

if (!TAVUS_API_KEY) {
  console.error("[Server] FATAL: TAVUS_API_KEY is not set — exiting");
  process.exit(1);
}

console.log("[Server] TAVUS_API_KEY:", TAVUS_API_KEY ? "✓ set" : "✗ MISSING");
console.log("[Server] N8N_WEBHOOK_URL:", N8N_WEBHOOK_URL || "✗ NOT SET");
console.log("[Server] PERSONA_ID:", PERSONA_ID || "(not set)");
console.log("[Server] REPLICA_ID:", REPLICA_ID || "(not set)");

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    n8n_configured: !!N8N_WEBHOOK_URL,
    persona_id: PERSONA_ID,
    replica_id: REPLICA_ID,
  });
});

// ─── Tavus callback receiver ──────────────────────────────────────────────────
//
// Tavus event_type values:
//   • system.replica_joined          → ignored
//   • system.shutdown                → cache shutdown_reason for later
//   • application.transcription_ready → fire n8n (with transcript + shutdown_reason)
//   • application.recording_ready    → ignored
//   • application.perception_analysis → ignored
//
app.post("/api/callback", async (req, res) => {
  try {
    const data      = req.body;
    const eventType = data.event_type || "";
    const convId    = data.conversation_id || "unknown";
    const props     = data.properties || {};

    console.log(`[Callback] ${convId} → event_type="${eventType}"`);

    // ── system.shutdown: cache the shutdown_reason for when transcript arrives ──
    if (eventType === "system.shutdown") {
      const reason = props.shutdown_reason || null;
      console.log(`[Callback] Caching shutdown_reason="${reason}" for ${convId}`);
      const cached = conversationCache.get(convId) || {};
      cached.shutdown_reason = reason;
      conversationCache.set(convId, cached);
      return res.sendStatus(200);
    }

    // ── Only fire n8n on transcription_ready ──
    if (eventType !== "application.transcription_ready") {
      console.log(`[Callback] Ignoring "${eventType}"`);
      return res.sendStatus(200);
    }

    if (!N8N_WEBHOOK_URL) {
      console.warn("[Callback] N8N_WEBHOOK_URL not set — skipping");
      return res.sendStatus(200);
    }

    const cached    = conversationCache.get(convId) || {};
    const rawTranscript = props.transcript || [];

    // Filter out system messages — only keep assistant and user
    const transcript = rawTranscript.filter((msg) => msg.role !== "system");

    const payload = {
      action:           "get_onboarding_session",
      conversation_id:  convId,
      persona_id:       PERSONA_ID,
      replica_id:       props.replica_id || REPLICA_ID,
      conversation_url: cached.conversation_url || null,
      client_email:     cached.client_email || null,
      status:           "ended",
      shutdown_reason:  cached.shutdown_reason || null,
      created_at:       cached.created_at || null,
      ended_at:         data.timestamp || new Date().toISOString(),
      transcript:       transcript,
    };

    console.log("[n8n] Firing webhook →", N8N_WEBHOOK_URL);
    console.log("[n8n] Payload:", JSON.stringify(payload, null, 2));

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[n8n] Response status:", n8nRes.status);

    // Cleanup
    conversationCache.delete(convId);

    res.sendStatus(200);
  } catch (err) {
    console.error("[Callback] Error:", err.message);
    res.sendStatus(500);
  }
});

// ─── Create conversation ──────────────────────────────────────────────────────
app.post("/api/conversations", async (req, res) => {
  try {
    console.log("[Proxy] POST /api/conversations — creating Tavus conversation");

    const body = { ...req.body };

    // Extract custom field before forwarding to Tavus (Tavus doesn't know about it)
    const clientEmail = body.client_email || null;
    delete body.client_email;
    if (clientEmail) console.log(`[Proxy] Client email: ${clientEmail}`);

    const proto   = req.headers["x-forwarded-proto"] || "https";
    const host    = req.headers["x-forwarded-host"]  || req.headers.host || "";
    const selfUrl = host ? `${proto}://${host}` : "";

    if (selfUrl) {
      body.callback_url = `${selfUrl}/api/callback`;
      console.log("[Proxy] Injecting callback_url →", body.callback_url);
    }

    const response = await fetch(`${TAVUS_API}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TAVUS_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      console.error(`[Proxy] Tavus create failed (${response.status}):`, text);
    } else {
      console.log(`[Proxy] Conversation created — id: ${data.conversation_id}, url: ${data.conversation_url}`);
      if (data.conversation_id) {
        conversationCache.set(data.conversation_id, {
          conversation_url: data.conversation_url || null,
          created_at: new Date().toISOString(),
          client_email: clientEmail || null,
        });
      }
    }

    res.status(response.status).json(data);
  } catch (err) {
    console.error("[Proxy] Error creating conversation:", err.message);
    res.status(502).json({ error: "Failed to reach Tavus API" });
  }
});

// ─── End conversation ─────────────────────────────────────────────────────────
app.post("/api/conversations/:id/end", async (req, res) => {
  const convId = req.params.id;
  console.log(`[Proxy] POST /api/conversations/${convId}/end`);

  try {
    const response = await fetch(`${TAVUS_API}/conversations/${convId}/end`, {
      method: "POST",
      headers: { "x-api-key": TAVUS_API_KEY },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : { ok: true };
    console.log(`[Proxy] Tavus end returned ${response.status}`);

    res.status(response.status).json(data);
  } catch (err) {
    console.error("[Proxy] Error ending conversation:", err.message);
    res.status(502).json({ error: "Failed to reach Tavus API" });
  }
});

// ─── Static frontend ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
