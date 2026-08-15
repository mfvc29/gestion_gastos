import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gestion-gastos-8f1b2",
  appId: "1:988746748496:web:a22d80aaac1b5db4197755",
  storageBucket: "gestion-gastos-8f1b2.firebasestorage.app",
  apiKey: "AIzaSyDNUScLf14Id3_uTzi45y2xjBxHWMH_vrI",
  authDomain: "gestion-gastos-8f1b2.firebaseapp.com",
  messagingSenderId: "988746748496",
  measurementId: "G-HH13YM2CX5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
