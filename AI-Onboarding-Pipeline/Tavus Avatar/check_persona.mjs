// One-shot GET to check current persona config (pipeline_mode, layers, etc.)
// Usage: node check_persona.mjs

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let key = process.env.TAVUS_API_KEY;
if (!key) {
  try {
    const env = readFileSync(resolve(__dirname, "../apex-onboarding-tavus/.env"), "utf8");
    const m = env.match(/^TAVUS_API_KEY=(.+)$/m);
    if (m) key = m[1].trim();
  } catch {}
}
if (!key) {
  console.error("No API key found");
  process.exit(1);
}

const res = await fetch("https://tavusapi.com/v2/personas/p7dd9e227dc7", {
  headers: { "x-api-key": key },
});
const p = await res.json();

if (!res.ok) {
  console.error("API error:", JSON.stringify(p));
  process.exit(1);
}

console.log("pipeline_mode:", p.pipeline_mode);
console.log("llm_model:", p.layers?.llm?.model);
console.log("speculative_inf:", p.layers?.llm?.speculative_inference);
console.log("turn_patience:", p.layers?.conversational_flow?.turn_taking_patience);
console.log("turn_detection:", p.layers?.conversational_flow?.turn_detection_model);
console.log("\nFull layers:", JSON.stringify(p.layers, null, 2));
