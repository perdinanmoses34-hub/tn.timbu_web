import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";

const app = express();
const PORT = 3000;
const DATABASE_PATH = path.join(process.cwd(), "src", "db", "church_cms_database.json");

// Initialize Firebase Firestore on the server
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let firestoreDb: any = null;

if (fs.existsSync(CONFIG_PATH)) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    firebaseApp = initializeApp(config);
    // Use custom databaseId from config if provided, fallback to default database
    const dbId = config.firestoreDatabaseId;
    firestoreDb = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    console.log("Firebase initialized successfully on Express server with DB ID:", dbId || "(default)");
  } catch (e) {
    console.error("Failed to initialize Firebase on Express server:", e);
  }
}

app.use(express.json({ limit: "50mb" }));

// Memory cache for serverless function warm containers
let inMemoryDbCache: any = null;

// Helper to save a single key-value database table to Firestore
async function saveTableToFirestore(key: string, data: any): Promise<void> {
  if (!firestoreDb) return;
  try {
    const docRef = doc(firestoreDb, "church_db", key);
    await setDoc(docRef, { data: data });
  } catch (e) {
    console.error(`Failed to save table "${key}" to Firestore:`, e);
  }
}

// Helper to save entire database to Firestore
async function saveDatabaseToFirestore(data: any): Promise<void> {
  if (!firestoreDb || !data) return;
  const keys = Object.keys(data);
  for (const key of keys) {
    if (data[key] !== undefined) {
      await saveTableToFirestore(key, data[key]);
    }
  }
  console.log("All database tables saved to Firestore successfully.");
}

// Helper to save to Vercel KV
async function saveDatabaseToKV(data: any) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return;

  const response = await fetch(kvUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${kvToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", "church_db", JSON.stringify(data)]),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KV SET failed: ${response.status} - ${errorText}`);
  }
}

// Helper to load database (handles Firestore, Vercel KV, and local file fallback)
async function getDatabase(): Promise<any> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // 1. Try Firestore database first (centralized cloud persistence)
  if (firestoreDb) {
    try {
      const dbRef = collection(firestoreDb, "church_db");
      const snapshot = await getDocs(dbRef);
      if (!snapshot.empty) {
        const dbData: Record<string, any> = {};
        snapshot.forEach((doc) => {
          dbData[doc.id] = doc.data().data;
        });

        // Verify that we retrieved a valid database (at least has settings populated)
        if (dbData.settings) {
          inMemoryDbCache = dbData;
          return dbData;
        }
      }
    } catch (e) {
      console.error("Failed to fetch from Firestore on Express, falling back to other storage:", e);
    }
  }

  // 2. Try Vercel KV
  if (kvUrl && kvToken) {
    try {
      // Query Vercel KV using REST API
      const response = await fetch(kvUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["GET", "church_db"]),
      });
      if (response.ok) {
        const json: any = await response.json();
        if (json && json.result) {
          const parsed = JSON.parse(json.result);
          inMemoryDbCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to fetch from Vercel KV, falling back to local file:", e);
    }
  }

  // Fallback 1: Warm in-memory cache
  if (inMemoryDbCache) {
    return inMemoryDbCache;
  }

  // Fallback 2: Local file storage
  if (fs.existsSync(DATABASE_PATH)) {
    try {
      const content = fs.readFileSync(DATABASE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      inMemoryDbCache = parsed;
      
      // Auto-seed Firestore if it was empty
      if (firestoreDb && parsed) {
        saveDatabaseToFirestore(parsed).catch(err => console.error("Auto-seeding Firestore failed:", err));
      }
      
      // Seed Vercel KV if it was empty
      if (kvUrl && kvToken) {
        await saveDatabaseToKV(parsed).catch(err => console.error("Auto-seeding Vercel KV failed:", err));
      }
      return parsed;
    } catch (e) {
      console.error("Error reading database file:", e);
    }
  }
  return null;
}

// Helper to save database (handles Firestore, Vercel KV and local file fallback)
async function saveDatabase(data: any): Promise<void> {
  inMemoryDbCache = data;

  // 1. Centralized Cloud Persistence: Save to Firestore
  if (firestoreDb) {
    await saveDatabaseToFirestore(data).catch(err => console.error("Firestore save database failed:", err));
  }

  // 2. Secondary: Save to Vercel KV
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      await saveDatabaseToKV(data);
      console.log("Database saved to Vercel KV successfully.");
    } catch (e) {
      console.error("Failed to save to Vercel KV:", e);
    }
  }

  // Always attempt to save to the local file system (so local dev works and github bundle is updated if writable)
  try {
    const dir = path.dirname(DATABASE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(data, null, 2), "utf-8");
    console.log("Database saved to local file successfully.");
  } catch (e) {
    console.warn("Could not write to local file system (expected on read-only environments like Vercel):", e);
  }
}

