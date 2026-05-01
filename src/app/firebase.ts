import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBy5e8qYbLR7V_6Rl5Ogvja6Tyls7UmBcg',
  authDomain: 'childrens-ministry-3376b.firebaseapp.com',
  projectId: 'childrens-ministry-3376b',
  storageBucket: 'childrens-ministry-3376b.firebasestorage.app',
  messagingSenderId: '35951994087',
  appId: '1:35951994087:web:6f94ca461427bb95ef2e42',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
