import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';
import { formatINR, getProfitClass } from '../utils/format';
import { useApp } from '../context/AppContext';
import MonthSelector from '../components/MonthSelector';
import Modal from '../components/Modal';
import { format } from 'date-fns';

const CATEGORIES = ['Poster', 'Video', 'Social Media Marketing', 'Other'];

function AddProjectModal({ isOpen, onClose, clientId, onAdded }) {
  const defaultDate = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    project_name: '', category: 'Poster', amount_charged: '',
    cost_incurred: '', date: defaultDate, notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/clients/${clientId}/projects`, form);
      onAdded();
      onClose();
      setForm({ project_name: '', category: 'Poster', amount_charged: '', cost_incurred: '', date: defaultDate, notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log New Project / Task">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Project / Task Name *</label>
          <input className="input" placeholder="e.g. April Social Media Posters" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount Given (₹) *</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.amount_charged} onChange={e => setForm({ ...form, amount_charged: e.target.value })} required />
          </div>
          <div>
            <label className="label">Cost Incurred (₹)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.cost_incurred} onChange={e => setForm({ ...form, cost_incurred: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Date *</label>
          <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Log Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditProjectModal({ isOpen, onClose, project, onUpdated }) {
  const [form, setForm] = useState({
    project_name: '', category: 'Poster', amount_charged: '',
    cost_incurred: '', date: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when project changes or modal opens
  useEffect(() => {
    if (project && isOpen) {
      setForm({
        project_name: project.project_name || '',
        category: project.category || 'Poster',
        amount_charged: project.amount_charged || '',
        cost_incurred: project.cost_incurred || '',
        date: project.date ? format(new Date(project.date), 'yyyy-MM-dd') : '',
        notes: project.notes || ''
      });
      setError('');
    }
  }, [project, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.put(`/api/projects/${project.id}`, form);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project / Task">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Project / Task Name *</label>
          <input className="input" placeholder="e.g. April Social Media Posters" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount Given (₹) *</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.amount_charged} onChange={e => setForm({ ...form, amount_charged: e.target.value })} required />
          </div>
          <div>
            <label className="label">Cost Incurred (₹)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.cost_incurred} onChange={e => setForm({ ...form, cost_incurred: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Date *</label>
          <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const categoryColors = {
  'Poster': 'bg-cyan-500/20 text-cyan-400',
  'Video': 'bg-purple-500/20 text-purple-400',
  'Social Media Marketing': 'bg-amber-500/20 text-amber-400',
  'Other': 'bg-slate-500/20 text-slate-400',
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedMonth } = useApp();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/clients/${id}`),
      axios.get(`/api/clients/${id}/projects?month=${selectedMonth}`),
    ]).then(([c, p]) => {
      setClient(c.data);
      setProjects(p.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id, selectedMonth]);

  const deleteProject = async (projectId) => {
    if (!confirm('Delete this project entry?')) return;
    await axios.delete(`/api/projects/${projectId}`);
    fetchData();
  };

  const totalCharged = projects.reduce((s, p) => s + (parseFloat(p.amount_charged) || 0), 0);
  const totalCost = projects.reduce((s, p) => s + (parseFloat(p.cost_incurred) || 0), 0);
  const margin = totalCharged - totalCost;
  const marginPct = totalCharged > 0 ? ((margin / totalCharged) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{client?.name || 'Loading...'}</h1>
            {client?.contact_person && <p className="text-slate-400 text-sm mt-0.5">{client.contact_person} · {client.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          <button onClick={() => setShowAddProject(true)} className="btn-primary">
            <Plus size={16} /> Log Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="stat-card">
              <p className="text-slate-400 text-sm mb-2">Total Amount Given</p>
              <p className="text-3xl font-bold text-emerald-400">{formatINR(totalCharged)}</p>
            </div>
            <div className="stat-card">
              <p className="text-slate-400 text-sm mb-2">Direct Costs</p>
              <p className="text-3xl font-bold text-red-400">{formatINR(totalCost)}</p>
            </div>
            <div className={`stat-card ${margin >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <p className="text-slate-400 text-sm mb-2">Net Margin</p>
              <p className={`text-3xl font-bold ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {margin >= 0 ? '+' : ''}{formatINR(margin)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{marginPct}% margin</p>
            </div>
          </div>

          {/* Projects table */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Projects & Tasks</h2>
              <span className="text-slate-500 text-sm">{projects.length} entries</span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-2">No projects logged this month</p>
                <button onClick={() => setShowAddProject(true)} className="btn-primary mx-auto mt-3">
                  <Plus size={16} /> Log First Project
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="table-head">Project</th>
                      <th className="table-head">Category</th>
                      <th className="table-head">Date</th>
                      <th className="table-head text-right">Given</th>
                      <th className="table-head text-right">Cost</th>
                      <th className="table-head text-right">Profit</th>
                      <th className="table-head"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => {
                      const p = (parseFloat(project.amount_charged) || 0) - (parseFloat(project.cost_incurred) || 0);
                      return (
                        <tr key={project.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                          <td className="table-cell">
                            <div>
                              <p className="text-white font-medium">{project.project_name}</p>
                              {project.notes && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{project.notes}</p>}
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[project.category] || categoryColors['Other']}`}>
                              {project.category}
                            </span>
                          </td>
                          <td className="table-cell text-slate-400">{new Date(project.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="table-cell text-right text-emerald-400 font-medium">{formatINR(project.amount_charged)}</td>
                          <td className="table-cell text-right text-red-400 font-medium">{formatINR(project.cost_incurred)}</td>
                          <td className="table-cell text-right">
                            <span className={`font-bold ${p >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {p >= 0 ? '+' : ''}{formatINR(p)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingProject(project)} className="text-slate-600 hover:text-indigo-400 transition-colors" title="Edit project">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => deleteProject(project.id)} className="text-slate-600 hover:text-red-400 transition-colors" title="Delete project">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <AddProjectModal isOpen={showAddProject} onClose={() => setShowAddProject(false)} clientId={id} onAdded={fetchData} />
      <EditProjectModal isOpen={!!editingProject} onClose={() => setEditingProject(null)} project={editingProject} onUpdated={fetchData} />
    </div>
  );
}
