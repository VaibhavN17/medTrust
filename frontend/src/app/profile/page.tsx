'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  KeyRound,
  Upload,
  ShieldCheck,
  Mail,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, fetchMe } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        await fetchMe();
        const { data } = await api.get('/auth/me');
        if (!active) return;

        setProfile({ name: data.name || '', phone: data.phone || '' });
        setEmail(data.email || '');
        setRole(data.role || '');
        setIsVerified(Boolean(data.is_verified));
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
          return;
        }
        toast.error(err.response?.data?.message || 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasName = Boolean(profile.name.trim());
    const hasPhone = Boolean(profile.phone.trim());
    if (!hasName && !hasPhone && !avatar) {
      toast.error('Nothing to update');
      return;
    }

    setSavingProfile(true);
    try {
      const formData = new FormData();
      if (hasName) formData.append('name', profile.name.trim());
      if (hasPhone) formData.append('phone', profile.phone.trim());
      if (avatar) formData.append('avatar', avatar);

      await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchMe();
      toast.success('Profile updated');
      setAvatar(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account details and security settings.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold mb-4">
              {(user?.name || profile.name || 'U').charAt(0).toUpperCase()}
            </div>

            <h2 className="font-display text-xl font-bold text-slate-900">{user?.name || profile.name || 'User'}</h2>
            <p className="text-sm text-slate-500 mt-1">{email || 'No email'}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" /> {email || 'Not available'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" /> {profile.phone || 'Phone not set'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="w-4 h-4 text-teal-500" /> {isVerified ? 'Verified account' : 'Verification pending'}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className={cn('badge', 'bg-slate-100 text-slate-700 border-slate-200')}>
                Role: {role || 'user'}
              </span>
            </div>
          </div>

          <div className="card p-6 lg:col-span-2">
            <h3 className="font-display text-xl font-bold text-slate-900 mb-4">Update Profile</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="label">Avatar (optional)</label>
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-500">{avatar ? avatar.name : 'Upload profile photo (JPG/PNG/WEBP)'}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Profile</>}
              </button>
            </form>
          </div>
        </div>

        <div className="card p-6 mt-6">
          <h3 className="font-display text-xl font-bold text-slate-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                minLength={8}
                required
              />
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                minLength={8}
                required
              />
            </div>

            <div className="md:col-span-3">
              <button type="submit" disabled={savingPassword} className="btn-outline">
                {savingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : <><KeyRound className="w-4 h-4" /> Update Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
