import Navbar from '@/components/layout/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-14">
        <div className="card p-8 md:p-10">
          <p className="text-brand-500 font-semibold text-sm uppercase tracking-wider mb-2">About MedTrust</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Transparent Medical Fundraising, Built for Trust
          </h1>
          <p className="text-slate-600 leading-relaxed">
            MedTrust was created to solve one core problem: donors want to help, but they need confidence that funds are genuine and properly used.
            We connect patients, NGOs, and donors through a transparent system with verification, receipt tracking, and real-time updates.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-6">
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Verified Campaigns</h2>
            <p className="text-sm text-slate-600">
              Every campaign goes through NGO/admin review before it can receive donations.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Transparent Expenses</h2>
            <p className="text-sm text-slate-600">
              Patients upload expense receipts so contributors can see how funds are spent.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Accountable Workflow</h2>
            <p className="text-sm text-slate-600">
              Fraud flags, moderation tools, and auditable actions keep the ecosystem reliable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
