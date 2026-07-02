import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Product } from '../types';
import { Box, Search, AlertCircle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

export default function WarehouseDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching warehouse products:', error);
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  const updateQuantity = async (id: string, newQty: number) => {
    try {
      await updateDoc(doc(db, 'products', id), { 
        quantity: newQty, 
        lastUpdated: serverTimestamp() 
      });
    } catch (err) {
      console.error('Failed to update quantity', err);
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.warehouse && p.warehouse.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Box className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-black text-blue-500 tracking-tight">Warehouse & Stock</h2>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search products or locations..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all text-neutral-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-500">Loading stock data...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-neutral-800/50 border border-neutral-800 rounded-3xl p-16 text-center">
          <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-300">No stock found</h3>
        </div>
      ) : (
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-900/50 text-neutral-400 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-neutral-700/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-700 overflow-hidden flex-shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Box className="w-5 h-5 text-neutral-500" /></div>
                        )}
                      </div>
                      {p.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-neutral-700/50 px-2.5 py-1 rounded-md text-xs uppercase tracking-wider">{p.category}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">{p.warehouse || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-lg ${p.quantity === 0 ? 'text-red-500' : p.quantity! < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {p.quantity || 0}
                        </span>
                        {p.quantity === 0 && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Out</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => updateQuantity(p.id, Math.max(0, (p.quantity || 0) - 1))}
                          className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center font-bold transition-colors"
                        >-</button>
                        <button 
                          onClick={() => updateQuantity(p.id, (p.quantity || 0) + 1)}
                          className="w-8 h-8 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center font-bold transition-colors"
                        >+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
