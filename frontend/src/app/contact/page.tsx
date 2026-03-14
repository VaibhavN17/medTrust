import Navbar from '@/components/layout/Navbar';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-14">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-8">
            <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">Contact Us</h1>
            <p className="text-sm text-slate-600">
              For account support, campaign verification questions, or fraud reporting, contact our support team.
            </p>

            <div className="space-y-3 mt-6 text-sm">
              <p><span className="font-semibold text-slate-900">Email:</span> support@medtrust.in</p>
              <p><span className="font-semibold text-slate-900">Operations:</span> Mon-Sat, 9:00 AM - 7:00 PM IST</p>
              <p><span className="font-semibold text-slate-900">Escalations:</span> admin@medtrust.in</p>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Quick Support Tips</h2>
            <ul className="space-y-2 text-sm text-slate-600 list-disc pl-5">
              <li>Include your registered email in all support requests.</li>
              <li>Mention the campaign ID/slug for campaign-specific issues.</li>
              <li>Attach screenshots or transaction IDs for payment concerns.</li>
              <li>Use the fraud flag workflow for urgent campaign concerns.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
