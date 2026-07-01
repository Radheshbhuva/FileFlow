import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useProfileStore } from '../../stores/profileStore';
import { useAuthStore } from '../../stores/authStore';
import { useActivityStore } from '../../stores/activityStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { profileService } from '../../services/profileService';
import apiClient from '../../services/api/apiClient';
import {
  Save,
  User,
  Mail,
  Shield,
  Award,
  Calendar,
  CheckCircle2,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  FileImage,
  RefreshCw,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  
  // Stores
  const { user, updateProfile: updateProfileStore, isLoading: isProfileLoading, setLoading: setProfileLoading } = useProfileStore();
  const { setAuthUser } = useAuthStore();
  const { logActivity } = useActivityStore();
  const { addNotification } = useNotificationsStore();

  // Local Form state
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [toast, setToast] = useState<string | null>(null);

  // Avatar Upload states
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
  }, [user.fullName, user.email]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // PASSWORD STRENGTH ANALYSIS
  const checkPasswordRequirements = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[@$!%*?&]/.test(pwd),
    };
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Empty', score: 0, color: 'bg-slate-800' };
    const reqs = checkPasswordRequirements(pwd);
    const score = Object.values(reqs).filter(Boolean).length;
    
    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', score, color: 'bg-rose-500' };
      case 2:
        return { label: 'Fair', score, color: 'bg-amber-500' };
      case 3:
        return { label: 'Good', score, color: 'bg-sky-500' };
      case 4:
        return { label: 'Strong', score, color: 'bg-indigo-500' };
      case 5:
        return { label: 'Very Strong', score, color: 'bg-emerald-500' };
      default:
        return { label: 'Weak', score: 0, color: 'bg-slate-800' };
    }
  };

  const reqs = checkPasswordRequirements(newPassword);
  const strength = getPasswordStrength(newPassword);

  // TANSTACK MUTATIONS
  const saveProfileMutation = useMutation({
    mutationFn: (dto: { fullName: string }) => profileService.updateProfile(dto),
    onSuccess: (updatedUser) => {
      // Sync stores
      updateProfileStore(updatedUser);
      setAuthUser(updatedUser);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['activityList'] });

      // Event Activity & Notification
      logActivity('profile', `Updated account configuration details (Name: ${updatedUser.fullName})`);
      addNotification(`Your profile details were updated.`, 'profile');
      showToastMsg('Profile details updated successfully!');
    },
    onError: (err: any) => {
      showToastMsg(err.response?.data?.message || 'Failed to update profile.');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (dto: typeof passwordDto) => profileService.changePassword(dto),
    onSuccess: () => {
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      
      // Event log & alert notification
      logActivity('settings', 'Security credentials modification: Password successfully changed');
      addNotification('Your workspace account password has been updated.', 'security');
      showToastMsg('Password changed successfully!');
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Incorrect credentials or verification failure.';
      setPasswordError(errMsg);
    }
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatarUrl: string) => profileService.updateAvatar(avatarUrl),
    onSuccess: (updatedUser) => {
      updateProfileStore(updatedUser);
      setAuthUser(updatedUser);
      
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['activityList'] });

      logActivity('profile', 'Avatar image updated successfully');
      addNotification('Avatar picture updated.', 'profile');
      
      // Reset upload state
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(null);
      showToastMsg('Avatar picture updated successfully!');
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.message || 'Failed to persist avatar.');
      setUploadProgress(null);
    }
  });

  const passwordDto = {
    currentPassword,
    newPassword,
    confirmPassword
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.length < 2) {
      showToastMsg('Full Name must be at least 2 characters.');
      return;
    }
    saveProfileMutation.mutate({ fullName });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Current Password is required.');
      return;
    }
    if (strength.score < 5) {
      setPasswordError('New password does not meet security requirements.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password cannot be identical to current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Confirm Password does not match.');
      return;
    }

    changePasswordMutation.mutate(passwordDto);
  };

  // AVATAR FILE UPLOADING LOGIC
  const processAvatarFile = (file: File) => {
    setUploadError(null);
    
    // Type validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload PNG, JPG, JPEG or WEBP.');
      return;
    }

    // Size validation (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds max size threshold (10 MB).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAvatarFile(e.target.files[0]);
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const startAvatarUpload = async () => {
    if (!selectedFile) return;
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 1. Get presigned upload URL from backend
      const presignedRes = await apiClient.post('/uploads/presigned-url', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        uploadMethod: 'STANDARD'
      });

      const { uploadUrl, objectKey } = presignedRes.data.data;

      // 2. Perform direct PUT upload to S3 / Mock S3
      await axios.put(uploadUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || selectedFile.size;
          const pct = Math.min(99, Math.round((progressEvent.loaded / total) * 100));
          setUploadProgress(pct);
        }
      });

      setUploadProgress(100);

      // 3. Resolve public GET URL
      // If it contains localhost/mock-s3, the download path is direct mock-s3.
      // Otherwise, we split the query params of S3 to obtain the direct bucket URL.
      let finalAvatarUrl = '';
      if (uploadUrl.includes('mock-s3') || uploadUrl.includes('localhost')) {
        finalAvatarUrl = `http://localhost:5000/api/v1/storage/mock-s3/${objectKey}`;
      } else {
        finalAvatarUrl = uploadUrl.split('?')[0];
      }

      // 4. Save avatar URL back to the profile model
      await updateAvatarMutation.mutateAsync(finalAvatarUrl);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.message || 'S3 Upload operation failed. Please try again.');
      setUploadProgress(null);
    }
  };

  const removeAvatar = async () => {
    setProfileLoading(true);
    try {
      // Remove avatar by passing an empty string to backend
      const updatedUser = await profileService.updateAvatar('');
      updateProfileStore(updatedUser);
      setAuthUser(updatedUser);

      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['activityList'] });

      logActivity('profile', 'Removed user profile avatar picture');
      addNotification('Profile avatar removed.', 'profile');
      setSelectedFile(null);
      setPreviewUrl(null);
      showToastMsg('Avatar picture removed.');
    } catch (err: any) {
      showToastMsg(err.response?.data?.message || 'Failed to remove avatar.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <DashboardLayout pageTitle="Profile Settings">
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 rounded-xl border border-sky-500/30 bg-slate-900 px-4 py-3 text-sm text-sky-400 shadow-soft flex items-center gap-2 animate-in fade-in duration-300"
        >
          <CheckCircle2 className="h-4.5 w-4.5 text-sky-400" />
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {/* AVATAR UPLOAD AND SUMMARY CONTAINER */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center text-center relative overflow-hidden">
              {/* Avatar Image / Initials card */}
              <div className="relative group h-24 w-24 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                {previewUrl || user.avatar ? (
                  <img
                    src={previewUrl || user.avatar}
                    alt={user.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-sky-400">
                    {user.avatarInitials}
                  </span>
                )}
                {/* Hover overlay upload icon */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition duration-150"
                >
                  <Upload className="h-5 w-5 text-sky-400" />
                  <span className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Change</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />

              <h2 className="mt-4 text-base font-bold text-slate-100">{user.fullName}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>

              {/* Upload Controls & progress bar */}
              {selectedFile && (
                <div className="w-full mt-4 p-3 border border-slate-850 rounded-xl bg-slate-950/40 space-y-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-semibold truncate max-w-[120px]" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  {uploadProgress !== null ? (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={startAvatarUpload}
                        className="flex-1 rounded-lg bg-sky-500 hover:bg-sky-400 py-1.5 text-[10px] font-bold text-white transition"
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Drag and Drop Zone */}
              {!selectedFile && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`mt-4 w-full border border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition duration-150 ${
                    dragActive ? 'border-sky-500 bg-sky-500/5' : 'border-slate-850 hover:border-slate-700 bg-slate-950/20'
                  }`}
                >
                  <FileImage className={`h-6 w-6 mb-1.5 ${dragActive ? 'text-sky-400' : 'text-slate-600'}`} />
                  <span className="text-[10px] text-slate-400">
                    Drag avatar here or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sky-400 hover:underline font-semibold"
                    >
                      Browse
                    </button>
                  </span>
                  <span className="text-[8px] text-slate-550 mt-1">PNG, JPG, JPEG or WEBP (Max 10MB)</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-3 flex items-start gap-1.5 text-[10px] text-rose-455 border border-rose-500/10 bg-rose-500/5 p-2 rounded-xl text-left w-full">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {user.avatar && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={isProfileLoading}
                  className="mt-4 inline-flex items-center gap-1 text-[10px] text-rose-455 hover:text-rose-400 font-bold transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Current Avatar
                </button>
              )}

              {/* Billing Plan Info */}
              <div className="mt-6 pt-6 border-t border-slate-850 w-full text-left space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-slate-400" /> Plan
                  </span>
                  <span className="font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {user.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" /> Created
                  </span>
                  <span className="text-slate-300 font-medium">{user.accountCreated}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-slate-400" /> Compliance
                  </span>
                  <span className="text-slate-300 font-medium">Standard Encryption</span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT DETAILS AND PASSWORD FORMS CONTAINER */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Settings form */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-sky-400" />
                Account Details
              </h3>

              <form onSubmit={handleProfileSave} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-medium text-slate-400">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-slate-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-550" />
                    <input
                      id="email"
                      type="email"
                      disabled
                      value={email}
                      className="w-full rounded-xl border border-slate-850 bg-slate-950/40 py-2.5 pl-10 pr-3 text-sm text-slate-500 focus:outline-none cursor-not-allowed"
                      title="Primary email key cannot be altered."
                    />
                  </div>
                  <span className="text-[10px] text-slate-550 flex items-center gap-1 mt-1">
                    <Globe className="h-3 w-3 text-slate-550" /> Identity coordinates managed via IAM directory
                  </span>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveProfileMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-soft transition disabled:opacity-50"
                  >
                    {saveProfileMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* SECURITY CREDENTIALS / CHANGE PASSWORD CARD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400" />
                Change Account Password
              </h3>

              <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                {passwordError && (
                  <div className="flex items-start gap-2 text-xs text-rose-455 border border-rose-500/10 bg-rose-500/5 p-3 rounded-xl">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-start gap-2 text-xs text-emerald-400 border border-emerald-500/10 bg-emerald-500/5 p-3 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-450 mt-0.5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="currentPassword" className="text-xs font-medium text-slate-400">
                    Current Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-700 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-xs font-medium text-slate-400">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-700 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="space-y-2 mt-2 p-3 rounded-xl border border-slate-850 bg-slate-950/30">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">Security Score</span>
                        <span className={`font-bold ${
                          strength.score >= 5 ? 'text-emerald-400' : strength.score >= 3 ? 'text-sky-400' : 'text-rose-455'
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-full flex-1 transition ${
                              i < strength.score ? strength.color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Password validation checklist requirements */}
                      <div className="grid grid-cols-2 gap-2 pt-1.5 text-[9px]">
                        <div className="flex items-center gap-1">
                          <span className={reqs.minLength ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            ✓
                          </span>
                          <span className={reqs.minLength ? 'text-slate-300 font-medium' : 'text-slate-550'}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={reqs.hasUpper ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            ✓
                          </span>
                          <span className={reqs.hasUpper ? 'text-slate-300 font-medium' : 'text-slate-550'}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={reqs.hasLower ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            ✓
                          </span>
                          <span className={reqs.hasLower ? 'text-slate-300 font-medium' : 'text-slate-550'}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={reqs.hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            ✓
                          </span>
                          <span className={reqs.hasNumber ? 'text-slate-300 font-medium' : 'text-slate-550'}>
                            One number
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={reqs.hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            ✓
                          </span>
                          <span className={reqs.hasSpecial ? 'text-slate-300 font-medium' : 'text-slate-550'}>
                            One special character (@$!%*?&)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-slate-400">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-700 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-2 text-sm font-semibold text-white shadow-soft transition disabled:opacity-50"
                  >
                    {changePasswordMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
