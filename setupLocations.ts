import { addLocation } from './services/dbService';
import { WorkLocation } from './types';

// Create default locations for the system
export const setupDefaultLocations = async (): Promise<void> => {
  const defaultLocations: Omit<WorkLocation, 'id'>[] = [
    {
      name: 'محكمة جنوب القاهرة (زينهم)',
      type: 'court',
      address: 'شارع بيرم التونسي، السيدة زينب، القاهرة',
      governorate: 'القاهرة',
      notes: 'أفضل مكان للركن في الجراج الخلفي. الازدحام شديد صباحاً.'
    },
    {
      name: 'محكمة الأسرة - زنانيري',
      type: 'court',
      address: 'ش شبرا، روض الفرج',
      governorate: 'القاهرة',
      notes: 'مبنى قديم، المصاعد معطلة غالباً.'
    },
    {
      name: 'قسم شرطة الدقي',
      type: 'police_station',
      address: 'شارع التحرير، الدقي',
      governorate: 'الجيزة',
      phone: '02 33333333'
    },
    {
      name: 'مكتب شهر عقاري النادي الأهلي',
      type: 'notary',
      address: 'داخل النادي الأهلي بالجزيرة',
      governorate: 'القاهرة',
      notes: 'يعمل فترة مسائية، ممتاز للتوكيلات السريعة.'
    },
    {
      name: 'محكمة شمال القاهرة',
      type: 'court',
      address: 'ميدان العباسية، القاهرة',
      governorate: 'القاهرة',
      notes: 'موقف سيارات واسع، يفضل الوصول مبكراً.'
    },
    {
      name: 'محكمة الجيزة الابتدائية',
      type: 'court',
      address: 'ميدان المحكمة، الجيزة',
      governorate: 'الجيزة',
      notes: 'قاعة انتظار كبيرة، نظام حجز إلكتروني.'
    },
    {
      name: 'قسم شرطة مصر الجديدة',
      type: 'police_station',
      address: 'شارع الخليفة المأمون، مصر الجديدة',
      governorate: 'القاهرة',
      phone: '02 22666666'
    },
    {
      name: 'مكتب توثيق العباسية',
      type: 'notary',
      address: 'شارع العباسية، القاهرة',
      governorate: 'القاهرة',
      notes: 'يعمل من 9 صباحاً إلى 5 مساءً، حجز مسبق مطلوب.'
    }
  ];

  try {
    console.log('🏛️ Creating default locations...');
    
    for (const location of defaultLocations) {
      await addLocation(location);
    }
    
    console.log('✅ Default locations created successfully');
    console.log(`📍 Total locations created: ${defaultLocations.length}`);
    
  } catch (error) {
    console.error('❌ Error creating default locations:', error);
  }
};

// Run if this file is executed directly
if (typeof window === 'undefined') {
  setupDefaultLocations();
}

export default setupDefaultLocations;
