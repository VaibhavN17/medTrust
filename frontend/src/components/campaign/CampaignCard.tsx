import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, AlertCircle } from 'lucide-react';
import { cn, fmtINR, fmtDate, progress, urgencyColor } from '@/lib/utils';

interface Campaign {
  id: number;
  slug?: string;
  title: string;
  disease: string;
  hospital_name: string;
  hospital_city?: string;
  target_amount: number;
  collected_amount: number;
  urgency_level: string;
  cover_image_url?: string;
  treatment_deadline?: string;
  patient_name: string;
}

export default function CampaignCard({ c }: { c: Campaign }) {
  const pct = progress(c.collected_amount, c.target_amount);
  const campaignPath = `/campaigns/${c.slug || c.id}`;

  return (
    <Link href={campaignPath} className="card block overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
      {/* Cover image */}
      <div className="relative h-44 bg-gradient-to-br from-brand-100 to-teal-100 overflow-hidden">
        {c.cover_image_url ? (
          <Image src={c.cover_image_url} alt={c.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-display text-brand-200">{c.disease[0]}</div>
          </div>
        )}
        {/* Urgency badge */}
        <span className={cn('badge absolute top-3 left-3', urgencyColor[c.urgency_level])}>
          <AlertCircle className="w-3 h-3" />
          {c.urgency_level.charAt(0).toUpperCase() + c.urgency_level.slice(1)}
        </span>
      </div>

      <div className="p-5">
        {/* Disease tag */}
        <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">{c.disease}</span>

        {/* Title */}
        <h3 className="font-display font-bold text-lg text-slate-900 mt-1 mb-2 line-clamp-2 leading-snug">
          {c.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap gap-2.5 mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {c.hospital_city || c.hospital_name}
          </span>
          {c.treatment_deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {fmtDate(c.treatment_deadline)}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="progress-bar mb-1.5">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <span className="font-bold text-slate-900">{fmtINR(c.collected_amount)}</span>
            <span className="text-slate-400 ml-1">raised</span>
          </div>
          <span className="font-semibold text-brand-600">{pct}%</span>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
          <span className="text-xs text-slate-500">by {c.patient_name}</span>
          <span className="text-xs text-slate-400">Goal: {fmtINR(c.target_amount)}</span>
        </div>
      </div>
    </Link>
  );
}
