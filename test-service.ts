import { firebaseService } from './services/firebaseService';

// Hack auth to return fake user
import { auth } from './config/firebaseConfig';
Object.defineProperty(auth, 'currentUser', {
  get: () => ({ uid: 'X3t4512Bj2OjXNUorw4PuzhrzF72' })
});

async function test() {
  const classes = await firebaseService.getStudentClasses();
  console.log("Classes:", classes);
}
test().catch(console.error);
