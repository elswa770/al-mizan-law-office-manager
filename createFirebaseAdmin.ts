import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './services/firebaseConfig';

// Create admin user in Firebase Auth
const createFirebaseAdmin = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@mizan.com',
      'admin123456'
    );
    
    await updateProfile(userCredential.user, {
      displayName: 'مدير النظام'
    });
    
    console.log('✅ Firebase Admin user created successfully');
    console.log('📧 Email: admin@mizan.com');
    console.log('🔑 Password: admin123456');
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists in Firebase Auth');
    } else {
      console.error('❌ Error creating Firebase admin:', error);
    }
  }
};

createFirebaseAdmin();
