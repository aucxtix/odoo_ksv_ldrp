/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';
import { User, Invoice, PurchaseOrder } from '../types.js';
import { ShoppingCart, FileText, Printer, Mail, Download, CheckCircle, HelpCircle, X, Check, Eye } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken } from '../lib/firebase.js';

interface InvoicesProps {
  currentUser: User;
}

export default function Invoices({ currentUser }: InvoicesProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Specific views
  const [activeTab, setActiveTab] = useState<'invoices' | 'pos'>('invoices');
  const [viewInvoiceDetail, setViewInvoiceDetail] = useState<any | null>(null);

  // Email state variables
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmailInvoice, setSelectedEmailInvoice] = useState<any | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Firebase auth state for Gmail
  const [needsAuth, setNeedsAuth] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoicesAndPOs();
  }, [activeTab]);

  useEffect(() => {
    initAuth(
      (user, t) => {
        setNeedsAuth(false);
        setToken(t);
      },
      () => {
        setNeedsAuth(true);
        setToken(null);
      }
    );
  }, []);

  async function fetchInvoicesAndPOs() {
    setLoading(true);
    try {
      const [invRes, poRes] = await Promise.all([
        apiGet('/api/invoices'),
        apiGet('/api/pos')
      ]);
      
      if (invRes.success) setInvoices(invRes.data);
      if (poRes.success) setPos(poRes.data);

    } catch (err) {
      console.error('Error fetching invoices/POs', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInvoice(poId: string) {
    setLoading(true);
    setFeedbackSuccess('');
    try {
      const res = await apiPost('/api/invoices/generate', { po_id: poId });
      if (res.success) {
        // Switch view to invoice list and select this newly generated invoice for preview
        setActiveTab('invoices');
        await fetchInvoicesAndPOs();
        
        // Load detail
        const invoiceDetail = await apiGet(`/api/invoices/${res.invoice_id}`);
        if (invoiceDetail.success) {
          setViewInvoiceDetail(invoiceDetail.data);
        }
      } else {
        alert(res.error || 'Failed to generate invoice check sheet');
      }
    } catch (err) {
      console.error(err);
      alert('Operational issue making invoice');
    } finally {
      setLoading(false);
    }
  }

  async function handleShowInvoiceDetail(id: string) {
    setLoading(true);
    try {
      const res = await apiGet(`/api/invoices/${id}`);
      if (res.success) {
        setViewInvoiceDetail(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleTriggerPrint() {
    try {
      window.print();
    } catch (e) {
      alert("Printing is blocked in this preview. Please open the app in a new tab to print.");
    }
  }

  function handleTriggerDownloadPdf(id: string) {
    // Create an anchor link to bypass popup blockers/iframe restrictions
    const link = document.createElement('a');
    link.href = `/api/invoices/${id}/pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handlePrintDirectly(id: string) {
    setLoading(true);
    try {
      const res = await apiGet(`/api/invoices/${id}`);
      if (res.success) {
        setViewInvoiceDetail(res.data);
        setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            alert("Printing is blocked in this preview. Please open the app in a new tab to print.");
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function launchEmailModal(invoice: any) {
    setSelectedEmailInvoice(invoice);
    setEmailInput(invoice.vendor?.email || 'officer@vendorbridge.com');
    setFeedbackSuccess('');
    setShowEmailModal(true);
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput) return;

    if (needsAuth || !token) {
      try {
        const result = await googleSignIn();
        if (result) {
          setToken(result.accessToken);
          setNeedsAuth(false);
        }
      } catch (err) {
        console.error('Login failed:', err);
        return;
      }
      return; // Return and ask user to click send again after auth
    }

    const confirmed = window.confirm(`Are you sure you want to send this invoice to ${emailInput} using your Gmail account?`);
    if (!confirmed) return;

    setSendingEmail(true);
    setFeedbackSuccess('');
    try {
      const accessToken = await getAccessToken();
      
      const emailContent = [
        `To: ${emailInput}`,
        'Subject: VendorBridge Invoice: ' + selectedEmailInvoice.id,
        'Content-Type: text/plain; charset=utf-8',
        '',
        `Hello ${selectedEmailInvoice.vendor?.contact_name || 'Vendor'},`,
        '',
        `Please find the invoice details for ${selectedEmailInvoice.po_id}.`,
        `Total Amount: $${selectedEmailInvoice.total_amount?.toLocaleString()}`,
        '',
        'Generated via VendorBridge ERP Systems'
      ].join('\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (response.ok) {
        setFeedbackSuccess('Email dispatched successfully via Gmail!');
        // Mark as sent in DB
        await apiPost(`/api/invoices/${selectedEmailInvoice.id}/send`, { email: emailInput });
        await fetchInvoicesAndPOs();
      } else {
        const errorData = await response.json();
        alert('Failed to send email via Gmail: ' + (errorData.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network connection failed on email transmit');
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* tabs selectors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text1">Billing & Invoices Ledger</h2>
          <p className="text-sm text-text2">Dispense Purchase Orders (POs) and execute automated client invoicing lists</p>
        </div>

        <div className="bg-bg3 border border-border1 rounded-xl p-1 flex gap-1 self-stretch md:self-auto no-print">
          <button
            onClick={() => { setActiveTab('invoices'); setViewInvoiceDetail(null); }}
            className={`flex-1 md:flex-none text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer ${
              activeTab === 'invoices' ? 'bg-accent1 text-white shadow' : 'text-text2 hover:text-text1'
            }`}
          >
            Invoices List ({invoices.length})
          </button>
          <button
            onClick={() => { setActiveTab('pos'); setViewInvoiceDetail(null); }}
            className={`flex-1 md:flex-none text-xs font-semibold py-2 px-4 rounded-lg transition-all cursor-pointer ${
              activeTab === 'pos' ? 'bg-accent2 text-white shadow' : 'text-text2 hover:text-text1'
            }`}
          >
            Active Purchase Orders ({pos.length})
          </button>
        </div>
      </div>

      {loading && invoices.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-3 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side Lists: Invoices or POs depending on tab selection */}
          <div className="lg:col-span-1 space-y-4 no-print">
            
            {activeTab === 'invoices' ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text2 uppercase tracking-wider block">Generated Billing Invoices</h3>
                
                {invoices.length === 0 ? (
                  <div className="bg-bg2 border border-border1 rounded-2xl p-6 text-center text-text3 text-xs">
                    No invoices generated yet. Access POs to dispatch.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[80vh] overflow-y-auto">
                    {invoices.map((inv) => {
                      const isSel = viewInvoiceDetail?.id === inv.id;
                      
                      const statusStyles: Record<string, string> = {
                        'Generated': 'bg-accent1/10 border-accent1/30 text-accent1',
                        'Sent': 'bg-orange1/10 border-orange1/30 text-orange1',
                        'Paid': 'bg-green1/10 border-green1/40 text-green1'
                      };

                      return (
                        <div
                          key={inv.id}
                          onClick={() => handleShowInvoiceDetail(inv.id)}
                          className={`p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                            isSel 
                              ? 'bg-bg3 border-accent1 shadow-md shadow-accent1/5' 
                              : 'bg-bg2 border-border1 hover:border-border2'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-mono text-text1 font-bold">{inv.id}</span>
                            <span className={`py-0.2 px-1.5 rounded font-bold uppercase text-[8px] ${statusStyles[inv.status] || ''}`}>
                              {inv.status}
                            </span>
                          </div>

                          <div className="font-semibold text-text1 truncate max-w-[170px]">{inv.vendor_name}</div>
                          <div className="text-[10px] text-text3 mt-0.5">PO Ref: {inv.po_id}</div>

                          <div className="mt-3 flex justify-between items-center pt-2.5 border-t border-border1/60">
                            <div>
                              <span className="text-text3 text-[10px] block">INVOICED AMOUNT</span>
                              <span className="font-mono font-bold text-accent1">${inv.total_amount ? inv.total_amount.toLocaleString() : '0.00'}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintDirectly(inv.id);
                              }}
                              className="text-text2 hover:text-accent1 bg-bg3 border border-border1 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Print Invoice"
                            >
                              <Printer className="w-3 h-3" />
                              <span className="text-[10px] font-bold">Print</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text2 uppercase tracking-wider block">Completed PO pipelines</h3>
                
                {pos.length === 0 ? (
                  <div className="bg-bg2 border border-border1 rounded-2xl p-6 text-center text-text3 text-xs">
                    No active POs waiting invoice drafting. Approval confirmations automatically generate PO objects.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[80vh] overflow-y-auto">
                    {pos.map((po) => {
                      const isInvoiced = po.status === 'Invoiced';
                      return (
                        <div
                          key={po.id}
                          className="bg-bg2 border border-border1 rounded-xl p-3.5 text-xs flex flex-col justify-between"
                        >
                          <div className="flex justify-between mb-1.5">
                            <span className="font-mono text-text3">{po.id}</span>
                            <span className={`inline-block py-0.2 px-1.5 rounded text-[8px] font-bold uppercase ${
                              isInvoiced 
                                ? 'bg-bg3 text-text3 border border-border1' 
                                : 'bg-green1/10 text-green1 border border-green1/30'
                            }`}>
                              {po.status}
                            </span>
                          </div>

                          <div className="font-bold text-text1 truncate">{po.vendor_name}</div>
                          <div className="text-[10px] text-text3 mt-0.5">RFQ: {po.rfq_id}</div>

                          <div className="mt-3.5 border-t border-border1/60 pt-3 flex justify-between items-center gap-2">
                            <div className="font-mono text-accent1 font-bold">${po.total_amount ? po.total_amount.toLocaleString() : '0.00'}</div>
                            
                            {!isInvoiced && ['admin', 'procurement_officer'].includes(currentUser.role) && (
                              <button
                                type="button"
                                onClick={() => handleCreateInvoice(po.id)}
                                className="bg-accent1 hover:bg-accent1/90 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg shadow cursor-pointer"
                              >
                                Generate Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Detailed preview window or invoice details */}
          <div className="lg:col-span-2 space-y-4">
            
            {viewInvoiceDetail ? (
              <div className="space-y-4">
                
                {/* Invoice actions */}
                <div className="bg-bg2 border border-border1 p-3.5 rounded-2xl flex justify-between gap-4 items-center no-print">
                  <span className="text-xs text-text2 font-semibold">Invoice View Sheet: <span className="font-mono text-text1">{viewInvoiceDetail.id}</span></span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleTriggerPrint}
                      className="bg-bg3 hover:bg-bg4 border border-border1 text-text1 text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4 text-text3" /> Print Invoice
                    </button>
                    {['admin', 'procurement_officer'].includes(currentUser.role) && (
                      <button
                        onClick={() => launchEmailModal(viewInvoiceDetail)}
                        className="bg-accent2/10 border border-accent2/40 text-accent2 text-xs py-1.5 px-3 rounded-xl hover:bg-accent2 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Mail className="w-4 h-4" /> Dispatch Email
                      </button>
                    )}
                    <button
                      onClick={() => handleTriggerDownloadPdf(viewInvoiceDetail.id)}
                      className="bg-accent1/10 border border-accent1/40 text-accent1 text-xs py-1.5 px-3 rounded-xl hover:bg-accent1 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Download raw
                    </button>
                  </div>
                </div>

                {/* VISUAL LAYOUT PREVIEW (Styled as white paper card block) */}
                <div id="printable-invoice" className="bg-white text-black p-8 rounded-2xl shadow-xl space-y-6 border border-gray-200 print-bg-white font-sans max-w-full overflow-hidden">
                  
                  {/* Top Header */}
                  <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 uppercase">VendorBridge ERP</h1>
                      <p className="text-xs text-gray-500 uppercase mt-0.5">Reliable Unified Procurement Ecosystem</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-500 uppercase">INVOICE STATEMENT</div>
                      <div className="text-xl font-mono font-extrabold text-blue-600 mt-1">{viewInvoiceDetail.id}</div>
                    </div>
                  </div>

                  {/* Date specs block */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-gray-700">
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block mb-0.5">Associated PO</span>
                      <span className="font-mono text-gray-900 font-bold">{viewInvoiceDetail.po_id}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block mb-0.5">Date of Issue</span>
                      <span className="text-gray-900">{viewInvoiceDetail.generated_at?.substring(0, 10)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 uppercase block mb-0.5">Execution Status</span>
                      <span className="text-blue-600 font-bold uppercase">{viewInvoiceDetail.status}</span>
                    </div>
                  </div>

                  {/* Supplier details info */}
                  <div className="border-t border-b border-gray-150 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
                    <div>
                      <span className="font-bold text-gray-500 uppercase block mb-1">SUPPLIER BILLING FROM:</span>
                      <div className="font-extrabold text-gray-900 text-sm">{viewInvoiceDetail.vendor?.name}</div>
                      <div className="text-gray-600 mt-1">{viewInvoiceDetail.vendor?.contact_name}</div>
                      <div className="text-gray-600">{viewInvoiceDetail.vendor?.city}</div>
                      <div className="text-gray-600">{viewInvoiceDetail.vendor?.email} · {viewInvoiceDetail.vendor?.phone}</div>
                    </div>

                    <div className="sm:text-right space-y-1">
                      <span className="font-bold text-gray-500 uppercase block mb-1">REGULATORY COMPLIANCES:</span>
                      <div className="font-mono text-gray-900 font-bold">GSTIN No: {viewInvoiceDetail.vendor?.gst_number || 'N/A'}</div>
                      <div className="text-gray-600">Risk Assessment: <span className="font-bold text-green-600">{viewInvoiceDetail.vendor?.risk_level} Risk</span></div>
                      <div className="text-gray-600">Delivery Speed rate: {viewInvoiceDetail.vendor?.on_time_pct}% on-time</div>
                    </div>
                  </div>

                  {/* Items breakup table */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Procurement Scope details:</span>
                    <div className="rounded-lg border border-gray-150 overflow-hidden text-xs">
                      <div className="grid grid-cols-4 bg-gray-50 text-gray-500 font-bold py-2 px-3 border-b border-gray-150">
                        <div className="col-span-2">Item line description</div>
                        <div className="text-center">Quantity</div>
                        <div className="text-right">Invoice Rate</div>
                      </div>

                      <div className="divide-y divide-gray-150">
                        {viewInvoiceDetail.items && viewInvoiceDetail.items.map((it: any, i: number) => (
                          <div key={i} className="grid grid-cols-4 py-2 px-3 text-gray-800">
                            <div className="col-span-2 font-bold text-gray-950">{it.name}</div>
                            <div className="text-center font-semibold text-gray-900">{it.quantity} <span className="text-gray-400 font-normal lowercase">{it.unit}</span></div>
                            <div className="text-right font-semibold text-gray-950">${it.total_price ? it.total_price.toLocaleString() : '0.00'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing summaries margins */}
                  <div className="flex justify-end pt-3">
                    <div className="w-64 space-y-2 text-xs border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-gray-500">
                        <span>Cumulative Net Net:</span>
                        <span className="font-mono font-semibold text-gray-900">${viewInvoiceDetail.subtotal?.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-gray-500">
                        <span>Calculated GST (18.00%):</span>
                        <span className="font-mono font-semibold text-gray-900">${viewInvoiceDetail.gst_amount?.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-base font-extrabold border-t border-gray-200 pt-2 text-gray-950">
                        <span>TOTAL AMOUNT PAYABLE:</span>
                        <span className="font-mono text-blue-600">${viewInvoiceDetail.total_amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-400 text-center uppercase tracking-wide">
                    Generated via VendorBridge ERP Systems · Net 30 Term limits apply.
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-bg2 border border-border1 rounded-2xl p-12 text-center text-text3 flex flex-col justify-center items-center h-[50vh] no-print">
                <FileText className="w-12 h-12 text-text3 mb-3" />
                <p className="font-bold text-text1">Invoice Preview Canvas</p>
                <p className="text-xs text-text3 mt-1">Select any Invoice from the list to display its billing items and printer metrics.</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* DISPATCH EMAIL POPUP */}
      {showEmailModal && selectedEmailInvoice && (
        <div className="fixed inset-0 bg-bg1/85 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-bg2 border border-border1 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-border1">
              <h3 className="font-bold text-text1 text-md flex items-center gap-1.5">
                <Mail className="w-5 h-5 text-accent2" /> Dispatch Billing Email Attachment
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-text2 hover:text-text1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSendEmail} className="p-5 space-y-5">
              {feedbackSuccess ? (
                <div className="text-green1 text-xs text-center space-y-3 py-3.5 bg-green1/15 border border-dashed border-green1/35 rounded-xl">
                  <CheckCircle className="w-6 h-6 mx-auto" />
                  <p className="font-semibold">{feedbackSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="bg-green1 text-white font-bold py-1 px-3 rounded-lg"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1 bg-bg3/40 p-3 rounded-xl border border-border1 text-xs">
                    <span className="text-[10px] text-text3 uppercase font-bold block">Invoice summary payload</span>
                    <div>Identifier Ref: <span className="font-mono text-text1 font-bold">{selectedEmailInvoice.id}</span></div>
                    <div>Invoice Total Sum: <span className="font-mono text-accent1 font-bold">${selectedEmailInvoice.total_amount?.toLocaleString()}</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Destination Recipient Email Address *</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="finance@supplier.com"
                      className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2.5 px-3 focus:border-accent2 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border1">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="bg-bg3 hover:bg-border1 text-text2 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className="bg-accent2 hover:bg-accent2/95 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md disabled:opacity-40 flex items-center gap-2"
                    >
                      {needsAuth ? (
                        <>
                          <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M47 24.6c0-1.6-.2-3.1-.4-4.6H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 7.1-10.4 7.1-17.6z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24c0 3.9.9 7.5 2.6 10.8l8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                          Connect Gmail to Send
                        </>
                      ) : sendingEmail ? (
                        'Transmitting via Gmail...'
                      ) : (
                        'Transmit via Gmail'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
