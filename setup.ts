import { createAdminUser, createSampleUsers } from './services/setupUsers';

// Run setup
const setupDatabase = async () => {
  console.log('🚀 Starting database setup...');
  
  try {
    // Create admin user
    await createAdminUser();
    console.log('✅ Admin user created');
    
    // Create sample users
    await createSampleUsers();
    console.log('✅ Sample users created');
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📧 Admin credentials:');
    console.log('   Email: admin@mizan.com');
    console.log('   Password: (Set in Firebase Auth)');
    console.log('   UID: admin-user-123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

// Run if this file is executed directly
if (typeof window === 'undefined') {
  setupDatabase();
}

export default setupDatabase;
