import type { RecentUpload } from '../../types/dashboard';

const statusStyles: Record<RecentUpload['status'], string> = {
  ready: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  processing: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  failed: 'bg-rose-500/10 text-rose-300 ring-rose-400/20'
};

interface FileUploadRowProps {
  file: RecentUpload;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function FileUploadRow({ file, onDownload, onShare, onViewDetails }: FileUploadRowProps) {
  return (
    <tr className="border-b border-slate-800/60 last:border-b-0">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800/80 text-sky-300" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-sm font-medium text-slate-100">{file.fileName}</span>
        </div>
      </td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-400 sm:table-cell">{file.type}</td>
      <td className="px-4 py-3.5 text-sm text-slate-400">{file.size}</td>
      <td className="hidden px-4 py-3.5 text-sm text-slate-400 md:table-cell">{file.uploadDate}</td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[file.status]}`}>
          {file.status}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onDownload(file.id)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label={`Download ${file.fileName}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M12 3v12m0 0 4-4m-4 4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onShare(file.id)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label={`Share ${file.fileName}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(file.id)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label={`View details for ${file.fileName}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

interface RecentUploadsTableProps {
  uploads: RecentUpload[];
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export default function RecentUploadsTable({
  uploads,
  onDownload,
  onShare,
  onViewDetails
}: RecentUploadsTableProps) {
  return (
    <section aria-labelledby="recent-uploads-heading" className="rounded-2xl border border-slate-800/90 bg-slate-900/50 shadow-soft">
      <header className="border-b border-slate-800/80 px-5 py-4">
        <h2 id="recent-uploads-heading" className="text-base font-semibold text-slate-100">
          Recent Uploads
        </h2>
        <p className="mt-1 text-sm text-slate-400">Your latest files</p>
      </header>

      {uploads.length === 0 ? (
        <div className="p-5">
          <EmptyUploadsState />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th scope="col" className="px-4 py-3 font-medium">
                    File Name
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Size
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">
                    Upload Date
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
                {uploads.map((file) => (
                  <FileUploadRow
                    key={file.id}
                    file={file}
                    onDownload={onDownload}
                    onShare={onShare}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {uploads.map((file) => (
              <article key={file.id} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-slate-100">{file.fileName}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {file.type} · {file.size} · {file.uploadDate}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[file.status]}`}>
                    {file.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDownload(file.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => onShare(file.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewDetails(file.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Details
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

function EmptyUploadsState() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
          <path
            d="M12 16V4m-4 4 4-4 4 4M4 20h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-200">No uploads yet</h3>
      <p className="mt-2 text-sm text-slate-400">Upload your first file to get started.</p>
    </div>
  );
}
