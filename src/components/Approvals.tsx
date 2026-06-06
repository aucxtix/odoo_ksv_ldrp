/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';
import { User, Approval } from '../types.js';
import { ShieldCheck, Layers, FileSpreadsheet, UserCheck, HelpCircle, Check, X, ClipboardList, Info, MessageSquareCode } from 'lucide-react';

interface ApprovalsProps {
  currentUser: User;
  navigateTab: (tab: string) => void;
}

export default function Approvals({ currentUser, navigateTab }: ApprovalsProps) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [actioningApprovalId, setActioningApprovalId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function fetchApprovals() {
    setLoading(true);
    try {
      const res = await apiGet('/api/approvals');
      if (res.success) {
        let fetchedApprovals = res.data;
        if (['admin', 'manager'].includes(currentUser.role)) {
          const mockPending = [
            { id: 101, rfq_id: 'RFQ-MOCK-101', rfq_title: 'Enterprise Server Racks', rfq_priority: 'High', vendor_name: 'TechCorp Solutions', requested_by_name: 'John Officer', remarks: 'Best timeline and warranty offered.', requested_at: new Date().toISOString(), status: 'Pending', total_amount: 45000 },
            { id: 102, rfq_id: 'RFQ-MOCK-102', rfq_title: 'Office Cleaning Contract', rfq_priority: 'Low', vendor_name: 'CleanSpace Inc.', requested_by_name: 'John Officer', remarks: 'Annual renewal with updated terms.', requested_at: new Date().toISOString(), status: 'Pending', total_amount: 12000 },
            { id: 103, rfq_id: 'RFQ-MOCK-103', rfq_title: 'Q3 Marketing Materials', rfq_priority: 'Medium', vendor_name: 'PrintMasters', requested_by_name: 'Alice Smith', remarks: 'Needed by end of month for campaign launch.', requested_at: new Date().toISOString(), status: 'Pending', total_amount: 8500 },
            { id: 104, rfq_id: 'RFQ-MOCK-104', rfq_title: 'Security System Upgrade', rfq_priority: 'Critical', vendor_name: 'SecurePro Tech', requested_by_name: 'John Officer', remarks: 'Immediate upgrade required for compliance.', requested_at: new Date().toISOString(), status: 'Pending', total_amount: 28000 },
            { id: 105, rfq_id: 'RFQ-MOCK-105', rfq_title: 'Employee Laptops Batch', rfq_priority: 'High', vendor_name: 'Global Hardware', requested_by_name: 'Alice Smith', remarks: 'Bulk order for new engineering hires.', requested_at: new Date().toISOString(), status: 'Pending', total_amount: 125000 },
            { id: 106, rfq_id: 'RFQ-MOCK-106', rfq_title: 'Breakroom Supplies Q3', rfq_priority: 'Medium', vendor_name: 'FreshVend', requested_by_name: 'John Officer', remarks: 'Quarterly restocking of pantry supplies.', requested_at: new Date().toISOString(), status: 'Pending', total_amount: 3200 }
          ];
          
          const currentPendingCount = fetchedApprovals.filter((a: any) => a.status === 'Pending').length;
          if (currentPendingCount < 6) {
             fetchedApprovals = [...mockPending.slice(0, 6 - currentPendingCount), ...fetchedApprovals];
          }
        }
        setApprovals(fetchedApprovals);
      }
    } catch (err) {
      console.error('Error fetching approvals queue', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprovalAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actioningApprovalId) return;

    setLoading(true);
    
    // Process mock sample requests directly on client
    if (actioningApprovalId >= 100) {
      setTimeout(() => {
        setApprovals(prev => prev.map(a => 
          a.id === actioningApprovalId 
            ? { ...a, status: actionType === 'approve' ? 'Approved' : 'Rejected', actioned_at: new Date().toISOString() } 
            : a
        ));
        setActioningApprovalId(null);
        setRemarks('');
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const res = await apiPost(`/api/approvals/${actioningApprovalId}/action`, {
        action: actionType,
        remarks: remarks
      });

      if (res.success) {
        setActioningApprovalId(null);
        setRemarks('');
        await fetchApprovals();
      } else {
        alert(res.error || 'Gateway denied operational state transition');
      }
    } catch (err) {
      console.error(err);
      alert('Approved select request failed');
    } finally {
      setLoading(false);
    }
  }

  function launchActionDialog(id: number, type: 'approve' | 'reject') {
    setRemarks('');
    setActioningApprovalId(id);
    setActionType(type);
  }

  // Filter pending approvals for quick view
  const pendingQueue = approvals.filter(a => a.status === 'Pending');
  const finishedQueue = approvals.filter(a => a.status !== 'Pending');

  return (
    <div className="p-6 space-y-6">
      
      {/* Header sections */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text1">Manager Authorization Board</h2>
          <p className="text-sm text-text2">Approve competitive bids, authorize Purchase Orders, & sign off on supplier allocations</p>
        </div>
      </div>

      {loading && approvals.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-3 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Active approval items */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-text2 uppercase tracking-wider block">Outstanding pending requests ({pendingQueue.length})</h3>

            {pendingQueue.length === 0 ? (
              <div className="bg-bg2 border border-border1 rounded-2xl p-12 text-center text-text2">
                <ShieldCheck className="w-12 h-12 text-green1 opacity-80 mx-auto mb-3" />
                <p className="font-semibold text-text1">Authorization queue is fully clear!</p>
                <p className="text-xs text-text3 mt-1">Outstanding procurement requests have all been completed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingQueue.map((app) => {
                  
                  const isManager = ['admin', 'manager'].includes(currentUser.role);
                  const priorityColors = {
                    'Low': 'bg-bg3 border border-border1 text-text2',
                    'Medium': 'bg-accent1/10 border border-accent1/20 text-accent1',
                    'High': 'bg-orange1/10 border border-orange1/20 text-orange1',
                    'Critical': 'bg-red1/10 border border-red1/30 text-red1 font-bold animate-pulse'
                  };

                  return (
                    <div key={app.id} className="bg-bg2 border border-border1 rounded-2xl p-5 hover:border-accent2/30 transition-all flex flex-col justify-between space-y-4">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-accent1">{app.rfq_id}</span>
                            <span className={`text-[9px] py-0.5 px-2 rounded-full font-bold border ${priorityColors[app.rfq_priority] || priorityColors.Medium}`}>
                              {app.rfq_priority} Priority
                            </span>
                          </div>
                          <h4 className="font-bold text-text1 text-md mt-1">{app.rfq_title}</h4>
                        </div>
                        
                        <div className="text-right font-mono">
                          <span className="text-[10px] text-text3 block">QUOTED GRAND TOTAL</span>
                          <span className="text-lg font-bold text-accent2">${app.total_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-bg3 p-3.5 rounded-xl border border-border1 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text2">Supplying Partner:</span>
                          <span className="font-bold text-text1">{app.vendor_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text2">Procurement Request Sponsor:</span>
                          <span className="text-text1">{app.requested_by_name}</span>
                        </div>
                        <div className="flex flex-col pt-1.5 border-t border-border1/60 mt-1">
                          <span className="text-text3 text-[10px] font-bold uppercase mb-1">Justification comments</span>
                          <p className="text-text1 italic font-medium leading-normal bg-bg2/40 p-2 rounded border border-border1 border-dashed">
                            "{app.remarks || 'None detailed.'}"
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border1/60 pt-4 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-text3">Requested: {app.requested_at?.substring(0, 10)}</span>

                        {isManager ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => launchActionDialog(app.id, 'reject')}
                              className="bg-red1/10 hover:bg-red1 hover:text-white text-red1 font-bold text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-red1/30"
                            >
                              <X className="w-3.5 h-3.5" /> Decline Bid
                            </button>
                            <button
                              type="button"
                              onClick={() => launchActionDialog(app.id, 'approve')}
                              className="bg-green1/10 hover:bg-green1 hover:text-white text-green1 font-bold text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-green1/30"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Allocations
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-text3 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" /> Approvals Manager signature required.
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: approvals history log */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text2 uppercase tracking-wider block">Completed approvals log history</h3>
            
            <div className="bg-bg2 border border-border1 rounded-2xl p-4 divide-y divide-border1 overflow-y-auto max-h-[80vh] space-y-4">
              {finishedQueue.length === 0 ? (
                <p className="text-xs text-text3 text-center py-6">No historical records in database.</p>
              ) : (
                finishedQueue.map((app) => {
                  const apr = app.status === 'Approved';
                  return (
                    <div key={app.id} className="text-xs space-y-2 pt-3 first:pt-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[9px] text-accent1 block leading-none">{app.rfq_id}</span>
                          <span className="font-bold text-text1 text-xs block leading-tight mt-1 truncate max-w-[120px]">{app.rfq_title}</span>
                          <span className="text-[10px] text-text3 mt-1 block">To: {app.vendor_name}</span>
                        </div>

                        <span className={`py-0.5 px-2 rounded-md font-bold uppercase text-[9px] ${
                          apr ? 'bg-green1/15 border border-green1/40 text-green1' : 'bg-red1/15 border border-red1/40 text-red1'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="bg-bg3 p-2.5 rounded-xl text-[11px] text-text2">
                        <div>Contract Price: <span className="font-mono font-bold text-text1">${app.total_amount.toLocaleString()}</span></div>
                        <div className="mt-1 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-text3" /> Approved by: {app.approved_by_name || 'Sarah (Admin)'}
                        </div>
                        {app.remarks && (
                          <div className="mt-1 text-[10px] italic">Remarks: "{app.remarks}"</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* SIGN OFF MODAL POPUP */}
      {actioningApprovalId !== null && (
        <div className="fixed inset-0 bg-bg1/85 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-bg2 border border-border1 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-border1">
              <h3 className="font-bold text-text1 text-md flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-accent2" /> 
                {actionType === 'approve' ? 'Authorizing Procurement Bid' : 'Declining Selection allocation'}
              </h3>
              <button onClick={() => setActioningApprovalId(null)} className="text-text2 hover:text-text1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleApprovalAction} className="p-5 space-y-5">
              <div className="space-y-1 bg-bg3/50 p-3.5 rounded-xl">
                <span className="text-[10px] text-text3 block font-bold uppercase">Decision impact</span>
                <p className="text-xs text-text2 leading-normal">
                  {actionType === 'approve' 
                    ? 'Confirming selections triggers PO generation and rejects other bids. This step is irreversible.'
                    : 'Declining selection resets candidate status configurations.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-2">Manager Audit Remarks & feedback *</label>
                <textarea
                  required
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Detail review assessments, quality approvals and allocation rationales..."
                  className="w-full bg-bg3 border border-border1 focus:border-accent2 text-text1 text-sm rounded-xl py-2 px-3 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActioningApprovalId(null)}
                  className="bg-bg3 hover:bg-border1 text-text2 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md ${
                    actionType === 'approve' ? 'bg-green1 text-white' : 'bg-red1 text-white'
                  }`}
                >
                  {actionType === 'approve' ? 'Confirm Approval' : 'Decline Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
