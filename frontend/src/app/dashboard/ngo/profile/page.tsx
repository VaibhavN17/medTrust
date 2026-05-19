'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { ArrowLeft, Upload } from 'lucide-react';

interface NGOProfile {
  id: number;
  user_id: number;
  org_name: string;
  registration_no?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  verified_at?: string;
}

export default function NGOProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    org_name: '',
    registration_no: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('mt_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const { data } = await api.get('/ngo/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setProfile(data);
        setFormData({
          org_name: data.org_name || '',
          registration_no: data.registration_no || '',
          website: data.website || '',
          description: data.description || '',
        });
      } catch (err) {
        console.error('Failed to fetch NGO profile:', err);
        setError('Failed to load NGO profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('mt_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('org_name', formData.org_name);
      formDataToSend.append('registration_no', formData.registration_no);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('description', formData.description);

      if (fileInputRef.current?.files?.[0]) {
        formDataToSend.append('logo', fileInputRef.current.files[0]);
      }

      const { data } = await api.put('/ngo/profile', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('NGO profile updated successfully');
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh profile
      const { data: updatedProfile } = await api.get('/ngo/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(updatedProfile);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading NGO profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">NGO profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="card p-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">NGO Profile</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {profile.verified_at && (
            <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg">
              <p className="text-brand-700 font-medium">✓ Your organization has been verified</p>
              <p className="text-brand-600 text-sm">Verified on {new Date(profile.verified_at).toLocaleDateString()}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">Organization Logo</label>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                  {logoPreview || profile.logo_url ? (
                    <img
                      src={logoPreview || profile.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs text-slate-500">No logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    PNG, JPG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label htmlFor="org_name" className="block text-sm font-semibold text-slate-900 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                id="org_name"
                name="org_name"
                value={formData.org_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Enter organization name"
                required
              />
            </div>

            {/* Registration Number */}
            <div>
              <label htmlFor="registration_no" className="block text-sm font-semibold text-slate-900 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                id="registration_no"
                name="registration_no"
                value={formData.registration_no}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g., NGO/2024/001"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-semibold text-slate-900 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
                Organization Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                placeholder="Tell us about your organization..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-slate-300 transition-colors font-semibold"
              >
                {submitting ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
