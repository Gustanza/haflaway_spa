// Shared Firebase initialization for the app.
// Initialize Firebase once and export the services you need (Firestore, Auth, Analytics, etc.)
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Replace these values with your real config (same values used previously in main.js)
const firebaseConfig = {
    apiKey: "AIzaSyBTq-w6SELcpMldX2DFEjS2nXhZTBl0EFI",
    authDomain: "haflaway-f14aa.firebaseapp.com",
    projectId: "haflaway-f14aa",
    storageBucket: "haflaway-f14aa.firebasestorage.app",
    messagingSenderId: "556877909874",
    appId: "1:556877909874:web:ec67ca30c29a1f0d73d7eb",
    measurementId: "G-WSLNTZYKRP"
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Analytics may fail in some non-browser environments — guard with typeof window
let analytics = null;
try {
    if (typeof window !== 'undefined') analytics = getAnalytics(firebaseApp);
} catch (e) {
    // analytics is optional — ignore if it can't be initialized in this environment
    // console.warn('Firebase analytics not initialized:', e);
}

// Export the services your app needs
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

export { firebaseApp, analytics, db, auth, storage };
