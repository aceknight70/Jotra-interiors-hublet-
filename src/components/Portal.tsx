import { Wrench, Users, ShoppingBag, LayoutDashboard, Calendar, BookOpen, Camera, Video, Receipt, Database, Box } from 'lucide-react';

export default function Portal({ setView }: { setView: (v: string) => void }) {
  const tiles = [
    { id: 'goods', icon: ShoppingBag, label: 'Goods Hub', sub: 'Inventory & Categories' },
    { id: 'display', icon: LayoutDashboard, label: 'Display Floor', sub: 'Showroom overview' },
    { id: 'seasonal', icon: Calendar, label: 'Seasonal', sub: 'Promotions & Events' },
    { id: 'warehouse', icon: Box, label: 'Warehouse Goods', sub: 'Stock levels & locations' },
    { id: 'workbook', icon: BookOpen, label: 'Workbook', sub: 'Staff logs & tasks' },
    { id: 'photos', icon: Camera, label: 'Photo Gallery', sub: 'Visual assets' },
    { id: 'videos', icon: Video, label: 'Video Gallery', sub: 'Marketing & Demos' },
    { id: 'receipts', icon: Receipt, label: 'Invoices', sub: 'Receipt Generator' },
    { id: 'repair', icon: Wrench, label: 'Repair & Maintenance', sub: 'Faulty goods & Complaints', highlight: true },
    { id: 'staff', icon: Users, label: 'Staff Room', sub: 'Technicians & Roles' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
      {tiles.map(tile => (
        <button
          key={tile.id}
          onClick={() => setView(tile.id)}
          className={`p-6 rounded-2xl bg-neutral-800 border transition-all flex flex-col items-center text-center gap-4 cursor-pointer hover:-translate-y-1 shadow-lg ${
            tile.highlight 
              ? 'border-amber-500/40 hover:border-amber-500/80 shadow-amber-500/5' 
              : 'border-neutral-700 hover:border-neutral-500'
          }`}
        >
          <div className={`p-4 rounded-full ${tile.highlight ? 'bg-amber-500/10' : 'bg-neutral-900'}`}>
            <tile.icon className={`w-8 h-8 ${tile.highlight ? 'text-amber-500' : 'text-neutral-400'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${tile.highlight ? 'text-amber-500' : 'text-neutral-100'}`}>{tile.label}</h3>
            <p className="text-xs text-neutral-400 mt-1">{tile.sub}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
