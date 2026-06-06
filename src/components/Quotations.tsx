/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';
import { User, RFQ, Vendor } from '../types.js';
import { Layers, FileSpreadsheet, ChevronRight, Award, Trash2, Calendar, ShieldAlert, ArrowRight, CornerDownRight, CheckCircle, Info, Sparkles } from 'lucide-react';

interface QuotationsProps {
  currentUser: User;
  params: any;
  navigateTab: (tab: string, params?: any) => void;
}

export default function Quotations({ currentUser, params, navigateTab }: QuotationsProps) {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // High-level Screen states: 'compare' | 'submit' | 'select'
  const [screen, setScreen] = useState<'compare' | 'submit' | 'select'>('select');

  // Submit Quote variables
  const [selectedRfqForSubmit, setSelectedRfqForSubmit] = useState<any>(null);
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [itemsPricing, setItemsPricing] = useState<{ rfq_item_id: number; name: string; quantity: number | null; unit: string; unit_price: string; total_price: number }[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Compare Dashboard variables
  const [selectedRfqIdForCompare, setSelectedRfqIdForCompare] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvalRequestSuccess, setApprovalRequestSuccess] = useState(false);

  useEffect(() => {
    fetchRfqsAndInitialParams();
  }, [params]);

  async function fetchRfqsAndInitialParams() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiGet('/api/rfq');
      if (res.success) {
        const list: RFQ[] = res.data;
        setRfqs(list);

        // Check incoming route params
        if (params && params.rfq_id) {
          // Setup for Submit Quote
          const rfqItem = list.find(r => r.id === params.rfq_id);
          if (rfqItem) {
            setupSubmitQuotation(rfqItem);
          } else {
            setErrorMsg('Assigned RFQ no longer available in network ledger');
            setScreen('select');
          }
        } else if (params && params.compare_id) {
          // Setup for Compare Bids
          setSelectedRfqIdForCompare(params.compare_id);
          await loadComparisonData(params.compare_id);
          setScreen('compare');
        } else {
          setScreen('select');
        }
      }
    } catch (err) {
      console.error('Error starting Quotation portal params', err);
    } finally {
      setLoading(false);
    }
  }

  function setupSubmitQuotation(rfq: any) {
    setSelectedRfqForSubmit(rfq);
    setDeliveryDays('7');
    setNotes('');
    setSubmitSuccess(false);

    const priceLayout = (rfq.items || []).map((it: any) => ({
      rfq_item_id: it.id,
      name: it.name,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: '',
      total_price: 0
    }));

    setItemsPricing(priceLayout);
    setScreen('submit');
  }

  function handleUnitPriceChange(idx: number, priceStr: string) {
    const copied = [...itemsPricing];
    const qty = Number(copied[idx].quantity) || 1;
    const priceVal = Number(priceStr) || 0;
    
    copied[idx].unit_price = priceStr;
    copied[idx].total_price = Number((qty * priceVal).toFixed(2));
    
    setItemsPricing(copied);
  }

  // Calc combined total amount dynamic summation
  const calculatedGrandTotal = itemsPricing.reduce((acc, row) => acc + row.total_price, 0);

  async function handlePostQuote(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!deliveryDays || calculatedGrandTotal <= 0) {
      setErrorMsg('Quoted price sums must exceed 0, contract timeline required.');
      return;
    }

    // Verify all item prices entered
    const isMissingRate = itemsPricing.some(it => !it.unit_price || Number(it.unit_price) <= 0);
    if (isMissingRate) {
      setErrorMsg('Please enter valid unit pricing rates for all scope rows.');
      return;
    }

    try {
      const res = await apiPost('/api/quotations/submit', {
        rfq_id: selectedRfqForSubmit.id,
        vendor_id: currentUser.vendor_id,
        delivery_days: Number(deliveryDays),
        notes,
        total_amount: calculatedGrandTotal,
        items: itemsPricing
      });

      if (res.success) {
        setSubmitSuccess(true);
      } else {
        setErrorMsg(res.error || 'Bidding submission registration rejected');
      }
    } catch (err) {
      setErrorMsg('Database system communication failure');
    }
  }

  async function loadComparisonData(rfqId: string) {
    if (!rfqId) return;
    setLoading(true);
    setApprovalRequestSuccess(false);
    try {
      const res = await apiGet(`/api/quotations/compare/${rfqId}`);
      if (res.success) {
        setComparisonData(res.data);
      }
    } catch (err) {
      console.error('Error contrasting comparator matrices', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestApproval(quotationId: number) {
    setLoading(true);
    try {
      const res = await apiPost('/api/approvals/request', {
        rfq_id: selectedRfqIdForCompare,
        quotation_id: quotationId,
        remarks: approvalRemarks
      });

      if (res.success) {
        setApprovalRequestSuccess(true);
        setApprovalRemarks('');
        await loadComparisonData(selectedRfqIdForCompare);
      } else {
        alert(res.error || 'Request rejected by regulatory controller');
      }
    } catch (err) {
      console.error(err);
      alert('Network failure drafting approval');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* ── SELECT ROUTE ── */}
      {screen === 'select' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-text1">Tenders & Bid Quotations Bazaars</h2>
              <p className="text-sm text-text2">Access comparator matrices, submit supply rates, & manage tender selections</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Left box: Submit Bid Quotations card */}
            <div className="bg-bg2 border border-border1 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 bg-accent1/10 text-accent1 rounded-2xl w-fit"><FileSpreadsheet className="w-6 h-6" /></div>
                <h3 className="font-bold text-text1 text-md">Corporate Supplier Tenders</h3>
                <p className="text-xs text-text2 leading-relaxed">
                  As a registered supplier, execute tender quotes, detail warranties, and specify delivery schedules.
                </p>
              </div>

              {currentUser.role === 'vendor' ? (
                <div className="pt-4 border-t border-border1 space-y-3">
                  <div className="text-xs font-semibold text-text2 uppercase tracking-wide">Invitations open for you:</div>
                  <div className="space-y-2">
                    {rfqs.map((rfq) => (
                      <button
                        key={rfq.id}
                        onClick={() => setupSubmitQuotation(rfq)}
                        className="w-full bg-bg3 hover:bg-bg4 border border-border1 hover:border-accent1/30 p-3 rounded-xl text-left text-xs flex justify-between items-center transition-all cursor-pointer"
                      >
                        <div>
                          <span className="font-mono text-accent1 font-bold text-[10px] block">{rfq.id}</span>
                          <span className="font-bold text-text1 block">{rfq.title}</span>
                          <span className="text-[10px] text-text3 block mt-0.5">Deadline: {rfq.deadline}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-accent1" />
                      </button>
                    ))}
                    {rfqs.length === 0 && (
                      <p className="text-xs text-text3 italic">No outstanding RFQ invites registered.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-bg3 border border-border1 rounded-xl p-3.5 text-xs text-text2 leading-normal">
                  <Info className="w-4 h-4 text-accent1 inline mr-1 mb-0.5" /> 
                  Currently authenticated with corporate role. Log in using a **supplier account** to access bidding inputs.
                </div>
              )}
            </div>

            {/* Right box: Compare Quotations side-by-side matrices card */}
            <div className="bg-bg2 border border-border1 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 bg-accent2/10 text-accent2 rounded-2xl w-fit"><Award className="w-6 h-6" /></div>
                <h3 className="font-bold text-text1 text-md">Tender Comparator Matrix</h3>
                <p className="text-xs text-text2 leading-relaxed">
                  Contrasts active bidding rates, rating matrices, and fulfillment timelines inside a unified AI-recomended score engine.
                </p>
              </div>

              {['admin', 'procurement_officer'].includes(currentUser.role) ? (
                <div className="pt-4 border-t border-border1 space-y-3">
                  <div className="text-xs font-semibold text-text2 uppercase tracking-wide">Review Quotations comparator:</div>
                  <div className="space-y-2">
                    {rfqs.filter(r => ['Quotations Received', 'Under Approval', 'PO Generated'].includes(r.status)).map((rfq) => (
                      <button
                        key={rfq.id}
                        onClick={async () => {
                          setSelectedRfqIdForCompare(rfq.id);
                          await loadComparisonData(rfq.id);
                          setScreen('compare');
                        }}
                        className="w-full bg-bg3 hover:bg-bg4 border border-border1 hover:border-accent2/30 p-3 rounded-xl text-left text-xs flex justify-between items-center transition-all cursor-pointer"
                      >
                        <div>
                          <span className="font-mono text-accent2 font-bold text-[10px] block">{rfq.id}</span>
                          <span className="font-bold text-text1 block">{rfq.title}</span>
                          <span className="text-[10px] text-text3 block mt-0.5">Status: {rfq.status}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-accent2" />
                      </button>
                    ))}
                    {rfqs.filter(r => ['Quotations Received', 'Under Approval', 'PO Generated'].includes(r.status)).length === 0 && (
                      <p className="text-xs text-text3 italic">No live quotations received yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-bg3 border border-border1 rounded-xl p-3.5 text-xs text-text2 leading-normal">
                  <Info className="w-4 h-4 text-accent2 inline mr-1 mb-0.5" /> 
                  Manager/Procurement levels required to access comparator dashboards.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── SUBMIT BIDDING SHEET FORM ── */}
      {screen === 'submit' && selectedRfqForSubmit && (
        <div className="max-w-3xl mx-auto bg-bg2 border border-border1 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-border1 bg-bg3/50 flex justify-between items-center">
            <div>
              <span className="font-mono text-xs font-bold text-accent1">{selectedRfqForSubmit.id}</span>
              <h3 className="font-bold text-text1 text-md">Submitting Quotation Bid</h3>
              <p className="text-xs text-text2">Tender: {selectedRfqForSubmit.title}</p>
            </div>
            <button
              onClick={() => setScreen('select')}
              className="text-xs bg-bg3 hover:bg-bg4 border border-border1 text-text1 py-1.5 px-3 rounded-xl transition-all cursor-pointer font-bold"
            >
              Back to Catalog
            </button>
          </div>

          {submitSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-green1/15 text-green1 rounded-full flex justify-center items-center mx-auto border border-green1/40">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text1">Quotation Submitted Successfully!</h3>
              <p className="text-xs text-text2 max-w-sm mx-auto">
                Your bidding prices have been registered inside the secure network. Officers can now review and compare conditions.
              </p>
              <button
                onClick={() => navigateTab('rfqs')}
                className="bg-accent1 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                Return to RFQs listings
              </button>
            </div>
          ) : (
            <form onSubmit={handlePostQuote} className="p-6 space-y-6">
              
              {errorMsg && (
                <div className="bg-red1/15 border border-dashed border-red1/30 py-2.5 px-4 rounded-xl text-red1 text-xs text-center font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Set timelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Fulfillment Delivery Days *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={deliveryDays}
                    onChange={e => setDeliveryDays(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                  <span className="text-[10px] text-text3 block mt-1">Calendar delivery timeline upon PO reception.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Supplier execution notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Warranties, spec alterations or inclusions..."
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>
              </div>

              {/* pricing per line spec item */}
              <div className="space-y-3.5 border-t border-border1 pt-5">
                <h4 className="text-xs font-bold text-text1 uppercase tracking-wider block">Unit Rate specification ($ USD) *</h4>
                
                <div className="space-y-2.5">
                  {itemsPricing.map((row, idx) => (
                    <div key={idx} className="bg-bg3 border border-border1 p-3.5 rounded-xl text-xs space-y-2 sm:space-y-0 sm:flex items-center gap-4 justify-between">
                      <div className="flex-1">
                        <span className="text-text3 text-[9px] uppercase font-bold block mb-0.5">Line Line {idx+1}</span>
                        <span className="text-text1 font-bold block">{row.name}</span>
                        <span className="text-text2 text-[10px]">{row.quantity} {row.unit} requested</span>
                      </div>

                      <div className="flex gap-3 items-center justify-end">
                        <div className="w-32">
                          <label className="block text-[9px] text-text2 uppercase mb-1">Unit Rate ($)*</label>
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={row.unit_price}
                            onChange={e => handleUnitPriceChange(idx, e.target.value)}
                            placeholder="Price"
                            className="w-full bg-bg4 border border-border1 text-text1 text-sm rounded-lg py-1 px-3 focus:border-accent1 outline-none"
                          />
                        </div>

                        <div className="w-24 text-right">
                          <div className="text-[9px] text-text3 uppercase">Total price</div>
                          <div className="font-mono text-text1 font-bold mt-1">${row.total_price ? row.total_price.toLocaleString() : '0.00'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand summary */}
              <div className="bg-bg3 border border-border1 p-4 rounded-xl flex justify-between items-center text-sm font-bold">
                <span className="text-text2 font-sans font-medium">Bidding valuation sum total:</span>
                <span className="text-xl text-accent1 font-mono">${calculatedGrandTotal ? calculatedGrandTotal.toLocaleString() : '0.00'}</span>
              </div>

              <div className="pt-4 border-t border-border1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('select')}
                  className="bg-bg3 hover:bg-border1 text-text2 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent1 hover:bg-accent1/90 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md"
                >
                  Submit Secure Quotation
                </button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* ── LIVE COMPARISON DASHBOARD SCREEN ── */}
      {screen === 'compare' && comparisonData && (
        <div className="space-y-6">
          
          {/* Header controls inside comparison */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-bg2 border border-border1 p-5 rounded-2xl">
            <div>
              <span className="font-mono text-xs font-bold text-accent2">{comparisonData.rfq?.id}</span>
              <h3 className="text-lg font-bold text-text1">Comparison Analytics Matrix</h3>
              <p className="text-xs text-text2 mt-1">Comparing biddings open for: <span className="text-accent1 font-bold">"{comparisonData.rfq?.title}"</span></p>
            </div>

            <button
              onClick={() => setScreen('select')}
              className="text-xs bg-bg3 hover:bg-bg4 border border-border1 text-text1 py-1.5 px-3 rounded-xl transition-all cursor-pointer font-bold self-end sm:self-auto"
            >
              Exit Comparator
            </button>
          </div>

          {approvalRequestSuccess && (
            <div className="bg-green1/15 border border-dashed border-green1/40 p-4 rounded-2xl text-green1 text-xs text-center font-semibold">
              ✔ Approval Selection requested dispatched successfully! State altered to 'Under Approval'. Managers have been notified.
            </div>
          )}

          {comparisonData.quotations?.length === 0 ? (
            <div className="bg-bg2 border border-border1 rounded-2xl p-12 text-center text-text2">
              <FileSpreadsheet className="w-12 h-12 text-text3 mx-auto mb-3 animate-pulse" />
              <p className="font-semibold text-text1">Bidding pool empty</p>
              <p className="text-xs text-text3 mt-1">No supplier submissions are currently active in this file's ledger.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Highlight best recommendation card */}
              <div className="bg-gradient-to-r from-accent2/20 to-accent1/10 rounded-2xl border border-accent2/40 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-accent2 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4.5 h-4.5 text-accent2 fill-accent2 animate-spin duration-3000" /> AI-Weighted Recommendation Engine
                  </div>
                  <h4 className="text-md font-bold text-text1">
                    Best choice supplier: <span className="text-accent1 underline underline-offset-4">{
                      comparisonData.quotations.find((q: any) => q.vendor_id === comparisonData.recommended_vendor_id)?.vendor?.name || 'Loading'
                    }</span>
                  </h4>
                  <p className="text-xs text-text2 leading-normal max-w-xl">
                    Weighted evaluation computed automatically: <span className="font-bold">60% Total Price</span>, <span className="font-bold">30% Delivery Speed</span>, and <span className="font-bold">10% Contractor historic performance score profile</span>.
                  </p>
                </div>
                
                <div className="bg-bg2/80 border border-border1 p-2.5 rounded-xl font-mono text-center self-stretch md:self-auto min-w-[140px]">
                  <div className="text-[10px] text-text3">RECOMMENDED SCORE</div>
                  <div className="text-xl font-extrabold text-accent2">
                    {comparisonData.quotations.find((q: any) => q.vendor_id === comparisonData.recommended_vendor_id)?.score || 0}%
                  </div>
                </div>
              </div>

              {/* Comparison Data Bento/Side-by-side Cards layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comparisonData.quotations && comparisonData.quotations.map((q: any) => {
                  const isRec = q.vendor_id === comparisonData.recommended_vendor_id;
                  
                  return (
                    <div 
                      key={q.id} 
                      className={`rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                        isRec 
                          ? 'bg-bg2 border-accent2 shadow-xl shadow-accent2/5' 
                          : 'bg-bg2/75 border-border1 hover:border-border2'
                      }`}
                    >
                      {/* Top Accent line */}
                      {isRec && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent2 to-accent1" />
                      )}

                      <div className="p-5 space-y-4">
                        
                        {/* Vendor Name & Badges */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-text1 text-md leading-snug line-clamp-1">{q.vendor?.name}</h4>
                            {isRec && (
                              <span className="bg-accent2/10 text-accent2 border border-accent2/35 text-[9px] py-0.5 px-2 rounded-full font-bold uppercase tracking-wider flex-shrink-0 animate-pulse">
                                Best Pick
                              </span>
                            )}
                          </div>
                          <span className="inline-block text-[10px] bg-bg3 text-text3 border border-border1 py-0.5 px-2 rounded font-medium">Rating: {q.vendor?.rating} ★</span>
                        </div>

                        {/* Comparative stats list */}
                        <div className="space-y-2 border-t border-b border-border1/60 py-3 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text2">Submitted Quote total Rate:</span>
                            <span className="font-mono font-bold text-text1">${q.total_amount ? q.total_amount.toLocaleString() : '0.00'}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-text2">Timelines (delivery speed):</span>
                            <span className="font-mono font-bold text-text1 flex items-center gap-1.5">
                              {q.delivery_days} days
                              {q.fastest_delivery && <span className="bg-green1/15 border border-green1/30 text-green1 text-[9px] py-0.2 px-1 rounded font-bold font-sans">Fastest</span>}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-text2">Representative notes:</span>
                            <span className="font-mono text-text1 italic truncate max-w-[140px] block">"{q.notes || 'None'}"</span>
                          </div>

                          <div className="flex justify-between pt-1 border-t border-dashed border-border1">
                            <span className="text-text2 font-bold">Weighted Score Performance:</span>
                            <span className="font-mono font-extrabold text-accent2">{q.score}%</span>
                          </div>
                        </div>

                        {/* Quotations items breakup */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-text3 uppercase block">Items pricing grid:</div>
                          <div className="space-y-1 text-xs">
                            {q.items && q.items.map((it: any, i: number) => (
                              <div key={i} className={`flex justify-between py-1 px-2 rounded border ${it.anomaly ? 'bg-red1/10 border-red1/30' : 'bg-bg3/40 border-border1/40'}`}>
                                <span className={`truncate max-w-[120px] ${it.anomaly ? 'text-red1 font-bold' : 'text-text2'}`} title={it.anomaly ? it.anomalyMessage : ''}>
                                  {it.anomaly && <span className="mr-1">🔴</span>}
                                  {it.name}
                                </span>
                                <span className={`font-mono font-semibold ${it.anomaly ? 'text-red1' : 'text-text1'}`}>${it.total_price ? it.total_price.toLocaleString() : '0.00'}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Request action wrapper */}
                      <div className="p-4 bg-bg3/50 border-t border-border1 space-y-3">
                        {comparisonData.rfq?.status !== 'PO Generated' ? (
                          <>
                            {['admin', 'procurement_officer'].includes(currentUser.role) ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="Add justification remarks..."
                                  value={approvalRemarks}
                                  onChange={e => setApprovalRemarks(e.target.value)}
                                  className="w-full bg-bg3 border border-border1 text-text1 text-xs rounded-xl py-2 px-3 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRequestApproval(q.id)}
                                  className={`w-full text-xs font-semibold py-2 px-3 rounded-xl shadow-md transition-all cursor-pointer ${
                                    isRec 
                                      ? 'bg-accent2 hover:bg-accent2/90 text-white' 
                                      : 'bg-bg3 border border-border1 text-text1 hover:bg-bg4'
                                  }`}
                                >
                                  Submit Selection for Approval
                                </button>
                              </>
                            ) : (
                              <p className="text-[10px] text-text3 text-center">Managers are reviewing bidding configurations</p>
                            )}
                          </>
                        ) : (
                          <div className="py-1 px-2.5 bg-green1/10 rounded-xl text-green1 text-center font-bold text-xs flex justify-center items-center gap-1.5 border border-dashed border-green1/20">
                            ✔ Active purchase order generated for {comparisonData.rfq?.id}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
