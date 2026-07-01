import { useQuery } from '@tanstack/react-query';
import { shareService } from '../../services/shareService';
import { Share2, ArrowUpRight, Copy, ExternalLink, Calendar, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function SharingActivityWidget() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: sharesResponse } = useQuery({
    queryKey: ['shares', { limit: 5 }],
    queryFn: () => shareService.getShares({ limit: 5 }),
    staleTime: 30000,
  });

  const shares = sharesResponse?.shares || [];

  // Render top 3 shared records for density
  const activeShares = [...shares].sort(
    (a, b) => new Date(b.shareDate).getTime() - new Date(a.shareDate).getTime()
  ).slice(0, 3);

  const handleCopy = async (id: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-soft flex flex-col justify-between h-auto space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Share2 className="h-4.5 w-4.5 text-indigo-400" />
          Active File Shares
        </h3>
        <Link
          to="/shared"
          className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
        >
          View All Shared
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {activeShares.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-850 rounded-xl">
          <p className="text-xs text-slate-500">No active shared links.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeShares.map((share) => {
            const isExpired = new Date(share.expiryDate).getTime() < Date.now();
            const isRevoked = share.status === 'revoked';
            const daysLeft = Math.round((new Date(share.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            let statusText = 'Active';
            let statusStyle = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            if (isRevoked) {
              statusText = 'Revoked';
              statusStyle = 'text-slate-500 bg-slate-950 border-slate-850';
            } else if (isExpired) {
              statusText = 'Expired';
              statusStyle = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            }

            return (
              <div
                key={share.id}
                className="flex items-center justify-between rounded-xl border border-slate-850 bg-slate-950/20 p-2.5 hover:border-slate-750 transition text-xs gap-3"
              >
                <div className="min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200 truncate" title={share.fileName}>
                      {share.fileName}
                    </span>
                    <span className={`inline-flex items-center text-[8.5px] font-semibold uppercase px-1 rounded shrink-0 border ${statusStyle}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 truncate">
                    <span className="truncate">To: {share.sharedWith}</span>
                    <span>•</span>
                    <span className="shrink-0 font-mono">
                      {isRevoked ? 'Revoked' : isExpired ? 'Expired' : `${daysLeft}d left`}
                    </span>
                  </div>
                </div>

                {!isRevoked && !isExpired ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(share.id, share.shareLink)}
                    className="shrink-0 inline-flex items-center justify-center rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 font-semibold text-[10px] text-slate-300 hover:text-slate-100 transition"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    <span>{copiedId === share.id ? 'Copied' : 'Copy'}</span>
                  </button>
                ) : (
                  <span className="shrink-0 text-[10px] text-slate-500 font-mono pr-2">
                    {share.downloadCount} dl
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
