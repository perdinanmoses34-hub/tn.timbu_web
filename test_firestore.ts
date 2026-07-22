import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function runTest() {
  const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("firebase-applet-config.json not found!");
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  console.log("Config loaded:", config.projectId);

  const app = initializeApp(config);

  // Test 1: Test with custom database ID
  const customDbId = config.firestoreDatabaseId || "ai-studio-supercoding-05cba2b8-9e7c-4257-bfb6-5f3525816084";
  console.log(`\n--- Test 1: Connecting with custom DB ID "${customDbId}" ---`);
  try {
    const db = getFirestore(app, customDbId);
    const snap = await getDocs(collection(db, "church_db"));
    console.log("Test 1 SUCCESS! Documents retrieved count:", snap.size);
  } catch (err: any) {
    console.error("Test 1 FAILED:", err.message || err);
  }

  // Test 2: Test with DEFAULT database ID (empty/default)
  console.log("\n--- Test 2: Connecting with DEFAULT DB ID ---");
  try {
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, "church_db"));
    console.log("Test 2 SUCCESS! Documents retrieved count:", snap.size);
  } catch (err: any) {
    console.error("Test 2 FAILED:", err.message || err);
  }
}

runTest();
