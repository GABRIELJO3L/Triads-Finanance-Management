import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Search } from 'lucide-react';
import axios from 'axios';
import { formatINR } from '../utils/format';
import { useApp } from '../context/AppContext';
import MonthSelector from '../components/MonthSelector';
import Modal from '../components/Modal';

function AddClientModal({ isOpen, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/clients', form);
      onAdded();
      onClose();
      setForm({ name: '', contact_person: '', email: '', phone: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Client">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Company / Client Name *</label>
          <input className="input" placeholder="e.g. Acme Corp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Contact Person</label>
          <input className="input" placeholder="e.g. Rahul Sharma" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="e.g. rahul@acme.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Clients() {
  const { selectedMonth } = useApp();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const fetchClients = () => {
    setLoading(true);
    axios.get(`/api/clients?month=${selectedMonth}`)
      .then(res => setClients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, [selectedMonth]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} active clients</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          <button onClick={() => setShowAddModal(true)} className="btn-primary whitespace-nowrap">
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-10"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 text-lg mb-2">No clients found</p>
          <p className="text-slate-600 text-sm mb-5">Add your first client to get started</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary mx-auto">
            <Plus size={16} /> Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(client => {
            const revenue = parseFloat(client.total_charged) || 0;
            const cost = parseFloat(client.total_spent) || 0;
            const margin = revenue - cost;
            const marginPct = revenue > 0 ? ((margin / revenue) * 100).toFixed(0) : 0;

            return (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="card cursor-pointer hover:border-orange-500/50 hover:shadow-orange-950/20 hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm leading-tight">{client.name}</h3>
                      {client.contact_person && <p className="text-slate-500 text-xs mt-0.5">{client.contact_person}</p>}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-orange-400 transition-colors mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#000000] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Given</p>
                    <p className="text-emerald-400 font-bold text-sm">{formatINR(revenue)}</p>
                  </div>
                  <div className="bg-[#000000] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Spent</p>
                    <p className="text-red-400 font-bold text-sm">{formatINR(cost)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-slate-500 text-xs">Net Margin</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {margin >= 0 ? '+' : ''}{formatINR(margin)}
                    </span>
                    <span className={`text-xs ${margin >= 0 ? 'badge-green' : 'badge-red'}`}>
                      {marginPct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdded={fetchClients} />
    </div>
  );
}
