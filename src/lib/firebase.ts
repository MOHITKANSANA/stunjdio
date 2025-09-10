
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCowK1pgv_fGzCo65c-7_-9vTIkrO628yM",
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.firebasestorage.app",
  messagingSenderId: "1064325037320",
  appId: "1:1064325037320:web:d9ce26cc409e20702700bd"
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

const firestore = getFirestore(app);

export { app, auth, firestore };
