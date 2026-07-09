import React, { useState } from 'react';
import { Shield, ShieldAlert, Key, Globe, Eye, Server, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecuritySection() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const securitySpecs = [
    {
      id: 'encryption',
      title: 'AES-256 Bit Encryption',
      desc: 'Files are encrypted both in transit and at rest. Zero-knowledge protocols mean not even FileFlow staff can access your contents.',
      icon: Key
    },
    {
      id: 'domain',
      title: 'Protected Sharing & Domain Limits',
      desc: 'Lock shared download permissions down to specific email invitees, passcode restrictions, or domain names.',
      icon: Globe
    },
    {
      id: 'logging',
      title: 'Full Audit Trail Activity Logs',
      desc: 'Track files from creation to deletion. Detailed timestamp reports list all visitor downloads, IP addresses, and user roles.',
      icon: Eye
    },
    {
      id: 'cloud',
      title: 'AWS Cloud-Native Architecture',
      desc: 'Built using secure AWS S3, CloudFront edge delivery networks, and RDS schemas, providing 99.999999999% durability.',
      icon: Server
    }
  ];

  return (
    <section id="security" className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Interactive Shield Display */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-900/35 border border-slate-850 rounded-2xl aspect-[4/3] relative overflow-hidden shadow-2xl">
            {/* Glowing lines background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

            {/* Central Animated Shield */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative w-48 h-48 bg-slate-950 border-2 border-indigo-500/40 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              <Shield className="w-24 h-24 text-indigo-400 group-hover:scale-105 transition-transform duration-300" />
              <Lock className="w-8 h-8 absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
              
              {/* Surrounding Node Badges */}
              <div
                onMouseEnter={() => setHoveredNode('encryption')}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute -top-4 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-300 ${
                  hoveredNode === 'encryption' ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                AES-256 Active
              </div>

              <div
                onMouseEnter={() => setHoveredNode('domain')}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute top-1/3 -right-8 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-300 ${
                  hoveredNode === 'domain' ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Domain Lock
              </div>

              <div
                onMouseEnter={() => setHoveredNode('logging')}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-300 ${
                  hoveredNode === 'logging' ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Full Auditing
              </div>

              <div
                onMouseEnter={() => setHoveredNode('cloud')}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute top-1/3 -left-8 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all duration-300 ${
                  hoveredNode === 'cloud' ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 scale-105' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                AWS Cloud
              </div>
            </motion.div>

            {/* Explainer Box */}
            <div className="mt-8 text-center min-h-[44px]">
              <AnimatePresence mode="wait">
                {hoveredNode ? (
                  <motion.p
                    key={hoveredNode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-indigo-300 font-medium"
                  >
                    Hovering: {securitySpecs.find((s) => s.id === hoveredNode)?.title}
                  </motion.p>
                ) : (
                  <p className="text-xs text-slate-500 font-mono">Hover over the shield segments to review protection details.</p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Text & Feature Highlights */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Enterprise Security</h2>
              <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Zero-Knowledge Privacy. Guaranteed.
              </p>
              <p className="mt-4 text-base text-slate-400 leading-relaxed">
                We safeguard your enterprise files using rigorous cloud standards. From military-grade encryption to real-time scanning pipelines, your file assets are fully protected at all times.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {securitySpecs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.id}
                    onMouseEnter={() => setHoveredNode(spec.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`p-5 rounded-xl border transition-all duration-300 ${
                      hoveredNode === spec.id ? 'bg-slate-900 border-indigo-500/30' : 'bg-slate-900/20 border-slate-850'
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5 text-indigo-400 mb-3.5" />
                    <h3 className="text-sm font-bold text-slate-200 mb-1.5">{spec.title}</h3>
                    <p className="text-[11px] leading-relaxed text-slate-400">{spec.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
