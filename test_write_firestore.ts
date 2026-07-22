import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function runTest() {
  const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const app = initializeApp(config);
  const db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);

  const testDocRef = doc(db, "church_db", "test_write");
  console.log("Attempting to write to church_db/test_write...");

  try {
    const timestamp = new Date().toISOString();
    await setDoc(testDocRef, { data: { message: "Hello from test script", time: timestamp } });
    console.log("Write SUCCESSFUL!");

    console.log("Reading it back...");
    const snap = await getDoc(testDocRef);
    if (snap.exists()) {
      console.log("Read SUCCESSFUL! Data:", JSON.stringify(snap.data()));
    } else {
      console.log("Read FAILED: Document does not exist!");
    }
  } catch (err: any) {
    console.error("Operation FAILED with error:", err.message || err);
  }
}

runTest();
