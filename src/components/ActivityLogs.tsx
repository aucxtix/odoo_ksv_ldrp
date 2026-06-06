/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';
import { ActivityLog } from '../types.js';
import { Clock, ShieldCheck, RefreshCw, UserCheck, Inbox } from 'lucide-react';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await apiGet('/api/reports/logs');
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header section */}
      <div className="flex justify-between items-center bg-bg2 border border-border1 rounded-2xl p-5 md:p-6">
        <div>
          <h2 className="text-2xl font-bold text-text1">Audit Trial & Activity Timeline</h2>
          <p className="text-sm text-text2">Monitor system-wide ledger modifications, compliance audits & access telemetry logs</p>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-bg3 hover:bg-bg4 border border-border1 text-text1 text-xs font-bold py-2 px-4 rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5"
          title="Refresh log stream"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Stream
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-8 h-8 border-3 border-accent1/30 border-t-accent1 rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-bg2 border border-border1 rounded-2xl p-12 text-center text-text2">
          <Inbox className="w-12 h-12 text-text3 mx-auto mb-3" />
          <p className="font-semibold text-text1">Audit stream empty</p>
          <p className="text-xs text-text3 mt-1">No activities recorded inside the system ledger database.</p>
        </div>
      ) : (
        <div className="bg-bg2 border border-border1 rounded-2xl p-6 relative max-w-4xl mx-auto shadow-xl">
          <span className="absolute top-6 bottom-6 left-10 w-0.5 bg-border1/60 z-0" />

          <div className="space-y-6 relative z-10">
            {logs.map((log) => {
              
              // Map visual colored points depending on transaction category
              let dotColor = 'bg-accent1 ring-accent1/20';
              if (log.entity_type === 'approval') dotColor = 'bg-orange1 ring-orange1/20';
              if (log.entity_type === 'po') dotColor = 'bg-green1 ring-green1/20';
              if (log.entity_type === 'invoice') dotColor = 'bg-accent2 ring-accent2/20';
              if (log.entity_type === 'rfq') dotColor = 'bg-yellow1 ring-yellow1/20';

              return (
                <div key={log.id} className="flex gap-6 text-sm items-start">
                  
                  {/* Timeline point indicator */}
                  <div className={`w-8 h-8 rounded-full flex justify-center items-center border border-border1 bg-bg3 flex-shrink-0 ring-4 ${dotColor}`}>
                    <Clock className="w-4 h-4 text-text1" />
                  </div>

                  {/* Log Content body */}
                  <div className="bg-bg3 border border-border1 rounded-xl p-4 flex-1 space-y-1.5 hover:border-border2 transition-all">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1 pb-1.5 border-b border-border1/55">
                      <span className="font-bold text-text1 text-sm">{log.action}</span>
                      <span className="text-[10px] text-text3 font-mono font-semibold self-end sm:self-auto uppercase tracking-wider">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                      </span>
                    </div>

                    <p className="text-text2 text-xs leading-relaxed italic">"{log.details}"</p>

                    <div className="flex flex-wrap gap-2 pt-2.5 items-center text-[10px]">
                      <span className="bg-bg4 text-text2 py-0.5 px-2 rounded-md font-bold uppercase tracking-wider font-mono">
                        {log.entity_type} ID: {log.entity_id}
                      </span>
                      <span className="text-text3 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Author route: {log.user_name || 'System Gateway'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
