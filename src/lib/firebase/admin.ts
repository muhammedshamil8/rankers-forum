import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Validate environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin SDK credentials. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment variables.'
    );
  }

  // Handle the private key - it may contain escaped newlines
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    return adminApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Lazy getters for auth and db
export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(getFirebaseAdminApp());
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    adminDbInstance = getFirestore(getFirebaseAdminApp());
  }
  return adminDbInstance;
}

// Backward compatibility exports (eager initialization)
export const adminAuth = {
  get createUser() { return getAdminAuth().createUser.bind(getAdminAuth()); },
  get getUser() { return getAdminAuth().getUser.bind(getAdminAuth()); },
  get deleteUser() { return getAdminAuth().deleteUser.bind(getAdminAuth()); },
  get createCustomToken() { return getAdminAuth().createCustomToken.bind(getAdminAuth()); },
  get verifyIdToken() { return getAdminAuth().verifyIdToken.bind(getAdminAuth()); },
  get verifySessionCookie() { return getAdminAuth().verifySessionCookie.bind(getAdminAuth()); },
  get createSessionCookie() { return getAdminAuth().createSessionCookie.bind(getAdminAuth()); },
  get revokeRefreshTokens() { return getAdminAuth().revokeRefreshTokens.bind(getAdminAuth()); },
};

export const adminDb = {
  get collection() { return getAdminDb().collection.bind(getAdminDb()); },
  get batch() { return getAdminDb().batch.bind(getAdminDb()); },
  get runTransaction() { return getAdminDb().runTransaction.bind(getAdminDb()); },
};
