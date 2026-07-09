import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Upload, FileText, Share2, Users, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroSection() {
  const navigate = useNavigate();
  const [animationStep, setAnimationStep] = useState(0);

  // Auto-run the workflow steps
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 5);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const stepsInfo = [
    { label: '1. Secure Upload', desc: 'Drag & Drop files up to 10GB.' },
    { label: '2. Smart Workspace', desc: 'Files categorized and parsed.' },
    { label: '3. Instant Share', desc: 'Secure links with custom permissions.' },
    { label: '4. Team Activity', desc: 'Real-time audit log of team actions.' },
    { label: '5. Security Status', desc: 'Encrypted at rest with AES-256.' }
  ];

  return (
    <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Tagline pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>New: Team Workspace Sync v2.0</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-[1.1] mb-6"
          >
            Make File Storage, Sharing &amp; Collaboration Effortless.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            FileFlow helps teams securely upload, organize, manage, and share files across platforms from a single intelligent workspace.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Workflow</span>
            </a>
          </motion.div>
        </div>

        {/* Interactive Visualization Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Outer Border with Glowing Edges */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-sky-500/10 rounded-2xl filter blur-xl opacity-80" />

          {/* Dashboard Box */}
          <div className="relative bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/10">
            {/* Header bar of Dashboard */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/40" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <span className="w-3 h-3 rounded-full bg-green-500/40" />
                <span className="text-xs text-slate-500 font-mono pl-2">dashboard_flow_sim.sh</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-850 text-indigo-400 font-medium">Auto Simulation</span>
              </div>
            </div>

            {/* Main Interactive Screen Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[380px]">
              {/* Simulator Left Actions */}
              <div className="p-6 border-r border-slate-800 bg-slate-900/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Workflow Steps</h3>
                  <div className="space-y-3">
                    {stepsInfo.map((step, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAnimationStep(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-300 ${
                          animationStep === idx
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300 shadow-md'
                            : 'bg-transparent border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{step.label}</div>
                        <div className="text-[11px] mt-0.5 opacity-80 leading-normal">{step.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block pt-4 text-[10px] text-slate-650 font-mono">
                  Press tags to preview each flow.
                </div>
              </div>

              {/* Main Visualizer Area */}
              <div className="md:col-span-2 p-8 flex flex-col justify-center bg-slate-950 relative overflow-hidden">
                {/* Visual elements container */}
                <div className="relative w-full max-w-md mx-auto aspect-[16/10] bg-slate-900/35 border border-slate-850 rounded-xl flex items-center justify-center p-6 shadow-inner">
                  <AnimatePresence mode="wait">
                    {/* Step 0: Upload Initial */}
                    {animationStep === 0 && (
                      <motion.div
                        key="step0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center text-center space-y-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-slate-850 border border-slate-850 flex items-center justify-center text-indigo-400 shadow-lg relative">
                          <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Upload className="w-8 h-8" />
                          </motion.div>
                          <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-60" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">Simulating File Upload</p>
                          <p className="text-xs text-slate-500 mt-1">Upload Q3_Reports.xlsx</p>
                        </div>
                        {/* Fake Upload Progress bar */}
                        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3, ease: 'easeInOut' }}
                            className="h-full bg-indigo-500"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 1: Workspace Entry */}
                    {animationStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="w-full space-y-4"
                      >
                        <p className="text-xs font-mono text-slate-500 text-center">FILE ADDED TO WORKSPACE</p>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                              <FileText className="w-5.5 h-5.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">Q3_Reports.xlsx</p>
                              <p className="text-[10px] text-slate-550">14.6 MB • Excel Sheet</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-850 text-indigo-400 font-mono">
                            Workspace / Financial
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 text-center">
                          Auto-organized. Stored securely inside modern storage arrays.
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Shared State */}
                    {animationStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full space-y-4"
                      >
                        <p className="text-xs font-mono text-slate-500 text-center">SECURE SHARE LINK GENERATED</p>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                              <Share2 className="w-3.5 h-3.5 text-blue-400" /> Share Link
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">
                              Anyone with password
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              readOnly
                              value="https://fileflow.io/s/q3_r82k1"
                              className="w-full bg-slate-950 border border-slate-800 text-[10px] font-mono px-2 py-1.5 rounded text-indigo-400 select-all"
                            />
                            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            <div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">JD</div>
                            <div className="w-6 h-6 rounded-full bg-green-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">AM</div>
                            <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold">SK</div>
                            <span className="text-[9px] text-slate-500 pl-3">Shared with 3 team members</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Team Activity updates */}
                    {animationStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-4"
                      >
                        <p className="text-xs font-mono text-slate-500 text-center">REAL-TIME TEAM ACTIVITY FEED</p>
                        <div className="space-y-2">
                          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[8px] font-bold">JD</div>
                              <span className="text-slate-300 font-medium">Jordan D.</span>
                              <span className="text-slate-500">downloaded file</span>
                            </div>
                            <span className="text-[10px] text-slate-650 font-mono">Just now</span>
                          </div>
                          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs opacity-75">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[8px] font-bold">AM</div>
                              <span className="text-slate-300 font-medium">Alice M.</span>
                              <span className="text-slate-500">updated settings</span>
                            </div>
                            <span className="text-[10px] text-slate-650 font-mono">2m ago</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Security Status */}
                    {animationStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className="flex flex-col items-center text-center space-y-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shadow-lg relative">
                          <ShieldCheck className="w-8 h-8" />
                          <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping opacity-60" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">Security Check Complete</p>
                          <p className="text-xs text-green-400 font-mono mt-1">AES-256 SECURED • SAFE</p>
                        </div>
                        <div className="text-[11px] text-slate-450 max-w-xs leading-normal">
                          All files scanned for vulnerabilities and locked with zero-knowledge keys.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
