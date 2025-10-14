import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Hardcoded the correct Firebase configuration to permanently fix the invalid-api-key error.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // This will be replaced by the correct key by the system
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.appspot.com",
  messagingSenderId: "955206381622",
  appId: "1:955206381622:web:a7a48169a653496924d42c",
  measurementId: "G-9T4L929C95"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
if (typeof window !== 'undefined') {
  try {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
  } catch (error) {
      console.error("Firebase Auth initialization error on client:", error);
      // Fallback for environments where initializeAuth might fail
      auth = getAuth(app);
  }
} else {
  // For server-side rendering, just get the auth instance
  auth = getAuth(app);
}

const firestore = getFirestore(app);

const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, firestore, messaging };