import React, { useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, XCircle, Search, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProblemSection() {
  const [solved, setSolved] = useState(false);

  return (
    <section id="features" className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-red-900/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-emerald-950/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">The Problem</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Managing Files Shouldn't Be This Difficult.
          </p>
          <p className="mt-4 text-base text-slate-400">
            Between multiple folders, messy email threads, lost attachments, and security holes, teams lose hours keeping track of their files.
          </p>
        </div>

        {/* Chaos vs Order Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text points */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-200">The everyday friction of file collaboration</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-1 rounded bg-red-500/10 text-red-400 mt-1">
                  <XCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Scattered Files &amp; Platforms</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Slack for quick sharing, email for clients, Google Drive for drafts, and server shares for storage. Nothing is in sync.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 rounded bg-red-500/10 text-red-400 mt-1">
                  <XCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Version Chaos</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Is it `Invoice_final.pdf`, `Invoice_final_v2.pdf`, or `Invoice_final_v2_EDIT.pdf`? Teams overwrite and lose progress daily.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-1 rounded bg-red-500/10 text-red-400 mt-1">
                  <XCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Unsafe Sharing Protocols</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Sending sensitive financial files via public attachments. No passwords, no access limits, and no activity tracking logs.</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setSolved(!solved)}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-300"
              >
                <span>{solved ? 'Show Chaos State' : 'Resolve with FileFlow'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Visual Workspace Canvas */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 min-h-[380px] flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-indigo-500 to-emerald-500" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {solved ? 'FileFlow Organized Workspace' : 'Traditional Disorganized Workspace'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                solved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {solved ? 'System Optimal' : 'Warnings Detected'}
              </span>
            </div>

            {/* Animation Canvas */}
            <div className="relative flex-grow flex items-center justify-center min-h-[240px]">
              <AnimatePresence mode="wait">
                {!solved ? (
                  /* Chaos Mode */
                  <motion.div
                    key="chaos"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full relative h-48"
                  >
                    {/* messy card 1 */}
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute top-0 left-2 w-52 bg-slate-900 border border-red-500/30 p-3 rounded-lg shadow-lg rotate-[-4deg] z-10"
                    >
                      <div className="flex items-center space-x-2 text-xs">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-bold text-slate-300 truncate">Contract_v2_final_NEW.pdf</span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">Uploaded to chat 2 days ago</p>
                    </motion.div>

                    {/* messy card 2 */}
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
                      className="absolute bottom-2 right-2 w-52 bg-slate-900 border border-yellow-500/30 p-3 rounded-lg shadow-lg rotate-[3deg] z-20"
                    >
                      <div className="flex items-center space-x-2 text-xs">
                        <HelpCircle className="w-4 h-4 text-yellow-400 shrink-0" />
                        <span className="font-bold text-slate-300 truncate">Contract_v2_final_FINAL2.pdf</span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">In email attachment</p>
                    </motion.div>

                    {/* messy card 3 - error badge */}
                    <div className="absolute top-1/3 right-1/4 bg-red-950/80 border border-red-900 p-2.5 rounded-lg text-red-400 text-[10px] font-mono z-30 shadow-xl flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Security Hole: Public Link Expired</span>
                    </div>

                    {/* messy card 4 - question box */}
                    <div className="absolute bottom-1/3 left-6 bg-slate-850 border border-slate-750 p-2 rounded text-slate-400 text-[10px] z-0 opacity-60">
                      <span>Where is the updated layout?</span>
                    </div>
                  </motion.div>
                ) : (
                  /* Order Mode (Solved) */
                  <motion.div
                    key="order"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full space-y-3"
                  >
                    {/* Clean single file record */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">Legal_Contract_2026.pdf</p>
                          <p className="text-[9px] text-slate-500">v3 • Updated by Alex • 10m ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                          Active Link
                        </span>
                      </div>
                    </div>

                    {/* Clean file audit status */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                          <CheckCircle className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">Security Vault Encryption</p>
                          <p className="text-[9px] text-slate-500">AES-256 Enabled • Access Restricted</p>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                        Secure
                      </span>
                    </div>

                    <div className="text-center text-xs text-slate-500 pt-2 font-mono flex items-center justify-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>One central source of truth for your entire team.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
