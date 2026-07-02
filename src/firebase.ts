import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0703315353",
  appId: "1:438536021319:web:573620bb830e9c4fa21862",
  apiKey: "AIzaSyCWnEF76_Uy5fxX5YBlQdn8dE4I55K0SUA",
  authDomain: "gen-lang-client-0703315353.firebaseapp.com",
  storageBucket: "gen-lang-client-0703315353.firebasestorage.app",
  messagingSenderId: "438536021319"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-orbrepairmainten-bdc774d2-22f7-4ad3-a52a-a131525fd040");
export const storage = getStorage(app);
