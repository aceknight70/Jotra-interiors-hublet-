import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { uploadOrConvertToBase64 } from '../utils/upload';
import { GalleryPhoto } from '../types';
import { Camera, Plus, Trash2, Edit2, X, Image as ImageIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('showroom');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Edit state
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let unsubscribe: () => void;
    try {
      unsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto));
        data.sort((a, b) => b.uploadDate - a.uploadDate);
        setPhotos(data);
        setLoading(false);
        // Also sync to local storage for fallback
        localStorage.setItem('jt_galleryFallback', JSON.stringify(data));
      }, (err) => {
        console.error('Firebase snapshot error:', err);
        handleFirestoreError(err, OperationType.GET, 'gallery');
        loadFallback();
      });
    } catch (err) {
      console.error('Failed to connect to Firebase:', err);
      loadFallback();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadFallback = () => {
    try {
      const stored = localStorage.getItem('jt_galleryFallback');
      if (stored) {
        setPhotos(JSON.parse(stored));
      }
    } catch(e) {}
    setUsingFallback(true);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const staffUser = JSON.parse(localStorage.getItem('jt_staffUser') || '{"name":"Unknown"}');
      const photoId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      
      const imageUrl = await uploadOrConvertToBase64(uploadFile, `gallery/${photoId}_${uploadFile.name}`);
      
      const newPhoto: GalleryPhoto = {
        id: photoId,
        name: uploadName || 'Untitled',
        category: uploadCategory,
        imageUrl,
        uploadDate: Date.now(),
        uploadedBy: staffUser.name,
        status: 'active'
      };

      try {
        await setDoc(doc(db, 'gallery', photoId), newPhoto);
      } catch (dbErr) {
        console.error('Firebase save failed, falling back to local storage', dbErr);
        // Fallback
        const newPhotos = [newPhoto, ...photos];
        setPhotos(newPhotos);
        localStorage.setItem('jt_galleryFallback', JSON.stringify(newPhotos));
      }

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview('');
      setUploadName('');
    } catch (err) {
      console.error('Upload error', err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'gallery', editingPhoto.id), {
        name: editingPhoto.name,
        category: editingPhoto.category,
        status: editingPhoto.status
      });
      setEditingPhoto(null);
    } catch (err) {
      console.error('Edit error, updating locally', err);
      // Fallback
      const newPhotos = photos.map(p => p.id === editingPhoto.id ? editingPhoto : p);
      setPhotos(newPhotos);
      localStorage.setItem('jt_galleryFallback', JSON.stringify(newPhotos));
      setEditingPhoto(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      if (photo.imageUrl.startsWith('https://firebasestorage')) {
        try {
          await deleteObject(ref(storage, photo.imageUrl));
        } catch (e) {
          console.warn('Could not delete from storage:', e);
        }
      }
      await deleteDoc(doc(db, 'gallery', photo.id));
    } catch (err) {
      console.error('Delete error, deleting locally', err);
      const newPhotos = photos.filter(p => p.id !== photo.id);
      setPhotos(newPhotos);
      localStorage.setItem('jt_galleryFallback', JSON.stringify(newPhotos));
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-amber-500 font-bold">Loading Gallery...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Camera className="w-8 h-8 text-amber-500" /> Photo Gallery
          </h2>
          <p className="text-neutral-400 text-sm mt-1">Manage and view visual assets, synced across all devices.</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-6 py-2.5 rounded-full text-sm font-black transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Upload Photo
        </button>
      </div>

      {usingFallback && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between">
          <span>⚠️ Firebase connection failed. You are in offline mode. Changes are saved to your browser and won't be visible on other devices.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map(photo => (
          <div key={photo.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg group">
            <div className="aspect-[4/3] bg-neutral-800 relative overflow-hidden">
              <img src={photo.imageUrl} alt={photo.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="flex gap-2">
                  <button onClick={() => setEditingPhoto(photo)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur transition-colors">
                    <Edit2 className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => handleDelete(photo)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full backdrop-blur transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white truncate pr-2">{photo.name}</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-full border border-neutral-700">
                  {photo.category}
                </span>
              </div>
              <div className="text-xs text-neutral-500 flex justify-between">
                <span>By {photo.uploadedBy}</span>
                <span>{new Date(photo.uploadDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl">
            <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 font-bold">No photos yet.</p>
            <p className="text-neutral-500 text-sm mt-1">Upload an image to start building your gallery.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Upload Photo</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && <div className="text-red-500 text-xs font-bold text-center bg-red-500/10 p-2 rounded-lg">{uploadError}</div>}
              
              <div className="border-2 border-dashed border-neutral-700 rounded-2xl p-4 text-center cursor-pointer hover:border-amber-500/50 transition-colors relative group overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  required 
                />
                {uploadPreview ? (
                  <img src={uploadPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <div className="py-8">
                    <Camera className="w-10 h-10 text-neutral-500 mx-auto mb-2 group-hover:text-amber-500 transition-colors" />
                    <p className="text-sm font-bold text-neutral-300">Tap to select photo</p>
                    <p className="text-xs text-neutral-500 mt-1">JPG, PNG, WebP</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Photo Name</label>
                <input 
                  type="text" 
                  value={uploadName} 
                  onChange={e => setUploadName(e.target.value)} 
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white" 
                  placeholder="e.g. Modern Sofa Front View"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Category</label>
                <select 
                  value={uploadCategory} 
                  onChange={e => setUploadCategory(e.target.value)} 
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white appearance-none"
                >
                  <option value="showroom">Showroom</option>
                  <option value="product">Product Shot</option>
                  <option value="inspiration">Inspiration</option>
                  <option value="installation">Installation</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading || !uploadFile}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-neutral-950 py-3 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <><span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></span> Uploading...</>
                  ) : (
                    'Upload Photo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Edit Photo</h3>
              <button onClick={() => setEditingPhoto(null)} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            
            <div className="mb-6 aspect-video bg-neutral-800 rounded-xl overflow-hidden">
              <img src={editingPhoto.imageUrl} className="w-full h-full object-cover" alt="Preview" />
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Photo Name</label>
                <input 
                  type="text" 
                  value={editingPhoto.name} 
                  onChange={e => setEditingPhoto({...editingPhoto, name: e.target.value})} 
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1">Category</label>
                <select 
                  value={editingPhoto.category} 
                  onChange={e => setEditingPhoto({...editingPhoto, category: e.target.value})} 
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white appearance-none"
                >
                  <option value="showroom">Showroom</option>
                  <option value="product">Product Shot</option>
                  <option value="inspiration">Inspiration</option>
                  <option value="installation">Installation</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingPhoto(null)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 py-3 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
