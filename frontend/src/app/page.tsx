"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Shield, Eye, TrendingUp, CheckCircle2, ArrowRight, Star, Users, IndianRupee } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { fmtINR, progress } from '@/lib/utils';

// Static impact numbers (could be fetched from API)
const STATS = [
  { label: 'Campaigns Funded',  value: '2,400+',  icon: Heart },
  { label: 'Donors',            value: '18,000+', icon: Users },
  { label: 'Total Raised',      value: '₹9.2 Cr', icon: IndianRupee },
  { label: 'Success Rate',      value: '94%',     icon: TrendingUp },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Patient Creates Campaign', desc: 'Upload medical records, hospital estimates, and tell your story. Our team ensures every detail is in order.' },
  { step: '02', title: 'NGO Verifies Documents',   desc: 'Partner NGOs independently verify every campaign before it goes live — no fakes, ever.' },
  { step: '03', title: 'Donors Give Confidently',  desc: 'Secure Razorpay payments. Anonymous donations available. Full receipts issued instantly.' },
  { step: '04', title: 'Track Every Rupee',        desc: 'Hospital receipts, medicine bills, surgery costs — all uploaded and visible to every donor.' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Donor', text: 'First time I\'ve donated online and actually seen my money reach the patient. The expense receipts gave me complete confidence.', stars: 5 },
  { name: 'Rajan Mehta',  role: 'Patient', text: 'MedTrust helped us raise funds for my daughter\'s heart surgery within 3 weeks. The NGO verification made donors trust us immediately.', stars: 5 },
  { name: 'Dr. Aisha K.', role: 'NGO Partner', text: 'The verification system is thorough yet fast. We\'ve vetted 200+ campaigns and the fraud detection tools are excellent.', stars: 5 },
];

type LiveCampaign = {
  id: number;
  slug?: string;
  title: string;
  hospital_name: string;
  target_amount: number;
  collected_amount: number;
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
};

export default function HomePage() {
  const [liveCampaign, setLiveCampaign] = useState<LiveCampaign | null>(null);

  useEffect(() => {
    let active = true;

    const fetchLiveCampaign = async () => {
      try {
        const { data } = await api.get('/campaigns', {
          params: { status: 'verified', limit: 1, page: 1, sort: 'urgency' },
        });
        if (!active) return;
        setLiveCampaign(data?.data?.[0] || null);
      } catch {
        if (!active) return;
        setLiveCampaign(null);
      }
    };

    fetchLiveCampaign();
    const id = window.setInterval(fetchLiveCampaign, 30000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const livePct = liveCampaign
    ? progress(Number(liveCampaign.collected_amount), Number(liveCampaign.target_amount))
    : 77;

  const urgencyLabel = liveCampaign
    ? liveCampaign.urgency_level.charAt(0).toUpperCase() + liveCampaign.urgency_level.slice(1)
    : 'Critical';

  const urgencyBadgeClass = liveCampaign?.urgency_level === 'critical'
    ? 'bg-red-500/20 text-red-300 border-red-500/30'
    : liveCampaign?.urgency_level === 'high'
      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      : liveCampaign?.urgency_level === 'medium'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-brand-900 to-teal-900">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02]" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              100% transparent medical fundraising
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Every Rupee
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-teal-300">
                Accounted For
              </span>
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl">
              MedTrust connects patients who need medical funding with donors who demand transparency.
              NGO-verified campaigns, real-time expense tracking, and zero ambiguity.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/campaigns" className="btn-primary px-8 py-4 text-base shadow-2xl shadow-brand-500/30">
                Browse Campaigns <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register?role=patient" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white text-base font-semibold hover:bg-white/10 transition-all">
                Start a Campaign
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 mt-10">
              {[
                { icon: Shield,     text: 'NGO Verified' },
                { icon: Eye,        text: 'Full Transparency' },
                { icon: CheckCircle2, text: 'Secure Payments' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/60 text-sm">
                  <Icon className="w-4 h-4 text-teal-400" /> {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating card preview */}
          <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Live Campaign</span>
                  <span className={`badge ${urgencyBadgeClass}`}>🔴 {urgencyLabel}</span>
                </div>
                <h3 className="text-white font-display font-bold text-xl mb-1">
                  {liveCampaign?.title || 'Cardiac Surgery for Arjun, 8'}
                </h3>
                <p className="text-white/50 text-sm mb-5">
                  {liveCampaign?.hospital_name || 'AIIMS New Delhi'} · Verified Campaign
                </p>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-white/70">
                      Raised:{' '}
                      <strong className="text-white">
                        {liveCampaign ? fmtINR(Number(liveCampaign.collected_amount)) : '₹3,84,500'}
                      </strong>
                    </span>
                    <span className="text-teal-300 font-semibold">{livePct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10">
                    <div className="h-3 rounded-full bg-gradient-to-r from-brand-400 to-teal-400 transition-all" style={{ width: `${livePct}%` }} />
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">
                    Goal: {liveCampaign ? fmtINR(Number(liveCampaign.target_amount)) : '₹5,00,000'}
                  </p>
                </div>

                {/* Expense preview */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-white/40 text-xs uppercase tracking-wider">Recent Expenses</p>
                  {[
                    { label: 'Pre-op Tests',    amt: '₹18,400', date: 'Jan 12' },
                    { label: 'Angioplasty',     amt: '₹1,42,000', date: 'Jan 18' },
                    { label: 'ICU — 4 days',    amt: '₹96,000', date: 'Jan 22' },
                  ].map((e) => (
                    <div key={e.label} className="flex justify-between items-center bg-white/5 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-white text-xs font-medium">{e.label}</p>
                        <p className="text-white/40 text-xs">{e.date}</p>
                      </div>
                      <span className="text-teal-300 text-xs font-bold">{e.amt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating donor count */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#f43f5e','#0ea5e9','#14b8a6','#f59e0b'].map((c) => (
                    <div key={c} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: c }} />
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">342 donors</p>
                  <p className="text-xs text-slate-400">backed this</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-brand-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-500" />
              </div>
              <div className="font-display text-3xl font-bold text-slate-900">{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-brand-500 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="section-title mt-2">How MedTrust Works</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="card p-6 relative overflow-hidden">
                <div className="font-display text-6xl font-bold text-slate-100 absolute -top-2 -right-2 select-none">
                  {step.step}
                </div>
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-teal-500 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="section-title mt-2">Stories of Trust</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of donors who give with confidence. Every donation is tracked. Every rupee accounted for.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/campaigns" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-600 font-bold text-base hover:bg-slate-50 transition-colors shadow-xl">
              Browse Campaigns <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register?role=patient" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 text-white font-bold text-base hover:bg-white/10 transition-colors">
              Start Fundraising
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-display font-bold text-white">MedTrust</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} MedTrust. Transparent medical fundraising for India.</p>
            <div className="flex gap-4 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
