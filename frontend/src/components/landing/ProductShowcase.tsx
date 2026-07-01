import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Share2,
  User,
  Search,
  HardDrive,
  Lock,
  Plus,
  ArrowRight,
  TrendingUp,
  Download,
  MoreVertical,
  CheckCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'upload' | 'shared' | 'profile'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Files', icon: FolderOpen },
    { id: 'upload', label: 'Upload Center', icon: Upload },
    { id: 'shared', label: 'Shared Files', icon: Share2 },
    { id: 'profile', label: 'Profile Settings', icon: User }
  ];

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent_40%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Product Tour</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            An Intelligent, Unified Workspace
          </p>
          <p className="mt-4 text-base text-slate-400">
            Switch tabs below to preview the actual dashboard experience available to your team.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Showcase Window */}
        <div className="max-w-5xl mx-auto bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-slate-850" />
              <span className="text-xs font-mono text-slate-450">app.fileflow.io/workspace</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search workspace..."
                  readOnly
                  className="bg-slate-950 border border-slate-800 text-xs pl-8 pr-4 py-1.5 rounded-lg w-48 text-slate-450 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tab Content Canvas */}
          <div className="p-6 sm:p-8 min-h-[460px] bg-slate-950 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* Dashboard Content */}
              {activeTab === 'dashboard' && (
                <motion.div
                  key="tour-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 w-full"
                >
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Storage Used</p>
                        <p className="text-xl font-extrabold text-slate-200 mt-1">45.2 GB</p>
                      </div>
                      <HardDrive className="w-8 h-8 text-indigo-500/40" />
                    </div>
                    <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Shared Files</p>
                        <p className="text-xl font-extrabold text-slate-200 mt-1">128 Files</p>
                      </div>
                      <Share2 className="w-8 h-8 text-blue-500/40" />
                    </div>
                    <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Workspace Security</p>
                        <p className="text-xl font-extrabold text-emerald-400 mt-1">98/100</p>
                      </div>
                      <Lock className="w-8 h-8 text-emerald-500/40" />
                    </div>
                  </div>

                  {/* Recent Files Table */}
                  <div className="bg-slate-900/20 border border-slate-850 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-850 bg-slate-900/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-350">Recent Workspace Uploads</span>
                      <button className="text-[10px] font-semibold text-indigo-400 hover:underline">View all</button>
                    </div>
                    <div className="divide-y divide-slate-900">
                      {[
                        { name: 'API_Documentation_v2.pdf', size: '1.4 MB', type: 'PDF Document', date: '3m ago' },
                        { name: 'Branding_Assets.zip', size: '124.5 MB', type: 'Archive Zip', date: '25m ago' },
                        { name: 'Product_Roadmap_Q4.xlsx', size: '4.2 MB', type: 'Excel Sheet', date: '2h ago' }
                      ].map((file, idx) => (
                        <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/20 text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <div>
                              <p className="font-semibold text-slate-300">{file.name}</p>
                              <p className="text-[10px] text-slate-550 mt-0.5">{file.type} • {file.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-slate-500 text-[10px]">{file.date}</span>
                            <MoreVertical className="w-4 h-4 text-slate-650" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* My Files Content */}
              {activeTab === 'files' && (
                <motion.div
                  key="tour-files"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 w-full"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Root Directory</span>
                    <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Folder</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['Engineering', 'Marketing Assets', 'Finance Docs'].map((folder, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-900/30 hover:border-slate-700 transition-colors flex items-center space-x-3 cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          DIR
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{folder}</p>
                          <p className="text-[10px] text-slate-500">14 Files • 1.2 GB</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-slate-850 rounded-xl divide-y divide-slate-900 bg-slate-900/10">
                    {[
                      { name: 'logo_transparent.png', size: '245 KB', type: 'PNG Image', folder: 'Marketing Assets' },
                      { name: 'system_diagram.svg', size: '12 KB', type: 'Vector SVG', folder: 'Engineering' }
                    ].map((file, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/20 text-xs">
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-500 font-mono">[{file.type.split(' ')[0]}]</span>
                          <span className="font-semibold text-slate-200">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">In {file.folder}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Upload Content */}
              {activeTab === 'upload' && (
                <motion.div
                  key="tour-upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 w-full flex flex-col justify-center items-center"
                >
                  <div className="w-full max-w-md border-2 border-dashed border-slate-800 rounded-xl p-8 text-center space-y-4 bg-slate-900/10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Drag files here to upload</p>
                      <p className="text-[10px] text-slate-500 mt-1">Supports PDF, ZIP, PNG, CSV up to 10GB</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                      Select Files
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Shared Files Content */}
              {activeTab === 'shared' && (
                <motion.div
                  key="tour-shared"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 w-full"
                >
                  <div className="bg-slate-900/20 border border-slate-850 rounded-xl divide-y divide-slate-900">
                    {[
                      { name: 'Pitch_Deck_2026.pdf', downloads: 142, expiry: 'In 3 days', status: 'Password Active' },
                      { name: 'Beta_Signups.xlsx', downloads: 24, expiry: 'Expired 1h ago', status: 'Disabled' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{item.name}</p>
                          <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {item.downloads} downloads</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expiry: {item.expiry}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            item.status === 'Disabled' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {item.status}
                          </span>
                          <button className="text-[10px] font-semibold text-red-400 border border-red-500/20 px-2 py-1 rounded bg-red-500/5 hover:bg-red-500/10">
                            Revoke Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Profile Content */}
              {activeTab === 'profile' && (
                <motion.div
                  key="tour-profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 w-full max-w-md mx-auto"
                >
                  <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-xl space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        JD
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Jordan Davidson</h4>
                        <p className="text-[10px] text-slate-500">jordan@company.com • Enterprise Owner</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-slate-450">
                        <span>Workspace Storage Space</span>
                        <span>45.2 GB of 100 GB</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: '45.2%' }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Multi-Factor Auth Enabled
                      </span>
                      <button className="text-[10px] text-indigo-400 font-bold hover:underline">Manage Settings</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <span className="text-[11px] text-slate-500 leading-normal">
                All changes synchronize across web, mobile, CLI, and team workspaces instantly.
              </span>
              <button
                onClick={() => setActiveTab(activeTab === 'dashboard' ? 'files' : 'dashboard')}
                className="text-xs text-indigo-400 font-bold flex items-center space-x-1 hover:underline"
              >
                <span>Interactive Preview Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
