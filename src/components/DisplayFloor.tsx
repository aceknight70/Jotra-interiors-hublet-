import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Product } from '../types';
import { LayoutDashboard, Maximize2 } from 'lucide-react';

export default function DisplayFloor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('furniture');

  const categoryOrder = [
    'furniture', 'doors', 'gates', 'ceilings', 'lighting',
    'vases', 'walldecor', 'frames', 'sculptures', 'solar'
  ];

  const categoryNames: Record<string, string> = {
    'furniture': 'Furniture',
    'doors': 'Security Doors',
    'gates': 'Gates',
    'ceilings': 'Ceilings',
    'lighting': 'Lighting',
    'vases': 'Flower Vases',
    'walldecor': 'Wall Décor & Art',
    'frames': 'Picture Frames',
    'sculptures': 'Sculptures & Art Objects',
    'solar': 'Solar Solutions'
  };

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getProductsForCategory = (category: string) => {
    return products.filter(p => p.category === category);
  };

  const sceneProducts = getProductsForCategory(selectedCategory);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-8 h-8 text-fuchsia-500" />
        <h2 className="text-2xl font-black text-fuchsia-500 tracking-tight">Display Floor</h2>
      </div>

      {/* Scene Selector */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {categoryOrder.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-bold transition-all ${
              selectedCategory === cat 
                ? 'bg-fuchsia-500 text-neutral-950 shadow-lg shadow-fuchsia-500/20' 
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            {categoryNames[cat]}
          </button>
        ))}
      </div>

      {/* Virtual Room View */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative min-h-[600px] flex flex-col">
        {/* Decorative background representing the room */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at center, #d946ef 0%, transparent 70%)',
          backgroundSize: '100% 100%'
        }}></div>

        <div className="relative p-8 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">{categoryNames[selectedCategory]}</h3>
              <p className="text-neutral-400 mt-1">Curated selection of premium items</p>
            </div>
            <button className="bg-neutral-800/80 backdrop-blur p-3 rounded-xl border border-neutral-700 text-neutral-300 hover:text-white transition-colors">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-neutral-500">Loading scene...</div>
          ) : sceneProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-center max-w-sm mx-auto">
              No products available in {categoryNames[selectedCategory]}. Edit products in the Goods Hub to assign them here.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-auto">
              {sceneProducts.map(p => (
                <div key={p.id} className="bg-neutral-950/50 backdrop-blur border border-neutral-800 rounded-2xl overflow-hidden hover:border-fuchsia-500/50 transition-colors group">
                  <div className="aspect-square bg-neutral-900 relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700 font-black tracking-widest uppercase text-xs">No Photo</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white text-sm line-clamp-1 flex items-center gap-2">
                      {p.name}
                      {p.isAccessory && <span className="bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">Acc</span>}
                    </h4>
                    <div className="text-fuchsia-400 font-black text-xs mt-1">{p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
