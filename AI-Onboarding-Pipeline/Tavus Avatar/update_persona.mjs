// Updates the existing APEX Onboarding persona on Tavus via REST API.
// Creates new objectives + guardrails, then patches the persona to use them.
//
// Usage: node update_persona.mjs
// Requires TAVUS_API_KEY in environment or ../apex-onboarding-tavus/.env

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Configuration ---
const PERSONA_ID = "p7dd9e227dc7";
const TAVUS_API = "https://tavusapi.com/v2";

// --- Load API key ---
let API_KEY = process.env.TAVUS_API_KEY;
if (!API_KEY) {
  try {
    const envFile = readFileSync(resolve(__dirname, "../apex-onboarding-tavus/.env"), "utf8");
    const match = envFile.match(/^TAVUS_API_KEY=(.+)$/m);
    if (match) API_KEY = match[1].trim();
  } catch {}
}
if (!API_KEY || API_KEY === "REPLACE_ME") {
  console.error("ERROR: TAVUS_API_KEY not found.");
  process.exit(1);
}

// --- Load config files ---
const systemPrompt = readFileSync(resolve(__dirname, "system_prompt.txt"), "utf8").trim();
const objectives = JSON.parse(readFileSync(resolve(__dirname, "objectives.json"), "utf8"));
const guardrails = JSON.parse(readFileSync(resolve(__dirname, "guardrails.json"), "utf8"));

// --- API helper ---
async function tavus(method, path, body) {
  const contentType = method === "PATCH" ? "application/json-patch+json" : "application/json";
  const opts = {
    method,
    headers: { "Content-Type": contentType, "x-api-key": API_KEY },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${TAVUS_API}${path}`, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (res.status === 304) {
    // Tavus returns 304 when PATCH results in no actual change — not an error
    console.log(`  (304 — no change needed)`);
    return {};
  }
  if (!res.ok) {
    console.error(`ERROR: ${method} ${path} -> ${res.status}`);
    console.error(text);
    process.exit(1);
  }
  return data;
}

console.log("=== Updating APEX Onboarding Persona ===");
console.log(`  Persona: ${PERSONA_ID}\n`);

// Step 1: Create objectives
console.log("[1/4] Creating objectives...");
const objRes = await tavus("POST", "/objectives", objectives);
const objectivesId = objRes.objectives_id || objRes.id;
console.log(`  Created: ${objectivesId}`);

// Step 2: Create guardrails
console.log("[2/4] Creating guardrails...");
const guardRes = await tavus("POST", "/guardrails", guardrails);
const guardrailsId = guardRes.guardrails_id || guardRes.id;
console.log(`  Created: ${guardrailsId}`);

// Step 3: Patch persona
console.log(`[3/4] Patching persona ${PERSONA_ID}...`);
const patchOps = [
  { op: "replace", path: "/system_prompt", value: systemPrompt },
  { op: "replace", path: "/persona_name", value: "Shettyana - APEX Onboarding" },
  { op: "add", path: "/objectives_id", value: objectivesId },
  { op: "add", path: "/guardrails_id", value: guardrailsId },
  // Latency: fast LLM model (tavus-gpt-oss is Tavus's lowest-latency hosted model)
  { op: "add", path: "/layers/llm/model", value: "tavus-gpt-oss" },
  // Latency: avatar responds sooner after user pauses
  { op: "add", path: "/layers/conversational_flow/turn_taking_patience", value: "low" },
  // Latency: recommended turn detection model
  { op: "add", path: "/layers/conversational_flow/turn_detection_model", value: "sparrow-1" },
];
await tavus("PATCH", `/personas/${PERSONA_ID}`, patchOps);
console.log("  Persona updated");

// Step 4: Verify
console.log("[4/4] Verifying...");
const persona = await tavus("GET", `/personas/${PERSONA_ID}`);
console.log(`  persona_name:    ${persona.persona_name}`);
console.log(`  pipeline_mode:   ${persona.pipeline_mode}`);
console.log(`  llm_model:       ${persona.layers?.llm?.model}`);
console.log(`  speculative_inf: ${persona.layers?.llm?.speculative_inference}`);
console.log(`  turn_patience:   ${persona.layers?.conversational_flow?.turn_taking_patience}`);
console.log(`  turn_detection:  ${persona.layers?.conversational_flow?.turn_detection_model}`);
console.log(`  objectives_id:   ${persona.objectives_id}`);
console.log(`  guardrails_id:   ${persona.guardrails_id}`);
console.log(`  system_prompt:   ${persona.system_prompt?.length} chars`);
console.log(`  document_ids:    ${JSON.stringify(persona.document_ids)}`);

// Save IDs
const ids = `# Tavus Persona IDs — updated ${new Date().toISOString()}
PERSONA_ID=${PERSONA_ID}
OBJECTIVES_ID=${objectivesId}
GUARDRAILS_ID=${guardrailsId}
`;
writeFileSync(resolve(__dirname, "persona_ids.txt"), ids);
console.log("\nIDs saved to persona_ids.txt");

console.log("\n=== Done! Persona updated in-place. ===");
console.log("\nRemaining manual step:");
console.log("  Re-upload knowledge_base.txt via Tavus dashboard:");
console.log("  https://platform.tavus.io/ > Persona > Knowledge Base");
