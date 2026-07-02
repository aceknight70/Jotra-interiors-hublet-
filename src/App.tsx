import React, { useState, useEffect } from 'react';
import { initStore, getStaff } from './store';
import Portal from './components/Portal';
import RepairDashboard from './components/RepairDashboard';
import StaffDashboard from './components/StaffDashboard';
import GoodsHub from './components/GoodsHub';
import WarehouseDashboard from './components/WarehouseDashboard';
import DisplayFloor from './components/DisplayFloor';
import { Hexagon, LayoutTemplate, Sparkles, ShoppingBag, Lock, LogOut } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('client');
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    initStore();
    const stored = localStorage.getItem('jt_staffUser');
    if (stored) setIsStaffLoggedIn(true);
  }, []);

  const handleEnterOrb = () => {
    if (isStaffLoggedIn) {
      setView('portal');
    } else {
      setShowLogin(true);
      setLoginError('');
      setEmail('admin@jotra.com');
      setPin('0000');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const staff = getStaff();
    const found = staff.find(s => s.email === email);
    
    if (!found) {
      setLoginError('Email not found.');
      return;
    }
    if (found.pin !== pin) {
      setLoginError('Wrong PIN.');
      return;
    }
    
    localStorage.setItem('jt_staffUser', JSON.stringify(found));
    setIsStaffLoggedIn(true);
    setShowLogin(false);
    setView('portal');
  };

  const handleLogout = () => {
    localStorage.removeItem('jt_staffUser');
    setIsStaffLoggedIn(false);
    setView('client');
  };

  if (view === 'client') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col">
        <header className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">JOTRA</h1>
            <nav className="hidden md:flex gap-6 font-bold text-sm text-neutral-500">
              <a href="#" className="text-neutral-900">Showroom</a>
              <a href="#" className="hover:text-neutral-900">Compare</a>
              <a href="#" className="hover:text-neutral-900">Collections</a>
              <a href="#" className="hover:text-neutral-900">Contact</a>
            </nav>
            <button className="bg-neutral-900 text-white px-4 py-2 rounded-full text-sm font-bold">
              Cart (0)
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
              Premium Doors, Ceilings & Interiors.
            </h2>
            <p className="text-xl text-neutral-500 max-w-xl mx-auto">
              Welcome to the public-facing Jotra App. Clients can browse the showroom, request quotes, and manage their carts here.
            </p>
            
            <div className="pt-12 border-t border-neutral-200 mt-12">
              <p className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-widest">Staff Access</p>
              <button 
                onClick={handleEnterOrb}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 font-black rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition-all"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
                <Hexagon className="w-6 h-6 fill-neutral-950" />
                <span>ENTER THE ORB</span>
              </button>
            </div>
          </div>
        </main>

        {/* Staff Login Overlay */}
        {showLogin && (
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-[400px] w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-amber-500 tracking-tight">Staff Access</h2>
                <p className="text-neutral-400 text-sm mt-2">Enter your credentials to access the Orb</p>
              </div>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Staff email"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white"
                  required
                />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white"
                  required
                />
                {loginError && <div className="text-red-500 text-xs font-bold text-center">{loginError}</div>}
                <button type="submit" className="w-full bg-gradient-to-br from-amber-500 to-amber-600 text-neutral-950 font-black rounded-xl py-3 mt-2 hover:from-amber-400 hover:to-amber-500 transition-colors">
                  Login to Orb
                </button>
                <button type="button" onClick={() => setShowLogin(false)} className="text-neutral-500 text-sm font-bold hover:text-neutral-300 mt-2">
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-neutral-100 font-sans selection:bg-amber-500/30" 
         style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)' }}>
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-black/80 p-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => setView('portal')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <span className="text-sm text-amber-500 font-bold tracking-widest uppercase">🌀 JOTRA ORB</span>
          </button>
          
          <div className="flex gap-3">
            {view !== 'portal' && (
              <button
                onClick={() => setView('portal')}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-xs font-bold transition-colors text-neutral-300 hover:text-white"
              >
                Back to Portal
              </button>
            )}
            <button
              onClick={() => setView('client')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-xs font-bold transition-colors text-neutral-300 hover:text-white"
            >
              Exit Orb
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-full text-xs font-bold transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
        {view === 'portal' && <Portal setView={setView} />}
        {view === 'repair' && <RepairDashboard />}
        {view === 'staff' && <StaffDashboard />}
        {view === 'goods' && <GoodsHub />}
        {view === 'warehouse' && <WarehouseDashboard />}
        {view === 'display' && <DisplayFloor />}
        
        {/* Placeholder for unimplemented modules */}
        {!['portal', 'repair', 'staff', 'goods', 'warehouse', 'display'].includes(view) && (
          <div className="text-center py-32 max-w-md mx-auto">
            <div className="bg-neutral-900/50 backdrop-blur border border-amber-500/20 rounded-3xl p-8 shadow-2xl">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hexagon className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-neutral-200">Module Pending</h2>
              <p className="text-neutral-500 mt-2 text-sm">
                The <span className="text-amber-500 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">{view}</span> module is currently under development and not yet integrated into the Orb.
              </p>
              <button 
                onClick={() => setView('portal')}
                className="mt-6 px-6 py-2.5 bg-neutral-100 text-neutral-900 font-bold rounded-lg hover:bg-white transition-colors w-full"
              >
                Return to Portal
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
