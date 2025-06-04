// Importar Firebase desde módulos ES
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDUvf7O1N7yI8yX1msBQCf77zpcHwBKJtg",
    authDomain: "app-retas.firebaseapp.com",
    projectId: "app-retas",
    storageBucket: "app-retas.firebasestorage.app",
    messagingSenderId: "1092137002413",
    appId: "1:1092137002413:web:0d6426219aaa3401372d24",
    measurementId: "G-2L6ZY4XJQJ",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };