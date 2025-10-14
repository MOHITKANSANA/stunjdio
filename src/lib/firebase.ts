import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCowK1pgv_fGzCo65c-7_-9vTIkrO628yM",
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.appspot.com",
  messagingSenderId: "1064325037320",
  appId: "1:1064325037320:web:d9ce26cc409e20702700bd"
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
