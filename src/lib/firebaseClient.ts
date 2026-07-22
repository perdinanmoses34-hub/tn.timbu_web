import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestoreDb: any = null;

try {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  firestoreDb = dbId ? getFirestore(app, dbId) : getFirestore(app);
  console.log("Client-side Firebase initialized with DB ID:", dbId || "(default)");
} catch (error) {
  console.error("Failed to initialize client-side Firebase:", error);
}

export { firestoreDb };

/**
 * Saves full database backup to Firestore directly from client browser
 */
export async function saveToFirestoreClient(fullBackup: Record<string, any>): Promise<boolean> {
  if (!firestoreDb) return false;
  try {
    const keys = Object.keys(fullBackup);
    for (const key of keys) {
      if (fullBackup[key] !== undefined) {
        const docRef = doc(firestoreDb, "church_db", key);
        await setDoc(docRef, { data: fullBackup[key], updatedAt: Date.now() }, { merge: true });
      }
    }
    console.log("Successfully saved database directly to client Firestore!");
    return true;
  } catch (err) {
    console.warn("Client Firestore save failed:", err);
    return false;
  }
}

/**
 * Loads full database from Firestore directly from client browser
 */
export async function loadFromFirestoreClient(): Promise<Record<string, any> | null> {
  if (!firestoreDb) return null;
  try {
    const colRef = collection(firestoreDb, "church_db");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return null;
    }
    const dbData: Record<string, any> = {};
    snapshot.forEach((d) => {
      dbData[d.id] = d.data().data;
    });

    if (Object.keys(dbData).length > 0) {
      Object.keys(dbData).forEach((key) => {
        if (dbData[key] !== undefined) {
          localStorage.setItem(`church_cms_${key}`, JSON.stringify(dbData[key]));
        }
      });
      return dbData;
    }
  } catch (err) {
    console.warn("Client Firestore load failed:", err);
  }
  return null;
}

/**
 * Listens to real-time changes in Firestore and updates localStorage automatically
 */
export function subscribeFirestoreRealtime(onUpdate: () => void) {
  if (!firestoreDb) return () => {};
  try {
    const colRef = collection(firestoreDb, "church_db");
    let isInitial = true;
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) return;
        let hasChanges = false;
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const key = change.doc.id;
            const data = change.doc.data().data;
            if (data !== undefined) {
              const currentRaw = localStorage.getItem(`church_cms_${key}`);
              const newRaw = JSON.stringify(data);
              if (currentRaw !== newRaw) {
                localStorage.setItem(`church_cms_${key}`, newRaw);
                hasChanges = true;
              }
            }
          }
        });

        if (hasChanges || isInitial) {
          isInitial = false;
          onUpdate();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("church_db_updated"));
          }
        }
      },
      (error) => {
        console.warn("Real-time Firestore listener error:", error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("Failed to subscribe to Firestore realtime:", err);
    return () => {};
  }
}
