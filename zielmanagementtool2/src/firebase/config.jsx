import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyAC226yRJwYg7NFRLeGqstE9WrIRABJTTc",
    authDomain: "zielmanagementbackend.firebaseapp.com",
    databaseURL: "https://zielmanagementbackend-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "zielmanagementbackend",
    storageBucket: "zielmanagementbackend.firebasestorage.app",
    messagingSenderId: "416831424239",
    appId: "1:416831424239:web:9961c76f8c943700b43d1a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;