import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowRight, BarChart2 } from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatINR, getProfitClass } from '../utils/format';
import { useApp } from '../context/AppContext';
import MonthSelector from '../components/MonthSelector';
import { getMonthName } from '../utils/format';




function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="stat-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className={`text-3xl font-bold tracking-tight ${getProfitClass(value)}`}>
        {formatINR(value)}
      </div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#141416] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {formatINR(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { selectedMonth } = useApp();
  const [summary, setSummary] = useState(null);
  const [clientBreakdown, setClientBreakdown] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/dashboard/summary?month=${selectedMonth}`),
      axios.get(`/api/dashboard/clients?month=${selectedMonth}`),
      axios.get(`/api/dashboard/categories?month=${selectedMonth}`),
    ]).then(([s, c, cat]) => {
      setSummary(s.data);
      setClientBreakdown(c.data);
      setCategoryData(cat.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const netProfit = summary ? (parseFloat(summary.total_revenue) - parseFloat(summary.total_expenses)) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here's your financial overview for {getMonthName(selectedMonth)}</p>
        </div>
        <MonthSelector />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              label="Total Revenue"
              value={summary?.total_revenue || 0}
              sub="Income from all clients"
              icon={TrendingUp}
              color="bg-emerald-600"
            />
            <StatCard
              label="Total Expenses"
              value={-(summary?.total_expenses || 0)}
              sub="Costs + Salaries + Misc"
              icon={TrendingDown}
              color="bg-red-600"
            />
            <div className={`stat-card flex flex-col gap-3 ${netProfit >= 0 ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-red-500/20 bg-red-950/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Net Profit / Loss</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  <DollarSign size={18} className="text-white" />
                </div>
              </div>
              <div className={`text-3xl font-bold tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netProfit >= 0 ? '+' : ''}{formatINR(netProfit)}
              </div>
              <p className="text-xs text-slate-500">{netProfit >= 0 ? '🎉 Profitable month!' : '⚠️ Loss this month'}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Category bar chart */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={18} className="text-orange-400" />
                <h2 className="section-title">Revenue by Category</h2>
              </div>
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No data for this month</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="#ea580c" />
                    <Bar dataKey="cost" name="Cost" radius={[6, 6, 0, 0]} fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Client breakdown */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-orange-400" />
                <h2 className="section-title">Client Snapshot</h2>
              </div>
              <button onClick={() => navigate('/clients')} className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1 transition-colors">
                View all <ArrowRight size={14} />
              </button>
            </div>

            {clientBreakdown.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No client data for this month. <button onClick={() => navigate('/clients')} className="text-indigo-400 hover:underline">Add projects</button></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="table-head">Client</th>
                      <th className="table-head text-right">Given</th>
                      <th className="table-head text-right">Spent</th>
                      <th className="table-head text-right">Margin</th>
                      <th className="table-head"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientBreakdown.map((client) => {
                      const margin = (parseFloat(client.charged) || 0) - (parseFloat(client.spent) || 0);
                      return (
                        <tr key={client.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="table-cell">
                            <div 
                              className="flex items-center gap-3 cursor-pointer group"
                              onClick={() => navigate(`/clients/${client.id}`)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-sm group-hover:bg-orange-600/40 transition-colors">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-white font-medium group-hover:text-orange-400 transition-colors">{client.name}</span>
                            </div>
                          </td>
                          <td className="table-cell text-right text-emerald-400 font-medium">{formatINR(client.charged)}</td>
                          <td className="table-cell text-right text-red-400 font-medium">{formatINR(client.spent)}</td>
                          <td className="table-cell text-right">
                            <span className={`font-bold ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {margin >= 0 ? '+' : ''}{formatINR(margin)}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <button onClick={() => navigate(`/clients/${client.id}`)} className="text-slate-500 hover:text-orange-400 transition-colors">
                              <ArrowRight size={16} />
                            </button>
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
    </div>
  );
}
