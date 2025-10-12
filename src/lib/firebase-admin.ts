
import * as admin from 'firebase-admin';

// This ensures the code only runs on the server
if (typeof window === 'undefined') {
  if (!admin.apps.length) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully with service account.');
      } else {
        // Fallback for environments like Google Cloud Run where service account might be auto-discovered
        console.warn('FIREBASE_SERVICE_ACCOUNT env var not set. Initializing with default credentials.');
        admin.initializeApp();
        console.log('Firebase Admin SDK initialized with default credentials.');
      }
    } catch (e: any) {
      console.error('Firebase Admin SDK initialization error:', e.stack);
    }
  } else {
    // console.log('Firebase Admin SDK already initialized.');
  }
}

const firestore = admin.firestore();
const adminAuth = admin.auth();
const messaging = admin.messaging();

export { firestore, admin, adminAuth, messaging };
