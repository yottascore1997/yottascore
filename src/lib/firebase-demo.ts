import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Demo Firebase configuration - Replace with your actual project
const firebaseConfig = {
  apiKey: "AIzaSyDir-vmz1zsEgE6Xo9PXudEM957QZnxDb0",
  authDomain: "yottascore-demo.firebaseapp.com",
  projectId: "yottascore-demo",
  storageBucket: "yottascore-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
