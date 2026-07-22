import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request full drive access or drive.file access.
// Since the user is connecting to a specific folder, we requested drive.file in the OAuth flow,
// but we can request both or the specific authorized scope to ensure permission is granted.
provider.addScope('https://www.googleapis.com/auth/drive.file');

const FILE_NAME = 'church_cms_database.json';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initGoogleDriveAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const savedToken = sessionStorage.getItem('gdrive_access_token');
      if (savedToken) {
        cachedAccessToken = savedToken;
        onSuccess(user, savedToken);
      } else {
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      sessionStorage.removeItem('gdrive_access_token');
      onFailure();
    }
  });
};

// Sign in to Google and get Access Token
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem('gdrive_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out
export const signOutGoogleDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem('gdrive_access_token');
};

// Search for church_cms_database.json inside user's Drive
export const findDatabaseFile = async (accessToken: string): Promise<string | null> => {
  try {
    const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401) {
      throw new Error('Token akses Google Drive telah kedaluwarsa. Silakan klik "Hubungkan Google Drive Saya" kembali.');
    }

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    return null;
  } catch (e: any) {
    console.error('findDatabaseFile error:', e);
    if (e.message?.includes('kedaluwarsa')) throw e;
    return null;
  }
};

// Download database file from Google Drive
export const downloadDatabaseFile = async (accessToken: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    throw new Error('Token akses Google Drive telah kedaluwarsa. Silakan klik "Hubungkan Google Drive Saya" kembali.');
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('Error downloading file from Drive:', errText);
    throw new Error(`Gagal mengunduh file database dari Google Drive (${res.status}): ${res.statusText}`);
  }

  return await res.json();
};

// Helper function for multipart file creation
const createMultipartFile = async (accessToken: string, dbData: any): Promise<string> => {
  const metadata = {
    name: FILE_NAME,
    mimeType: 'application/json',
  };

  const boundary = 'gdrive_sync_multipart_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(dbData) +
    close_delim;

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (res.status === 401) {
    throw new Error('Token akses Google Drive telah kedaluwarsa. Silakan klik "Hubungkan Google Drive Saya" kembali.');
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('Error creating file on Drive:', errText);
    throw new Error(`Gagal membuat file baru di Google Drive (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  return data.id;
};

// Upload or update database file on Google Drive
export const uploadDatabaseFile = async (
  accessToken: string,
  dbData: any,
  fileId?: string | null
): Promise<string> => {
  if (fileId) {
    try {
      const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbData),
      });

      if (res.status === 401) {
        throw new Error('Token akses Google Drive telah kedaluwarsa. Silakan klik "Hubungkan Google Drive Saya" kembali.');
      }

      if (res.ok) {
        return fileId;
      }

      console.warn(`PATCH update to file ${fileId} failed with status ${res.status}. Falling back to create file...`);
    } catch (e: any) {
      if (e.message?.includes('kedaluwarsa')) throw e;
      console.warn('PATCH update error, falling back to new file creation:', e);
    }
  }

  // Fallback / Create new file
  return await createMultipartFile(accessToken, dbData);
};
