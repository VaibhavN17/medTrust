import Navbar from '@/components/layout/Navbar';

const STEPS = [
  {
    title: 'Campaign Creation',
    detail:
      'Patients create campaigns with treatment details, hospital information, and supporting documents.',
  },
  {
    title: 'Verification Queue',
    detail:
      'NGO/Admin reviewers validate records and either approve or reject submissions with notes.',
  },
  {
    title: 'Secure Donations',
    detail:
      'Donors contribute through Razorpay and receive payment verification plus donation records.',
  },
  {
    title: 'Usage Transparency',
    detail:
      'Campaign owners upload expenses and updates so supporters can track treatment progress.',
  },
  {
    title: 'Governance & Safety',
    detail:
      'Fraud flags and moderation actions allow suspicious campaigns to be reviewed and controlled quickly.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-14">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900">How MedTrust Works</h1>
          <p className="text-slate-600 mt-2">
            A transparent flow from campaign request to verified donations and expense tracking.
          </p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card p-6 flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">{step.title}</h2>
                <p className="text-sm text-slate-600 mt-1.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
