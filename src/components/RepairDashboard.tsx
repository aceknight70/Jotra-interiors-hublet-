import React, { useState, useEffect, useMemo } from 'react';
import { getTickets, saveTickets, getStaff } from '../store';
import { RepairTicket, StaffMember, TicketStatus } from '../types';
import { Search, Plus, X, Wrench, PlayCircle, CheckCircle2, RefreshCw, Trash2, AlertTriangle, Calendar, User, Clock } from 'lucide-react';

export default function RepairDashboard() {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [form, setForm] = useState({
    productName: '', stockId: '', category: 'doors',
    customerName: '', customerPhone: '', issue: '',
    urgent: false, assignedTo: ''
  });

  // Resolution Modal State
  const [resolvingTicket, setResolvingTicket] = useState<RepairTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    setTickets(getTickets());
    setStaff(getStaff());
  }, []);

  const stats = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'replaced').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  }), [tickets]);

  const categoryCounts = useMemo(() => ({
    doors: tickets.filter(t => t.category === 'doors').length,
    ceilings: tickets.filter(t => t.category === 'ceilings').length,
    furniture: tickets.filter(t => t.category === 'furniture').length,
    gates: tickets.filter(t => t.category === 'gates').length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSearch = search === '' || 
        t.productName.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.issue.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tickets, search, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName || !form.customerName || !form.issue) return;

    const newTicket: RepairTicket = {
      id: 'R-' + Date.now().toString().slice(-6),
      productName: form.productName,
      category: form.category,
      issue: form.issue,
      customerName: form.customerName,
      customerPhone: form.customerPhone || 'Not provided',
      complaintDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      assignedTo: form.assignedTo,
      priority: form.urgent ? 'urgent' : 'medium',
      images: [],
      resolutionNotes: '',
      resolutionDate: null,
      createdAt: new Date().toISOString(),
      stockId: form.stockId
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveTickets(updated);
    setShowForm(false);
    setForm({ productName: '', stockId: '', category: 'doors', customerName: '', customerPhone: '', issue: '', urgent: false, assignedTo: '' });
  };

  const updateStatus = (id: string, newStatus: TicketStatus) => {
    if (newStatus === 'resolved' || newStatus === 'replaced') {
      const ticket = tickets.find(t => t.id === id);
      if (ticket) setResolvingTicket(ticket);
      return;
    }
    
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    saveTickets(updated);
  };

  const submitResolution = () => {
    if (!resolvingTicket) return;
    const updated = tickets.map(t => {
      if (t.id === resolvingTicket.id) {
        return { 
          ...t, 
          status: 'resolved' as TicketStatus, 
          resolutionDate: new Date().toISOString().split('T')[0],
          resolutionNotes 
        };
      }
      return t;
    });
    setTickets(updated);
    saveTickets(updated);
    setResolvingTicket(null);
    setResolutionNotes('');
  };

  const deleteTicket = (id: string) => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    saveTickets(updated);
  };

  const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
    'pending': { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock, label: 'Pending' },
    'in-progress': { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: PlayCircle, label: 'In Progress' },
    'resolved': { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2, label: 'Resolved' },
    'replaced': { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: RefreshCw, label: 'Replaced' },
    'closed': { color: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20', icon: X, label: 'Closed' }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="w-8 h-8 text-amber-500" />
        <h2 className="text-2xl font-black text-amber-500 tracking-tight">Repair & Maintenance</h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-neutral-100">{stats.total}</div>
          <div className="text-xs text-neutral-400 mt-1 uppercase font-bold tracking-wider">Total Tickets</div>
        </div>
        <div className="bg-neutral-800 border border-amber-500/50 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(245,158,11,0.05)]">
          <div className="text-3xl font-black text-amber-500">{stats.pending}</div>
          <div className="text-xs text-amber-500/70 mt-1 uppercase font-bold tracking-wider">Pending</div>
        </div>
        <div className="bg-neutral-800 border border-red-500/50 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(239,68,68,0.05)]">
          <div className="text-3xl font-black text-red-500">{stats.urgent}</div>
          <div className="text-xs text-red-500/70 mt-1 uppercase font-bold tracking-wider">Urgent</div>
        </div>
        <div className="bg-neutral-800 border border-emerald-500/50 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="text-3xl font-black text-emerald-500">{stats.resolved}</div>
          <div className="text-xs text-emerald-500/70 mt-1 uppercase font-bold tracking-wider">Resolved</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex flex-wrap gap-2">
        <div className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
          🚪 Faulty Doors <span className="bg-red-500/20 px-2 py-0.5 rounded-full">{categoryCounts.doors}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-2">
          ⬜ Faulty Ceilings <span className="bg-amber-500/20 px-2 py-0.5 rounded-full">{categoryCounts.ceilings}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2">
          🛋️ Faulty Furniture <span className="bg-blue-500/20 px-2 py-0.5 rounded-full">{categoryCounts.furniture}</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold flex items-center gap-2">
          🔒 Faulty Gates <span className="bg-purple-500/20 px-2 py-0.5 rounded-full">{categoryCounts.gates}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search product, customer, or issue..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-neutral-100"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-neutral-100"
        >
          <option value="all">All Statuses</option>
          <option value="pending">🟡 Pending</option>
          <option value="in-progress">🔵 In Progress</option>
          <option value="resolved">✅ Resolved</option>
          <option value="replaced">🔄 Replaced</option>
        </select>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold px-5 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="bg-neutral-800 border border-amber-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Log Faulty Product
            </h3>
            <button onClick={() => setShowForm(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Product Name</label>
                <input required type="text" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} placeholder="e.g. Ultra Tornado Steel Door" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Stock/Batch ID</label>
                <input type="text" value={form.stockId} onChange={e => setForm({...form, stockId: e.target.value})} placeholder="e.g. UT-2025-001" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white">
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
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Assign To</label>
                <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white">
                  <option value="">Unassigned</option>
                  {staff.filter(s => s.status === 'active').map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Customer Name</label>
                <input required type="text" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="Customer Name" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Customer Phone</label>
                <input type="text" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="Phone number" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase">Complaint / Issue</label>
              <textarea required rows={3} value={form.issue} onChange={e => setForm({...form, issue: e.target.value})} placeholder="Describe the fault in detail..." className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none text-white resize-none"></textarea>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-white transition-colors text-neutral-300">
                <input type="checkbox" checked={form.urgent} onChange={e => setForm({...form, urgent: e.target.checked})} className="accent-red-500 w-4 h-4 rounded" />
                🔥 Mark as Urgent
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="bg-amber-500 text-neutral-950 font-bold px-6 py-2.5 rounded-lg hover:bg-amber-400 transition-colors">
                Log Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-12 text-center">
            <Wrench className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-300">No tickets found</h3>
            <p className="text-neutral-500 mt-1">Start by logging a faulty product, or adjust your filters.</p>
          </div>
        ) : (
          filteredTickets.map(t => {
            const conf = statusConfig[t.status];
            const StatusIcon = conf.icon;
            
            return (
              <div key={t.id} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-5 hover:border-neutral-600 transition-colors flex flex-col md:flex-row gap-5">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md">{t.id}</span>
                        {t.priority === 'urgent' && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Urgent</span>}
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-md border ${conf.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {conf.label}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white leading-tight">{t.productName}</h4>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                        <span className="capitalize px-2 py-0.5 bg-neutral-900 rounded-md">{t.category}</span>
                        {t.stockId && <span className="text-amber-500/70">Stock: {t.stockId}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-900/50 rounded-lg p-3 text-sm text-neutral-300 border border-neutral-800/50">
                    "{t.issue}"
                  </div>

                  {t.resolutionNotes && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-sm text-emerald-400">
                      <strong>Resolution:</strong> {t.resolutionNotes}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      {t.complaintDate}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-neutral-400" />
                      {t.customerName} ({t.customerPhone})
                    </div>
                    {t.assignedTo && (
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-amber-500/70" />
                        <span className="text-amber-500/80">{t.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 justify-end border-t md:border-t-0 md:border-l border-neutral-700 pt-4 md:pt-0 md:pl-5 min-w-[140px]">
                  {t.status === 'pending' && (
                    <button onClick={() => updateStatus(t.id, 'in-progress')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                      <PlayCircle className="w-4 h-4" /> Start
                    </button>
                  )}
                  {(t.status === 'pending' || t.status === 'in-progress') && (
                    <button onClick={() => updateStatus(t.id, 'resolved')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> Resolve
                    </button>
                  )}
                  <button onClick={() => deleteTicket(t.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Resolve Ticket
            </h3>
            <p className="text-sm text-neutral-400 mb-4">
              Add optional resolution notes for <strong className="text-white">{resolvingTicket.productName}</strong> before closing this ticket.
            </p>
            <textarea
              autoFocus
              rows={3}
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced lock set and oiled hinges."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none text-white resize-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setResolvingTicket(null); setResolutionNotes(''); }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitResolution}
                className="bg-emerald-500 text-neutral-950 px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
