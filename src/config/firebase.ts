import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBb-oIVs2dkyqgYPHYZX5Es_rdTpFjXiNU",
  authDomain: "mindspace-9606c.firebaseapp.com",
  projectId: "mindspace-9606c",
  storageBucket: "mindspace-9606c.firebasestorage.app",
  messagingSenderId: "941149139546",
  appId: "1:941149139546:web:f92de969d944fc298d5e63",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;