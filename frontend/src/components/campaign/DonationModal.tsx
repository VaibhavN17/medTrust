'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Heart, Shield, X, IndianRupee, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/store';
import { fmtINR } from '@/lib/utils';

interface Props {
  campaignId: number;
  campaignTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [1, 500, 1000, 2000, 5000, 10000];

declare global {
  interface Window { Razorpay: any; }
}

export default function DonationModal({ campaignId, campaignTitle, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [amount,      setAmount]      = useState('');
  const [custom,      setCustom]      = useState(false);
  const [anonymous,   setAnonymous]   = useState(false);
  const [message,     setMessage]     = useState('');
  const [loading,     setLoading]     = useState(false);

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleDonate = async () => {
    if (!user) { toast.error('Please login to donate'); return; }
    const amt = Number(amount);
    if (!amt || amt < 1) { toast.error('Minimum donation amount is Rs 1'); return; }

    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      // Create order on backend
      const { data: order } = await api.post('/donations/order', {
        campaign_id: campaignId,
        amount: amt,
        is_anonymous: anonymous,
        message: message || undefined,
      });

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        'MedTrust',
        description: `Donation for: ${campaignTitle}`,
        order_id:    order.order_id,
        prefill: {
          name:  user.name,
          email: user.email,
        },
        theme: { color: '#0ea5e9' },
        handler: async (response: any) => {
          try {
            await api.post('/donations/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            toast.success(`Thank you! ${fmtINR(amt)} donated 💙`);
            onSuccess?.();
            onClose();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 relative animate-fade-up">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Heart className="w-5 h-5 text-brand-500 fill-brand-100" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Make a Donation</h2>
            <p className="text-xs text-slate-500 line-clamp-1">{campaignTitle}</p>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="mb-4">
          <label className="label">Select Amount</label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => { setAmount(String(a)); setCustom(false); }}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                  ${amount === String(a) && !custom
                    ? 'border-brand-500 bg-brand-50 text-brand-600'
                    : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
              >
                {fmtINR(a)}
              </button>
            ))}
            <button
              onClick={() => { setCustom(true); setAmount(''); }}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                ${custom
                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                  : 'border-slate-200 text-slate-600 hover:border-brand-300'
                }`}
            >
              Custom
            </button>
          </div>

          {custom && (
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount (min Rs 1)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input pl-9"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="label">Message (optional)</label>
          <textarea
            rows={2}
            placeholder="Leave an encouraging message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input resize-none"
            maxLength={200}
          />
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
          <div
            onClick={() => setAnonymous(!anonymous)}
            className={`w-10 h-5 rounded-full transition-colors relative ${anonymous ? 'bg-brand-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${anonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-slate-600">Donate anonymously</span>
        </label>

        {/* Donate button */}
        <button onClick={handleDonate} disabled={loading || !amount} className="btn-primary w-full text-base py-3.5">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            : <><Heart className="w-4 h-4" /> Donate {amount ? fmtINR(Number(amount)) : 'Now'}</>
          }
        </button>

        {/* Security note */}
        <p className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5" /> Secured by Razorpay · 100% transparent
        </p>
      </div>
    </div>
  );
}
