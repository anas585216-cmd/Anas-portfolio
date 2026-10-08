import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBpD0DHvmDpR5tFeWWRxOefa3RxTwjfHsw",
    authDomain: "portfolio-950dc.firebaseapp.com",
    projectId: "portfolio-950dc",
    storageBucket: "portfolio-950dc.firebasestorage.app",
    messagingSenderId: "9998703566",
    appId: "1:9998703566:web:e16db550542b893b79a99f",
    measurementId: "G-MLN3M3MNE4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);