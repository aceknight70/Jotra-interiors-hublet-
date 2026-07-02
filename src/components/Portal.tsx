import { Wrench, Users, ShoppingBag, LayoutDashboard, Calendar, BookOpen, Camera, Video, Receipt, Database, Box } from 'lucide-react';

export default function Portal({ 
  setView, 
  isStaffLoggedIn,
  staffUser,
  onLoginClick,
  onLogoutClick
}: { 
  setView: (v: string) => void;
  isStaffLoggedIn: boolean;
  staffUser?: { name: string } | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}) {
  const tiles = [
    { id: 'goods', icon: ShoppingBag, label: 'Goods Hub', sub: 'Inventory & Categories', restricted: false },
    { id: 'display', icon: LayoutDashboard, label: 'Display Floor', sub: 'Showroom overview', restricted: false },
    { id: 'seasonal', icon: Calendar, label: 'Seasonal', sub: 'Promotions & Events', restricted: false },
    { id: 'warehouse', icon: Box, label: 'Warehouse Goods', sub: 'Stock levels & locations', restricted: false },
    { id: 'workbook', icon: BookOpen, label: 'Workbook', sub: 'Staff logs & tasks', restricted: false },
    { id: 'photos', icon: Camera, label: 'Photo Gallery', sub: 'Visual assets', restricted: false },
    { id: 'videos', icon: Video, label: 'Video Gallery', sub: 'Marketing & Demos', restricted: false },
    { id: 'receipts', icon: Receipt, label: 'Invoices', sub: 'Receipt Generator', restricted: false },
    { id: 'repair', icon: Wrench, label: 'Repair & Maintenance', sub: 'Faulty goods & Complaints', highlight: true, restricted: false },
    { id: 'staff', icon: Users, label: 'Staff Room', sub: 'Staff-only: CSV, bulk add, edit', restricted: true },
  ];

  return (
    <div>
      <div className="text-center pb-12">
        <div className="text-5xl drop-shadow-[0_0_40px_rgba(201,168,76,0.3)] mb-4">🌀</div>
        <h2 className="text-amber-500 font-black text-2xl tracking-[4px]">JOTRA ORB</h2>
        <p className="text-neutral-400 text-sm mt-2">AI Studio · Browse · Explore</p>
        {isStaffLoggedIn && staffUser && (
          <p className="text-emerald-500 text-xs mt-2 font-bold">✅ Logged in as {staffUser.name}</p>
        )}
        <div className="flex justify-center mt-6">
          {isStaffLoggedIn ? (
            <button
              onClick={onLogoutClick}
              className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-full text-sm font-bold transition-colors"
            >
              🚪 Logout
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-8 py-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 rounded-full text-sm font-black transition-all shadow-[0_4px_16px_rgba(201,168,76,0.3)] hover:scale-105"
            >
              👤 Staff Access
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
      {tiles.map(tile => {
        const isLocked = tile.restricted && !isStaffLoggedIn;
        return (
          <button
            key={tile.id}
            onClick={() => setView(tile.id)}
            className={`p-6 rounded-2xl bg-neutral-800 border transition-all flex flex-col items-center text-center gap-4 cursor-pointer hover:-translate-y-1 shadow-lg ${
              tile.highlight 
                ? 'border-amber-500/40 hover:border-amber-500/80 shadow-amber-500/5' 
                : 'border-neutral-700 hover:border-neutral-500'
            } ${isLocked ? 'opacity-60' : ''}`}
          >
            <div className={`p-4 rounded-full ${tile.highlight ? 'bg-amber-500/10' : 'bg-neutral-900'}`}>
              <tile.icon className={`w-8 h-8 ${tile.highlight ? 'text-amber-500' : 'text-neutral-400'}`} />
            </div>
            <div>
              <h3 className={`font-bold flex items-center justify-center gap-2 ${tile.highlight ? 'text-amber-500' : 'text-neutral-100'}`}>
                {tile.label}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">{tile.sub}</p>
              {isLocked && <div className="text-[10px] text-red-500 font-bold mt-2 bg-red-500/10 inline-block px-2 py-0.5 rounded">🔒 Staff Only</div>}
            </div>
          </button>
        );
      })}
      </div>
      <p className="text-center text-white/10 text-[10px] mt-12 tracking-widest font-bold">JOTRA INTERIORS · AI STUDIO</p>
    </div>
  );
}
