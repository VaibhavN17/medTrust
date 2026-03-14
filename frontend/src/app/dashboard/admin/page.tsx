'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldX,
  UserCog,
  FolderKanban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/lib/store';
import { fmtINR, fmtDate, cn, statusColor } from '@/lib/utils';

type Tab = 'overview' | 'pending' | 'fraud' | 'users' | 'campaigns';

const USER_ROLE_FILTERS = ['all', 'patient', 'donor', 'ngo', 'admin'];
const CAMPAIGN_STATUS_FILTERS = ['all', 'pending', 'verified', 'rejected', 'completed', 'suspended', 'draft'];

export default function AdminDashboard() {
  const { user, fetchMe } = useAuth();

  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [roleFilter, setRoleFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');

  useEffect(() => {
    let active = true;
    fetchMe().finally(() => {
      if (active) setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authChecked || !user) return;
    if (!['admin', 'ngo'].includes(user.role)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        if (user.role === 'admin') {
          const [s, p, f, u, c] = await Promise.all([
            api.get('/admin/stats'),
            api.get('/ngo/pending'),
            api.get('/admin/fraud-flags'),
            api.get('/admin/users', { params: { limit: 200 } }),
            api.get('/admin/campaigns', { params: { limit: 200 } }),
          ]);

          if (cancelled) return;
          setStats(s.data);
          setPending(p.data || []);
          setFlags(f.data || []);
          setUsers(u.data?.data || []);
          setCampaigns(c.data?.data || []);
          setTab('overview');
          return;
        }

        const { data } = await api.get('/ngo/pending');
        if (cancelled) return;
        setPending(data || []);
        setTab('pending');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [authChecked, user?.id, user?.role]);

  const verifyCampaign = async (id: number) => {
    setBusyId(id);
    try {
      await api.post(`/ngo/verify/${id}`, { notes: 'Verified from dashboard' });
      toast.success('Campaign verified');
      setPending((prev) => prev.filter((c) => c.id !== id));
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'verified' } : c)));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify campaign');
    } finally {
      setBusyId(null);
    }
  };

  const rejectCampaign = async (id: number) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;

    setBusyId(id);
    try {
      await api.post(`/ngo/reject/${id}`, { reason });
      toast.success('Campaign rejected');
      setPending((prev) => prev.filter((c) => c.id !== id));
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c)));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setBusyId(null);
    }
  };

  const updateFlagStatus = async (id: number, status: 'investigating' | 'resolved' | 'dismissed') => {
    setBusyId(id);
    try {
      await api.put(`/admin/fraud-flags/${id}`, { status });
      toast.success('Fraud flag updated');
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update fraud flag');
    } finally {
      setBusyId(null);
    }
  };

  const toggleUser = async (id: number) => {
    setBusyId(id);
    try {
      await api.put(`/admin/users/${id}/toggle`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)));
      toast.success('User status updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setBusyId(null);
    }
  };

  const filteredUsers = useMemo(
    () => users.filter((u) => roleFilter === 'all' || u.role === roleFilter),
    [users, roleFilter]
  );

  const filteredCampaigns = useMemo(
    () => campaigns.filter((c) => campaignFilter === 'all' || c.status === campaignFilter),
    [campaigns, campaignFilter]
  );

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'ngo'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24">
          <div className="card p-10 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold text-slate-800">Access denied</h2>
            <p className="text-slate-500 mt-2">This dashboard is available only for admin and NGO accounts.</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  const STAT_CARDS = stats
    ? [
        { label: 'Total Donated', value: fmtINR(stats.totals.total_donated), icon: TrendingUp, color: 'bg-teal-50 text-teal-600' },
        { label: 'Active Campaigns', value: stats.totals.active_campaigns, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
        { label: 'Pending Approval', value: stats.totals.pending_campaigns, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
        { label: 'Total Users', value: stats.totals.total_users, icon: Users, color: 'bg-brand-50 text-brand-600' },
        { label: 'Fraud Flags Open', value: stats.totals.open_fraud_flags, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
        { label: 'NGO Partners', value: stats.totals.ngo_count, icon: Shield, color: 'bg-slate-50 text-slate-600' },
      ]
    : [];

  const tabs: Array<{ key: Tab; label: string }> = isAdmin
    ? [
        { key: 'overview', label: 'Overview' },
        { key: 'pending', label: `Pending (${pending.length})` },
        { key: 'fraud', label: `Fraud (${flags.length})` },
        { key: 'users', label: `Users (${users.length})` },
        { key: 'campaigns', label: `Campaigns (${campaigns.length})` },
      ]
    : [{ key: 'pending', label: `Pending (${pending.length})` }];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
            {isAdmin ? 'Admin Dashboard' : 'NGO Verification Dashboard'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin
              ? 'Manage campaigns, users, fraud reports, and platform metrics'
              : 'Review pending campaigns and complete verification actions'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          </div>
        ) : (
          <>
            {isAdmin && stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card p-4 text-center">
                    <div className={cn('w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center', color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-xl text-slate-900">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-200 w-fit overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    tab === t.key ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && isAdmin && stats && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Recent Donations</h3>
                  <div className="space-y-3">
                    {stats.recentDonations.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{d.donor}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[220px]">{d.campaign}</p>
                        </div>
                        <span className="font-bold text-teal-600">{fmtINR(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Top Campaigns</h3>
                  <div className="space-y-3">
                    {stats.topCampaigns.map((c: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <Link href={`/campaigns/${c.slug || c.id}`} className="font-medium text-slate-800 hover:text-brand-600 truncate max-w-[220px]">
                            {c.title}
                          </Link>
                          <span className="text-slate-500 text-xs">{fmtINR(c.collected_amount)}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(100, (c.collected_amount / c.target_amount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'pending' && (
              <div className="space-y-4">
                {pending.length === 0 && (
                  <div className="card p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                    <h3 className="font-display text-lg font-bold text-slate-700">All clear</h3>
                    <p className="text-slate-400 text-sm">No campaigns pending verification</p>
                  </div>
                )}

                {pending.map((c) => (
                  <div key={c.id} className="card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{c.title}</h3>
                          <span className="badge bg-orange-100 text-orange-700 border-orange-200 flex-shrink-0">{c.urgency_level}</span>
                        </div>
                        <p className="text-sm text-slate-500">{c.disease} · {c.hospital_name}</p>
                        <p className="text-xs text-slate-400 mt-1">Patient: {c.patient_name} · {fmtDate(c.created_at)}</p>
                        <p className="text-sm font-semibold text-brand-600 mt-1">Goal: {fmtINR(c.target_amount)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/campaigns/${c.id}`} className="btn-outline py-2 px-4 text-sm">View</Link>
                        <button
                          onClick={() => verifyCampaign(c.id)}
                          disabled={busyId === c.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-60"
                        >
                          {busyId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          Verify
                        </button>
                        <button
                          onClick={() => rejectCampaign(c.id)}
                          disabled={busyId === c.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-60"
                        >
                          <ShieldX className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'fraud' && isAdmin && (
              <div className="space-y-4">
                {flags.length === 0 && (
                  <div className="card p-12 text-center">
                    <Shield className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                    <h3 className="font-display text-lg font-bold text-slate-700">No open fraud flags</h3>
                    <p className="text-slate-400 text-sm">The platform is currently clean</p>
                  </div>
                )}

                {flags.map((f) => (
                  <div key={f.id} className="card p-5 border-l-4 border-red-400">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">{f.campaign_title}</h3>
                        <p className="text-sm text-slate-500 mt-1">Reported by: {f.reporter || 'System'}</p>
                        <p className="text-sm text-red-600 mt-1 font-medium">{f.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateFlagStatus(f.id, 'investigating')}
                          disabled={busyId === f.id}
                          className="btn-outline py-2 px-3 text-xs"
                        >
                          Investigate
                        </button>
                        <button
                          onClick={() => updateFlagStatus(f.id, 'dismissed')}
                          disabled={busyId === f.id}
                          className="btn-outline py-2 px-3 text-xs"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => updateFlagStatus(f.id, 'resolved')}
                          disabled={busyId === f.id}
                          className="btn-primary py-2 px-3 text-xs"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'users' && isAdmin && (
              <div className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-brand-500" /> User Management
                  </h3>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input w-auto py-2 text-sm"
                  >
                    {USER_ROLE_FILTERS.map((r) => (
                      <option key={r} value={r}>
                        {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-sm text-slate-500">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="badge bg-slate-100 text-slate-700 border-slate-200">{u.role}</span>
                          <span className={cn('badge', u.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200')}>
                            {u.is_active ? 'active' : 'disabled'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleUser(u.id)}
                        disabled={busyId === u.id || u.id === user.id}
                        className="btn-outline py-2 px-4 text-sm disabled:opacity-50"
                      >
                        {u.id === user.id ? 'Current User' : u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'campaigns' && isAdmin && (
              <div className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-brand-500" /> Campaign Management
                  </h3>
                  <select
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value)}
                    className="input w-auto py-2 text-sm"
                  >
                    {CAMPAIGN_STATUS_FILTERS.map((s) => (
                      <option key={s} value={s}>
                        {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredCampaigns.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                          <p className="text-sm text-slate-500">{c.disease} · {c.hospital_name}</p>
                          <p className="text-xs text-slate-400 mt-1">Patient: {c.patient_name} · Created: {fmtDate(c.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn('badge', statusColor[c.status] || 'bg-slate-100 text-slate-700')}>{c.status}</span>
                          <p className="text-xs text-slate-500 mt-2">{fmtINR(c.collected_amount)} / {fmtINR(c.target_amount)}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link href={`/campaigns/${c.id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                          Open Campaign →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
