/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from './lib/api.js';
import { User } from './types.js';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Vendors from './components/Vendors.tsx';
import RFQs from './components/RFQs.tsx';
import Quotations from './components/Quotations.tsx';
import Approvals from './components/Approvals.tsx';
import Invoices from './components/Invoices.tsx';
import Reports from './components/Reports.tsx';
import ActivityLogs from './components/ActivityLogs.tsx';

// Icons
import { 
  LayoutDashboard, 
  Building, 
  Layers, 
  FileSpreadsheet, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  History, 
  LogOut, 
  Briefcase,
  UserCheck2,
  Lock,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchActiveSession();
  }, []);

  async function fetchActiveSession() {
    setLoading(true);
    try {
      const res = await apiGet('/api/auth/me');
      if (res.success && res.data) {
        setCurrentUser(res.data);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session verify failed', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const res = await apiPost('/api/auth/logout', {});
      if (res.success) {
        setCurrentUser(null);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Logout request failed', err);
    }
  }

  function handleNavigateWithParams(tabName: string, params: any = null) {
    setNavigationParams(params);
    setActiveTab(tabName);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg1 text-text1 flex flex-col justify-center items-center font-sans">
        <div className="w-12 h-12 border-4 border-accent1/35 border-t-accent1 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-text2 uppercase tracking-widest animate-pulse">Synchronizing Ledger Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // Sidebar item helper list
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendors', name: 'Supplier Registry', icon: Building },
    { id: 'rfqs', name: 'RFQ Files', icon: Layers },
    { id: 'quotations', name: 'Bids & Quotations', icon: FileSpreadsheet },
    { id: 'approvals', name: 'Manager Board', icon: ShieldCheck, roles: ['admin', 'manager'] },
    { id: 'invoices', name: 'Invoices Ledger', icon: FileText },
    { id: 'reports', name: 'ERP Analytics', icon: BarChart3 },
    { id: 'logs', name: 'Security Audits', icon: History }
  ];

  const allowedMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-bg1 text-text1 font-sans flex flex-col md:flex-row relative">
      
      {/* MOBILE HEADER RESPONSIVE BAR (No Print) */}
      <header className="md:hidden bg-bg2 border-b border-border1 py-3 px-5 flex justify-between items-center z-40 no-print sticky top-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-accent1 to-accent2 rounded-lg text-white">
            <Briefcase className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-tight text-md">VendorBridge <span className="text-accent1 text-xs">ERP</span></span>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-text1 p-1.5 rounded-lg border border-border1 bg-bg3 cursor-pointer"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* SIDEBAR MAIN MENU WRAPPER (No Print) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 w-64 bg-bg2 border-r border-border1 p-5 flex flex-col justify-between z-40 transition-transform duration-300 transform no-print
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        <div className="space-y-6">
          
          {/* Logo Brand Header */}
          <div className="items-center gap-2.5 hidden md:flex">
            <div className="p-2 bg-gradient-to-br from-accent1 to-accent2 rounded-xl text-white shadow-lg shadow-accent1/10 flex-shrink-0">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-lg leading-none">VendorBridge</h1>
              <span className="text-[10px] text-text3 font-bold uppercase tracking-wider block mt-1.5">Procurement ERP v1.4</span>
            </div>
          </div>

          {/* Navigation Items menu */}
          <nav className="space-y-1.5 pt-4">
            {allowedMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setNavigationParams(null);
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer
                    ${isActive 
                      ? 'bg-accent1 text-white shadow-lg shadow-accent1/15 font-bold scale-[1.02]' 
                      : 'text-text2 hover:text-text1 hover:bg-bg3/60'}
                  `}
                >
                  <IconComp className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-text3'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer profiles */}
        <div className="border-t border-border1/60 pt-4 space-y-4">
          <div className="flex items-center gap-3 bg-bg3/50 border border-border1/40 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-accent2 text-white flex justify-center items-center text-xs font-bold uppercase ring-2 ring-accent2/2 ring-offset-bg2 ring-offset-2">
              {(currentUser.name || currentUser.email || "U")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-text1 text-xs truncate">{currentUser.name || currentUser.email}</div>
              <div className="text-[10px] text-text3 font-semibold mt-0.5 uppercase tracking-wider flex items-center gap-1">
                <UserCheck2 className="w-3 h-3 text-green1" /> {currentUser.role.replace('_', ' ')}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red1/10 hover:bg-red1 text-red1 hover:text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-red1/20"
          >
            <LogOut className="w-4 h-4" /> End ERP Session
          </button>
        </div>

      </aside>

      {/* OVERLAY FOR MOBILE SCREEN SIDEBAR (No Print) */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-30 md:hidden no-print"
        />
      )}

      {/* MAIN DYNAMIC CONTENT CONTAINER */}
      <main className="flex-1 min-w-0 bg-bg1 overflow-y-auto max-h-screen">
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            currentUser={currentUser} 
            navigateTab={handleNavigateWithParams} 
          />
        )}

        {activeTab === 'vendors' && (
          <Vendors 
            currentUser={currentUser} 
          />
        )}

        {activeTab === 'rfqs' && (
          <RFQs 
            currentUser={currentUser} 
            navigateTab={handleNavigateWithParams}
          />
        )}

        {activeTab === 'quotations' && (
          <Quotations 
            currentUser={currentUser} 
            params={navigationParams}
            navigateTab={handleNavigateWithParams}
          />
        )}

        {activeTab === 'approvals' && (
          <Approvals 
            currentUser={currentUser}
            navigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'invoices' && (
          <Invoices 
            currentUser={currentUser} 
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            currentUser={currentUser} 
          />
        )}

        {activeTab === 'logs' && (
          <ActivityLogs />
        )}

      </main>

    </div>
  );
}
