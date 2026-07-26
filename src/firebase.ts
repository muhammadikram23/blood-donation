import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// NOTE: This project used to import a local `firebase-applet-config.json` file
// as a fallback here. That file is intentionally gitignored (it holds your
// real Firebase config), which means it never exists on Vercel — so a static
// `import` of it broke every Vercel build at the "transforming..." step with
// "Failed to resolve import ... Does the file exist?". Config now comes
// purely from environment variables (VITE_FIREBASE_*), which you set once
// in your local .env file and once in Vercel Project Settings > Environment
// Variables — no local-only file required.
const requireEnv = (key: string, value: string | undefined): string => {
  if (!value || value.trim() === '' || value.toLowerCase().includes('your_')) {
    throw new Error(
      `Missing Firebase config: ${key} is not set. Add it to your .env file locally, ` +
      `or to your Vercel Project Settings > Environment Variables when deployed.`
    );
  }
  return value;
};

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: requireEnv('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Optional: only needed if you use a named Firestore database instead of "(default)"
const rawDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
export const db = (rawDatabaseId && rawDatabaseId !== '' && rawDatabaseId !== '(default)')
  ? getFirestore(app, rawDatabaseId)
  : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test helper as specified in firebase-integration skill
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or misconfigured:', error.message);
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Operation Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
