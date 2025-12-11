import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBI9ti-dMxNz88A2YQbaSFiQsmSKKZvV5A",
  authDomain: "locatrack-2b3dc.firebaseapp.com",
  projectId: "locatrack-2b3dc",
  storageBucket: "locatrack-2b3dc.firebasestorage.app",
  messagingSenderId: "854392213532",
  appId: "1:854392213532:web:5c8e203e0bcc44ce4ecfd9",
  measurementId: "G-JKW8EC7TNZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
