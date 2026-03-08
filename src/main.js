import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
// Import the functions you need from the SDKs you need
// Use shared firebase initialization
import { firebaseApp, analytics } from './firebase'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBTq-w6SELcpMldX2DFEjS2nXhZTBl0EFI",
    authDomain: "haflaway-f14aa.firebaseapp.com",
    projectId: "haflaway-f14aa",
    storageBucket: "haflaway-f14aa.firebasestorage.app",
    messagingSenderId: "556877909874",
    appId: "1:556877909874:web:ec67ca30c29a1f0d73d7eb",
    measurementId: "G-WSLNTZYKRP"
};

createApp(App).use(router).mount('#app')
