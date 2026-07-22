import fs from "fs";
import path from "path";

async function runTest() {
  const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("firebase-applet-config.json not found!");
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const projectId = config.projectId;
  console.log("ProjectId:", projectId);

  // Test 1: Named database ID
  const customDbId = config.firestoreDatabaseId || "ai-studio-supercoding-05cba2b8-9e7c-4257-bfb6-5f3525816084";
  const url1 = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${customDbId}/documents/church_db`;
  console.log(`\n--- Test 1 REST API: named DB (${customDbId}) ---`);
  try {
    const res = await fetch(url1);
    console.log("Status:", res.status, res.statusText);
    const data = await res.json();
    console.log("Response sample:", JSON.stringify(data).slice(0, 500));
  } catch (err: any) {
    console.error("Test 1 REST FAILED:", err.message || err);
  }

  // Test 2: (default) database ID
  const url2 = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/church_db`;
  console.log(`\n--- Test 2 REST API: (default) DB ---`);
  try {
    const res = await fetch(url2);
    console.log("Status:", res.status, res.statusText);
    const data = await res.json();
    console.log("Response sample:", JSON.stringify(data).slice(0, 500));
  } catch (err: any) {
    console.error("Test 2 REST FAILED:", err.message || err);
  }
}

runTest();
