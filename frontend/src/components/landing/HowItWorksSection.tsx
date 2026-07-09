import React, { useState, useEffect } from 'react';
import { UploadCloud, FolderHeart, Lock, Share, ArrowRight, Eye, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [userInterrupted, setUserInterrupted] = useState(false);

  const steps = [
    {
      title: 'Upload Instantly',
      description: 'Drag your folders or files straight into the browser. We support files up to 10GB with high-throughput chunks.',
      icon: UploadCloud,
      color: 'from-blue-600 to-cyan-500'
    },
    {
      title: 'Auto-Organize',
      description: 'FileFlow assigns file-type taxonomy, extracts metadata, and groups files in smart collections without manual tagging.',
      icon: FolderHeart,
      color: 'from-indigo-600 to-purple-500'
    },
    {
      title: 'Zero-Knowledge Security',
      description: 'Files are encrypted in transit and at rest using AES-256. Lock options allow strict authorization guards.',
      icon: Lock,
      color: 'from-pink-600 to-red-500'
    },
    {
      title: 'Share & Collaborate',
      description: 'Generate password-protected, time-restricted sharing links. Keep tabs on download activities instantly.',
      icon: Share,
      color: 'from-emerald-600 to-teal-500'
    }
  ];

  // Auto transition steps every 4 seconds unless interrupted by the user
  useEffect(() => {
    if (userInterrupted) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [userInterrupted]);

  const handleStepClick = (idx: number) => {
    setActiveStep(idx);
    setUserInterrupted(true);
  };

  return (
    <section id="how-it-works" className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Workflow</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            How FileFlow Works
          </p>
          <p className="mt-4 text-base text-slate-400">
            A frictionless pipeline from local storage to collaborative, secure distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Vertical Steps Selector */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleStepClick(idx)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-start space-x-4 ${
                    isActive
                      ? 'bg-slate-900 border-indigo-500/40 shadow-lg text-white'
                      : 'bg-transparent border-transparent hover:bg-slate-900/30 text-slate-450 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 bg-slate-850 ${
                    isActive ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-1.5">{step.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-400">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Preview */}
          <div className="lg:col-span-7 bg-slate-900/20 border border-slate-850 rounded-2xl p-8 min-h-[400px] flex items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Animation Canvas */}
            <div className="relative w-full max-w-sm aspect-[4/3] bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center p-6 shadow-xl">
              <AnimatePresence mode="wait">
                {activeStep === 0 && (
                  <motion.div
                    key="step-upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center text-center space-y-4 w-full"
                  >
                    <div className="relative w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <motion.div
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                      >
                        <UploadCloud className="w-10 h-10" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-300">File Ingestion Queue</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Speed: 45 MB/s • Status: Processing</p>
                    </div>
                    {/* Animated chunks */}
                    <div className="flex space-x-1 justify-center items-center">
                      <span className="w-1.5 h-3 bg-blue-500 rounded animate-pulse" />
                      <span className="w-1.5 h-3 bg-blue-500 rounded animate-pulse delay-75" />
                      <span className="w-1.5 h-3 bg-blue-500 rounded animate-pulse delay-150" />
                      <span className="w-1.5 h-1.5 bg-slate-700 rounded" />
                      <span className="w-1.5 h-1.5 bg-slate-700 rounded" />
                    </div>
                  </motion.div>
                )}

                {activeStep === 1 && (
                  <motion.div
                    key="step-organize"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full space-y-4"
                  >
                    <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-wider">AUTO INDEXING &amp; CATEGORIES</p>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-bold text-slate-200">System_Design_Draft.pdf</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">PDF Document</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                        >
                          #Engineering
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                        >
                          #Q3_Planning
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                        >
                          #System_Arch
                        </motion.span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded text-[10px] text-slate-400 font-mono">
                        File Type: PDF • Storage Class: Intelligent
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="step-secure"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col items-center text-center space-y-4 w-full"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 relative">
                      <Lock className="w-7 h-7" />
                      {/* Scanning visual circle */}
                      <div className="absolute inset-0 border-2 border-red-500/40 rounded-full animate-ping" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">AES-256 Multi-Layer Cryptography</p>
                      <p className="text-[10px] text-red-400 font-mono mt-0.5">ENCRYPTION KEY ACTIVE</p>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-850 p-3 rounded-lg text-left text-[9px] font-mono text-slate-400 space-y-1">
                      <div>sha256: 8f3d8a9c...8b73f2a</div>
                      <div>Access Policy: Private (Zero Trust)</div>
                    </div>
                  </motion.div>
                )}

                {activeStep === 3 && (
                  <motion.div
                    key="step-share"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full space-y-4"
                  >
                    <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-wider">COLLABORATION LINK</p>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-200">Secure Download Token</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">1 Time Use</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value="https://fileflow.io/share/x92_k29"
                          className="w-full bg-slate-950 border border-slate-800 text-[10px] font-mono px-2.5 py-2 rounded text-indigo-400 select-all"
                        />
                        <button className="px-2.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-450 mt-1">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Track views, downloads, IP restrictions.</span>
                      </div>
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
