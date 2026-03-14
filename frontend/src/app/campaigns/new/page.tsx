'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';

const STEPS = ['Basic Info', 'Medical Details', 'Documents', 'Review'];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', disease: '', description: '', hospital_name: '',
    hospital_city: '', hospital_state: '', target_amount: '',
    treatment_deadline: '', urgency_level: 'medium',
  });
  const [cover,  setCover]  = useState<File | null>(null);
  const [docs,   setDocs]   = useState<File[]>([]);
  const [docType, setDocType] = useState('hospital_report');

  const handleSubmitCampaign = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (cover) fd.append('cover_image', cover);

      const { data } = await api.post('/campaigns', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCreatedId(data.id);

      // Upload documents if any
      if (docs.length > 0) {
        const docFd = new FormData();
        docs.forEach((f) => docFd.append('documents', f));
        docFd.append('document_type', docType);
        await api.post(`/campaigns/${data.id}/documents`, docFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Campaign submitted for review! ✅');
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const f = form;
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <Link href="/dashboard/patient" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">Create Fundraising Campaign</h1>
        <p className="text-slate-500 text-sm mb-8">Fill in details about your medical situation. Our NGO partners will verify everything.</p>

        {/* Steps */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${i < step ? 'text-teal-600' : i === step ? 'text-brand-600 bg-brand-50' : 'text-slate-400'}`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">{i+1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="card p-6 md:p-8">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Campaign Basics</h2>
              <div>
                <label className="label">Campaign Title *</label>
                <input className="input" placeholder='e.g. "Help Rohan fight kidney failure"'
                  value={f.title} onChange={(e) => set('title', e.target.value)} required />
              </div>
              <div>
                <label className="label">Disease / Condition *</label>
                <input className="input" placeholder="e.g. Kidney Failure, Cancer, Heart Disease"
                  value={f.disease} onChange={(e) => set('disease', e.target.value)} required />
              </div>
              <div>
                <label className="label">Your Story *</label>
                <textarea rows={5} className="input resize-none" placeholder="Tell donors about the patient, diagnosis, treatment needed, and why this campaign matters…"
                  value={f.description} onChange={(e) => set('description', e.target.value)} required minLength={50} />
                <p className="text-xs text-slate-400 mt-1">{f.description.length}/50 min characters</p>
              </div>
              <div>
                <label className="label">Urgency Level</label>
                <select className="input" value={f.urgency_level} onChange={(e) => set('urgency_level', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical — Immediate treatment needed</option>
                </select>
              </div>
              <div>
                <label className="label">Cover Image (optional)</label>
                <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">{cover ? cover.name : 'Upload a photo of the patient or hospital'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setCover(e.target.files?.[0] || null)} />
                </label>
              </div>
              <button onClick={() => setStep(1)} disabled={!f.title || !f.disease || f.description.length < 50} className="btn-primary w-full mt-2 disabled:opacity-50">
                Continue →
              </button>
            </div>
          )}

          {/* Step 1: Medical Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Medical & Financial Details</h2>
              <div>
                <label className="label">Hospital Name *</label>
                <input className="input" placeholder="e.g. AIIMS New Delhi" value={f.hospital_name} onChange={(e) => set('hospital_name', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input className="input" placeholder="New Delhi" value={f.hospital_city} onChange={(e) => set('hospital_city', e.target.value)} />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" placeholder="Delhi" value={f.hospital_state} onChange={(e) => set('hospital_state', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Target Amount (₹) *</label>
                <input type="number" min="100" className="input" placeholder="e.g. 500000" value={f.target_amount} onChange={(e) => set('target_amount', e.target.value)} required />
                <p className="text-xs text-slate-400 mt-1">Set a realistic goal based on your hospital estimate</p>
              </div>
              <div>
                <label className="label">Treatment Deadline</label>
                <input type="date" className="input" value={f.treatment_deadline} onChange={(e) => set('treatment_deadline', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline flex-1">← Back</button>
                <button onClick={() => setStep(2)} disabled={!f.hospital_name || !f.target_amount} className="btn-primary flex-1 disabled:opacity-50">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-2">Upload Documents</h2>
              <p className="text-sm text-slate-500 mb-4">Upload medical proof to help NGOs verify your campaign faster. Accepted: PDF, JPG, PNG (max 15 MB each).</p>
              <div>
                <label className="label">Document Type</label>
                <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="hospital_report">Hospital Report</option>
                  <option value="treatment_estimate">Treatment Estimate</option>
                  <option value="identity_proof">Identity Proof</option>
                  <option value="prescription">Prescription</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-300 cursor-pointer transition-colors bg-slate-50">
                <Upload className="w-8 h-8 text-brand-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">Click to upload documents</span>
                <span className="text-xs text-slate-400 mt-1">Multiple files supported</span>
                {docs.length > 0 && (
                  <div className="mt-3 space-y-1 w-full text-left">
                    {docs.map((f, i) => <p key={i} className="text-xs text-teal-600 font-medium truncate">✓ {f.name}</p>)}
                  </div>
                )}
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => setDocs(Array.from(e.target.files || []))} />
              </label>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Review →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review / Success */}
          {step === 3 && !createdId && (
            <div className="animate-fade-in">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-4">Review & Submit</h2>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between"><span className="text-slate-500">Title</span><span className="font-medium text-slate-800 text-right max-w-xs truncate">{f.title}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Disease</span><span className="font-medium text-slate-800">{f.disease}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Hospital</span><span className="font-medium text-slate-800">{f.hospital_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Goal</span><span className="font-medium text-slate-800">₹{Number(f.target_amount).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Urgency</span><span className="font-medium text-slate-800 capitalize">{f.urgency_level}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Documents</span><span className="font-medium text-slate-800">{docs.length} file(s)</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-outline flex-1">← Edit</button>
                <button onClick={handleSubmitCampaign} disabled={loading} className="btn-primary flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Campaign'}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 3 && createdId && (
            <div className="text-center animate-fade-in py-6">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Campaign Submitted!</h2>
              <p className="text-slate-500 mb-6">Our NGO partners will review and verify your campaign within 24–48 hours. You'll receive an email once it goes live.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/patient" className="btn-outline">Go to Dashboard</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
