import React, { useEffect, useState } from 'react';
import { Plus, Check, X, IndianRupee, Gift, ArrowDownCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import { formatINR } from '../utils/format';
import { useApp } from '../context/AppContext';
import MonthSelector from '../components/MonthSelector';
import Modal from '../components/Modal';
import { format } from 'date-fns';

function AddBonusModal({ isOpen, onClose, employeeId, employeeName, onAdded }) {
  const [form, setForm] = useState({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/employees/${employeeId}/bonus`, form);
      onAdded();
      onClose();
      setForm({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Bonus for ${employeeName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Amount (₹) *</label>
          <input className="input" type="number" min="0" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="e.g. Performance bonus, Diwali bonus..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Log Bonus'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdvanceModal({ isOpen, onClose, employeeId, employeeName, selectedMonth, onAdded }) {
  const [form, setForm] = useState({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [loading, setLoading] = useState(false);
  const [advances, setAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);

  const fetchAdvances = async () => {
    if (!employeeId || !isOpen) return;
    setLoadingAdvances(true);
    try {
      const res = await axios.get(`/api/employees/${employeeId}/advances?month=${selectedMonth}`);
      setAdvances(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdvances(false);
    }
  };

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchAdvances();
      setForm({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    }
  }, [isOpen, employeeId, selectedMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/employees/${employeeId}/advance`, {
        ...form,
        month: selectedMonth
      });
      onAdded();
      fetchAdvances();
      setForm({ amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAdvance = async (advanceId) => {
    if (!confirm('Delete this advance entry?')) return;
    try {
      await axios.delete(`/api/employees/advance/${advanceId}`);
      onAdded();
      fetchAdvances();
    } catch (err) {
      console.error(err);
    }
  };

  const totalAdvance = advances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Salary Advance — ${employeeName}`}>
      {/* Existing advances list */}
      {advances.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Advances This Month</p>
          <div className="space-y-2">
            {advances.map(adv => (
              <div key={adv.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                <div>
                  <p className="text-amber-400 font-semibold text-sm">{formatINR(adv.amount)}</p>
                  <p className="text-slate-500 text-xs">
                    {new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {adv.description && ` · ${adv.description}`}
                  </p>
                </div>
                <button onClick={() => deleteAdvance(adv.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
            <p className="text-xs text-slate-500">Total Advance</p>
            <p className="text-amber-400 font-bold text-sm">{formatINR(totalAdvance)}</p>
          </div>
        </div>
      )}

      {/* Add new advance form */}
      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Log New Advance</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="e.g. Advance for personal needs..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Date *</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Close</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Log Advance'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default function Employees() {
  const { selectedMonth } = useApp();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bonusModal, setBonusModal] = useState({ open: false, id: null, name: '' });
  const [advanceModal, setAdvanceModal] = useState({ open: false, id: null, name: '' });

  const fetchData = () => {
    setLoading(true);
    axios.get(`/api/employees?month=${selectedMonth}`)
      .then(res => setEmployees(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const toggleSalaryPaid = async (employee) => {
    try {
      await axios.put(`/api/employees/${employee.id}/salary-status`, {
        month: selectedMonth,
        is_paid: !employee.salary_paid,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalSalary = employees.reduce((s, e) => s + (parseFloat(e.monthly_salary) || 0), 0);
  const totalPaid = employees.filter(e => e.salary_paid).reduce((s, e) => s + (parseFloat(e.monthly_salary) || 0), 0);
  const totalBonus = employees.reduce((s, e) => s + (parseFloat(e.bonus_total) || 0), 0);
  const totalAdvance = employees.reduce((s, e) => s + (parseFloat(e.advance_total) || 0), 0);
  const paidCount = employees.filter(e => e.salary_paid).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Employees & Salary</h1>
          <p className="text-slate-400 text-sm mt-1">{employees.length} team members</p>
        </div>
        <MonthSelector />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-slate-400 text-sm mb-2">Total Salary Bill</p>
          <p className="text-2xl font-bold text-white">{formatINR(totalSalary)}</p>
          <p className="text-xs text-slate-500 mt-1">{paidCount} of {employees.length} paid</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-sm mb-2">Salary Paid</p>
          <p className="text-2xl font-bold text-emerald-400">{formatINR(totalPaid)}</p>
          <p className="text-xs text-slate-500 mt-1">This month</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-sm mb-2">Total Advances</p>
          <p className="text-2xl font-bold text-amber-400">{formatINR(totalAdvance)}</p>
          <p className="text-xs text-slate-500 mt-1">Collected in advance</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-sm mb-2">Total Bonuses</p>
          <p className="text-2xl font-bold text-orange-400">{formatINR(totalBonus)}</p>
          <p className="text-xs text-slate-500 mt-1">Extra payments</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Team Members</h2>
          </div>

          {employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No employees added yet.</p>
              <p className="text-slate-600 text-sm mt-1">Add employees from the Settings page.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map(emp => {
                const advanceAmt = parseFloat(emp.advance_total) || 0;
                const salary = parseFloat(emp.monthly_salary) || 0;
                const remaining = salary - advanceAmt;

                return (
                  <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#000000] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-sm">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{emp.name}</p>
                        <p className="text-slate-500 text-xs">{emp.role || 'Team Member'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Monthly Salary</p>
                        <p className="text-white font-bold">{formatINR(emp.monthly_salary)}</p>
                      </div>

                      {advanceAmt > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Advance</p>
                          <p className="text-amber-400 font-bold">-{formatINR(advanceAmt)}</p>
                        </div>
                      )}

                      {advanceAmt > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Balance Due</p>
                          <p className={`font-bold ${remaining >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{formatINR(remaining)}</p>
                        </div>
                      )}

                      {parseFloat(emp.bonus_total) > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Bonus</p>
                          <p className="text-orange-400 font-bold">+{formatINR(emp.bonus_total)}</p>
                        </div>
                      )}

                      <button
                        onClick={() => setAdvanceModal({ open: true, id: emp.id, name: emp.name })}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <ArrowDownCircle size={13} /> Advance
                      </button>

                      <button
                        onClick={() => setBonusModal({ open: true, id: emp.id, name: emp.name })}
                        className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Gift size={13} /> Bonus
                      </button>

                      <button
                        onClick={() => toggleSalaryPaid(emp)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          emp.salary_paid
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-white/10 text-slate-400 hover:bg-white/15'
                        }`}
                      >
                        {emp.salary_paid ? (
                          <><Check size={13} /> Paid</>
                        ) : (
                          <><X size={13} /> Mark Paid</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <AddBonusModal
        isOpen={bonusModal.open}
        onClose={() => setBonusModal({ open: false, id: null, name: '' })}
        employeeId={bonusModal.id}
        employeeName={bonusModal.name}
        onAdded={fetchData}
      />

      <AdvanceModal
        isOpen={advanceModal.open}
        onClose={() => setAdvanceModal({ open: false, id: null, name: '' })}
        employeeId={advanceModal.id}
        employeeName={advanceModal.name}
        selectedMonth={selectedMonth}
        onAdded={fetchData}
      />
    </div>
  );
}
