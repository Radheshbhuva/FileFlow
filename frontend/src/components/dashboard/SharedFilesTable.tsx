import type { SharedFile } from '../../types/dashboard';

const statusStyles: Record<SharedFile['status'], string> = {
  active: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  expired: 'bg-slate-500/10 text-slate-400 ring-slate-400/20',
  revoked: 'bg-rose-500/10 text-rose-300 ring-rose-400/20'
};

interface SharedFileRowProps {
  file: SharedFile;
  onCopyLink: (id: string, link: string) => void;
  onRevoke: (id: string) => void;
}

export function SharedFileRow({ file, onCopyLink, onRevoke }: SharedFileRowProps) {
  return (
    <tr className="border-b border-slate-800/60 last:border-b-0">
      <td className="px-4 py-3.5">
        <span className="text-sm font-medium text-slate-100">{file.fileName}</span>
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-400 sm:table-cell">{file.sharedWith}</td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-400 md:table-cell">{file.shareDate}</td>
      <td className="px-4 py-3.5 text-sm text-slate-400">{file.expiryDate}</td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[file.status]}`}>
          {file.status}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onCopyLink(file.id, file.shareLink)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-slate-800"
            aria-label={`Copy link for ${file.fileName}`}
          >
            Copy Link
          </button>
          <button
            type="button"
            onClick={() => onRevoke(file.id)}
            disabled={file.status !== 'active'}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Revoke access for ${file.fileName}`}
          >
            Revoke
          </button>
        </div>
      </td>
    </tr>
  );
}

interface SharedFilesTableProps {
  files: SharedFile[];
  onCopyLink: (id: string, link: string) => void;
  onRevoke: (id: string) => void;
}

export default function SharedFilesTable({ files, onCopyLink, onRevoke }: SharedFilesTableProps) {
  return (
    <section aria-labelledby="shared-files-heading" className="rounded-2xl border border-slate-800/90 bg-slate-900/50 shadow-soft">
      <header className="border-b border-slate-800/80 px-5 py-4">
        <h2 id="shared-files-heading" className="text-base font-semibold text-slate-100">
          Shared Files
        </h2>
        <p className="mt-1 text-sm text-slate-400">Recently shared with collaborators</p>
      </header>

      {files.length === 0 ? (
        <div className="p-5">
          <EmptySharedState />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th scope="col" className="px-4 py-3 font-medium">
                    File Name
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
                    Shared With
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">
                    Share Date
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Expiry Date
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <SharedFileRow key={file.id} file={file} onCopyLink={onCopyLink} onRevoke={onRevoke} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 lg:hidden">
            {files.map((file) => (
              <article key={file.id} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-slate-100">{file.fileName}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.sharedWith} · Expires {file.expiryDate}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[file.status]}`}>
                    {file.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onCopyLink(file.id, file.shareLink)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-slate-800"
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    onClick={() => onRevoke(file.id)}
                    disabled={file.status !== 'active'}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-slate-800 disabled:opacity-40"
                  >
                    Revoke
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function EmptySharedState() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-200">No shared files</h3>
      <p className="mt-2 text-sm text-slate-400">Share a file to collaborate with your team.</p>
    </div>
  );
}