// API Routes
// Get current server-side database (no-cache)
app.get("/api/db", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    const dbData = await getDatabase();
    res.json({ success: true, data: dbData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save or merge server-side database
app.post("/api/db", async (req, res) => {
  try {
    await saveDatabase(req.body);
    res.json({ success: true, message: "Database saved successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Custom CSV parser to safely handle quoted commas
function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = "";

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(entry.trim());
      entry = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(entry.trim());
      result.push(row);
      row = [];
      entry = "";
    } else {
      entry += char;
    }
  }
  if (entry || row.length > 0) {
    row.push(entry.trim());
    result.push(row);
  }
  return result;
}

// Endpoint to synchronize from a public Google Sheet
app.post("/api/db/sync-sheet", async (req, res) => {
  const { sheetUrl, tables } = req.body;
  if (!sheetUrl) {
    return res.status(400).json({ success: false, error: "URL Google Sheet harus diisi" });
  }

  // Extract Google Sheet ID from URL
  // Format: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUU3PTTx9HSFDtEjb98Q/edit...
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    return res.status(400).json({ success: false, error: "URL Google Sheet tidak valid" });
  }
  const sheetId = match[1];

  try {
    const currentDb = (await getDatabase()) || {};
    const syncResults: Record<string, any> = {};
    const logs: string[] = [];

    // Table names we support syncing
    const targetTables = tables || [
      "settings",
      "users",
      "announcements",
      "devotions",
      "events",
      "prayer_requests",
      "gallery",
    ];

    await Promise.all(
      targetTables.map(async (table) => {
        // Fetch public CSV for the sheet tab matching the table name
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${table}`;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          const response = await fetch(csvUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            logs.push(`Tab "${table}" tidak ditemukan atau tidak dapat diakses.`);
            return;
          }

          const csvText = await response.text();
          // Check if returned text looks like HTML (meaning sheet is private or login is requested)
          if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.includes("Sign in")) {
            throw new Error("Google Sheet harus dibagikan sebagai 'Siapa saja yang memiliki link dapat melihat' (Anyone with the link can view)");
          }

          const parsedRows = parseCSV(csvText);
          if (parsedRows.length === 0) {
            logs.push(`Tab "${table}" tidak mengembalikan data apa pun.`);
            return;
          }

          const headers = parsedRows[0].map(h => h.replace(/^"|"$/g, "").trim());
          
          // Define required identifying columns for each table to detect typos or default Sheet1 fallbacks
          const requiredColumns: Record<string, string[]> = {
            settings: ["churchName"],
            users: ["email", "role"],
            announcements: ["category"],
            devotions: ["scripture"],
            events: ["dateTime"],
            prayer_requests: ["isPrivate"],
            gallery: ["imageUrl"]
          };

          const required = requiredColumns[table] || [];
          const missing = required.filter(col => !headers.includes(col));

          if (missing.length > 0) {
            // Check if the returned headers match the generic default Sheet1 ("id", "title", "content")
            const isDefaultSheetFallback = headers.includes("id") && headers.includes("title") && headers.includes("content") && !headers.includes("churchName") && !headers.includes("role") && !headers.includes("dateTime");
            if (isDefaultSheetFallback) {
              logs.push(`❌ Gagal: Tab bernama "${table}" tidak ditemukan di Google Sheet Anda. Google Sheet Anda mengembalikan tab default 'Sheet1'. Silakan buat tab baru bernama persis "${table}" (huruf kecil semua).`);
            } else {
              logs.push(`❌ Gagal: Tab "${table}" ditemukan, tetapi tidak memiliki kolom wajib: "${missing.join(", ")}". Kolom saat ini: [${headers.join(", ")}].`);
            }
            return;
          }

          if (parsedRows.length <= 1) {
            logs.push(`Tab "${table}" kosong (hanya berisi baris header).`);
            return;
          }

          const dataRows = parsedRows.slice(1);

          const records = dataRows.map((row, rowIndex) => {
            const record: Record<string, any> = {};
            headers.forEach((header, colIndex) => {
              if (!header) return;
              let value: any = row[colIndex] !== undefined ? row[colIndex].replace(/^"|"$/g, "").trim() : "";
              
              // Try to parse JSON or boolean or numbers
              if (value.toLowerCase() === "true") {
                value = true;
              } else if (value.toLowerCase() === "false") {
                value = false;
              } else if (!isNaN(Number(value)) && value !== "") {
                value = Number(value);
              } else if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  // Keep as string if parsing fails
                }
              }
              record[header] = value;
            });
            
            // Ensure it has an ID if missing
            if (!record.id) {
              record.id = `${table.slice(0, 3)}_${Date.now()}_${rowIndex}`;
            }
            return record;
          });

          if (table === "settings") {
            // Settings is a single object, not an array
            if (records.length > 0) {
              currentDb.settings = { ...currentDb.settings, ...records[0] };
              syncResults[table] = currentDb.settings;
              logs.push(`Berhasil sinkronisasi ${table} (1 konfigurasi).`);
            }
          } else {
            currentDb[table] = records;
            syncResults[table] = records;
            logs.push(`Berhasil sinkronisasi ${table} (${records.length} baris).`);
          }
        } catch (error: any) {
          logs.push(`Gagal memproses tab "${table}": ${error.message}`);
        }
      })
    );

    // Save synchronized database to file
    await saveDatabase(currentDb);

    res.json({
      success: true,
      data: currentDb,
      logs,
      message: "Sinkronisasi Google Sheet selesai",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server CMS Church Management running on http://localhost:${PORT}`);
  });
}

startServer();
