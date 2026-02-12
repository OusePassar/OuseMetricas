
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBYeQj4FEpWt79BfBJ2ZTXa0lEbMkEsnDk",
  authDomain: "ousewebinar.firebaseapp.com",
  projectId: "ousewebinar",
  storageBucket: "ousewebinar.firebasestorage.app",
  messagingSenderId: "921349588311",
  appId: "1:921349588311:web:02b7d1edde972b8b30aa12",
  measurementId: "G-Q8V06FVNGJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

