import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { uploadOrConvertToBase64 } from '../utils/upload';
import { Product } from '../types';
import { Search, Upload, Plus, Package, ShoppingBag, X, Edit2, Save, Camera, ArrowLeft, Grid } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

export default function GoodsHub() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAccessories, setShowAccessories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (productId: string, file: File) => {
    setUploadingIds(prev => ({ ...prev, [productId]: true }));
    try {
      const url = await uploadOrConvertToBase64(file, `products/${productId}/${Date.now()}_${file.name}`);
      await updateDoc(doc(db, 'products', productId), { imageUrl: url, lastUpdated: serverTimestamp() });
    } catch (err) {
      console.error('Upload failed:', err);
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    } finally {
      setUploadingIds(prev => ({ ...prev, [productId]: false }));
    }
  };

  const triggerUpload = (productId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) handlePhotoUpload(productId, file);
    };
    input.click();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      let imageUrl = editingProduct.imageUrl || '';
      const file = (editingProduct as any)._newImageFile;
      
      if (file) {
        imageUrl = await uploadOrConvertToBase64(file, `products/${editingProduct.id}/${Date.now()}_${file.name}`);
      }

      const { id, createdAt, lastUpdated, _previewImage, _newImageFile, ...productData } = editingProduct as any;

      // Clean undefined fields to avoid Firestore errors
      const cleanedData: any = {};
      Object.keys(productData).forEach(key => {
        if (productData[key] !== undefined) {
          cleanedData[key] = productData[key];
        }
      });

      await updateDoc(doc(db, 'products', editingProduct.id), {
        ...cleanedData,
        imageUrl,
        lastUpdated: serverTimestamp()
      });
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to update product', err);
      handleFirestoreError(err, OperationType.UPDATE, `products/${editingProduct.id}`);
    } finally {
      setSaving(false);
    }
  };

  const seedDemoProducts = async () => {
    const demo = [
      { category: 'furniture', name: '3-Seater Sofa (Turkish)', spec: 'Fabric, Hardwood frame, 3+2+1 sets', price: '₦850,000', description: 'Premium Turkish sofa in durable fabric.', availability: 'in-stock', imageUrl: '', staffNotes: 'Available in 5 colours.', quantity: 5, isAccessory: false },
      { category: 'furniture', name: 'King Size Bed Set', spec: 'Upholstered headboard, Turkish fabric', price: '₦750,000', description: 'Luxury king bed with padded headboard.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 2, isAccessory: false },
      { category: 'doors', name: 'Steel Security Door (Single)', spec: 'Double lock, Steel frame', price: '₦185,000', description: 'Heavy gauge steel security door.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 10, isAccessory: false },
      { category: 'gates', name: 'Sliding Gate (Motorized)', spec: 'Galvanized steel, Motor included', price: '₦650,000', description: 'Automated sliding gate with remote control.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 3, isAccessory: false },
      { category: 'ceilings', name: 'PVC Ceiling Panels (Plain)', spec: 'Per sqm, White, Easy install', price: '₦3,500', description: 'Clean white PVC ceiling panels.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 100, isAccessory: false },
      { category: 'lighting', name: 'Crystal Chandelier (Small)', spec: 'K9 crystal, 60cm, Chrome', price: '₦185,000', description: 'Classic K9 crystal chandelier.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 8, isAccessory: false },
      { category: 'vases', name: 'Ceramic Flower Vase (Large)', spec: 'Handcrafted, 45cm, Gold trim', price: '₦45,000', description: 'Beautiful ceramic vase for flowers.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 5, isAccessory: false },
      { category: 'sculptures', name: 'African Sculpture (Wood)', spec: 'Hand-carved, 60cm, Ebony finish', price: '₦65,000', description: 'Traditional African wood sculpture.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 2, isAccessory: true },
      { category: 'solar', name: 'Solar Inverter (5kVA)', spec: 'Pure sine wave, 48V, LCD display', price: '₦1,200,000', description: 'High-efficiency solar inverter.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 4, isAccessory: false },
      { category: 'solar', name: 'Solar Panel (550W Mono)', spec: 'PERC, 144 cells, 25-year warranty', price: '₦185,000', description: 'High-efficiency monocrystalline panel.', availability: 'in-stock', imageUrl: '', staffNotes: '', quantity: 20, isAccessory: false },
    ];

    try {
      setImporting(true);
      const batch = writeBatch(db);
      demo.forEach(p => {
        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, { ...p, createdAt: serverTimestamp(), lastUpdated: serverTimestamp() });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to add demo products', err);
      handleFirestoreError(err, OperationType.WRITE, 'products');
    } finally {
      setImporting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesAccessory = !showAccessories || p.isAccessory === true;
    return matchesSearch && matchesCategory && matchesAccessory;
  });

  const categories = [
    { id: 'furniture', name: 'Furniture', icon: '🛋️', count: products.filter(p => p.category === 'furniture').length },
    { id: 'doors', name: 'Security Doors', icon: '🚪', count: products.filter(p => p.category === 'doors').length },
    { id: 'gates', name: 'Gates', icon: '🔒', count: products.filter(p => p.category === 'gates').length },
    { id: 'ceilings', name: 'Ceilings', icon: '⬜', count: products.filter(p => p.category === 'ceilings').length },
    { id: 'lighting', name: 'Lighting', icon: '🏮', count: products.filter(p => p.category === 'lighting').length },
    { id: 'vases', name: 'Flower Vases', icon: '🌸', count: products.filter(p => p.category === 'vases').length },
    { id: 'walldecor', name: 'Wall Décor & Art', icon: '🪞', count: products.filter(p => p.category === 'walldecor').length },
    { id: 'frames', name: 'Picture Frames', icon: '🖼️', count: products.filter(p => p.category === 'frames').length },
    { id: 'solar', name: 'Solar Solutions', icon: '☀️', count: products.filter(p => p.category === 'solar').length },
    { id: 'sculptures', name: 'Sculptures & Art Objects', icon: '🏺', count: products.filter(p => p.category === 'sculptures').length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl font-black text-amber-500 tracking-tight">Goods Hub</h2>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-500">Loading products...</div>
      ) : categoryFilter === 'all' && !search ? (
        /* CATEGORY TILES VIEW */
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Grid className="w-5 h-5 text-neutral-400" />
            <h3 className="text-lg font-bold text-neutral-200">Categories</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800 rounded-2xl p-6 text-left transition-all group shadow-sm hover:shadow-amber-500/5"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
                <h4 className="text-lg font-bold text-white mb-1">{cat.name}</h4>
                <p className="text-xs text-neutral-500 font-bold">{cat.count} Items</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* PRODUCT CARDS VIEW */
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
            <button 
              onClick={() => { setCategoryFilter('all'); setSearch(''); }}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Categories
            </button>
            
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 transition-all text-neutral-100"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-neutral-100 min-w-[150px]"
            >
              <option value="all">All Categories</option>
              <option value="doors">🚪 Security Doors</option>
              <option value="gates">🔒 Gates</option>
              <option value="ceilings">⬜ Ceilings</option>
              <option value="furniture">🛋️ Furniture</option>
              <option value="lighting">🏮 Lighting</option>
              <option value="vases">🌸 Flower Vases</option>
              <option value="walldecor">🪞 Wall Décor & Art</option>
              <option value="frames">🖼️ Picture Frames</option>
              <option value="solar">☀️ Solar Solutions</option>
              <option value="sculptures">🏺 Sculptures & Art Objects</option>
            </select>
            
            <label className="flex items-center gap-2 text-neutral-300 text-sm font-bold cursor-pointer bg-neutral-800 border border-neutral-700 px-4 py-2.5 rounded-xl hover:bg-neutral-700 transition-colors">
              <input 
                type="checkbox" 
                checked={showAccessories}
                onChange={e => setShowAccessories(e.target.checked)}
                className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-amber-500/20"
              />
              Show Accessories Only
            </label>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-neutral-800/50 border border-neutral-800 rounded-3xl p-16 text-center">
              <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-neutral-300">No products found</h3>
              <p className="text-neutral-500 mt-2 max-w-md mx-auto">
                No products match your search in this category.
              </p>
              {products.length === 0 && categoryFilter === 'all' && !search && (
                <button
                  onClick={seedDemoProducts}
                  disabled={importing}
                  className="mt-6 bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-black px-6 py-3 rounded-xl transition-transform hover:scale-105 inline-block"
                >
                  {importing ? 'Seeding...' : 'Seed Demo Products'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-200 flex flex-col relative group">
                  {/* Image Area */}
                  <div className="relative aspect-square bg-neutral-100 border-b border-neutral-100">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className={`w-full h-full object-cover transition-opacity ${uploadingIds[p.id] ? 'opacity-30' : ''}`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50">
                        <Package className="w-10 h-10 mb-2 opacity-30" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Image</span>
                      </div>
                    )}

                    {uploadingIds[p.id] && (
                      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="tracking-wide">Uploading...</span>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <button 
                      onClick={() => triggerUpload(p.id)}
                      disabled={!!uploadingIds[p.id]}
                      className="absolute bottom-4 right-4 bg-amber-400 hover:bg-amber-500 text-neutral-950 p-2.5 rounded-full shadow-lg border-2 border-white transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload Photo"
                    >
                      {uploadingIds[p.id] ? (
                        <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>

                    {/* Stock Badge */}
                    {p.availability === 'out-of-stock' && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        OUT OF STOCK
                      </div>
                    )}
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4 md:p-5 flex flex-col flex-1 bg-white">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-neutral-900 leading-tight mb-1">{p.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{p.category}</p>
                          {p.isAccessory && <span className="bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">Accessory</span>}
                        </div>
                      </div>
                      <div className="font-black text-neutral-900 whitespace-nowrap">{p.price}</div>
                    </div>
                    
                    <div className="border-t border-neutral-100 py-3">
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        <span className="font-bold text-neutral-900">Spec:</span> {p.spec || 'None'}
                      </p>
                    </div>
                    
                    <div className="border-t border-neutral-100 py-3 flex-1">
                      <p className="text-xs text-neutral-600">
                        <span className="font-bold text-neutral-900 block mb-0.5">Staff Notes:</span> 
                        {p.staffNotes || 'No notes available.'}
                      </p>
                    </div>

                    <div className="border-t border-neutral-100 pt-4 mt-auto flex gap-2">
                      <button className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold py-2 rounded-lg text-xs transition-colors">
                        + Quote
                      </button>
                      <button 
                        onClick={() => setViewingProduct(p)}
                        className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold py-2 rounded-lg text-xs transition-colors">
                        View Details
                      </button>
                      <button 
                        onClick={() => setEditingProduct(p)}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-center"
                        title="Edit"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative my-8 shadow-2xl">
            <button 
              onClick={() => setEditingProduct(null)} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors bg-neutral-100 hover:bg-neutral-200 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-amber-500" /> Edit Product
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Product Name</label>
                  <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Category</label>
                    <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all appearance-none">
                      <option value="furniture">Furniture</option>
                      <option value="doors">Security Doors</option>
                      <option value="gates">Gates</option>
                      <option value="ceilings">Ceilings</option>
                      <option value="lighting">Lighting</option>
                      <option value="vases">Flower Vases</option>
                      <option value="walldecor">Wall Décor & Art</option>
                      <option value="frames">Picture Frames</option>
                      <option value="solar">Solar Solutions</option>
                      <option value="sculptures">Sculptures & Art Objects</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Price</label>
                    <input type="text" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Specifications</label>
                  <input type="text" value={editingProduct.spec || ''} onChange={e => setEditingProduct({...editingProduct, spec: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Description</label>
                  <textarea rows={3} value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all resize-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Staff Note</label>
                  <input type="text" value={editingProduct.staffNotes || ''} onChange={e => setEditingProduct({...editingProduct, staffNotes: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all" />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
                    <input type="checkbox" checked={editingProduct.isAccessory || false} onChange={e => setEditingProduct({...editingProduct, isAccessory: e.target.checked})} className="w-4 h-4 rounded bg-white border-neutral-300 text-amber-500 focus:ring-amber-500/20" />
                    This is an Accessory (handles, cushions, motors, etc.)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Availability</label>
                    <select value={editingProduct.availability} onChange={e => setEditingProduct({...editingProduct, availability: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all appearance-none">
                      <option value="in-stock">✅ In Stock</option>
                      <option value="out-of-stock">❌ Out of Stock</option>
                      <option value="pre-order">🔄 Pre-Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Quantity</label>
                    <input type="number" value={editingProduct.quantity || 0} onChange={e => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value) || 0})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-neutral-900 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Product Photo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {(editingProduct as any)._previewImage || editingProduct.imageUrl ? (
                        <img src={(editingProduct as any)._previewImage || editingProduct.imageUrl} alt={editingProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-neutral-300" />
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const previewUrl = URL.createObjectURL(file);
                            setEditingProduct({ ...editingProduct, _previewImage: previewUrl, _newImageFile: file } as any);
                          }
                        };
                        input.click();
                      }}
                      className="bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-900 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" /> Upload
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-[2] bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 py-3 rounded-xl text-sm font-black hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:scale-100"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  disabled={saving}
                  className="flex-1 bg-neutral-100 border border-neutral-200 text-neutral-900 py-3 rounded-xl text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full relative my-8">
            <button 
              onClick={() => setViewingProduct(null)} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex flex-col gap-4 mt-2">
              <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden relative">
                {viewingProduct.imageUrl ? (
                  <img src={viewingProduct.imageUrl} alt={viewingProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-50">
                    <Package className="w-12 h-12 mb-2 opacity-30" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40">No Image</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 m-0">{viewingProduct.name}</h2>
                  <span className="text-sm font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">{viewingProduct.category}</span>
                </div>
                <span className="text-3xl font-black text-neutral-900">{viewingProduct.price}</span>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div className="font-bold text-sm text-neutral-900 mb-1">Specifications</div>
                <div className="text-sm text-neutral-600">{viewingProduct.spec || 'No specifications provided.'}</div>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div className="font-bold text-sm text-neutral-900 mb-1">Description</div>
                <div className="text-sm text-neutral-600">{viewingProduct.description || 'No description available.'}</div>
              </div>
              
              {viewingProduct.staffNotes && (
                <div className="bg-amber-50 p-4 rounded-xl border-l-4 border-amber-500 text-sm">
                  <span className="font-bold text-amber-900">Staff Note:</span> <span className="text-amber-800">{viewingProduct.staffNotes}</span>
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <button 
                  className="flex-1 bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-black py-3 rounded-xl transition-transform hover:scale-[1.02]"
                >
                  + Add to Quote
                </button>
                <button 
                  onClick={() => setViewingProduct(null)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-900 font-bold py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
