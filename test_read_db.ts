import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function runTest() {
  const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const app = initializeApp(config);
  const db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);

  try {
    const snap = await getDocs(collection(db, "church_db"));
    console.log("Documents found:", snap.size);
    snap.forEach((doc) => {
      const data = doc.data();
      const keys = data.data ? Object.keys(data.data) : "no data property";
      console.log(`Document ID: ${doc.id}`);
      if (Array.isArray(data.data)) {
        console.log(`  Type: Array with ${data.data.length} items`);
        if (data.data.length > 0) {
          console.log(`  Sample item:`, JSON.stringify(data.data[0]).slice(0, 200));
        }
      } else {
        console.log(`  Type:`, typeof data.data, `Keys:`, keys);
        console.log(`  Value:`, JSON.stringify(data.data).slice(0, 200));
      }
    });
  } catch (err: any) {
    console.error("Failed:", err);
  }
}

runTest();
