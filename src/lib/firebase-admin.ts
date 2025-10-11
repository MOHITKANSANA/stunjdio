
import * as admin from 'firebase-admin';

// Check if the service account key is available
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!admin.apps.length) {
  try {
    if (serviceAccountKey) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      });
      console.log('Firebase Admin Initialized successfully.');
    } else {
      // This is a fallback for environments where the service account might
      // be auto-discovered (like Google Cloud Functions or Cloud Run).
      // This is less reliable if env vars aren't set correctly.
      console.warn('FIREBASE_SERVICE_ACCOUNT env var not set. Initializing with default credentials.');
      admin.initializeApp();
    }
  } catch (e: any) {
    console.error('Firebase Admin Initialization Error:', e.stack);
  }
} else {
    console.log('Firebase Admin already initialized.');
}

const auth = admin.auth();
const firestore = admin.firestore();

export { auth, firestore, admin };
