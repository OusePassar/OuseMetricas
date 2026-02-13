
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);

