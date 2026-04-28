import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase config thực tế của dự án pmp-exam-simulator
const firebaseConfig = {
  apiKey: "AIzaSyBHP6gKN_3rOkhXxENJKBeeq-nzsG2pZzg",
  authDomain: "pmp-exam-simulator-7d8dd.firebaseapp.com",
  projectId: "pmp-exam-simulator-7d8dd",
  storageBucket: "pmp-exam-simulator-7d8dd.firebasestorage.app",
  messagingSenderId: "433935864728",
  appId: "1:433935864728:web:fad52e591dadc118ced1ed",
  measurementId: "G-J415NNQ5WR",
  // URL của Realtime Database (miễn phí, không cần billing)
  databaseURL: "https://pmp-exam-simulator-7d8dd-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Realtime Database
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
