import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Printer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatINR, getMonthName } from '../utils/format';
import { useApp } from '../context/AppContext';
import MonthSelector from '../components/MonthSelector';
import Modal from '../components/Modal';
import { format } from 'date-fns';

function AddMiscModal({ isOpen, onClose, onAdded, month }) {
  const [form, setForm] = useState({ description: '', amount: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/misc-expenses', { ...form, month });
      onAdded();
      onClose();
      setForm({ description: '', amount: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Miscellaneous Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Description *</label>
          <input className="input" placeholder="e.g. Office rent, Adobe subscription..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div>
          <label className="label">Amount (₹) *</label>
          <input className="input" type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SummaryRow({ label, value, subText, highlight, bold }) {
  const isPositive = parseFloat(value) >= 0;
  return (
    <div className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${highlight ? (isPositive ? 'bg-emerald-950/30' : 'bg-red-950/30') + ' -mx-6 px-6 rounded-xl' : ''}`}>
      <div>
        <p className={`text-sm ${bold ? 'text-white font-semibold' : 'text-slate-400'}`}>{label}</p>
        {subText && <p className="text-xs text-slate-600 mt-0.5">{subText}</p>}
      </div>
      <p className={`font-bold ${bold ? 'text-lg' : 'text-sm'} ${highlight ? (isPositive ? 'text-emerald-400' : 'text-red-400') : isPositive ? 'text-white' : 'text-red-400'}`}>
        {highlight && isPositive ? '+' : ''}{formatINR(value)}
      </p>
    </div>
  );
}

export default function Reports() {
  const { selectedMonth } = useApp();
  const [report, setReport] = useState(null);
  const [miscExpenses, setMiscExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMiscModal, setShowMiscModal] = useState(false);
  const printRef = useRef();
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/reports/summary?month=${selectedMonth}`),
      axios.get(`/api/misc-expenses?month=${selectedMonth}`),
    ]).then(([r, m]) => {
      setReport(r.data);
      setMiscExpenses(m.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [selectedMonth]);

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Finance Report - ${getMonthName(selectedMonth)}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a2e; background: white; }
            h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 4px; }
            h2 { font-size: 16px; color: #4f5a7a; font-weight: normal; margin-bottom: 30px; }
            .section { margin-bottom: 28px; }
            .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7bac; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .row.bold { font-weight: 700; background: #f8fafc; padding: 10px 8px; border-radius: 6px; }
            .green { color: #059669; }
            .red { color: #dc2626; }
            .logo { font-size: 20px; font-weight: 800; color: #4f46e5; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #94a3b8; margin-bottom: 24px; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="logo">Triads Finance</div>
          <div class="meta">Internal Finance Report · Printed on ${new Date().toLocaleDateString('en-IN')}</div>
          ${printContent}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const totalMisc = miscExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalSalary = parseFloat(report?.total_salary) || 0;
  const totalAdvance = parseFloat(report?.total_advance) || 0;
  const clientRevenue = parseFloat(report?.total_revenue) || 0;
  const clientCosts = parseFloat(report?.total_client_costs) || 0;
  const totalExpenses = clientCosts + totalSalary + totalMisc;
  const netProfit = clientRevenue - totalExpenses;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Monthly Report</h1>
          <p className="text-slate-400 text-sm mt-1">Complete financial summary for {getMonthName(selectedMonth)}</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector />
          <button onClick={handlePrint} className="btn-secondary">
            <Printer size={16} /> Print / PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main report */}
          <div className="lg:col-span-2 space-y-5" ref={printRef}>
            <div className="print-section">
              <div className="section-title print-only" style={{ display: 'none' }}>Monthly Report — {getMonthName(selectedMonth)}</div>
            </div>

            {/* Income */}
            <div className="card">
              <h2 className="section-title text-emerald-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Income
              </h2>
              <SummaryRow label="Total Client Revenue" value={clientRevenue} subText="All projects billed to clients" />
              <div className="mt-3 pt-2">
                <SummaryRow label="Total Income" value={clientRevenue} bold />
              </div>
            </div>

            {/* Expenses */}
            <div className="card">
              <h2 className="section-title text-red-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Expenses
              </h2>
              <SummaryRow label="Client Direct Costs" value={-clientCosts} subText="Ad spend, assets, tools for clients" />
              <SummaryRow label="Salary Paid" value={-totalSalary} subText={`${report?.employees_paid || 0} employees paid`} />
              {totalAdvance > 0 && (
                <SummaryRow label="Salary Advances" value={-totalAdvance} subText="Advance salary collected by employees" />
              )}
              <SummaryRow label="Miscellaneous Expenses" value={-totalMisc} subText="Rent, subscriptions, tools etc." />
              <div className="mt-3 pt-2">
                <SummaryRow label="Total Expenses" value={-totalExpenses} bold />
              </div>
            </div>

            {/* Net P&L */}
            <div className={`card ${netProfit >= 0 ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-red-500/30 bg-red-950/20'}`}>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white font-bold text-lg">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</p>
                  <p className="text-slate-500 text-sm">Revenue − All Expenses</p>
                </div>
                <p className={`text-4xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netProfit >= 0 ? '+' : ''}{formatINR(netProfit)}
                </p>
              </div>
            </div>

            {/* Client-wise breakdown */}
            {report?.clients && report.clients.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-4">Client-wise Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="table-head">Client</th>
                        <th className="table-head text-right">Amount Given</th>
                        <th className="table-head text-right">Costs</th>
                        <th className="table-head text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.clients.map(client => {
                        const m = (parseFloat(client.charged) || 0) - (parseFloat(client.spent) || 0);
                        return (
                          <tr key={client.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="table-cell">
                              <span 
                                className="text-white hover:text-orange-400 cursor-pointer font-medium transition-colors"
                                onClick={() => navigate(`/clients/${client.id}`)}
                              >
                                {client.name}
                              </span>
                            </td>
                            <td className="table-cell text-right text-emerald-400">{formatINR(client.charged)}</td>
                            <td className="table-cell text-right text-red-400">{formatINR(client.spent)}</td>
                            <td className="table-cell text-right">
                              <span className={`font-bold ${m >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {m >= 0 ? '+' : ''}{formatINR(m)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Misc expenses */}
          <div className="space-y-5">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Misc Expenses</h2>
                <button onClick={() => setShowMiscModal(true)} className="text-indigo-400 hover:text-indigo-300 p-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors">
                  <Plus size={16} />
                </button>
              </div>

              {miscExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">No misc expenses yet</p>
                  <button onClick={() => setShowMiscModal(true)} className="text-indigo-400 text-xs mt-2 hover:underline">Add one</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {miscExpenses.map(exp => (
                    <div key={exp.id} className="flex items-start justify-between p-3 bg-[#12131f] rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{exp.description}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-red-400 font-bold text-sm whitespace-nowrap">{formatINR(exp.amount)}</span>
                        <button onClick={async () => { await axios.delete(`/api/misc-expenses/${exp.id}`); fetchData(); }} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-slate-400 text-sm font-medium">Total</span>
                    <span className="text-red-400 font-bold">{formatINR(totalMisc)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="card space-y-3">
              <h2 className="section-title mb-2">Quick Stats</h2>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Gross Profit Margin</span>
                <span className={`font-bold ${clientRevenue > clientCosts ? 'text-emerald-400' : 'text-red-400'}`}>
                  {clientRevenue > 0 ? (((clientRevenue - clientCosts) / clientRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Net Profit Margin</span>
                <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {clientRevenue > 0 ? ((netProfit / clientRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Salary % of Revenue</span>
                <span className="text-amber-400 font-bold">
                  {clientRevenue > 0 ? ((totalSalary / clientRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Active Clients</span>
                <span className="text-white font-bold">{report?.client_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddMiscModal
        isOpen={showMiscModal}
        onClose={() => setShowMiscModal(false)}
        onAdded={fetchData}
        month={selectedMonth}
      />
    </div>
  );
}
