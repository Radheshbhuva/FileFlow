import { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ChevronRight, ChevronDown, AlertTriangle, Globe, Calendar } from 'lucide-react';
import { usePreviewStore } from '../../stores/fileStore';

interface SecurityInsightsProps {
  data: {
    averageSecurityScore: number;
    publicShares: number;
    expiredShares: number;
    filesNeedingAttention: Array<{ id: string; fileName: string; securityScore: number }>;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    securityRecommendations: string[];
    securityScoreBreakdown: {
      workspaceSecurityScore: number;
      averageFileSecurityScore: number;
      shareSecurityScore: number;
    };
  };
}

export default function SecurityCenterWidget({ data }: SecurityInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { openDetails } = usePreviewStore();

  const formattedRisk = data.riskLevel
    ? data.riskLevel.charAt(0) + data.riskLevel.slice(1).toLowerCase()
    : 'Low';

  let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (data.riskLevel === 'HIGH') {
    riskColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (data.riskLevel === 'MEDIUM') {
    riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }

  // Calculate risk factors for visual breakdown bar
  const totalIssues = data.filesNeedingAttention.length;
  const encryptionRisk = Math.min(100, Math.max(10, totalIssues * 20));
  const publicShareRisk = Math.min(100, Math.max(15, data.publicShares * 15));
  const expiringShareRisk = Math.min(100, Math.max(5, data.expiredShares * 10));
  const sumRisk = encryptionRisk + publicShareRisk + expiringShareRisk;

  const pctEncrypt = Math.round((encryptionRisk / sumRisk) * 100) || 33;
  const pctPublic = Math.round((publicShareRisk / sumRisk) * 100) || 33;
  const pctExpiry = Math.round((expiringShareRisk / sumRisk) * 100) || 34;

  const handleAudit = (file: { id: string; fileName: string; securityScore: number }) => {
    // Map to simple file interface for details drawer
    const ext = file.fileName.split('.').pop() || 'bin';
    const fallbackFile: any = {
      id: file.id,
      name: file.fileName,
      sizeBytes: 0,
      sizeLabel: 'Unknown size',
      type: ext,
      uploadDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isFavorite: false,
      downloadCount: 0,
      shareCount: 0,
      sharedStatus: 'private',
      security: {
        score: file.securityScore,
        grade: file.securityScore >= 90 ? 'A' : file.securityScore >= 70 ? 'B' : 'C',
        factors: ['Identified by automated workspace scanner']
      }
    };
    openDetails(fallbackFile);
  };

  return (
    <div className="relative w-full z-30">
      {/* Clickable Header card that acts as dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left rounded-2xl border border-slate-800 bg-slate-900/40 p-4.5 shadow-soft hover:border-slate-700 transition duration-150 flex items-center justify-between cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-sky-500/40"
        aria-expanded={isOpen}
        aria-label="Toggle Security Dashboard dropdown"
      >
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Security Dashboard
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </h3>
            <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
              Click to view safety indexes, risk levels, and critical file audits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Safety Index badge */}
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
            data.averageSecurityScore >= 90
              ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/15'
              : data.averageSecurityScore >= 70
              ? 'text-sky-400 bg-sky-500/10 border-sky-500/15'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/15'
          }`}>
            Safety Index: {data.averageSecurityScore}%
          </span>
          {/* Risk Level Badge */}
          <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${riskColor}`}>
            {formattedRisk} Risk
          </span>
        </div>
      </button>

      {/* Dropdown Menu content overlay - absolutely positioned so it does not affect any other element's dimensions */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4 z-40 backdrop-blur-md animate-slide-in">
          {/* Main Grid: Score, Stats, and Risk Breakdown */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Column 1: Average Security Score circular chart */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/40 border border-slate-850">
              <div className="relative flex items-center justify-center">
                <svg className="h-20 w-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-slate-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - data.averageSecurityScore / 100)}`}
                    className={`stroke-current transition-all duration-500 ${
                      data.averageSecurityScore >= 90
                        ? 'text-emerald-500'
                        : data.averageSecurityScore >= 70
                        ? 'text-sky-500'
                        : 'text-amber-500'
                    }`}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-base font-bold font-mono text-slate-100">
                  {data.averageSecurityScore}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-2">Avg Safety Index</span>
            </div>

            {/* Column 2: Detailed Public and Expiring Metrics */}
            <div className="grid grid-rows-2 gap-2">
              <div className="border border-slate-850 bg-slate-950/20 rounded-xl p-3 flex items-center gap-3">
                <span className="rounded-lg bg-indigo-500/10 p-2 border border-indigo-500/20 shrink-0">
                  <Globe className="h-4 w-4 text-indigo-400" />
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-100 block leading-tight">{data.publicShares} Files</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">Active Shares</span>
                </div>
              </div>

              <div className="border border-slate-850 bg-slate-950/20 rounded-xl p-3 flex items-center gap-3">
                <span className="rounded-lg bg-teal-500/10 p-2 border border-teal-500/20 shrink-0">
                  <Calendar className="h-4 w-4 text-teal-400" />
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-100 block leading-tight">{data.expiredShares} Links</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">Expired Shares</span>
                </div>
              </div>
            </div>

            {/* Column 3: Risk Factor Breakdown Progress Bars */}
            <div className="border border-slate-850 bg-slate-950/20 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
              <h4 className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Risk Distribution</h4>
              
              <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden flex" role="progressbar" aria-label="Risk factor distribution">
                  <div className="bg-rose-500 h-full" style={{ width: `${pctEncrypt}%` }} title={`Encryption: ${pctEncrypt}%`} />
                  <div className="bg-indigo-500 h-full" style={{ width: `${pctPublic}%` }} title={`Permissions: ${pctPublic}%`} />
                  <div className="bg-teal-500 h-full" style={{ width: `${pctExpiry}%` }} title={`Expirations: ${pctExpiry}%`} />
                </div>
                
                <div className="grid grid-cols-3 gap-1 pt-1.5 text-[8.5px] font-semibold">
                  <span className="flex items-center gap-1 text-rose-450">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Encrypt
                  </span>
                  <span className="flex items-center gap-1 text-indigo-450 justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Access
                  </span>
                  <span className="flex items-center gap-1 text-teal-450 justify-end">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" /> Expiry
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations list */}
          {data.securityRecommendations && data.securityRecommendations.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3.5 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Security Recommendations</h4>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-400">
                {data.securityRecommendations.map((rec, idx) => (
                  <li key={idx} className="leading-normal">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Flagged Banner (Needs Attention) - visual priority */}
          {data.filesNeedingAttention.length > 0 && (
            <div className="rounded-xl border border-rose-900/35 bg-rose-950/5 p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-rose-450 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  Critical Review Required ({data.filesNeedingAttention.length})
                </h4>
                <span className="text-[9px] text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  Score &lt; 70
                </span>
              </div>

              <div className="divide-y divide-rose-950/20 max-h-[140px] overflow-y-auto pr-1">
                {data.filesNeedingAttention.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between py-2 text-xs first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="font-semibold text-slate-200 truncate" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-[9.5px] text-rose-400/70 mt-0.5 truncate">
                        Score: {file.securityScore} • Vulnerable file safety index rating
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAudit(file)}
                      className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-rose-450 hover:text-rose-350 transition bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 px-2.5 py-1 rounded-lg"
                    >
                      <span>Audit</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

