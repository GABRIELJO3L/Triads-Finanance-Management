import React, { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import { formatINR } from '../utils/format';
import { useApp } from '../context/AppContext';
import MonthSelector from '../components/MonthSelector';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const categoryIcons = {
  'Poster': '🖼️',
  'Video': '🎬',
  'Social Media Marketing': '📱',
  'Other': '📦',
};

const categoryColors = {
  'Poster': 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/20',
  'Video': 'from-purple-600/20 to-purple-900/10 border-purple-500/20',
  'Social Media Marketing': 'from-amber-600/20 to-amber-900/10 border-amber-500/20',
  'Other': 'from-slate-600/20 to-slate-900/10 border-slate-500/20',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e2035] border border-white/10 rounded-xl p-3 shadow-xl">
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

export default function Categories() {
  const { selectedMonth } = useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/categories?month=${selectedMonth}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Work Categories</h1>
          <p className="text-slate-400 text-sm mt-1">See which services bring in the most profit</p>
        </div>
        <MonthSelector />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.map(cat => {
              const revenue = parseFloat(cat.revenue) || 0;
              const cost = parseFloat(cat.cost) || 0;
              const profit = revenue - cost;
              const marginPct = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

              return (
                <div key={cat.category} className={`card bg-gradient-to-br ${categoryColors[cat.category] || categoryColors['Other']}`}>
                  <div className="text-3xl mb-3">{categoryIcons[cat.category] || '📦'}</div>
                  <h3 className="text-white font-semibold mb-4">{cat.category}</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Revenue</span>
                      <span className="text-emerald-400 font-bold text-sm">{formatINR(revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Cost</span>
                      <span className="text-red-400 font-bold text-sm">{formatINR(cost)}</span>
                    </div>
                    <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-medium">Profit</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}{formatINR(profit)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Margin</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${parseFloat(marginPct) >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {marginPct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Projects</span>
                      <span className="text-slate-300 font-medium text-xs">{cat.project_count || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison chart */}
          {data.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-6">Revenue vs Cost Comparison</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cost" name="Cost" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.length === 0 && (
            <div className="card text-center py-16">
              <Briefcase size={48} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No category data yet for this month</p>
              <p className="text-slate-600 text-sm mt-1">Log projects under clients to see data here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
