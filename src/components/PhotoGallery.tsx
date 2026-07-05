import React, { useState, useEffect } from 'react';
import { uploadToSupabase, uploadOrConvertToBase64 } from '../utils/upload';
import { GalleryPhoto } from '../types';
import { Camera, Plus, Trash2, Edit2, X, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { subscribeToGallery, saveGalleryPhoto, deleteGalleryPhoto, supabase } from '../supabase';

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    const unsubscribe = subscribeToGallery((data) => {
      setPhotos(data);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
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
      
      const imageUrl = await uploadToSupabase(uploadFile);
      
      const newPhoto: GalleryPhoto = {
        id: photoId,
        name: uploadName || 'Untitled',
        category: uploadCategory,
        imageUrl,
        uploadDate: Date.now(),
        uploadedBy: staffUser.name,
        status: 'active'
      };

      await saveGalleryPhoto(newPhoto);
      
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview('');
      setUploadName('');
    } catch (err: any) {
      console.error('Upload error', err?.message || JSON.stringify(err));
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    setIsSaving(true);
    try {
      await saveGalleryPhoto(editingPhoto);
      setEditingPhoto(null);
    } catch (err: any) {
      console.error('Edit error', err);
      alert('Failed to save changes: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!window.confirm('Delete this photo permanently?')) return;
    
    try {
      await deleteGalleryPhoto(photo.id);
    } catch (err: any) {
      console.error('Delete error', err);
      alert('Failed to delete photo: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-amber-500 font-bold">Loading Gallery...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Photo Gallery</h2>
          <p className="text-neutral-400 text-sm mt-1">Manage product shots and inspiration images</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Photo
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map(photo => (
          <div key={photo.id} className="group bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-neutral-700 transition-all shadow-xl">
            <div className="aspect-[4/3] relative overflow-hidden bg-neutral-800">
              <img 
                src={photo.imageUrl} 
                alt={photo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingPhoto(photo)}
                  className="bg-black/60 hover:bg-amber-500 backdrop-blur-md text-white hover:text-neutral-950 p-2 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(photo)}
                  className="bg-black/60 hover:bg-red-500 backdrop-blur-md text-white p-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-bold truncate pr-4">{photo.name}</h3>
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

      {/* Fixed Back Button for Modals */}
      {(showUploadModal || editingPhoto) && (
        <button
          onClick={() => {
            setShowUploadModal(false);
            setEditingPhoto(null);
          }}
          className="fixed top-4 left-4 z-[2000] bg-neutral-900/80 hover:bg-neutral-900 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl backdrop-blur-sm flex items-center gap-2 border border-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

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
