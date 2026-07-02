import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Product } from '../types';
import { ShieldAlert, Plus, Trash2, Package, CheckCircle2, AlertCircle, Camera, Edit2, X, Save, Database } from 'lucide-react';
import { uploadOrConvertToBase64 } from '../utils/upload';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

export default function StaffDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({ 
    name: '', category: 'furniture', price: '', spec: '', availability: 'in-stock', quantity: 0, staffNotes: '', isAccessory: false 
  });
  const [bulkForm, setBulkForm] = useState({
    baseName: '', count: 10, category: 'furniture', price: '', quantity: 0, availability: 'in-stock', isAccessory: false
  });
  const [csvData, setCsvData] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('jt_csv_data');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prodData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prodData);
    }, (error) => {
      console.error('Error fetching products:', error);
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setSaving(true);

    try {
      let imageUrl = '';
      const file = (form as any)._newImageFile;
      
      const newRef = doc(collection(db, 'products'));

      if (file) {
        imageUrl = await uploadOrConvertToBase64(file, `products/${newRef.id}/${Date.now()}_${file.name}`);
      }

      const { _previewImage, _newImageFile, ...productData } = form as any;

      await setDoc(newRef, {
        ...productData,
        imageUrl,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      setShowForm(false);
      setForm({ name: '', category: 'furniture', price: '', spec: '', availability: 'in-stock', quantity: 0, staffNotes: '', isAccessory: false });
    } catch (err) {
      console.error('Error adding product', err);
      handleFirestoreError(err, OperationType.CREATE, 'products');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.baseName) {
      alert('Please enter a base name (e.g. "Dining Chair")');
      return;
    }
    if (bulkForm.count < 1) {
      alert('Please enter a valid number (minimum 1)');
      return;
    }
    
    if (bulkForm.count > 50) {
      if (!window.confirm(`You are about to create ${bulkForm.count} products. Are you sure?`)) return;
    }

    try {
      const promises = [];
      for (let i = 1; i <= bulkForm.count; i++) {
        const newRef = doc(collection(db, 'products'));
        promises.push(setDoc(newRef, {
          name: `${bulkForm.baseName} ${i}`,
          category: bulkForm.category,
          price: bulkForm.price || '₦0',
          quantity: bulkForm.quantity,
          availability: bulkForm.availability,
          isAccessory: bulkForm.isAccessory,
          spec: '',
          staffNotes: '',
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }));
      }
      await Promise.all(promises);
      setShowForm(false);
      setBulkForm({ baseName: '', count: 10, category: 'furniture', price: '', quantity: 0, availability: 'in-stock', isAccessory: false });
      alert(`✅ Created ${bulkForm.count} products: ${bulkForm.baseName} 1 to ${bulkForm.baseName} ${bulkForm.count}`);
    } catch (err) {
      console.error('Error adding products', err);
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.error('Error deleting product', err);
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
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

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length <= 1) return alert('CSV must have headers and data.');

    const headers = lines[0].split(',').map(h => h.trim());
    const importedRows: any[] = [];
    
    try {
      const batch = writeBatch(db);
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
        if (!obj.name) continue;
        
        importedRows.push(obj);
        
        const docRef = obj.id ? doc(db, 'products', obj.id) : doc(collection(db, 'products'));
        batch.set(docRef, {
          name: obj.name || 'Unnamed',
          category: obj.category || 'furniture',
          spec: obj.spec || '',
          price: obj.price || '₦0',
          description: obj.description || '',
          availability: obj.availability || 'in-stock',
          imageUrl: obj.imageUrl || '',
          quantity: parseInt(obj.quantity) || 0,
          warehouse: obj.warehouse || 'Main Warehouse',
          staffNotes: obj.staffNotes || '',
          roomScene: obj.roomScene || '',
          isAccessory: obj.isAccessory === 'true' || false,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }
      await batch.commit();
      
      localStorage.setItem('jt_csv_data', JSON.stringify(importedRows));
      setCsvData(importedRows);
      alert(`Imported ${importedRows.length} products.`);
    } catch (error) {
      console.error('Import error:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
    
    if (e.target) e.target.value = '';
  };

  const exportCSV = () => {
    if (products.length === 0) return alert('No products to export');
    
    const headers = ['id', 'name', 'category', 'price', 'quantity', 'availability', 'spec', 'description', 'staffNotes', 'warehouse', 'roomScene', 'isAccessory'];
    
    const rows = products.map(p => {
      return headers.map(h => {
        let val = (p as any)[h] || '';
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jotra_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearCSVData = () => {
    if (window.confirm('Clear the CSV sheet data?')) {
      localStorage.removeItem('jt_csv_data');
      setCsvData([]);
    }
  };

  const totalProducts = products.length;
  const inStock = products.filter(p => p.availability === 'in-stock').length;
  const outOfStock = totalProducts - inStock;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-neutral-100" />
          <h2 className="text-2xl font-black text-neutral-100 tracking-tight">Staff Room <span className="text-neutral-500 font-normal text-lg">| Control Centre</span></h2>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-neutral-100 text-neutral-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500"><Package className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-black text-white">{totalProducts}</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total Products</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-black text-white">{inStock}</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">In Stock</div>
          </div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-red-500/10 p-3 rounded-xl text-red-500"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-black text-white">{outOfStock}</div>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Out of Stock</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="space-y-6 mb-6">
          {/* CSV Section */}
          <div className="bg-neutral-900 border border-neutral-800 border-l-4 border-l-amber-500 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-amber-500 mb-2 flex items-center gap-2"><Database className="w-5 h-5" /> CSV Manager & Sheet Card</h4>
            <div className="flex gap-3 flex-wrap items-center mb-4">
              <label className="bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl px-6 py-2.5 font-bold cursor-pointer hover:bg-neutral-700 transition-colors">
                📤 Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
              </label>
              <button onClick={exportCSV} className="bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold px-6 py-2.5 rounded-xl hover:from-amber-400 hover:to-amber-500 transition-colors">
                📥 Export CSV
              </button>
              <button onClick={clearCSVData} className="bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl px-6 py-2.5 font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Clear Sheet
              </button>
            </div>
            
            {/* Sheet Card - Table View */}
            <div className="bg-neutral-950 rounded-xl p-3 max-h-[400px] overflow-auto border border-neutral-800">
              {csvData.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-amber-500/5">
                      {Object.keys(csvData[0]).map(key => (
                        <th key={key} className="p-2 font-bold text-amber-500 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="p-2 text-neutral-300 truncate max-w-[150px]">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-neutral-500 text-center p-8 text-sm">No CSV data loaded. Import a CSV file to see the sheet card.</p>
              )}
            </div>
          </div>

          {/* BULK ADD SECTION */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 border-l-4 border-l-amber-500">
            <h3 className="text-lg font-bold text-amber-500 mb-1 flex items-center gap-2"><Package className="w-5 h-5" /> Bulk Create Products</h3>
            <p className="text-neutral-400 text-sm mb-4">Create multiple products at once — perfect for adding many items in one go.</p>
            <form onSubmit={handleBulkAdd} className="flex gap-3 flex-wrap items-end">
              <div className="flex-[2] min-w-[140px]">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Base Name</label>
                <input required placeholder="e.g. Dining Chair" type="text" value={bulkForm.baseName} onChange={e => setBulkForm({...bulkForm, baseName: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div className="w-[80px]">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Count</label>
                <input required type="number" min="1" value={bulkForm.count} onChange={e => setBulkForm({...bulkForm, count: parseInt(e.target.value) || 1})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white text-center" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Category</label>
                <select value={bulkForm.category} onChange={e => setBulkForm({...bulkForm, category: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white">
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
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Price</label>
                <input type="text" placeholder="e.g. ₦120,000" value={bulkForm.price} onChange={e => setBulkForm({...bulkForm, price: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div className="w-[80px]">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Qty</label>
                <input type="number" value={bulkForm.quantity} onChange={e => setBulkForm({...bulkForm, quantity: parseInt(e.target.value) || 0})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white text-center" />
              </div>
              <div className="w-[120px]">
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Status</label>
                <select value={bulkForm.availability} onChange={e => setBulkForm({...bulkForm, availability: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white">
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="pre-order">Pre-Order</option>
                </select>
              </div>
              <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold px-6 py-2 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-colors whitespace-nowrap">
                🚀 Create All
              </button>
            </form>
            <div className="text-xs text-neutral-500 mt-3">Example: "Dining Chair" × 20 → creates "Dining Chair 1" ... "Dining Chair 20"</div>
          </div>

          {/* SINGLE ADD SECTION */}
          <form onSubmit={handleAddProduct} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Add Single Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Price</label>
                <input required type="text" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. ₦120,000" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white">
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
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Availability</label>
                <select value={form.availability} onChange={e => setForm({...form, availability: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white">
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="pre-order">Pre-Order</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Quantity</label>
                <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Specification</label>
                <textarea rows={2} value={form.spec} onChange={e => setForm({...form, spec: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Staff Notes</label>
                <textarea rows={2} value={form.staffNotes} onChange={e => setForm({...form, staffNotes: e.target.value})} className="w-full bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-2 text-sm focus:border-amber-500 focus:outline-none text-white resize-none" />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-300">
                  <input type="checkbox" checked={form.isAccessory || false} onChange={e => setForm({...form, isAccessory: e.target.checked})} className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500/20" />
                  This is an Accessory (handles, cushions, etc.)
                </label>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Product Photo</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-16 h-16 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {(form as any)._previewImage ? (
                      <img src={(form as any)._previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-neutral-500" />
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
                          setForm({ ...form, _previewImage: previewUrl, _newImageFile: file } as any);
                        }
                      };
                      input.click();
                    }}
                    className="bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Choose Photo
                  </button>
                  {(form as any)._previewImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, _previewImage: undefined, _newImageFile: undefined } as any);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-amber-500 text-neutral-950 font-bold px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                  Adding Product...
                </>
              ) : (
                'Add Single Product'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Product List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {products.map(p => (
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
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingIds(prev => ({ ...prev, [p.id]: true }));
                      try {
                        const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
                        const url = await uploadOrConvertToBase64(file, `products/${p.id}/${Date.now()}_${file.name}`);
                        await updateDoc(doc(db, 'products', p.id), { imageUrl: url, lastUpdated: serverTimestamp() });
                      } catch (err) {
                        console.error('Upload failed:', err);
                        handleFirestoreError(err, OperationType.UPDATE, `products/${p.id}`);
                      } finally {
                        setUploadingIds(prev => ({ ...prev, [p.id]: false }));
                      }
                    }
                  };
                  input.click();
                }}
                disabled={!!uploadingIds[p.id]}
                className="absolute bottom-4 right-4 bg-amber-400 hover:bg-amber-500 text-neutral-950 p-2.5 rounded-full shadow-lg border-2 border-white transition-colors z-10 disabled:opacity-50"
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

              <div className="border-t border-neutral-100 pt-4 mt-auto flex gap-2 flex-wrap">
                <button className="flex-1 min-w-[70px] bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-bold py-2 rounded-lg text-xs transition-colors">
                  + Quote
                </button>
                <button 
                  onClick={() => setViewingProduct(p)}
                  className="flex-1 min-w-[70px] bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  View
                </button>
                <button 
                  onClick={() => setEditingProduct(p)}
                  className="flex-1 min-w-[70px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => deleteProduct(p.id)}
                  className="flex-[0.6] min-w-[40px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 rounded-lg text-xs transition-colors flex justify-center items-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <div className="text-center py-10 text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-2xl">
          No products found. Add some above.
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
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 transition-colors bg-neutral-100 hover:bg-neutral-200 rounded-full p-1"
            >
              <X className="w-5 h-5" />
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
