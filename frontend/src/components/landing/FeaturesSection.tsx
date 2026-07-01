import React from 'react';
import {
  Folder,
  Share2,
  UploadCloud,
  Database,
  Activity,
  ShieldCheck,
  BarChart3,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesSection() {
  const features = [
    {
      title: 'Smart File Management',
      desc: 'Keep files sorted with dynamic folders, category metadata tags, and multi-format filtering.',
      icon: Folder,
      color: 'text-blue-400 bg-blue-500/10'
    },
    {
      title: 'Secure Sharing',
      desc: 'Generate links with custom expiration limits, passwords, and strict domain restrictions.',
      icon: Share2,
      color: 'text-indigo-400 bg-indigo-500/10'
    },
    {
      title: 'Upload Center',
      desc: 'High-throughput drag-and-drop queues with chunked resilience for files up to 10GB.',
      icon: UploadCloud,
      color: 'text-sky-400 bg-sky-500/10'
    },
    {
      title: 'Storage Intelligence',
      desc: 'Get smart storage breakdowns by file format, duplicate reports, and automatic archive suggestions.',
      icon: Database,
      color: 'text-purple-400 bg-purple-500/10'
    },
    {
      title: 'Activity Tracking',
      desc: 'A real-time audit feed log details exactly who viewed, updated, or shared files in your team.',
      icon: Activity,
      color: 'text-pink-400 bg-pink-500/10'
    },
    {
      title: 'Security Insights',
      desc: 'Continuous vulnerability parsing, security score, and zero-knowledge end-to-end encryption.',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'File Analytics',
      desc: 'Monitor downloads count, referral domains, read durations, and view analytics charts.',
      icon: BarChart3,
      color: 'text-yellow-400 bg-yellow-500/10'
    },
    {
      title: 'Favorites & Collections',
      desc: 'Pin critical folders, create customized team playlists, and search files instantly.',
      icon: Star,
      color: 'text-amber-400 bg-amber-500/10'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Core Modules</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Designed for Modern File Workflows
          </p>
          <p className="mt-4 text-base text-slate-400">
            A comprehensive set of tools to store, share, secure, and monitor your files in one workspace.
          </p>
        </div>

        {/* Bento Grid layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                className="group relative bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-300 shadow-md flex flex-col justify-between overflow-hidden"
              >
                {/* Glow border highlight on group hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feat.color} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200 mb-3 group-hover:text-white transition-colors duration-200">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400 group-hover:text-slate-350 transition-colors duration-200">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-[11px] font-bold text-indigo-400 tracking-wider uppercase opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <span>Learn more</span>
                  <span className="ml-1">→</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
