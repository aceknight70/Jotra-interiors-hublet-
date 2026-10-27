import React, { useState, useEffect } from 'react';
import { initStore, getStaff } from './store';
import Portal from './components/Portal';
import RepairDashboard from './components/RepairDashboard';
import StaffDashboard from './components/StaffDashboard';
import GoodsHub from './components/GoodsHub';
import WarehouseDashboard from './components/WarehouseDashboard';
import DisplayFloor from './components/DisplayFloor';
import PhotoGallery from './components/PhotoGallery';
import HubAlly from './components/HubAlly';
import HubTenant from './components/HubTenant';
import DraggableFloatingButtons from './components/DraggableFloatingButtons';
import { JotraTenant } from './hubServices';
import { Hexagon, Lock, LogOut, Wrench, Handshake, Store, X } from 'lucide-react';

export default function App() {
  const [view, setViewState] = useState('client');
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingView, setPendingView] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Referral tracking state
  const [allyParamCode, setAllyParamCode] = useState<string | null>(null);
  const [tenantParamCode, setTenantParamCode] = useState<string | null>(null);
  const [activeReferralTenant, setActiveReferralTenant] = useState<JotraTenant | null>(null);

  useEffect(() => {
    initStore();
    const stored = localStorage.getItem('jt_staffUser');
    if (stored) setIsStaffLoggedIn(true);

    // Parse URL parameters ?ally=CODE and ?tenant=CODE
    const params = new URLSearchParams(window.location.search);
    const ally = params.get('ally');
    const tenant = params.get('tenant');
    if (ally) {
      setAllyParamCode(ally);
      setViewState('hubally');
    } else if (tenant) {
      setTenantParamCode(tenant);
      setViewState('hubtenant');
    }
  }, []);

  const setView = (newView: string) => {
    if (newView === 'staff' && !isStaffLoggedIn) {
      setPendingView(newView);
      setShowLogin(true);
      setLoginError('');
      setEmail('admin@jotra.com');
      setPin('0000');
    } else {
      setViewState(newView);
    }
  };

  const handleEnterOrb = () => {
    setView('portal');
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const staff = getStaff();
    const found = staff.find(s => s.pin === pin);
    
    if (!found) {
      setLoginError('Incorrect PIN.');
      return;
    }
    
    localStorage.setItem('jt_staffUser', JSON.stringify(found));
    setIsStaffLoggedIn(true);
    setShowLogin(false);
    if (pendingView) {
      setViewState(pendingView);
      setPendingView('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jt_staffUser');
    setIsStaffLoggedIn(false);
    if (view === 'staff') {
      setViewState('portal');
    }
  };

  // Persistent Referral Banner
  const renderPersistentBanner = () => {
    if (!activeReferralTenant) return null;
    return (
      <div className="bg-emerald-950 border-b border-emerald-800 text-emerald-200 px-4 py-2.5 text-xs font-bold flex items-center justify-between sticky top-0 z-[60] shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            Browsing via <strong className="text-white underline">{activeReferralTenant.tenant_name}</strong>'s referral link
          </span>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'hubtenant' && (
            <button
              onClick={() => setView('hubtenant')}
              className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-colors shadow"
            >
              Back to {activeReferralTenant.tenant_name}
            </button>
          )}
          <button
            onClick={() => setActiveReferralTenant(null)}
            className="p-1 text-emerald-400 hover:text-white rounded"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // View: Client Showroom Home Screen
  if (view === 'client') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col relative">
        {renderPersistentBanner()}

        <header className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button className="text-sm text-neutral-600 hover:text-neutral-900 font-black flex items-center gap-2">
              ← Back to Jotra World
            </button>
            <nav className="hidden md:flex gap-6 font-bold text-sm text-neutral-500 items-center">
              <a href="#" className="text-neutral-900">Showroom</a>
              
              {/* HubAlly and HubTenant Top Navigation */}
              <button 
                onClick={() => setView('hubally')} 
                className="text-blue-600 hover:text-blue-700 font-black flex items-center gap-1.5 transition-colors"
              >
                <Handshake className="w-4 h-4" /> HubAlly
              </button>
              <button 
                onClick={() => setView('hubtenant')} 
                className="text-emerald-600 hover:text-emerald-700 font-black flex items-center gap-1.5 transition-colors"
              >
                <Store className="w-4 h-4" /> HubTenant
              </button>

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
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight text-neutral-900">
              Premium Furnishings, Doors, Ceilings, Gates & Interiors.
            </h2>
            <p className="text-xl text-neutral-500 max-w-xl mx-auto">
              Browse Jotra's full collection, get instant price estimates, and request your quote — all in one place.
            </p>
            
            {/* HERO TILES SECTION: Jotra Orb + HubAlly (Blue) + HubTenant (Green) */}
            <div className="pt-4 pb-8 flex flex-col md:flex-row items-stretch justify-center gap-4 max-w-3xl mx-auto w-full">
              {/* JOTRA ORB TILE */}
              <button 
                onClick={handleEnterOrb}
                className="group relative flex-1 inline-flex items-center justify-center gap-4 px-8 py-5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-lg font-black rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] transition-all transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <Hexagon className="w-6 h-6 fill-neutral-950" />
                <span>ENTER THE ORB</span>
              </button>

              {/* TWO TILES SIDE BY SIDE: BLUE HubAlly & GREEN HubTenant */}
              <div className="flex w-full md:w-auto gap-3">
                {/* BLUE TILE: HubAlly */}
                <button
                  onClick={() => setView('hubally')}
                  className="flex-1 md:w-40 p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.4)] transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between border border-blue-400/40 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-2.5">
                    <Handshake className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-80 block">Allies</span>
                    <span className="text-base font-black leading-tight block">HubAlly</span>
                  </div>
                </button>

                {/* GREEN TILE: HubTenant */}
                <button
                  onClick={() => setView('hubtenant')}
                  className="flex-1 md:w-40 p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_28px_rgba(5,150,105,0.4)] transition-all transform hover:-translate-y-1 text-left flex flex-col justify-between border border-emerald-400/40 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-2.5">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-80 block">Artisans</span>
                    <span className="text-base font-black leading-tight block">HubTenant</span>
                  </div>
                </button>
              </div>
            </div>

            {/* STAFF ACCESS & CHANNELS CARD SECTION */}
            <div className="pt-12 border-t border-neutral-200 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              {/* Staff Access Card */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Staff Access</p>
                  <p className="text-sm text-neutral-500 mb-6">
                    Authorized staff can manage showroom products, log task reports, upload gallery visuals, and monitor warehouse inventories.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setPendingView('portal');
                    setShowLogin(true);
                    setLoginError('');
                    setEmail('admin@jotra.com');
                    setPin('0000');
                  }}
                  className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-xl text-xs tracking-wider transition-all border border-neutral-800 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" /> STAFF ACCESS
                </button>
              </div>

              {/* Jotra Channels Card */}
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2">Jotra Channels</p>
                  <p className="text-sm text-neutral-500 mb-6">
                    Connect directly with Jotra Interiors representatives. Get custom design consults, request active catalogs, and ask inquiries.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href="https://wa.me/2348110891806" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer" 
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 text-center shadow-md shadow-emerald-500/10"
                  >
                    💬 WHATSAPP
                  </a>
                  <a 
                    href="https://facebook.com/jotrainteriors" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer" 
                    className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 text-center shadow-md shadow-blue-500/10"
                  >
                    🔵 FACEBOOK
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Draggable Floating Buttons on Every Screen */}
        <DraggableFloatingButtons 
          onOpenTenant={() => setView('hubtenant')} 
          onOpenAlly={() => setView('hubally')} 
        />

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
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:outline-none text-white text-center tracking-[0.5em] text-lg font-mono"
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

  // Inside the Hublet (Portal, HubAlly, HubTenant, GoodsHub, Display, etc.)
  return (
    <div className="min-h-screen text-neutral-100 font-sans selection:bg-amber-500/30 relative" 
         style={{ background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 100%)' }}>
      
      {/* Persistent Referral Banner */}
      {renderPersistentBanner()}

      {/* Header */}
      <header className="border-b border-amber-500/20 bg-black/80 p-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('portal')} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <span className="text-sm text-amber-500 font-bold tracking-widest uppercase">🌀 JOTRA ORB</span>
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={() => setView('hubtenant')} 
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  view === 'hubtenant' ? 'bg-emerald-600 text-white' : 'bg-neutral-800/80 text-emerald-400 hover:bg-neutral-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" /> HubTenant
              </button>
              <button 
                onClick={() => setView('hubally')} 
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  view === 'hubally' ? 'bg-blue-600 text-white' : 'bg-neutral-800/80 text-blue-400 hover:bg-neutral-800'
                }`}
              >
                <Handshake className="w-3.5 h-3.5" /> HubAlly
              </button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setView('client')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-xs font-bold transition-colors text-neutral-300 hover:text-white"
            >
              ← Back to Orb Front
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
        {view === 'portal' && (
          <Portal 
            setView={setView} 
            isStaffLoggedIn={isStaffLoggedIn} 
            staffUser={(() => {
              if (!isStaffLoggedIn) return null;
              try {
                return JSON.parse(localStorage.getItem('jt_staffUser') || 'null');
              } catch {
                return null;
              }
            })()}
            onLoginClick={() => {
              setShowLogin(true);
              setLoginError('');
              setEmail('admin@jotra.com');
              setPin('0000');
            }}
            onLogoutClick={handleLogout}
          />
        )}
        {view === 'hubally' && (
          <HubAlly 
            onBack={() => setView('portal')} 
            isStaffLoggedIn={isStaffLoggedIn}
            highlightCode={allyParamCode}
          />
        )}
        {view === 'hubtenant' && (
          <HubTenant 
            onBack={() => setView('portal')} 
            isStaffLoggedIn={isStaffLoggedIn}
            initialCode={tenantParamCode}
            onSetReferralBanner={(t) => setActiveReferralTenant(t)}
          />
        )}
        {view === 'repair' && <RepairDashboard />}
        {view === 'staff' && <StaffDashboard />}
        {view === 'goods' && <GoodsHub setView={setView} />}
        {view === 'warehouse' && <WarehouseDashboard />}
        {view === 'display' && <DisplayFloor />}
        {view === 'photos' && <PhotoGallery />}
        
        {/* Placeholder for other unimplemented modules */}
        {!['portal', 'hubally', 'hubtenant', 'repair', 'staff', 'goods', 'warehouse', 'display', 'photos'].includes(view) && (
          <div className="text-center py-32 max-w-md mx-auto">
            <div className="bg-neutral-900/50 backdrop-blur border border-amber-500/20 rounded-3xl p-8 shadow-2xl">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-neutral-200">Under Construction</h2>
              <p className="text-neutral-500 mt-2 text-sm">
                The <span className="text-amber-500 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">{view}</span> module is currently under development. Please check back later.
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

      {/* Draggable Floating Buttons on Every Screen */}
      <DraggableFloatingButtons 
        onOpenTenant={() => setView('hubtenant')} 
        onOpenAlly={() => setView('hubally')} 
      />
    </div>
  );
}
