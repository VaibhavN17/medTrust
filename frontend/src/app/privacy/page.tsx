import Navbar from '@/components/layout/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-14">
        <div className="card p-8 md:p-10 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mt-2">Last updated: March 14, 2026</p>
          </div>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">What We Collect</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              We collect account details, campaign information, donation records, and uploaded documents needed to verify and operate the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">How We Use Data</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Data is used for authentication, campaign verification, donation processing, fraud prevention, and legal compliance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Data Security</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              We apply role-based access control, authentication checks, payment signature verification, and secure file storage practices.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Your Rights</h2>
            <p className="text-sm text-slate-600 mt-1.5">
              You may request profile updates, account deactivation support, and clarification of stored data through the contact channel.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
