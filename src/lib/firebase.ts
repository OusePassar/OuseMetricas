
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8NUFQTfLsttpPL3E_bZeEltNQ57c1mYw",
  authDomain: "ousemetricas.firebaseapp.com",
  projectId: "ousemetricas",
  storageBucket: "ousemetricas.firebasestorage.app",
  messagingSenderId: "474661151839",
  appId: "1:474661151839:web:24bbc000acec5f2181e7ea",
  measurementId: "G-XQKEQ3M2K7"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

