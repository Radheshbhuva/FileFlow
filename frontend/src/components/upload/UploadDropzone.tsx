import { useState, useRef } from 'react';
import { uploadService } from '../../services/uploadService';
import { UploadCloud, File, FolderOpen, ArrowDown } from 'lucide-react';

export default function UploadDropzone() {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadService.selectFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleBrowseTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadService.selectFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input value
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`rounded-2xl border border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
        dragActive
          ? 'border-sky-500 bg-sky-500/5 scale-[0.99] shadow-soft'
          : 'border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20'
      }`}
      onClick={handleBrowseTrigger}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center space-y-4 py-4 max-w-md mx-auto">
        <div className={`rounded-2xl border p-4 transition duration-200 ${
          dragActive ? 'bg-sky-500/10 border-sky-500/30 scale-105' : 'bg-slate-950 border-slate-850'
        }`}>
          {dragActive ? (
            <ArrowDown className="h-8 w-8 text-sky-400 animate-bounce" />
          ) : (
            <UploadCloud className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div className="space-y-1.5 select-none">
          <p className="text-sm font-bold text-slate-200">
            {dragActive ? 'Drop files to stage ingestion' : 'Drag & drop files here or browse'}
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            Ingest multiple documents, spreadsheets, images, or archives simultaneously. Stage security scanning before files enter production S3 buckets.
          </p>
        </div>

        {/* Browse options */}
        <div className="flex flex-wrap gap-2 justify-center pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleBrowseTrigger}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 transition"
          >
            <File className="h-3.5 w-3.5" />
            Choose Files
          </button>
          
          <button
            type="button"
            onClick={() => alert('Folder Ingestion with webkitdirectory placeholder. Comming soon!')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed transition"
            title="Folder Ingestion integration coming soon"
            disabled
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Upload Directory
          </button>
        </div>

        <div className="pt-2 text-[10px] text-slate-600 font-medium select-none">
          Supports PDF, ZIP, PNG, XLSX, YAML, TXT (Max 100 MB per file)
        </div>
      </div>
    </div>
  );
}
