import React, { useState, useEffect } from 'react';
import { 
  Handshake, ExternalLink, Phone, MessageSquare, Plus, Edit2, Trash2, 
  ArrowLeft, Search, CheckCircle, ShieldCheck, Share2, Upload, Lock,
  Globe, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
  JotraAlly, fetchActiveAllies, fetchAllAllies, saveAlly, 
  deleteAlly, uploadTenantPhoto, logAllyReferral 
} from '../hubServices';

interface HubAllyProps {
  onBack?: () => void;
  isStaffLoggedIn?: boolean;
  highlightCode?: string | null;
  onSelectTenant?: () => void;
}

export default function HubAlly({ onBack, isStaffLoggedIn, highlightCode }: HubAllyProps) {
  const [allies, setAllies] = useState<JotraAlly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlly, setSelectedAlly] = useState<JotraAlly | null>(null);
  const [search, setSearch] = useState('');
  const [isManagerMode, setIsManagerMode] = useState(false);
  const [managerAllies, setManagerAllies] = useState<JotraAlly[]>([]);
  const [editingAlly, setEditingAlly] = useState<Partial<JotraAlly> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeData = await fetchActiveAllies();
      setAllies(activeData);
      
      if (highlightCode) {
        const found = activeData.find(a => a.referral_code?.toLowerCase() === highlightCode.toLowerCase());
        if (found) {
          setSelectedAlly(found);
          logAllyReferral(found.id);
        }
      }

      if (isManagerMode) {
        const fullData = await fetchAllAllies();
        setManagerAllies(fullData);
      }
    } catch (err) {
      console.error('Failed to load allies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isManagerMode]);

  const handleOpenManagerMode = async () => {
    setIsManagerMode(true);
    const fullData = await fetchAllAllies();
    setManagerAllies(fullData);
  };

  const handleSaveAlly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlly?.ally_name) {
      setSaveError('Please enter an ally name');
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      await saveAlly(editingAlly);
      setEditingAlly(null);
      await loadData();
    } catch (err: any) {
      console.error('Error saving ally:', err);
      setSaveError(err.message || 'Failed to save ally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAlly = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ally "${name}"?`)) return;
    try {
      await deleteAlly(id);
      await loadData();
      if (selectedAlly?.id === id) setSelectedAlly(null);
    } catch (err: any) {
      alert('Failed to delete: ' + (err.message || 'Error'));
    }
  };

  const handleToggleStatus = async (ally: JotraAlly) => {
    const nextStatus = ally.status === 'active' ? 'inactive' : 'active';
    try {
      await saveAlly({ ...ally, status: nextStatus });
      await loadData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadTenantPhoto(file);
      setEditingAlly(prev => ({ ...prev, logo_or_photo: url }));
    } catch (err: any) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const origin = window.location.origin;
    const url = `${origin}?ally=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredAllies = allies.filter(a => {
    const q = search.toLowerCase();
    return (
      a.ally_name.toLowerCase().includes(q) ||
      (a.business_type || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-blue-500/30 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Handshake className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Partner Network
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">HubAlly</h2>
            </div>
            <p className="text-neutral-400 text-sm mt-0.5">
              Verified business allies, specialized partners and trusted local suppliers
            </p>
          </div>
        </div>

        {/* Manager Mode Switch */}
        <div className="flex items-center gap-3">
          {isManagerMode ? (
            <button
              onClick={() => setIsManagerMode(false)}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              ← Customer View
            </button>
          ) : (
            <button
              onClick={handleOpenManagerMode}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" /> Manager Hub
            </button>
          )}
          <button
            onClick={loadData}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and stats bar */}
      {!isManagerMode && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search allies, computers, solar..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Showing <span className="text-blue-400">{filteredAllies.length}</span> Active {filteredAllies.length === 1 ? 'Ally' : 'Allies'}
          </div>
        </div>
      )}

      {/* CUSTOMER ALLY GRID */}
      {!isManagerMode && (
        <>
          {loading ? (
            <div className="p-16 text-center text-neutral-400 font-bold">
              Loading verified allies...
            </div>
          ) : filteredAllies.length === 0 ? (
            <div className="p-16 text-center bg-neutral-900/40 border border-neutral-800 rounded-3xl">
              <Handshake className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-300 font-bold">No allies found.</p>
              <p className="text-neutral-500 text-sm mt-1">Check back later or explore other categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAllies.map(ally => {
                const initial = ally.ally_name.charAt(0).toUpperCase();
                const colors = [
                  'from-blue-600 to-indigo-700',
                  'from-cyan-600 to-blue-700',
                  'from-emerald-600 to-teal-700',
                  'from-amber-600 to-orange-700'
                ];
                const colorIndex = (ally.ally_name.charCodeAt(0) || 0) % colors.length;

                return (
                  <div
                    key={ally.id}
                    onClick={() => setSelectedAlly(ally)}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Top Row: Logo/Initial + Code Badge */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        {ally.logo_or_photo ? (
                          <img 
                            src={ally.logo_or_photo} 
                            alt={ally.ally_name}
                            className="w-16 h-16 rounded-2xl object-cover border border-neutral-700 shadow-md" 
                          />
                        ) : (
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white text-2xl font-black shadow-md border border-white/10`}>
                            {initial}
                          </div>
                        )}
                        {ally.referral_code && (
                          <span className="text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/60">
                            {ally.referral_code}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                        {ally.ally_name}
                      </h3>
                      {ally.business_type && (
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-1">
                          {ally.business_type}
                        </p>
                      )}
                      {ally.description && (
                        <p className="text-sm text-neutral-400 mt-3 line-clamp-3 leading-relaxed">
                          {ally.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-200 flex items-center gap-1.5 transition-colors">
                        View Ally Profile →
                      </span>
                      {ally.external_link && (
                        <span className="p-2 rounded-xl bg-neutral-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ALLY DETAIL MODAL */}
      {selectedAlly && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => setSelectedAlly(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-4 mb-6">
              {selectedAlly.logo_or_photo ? (
                <img 
                  src={selectedAlly.logo_or_photo} 
                  alt={selectedAlly.ally_name}
                  className="w-20 h-20 rounded-2xl object-cover border border-neutral-700 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-md border border-white/10">
                  {selectedAlly.ally_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Verified Ally
                </span>
                <h3 className="text-2xl font-black text-white mt-1">{selectedAlly.ally_name}</h3>
                {selectedAlly.business_type && (
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">{selectedAlly.business_type}</p>
                )}
              </div>
            </div>

            {selectedAlly.description && (
              <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-2xl p-4 mb-6">
                <p className="text-sm text-neutral-300 leading-relaxed">{selectedAlly.description}</p>
              </div>
            )}

            {/* Referral Code Banner */}
            {selectedAlly.referral_code && (
              <div className="flex items-center justify-between bg-blue-950/40 border border-blue-800/60 rounded-2xl p-4 mb-6">
                <div>
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Referral Code</div>
                  <div className="text-base font-black text-white font-mono tracking-wider">{selectedAlly.referral_code}</div>
                </div>
                <button
                  onClick={() => handleCopyLink(selectedAlly.referral_code || '')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copiedCode === selectedAlly.referral_code ? 'Copied Link!' : 'Share Link'}
                </button>
              </div>
            )}

            {/* Actions: Website, Call, WhatsApp */}
            <div className="space-y-3">
              {selectedAlly.external_link && (
                <a
                  href={selectedAlly.external_link.startsWith('http') ? selectedAlly.external_link : `https://${selectedAlly.external_link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  Visit Ally Website
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}

              <div className="grid grid-cols-2 gap-3">
                {selectedAlly.contact_info?.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedAlly.contact_info.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
                {selectedAlly.contact_info?.phone && (
                  <a
                    href={`tel:${selectedAlly.contact_info.phone}`}
                    className="py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-xs rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Ally
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER HUB SECTION */}
      {isManagerMode && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Manager Hub · Ally Administration
              </h3>
              <p className="text-neutral-400 text-xs mt-1">
                Add allies, manage profiles, track referrals and update external links
              </p>
            </div>
            <button
              onClick={() => {
                setEditingAlly({
                  ally_name: '',
                  business_type: '',
                  description: '',
                  logo_or_photo: '',
                  external_link: '',
                  status: 'active',
                  contact_info: { phone: '', whatsapp: '', email: '' }
                });
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Add New Ally
            </button>
          </div>

          {/* Allies Management Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-800/60 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="p-4">Ally</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Referral Code</th>
                    <th className="p-4">Referrals Logged</th>
                    <th className="p-4">External Link</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {managerAllies.map(ally => (
                    <tr key={ally.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {ally.logo_or_photo ? (
                            <img src={ally.logo_or_photo} alt={ally.ally_name} className="w-10 h-10 rounded-xl object-cover border border-neutral-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-black flex items-center justify-center text-sm border border-blue-500/30">
                              {ally.ally_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">{ally.ally_name}</div>
                            {ally.contact_info?.phone && (
                              <div className="text-xs text-neutral-400">{ally.contact_info.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-neutral-300 text-xs">{ally.business_type || '—'}</td>
                      <td className="p-4 font-mono font-bold text-xs text-blue-400">{ally.referral_code}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 font-bold text-xs">
                          {ally.referral_count || 0} hits
                        </span>
                      </td>
                      <td className="p-4">
                        {ally.external_link ? (
                          <a 
                            href={ally.external_link.startsWith('http') ? ally.external_link : `https://${ally.external_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Open Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(ally)}
                          className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                            ally.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}
                        >
                          {ally.status === 'active' ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingAlly(ally)}
                            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Edit Ally"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlly(ally.id, ally.ally_name)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Ally"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT ALLY MODAL */}
      {editingAlly && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setEditingAlly(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-blue-400" />
              {editingAlly.id ? 'Edit Ally' : 'Add New Ally'}
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Referral code is assigned automatically or generated upon creation.
            </p>

            {saveError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveAlly} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Ally Business Name *</label>
                <input 
                  type="text"
                  required
                  value={editingAlly.ally_name || ''}
                  onChange={e => setEditingAlly({ ...editingAlly, ally_name: e.target.value })}
                  placeholder="e.g. Apex Electronics Ltd"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Business Type / Category</label>
                <input 
                  type="text"
                  value={editingAlly.business_type || ''}
                  onChange={e => setEditingAlly({ ...editingAlly, business_type: e.target.value })}
                  placeholder="e.g. Solar Power, Audio Systems, Roofing"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={editingAlly.description || ''}
                  onChange={e => setEditingAlly({ ...editingAlly, description: e.target.value })}
                  placeholder="Brief description of products, services and store location..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Photo Upload to jotra-tenant-photos */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Logo or Store Photo</label>
                <div className="flex items-center gap-4">
                  {editingAlly.logo_or_photo ? (
                    <img 
                      src={editingAlly.logo_or_photo} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-neutral-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-neutral-800 border border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 text-xs">
                      No photo
                    </div>
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors border border-neutral-700 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                      className="hidden" 
                    />
                  </label>
                  {editingAlly.logo_or_photo && (
                    <button
                      type="button"
                      onClick={() => setEditingAlly({ ...editingAlly, logo_or_photo: null })}
                      className="text-xs text-red-400 hover:text-red-300 font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">External Website Link</label>
                <input 
                  type="text"
                  value={editingAlly.external_link || ''}
                  onChange={e => setEditingAlly({ ...editingAlly, external_link: e.target.value })}
                  placeholder="https://example.hublet.cc"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Phone Number</label>
                  <input 
                    type="text"
                    value={editingAlly.contact_info?.phone || ''}
                    onChange={e => setEditingAlly({ 
                      ...editingAlly, 
                      contact_info: { ...(editingAlly.contact_info || {}), phone: e.target.value } 
                    })}
                    placeholder="+234..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">WhatsApp</label>
                  <input 
                    type="text"
                    value={editingAlly.contact_info?.whatsapp || ''}
                    onChange={e => setEditingAlly({ 
                      ...editingAlly, 
                      contact_info: { ...(editingAlly.contact_info || {}), whatsapp: e.target.value } 
                    })}
                    placeholder="+234..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Status</label>
                <select
                  value={editingAlly.status || 'active'}
                  onChange={e => setEditingAlly({ ...editingAlly, status: e.target.value as any })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Active (Visible in HubAlly)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingAlly(null)}
                  className="px-4 py-2.5 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/20"
                >
                  {isSaving ? 'Saving...' : 'Save Ally'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
