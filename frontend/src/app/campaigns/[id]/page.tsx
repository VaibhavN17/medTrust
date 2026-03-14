'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Shield, FileText, Heart, AlertCircle, Calendar, Building2, Receipt, MessageSquare, Users, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import DonationModal from '@/components/campaign/DonationModal';
import api from '@/lib/api';
import { cn, fmtINR, fmtDate, fmtRelative, progress, urgencyColor, statusColor } from '@/lib/utils';

export default function CampaignDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'story'|'expenses'|'updates'|'donors'>('story');
  const [showModal, setShowModal] = useState(false);
  const [showDocs,  setShowDocs]  = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/campaigns/${id}`);
      setCampaign(data);
    } catch (err: any) {
      setCampaign(null);
      if (err.response?.status && err.response.status !== 404) {
        toast.error(err.response?.data?.message || 'Failed to load campaign details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Navbar />
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mt-20" />
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
      <Navbar />
      <div className="text-center"><h2 className="font-display text-2xl font-bold">Campaign not found</h2></div>
    </div>
  );

  const pct = progress(campaign.collected_amount, campaign.target_amount);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cover image */}
            <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-100 to-teal-100">
              {campaign.cover_image_url ? (
                <Image src={campaign.cover_image_url} alt={campaign.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-8xl text-brand-200">{campaign.disease[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <span className={cn('badge', urgencyColor[campaign.urgency_level])}>
                  <AlertCircle className="w-3 h-3" /> {campaign.urgency_level}
                </span>
                <span className={cn('badge', statusColor[campaign.status])}>{campaign.status}</span>
              </div>
            </div>

            {/* Title + meta */}
            <div className="card p-6">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">{campaign.disease}</span>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-1 mb-3">{campaign.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> {campaign.hospital_name}{campaign.hospital_city ? `, ${campaign.hospital_city}` : ''}
                </span>
                {campaign.treatment_deadline && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Deadline: {fmtDate(campaign.treatment_deadline)}
                  </span>
                )}
                {campaign.status === 'verified' && (
                  <span className="flex items-center gap-1.5 text-teal-600">
                    <Shield className="w-4 h-4 fill-teal-100" /> NGO Verified
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="card overflow-hidden">
              <div className="flex border-b border-slate-100 overflow-x-auto">
                {(['story','updates','expenses','donors'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'flex-shrink-0 px-5 py-3.5 text-sm font-semibold capitalize transition-colors',
                      tab === t ? 'text-brand-600 border-b-2 border-brand-500 -mb-px' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {t} {t === 'updates' && campaign.updates?.length ? `(${campaign.updates.length})` : ''}
                    {t === 'expenses' && campaign.expenses?.length ? `(${campaign.expenses.length})` : ''}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Story */}
                {tab === 'story' && (
                  <div>
                    <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                      {campaign.description}
                    </div>

                    {/* Documents */}
                    {campaign.documents?.length > 0 && (
                      <div className="mt-6">
                        <button onClick={() => setShowDocs(!showDocs)} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors">
                          <FileText className="w-4 h-4" /> Medical Documents ({campaign.documents.length})
                          <ChevronDown className={cn('w-4 h-4 transition-transform', showDocs && 'rotate-180')} />
                        </button>
                        {showDocs && (
                          <div className="mt-3 space-y-2 animate-fade-in">
                            {campaign.documents.map((doc: any) => (
                              <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-colors text-sm text-slate-700 group">
                                <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                                <span className="truncate">{doc.file_name || doc.document_type}</span>
                                <span className="ml-auto text-xs text-slate-400 group-hover:text-brand-500">View →</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Updates */}
                {tab === 'updates' && (
                  <div className="space-y-4">
                    {campaign.updates?.length === 0 && <p className="text-slate-400 text-sm">No updates yet.</p>}
                    {campaign.updates?.map((u: any) => (
                      <div key={u.id} className="border-l-2 border-brand-200 pl-4">
                        {u.title && <h4 className="font-semibold text-slate-800 mb-1">{u.title}</h4>}
                        <p className="text-sm text-slate-600 leading-relaxed">{u.content}</p>
                        <p className="text-xs text-slate-400 mt-1.5">{u.author_name} · {fmtRelative(u.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expenses */}
                {tab === 'expenses' && (
                  <div>
                    {campaign.expenses?.length === 0 && (
                      <p className="text-slate-400 text-sm">No expenses uploaded yet. Receipts will appear here once funds are used.</p>
                    )}
                    <div className="space-y-3">
                      {campaign.expenses?.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{e.description}</p>
                              <p className="text-xs text-slate-400 capitalize">{e.expense_type.replace('_',' ')} · {fmtDate(e.spent_on)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 text-sm">{fmtINR(e.amount)}</p>
                            {e.receipt_url && (
                              <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-brand-500 hover:underline">Receipt</a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Donors */}
                {tab === 'donors' && (
                  <div className="space-y-3">
                    {campaign.top_donors?.length === 0 && <p className="text-slate-400 text-sm">No donations yet.</p>}
                    {campaign.top_donors?.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {d.donor_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{d.donor_name}</p>
                          {d.message && <p className="text-xs text-slate-400 truncate">"{d.message}"</p>}
                        </div>
                        <span className="font-bold text-sm text-teal-600">{fmtINR(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            <div className="card p-6 sticky top-24">
              {/* Amounts */}
              <div className="mb-1">
                <span className="font-display text-3xl font-bold text-slate-900">{fmtINR(campaign.collected_amount)}</span>
                <span className="text-slate-400 text-sm ml-1">raised</span>
              </div>
              <p className="text-sm text-slate-500 mb-3">of {fmtINR(campaign.target_amount)} goal</p>

              <div className="progress-bar mb-2">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-sm mb-6">
                <span className="text-brand-600 font-semibold">{pct}% funded</span>
                {campaign.treatment_deadline && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {fmtDate(campaign.treatment_deadline)}
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowModal(true)}
                disabled={campaign.status !== 'verified'}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Heart className="w-4 h-4 fill-white" />
                {campaign.status === 'verified' ? 'Donate Now' : 'Campaign not active'}
              </button>

              {campaign.status !== 'verified' && (
                <p className="text-xs text-center text-slate-400 mt-2">This campaign is currently {campaign.status}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
                <div className="text-center">
                  <p className="font-bold text-slate-900">{campaign.top_donors?.length || 0}+</p>
                  <p className="text-xs text-slate-400">Donors</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">{campaign.expenses?.length || 0}</p>
                  <p className="text-xs text-slate-400">Expense Records</p>
                </div>
              </div>

              {/* Verified badge */}
              {campaign.status === 'verified' && (
                <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <Shield className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-teal-700">NGO Verified</p>
                    <p className="text-xs text-teal-500">Documents checked by partner NGO</p>
                  </div>
                </div>
              )}

              {/* Patient */}
              <div className="mt-4 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                  {campaign.patient_name?.[0] || 'P'}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Patient</p>
                  <p className="text-sm font-semibold text-slate-700">{campaign.patient_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <DonationModal
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          onClose={() => setShowModal(false)}
          onSuccess={fetch}
        />
      )}
    </div>
  );
}
