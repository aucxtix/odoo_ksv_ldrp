/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { apiPost, authHelper } from '../lib/api.js';
import { User, UserRole } from '../types.js';
import { Shield, Key, Mail, UserPlus, LogIn, Briefcase, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('procurement_officer');
  const [vendorId, setVendorId] = useState<string>('1');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick Demo Accounts login data
  const demoUsers = [
    { label: 'Admin (Sarah)', email: 'admin@vendorbridge.com', pass: 'admin123', bg: 'hover:bg-accent2/20 border-accent2/30 text-accent2' },
    { label: 'Procurement (Bob)', email: 'officer@vendorbridge.com', pass: 'officer123', bg: 'hover:bg-accent1/20 border-accent1/30 text-accent1' },
    { label: 'Manager (Alice)', email: 'manager@vendorbridge.com', pass: 'manager123', bg: 'hover:bg-orange1/20 border-orange1/30 text-orange1' },
    { label: 'Vendor (Silicon Systems)', email: 'silicon@vendorbridge.com', pass: 'silicon123', bg: 'hover:bg-green1/20 border-green1/30 text-green1' },
  ];

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await apiPost('/api/auth/login', { email, password });
        if (res.success && res.data) {
          authHelper.setToken(res.data.token);
          onLoginSuccess(res.data.user);
        } else {
          setError(res.error || 'Authentication failed. Please verify credentials.');
        }
      } else {
        const payload = {
          name,
          email,
          password,
          role,
          vendor_id: role === 'vendor' ? Number(vendorId) : null,
        };
        const res = await apiPost('/api/auth/signup', payload);
        if (res.success) {
          setError('Account registered successfully! You can login now.');
          setIsLogin(true);
          setPassword('');
        } else {
          setError(res.error || 'Sign up registration failed');
        }
      }
    } catch (err: any) {
      setError('Connection refused by authentication gateway API server');
    } finally {
      setLoading(false);
    }
  }

  async function triggerDemoLogin(demoEmail: string, demoPass: string) {
    setError('');
    setLoading(true);
    try {
      const res = await apiPost('/api/auth/login', { email: demoEmail, password: demoPass });
      if (res.success && res.data) {
        authHelper.setToken(res.data.token);
        onLoginSuccess(res.data.user);
      } else {
        setError(res.error || 'Demo login failed');
      }
    } catch (err) {
      setError('Network communication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg1 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-accent1/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-accent2/10 blur-[120px] pointer-events-none" />

      {/* Main card panel */}
      <div className="w-full max-w-md bg-bg2 rounded-2xl border border-border1 shadow-2xl p-8 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex justify-center items-center bg-bg3 border border-border2 p-3 rounded-2xl text-accent1 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-text1 tracking-tight">VendorBridge</h1>
          <p className="text-text2 text-sm mt-1">Unified Procurement & Supplier ERP Gateway</p>
        </div>

        {error && (
          <div className={`text-sm py-3 px-4 rounded-xl border border-dashed mb-5 text-center ${
            error.includes('successfully') 
              ? 'bg-green1/10 border-green1/40 text-green1' 
              : 'bg-red1/10 border-red1/40 text-red1'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text3"><LogIn className="w-4 h-4" /></span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Corporate Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text3"><Mail className="w-4 h-4" /></span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@vendorbridge.com"
                className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text3"><Key className="w-4 h-4" /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text3 hover:text-text1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div>
                <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">ERP Role Assignment</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 rounded-xl py-2.5 px-3 text-sm outline-none transition-all"
                >
                  <option value="procurement_officer">Procurement Officer</option>
                  <option value="manager">Approvals Manager</option>
                  <option value="vendor">Vendor Entity</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              {role === 'vendor' && (
                <div>
                  <label className="block text-xs font-semibold text-text2 uppercase tracking-wider mb-1.5">Vendor Supplier Link</label>
                  <select
                    value={vendorId}
                    onChange={e => setVendorId(e.target.value)}
                    className="w-full bg-bg3 border border-border1 focus:border-accent1 text-text1 rounded-xl py-2.5 px-3 text-sm outline-none transition-all"
                  >
                    <option value="1">Silicon Systems</option>
                    <option value="2">Paper & More</option>
                    <option value="3">Apex Logistics</option>
                    <option value="4">Micro Circuits</option>
                    <option value="5">Global Forge</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent1 hover:bg-accent1/90 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In securely
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Register ERP Account
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent1 hover:underline text-sm font-medium focus:outline-none"
          >
            {isLogin ? "Need a corporate account? Register here" : "Return to security credential login portal"}
          </button>
        </div>

        {/* Quick login drawer/tabs */}
        <div className="mt-8 border-t border-border1 pt-6 text-center">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wider mb-3">Quick Demo Authentication Profiles</p>
          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((user, i) => (
              <button
                key={i}
                type="button"
                onClick={() => triggerDemoLogin(user.email, user.pass)}
                className={`text-left text-xs p-2 rounded-xl border transition-all ${user.bg}`}
              >
                <div className="font-bold truncate">{user.label}</div>
                <div className="text-[10px] opacity-75 truncate">{user.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
