import { storage, collections } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface DocumentData {
  id?: string;
  caseId?: string;
  clientId?: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'contract' | 'evidence' | 'court' | 'correspondence' | 'other' | 'legal' | 'admin' | 'ruling';
  isOriginal?: boolean;
}

export class DocumentService {
  // رفع مستند جديد
  static async uploadDocument(
    file: File, 
    documentData: Omit<DocumentData, 'id' | 'fileUrl' | 'uploadedAt' | 'fileSize'>
  ): Promise<string> {
    try {
      console.log('📄 Starting document upload (Local Mode):', file.name);
      
      // مؤقتاً: استخدام blob URL بدلاً من Firebase Storage
      const fileUrl = URL.createObjectURL(file);
      console.log('🔗 Created blob URL:', fileUrl);
      
      // حفظ بيانات المستند في Firestore فقط (بدون الملف)
      const document: DocumentData = {
        ...documentData,
        fileUrl,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        fileName: file.name
      };
      
      const docRef = await addDoc(collection(db, collections.documents), document);
      console.log('💾 Document saved to Firestore:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  // حذف مستند
  static async deleteDocument(documentId: string, fileName: string): Promise<void> {
    try {
      console.log('🗑️ Deleting document:', documentId);
      
      // مؤقتاً: حذف من Firestore فقط (الملفات محلية)
      await deleteDoc(doc(db, collections.documents, documentId));
      console.log('✅ Document deleted from Firestore');
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      throw error;
    }
  }

  // جلب مستندات قضية
  static async getCaseDocuments(caseId: string): Promise<DocumentData[]> {
    try {
      console.log('📥 Fetching case documents:', caseId);
      
      const q = query(
        collection(db, collections.documents),
        where('caseId', '==', caseId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DocumentData));
      
      console.log('✅ Found case documents:', documents.length);
      return documents;
    } catch (error) {
      console.error('❌ Error fetching case documents:', error);
      return [];
    }
  }

  // جلب مستندات موكل
  static async getClientDocuments(clientId: string): Promise<DocumentData[]> {
    try {
      console.log('📥 Fetching client documents:', clientId);
      
      const q = query(
        collection(db, collections.documents),
        where('clientId', '==', clientId),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DocumentData));
      
      console.log('✅ Found client documents:', documents.length);
      return documents;
    } catch (error) {
      console.error('❌ Error fetching client documents:', error);
      return [];
    }
  }

  // جلب جميع المستندات
  static async getAllDocuments(): Promise<DocumentData[]> {
    try {
      console.log('📥 Fetching all documents');
      
      const q = query(
        collection(db, collections.documents),
        orderBy('uploadedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DocumentData));
      
      console.log('✅ Found all documents:', documents.length);
      return documents;
    } catch (error) {
      console.error('❌ Error fetching all documents:', error);
      return [];
    }
  }

  // تحديث بيانات مستند
  static async updateDocument(documentId: string, updates: Partial<DocumentData>): Promise<void> {
    try {
      console.log('🔄 Updating document:', documentId);
      
      const docRef = doc(db, collections.documents, documentId);
      await updateDoc(docRef, updates);
      
      console.log('✅ Document updated successfully');
    } catch (error) {
      console.error('❌ Error updating document:', error);
      throw error;
    }
  }

  // الحصول على حجم الملف بصيغة مقروءة
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // الحصول على أيقونة الملف
  static getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    return '📎';
  }
}
