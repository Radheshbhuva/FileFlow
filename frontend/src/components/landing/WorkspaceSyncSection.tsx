import React, { useState, useEffect } from 'react';
import { Upload, HardDrive, Share2, Activity, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceSyncSection() {
  const [syncState, setSyncState] = useState<'uploading' | 'stored' | 'logged' | 'shared'>('uploading');

  // Looping sync sequence
  useEffect(() => {
    const states: ('uploading' | 'stored' | 'logged' | 'shared')[] = ['uploading', 'stored', 'logged', 'shared'];
    const timer = setInterval(() => {
      setSyncState((prev) => {
        const nextIndex = (states.indexOf(prev) + 1) % states.length;
        return states[nextIndex];
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Copy */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono uppercase">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Real-Time Sync Engine</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              One Upload. Immediate Synchronization.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Forget waiting for pages to refresh. FileFlow uses reactive cloud webhooks and S3 event bridges to coordinate updates instantly. As soon as a file is ingested, storage space, audit trails, activity feeds, and shared nodes synchronize everywhere.
            </p>

            <div className="space-y-3.5 pt-4">
              {[
                { state: 'uploading', label: '1. Ingestion Queue', desc: 'Securely chunking the raw file stream.' },
                { state: 'stored', label: '2. Storage Analytics', desc: 'Recalculating workspace folder totals.' },
                { state: 'logged', label: '3. Team Audit Log Feed', desc: 'Recording file actions for compliance.' },
                { state: 'shared', label: '4. Node Link Activation', desc: 'Publishing link access keys instantly.' }
              ].map((item) => (
                <button
                  key={item.state}
                  onClick={() => setSyncState(item.state as any)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                    syncState === item.state
                      ? 'bg-slate-900 border-blue-500/40 text-blue-300 shadow-md'
                      : 'bg-transparent border-slate-900 text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${
                      syncState === item.state ? 'bg-blue-400' : 'bg-slate-800'
                    }`} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                  <span className="text-[10px] opacity-80 font-medium hidden sm:inline">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visualization Graphics */}
          <div className="lg:col-span-7 bg-slate-900/35 border border-slate-850 rounded-2xl p-8 min-h-[380px] flex items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

            <div className="relative w-full max-w-sm aspect-[4/3] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between p-6 shadow-xl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" /> SYNC_PIPELINE.LOG
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                  State: {syncState.toUpperCase()}
                </span>
              </div>

              {/* Dynamic Step View */}
              <div className="flex-grow flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {syncState === 'uploading' && (
                    <motion.div
                      key="sync-uploading"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center space-y-4 w-full"
                    >
                      <div className="w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                        <Upload className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Ingesting Q4_Sales_Plan.xlsx</p>
                        <p className="text-[10px] text-slate-550 mt-1">Chunk #24 / 45 • 52% Transmitted</p>
                      </div>
                      <div className="w-36 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-blue-500 animate-[pulse_1.5s_infinite]" style={{ width: '52%' }} />
                      </div>
                    </motion.div>
                  )}

                  {syncState === 'stored' && (
                    <motion.div
                      key="sync-stored"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="text-center space-y-4 w-full"
                    >
                      <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Recalculating Storage Allocations</p>
                        <p className="text-[10px] text-indigo-400 font-mono mt-1">+14.2 MB added to /Finance</p>
                      </div>
                      <div className="w-40 bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-left text-[9px] font-mono text-slate-450 mx-auto space-y-1">
                        <div>Total: 45.21 GB / 100 GB</div>
                        <div>Available Space: 54.79 GB</div>
                      </div>
                    </motion.div>
                  )}

                  {syncState === 'logged' && (
                    <motion.div
                      key="sync-logged"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center space-y-4 w-full"
                    >
                      <div className="w-14 h-14 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mx-auto">
                        <Activity className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Writing Team Audit Trail</p>
                        <p className="text-[10px] text-slate-500 mt-1">Status: Logged successfully</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 max-w-[280px] mx-auto text-left text-[10px] leading-normal text-slate-350">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                          <span className="font-bold text-slate-200">Jordan D. (Owner)</span>
                        </div>
                        <p className="text-slate-500 text-[9px] mt-0.5">ACTION: UPLOADED Q4_Sales_Plan.xlsx • 1s ago</p>
                      </div>
                    </motion.div>
                  )}

                  {syncState === 'shared' && (
                    <motion.div
                      key="sync-shared"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center space-y-4 w-full"
                    >
                      <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Active Link Access Nodes</p>
                        <p className="text-[10px] text-emerald-400 font-mono mt-1">LINK DEPLOYED &amp; ONLINE</p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 bg-slate-900 border border-slate-850 p-2.5 rounded-lg max-w-[240px] mx-auto">
                        <span className="text-[9px] font-mono text-indigo-400 select-all truncate">fileflow.io/s/q4_sales_26</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-600 text-center font-mono pt-4 border-t border-slate-850">
                Reactive DB Sync Latency: &lt;140ms
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
