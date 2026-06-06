/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api.js';
import { User, Vendor } from '../types.js';
import { Search, Plus, Star, MapPin, Building, Phone, Mail, AlertTriangle, Check, ShieldAlert, X, Edit, Sliders } from 'lucide-react';

interface StarRatingInputProps {
  initialRating: number;
  vendorId: number;
  onRate: (vendorId: number, rating: number) => void;
  canRate: boolean;
}

function StarRatingInput({ initialRating, vendorId, onRate, canRate }: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSelect(rateValue: number) {
    if (!canRate || isSubmitting) return;
    setIsSubmitting(true);
    await onRate(vendorId, rateValue);
    setIsSubmitting(false);
    setHoverRating(null);
  }

  const currentDisplay = hoverRating !== null ? hoverRating : Math.round(initialRating);

  return (
    <div className="flex flex-col items-center gap-1 group relative">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            onClick={() => handleSelect(val)}
            onMouseEnter={() => canRate && setHoverRating(val)}
            onMouseLeave={() => canRate && setHoverRating(null)}
            disabled={!canRate || isSubmitting}
            className={`transition-all ${canRate ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
          >
            <Star
              className={`w-4 h-4 ${
                val <= currentDisplay
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'fill-transparent text-border2'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="font-mono text-[10px] text-text3 font-bold">{initialRating.toFixed(1)} Avg</span>
    </div>
  );
}

interface VendorsProps {
  currentUser: User;
}

export default function Vendors({ currentUser }: VendorsProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Modal controllers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('IT Hardware');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [vendorStatus, setVendorStatus] = useState<'Active' | 'Inactive' | 'Blacklisted'>('Active');
  const [rating, setRating] = useState('4.0');
  const [onTimePct, setOnTimePct] = useState('95');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    try {
      const res = await apiGet('/api/vendors');
      if (res.success) {
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Error fetching vendors', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd() {
    setErrorMsg('');
    setName('');
    setCategory('IT Hardware');
    setContactName('');
    setEmail('');
    setPhone('');
    setCity('');
    setGstNumber('');
    setRiskLevel('Low');
    setShowAddModal(true);
  }

  function handleOpenEdit(vendor: Vendor) {
    setErrorMsg('');
    setSelectedVendor(vendor);
    setName(vendor.name);
    setCategory(vendor.category);
    setContactName(vendor.contact_name);
    setEmail(vendor.email);
    setPhone(vendor.phone);
    setCity(vendor.city);
    setGstNumber(vendor.gst_number);
    setRiskLevel(vendor.risk_level);
    setVendorStatus(vendor.status);
    setRating(vendor.rating.toString());
    setOnTimePct(vendor.on_time_pct.toString());
    setShowEditModal(true);
  }

  async function handleRateVendor(vendorId: number, ratingValue: number) {
    try {
      const res = await apiPost(`/api/vendors/${vendorId}/rate`, { rating: ratingValue });
      if (res.success) {
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, rating: res.data.rating } : v));
      }
    } catch (err) {
      console.error('Failed to rate vendor', err);
    }
  }

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!name || !contactName || !email || !phone || !city || !gstNumber) {
      setErrorMsg('All mandatory field inputs are required');
      return;
    }

    try {
      const res = await apiPost('/api/vendors/add', {
        name,
        category,
        contact_name: contactName,
        email,
        phone,
        city,
        gst_number: gstNumber,
        risk_level: riskLevel
      });

      if (res.success) {
        setShowAddModal(false);
        fetchVendors();
      } else {
        setErrorMsg(res.error || 'Failed to register vendor profile');
      }
    } catch (err) {
      setErrorMsg('Connection error during vendor registry request');
    }
  }

  async function handleEditVendor(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedVendor) return;

    try {
      const res = await apiPut(`/api/vendors/${selectedVendor.id}`, {
        name,
        category,
        contact_name: contactName,
        email,
        phone,
        city,
        gst_number: gstNumber,
        risk_level: riskLevel,
        status: vendorStatus,
        rating: Number(rating) || 0,
        on_time_pct: Number(onTimePct) || 100
      });

      if (res.success) {
        setShowEditModal(false);
        setSelectedVendor(null);
        fetchVendors();
      } else {
        setErrorMsg(res.error || 'Failed to update vendor credentials');
      }
    } catch (err) {
      setErrorMsg('Network timeout during saving vendor settings');
    }
  }

  async function handleBlacklist(id: number) {
    if (!confirm('Are you absolutely sure you want to black-list/deactivate this vendor?')) return;
    try {
      const res = await apiDelete(`/api/vendors/${id}`);
      if (res.success) {
        fetchVendors();
      } else {
        alert(res.error || 'Delete restricted by server');
      }
    } catch (err) {
      alert('Delete vendor request failed');
    }
  }

  const uniqueCategories = ['All', ...Array.from(new Set(vendors.map(v => v.category)))];

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.contact_name.toLowerCase().includes(search.toLowerCase()) || 
                          v.city.toLowerCase().includes(search.toLowerCase()) ||
                          v.gst_number.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section with interactive filter blocks */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text1">Supplier Registry</h2>
          <p className="text-sm text-text2">Monitor supplier listings, ratings, risk exposure, and compliance levels</p>
        </div>

        {['admin', 'procurement_officer'].includes(currentUser.role) && (
          <button
            onClick={handleOpenAdd}
            className="bg-accent1 hover:bg-accent1/90 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" /> Add New Supplier
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-bg2 border border-border1 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text3"><Search className="w-4.5 h-4.5" /></span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers by name, representative, city, or GSTIN number..."
            className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 placeholder:text-text3 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text2 text-xs font-semibold uppercase flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Filter Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none cursor-pointer"
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendors Data Grid / Table */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-3 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-bg2 border border-border1 rounded-2xl p-12 text-center text-text2">
          <Building className="w-12 h-12 text-text3 mx-auto mb-3" />
          <p className="font-semibold text-text1">No register found matching criteria</p>
          <p className="text-xs text-text3 mt-1">Try relaxing active searches or registering new supplier listings directly.</p>
        </div>
      ) : (
        <div className="bg-bg2 border border-border1 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border1 bg-bg3/50 text-xs font-bold text-text2 uppercase tracking-wider">
                  <th className="py-4 px-5">Supplier Profile</th>
                  <th className="py-4 px-4">Contact Details</th>
                  <th className="py-4 px-4">Location & Tax parameters</th>
                  <th className="py-4 px-4 text-center">Risk Index</th>
                  <th className="py-4 px-4 text-center">Score rating</th>
                  <th className="py-4 px-4 text-center">On-Time rate</th>
                  <th className="py-4 px-4 text-center">Security Check</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border1 text-sm">
                {filteredVendors.map((vendor) => {
                  
                  // Style risk category indicators
                  const riskBadges = {
                    'Low': 'bg-green1/15 text-green1 border-green1/20',
                    'Medium': 'bg-orange1/15 text-orange1 border-orange1/20',
                    'High': 'bg-red1/15 text-red1 border-red1/20 animate-pulse'
                  };

                  const statusBadges = {
                    'Active': 'bg-green1/10 text-green1 border-green1/30',
                    'Inactive': 'bg-bg3 text-text3 border-border2',
                    'Blacklisted': 'bg-red1/15 text-red1 border-red1/30'
                  };

                  return (
                    <tr key={vendor.id} className="hover:bg-bg3/40 transition-colors">
                      
                      {/* Name / Cateogry */}
                      <td className="py-4 px-5 space-y-1">
                        <div className="font-bold text-text1">{vendor.name}</div>
                        <span className="inline-block text-[10px] bg-bg3 text-text2 py-0.5 px-2 rounded-md font-semibold border border-border1">
                          {vendor.category}
                        </span>
                      </td>

                      {/* Contact rep */}
                      <td className="py-4 px-4 text-xs space-y-1">
                        <div className="text-text1 font-medium">{vendor.contact_name}</div>
                        <div className="text-text2 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-text3" /> {vendor.email}</div>
                        <div className="text-text2 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-text3" /> {vendor.phone}</div>
                      </td>

                      {/* Location params */}
                      <td className="py-4 px-4 text-xs space-y-1">
                        <div className="text-text1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent1" /> {vendor.city}</div>
                        <div className="text-text3 font-mono">GST: {vendor.gst_number}</div>
                      </td>

                      {/* Risk */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-xs py-0.5 px-2.5 rounded-full font-bold border ${riskBadges[vendor.risk_level]}`}>
                          {vendor.risk_level}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center">
                          <StarRatingInput
                            initialRating={vendor.rating}
                            vendorId={vendor.id}
                            onRate={handleRateVendor}
                            canRate={['admin', 'procurement_officer'].includes(currentUser.role) && vendor.status !== 'Blacklisted'}
                          />
                        </div>
                      </td>

                      {/* On time speed percentage */}
                      <td className="py-4 px-4 text-center font-mono font-semibold text-text1">
                        <div className="text-xs">{vendor.on_time_pct}%</div>
                        <div className="w-12 bg-bg3 h-1 rounded-full mx-auto mt-1 overflow-hidden">
                          <div style={{ width: `${vendor.on_time_pct}%` }} className="h-full bg-green1" />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[10px] py-0.5 px-2 rounded border font-semibold ${statusBadges[vendor.status]}`}>
                          {vendor.status}
                        </span>
                      </td>

                      {/* Control buttons */}
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        {['admin', 'procurement_officer'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleOpenEdit(vendor)}
                            className="bg-bg3 hover:bg-border1 p-2 rounded-lg text-text1 transition-all cursor-pointer inline-flex items-center"
                            title="Edit supplier properties"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {currentUser.role === 'admin' && vendor.status !== 'Blacklisted' && (
                          <button
                            onClick={() => handleBlacklist(vendor.id)}
                            className="bg-red1/10 hover:bg-red1 hover:text-white p-2 rounded-lg text-red1 transition-all cursor-pointer inline-flex items-center"
                            title="Blacklist profile"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD VENDOR MODAL OVERLAY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bg1/85 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-bg2 border border-border1 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-border1">
              <h3 className="font-bold text-text1 text-md flex items-center gap-1.5">
                <Building className="w-5 h-5 text-accent1" /> Add New Supplier Entry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-text2 hover:text-text1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="m-4 bg-red1/10 border border-dashed border-red1/30 py-2.5 px-4 rounded-xl text-red1 text-xs text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddVendor} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Acme Tech Solutions LLC"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Industry Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none cursor-pointer"
                  >
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Contact Agent name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Smith"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Business Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@supplier.com"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Office Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555-0100"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">City location *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Tax Identification/GST Number *</label>
                  <input
                    type="text"
                    required
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value)}
                    placeholder="e.g. GSTIN99482X"
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Compliance Risk Rating</label>
                  <select
                    value={riskLevel}
                    onChange={e => setRiskLevel(e.target.value as any)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-bg3 hover:bg-border1 text-text2 hover:text-text1 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent1 hover:bg-accent1/90 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md"
                >
                  Confirm Supplier Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL OVERLAY */}
      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 bg-bg1/85 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-bg2 border border-border1 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-border1">
              <h3 className="font-bold text-text1 text-md flex items-center gap-1.5">
                <Edit className="w-5 h-5 text-accent1" /> Modifying Supplier Credentials
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-text2 hover:text-text1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && (
              <div className="m-4 bg-red1/10 border border-dashed border-red1/30 py-2.5 px-4 rounded-xl text-red1 text-xs text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditVendor} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Industry Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  >
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Contact Rep Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Office Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">City Location *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">GST Identification *</label>
                  <input
                    type="text"
                    required
                    value={gstNumber}
                    onChange={e => setGstNumber(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Compliance Risk Rating</label>
                  <select
                    value={riskLevel}
                    onChange={e => setRiskLevel(e.target.value as any)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Status Check</label>
                  <select
                    value={vendorStatus}
                    onChange={e => setVendorStatus(e.target.value as any)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">Performance Rating (0.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    required
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-text2 uppercase mb-1.5">On-Time Contract Completion Ratio (0 - 100%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={onTimePct}
                    onChange={e => setOnTimePct(e.target.value)}
                    className="w-full bg-bg3 border border-border1 text-text1 text-sm rounded-xl py-2 px-3 focus:border-accent1 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border1">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-bg3 hover:bg-border1 text-text2 hover:text-text1 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent1 hover:bg-accent1/90 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md"
                >
                  Save Supplier parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
