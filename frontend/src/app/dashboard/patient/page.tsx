'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, TrendingUp, FileUp, AlertCircle, CheckCircle2, Clock, Loader2, Upload, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { cn, fmtINR, fmtDate, fmtRelative, progress, statusColor } from '@/lib/utils';

export default function PatientDashboard() {
  const { user, fetchMe } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<any>(null);
  const [expenses,  setExpenses]  = useState<any[]>([]);
  const [updates,   setUpdates]   = useState<any[]>([]);
  const [expForm,   setExpForm]   = useState({ description: '', expense_type: 'hospital_bill', amount: '', spent_on: '' });
  const [receipt,   setReceipt]   = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: '', content: '' });
  const [updateImage, setUpdateImage] = useState<File | null>(null);
  const [postingUpdate, setPostingUpdate] = useState(false);

  useEffect(() => {
    fetchMe();
    api.get('/campaigns/mine').then(({ data }) => {
      setCampaigns(data);
      if (data.length) {
        setSelected(data[0]);
        loadCampaignData(data[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const loadCampaignData = async (id: number) => {
    try {
      const [{ data: expenseData }, { data: campaignData }] = await Promise.all([
        api.get(`/campaigns/${id}/expenses`),
        api.get(`/campaigns/${id}`),
      ]);

      setExpenses(expenseData.expenses || []);
      setUpdates(campaignData.updates || []);
    } catch {
      toast.error('Failed to load campaign details');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      Object.entries(expForm).forEach(([k, v]) => form.append(k, v));
      if (receipt) form.append('receipt', receipt);

      await api.post(`/campaigns/${selected.id}/expenses`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Expense recorded successfully');
      setExpForm({ description: '', expense_type: 'hospital_bill', amount: '', spent_on: '' });
      setReceipt(null);
      loadCampaignData(selected.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    if (!updateForm.content.trim()) {
      toast.error('Update content is required');
      return;
    }

    setPostingUpdate(true);
    try {
      const form = new FormData();
      form.append('title', updateForm.title);
      form.append('content', updateForm.content);
      if (updateImage) form.append('image', updateImage);

      await api.post(`/campaigns/${selected.id}/updates`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Campaign update posted');
      setUpdateForm({ title: '', content: '' });
      setUpdateImage(null);
      loadCampaignData(selected.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post update');
    } finally {
      setPostingUpdate(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Patient Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome, {user?.name || 'Patient'}</p>
          </div>
          <Link href="/campaigns/new" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> New Campaign
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
        ) : campaigns.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🏥</div>
            <h2 className="font-display text-xl font-bold text-slate-700 mb-2">No campaigns yet</h2>
            <p className="text-slate-400 mb-6">Create your first fundraising campaign to get started</p>
            <Link href="/campaigns/new" className="btn-primary inline-flex">Create Campaign</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Campaign list */}
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider px-1">Your Campaigns</h2>
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); loadCampaignData(c.id); }}
                  className={cn('w-full text-left card p-4 transition-all', selected?.id === c.id ? 'ring-2 ring-brand-400' : 'hover:shadow-md')}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{c.title}</h3>
                    <span className={cn('badge flex-shrink-0', statusColor[c.status])}>{c.status}</span>
                  </div>
                  <div className="progress-bar mb-1">
                    <div className="progress-fill" style={{ width: `${progress(c.collected_amount, c.target_amount)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{fmtINR(c.collected_amount)} raised</span>
                    <span>{progress(c.collected_amount, c.target_amount)}%</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Campaign detail */}
            {selected && (
              <div className="lg:col-span-2 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Raised',   value: fmtINR(selected.collected_amount),  icon: TrendingUp,    color: 'text-teal-600' },
                    { label: 'Goal',     value: fmtINR(selected.target_amount),      icon: AlertCircle,   color: 'text-brand-600' },
                    { label: 'Progress', value: `${progress(selected.collected_amount, selected.target_amount)}%`, icon: CheckCircle2, color: 'text-amber-600' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card p-4 text-center">
                      <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
                      <p className="font-bold text-slate-900 text-lg">{value}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Status guidance */}
                {selected.status === 'pending' && (
                  <div className="card p-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-800 text-sm">Awaiting Verification</p>
                      <p className="text-yellow-600 text-xs">Our NGO partners are reviewing your documents. This usually takes 24–48 hours.</p>
                    </div>
                  </div>
                )}
                {selected.status === 'rejected' && (
                  <div className="card p-4 flex items-center gap-3 bg-red-50 border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Campaign Rejected</p>
                      <p className="text-red-500 text-xs">{selected.rejection_reason || 'Please contact support for details.'}</p>
                    </div>
                  </div>
                )}

                {/* Post campaign update */}
                {!['rejected', 'suspended'].includes(selected.status) && (
                  <div className="card p-6">
                    <h3 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-brand-500" /> Post Campaign Update
                    </h3>
                    <form onSubmit={handlePostUpdate} className="space-y-4">
                      <div>
                        <label className="label">Title (optional)</label>
                        <input
                          className="input"
                          placeholder="e.g. Surgery completed successfully"
                          value={updateForm.title}
                          onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label">Update Details</label>
                        <textarea
                          rows={3}
                          className="input resize-none"
                          placeholder="Share progress, next steps, or gratitude for donors"
                          value={updateForm.content}
                          onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Image (optional)</label>
                        <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-500">{updateImage ? updateImage.name : 'Attach progress photo or report image'}</span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            className="hidden"
                            onChange={(e) => setUpdateImage(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      <button type="submit" disabled={postingUpdate} className="btn-primary">
                        {postingUpdate ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : 'Post Update'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Upload expense (only if verified) */}
                {(selected.status === 'verified' || selected.status === 'completed') && (
                  <div className="card p-6">
                    <h3 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <FileUp className="w-5 h-5 text-brand-500" /> Upload Expense Receipt
                    </h3>
                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Description</label>
                        {/* Campaign updates */}
                        <div className="card p-6">
                          <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Recent Updates</h3>
                          {updates.length === 0 ? (
                            <p className="text-slate-400 text-sm">No updates posted yet.</p>
                          ) : (
                            <div className="space-y-4">
                              {updates.slice(0, 6).map((u: any) => (
                                <div key={u.id} className="border-l-2 border-brand-200 pl-4">
                                  {u.title && <p className="font-medium text-slate-800 text-sm">{u.title}</p>}
                                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{u.content}</p>
                                  <p className="text-xs text-slate-400 mt-1.5">{fmtRelative(u.created_at)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                          <input className="input" placeholder="e.g. Chemotherapy session 2" value={expForm.description}
                            onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} required />
                        </div>
                        <div>
                          <label className="label">Expense Type</label>
                          <select className="input" value={expForm.expense_type}
                            onChange={(e) => setExpForm({ ...expForm, expense_type: e.target.value })}>
                            <option value="hospital_bill">Hospital Bill</option>
                            <option value="medicine">Medicine</option>
                            <option value="surgery">Surgery</option>
                            <option value="consultation">Consultation</option>
                            <option value="tests">Tests / Scans</option>
                            <option value="transport">Transport</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">Amount (₹)</label>
                          <input type="number" min="1" className="input" placeholder="Amount in rupees" value={expForm.amount}
                            onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} required />
                        </div>
                        <div>
                          <label className="label">Date Spent</label>
                          <input type="date" className="input" value={expForm.spent_on}
                            onChange={(e) => setExpForm({ ...expForm, spent_on: e.target.value })} required />
                        </div>
                      </div>
                      <div>
                        <label className="label">Receipt (PDF/Image)</label>
                        <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-500">{receipt ? receipt.name : 'Click to upload receipt'}</span>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                            onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <>Submit Expense</>}
                      </button>
                    </form>
                  </div>
                )}

                {/* Expense history */}
                <div className="card p-6">
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Expense History</h3>
                  {expenses.length === 0 ? (
                    <p className="text-slate-400 text-sm">No expenses uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm">
                          <div>
                            <p className="font-medium text-slate-800">{e.description}</p>
                            <p className="text-xs text-slate-400 capitalize">{e.expense_type.replace('_',' ')} · {fmtDate(e.spent_on)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">{fmtINR(e.amount)}</p>
                            {e.receipt_url && <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:underline">Receipt</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
