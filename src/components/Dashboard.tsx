/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';
import { User, ActivityLog } from '../types.js';
import { Layers, ShieldAlert, TrendingUp, Users, DollarSign, ArrowUpRight, CheckCircle2, Clock, MapPin, Award } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  navigateTab: (tab: string) => void;
}

export default function Dashboard({ currentUser, navigateTab }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatsAndLogs() {
      try {
        const [statsRes, logsRes, budgetsRes, healthRes] = await Promise.all([
          apiGet('/api/reports/analytics'),
          apiGet('/api/reports/logs'),
          apiGet('/api/budgets/summary'),
          apiGet('/api/reports/health-score')
        ]);
        if (statsRes.success) setData(statsRes.data);
        if (logsRes.success) setLogs(logsRes.data.slice(0, 5)); // show latest 5
        if (budgetsRes.success) setBudgets(budgetsRes.data);
        if (healthRes.success) setHealthScore(healthRes.score);
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStatsAndLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data || {
    total_vendors: 5,
    total_rfqs: 3,
    total_pos: 0,
    total_spend: 0,
    pending_approvals: 1,
    rfq_status_breakdown: {},
    top_categories: [],
    monthly_spend: []
  };

  const hasPending = stats.pending_approvals > 0;

  return (
    <div className="p-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-bg2 border border-border1 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent1/5 rounded-full blur-[60px] pointer-events-none" />
        <div>
          <h2 className="text-2xl font-bold text-text1">Welcome back, {currentUser.name}!</h2>
          <p className="text-text2 text-sm mt-1">
            Access level: <span className="text-accent1 font-medium select-none capitalize">{currentUser.role.replace('_', ' ')}</span>. 
            Monitor performance metrics, authorize bids and expedite purchase pipelines seamlessly.
          </p>
        </div>
        {currentUser.role !== 'vendor' && (
          <button
            onClick={() => navigateTab('rfqs')}
            className="mt-4 md:mt-0 bg-accent1 hover:bg-accent1/90 text-white font-medium text-sm py-2 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Create New RFQ <ArrowUpRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Features (Health & Budgets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Procurement Health Score Widget */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
          <h3 className="font-semibold text-text1 text-md mb-4 self-start">Procurement Health Score</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Circle Background */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-bg3" />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={`${healthScore * 2.51} 251.2`} 
                strokeLinecap="round"
                className={`${healthScore >= 80 ? 'text-green1' : healthScore >= 60 ? 'text-orange1' : 'text-red1'} transition-all duration-1000`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${healthScore >= 80 ? 'text-green1' : healthScore >= 60 ? 'text-orange1' : 'text-red1'}`}>
                {healthScore}
              </span>
            </div>
          </div>
          <p className="text-xs text-text2 mt-4 text-center">Score computed from delivery %, vendor ratings, and budget discipline.</p>
        </div>

        {/* Budget Tracker Widget */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-text1 text-md">Budget Utilization (Q2 2026)</h3>
              <p className="text-xs text-text2">Spend vs Budget allocation by Department</p>
            </div>
            <span className="p-2 bg-text1/5 rounded-xl text-text2"><Award className="w-4 h-4" /></span>
          </div>

          <div className="space-y-4 mt-2">
            {budgets.length > 0 ? budgets.map((b, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-text1 font-bold">{b.department}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text2">${b.utilized.toLocaleString()} / ${b.allocated.toLocaleString()}</span>
                    <span className={`py-0.5 px-1.5 rounded text-[10px] uppercase font-bold
                      ${b.status === 'over' ? 'bg-red1/20 text-red1' : 
                        b.status === 'critical' ? 'bg-orange1/20 text-orange1' : 
                        b.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green1/20 text-green1'}
                    `}>
                      {b.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-bg3 h-2 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(b.pct, 100)}%` }} 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      b.status === 'over' ? 'bg-red1' : 
                      b.status === 'critical' ? 'bg-orange1' : 
                      b.status === 'warning' ? 'bg-yellow-500' : 'bg-green1'
                    }`}
                  />
                </div>
              </div>
            )) : <div className="text-xs text-text3 text-center py-4">No budget allocations found.</div>}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Vendors */}
        <div className="bg-bg2 border border-border1 hover:border-accent1/30 hover:shadow-lg hover:shadow-accent1/5 rounded-2xl p-5 transition-all group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-text2 text-xs font-semibold uppercase tracking-wider">Registered Vendors</span>
            <span className="p-2 rounded-xl bg-accent1/10 text-accent1 group-hover:scale-105 transition-all"><Users className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-text1">{stats.total_vendors}</div>
          <div className="text-[11px] text-green1 mt-1 flex items-center gap-0.5">
            100% active status
          </div>
        </div>

        {/* Total RFQs */}
        <div className="bg-bg2 border border-border1 hover:border-accent2/30 hover:shadow-lg hover:shadow-accent2/5 rounded-2xl p-5 transition-all group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-text2 text-xs font-semibold uppercase tracking-wider">Total RFQ Files</span>
            <span className="p-2 rounded-xl bg-accent2/10 text-accent2 group-hover:scale-105 transition-all"><Layers className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-text1">{stats.total_rfqs}</div>
          <div className="text-[11px] text-text3 mt-1">Multi-vendor scope lists</div>
        </div>

        {/* Pending Approvals */}
        <div className={`bg-bg2 border ${hasPending ? 'border-orange1/40 shadow-md shadow-orange1/5' : 'border-border1'} hover:border-orange1/60 rounded-2xl p-5 transition-all group`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-text2 text-xs font-semibold uppercase tracking-wider">Pending Action</span>
            <span className={`p-2 rounded-xl group-hover:scale-105 transition-all ${hasPending ? 'bg-orange1/10 text-orange1 stroke-[2.5]' : 'bg-bg3 text-text3'}`}>
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-text1">{stats.pending_approvals}</div>
          <div className={`text-[11px] mt-1 ${hasPending ? 'text-orange1 font-medium animate-pulse' : 'text-text3'}`}>
            {hasPending ? 'Manager authorization required' : 'All approvals completed'}
          </div>
        </div>

        {/* Total Purchase Orders */}
        <div className="bg-bg2 border border-border1 hover:border-green1/30 hover:shadow-lg hover:shadow-green1/5 rounded-2xl p-5 transition-all group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-text2 text-xs font-semibold uppercase tracking-wider">Active PO Orders</span>
            <span className="p-2 rounded-xl bg-green1/10 text-green1 group-hover:scale-105 transition-all"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-text1">{stats.total_pos}</div>
          <div className="text-[11px] text-text3 mt-1">Dispatched to suppliers</div>
        </div>

        {/* Total Spend */}
        <div className="bg-bg2 border border-border1 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5 rounded-2xl p-5 transition-all group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-text2 text-xs font-semibold uppercase tracking-wider">Cumulative Spend</span>
            <span className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500 group-hover:scale-105 transition-all"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-bold text-text1 truncate">${stats.total_spend.toLocaleString()}</div>
          <div className="text-[11px] text-text3 mt-1">Combined standard invoices</div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Charts Block */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-text1 text-md">Monthly Procurement Spend trend</h3>
              <p className="text-xs text-text2">Visual spend representation across latest 6 ledger cycles</p>
            </div>
            <span className="text-[11px] bg-bg3 border border-border1 text-text2 py-1 px-2.5 rounded-lg font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-accent1" /> Unified Currency (USD)
            </span>
          </div>

          {/* Simple Highly Polished CSS/SVG Bar Chart */}
          <div className="h-48 flex items-end justify-between pt-4 px-2">
            {stats.monthly_spend && stats.monthly_spend.map((item: any, idx: number) => {
              // Find max spend to scale height accurately
              const maxSpend = Math.max(...(stats.monthly_spend.map((i: any) => i.amount) || [1000000]));
              const heightPct = maxSpend > 0 ? (item.amount / maxSpend) * 85 : 0;
              
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  {/* Tooltip value */}
                  <div className="opacity-0 group-hover:opacity-100 bg-bg3 border border-border2 text-[10px] text-text1 py-1 px-2 rounded-lg mb-2 shadow-lg transition-all absolute transform -translate-y-8 pointer-events-none">
                    ${item.amount.toLocaleString()}
                  </div>
                  {/* Visual Bar */}
                  <div className="w-10 sm:w-12 bg-bg3 max-w-[80%] rounded-t-lg relative overflow-hidden flex items-end h-32">
                    <div 
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        idx === stats.monthly_spend.length - 1 
                          ? 'bg-gradient-to-t from-accent2 to-accent1' 
                          : 'bg-gradient-to-t from-border1 to-accent1/60 hover:to-accent1'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-text2 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Top Supplier Categories with Risk Distribution */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-text1 text-md mb-1">Procurement Pipeline Breakdown</h3>
            <p className="text-xs text-text2 mb-4">Core lifecycle workflow segments</p>

            <div className="space-y-3">
              {['Open', 'Quotations Received', 'Under Approval', 'PO Generated', 'Closed'].map((statusKey) => {
                const count = stats.rfq_status_breakdown[statusKey] || 0;
                const pct = stats.total_rfqs > 0 ? (count / stats.total_rfqs) * 100 : 0;
                
                // Color mapping
                const colorMap: Record<string, string> = {
                  'Open': 'bg-accent1',
                  'Quotations Received': 'bg-accent2',
                  'Under Approval': 'bg-orange1',
                  'PO Generated': 'bg-green1',
                  'Closed': 'bg-text3'
                };

                return (
                  <div key={statusKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-text2 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${colorMap[statusKey] || 'bg-text2'}`} />
                        {statusKey}
                      </span>
                      <span className="text-text1">{count} file{count !== 1 && 's'}</span>
                    </div>
                    <div className="w-full bg-bg3 h-1.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className={`h-full rounded-full ${colorMap[statusKey] || 'bg-text2'}`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border1 pt-4 mt-4 flex items-center justify-between text-xs text-text2">
            <span>Critical priorities open:</span>
            <span className="py-0.5 px-2 bg-red1/10 rounded border border-dashed border-red1/40 text-red1 font-bold animate-pulse">
              1 Critical RFQ
            </span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left side: Quick Activity log feed */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-text1 text-md">Audit Activity Log feed</h3>
              <p className="text-xs text-text2">Real-time procurement transactions tracking</p>
            </div>
            <button 
              onClick={() => navigateTab('logs')}
              className="text-xs text-accent1 hover:underline cursor-pointer"
            >
              See all logs
            </button>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-text3 text-center py-4">No audit logs logged in database</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs border-b border-border1 pb-3 last:border-b-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent1 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-text1">{log.action}</span>
                      <span className="text-text3 font-mono">{log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}</span>
                    </div>
                    <p className="text-text2 text-[11px] leading-relaxed">{log.details}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] bg-bg3 text-text2 py-0.5 px-1.5 rounded uppercase font-bold tracking-wide">
                        {log.entity_type} ID: {log.entity_id}
                      </span>
                      <span className="text-[10px] text-text3">by {log.user_name || 'System'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side: Top category spends & ratings */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-text1 text-md">Product Category Distribution</h3>
            <p className="text-xs text-text2">Spends grouped by core company classifications</p>
          </div>

          <div className="space-y-3.5">
            {stats.top_categories && stats.top_categories.length > 0 ? (
              stats.top_categories.map((c: any, index: number) => {
                const totalCSpend = stats.top_categories.reduce((acc: any, i: any) => acc + i.spend, 0);
                const percentage = totalCSpend > 0 ? (c.spend / totalCSpend) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-text1">{c.category}</span>
                      <span className="text-text2">${c.spend.toLocaleString()} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-bg3 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.max(percentage, 3)}%` }} 
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-accent1' : index === 1 ? 'bg-accent2' : 'bg-orange1'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-text3 font-mono">No category spends recorded yet.</p>
                <p className="text-[10px] text-text3 mt-1">Approved invoices trigger category metrics automatically.</p>
              </div>
            )}
          </div>

          {/* Prompt banner for demo purposes */}
          <div className="bg-bg3 border border-border1 rounded-xl p-3 text-[11px] leading-relaxed text-text2 flex gap-2">
            <span className="p-1.5 bg-accent1/10 text-accent1 rounded h-fit"><Clock className="w-3.5 h-3.5" /></span>
            <div>
              <span className="font-semibold text-text1 block">Quick Hackathon Tip:</span>
              Log in as a <span className="text-accent1 font-bold">vendor</span> profile to submit quotes on Open RFQs, then switch to the <span className="text-accent2 font-bold font-mono">admin / manager</span> to authorize!
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
