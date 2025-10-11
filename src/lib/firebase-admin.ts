
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
      admin.initializeApp();
      console.log('Firebase Admin Initialized with default credentials.');
    }
  } catch (e: any) {
    console.error('Firebase Admin Initialization Error:', e.stack);
  }
}

const auth = admin.auth();
const firestore = admin.firestore();

export { auth, firestore };
