import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users, UserCheck, Briefcase } from 'lucide-react';
import axios from 'axios';
import { formatINR } from '../utils/format';
import Modal from '../components/Modal';

// ─── Client CRUD ──────────────────────────────────────────────────────────────
function ClientModal({ isOpen, onClose, client, onSaved }) {
  const isEdit = !!client;
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) setForm({ name: client.name || '', contact_person: client.contact_person || '', email: client.email || '', phone: client.phone || '' });
    else setForm({ name: '', contact_person: '', email: '', phone: '' });
    setError('');
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) await axios.put(`/api/clients/${client.id}`, form);
      else await axios.post('/api/clients', form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Client' : 'Add Client'}>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Client Name *</label>
          <input className="input" placeholder="Company or client name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Contact Person</label>
          <input className="input" placeholder="Point of contact" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="email@co.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="+91 ..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Employee CRUD ────────────────────────────────────────────────────────────
function EmployeeModal({ isOpen, onClose, employee, onSaved }) {
  const isEdit = !!employee;
  const [form, setForm] = useState({ name: '', role: '', monthly_salary: '', joining_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) setForm({ name: employee.name || '', role: employee.role || '', monthly_salary: employee.monthly_salary || '', joining_date: employee.joining_date?.split('T')[0] || '' });
    else setForm({ name: '', role: '', monthly_salary: '', joining_date: '' });
    setError('');
  }, [employee, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) await axios.put(`/api/employees/${employee.id}`, form);
      else await axios.post('/api/employees', form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Employee' : 'Add Employee'}>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" placeholder="e.g. Priya Patel" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Role / Designation</label>
          <input className="input" placeholder="e.g. Graphic Designer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
        </div>
        <div>
          <label className="label">Monthly Salary (₹) *</label>
          <input className="input" type="number" min="0" placeholder="0" value={form.monthly_salary} onChange={e => setForm({ ...form, monthly_salary: e.target.value })} required />
        </div>
        <div>
          <label className="label">Joining Date</label>
          <input className="input" type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isEdit ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Settings ────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clientModal, setClientModal] = useState({ open: false, client: null });
  const [employeeModal, setEmployeeModal] = useState({ open: false, employee: null });

  const fetchClients = () => axios.get('/api/clients').then(r => setClients(r.data));
  const fetchEmployees = () => axios.get('/api/employees/all').then(r => setEmployees(r.data));

  useEffect(() => { fetchClients(); fetchEmployees(); }, []);

  const deleteClient = async (id) => {
    if (!confirm('Delete this client and all their data?')) return;
    await axios.delete(`/api/clients/${id}`);
    fetchClients();
  };

  const deleteEmployee = async (id) => {
    if (!confirm('Delete this employee?')) return;
    await axios.delete(`/api/employees/${id}`);
    fetchEmployees();
  };

  const tabs = [
    { id: 'clients', icon: Users, label: 'Clients' },
    { id: 'employees', icon: UserCheck, label: 'Employees' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage clients, employees, and app settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#141416] border border-white/5 rounded-xl p-1.5 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Clients Tab */}
      {tab === 'clients' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">All Clients ({clients.length})</h2>
            <button onClick={() => setClientModal({ open: true, client: null })} className="btn-primary">
              <Plus size={16} /> Add Client
            </button>
          </div>
          {clients.length === 0 ? (
            <p className="text-slate-500 text-center py-10">No clients yet.</p>
          ) : (
            <div className="space-y-2">
              {clients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-[#000000] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{client.name}</p>
                      <p className="text-slate-500 text-xs">{client.contact_person} {client.email ? `· ${client.email}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setClientModal({ open: true, client })} className="text-slate-500 hover:text-orange-400 p-2 hover:bg-orange-500/10 rounded-lg transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteClient(client.id)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {tab === 'employees' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">All Employees ({employees.length})</h2>
            <button onClick={() => setEmployeeModal({ open: true, employee: null })} className="btn-primary">
              <Plus size={16} /> Add Employee
            </button>
          </div>
          {employees.length === 0 ? (
            <p className="text-slate-500 text-center py-10">No employees yet.</p>
          ) : (
            <div className="space-y-2">
              {employees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-4 bg-[#000000] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{emp.name}</p>
                      <p className="text-slate-500 text-xs">{emp.role || 'Team Member'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-white font-bold text-sm">{formatINR(emp.monthly_salary)}<span className="text-slate-500 font-normal text-xs">/mo</span></p>
                    <button onClick={() => setEmployeeModal({ open: true, employee: emp })} className="text-slate-500 hover:text-orange-400 p-2 hover:bg-orange-500/10 rounded-lg transition-colors">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => deleteEmployee(emp.id)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ClientModal
        isOpen={clientModal.open}
        onClose={() => setClientModal({ open: false, client: null })}
        client={clientModal.client}
        onSaved={fetchClients}
      />
      <EmployeeModal
        isOpen={employeeModal.open}
        onClose={() => setEmployeeModal({ open: false, employee: null })}
        employee={employeeModal.employee}
        onSaved={fetchEmployees}
      />
    </div>
  );
}
