'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, TrendingUp, Receipt, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/lib/store';
import api from '@/lib/api';
import { fmtINR, fmtDate, fmtRelative } from '@/lib/utils';

export default function DonorDashboard() {
  const { user, fetchMe } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMe();
    api.get('/donations/mine').then(({ data }) => {
      setDonations(data);
      setTotal(data.reduce((s: number, d: any) => s + Number(d.amount), 0));
    }).finally(() => setLoading(false));
  }, []);

  const downloadReceipt = async (donationId: number) => {
    setDownloadingId(donationId);
    try {
      const { data } = await api.get(`/donations/${donationId}/receipt`);
      const lines = [
        'MEDTRUST DONATION RECEIPT',
        '-------------------------',
        `Receipt No: ${data.receipt_no}`,
        `Donation ID: ${data.id}`,
        `Issued At: ${new Date(data.issued_at).toLocaleString('en-IN')}`,
        '',
        'Donor Details',
        `Name: ${data.donor_name}`,
        `Email: ${data.donor_email}`,
        '',
        'Donation Details',
        `Campaign: ${data.campaign_title}`,
        `Amount: ${fmtINR(Number(data.amount))}`,
        `Currency: ${data.currency}`,
        `Paid On: ${fmtDate(data.created_at)}`,
        `Payment Status: ${data.payment_status}`,
        `Razorpay Payment ID: ${data.razorpay_payment_id || 'N/A'}`,
        `Razorpay Order ID: ${data.razorpay_order_id || 'N/A'}`,
        '',
        'Thank you for supporting transparent medical fundraising.',
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = `${data.receipt_no}.txt`;
      a.click();
      URL.revokeObjectURL(fileUrl);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">My Donations</h1>
            <p className="text-slate-500 mt-1">Track your contributions and see the impact{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</p>
          </div>
          <Link href="/campaigns" className="btn-primary">
            <Heart className="w-4 h-4" /> Browse Campaigns
          </Link>
        </div>

        {/* Impact card */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-brand-600 to-teal-600 text-white">
          <p className="text-white/70 text-sm mb-1">Total Impact</p>
          <p className="font-display text-4xl font-bold">{fmtINR(total)}</p>
          <p className="text-white/60 text-sm mt-1">across {donations.length} campaign{donations.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2 mt-4 text-white/80 text-sm">
            <TrendingUp className="w-4 h-4" /> Your donations are changing lives
          </div>
        </div>

        {/* Donations list */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-brand-500 animate-spin" /></div>
        ) : donations.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h2 className="font-display text-xl font-bold text-slate-600 mb-2">No donations yet</h2>
            <p className="text-slate-400 mb-6">Start making a difference today</p>
            <Link href="/campaigns" className="btn-primary inline-flex">Find a Campaign</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((d) => {
              const campaignRouteKey = d.campaign_slug || d.campaign_id;
              return (
                <div key={d.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Campaign cover thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-100 to-teal-100 flex-shrink-0 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-brand-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{d.campaign_title}</h3>
                    <p className="text-xs text-brand-500 uppercase tracking-wider mt-0.5">{d.disease}</p>
                    <p className="text-xs text-slate-400 mt-1">{fmtRelative(d.created_at)}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-xl font-bold text-teal-600">{fmtINR(d.amount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(d.created_at)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Receipt: {d.payment_receipt_id || 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Link to campaign */}
                <Link
                  href={`/campaigns/${campaignRouteKey}`}
                  className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-700 mt-3 pt-3 border-t border-slate-50 font-medium transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" /> View expense receipts & campaign updates
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>

                <button
                  onClick={() => downloadReceipt(Number(d.id))}
                  disabled={downloadingId === d.id}
                  className="mt-2 text-xs font-medium text-slate-600 hover:text-brand-600 transition-colors disabled:opacity-60"
                >
                  {downloadingId === d.id ? 'Preparing receipt...' : 'Download payment receipt'}
                </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
