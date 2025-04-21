// eslint-disable-next-line @typescript-eslint/no-require-imports
const admin = require('firebase-admin');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require('./coffe-shop-1d616-firebase-adminsdk-fbsvc-ec570121c4.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createUserDocuments() {
  const listUsersResult = await auth.listUsers();
  const users = listUsersResult.users;

  for (const user of users) {
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        email: user.email,
        name: user.displayName || 'TG',
        role: 'admin', // Set a default role, you may want to adjust this
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Created document for user ${user.uid}`);
    } else {
      console.log(`Document already exists for user ${user.uid}`);
    }
  }
}

createUserDocuments()
  .then(() => console.log('Finished creating user documents'))
  .catch((error) => console.error('Error creating user documents:', error));

