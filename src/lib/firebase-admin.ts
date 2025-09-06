
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

export { auth, firestore };
