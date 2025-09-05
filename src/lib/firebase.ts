// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCowK1pgv_fGzCo65c-7_-9vTIkrO628yM",
  authDomain: "go-swami-coching-classes.firebaseapp.com",
  projectId: "go-swami-coching-classes",
  storageBucket: "go-swami-coching-classes.firebasestorage.app",
  messagingSenderId: "1064325037320",
  appId: "1:1064325037320:web:d9ce26cc409e20702700bd"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
