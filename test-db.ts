import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { db } from './config/firebaseConfig';

async function checkUsers() {
  const usersRef = ref(db, 'users');
  const snap = await get(usersRef);
  console.log("Users:", snap.val());
}

checkUsers().catch(console.error);
