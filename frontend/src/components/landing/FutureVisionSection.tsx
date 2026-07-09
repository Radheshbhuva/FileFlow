import React from 'react';
import { Sparkles, Search, Compass, Users2, BarChart2, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FutureVisionSection() {
  const visionItems = [
    {
      title: 'AI File Intelligence',
      desc: 'Ask questions, summarize drafts, or pull spreadsheet tables out of PDFs directly in the browser via natural language models.',
      icon: Sparkles,
      tag: 'Coming Q4'
    },
    {
      title: 'Deep Semantic Search',
      desc: 'Find items instantly based on context rather than filename matching. Searches text inside scans, slides, and invoice sheets.',
      icon: Search,
      tag: 'Coming Q4'
    },
    {
      title: 'Contextual Recommendations',
      desc: 'Smart workspace dashboard compiles the documents you need before meetings, using Slack signals and calendar events.',
      icon: Compass,
      tag: 'In Beta'
    },
    {
      title: 'Directory Team Provisioning',
      desc: 'Automate workspace provisioning. Synchronize file directories with Okta, Active Directory, and Slack permissions.',
      icon: Users2,
      tag: 'In Beta'
    },
    {
      title: 'Granular Read Analytics',
      desc: 'Measure page read durations, client drop-offs, and referral domains for pitch documents and public brochures.',
      icon: BarChart2,
      tag: 'Coming Q1'
    }
  ];

  return (
    <section id="future" className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-purple-950/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Roadmap</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            The Future of Document Workspaces
          </p>
          <p className="mt-4 text-base text-slate-400">
            We are continuously building. Preview our upcoming platform capabilities designed to make files intelligent.
          </p>
        </div>

        {/* Future Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Main Card (Hero Vision) */}
          <div className="bg-gradient-to-tr from-indigo-950/50 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 flex flex-col justify-between md:col-span-2 lg:col-span-1 shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                <Lightbulb className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Our Ultimate Vision</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Files shouldn't be passive containers of data. We believe a document workspace should actively organize itself, summarize content, flag security anomalies, and keep teams connected. FileFlow is designed from the ground up to realize this dream.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800 text-[10px] font-mono text-indigo-400">
              ROADMAP v2.5 CONFIG ACTIVE
            </div>
          </div>

          {/* Sub Cards */}
          {visionItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-slate-900/30 border border-slate-850 hover:border-slate-750 p-6 rounded-2xl flex flex-col justify-between transition-colors shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-450">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold border border-slate-750">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-2">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
