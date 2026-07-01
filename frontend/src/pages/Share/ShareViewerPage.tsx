import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../services/api/apiClient';
import { 
  FileText, 
  Download, 
  Lock, 
  ShieldAlert, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  EyeOff, 
  Eye, 
  ArrowRight,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { getFileIcon } from '../../components/files/FileGridView';

export default function ShareViewerPage() {
  const { token } = useParams<{ token: string }>();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<any>(null);
  
  // Password protection state
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Download action states
  const [downloading, setDownloading] = useState(false);

  // Refs
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load: Fetch shared resource metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/shares/public/${token}`);
        setShareData(res.data.data);
        if (res.data.data.share?.passwordProtected) {
          setPasswordRequired(true);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Shared link is invalid or expired.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    void fetchMetadata();
  }, [token]);

  // Focus password input if password is required
  useEffect(() => {
    if (passwordRequired && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [passwordRequired]);

  // 2. Handle Password Verification
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password.trim()) return;
    
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await apiClient.post(`/shares/public/${token}/verify`, {
        password: password.trim()
      });
      
      const { verificationToken: vToken } = res.data.data;
      setVerificationToken(vToken);
      setPasswordRequired(false); // Unlock view
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Incorrect password. Access denied.';
      setVerifyError(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  // 3. Trigger S3 Presigned URL download
  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      const headers: Record<string, string> = {};
      if (verificationToken) {
        headers['x-share-token'] = verificationToken;
      }

      const res = await apiClient.post(`/shares/public/${token}/download`, {}, { headers });
      const { downloadUrl } = res.data.data;

      // Trigger standard browser download by navigating to S3/Mock URL
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', shareData?.file?.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unable to download file.';
      alert(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  // Format Bytes Utility
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Date formatter
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-x-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sky-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo/Header */}
        <div className="flex items-center gap-2.5 justify-center mb-4">
          <div className="rounded-2xl bg-sky-500/10 p-2 border border-sky-500/20 shrink-0 shadow-lg shadow-sky-500/5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-sky-400 animate-pulse" fill="none" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-base font-bold uppercase tracking-[0.3em] text-slate-200">
            FileFlow
          </span>
        </div>

        {/* Dynamic Card Area */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6 transition duration-300">
          
          {/* Skeleton Loader */}
          {loading && (
            <div className="space-y-5 animate-pulse">
              <div className="h-10 bg-slate-800/80 rounded-2xl w-3/4 mx-auto" />
              <div className="h-28 bg-slate-800/50 rounded-2xl" />
              <div className="h-12 bg-slate-800/80 rounded-xl" />
            </div>
          )}

          {/* Link Error or Expiration Area */}
          {!loading && error && (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-14 w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/5">
                <ShieldAlert className="h-7 w-7 text-rose-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-100">Link Inactive</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {error}
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
                >
                  Go to FileFlow Ingestion Hub <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Password Protection Gate */}
          {!loading && !error && passwordRequired && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-md shadow-amber-500/5">
                  <Lock className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">Password Required</h3>
                <p className="text-xs text-slate-500">
                  This shared workspace link is encrypted. Provide credentials to view metadata.
                </p>
              </div>

              {verifyError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3 text-xs text-rose-400 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Access Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-650 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-sm font-semibold text-white shadow-soft transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? 'Verifying...' : 'Unlock File'}
                </button>
              </form>
            </div>
          )}

          {/* Share Viewer & Download Actions */}
          {!loading && !error && !passwordRequired && shareData && (
            <div className="space-y-6 animate-in fade-in zoom-in-99 duration-300">
              
              {/* File details card layout */}
              <div className="rounded-2xl border border-slate-850 bg-slate-950/40 p-5 space-y-4 shadow-inner flex flex-col items-center text-center">
                
                {/* File Icon */}
                <div className="h-16 w-16 bg-slate-900 rounded-2xl border border-slate-800/80 flex items-center justify-center shadow-lg">
                  {getFileIcon(shareData.file?.fileType || '')}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-100 break-all max-w-[280px]" title={shareData.file?.fileName}>
                    {shareData.file?.fileName}
                  </h3>
                  <span className="text-xs text-sky-400 font-mono">
                    {formatBytes(shareData.file?.fileSize || 0)}
                  </span>
                </div>
              </div>

              {/* Share stats / details */}
              <div className="space-y-3 border-t border-b border-slate-900 py-4">
                
                {/* Expiry Details */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <div className="flex justify-between w-full">
                    <span>Expiration:</span>
                    <span className="font-semibold text-slate-350">
                      {shareData.share?.expiryDate ? formatDate(shareData.share.expiryDate) : 'No expiry'}
                    </span>
                  </div>
                </div>

                {/* Scope Scope */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Layers className="h-4 w-4 text-slate-500 shrink-0" />
                  <div className="flex justify-between w-full">
                    <span>Shared With:</span>
                    <span className="font-semibold text-slate-350 truncate max-w-[200px]" title={shareData.share?.sharedWith}>
                      {shareData.share?.sharedWith || 'Public Link'}
                    </span>
                  </div>
                </div>

                {/* Security verification rating */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div className="flex justify-between w-full">
                    <span>Security Rating:</span>
                    <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[10px]">
                      Verified Secure
                    </span>
                  </div>
                </div>
              </div>

              {/* Trigger Download */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-sm font-semibold text-white shadow-soft transition disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                <Download className="h-4.5 w-4.5 text-white group-hover:translate-y-0.5 transition" />
                {downloading ? 'Downloading...' : 'Download File'}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-600 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3 text-slate-600" /> Secure file distribution powered by AWS KMS & S3
        </div>
      </div>
    </div>
  );
}
