import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

// Update existing users with new permissions
export const updateUsersPermissions = async (): Promise<void> => {
  try {
    console.log('🔄 Updating users permissions...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let updatedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const permissions = userData.permissions || [];
      
      // Check if user needs fees permissions update
      const feesPermission = permissions.find((p: any) => p.moduleId === 'fees');
      
      if (!feesPermission || feesPermission.access === 'none') {
        // Update fees permission to 'read'
        const updatedPermissions = permissions.map((p: any) => 
          p.moduleId === 'fees' ? { ...p, access: 'read' } : p
        );
        
        // If no fees permission exists, add it
        if (!feesPermission) {
          updatedPermissions.push({ moduleId: 'fees', access: 'read' });
        }
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          permissions: updatedPermissions
        });
        
        updatedCount++;
        console.log(`✅ Updated permissions for user: ${userData.email}`);
      }
    }
    
    console.log(`🎉 Updated permissions for ${updatedCount} users`);
    
  } catch (error) {
    console.error('❌ Error updating users permissions:', error);
  }
};

// Run if this file is executed directly
if (typeof window === 'undefined') {
  updateUsersPermissions();
}

export default updateUsersPermissions;
