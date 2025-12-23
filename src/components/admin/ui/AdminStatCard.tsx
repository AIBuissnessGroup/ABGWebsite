'use client';
import type { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  icon?: ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'neutral';
}

const ACCENT_STYLES: Record<NonNullable<AdminStatCardProps['accent']>, string> = {
  primary: 'text-blue-600 bg-blue-50',
  success: 'text-emerald-600 bg-emerald-50',
  warning: 'text-amber-600 bg-amber-50',
  neutral: 'text-gray-600 bg-gray-100',
};

export default function AdminStatCard({
  label,
  value,
  subtext,
  icon,
  accent = 'primary',
}: AdminStatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${ACCENT_STYLES[accent]}`}>{icon}</span>}
      </div>
      <div className="text-3xl font-semibold text-gray-900">{value}</div>
      {subtext && <div className="text-sm text-gray-500">{subtext}</div>}
    </div>
  );
}
