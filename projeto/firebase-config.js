import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlLP8kRaLVsnqQ-BHnFa6_neoEklqWT9c",
  authDomain: "feira-da-quebrada.firebaseapp.com",
  databaseURL: "https://feira-da-quebrada-default-rtdb.firebaseio.com",
  projectId: "feira-da-quebrada",
  storageBucket: "feira-da-quebrada.firebasestorage.app",
  messagingSenderId: "109312191536",
  appId: "1:109312191536:web:a4d382be3c353d2199d1f5",
  measurementId: "G-7V93SNZJ2D"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);