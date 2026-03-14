'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/lib/store';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'donor',   label: '💙 Donor',   desc: 'Support medical campaigns' },
  { value: 'patient', label: '🏥 Patient',  desc: 'Raise funds for treatment' },
  { value: 'ngo',     label: '🤝 NGO',      desc: 'Verify campaigns & manage funds' },
];

function RegisterPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setAuth }  = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: searchParams.get('role') || 'donor',
  });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setAuth(data.token, data.user);
      toast.success('Account created! Welcome 🎉');

      const dest =
        data.user.role === 'patient' ? '/dashboard/patient' :
        data.user.role === 'donor'   ? '/dashboard/donor' :
        '/dashboard/admin';
      router.push(dest);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-md">
            <Heart className="w-4.5 h-4.5 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-2xl text-slate-900">Med<span className="text-brand-500">Trust</span></span>
        </Link>

        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
          <p className="text-slate-500 text-sm mb-6">Join MedTrust and make a difference.</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map((r) => (
              <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                className={cn('p-3 rounded-xl border-2 text-center transition-all',
                  form.role === r.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300')}>
                <span className="block text-lg mb-0.5">{r.label.split(' ')[0]}</span>
                <span className={cn('text-xs font-semibold', form.role === r.value ? 'text-brand-700' : 'text-slate-600')}>
                  {r.label.split(' ')[1]}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" required className="input" placeholder="Your full name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input type="tel" className="input" placeholder="+91 98765 43210"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required minLength={8} className="input pr-10"
                  placeholder="Minimum 8 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-teal-50 flex items-center justify-center p-4">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
