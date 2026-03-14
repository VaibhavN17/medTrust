'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import CampaignCard from '@/components/campaign/CampaignCard';
import api from '@/lib/api';

const DISEASES    = ['Cancer', 'Kidney', 'Heart', 'Liver', 'Bone Marrow', 'Accident', 'Neurological', 'Other'];
const URGENCIES   = ['critical', 'high', 'medium', 'low'];
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Latest' },
  { value: 'urgency',    label: 'Most Urgent' },
  { value: 'progress',   label: 'Near Goal' },
  { value: 'deadline',   label: 'Deadline Soon' },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);

  const [search,  setSearch]  = useState('');
  const [disease, setDisease] = useState('');
  const [urgency, setUrgency] = useState('');
  const [sort,    setSort]    = useState('created_at');
  const [showFilters, setShowFilters] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12, sort };
      if (search)  params.search  = search;
      if (disease) params.disease = disease;
      if (urgency) params.urgency = urgency;

      const { data } = await api.get('/campaigns', { params });
      setCampaigns(data.data);
      setTotal(data.total);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, disease, urgency, sort]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const clearFilters = () => {
    setDisease(''); setUrgency(''); setSearch(''); setSort('created_at'); setPage(1);
  };
  const hasFilters = search || disease || urgency || sort !== 'created_at';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Browse Campaigns</h1>
          <p className="text-slate-500">Support verified medical fundraisers. Every donation is tracked transparently.</p>

          {/* Search bar */}
          <div className="flex gap-3 mt-6">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by disease, hospital, patient name…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-10 pr-4"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all
                ${showFilters ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm text-coral-500 hover:bg-coral-50 transition-colors">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 animate-fade-in">
              {/* Disease */}
              <div>
                <label className="label">Disease Type</label>
                <div className="flex flex-wrap gap-2">
                  {DISEASES.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setDisease(disease === d ? '' : d); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                        ${disease === d ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="label">Urgency</label>
                <div className="flex gap-2">
                  {URGENCIES.map((u) => (
                    <button
                      key={u}
                      onClick={() => { setUrgency(urgency === u ? '' : u); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all
                        ${urgency === u ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="label">Sort By</label>
                <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input w-auto py-1.5 text-sm">
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-xl font-bold text-slate-700">No campaigns found</h3>
            <p className="text-slate-400 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-700">{campaigns.length}</span> of <span className="font-semibold">{total}</span> campaigns
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {campaigns.map((c) => <CampaignCard key={c.id} c={c} />)}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-outline py-2 px-5 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-sm text-slate-600">
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / 12)}
                  className="btn-primary py-2 px-5 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
