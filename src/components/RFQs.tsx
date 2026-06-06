/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';
import { User, RFQ, Vendor } from '../types.js';
import { Layers, Plus, Calendar, AlertCircle, Users, ClipboardList, Trash2, Check, ArrowRight, CornerDownRight, HelpCircle, UserPlus, Info } from 'lucide-react';

interface RFQsProps {
  currentUser: User;
  navigateTab: (tab: string, params?: any) => void;
}

export default function RFQs({ currentUser, navigateTab }: RFQsProps) {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab/Screen controllers
  const [viewState, setViewState] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedRfq, setSelectedRfq] = useState<any>(null);

  // RFQ Creation Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [assignedVendors, setAssignedVendors] = useState<number[]>([]);
  const [rfqItems, setRfqItems] = useState<{ name: string; quantity: number | ''; unit: string }[]>([
    { name: '', quantity: '', unit: 'units' }
  ]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRfqsAndVendors();
  }, [viewState]);

  async function fetchRfqsAndVendors() {
    setLoading(true);
    try {
      const [rfqRes, vendorRes] = await Promise.all([
        apiGet('/api/rfq'),
        apiGet('/api/vendors')
      ]);
      if (rfqRes.success) setRfqs(rfqRes.data);
      if (vendorRes.success) setVendors(vendorRes.data);
    } catch (err) {
      console.error('Error fetching RFQ data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleShowDetail(rfqId: string) {
    setLoading(true);
    try {
      const res = await apiGet(`/api/rfq/${rfqId}`);
      if (res.success) {
        setSelectedRfq(res.data);
        setViewState('detail');
      }
    } catch (err) {
      console.error('Error getting single RFQ details', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddRfqItemInput() {
    setRfqItems([...rfqItems, { name: '', quantity: '', unit: 'units' }]);
  }

  function handleRemoveRfqItemInput(idx: number) {
    if (rfqItems.length === 1) return;
    const copied = [...rfqItems];
    copied.splice(idx, 1);
    setRfqItems(copied);
  }

  function handleRfqItemChange(idx: number, field: string, val: any) {
    const copied = [...rfqItems];
    copied[idx] = {
      ...copied[idx],
      [field]: val
    };
    setRfqItems(copied);
  }

  function handleToggleVendorAssign(vendorId: number) {
    if (assignedVendors.includes(vendorId)) {
      setAssignedVendors(assignedVendors.filter(id => id !== vendorId));
    } else {
      setAssignedVendors([...assignedVendors, vendorId]);
    }
  }

  async function handleCreateRFQ(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!title || !deadline || !priority || assignedVendors.length === 0) {
      setFormError('Missing mandatory metadata fields (Title, Deadline, Priority and target suppliers are required)');
      return;
    }

    const validLines = rfqItems.filter(it => it.name && Number(it.quantity) > 0);
    if (validLines.length === 0) {
      setFormError('At least one scoped RFQ item with valid positive quantity is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost('/api/rfq/create', {
        title,
        description,
        deadline,
        priority,
        assigned_vendors: assignedVendors,
        items: validLines
      });

      if (res.success) {
        setViewState('list');
        // Reset form variables
        setTitle('');
        setDescription('');
        setDeadline('');
        setPriority('Medium');
        setAssignedVendors([]);
        setRfqItems([{ name: '', quantity: '', unit: 'units' }]);
      } else {
        setFormError(res.error || 'Failed to submit RFQ');
      }
    } catch (err) {
      setFormError('Network communication error on RFQ dispatch');
    } finally {
      setSubmitting(false);
    }
  }

  // Check if current vendor user has already submitted a quote for the selected/active RFQ
  const hasUserSubmittedQuote = selectedRfq?.quotations?.some(
    (q: any) => q.vendor_id === currentUser.vendor_id && q.status === 'Submitted'
  );

  return (
    <div className="p-6 space-y-6">
      
      {/* ── LIST VIEW SCREEN ── */}
      {viewState === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-text1">Request for Quotation (RFQ) files</h2>
              <p className="text-sm text-text2">Dispense work packages, invite secure vendor quotes, and monitor bidding pools</p>
            </div>

            {['admin', 'procurement_officer'].includes(currentUser.role) && (
              <button
                onClick={() => setViewState('create')}
                className="bg-accent1 hover:bg-accent1/90 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" /> Create New RFQ
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-3 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
            </div>
          ) : rfqs.length === 0 ? (
            <div className="bg-bg2 border border-border1 rounded-2xl p-12 text-center text-text2">
              <Layers className="w-12 h-12 text-text3 mx-auto mb-3" />
              <p className="font-semibold text-text1">No RFQs active in your portal</p>
              <p className="text-xs text-text3 mt-1">If you are a supplier, you will notice files once general officers invite your bid.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rfqs.map((rfq) => {
                const priorityColors = {
                  'Low': 'bg-bg3 border border-border1 text-text2',
                  'Medium': 'bg-accent1/10 border border-accent1/20 text-accent1',
                  'High': 'bg-orange1/10 border border-orange1/20 text-orange1',
                  'Critical': 'bg-red1/10 border border-red1/30 text-red1 font-bold animate-pulse'
                };

                const statusBadges = {
                  'Open': 'bg-green1/10 text-green1 border-green1/30',
                  'Quotations Received': 'bg-accent2/10 text-accent2 border-accent2/30',
                  'Under Approval': 'bg-orange1/10 text-orange1 border-orange1/30',
                  'PO Generated': 'bg-green1/15 text-green1 border-green1/40 font-bold',
                  'Closed': 'bg-bg3 text-text3 border-border2'
                };

                return (
                  <div 
                    key={rfq.id} 
                    className="bg-bg2 border border-border1 hover:border-accent1/30 rounded-2xl p-5 transition-all shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="font-mono text-xs font-bold text-accent1">{rfq.id}</span>
                        <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold border ${priorityColors[rfq.priority]}`}>
                          {rfq.priority} Priority
                        </span>
                      </div>

                      <h3 className="font-bold text-text1 text-md group-hover:text-accent1 transition-all">{rfq.title}</h3>
                      <p className="text-text2 text-xs line-clamp-2 mt-1.5 leading-relaxed">{rfq.description || 'No descriptive summary logged.'}</p>

                      <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-text2">
                        <span className="flex items-center gap-1 bg-bg3 py-1 px-2.5 rounded-lg border border-border1">
                          <Calendar className="w-3.5 h-3.5 text-accent1" /> Deadline: {rfq.deadline}
                        </span>
                        <span className="flex items-center gap-1 bg-bg3 py-1 px-2.5 rounded-lg border border-border1">
                          <ClipboardList className="w-3.5 h-3.5 text-accent2" /> {rfq.items?.length || 0} scope item{(rfq.items?.length !== 1) && 's'}
                        </span>
                        <span className="flex items-center gap-1 bg-bg3 py-1 px-2.5 rounded-lg border border-border1" title={rfq.assigned_vendors?.join(', ')}>
                          <Users className="w-3.5 h-3.5 text-green1" /> {rfq.assigned_vendors?.length || 0} Supplier{(rfq.assigned_vendors?.length !== 1) && 's'} Invited
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-border1 pt-4 mt-4 flex items-center justify-between">
                      <span className={`inline-block text-[10px] py-0.5 px-2 rounded border font-semibold ${statusBadges[rfq.status]}`}>
                        {rfq.status}
                      </span>

                      <button
                        onClick={() => handleShowDetail(rfq.id)}
                        className="text-xs text-accent1 font-bold hover:underline py-1.5 px-3 rounded bg-bg3 hover:bg-bg4 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Launch File panel <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE RFQ FILE PANEL ── */}
      {viewState === 'create' && (
        <div className="max-w-4xl mx-auto bg-bg2 border border-border1 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-border1 bg-bg3/40 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-text1 text-md">Scope New RFQ Specification</h3>
              <p className="text-xs text-text2">Detail metrics, dispatch deadlines, and assign target industry suppliers</p>
            </div>
            <button
              onClick={() => setViewState('list')}
              className="text-xs bg-bg3 hover:bg-bg4 py-1.5 px-3 rounded-lg border border-border1 text-text1 font-bold cursor-pointer transition-all"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="mx-6 mt-4 bg-red1/15 border border-dashed border-red1/40 py-2.5 px-4 rounded-xl text-red1 text-xs text-center font-semibold">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateRFQ} className="p-6 space-y-6">
            
            {/* Metadata inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Proposal/Project Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. FY27 Corporate Desktop Replacement Campaign"
                  className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 text-sm rounded-xl py-2.5 px-4 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Descriptive scope</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detail project specifications, terms of execution, compliance requirements etc."
                  className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 text-sm rounded-xl py-2.5 px-4 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Submission Deadline *</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 text-sm rounded-xl py-2.5 px-4 outline-none transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Order Urgency Priority *</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2.5 px-4 outline-none focus:border-accent1 cursor-pointer"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Emergency</option>
                </select>
              </div>
            </div>

            {/* Scope Items List inputs */}
            <div className="space-y-3.5 border-t border-border1 pt-5">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-text1 uppercase tracking-wider block">Scope of Items & Quantities *</h4>
                <button
                  type="button"
                  onClick={handleAddRfqItemInput}
                  className="text-xs bg-accent1/10 border border-accent1/30 text-accent1 hover:bg-accent1 hover:text-white py-1 px-3 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Scope Line
                </button>
              </div>

              {rfqItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Item description (e.g. Dell Latitude 14)"
                      value={item.name}
                      onChange={e => handleRfqItemChange(idx, 'name', e.target.value)}
                      className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleRfqItemChange(idx, 'quantity', e.target.value)}
                      className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="text"
                      required
                      placeholder="Unit (reams, hrs)"
                      value={item.unit}
                      onChange={e => handleRfqItemChange(idx, 'unit', e.target.value)}
                      className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                    />
                  </div>
                  {rfqItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRfqItemInput(idx)}
                      className="bg-red1/10 text-red1 hover:bg-red1 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* target suppliers assignment inputs */}
            <div className="space-y-2 border-t border-border1 pt-5">
              <label className="block text-xs font-bold text-text1 uppercase tracking-wider">Invite Active Registered Suppliers (Choose minimum one) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {vendors.filter(v => v.status === 'Active').map((v) => {
                  const assigned = assignedVendors.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleToggleVendorAssign(v.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${
                        assigned 
                          ? 'bg-accent1/10 border-accent1/50 text-accent1 font-bold' 
                          : 'bg-bg3 border-border1 text-text2'
                      }`}
                    >
                      <div>
                        <div>{v.name}</div>
                        <div className="text-[10px] font-normal opacity-70 underline">{v.category}</div>
                      </div>
                      {assigned && <Check className="w-4 h-4 text-accent1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewState('list')}
                className="bg-bg3 hover:bg-border1 text-text2 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                Discard Form
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent1 hover:bg-accent1/90 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md disabled:opacity-40"
              >
                {submitting ? 'Broadcasting...' : 'Finalize & Broadcast RFQ'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ── RFQ SPECIFIC DETAIL PANEL ── */}
      {viewState === 'detail' && selectedRfq && (
        <div className="space-y-6">
          <div className="bg-bg2 border border-border1 rounded-2xl p-5 md:p-6 space-y-4">
            
            {/* Header controls inside details */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-border1 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-accent1">{selectedRfq.id}</span>
                <h3 className="text-xl font-bold text-text1">{selectedRfq.title}</h3>
                <p className="text-xs text-text2 mt-1">Status: <span className="text-green1 font-bold">{selectedRfq.status}</span> · Deadline: {selectedRfq.deadline}</p>
              </div>

              <div className="space-x-1.5 whitespace-nowrap self-end sm:self-auto">
                {currentUser.role === 'vendor' && currentUser.vendor_id && !hasUserSubmittedQuote && (
                  <button
                    onClick={() => navigateTab('quotations', { rfq_id: selectedRfq.id })}
                    className="bg-accent1 hover:bg-accent1/90 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Submit Bid Quotation
                  </button>
                )}
                
                {['admin', 'procurement_officer'].includes(currentUser.role) && selectedRfq.quotations?.length > 0 && (
                  <button
                    onClick={() => navigateTab('quotations', { compare_id: selectedRfq.id })}
                    className="bg-accent2 hover:bg-accent2/90 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Compare Live Bids
                  </button>
                )}

                <button
                  onClick={() => setViewState('list')}
                  className="bg-bg3 hover:bg-bg4 border border-border1 text-text1 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Back to List
                </button>
              </div>
            </div>

            {/* Description scope */}
            <div>
              <h4 className="text-xs font-bold text-text2 uppercase tracking-wider mb-1">Description Description</h4>
              <p className="text-sm text-text1 leading-relaxed bg-bg3/40 border border-border1 rounded-xl p-3.5">
                {selectedRfq.description || 'No custom instruction summary registered for this package.'}
              </p>
            </div>

            {/* Columns split: Items list spec and invited vendors list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Scoped items list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text2 uppercase tracking-wider">Scoped procurement list</h4>
                <div className="bg-bg3 border border-border1 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 bg-bg3/60 font-bold text-text2 py-2 px-3 border-b border-border1">
                    <div className="col-span-2">Item description</div>
                    <div className="text-center">Quantity</div>
                    <div className="text-right">Unit</div>
                  </div>
                  <div className="divide-y divide-border1">
                    {selectedRfq.items && selectedRfq.items.map((it: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 py-2 px-3">
                        <div className="col-span-2 font-medium text-text1 flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-accent1" /> {it.name}
                        </div>
                        <div className="text-center font-bold text-text1">{it.quantity}</div>
                        <div className="text-right text-text3 font-medium uppercase">{it.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invited list of vendors */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text2 uppercase tracking-wider">Assigned supplier listing</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedRfq.vendors && selectedRfq.vendors.map((vend: any) => (
                    <div key={vend.id} className="bg-bg3 border border-border1 rounded-xl p-2.5 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-text1">{vend.name}</div>
                        <div className="text-[10px] text-text3 mt-0.5">{vend.contact_name} · {vend.city}</div>
                      </div>
                      <span className="text-[10px] font-mono text-accent1 font-bold">{vend.category}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom section: Submitted Quotations review */}
            <div className="border-t border-border1 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-text2 uppercase tracking-wider block">Currently submitted bids ({selectedRfq.quotations?.length || 0})</h4>
              
              {selectedRfq.quotations && selectedRfq.quotations.length > 0 ? (
                <div className="space-y-2">
                  {selectedRfq.quotations.map((q: any) => (
                    <div key={q.id} className="bg-bg3 border border-border1 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center hover:border-accent2/30 transition-all">
                      <div>
                        <div className="text-text1 font-bold text-sm block mb-1">{q.vendor_name}</div>
                        <div className="text-text2 flex flex-wrap gap-x-3 gap-y-1">
                          <span>Delivery time: <span className="text-accent1 font-bold">{q.delivery_days} days</span></span>
                          <span className="text-text3">|</span>
                          <span>Remarks: <span className="italic">"{q.notes || 'None'}"</span></span>
                        </div>
                      </div>

                      <div className="flex gap-4 items-center self-end sm:self-auto font-mono">
                        <div>
                          <div className="text-[10px] text-text3 text-right">TOTAL QUOTE</div>
                          <div className="text-sm font-extrabold text-accent2">${q.total_amount.toLocaleString()}</div>
                        </div>

                        <span className={`inline-block py-0.5 px-2 rounded-md font-bold uppercase text-[9px] ${
                          q.status === 'Selected' ? 'bg-green1/15 border border-green1/40 text-green1' : 
                          q.status === 'Rejected' ? 'bg-red1/15 border border-red1/40 text-red1' : 'bg-accent1/10 text-accent1 border border-accent1/20'
                        }`}>
                          {q.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-bg3/30 border border-border1 rounded-xl p-6 text-center text-text3 text-xs">
                  <Info className="w-5 h-5 text-text3 mx-auto mb-2" />
                  No quotations submitted for this active RFQ file yet.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
