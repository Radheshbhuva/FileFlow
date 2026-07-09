import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Glow Box Card */}
        <div className="relative rounded-3xl border border-indigo-500/20 bg-slate-900/40 p-8 sm:p-12 overflow-hidden shadow-2xl text-center space-y-6">
          <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase mx-auto">
            <Sparkles className="w-3 h-3" />
            <span>Instant Workspace Launch</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto">
            Start Managing Files Smarter.
          </h2>
          
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            Create a zero-knowledge encrypted workspace for your team today. No credit card required. Free tier includes up to 5GB storage.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Workspace
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono pt-4">
            Security compliance verified • AES-256 enabled
          </div>
        </div>

      </div>
    </section>
  );
}
