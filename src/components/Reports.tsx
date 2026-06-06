/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';
import { User } from '../types.js';
import { Star, FileSpreadsheet, Percent, LayoutList, Download, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';

interface ReportsProps {
  currentUser: User;
}

export default function Reports({ currentUser }: ReportsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await apiGet('/api/reports/analytics');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error loading analytics reports', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  function handleTriggerCSVExport() {
    if (!data) return;

    let csvContent = 'VendorBridge Analytics Report\n\n';

    // 1. KPIs
    csvContent += `Total Spend,$${data.total_spend}\n`;
    csvContent += `Total Vendors,${data.total_vendors}\n`;
    csvContent += `Total RFQs,${data.total_rfqs}\n`;
    csvContent += `Total POs,${data.total_pos}\n`;
    csvContent += `Pending Approvals,${data.pending_approvals}\n\n`;

    // 2. Monthly Spend
    csvContent += '--- Monthly Spend ---\n';
    csvContent += 'Month,Amount\n';
    data.monthly_spend?.forEach((row: any) => {
      csvContent += `${row.month},${row.amount}\n`;
    });
    csvContent += '\n';

    // 3. Category Spend
    csvContent += '--- Top Categories ---\n';
    csvContent += 'Category,Spend\n';
    data.top_categories?.forEach((row: any) => {
      const safeCat = row.category ? `"${row.category.replace(/"/g, '""')}"` : '""';
      csvContent += `${safeCat},${row.spend}\n`;
    });
    csvContent += '\n';

    // 4. RFQ Status Breakdown
    csvContent += '--- RFQ Status Breakdown ---\n';
    csvContent += 'Status,Count\n';
    if (data.rfq_status_breakdown) {
      Object.entries(data.rfq_status_breakdown).forEach(([status, count]) => {
        csvContent += `${status},${count}\n`;
      });
    }
    csvContent += '\n';

    // 5. Vendor Performance
    csvContent += '--- Supplier Performance Metrics ---\n';
    csvContent += 'Vendor ID,Vendor Name,Historic Rating,Total POs,On-Time Delivery,Status,Risk Level\n';
    
    data.vendor_performance?.forEach((row: any) => {
      const safeName = row.name ? `"${row.name.replace(/"/g, '""')}"` : '""';
      csvContent += `${row.vendor_id},${safeName},${row.rating},${row.orders},${row.on_time}%,${row.status},${row.risk}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VendorBridge_Analytics_Full_Report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
      </div>
    );
  }

  const reports = data || {
    monthly_spend: [],
    vendor_performance: [],
    rfq_status_breakdown: {},
    top_categories: [],
    total_vendors: 5,
    total_rfqs: 3,
    total_pos: 0,
    total_spend: 0,
    pending_approvals: 0
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Header with trigger actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text1">Advanced ERP Analytics dashboards</h2>
          <p className="text-sm text-text2">Integrate category spends, supplier rating indexes, & historic delivery velocities</p>
        </div>

        <button
          type="button"
          onClick={handleTriggerCSVExport}
          className="bg-accent2 hover:bg-accent2/90 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" /> CSV Export Performance stats
        </button>
      </div>

      {/* Grid: Spend trends + performance rating metrics scale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly spend graph panel */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 lg:col-span-2 space-y-5">
          <div>
            <h3 className="font-bold text-text1 text-md">General Procurement Spending</h3>
            <p className="text-xs text-text2">Dispensed invoices and financial ledger cycle reviews</p>
          </div>

          <div className="h-56 flex items-end justify-between pt-6 px-1 border-b border-border1/60 pb-2 relative">
            <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-border1/40 pointer-events-none" />
            <div className="absolute left-0 right-0 top-2/4 border-t border-dashed border-border1/40 pointer-events-none" />
            <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-border1/40 pointer-events-none" />

            {reports.monthly_spend && reports.monthly_spend.map((item: any, idx: number) => {
              const maxSpend = Math.max(...(reports.monthly_spend.map((i: any) => i.amount) || [1000000]));
              const heightPct = maxSpend > 0 ? (item.amount / maxSpend) * 85 : 0;
              
              return (
                <div key={idx} className="flex flex-col items-center flex-1 relative group z-10">
                  <span className="text-[10px] font-mono font-bold text-accent1 absolute -top-6 bg-bg3 border border-border1 py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.amount.toLocaleString()}
                  </span>
                  
                  <div className="w-12 bg-bg3/65 rounded-t-xl overflow-hidden flex items-end h-40">
                    <div 
                      style={{ height: `${Math.max(heightPct, 4)}%` }} 
                      className="w-full bg-gradient-to-t from-accent2/40 to-accent1 rounded-t-lg transition-all"
                    />
                  </div>
                  <span className="text-xs font-bold text-text2 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories spend breakdown donut chart replacement block */}
        <div className="bg-bg2 border border-border1 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-text1 text-md">Spend Categories Weight</h3>
            <p className="text-xs text-text2 mb-4">Total dollar amount of contract lines grouped by industry</p>

            <div className="space-y-4">
              {reports.top_categories && reports.top_categories.map((c: any, i: number) => {
                const totalCSpend = reports.top_categories.reduce((acc: any, i: any) => acc + i.spend, 0);
                const percent = totalCSpend > 0 ? Math.round((c.spend / totalCSpend) * 100) : 0;
                
                const themeColors = [
                  'bg-accent1 text-accent1',
                  'bg-accent2 text-accent2',
                  'bg-orange1 text-orange1',
                  'bg-green1 text-green1',
                  'bg-yellow1 text-yellow1'
                ];
                const activeColor = themeColors[i % themeColors.length];

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text2 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${activeColor.split(' ')[0]}`} />
                        {c.category}
                      </span>
                      <span className="text-text1 font-mono">${c.spend.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-bg3 h-2 rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className={`h-full rounded-full ${activeColor.split(' ')[0]}`} />
                    </div>
                  </div>
                );
              })}

              {(!reports.top_categories || reports.top_categories.length === 0) && (
                <p className="text-xs text-text3 italic text-center py-10">No categories spends recorded yet</p>
              )}
            </div>
          </div>

          <div className="bg-bg3 border border-border1 rounded-xl p-3 text-[11px] leading-relaxed text-text2">
            Spend trends auto-refresh on PO/Invoice sign-off transactions.
          </div>
        </div>

      </div>

      {/* Supplier metrics rating table registry */}
      <div className="bg-bg2 border border-border1 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="font-bold text-text1 text-md">Supplier Performance Index</h3>
          <p className="text-xs text-text2">Contrasting historic rating parameters, risk parameters, on-time parameters, and total pipeline orders processed</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border1 bg-bg3/40 font-bold text-text2 uppercase tracking-wider">
                <th className="py-3 px-4">Supplier Profile</th>
                <th className="py-3 px-4 text-center">Fulfill Orders</th>
                <th className="py-3 px-4 text-center">Historic Rating</th>
                < th className="py-3 px-4 text-center">On-Time contract rate</th>
                <th className="py-3 px-4 text-center">Operational risk</th>
                <th className="py-3 px-4 text-center">Status state</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border1">
              {reports.vendor_performance && reports.vendor_performance.map((v: any, index: number) => {
                
                const riskStyles: Record<string, string> = {
                  'Low': 'bg-green1/10 text-green1 border-green1/20',
                  'Medium': 'bg-orange1/10 text-orange1 border-orange1/20',
                  'High': 'bg-red1/10 text-red1 border-red1/20 font-bold animate-pulse'
                };

                return (
                  <tr key={index} className="hover:bg-bg3/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-text1 text-sm">{v.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-text1">
                      {v.orders} dispatch{v.orders !== 1 && 'es'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-mono text-text1 font-bold">{v.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-extrabold text-text1">
                      <span className={v.on_time >= 95 ? 'text-green1' : v.on_time >= 90 ? 'text-text1' : 'text-orange1'}>
                        {v.on_time}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block py-0.5 px-2 rounded-full border text-[10px] uppercase font-bold ${riskStyles[v.risk] || ''}`}>
                        {v.risk} Risk
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block py-0.2 px-1.5 rounded border text-[9px] font-bold ${
                        v.status === 'Active' ? 'bg-green1/10 text-green1 border-green1/30' : 'bg-red1/15 text-red1 border-red1/30'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
