// Uploads knowledge_base.txt to Tavus via a GitHub Gist raw URL.
// Deletes old doc, creates new doc, attaches to persona.
// Reads current KB doc ID from persona_ids.txt so it's always in sync.
//
// Prerequisites: gh CLI authenticated (for gist create/delete)
//
// Usage: node upload_kb.mjs

import { readFileSync, writeFileSync, execSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PERSONA_ID = "p7dd9e227dc7";
const TAVUS_API = "https://tavusapi.com/v2";

// Read current KB doc ID from persona_ids.txt (stays in sync with deploys)
let OLD_DOC_ID = "";
try {
  const idsFile = readFileSync(resolve(__dirname, "persona_ids.txt"), "utf8");
  const match = idsFile.match(/^KB_DOCUMENT_ID=(.+)$/m);
  if (match) OLD_DOC_ID = match[1].trim();
} catch {}
if (!OLD_DOC_ID) {
  console.error("ERROR: KB_DOCUMENT_ID not found in persona_ids.txt. Run update_persona.mjs first or add it manually.");
  process.exit(1);
}

// Load API key
let API_KEY = process.env.TAVUS_API_KEY;
if (!API_KEY) {
  try {
    const envFile = readFileSync(resolve(__dirname, "../apex-onboarding-tavus/.env"), "utf8");
    const match = envFile.match(/^TAVUS_API_KEY=(.+)$/m);
    if (match) API_KEY = match[1].trim();
  } catch {}
}
if (!API_KEY) {
  console.error("ERROR: TAVUS_API_KEY not found.");
  process.exit(1);
}

async function tavus(method, path, body) {
  const contentType = method === "PATCH" ? "application/json-patch+json" : "application/json";
  const opts = {
    method,
    headers: { "Content-Type": contentType, "x-api-key": API_KEY },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${TAVUS_API}${path}`, opts);
  const text = await res.text();
  return { status: res.status, ok: res.ok, data: text ? JSON.parse(text) : {} };
}

console.log("=== Uploading Knowledge Base ===\n");

// Step 0: Create GitHub Gist from local knowledge_base.txt
console.log("[0/4] Creating GitHub Gist...");
const kbPath = resolve(__dirname, "knowledge_base.txt");
let gistUrl;
try {
  const output = execSync(`gh gist create "${kbPath}" --public -d "APEX KB temp upload"`, { encoding: "utf8" });
  gistUrl = output.trim().split("\n").pop().trim();
  console.log(`  Gist: ${gistUrl}`);
} catch (e) {
  console.error("ERROR: Failed to create GitHub Gist. Is gh CLI authenticated?");
  console.error(e.message);
  process.exit(1);
}

// Extract raw URL from gist URL
const gistId = gistUrl.split("/").pop();
const GIST_RAW_URL = `https://gist.githubusercontent.com/AymanGarz/${gistId}/raw/knowledge_base.txt`;

// Step 1: Delete old document
console.log(`[1/4] Deleting old KB document (${OLD_DOC_ID})...`);
const delRes = await tavus("DELETE", `/documents/${OLD_DOC_ID}`);
console.log(`  Status: ${delRes.status}`);

// Step 2: Create new document from gist URL
console.log("[2/4] Creating new KB document...");
const createRes = await tavus("POST", "/documents", {
  document_url: GIST_RAW_URL,
  document_name: "APEX Onboarding Knowledge Base",
});
console.log(`  Status: ${createRes.status}`);
console.log(`  Response: ${JSON.stringify(createRes.data, null, 2)}`);

if (!createRes.ok) {
  console.error("ERROR: Failed to create document");
  process.exit(1);
}

const newDocId = createRes.data.document_id || createRes.data.id;
console.log(`  New document ID: ${newDocId}`);

// Step 3: Attach to persona
console.log("[3/4] Attaching to persona...");
const patchRes = await tavus("PATCH", `/personas/${PERSONA_ID}`, [
  { op: "replace", path: "/document_ids", value: [newDocId] },
]);
console.log(`  Patch status: ${patchRes.status}`);

// Step 4: Cleanup gist + update persona_ids.txt
console.log("[4/4] Cleaning up...");
try {
  execSync(`gh gist delete ${gistId} --yes`, { encoding: "utf8" });
  console.log("  Gist deleted");
} catch {
  console.warn(`  Warning: Could not delete gist ${gistId} — delete manually`);
}

// Update KB_DOCUMENT_ID in persona_ids.txt so next run deletes the right doc
const idsPath = resolve(__dirname, "persona_ids.txt");
let idsContent = readFileSync(idsPath, "utf8");
idsContent = idsContent.replace(/^KB_DOCUMENT_ID=.+$/m, `KB_DOCUMENT_ID=${newDocId}`);
writeFileSync(idsPath, idsContent);
console.log(`  persona_ids.txt updated with KB_DOCUMENT_ID=${newDocId}`);

// Verify
const verifyRes = await tavus("GET", `/personas/${PERSONA_ID}`);
console.log(`  Verified document_ids: ${JSON.stringify(verifyRes.data.document_ids)}`);

console.log(`\n=== Done! KB document: ${newDocId} ===`);
