import Navbar from '@/components/layout/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-14">
        <div className="card p-8 md:p-10 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-sm text-slate-500 mt-2">Last updated: March 14, 2026</p>
          </div>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Platform Use</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              By using MedTrust, you agree to provide accurate information and not misuse donation or verification workflows.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Campaign Responsibility</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Campaign creators are responsible for truthful medical details, proper fund usage, and timely update/expense records.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Donations</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Donations are processed via third-party payment services. MedTrust records transaction status and verification events.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Enforcement</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              We may suspend accounts or campaigns for fraud risks, policy abuse, or legal non-compliance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
