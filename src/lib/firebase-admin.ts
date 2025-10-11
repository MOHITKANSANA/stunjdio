
import * as admin from 'firebase-admin';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
const adminAppAlreadyInitialized = admin.apps.length > 0;

if (!adminAppAlreadyInitialized) {
  if (serviceAccountKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (e: any) {
      console.error('Firebase Admin SDK initialization error:', e);
      // Fallback for environments like Google Cloud Run
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized with default credentials.');
    }
  } else {
    // Fallback for environments where service account might be auto-discovered
    console.warn('FIREBASE_SERVICE_ACCOUNT env var not set. Initializing with default credentials.');
    admin.initializeApp();
  }
} else {
    console.log('Firebase Admin SDK already initialized.');
}

const firestore = admin.firestore();

export { firestore, admin };
