
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.appspot.com",
  messagingSenderId: "108678589635",
  appId: "1:108678589635:web:28c310c23942008630c723",
  measurementId: "G-R559PCH6XG"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth;
if (typeof window !== 'undefined') {
  try {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence
      });
  } catch (error) {
      console.error("Firebase Auth initialization error on client", error);
      auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

const firestore = getFirestore(app);

const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, firestore, messaging };
